import { CodexSdkAdapter } from "./adapters/codex-sdk.js";
import { normalizeWorkflowError } from "./errors.js";
import { runDeterministicEvaluation } from "./evals.js";
import { createSimulatedMobileProjectDataset } from "./simulation.js";
import type { CodexAdapter } from "./types.js";
import { createCodexWorkflow } from "./workflow.js";

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

async function runFixtureDemo(): Promise<void> {
  const dataset = createSimulatedMobileProjectDataset();
  const adapter: CodexAdapter = {
    async run(task) {
      return task.kind === "analyze-change"
        ? dataset.expectedChange
        : dataset.expectedRepair;
    },
  };
  const workflow = createCodexWorkflow(adapter);
  const change = await workflow.analyzeChange({
    diff: dataset.diff,
    capturedResponse: dataset.capturedResponse,
  });
  const repair = await workflow.proposeRepair({
    change,
    failures: dataset.clientResults.filter(
      (result) => result.status === "incompatible",
    ),
  });
  print({ simulation: true, change, repair });
}

async function runSdkEvaluation(
  options: { repairOnly?: boolean } = {},
): Promise<void> {
  const apiKey = process.env.CODEX_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CODEX_API_KEY is required for the live SDK evaluation; do not commit or print it",
    );
  }
  const dataset = createSimulatedMobileProjectDataset();
  const attempts: unknown[] = [];
  const workflow = createCodexWorkflow(
    new CodexSdkAdapter({
      apiKey,
      workingDirectory: process.cwd(),
    }),
    { onAttempt: (event) => attempts.push(event) },
  );
  let stage = options.repairOnly ? "candidate-repair" : "analysis";
  let change: Awaited<ReturnType<typeof workflow.analyzeChange>> | undefined =
    options.repairOnly ? dataset.expectedChange : undefined;
  try {
    if (!change) {
      change = await workflow.analyzeChange({
        diff: dataset.diff,
        capturedResponse: dataset.capturedResponse,
      });
    }
    stage = "candidate-repair";
    const repair = await workflow.proposeRepair({
      change,
      failures: dataset.clientResults.filter(
        (result) => result.status === "incompatible",
      ),
    });
    print({
      simulation: true,
      mode: options.repairOnly ? "repair-only" : "full",
      status: "accepted",
      change,
      repair,
      attempts,
    });
  } catch (error) {
    const normalized = normalizeWorkflowError(error);
    print({
      simulation: true,
      mode: options.repairOnly ? "repair-only" : "full",
      status: "rejected",
      rejectedStage: stage,
      change,
      attempts,
      error: {
        category: normalized.category,
        retryable: normalized.retryable,
        message: normalized.message,
      },
    });
    process.exitCode = 1;
  }
}

const command = process.argv[2] ?? "help";

switch (command) {
  case "simulate":
    print(createSimulatedMobileProjectDataset());
    break;
  case "eval":
    print(await runDeterministicEvaluation());
    break;
  case "demo":
    await runFixtureDemo();
    break;
  case "eval-sdk":
    await runSdkEvaluation();
    break;
  case "eval-sdk-repair":
    await runSdkEvaluation({ repairOnly: true });
    break;
  default:
    console.log(`API Time Machine Codex workflow

Commands:
  simulate  Generate explicitly-labelled synthetic mobile history
  eval      Run deterministic MLOps evaluation fixtures
  demo      Run the fixture-backed analysis and repair workflow
  eval-sdk  Run the live gpt-5.6-sol/medium Codex SDK evaluation (requires CODEX_API_KEY)
  eval-sdk-repair  Rerun only the live Candidate Repair stage after an eval failure`);
}
