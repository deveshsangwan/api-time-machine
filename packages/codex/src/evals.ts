import type { CodexAdapter, CodexTask } from "./types.js";
import { createSimulatedMobileProjectDataset } from "./simulation.js";
import { createCodexWorkflow } from "./workflow.js";

export interface EvaluationCaseResult {
  name: string;
  passed: boolean;
  attempts: number;
  detail: string;
}

export interface EvaluationReport {
  simulation: true;
  generatedAt: string;
  passed: number;
  failed: number;
  cases: EvaluationCaseResult[];
}

class SequenceAdapter implements CodexAdapter {
  private index = 0;

  constructor(private readonly outputs: unknown[]) {}

  async run(_task: CodexTask): Promise<unknown> {
    const output = this.outputs[Math.min(this.index, this.outputs.length - 1)];
    this.index += 1;
    if (output instanceof Error) throw output;
    return output;
  }
}

async function evaluate(name: string, operation: () => Promise<void>, attempts: () => number) {
  try {
    await operation();
    return { name, passed: true, attempts: attempts(), detail: "accepted as expected" };
  } catch (error) {
    return {
      name,
      passed: false,
      attempts: attempts(),
      detail: error instanceof Error ? error.message : "unknown evaluation error",
    };
  }
}

export async function runDeterministicEvaluation(): Promise<EvaluationReport> {
  const dataset = createSimulatedMobileProjectDataset({
    observedAt: "2026-07-14T12:00:00.000Z",
  });
  const cases: EvaluationCaseResult[] = [];

  {
    let attempts = 0;
    const workflow = createCodexWorkflow(
      new SequenceAdapter([dataset.expectedChange]),
      { onAttempt: () => (attempts += 1) },
    );
    cases.push(
      await evaluate(
        "grounded change profile",
        async () => {
          await workflow.analyzeChange({
            diff: dataset.diff,
            capturedResponse: dataset.capturedResponse,
          });
        },
        () => attempts,
      ),
    );
  }

  {
    let attempts = 0;
    const workflow = createCodexWorkflow(
      new SequenceAdapter([{ malformed: true }, dataset.expectedChange]),
      { onAttempt: () => (attempts += 1) },
    );
    cases.push(
      await evaluate(
        "malformed output retries once",
        async () => {
          await workflow.analyzeChange({
            diff: dataset.diff,
            capturedResponse: dataset.capturedResponse,
          });
          if (attempts !== 2) throw new Error(`expected 2 attempts, received ${attempts}`);
        },
        () => attempts,
      ),
    );
  }

  {
    let attempts = 0;
    const workflow = createCodexWorkflow(
      new SequenceAdapter([dataset.expectedRepair]),
      { onAttempt: () => (attempts += 1) },
    );
    cases.push(
      await evaluate(
        "safe candidate repair",
        async () => {
          await workflow.proposeRepair({
            change: dataset.expectedChange,
            failures: dataset.clientResults.filter(
              (result) => result.status === "incompatible",
            ),
          });
        },
        () => attempts,
      ),
    );
  }

  {
    let attempts = 0;
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
    const workflow = createCodexWorkflow(new SequenceAdapter([unsafe]), {
      onAttempt: () => (attempts += 1),
    });
    let rejected = false;
    try {
      await workflow.proposeRepair({
        change: dataset.expectedChange,
        failures: dataset.clientResults.filter(
          (result) => result.status === "incompatible",
        ),
      });
    } catch {
      rejected = true;
    }
    cases.push({
      name: "out-of-scope mobile edit is rejected",
      passed: rejected,
      attempts,
      detail: rejected ? "rejected as expected" : "unsafe patch was accepted",
    });
  }

  return {
    simulation: true,
    generatedAt: dataset.generatedAt,
    passed: cases.filter((item) => item.passed).length,
    failed: cases.filter((item) => !item.passed).length,
    cases,
  };
}
