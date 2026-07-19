import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  ChangeProfile,
  ClientResult,
  CompatibilityRun,
  RepairProposal,
} from "@atm/contracts";

export type PresentedRepair = Pick<
  RepairProposal,
  "summary" | "legacyProjection" | "allowedPaths"
>;

export type SemanticResult =
  | { status: "not_requested" }
  | { status: "analysis_accepted"; change: ChangeProfile }
  | {
      status: "candidate_repair";
      change: ChangeProfile;
      repair: PresentedRepair;
    }
  | { status: "rejected"; message: string };

export interface DashboardPayload {
  schemaVersion: 1;
  compatibility: CompatibilityRun;
  semantic: SemanticResult;
  source: "artifact" | "local-evidence";
}

function sanitizeClientResult(result: ClientResult): ClientResult {
  return {
    ...result,
    evidence: {
      command: result.release.testCommand,
      sourceFile: result.evidence.sourceFile,
      sourceLine: result.evidence.sourceLine,
    },
  };
}

export function sanitizeRun(run: CompatibilityRun): CompatibilityRun {
  return { ...run, clients: run.clients.map(sanitizeClientResult) };
}

export function evidencePayload(run: CompatibilityRun): DashboardPayload {
  return {
    schemaVersion: 1,
    compatibility: sanitizeRun(run),
    semantic: { status: "not_requested" },
    source: "artifact",
  };
}

export async function writeDashboardArtifact(
  evidenceDirectory: string,
  run: CompatibilityRun,
): Promise<string> {
  const path = resolve(evidenceDirectory, "run-view.json");
  await writeFile(path, `${JSON.stringify(evidencePayload(run), null, 2)}\n`, "utf8");
  return path;
}
