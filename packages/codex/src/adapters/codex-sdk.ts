import {
  Codex,
  type ModelReasoningEffort,
  type ThreadOptions,
  type TurnOptions,
  type Usage,
} from "@openai/codex-sdk";

import { CodexWorkflowError } from "../errors.js";
import {
  CHANGE_PROFILE_JSON_SCHEMA,
  REPAIR_PROPOSAL_JSON_SCHEMA,
} from "../json-schemas.js";
import { buildCodexPrompt } from "../prompts.js";
import type {
  CodexAdapter,
  CodexRunContext,
  CodexTask,
  ProviderTelemetry,
} from "../types.js";

interface CodexTurnLike {
  readonly id: string | null;
  run(
    input: string,
    options?: TurnOptions,
  ): Promise<{ finalResponse: string; usage: Usage | null }>;
}

interface CodexClientLike {
  startThread(options?: ThreadOptions): CodexTurnLike;
}

export const API_TIME_MACHINE_CODEX_MODEL = "gpt-5.6-sol";
export const API_TIME_MACHINE_REASONING_EFFORT: ModelReasoningEffort = "medium";

export interface CodexSdkAdapterOptions {
  apiKey?: string;
  model?: string;
  workingDirectory?: string;
  modelReasoningEffort?: ModelReasoningEffort;
  codexPathOverride?: string;
  client?: CodexClientLike;
  now?: () => number;
}

export class CodexSdkAdapter implements CodexAdapter {
  private readonly client: CodexClientLike;
  private readonly options: CodexSdkAdapterOptions;
  private readonly now: () => number;
  private telemetry: ProviderTelemetry | undefined;

  constructor(options: CodexSdkAdapterOptions = {}) {
    this.options = options;
    this.now = options.now ?? Date.now;
    this.client =
      options.client ??
      new Codex({
        apiKey: options.apiKey,
        codexPathOverride: options.codexPathOverride,
      });
  }

  async run(task: CodexTask, context?: CodexRunContext): Promise<unknown> {
    const startedAt = this.now();
    const model = this.options.model ?? API_TIME_MACHINE_CODEX_MODEL;
    const reasoningEffort =
      this.options.modelReasoningEffort ?? API_TIME_MACHINE_REASONING_EFFORT;
    const thread = this.client.startThread({
      workingDirectory: this.options.workingDirectory ?? process.cwd(),
      model,
      modelReasoningEffort: reasoningEffort,
      sandboxMode: "read-only",
      approvalPolicy: "never",
      networkAccessEnabled: false,
      webSearchMode: "disabled",
    });
    const outputSchema =
      task.kind === "analyze-change"
        ? CHANGE_PROFILE_JSON_SCHEMA
        : REPAIR_PROPOSAL_JSON_SCHEMA;

    const turn = await thread.run(buildCodexPrompt(task, context), {
      outputSchema,
      signal: context?.signal,
    });

    this.telemetry = {
      provider: "openai-codex-sdk",
      model,
      reasoningEffort,
      threadId: thread.id ?? undefined,
      durationMs: Math.max(0, this.now() - startedAt),
      inputTokens: turn.usage?.input_tokens,
      cachedInputTokens: turn.usage?.cached_input_tokens,
      outputTokens: turn.usage?.output_tokens,
      reasoningOutputTokens: turn.usage?.reasoning_output_tokens,
    };

    try {
      return JSON.parse(turn.finalResponse) as unknown;
    } catch (error) {
      throw new CodexWorkflowError(
        "schema",
        "Codex SDK returned a non-JSON final response",
        { retryable: true, cause: error },
      );
    }
  }

  consumeTelemetry(): ProviderTelemetry | undefined {
    const telemetry = this.telemetry;
    this.telemetry = undefined;
    return telemetry;
  }
}
