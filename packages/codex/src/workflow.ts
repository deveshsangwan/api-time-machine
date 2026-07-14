import {
  ChangeProfileSchema,
  RepairProposalSchema,
  type ChangeProfile,
  type RepairProposal,
} from "@atm/contracts";

import { CodexWorkflowError, normalizeWorkflowError } from "./errors.js";
import { validateGroundedChange, validateRepairPolicy } from "./policy.js";
import type {
  CodexAdapter,
  CodexRunContext,
  CodexTask,
  CodexWorkflow,
  CodexWorkflowOptions,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 60_000;

export function createCodexWorkflow(
  adapter: CodexAdapter,
  options: CodexWorkflowOptions = {},
): CodexWorkflow {
  const maxAttempts = options.maxAttempts ?? 2;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? Date.now;

  async function execute<T>(input: {
    task: CodexTask;
    parse: (value: unknown) => T;
    validate: (value: T) => T;
  }): Promise<T> {
    let previousError: CodexRunContext["previousError"];
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const startedAt = now();
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;

      try {
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(
              new CodexWorkflowError(
                "timeout",
                `Codex task exceeded ${timeoutMs}ms`,
                { retryable: true },
              ),
            );
          }, timeoutMs);
        });

        const raw = await Promise.race([
          adapter.run(input.task, {
            attempt,
            maxAttempts,
            signal: controller.signal,
            previousError,
          }),
          timeout,
        ]);

        let parsed: T;
        try {
          parsed = input.parse(raw);
        } catch (error) {
          throw new CodexWorkflowError(
            "schema",
            "Codex returned malformed or incomplete structured output",
            { retryable: true, cause: error },
          );
        }

        const validated = input.validate(parsed);
        options.onAttempt?.({
          taskKind: input.task.kind,
          attempt,
          status: "succeeded",
          durationMs: Math.max(0, now() - startedAt),
          provider: adapter.consumeTelemetry?.(),
        });
        return validated;
      } catch (error) {
        const normalized = normalizeWorkflowError(error);
        options.onAttempt?.({
          taskKind: input.task.kind,
          attempt,
          status: "failed",
          durationMs: Math.max(0, now() - startedAt),
          errorCategory: normalized.category,
          provider: adapter.consumeTelemetry?.(),
        });

        if (!normalized.retryable || attempt === maxAttempts) throw normalized;
        previousError = {
          category: normalized.category,
          message: normalized.message,
        };
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    throw new CodexWorkflowError("adapter", "Codex workflow exhausted attempts");
  }

  return {
    analyzeChange(input) {
      const task: CodexTask = { kind: "analyze-change", ...input };
      return execute<ChangeProfile>({
        task,
        parse: (value) => ChangeProfileSchema.parse(value),
        validate: (value) => validateGroundedChange(input, value),
      });
    },
    proposeRepair(input) {
      const task: CodexTask = { kind: "propose-repair", ...input };
      return execute<RepairProposal>({
        task,
        parse: (value) => RepairProposalSchema.parse(value),
        validate: (value) => validateRepairPolicy(input, value),
      });
    },
  };
}
