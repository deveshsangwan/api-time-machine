import { describe, expect, it, vi } from "vitest";

import {
  CodexWorkflowError,
  createCodexWorkflow,
  createSimulatedMobileProjectDataset,
  type CodexAdapter,
  type WorkflowAttemptEvent,
} from "../src/index.js";

function sequenceAdapter(outputs: unknown[]): CodexAdapter {
  let index = 0;
  return {
    async run() {
      const output = outputs[Math.min(index, outputs.length - 1)];
      index += 1;
      return output;
    },
  };
}

describe("createCodexWorkflow", () => {
  const dataset = createSimulatedMobileProjectDataset({
    observedAt: "2026-07-14T12:00:00.000Z",
  });

  it("accepts a change profile grounded in both diff and captured evidence", async () => {
    const workflow = createCodexWorkflow(
      sequenceAdapter([dataset.expectedChange]),
    );

    const change = await workflow.analyzeChange({
      diff: dataset.diff,
      capturedResponse: dataset.capturedResponse,
    });

    expect(change.newValues).toEqual(["MANUAL_REVIEW"]);
  });

  it("retries malformed structured output only once", async () => {
    const attempts: WorkflowAttemptEvent[] = [];
    const workflow = createCodexWorkflow(
      sequenceAdapter([{ malformed: true }, dataset.expectedChange]),
      { onAttempt: (event) => attempts.push(event) },
    );

    await expect(
      workflow.analyzeChange({
        diff: dataset.diff,
        capturedResponse: dataset.capturedResponse,
      }),
    ).resolves.toEqual(dataset.expectedChange);

    expect(attempts.map(({ status, errorCategory }) => [status, errorCategory])).toEqual([
      ["failed", "schema"],
      ["succeeded", undefined],
    ]);
  });

  it("passes deterministic rejection feedback into the bounded retry", async () => {
    const contexts: Array<Parameters<CodexAdapter["run"]>[1]> = [];
    let call = 0;
    const workflow = createCodexWorkflow({
      async run(_task, context) {
        contexts.push(context);
        call += 1;
        return call === 1 ? { malformed: true } : dataset.expectedChange;
      },
    });

    await workflow.analyzeChange({
      diff: dataset.diff,
      capturedResponse: dataset.capturedResponse,
    });

    expect(contexts[0]?.previousError).toBeUndefined();
    expect(contexts[1]?.previousError).toMatchObject({ category: "schema" });
  });

  it("rejects ungrounded model values after the bounded retry", async () => {
    const ungrounded = {
      ...dataset.expectedChange,
      proposedValues: [...dataset.expectedChange.proposedValues, "ESCALATED"],
      newValues: ["ESCALATED"],
    };
    const attempts: WorkflowAttemptEvent[] = [];
    const workflow = createCodexWorkflow(sequenceAdapter([ungrounded]), {
      onAttempt: (event) => attempts.push(event),
    });

    await expect(
      workflow.analyzeChange({
        diff: dataset.diff,
        capturedResponse: dataset.capturedResponse,
      }),
    ).rejects.toMatchObject({ category: "grounding" });
    expect(attempts).toHaveLength(2);
  });

  it("accepts only the approved backend legacy projection", async () => {
    const workflow = createCodexWorkflow(
      sequenceAdapter([dataset.expectedRepair]),
    );

    await expect(
      workflow.proposeRepair({
        change: dataset.expectedChange,
        failures: dataset.clientResults,
      }),
    ).resolves.toEqual(dataset.expectedRepair);
  });

  it("rejects an out-of-scope mobile patch without retrying", async () => {
    const unsafe = {
      ...dataset.expectedRepair,
      patch: `diff --git a/apps/mobile/src/api/verification.ts b/apps/mobile/src/api/verification.ts
--- a/apps/mobile/src/api/verification.ts
+++ b/apps/mobile/src/api/verification.ts
@@ -1 +1 @@
-strict
+accept MANUAL_REVIEW PENDING 1.2.0`,
      allowedPaths: ["apps/mobile/src/api/verification.ts"],
    };
    const attempts: WorkflowAttemptEvent[] = [];
    const workflow = createCodexWorkflow(sequenceAdapter([unsafe]), {
      onAttempt: (event) => attempts.push(event),
    });

    await expect(
      workflow.proposeRepair({
        change: dataset.expectedChange,
        failures: dataset.clientResults,
      }),
    ).rejects.toMatchObject({ category: "policy", retryable: false });
    expect(attempts).toHaveLength(1);
  });

  it("times out and aborts every bounded attempt", async () => {
    const observedSignals: AbortSignal[] = [];
    const adapter: CodexAdapter = {
      run(_task, context) {
        observedSignals.push(context!.signal);
        return new Promise(() => undefined);
      },
    };
    const workflow = createCodexWorkflow(adapter, { timeoutMs: 5 });

    await expect(
      workflow.analyzeChange({
        diff: dataset.diff,
        capturedResponse: dataset.capturedResponse,
      }),
    ).rejects.toBeInstanceOf(CodexWorkflowError);
    expect(observedSignals).toHaveLength(2);
    expect(observedSignals.every((signal) => signal.aborted)).toBe(true);
  });

  it("reports provider telemetry without exposing prompt or credentials", async () => {
    const onAttempt = vi.fn();
    const adapter: CodexAdapter = {
      async run() {
        return dataset.expectedChange;
      },
      consumeTelemetry() {
        return {
          provider: "test-provider",
          durationMs: 12,
          inputTokens: 100,
          outputTokens: 20,
        };
      },
    };
    const workflow = createCodexWorkflow(adapter, { onAttempt });

    await workflow.analyzeChange({
      diff: dataset.diff,
      capturedResponse: dataset.capturedResponse,
    });

    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        provider: expect.objectContaining({ provider: "test-provider" }),
      }),
    );
    expect(JSON.stringify(onAttempt.mock.calls)).not.toContain("apiKey");
  });

  it("sanitizes authentication errors and never retries them", async () => {
    let calls = 0;
    const workflow = createCodexWorkflow({
      async run() {
        calls += 1;
        throw new Error(
          "401 Unauthorized: invalid_api_key sk-proj-********SECRETTAIL",
        );
      },
    });

    let received: unknown;
    try {
      await workflow.analyzeChange({
        diff: dataset.diff,
        capturedResponse: dataset.capturedResponse,
      });
    } catch (error) {
      received = error;
    }

    expect(received).toMatchObject({
      category: "adapter",
      retryable: false,
      message: "Codex authentication failed; replace the configured API credential",
    });
    expect(String(received)).not.toContain("sk-proj");
    expect(calls).toBe(1);
  });
});
