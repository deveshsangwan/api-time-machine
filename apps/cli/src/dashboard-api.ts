import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import type { CodexWorkflow } from "@atm/codex";
import {
  CapturedResponseSchema,
  CompatibilityRunSchema,
  type CapturedResponse,
  type ChangeProfile,
  type ClientResult,
  type CompatibilityRun,
  type RepairProposal,
} from "@atm/contracts";

const execFileAsync = promisify(execFile);

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
  compatibility: CompatibilityRun;
  semantic: SemanticResult;
  source: "local-evidence";
}

export type PresentedRepair = Pick<
  RepairProposal,
  "summary" | "legacyProjection" | "allowedPaths"
>;

interface EvidenceManifest {
  run: CompatibilityRun;
  captures: Array<{ sha256: string; path: string }>;
}

export interface LoadedEvidence {
  directory: string;
  run: CompatibilityRun;
  captures: CapturedResponse[];
}

export class DashboardApiError extends Error {
  override readonly name = "DashboardApiError";

  constructor(
    message: string,
    readonly statusCode = 500,
  ) {
    super(message);
  }
}

function parseManifest(value: unknown): EvidenceManifest {
  if (typeof value !== "object" || value === null) {
    throw new DashboardApiError("Evidence manifest is not an object.");
  }

  const manifest = value as Record<string, unknown>;
  if (!Array.isArray(manifest.captures)) {
    throw new DashboardApiError("Evidence manifest has no capture index.");
  }

  const captures = manifest.captures.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new DashboardApiError("Evidence manifest contains an invalid capture.");
    }
    const capture = entry as Record<string, unknown>;
    if (typeof capture.sha256 !== "string" || typeof capture.path !== "string") {
      throw new DashboardApiError("Evidence capture reference is incomplete.");
    }
    return { sha256: capture.sha256, path: capture.path };
  });

  return {
    run: CompatibilityRunSchema.parse(manifest.run),
    captures,
  };
}

export async function loadLatestEvidence(runsRoot: string): Promise<LoadedEvidence> {
  let entries: string[];
  try {
    entries = await readdir(runsRoot);
  } catch {
    throw new DashboardApiError(
      "No compatibility evidence exists yet. Run `pnpm --filter @atm/cli start` first.",
      404,
    );
  }

  const candidates = await Promise.all(
    entries.map(async (entry) => {
      const manifestPath = resolve(runsRoot, entry, "manifest.json");
      try {
        const metadata = await stat(manifestPath);
        return { directory: resolve(runsRoot, entry), manifestPath, modifiedAt: metadata.mtimeMs };
      } catch {
        return null;
      }
    }),
  );
  const latest = candidates
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => right.modifiedAt - left.modifiedAt)[0];

  if (!latest) {
    throw new DashboardApiError(
      "No compatibility evidence exists yet. Run `pnpm --filter @atm/cli start` first.",
      404,
    );
  }

  const manifest = parseManifest(JSON.parse(await readFile(latest.manifestPath, "utf8")));
  const uniquePaths = [...new Set(manifest.captures.map((capture) => capture.path))];
  const captures = await Promise.all(
    uniquePaths.map(async (path) => {
      const capturePath = resolve(latest.directory, path);
      if (!capturePath.startsWith(`${latest.directory}/`)) {
        throw new DashboardApiError("Evidence capture path escapes its run directory.");
      }
      return CapturedResponseSchema.parse(JSON.parse(await readFile(capturePath, "utf8")));
    }),
  );

  return { directory: latest.directory, run: manifest.run, captures };
}

export async function readBackendDiff(repositoryPath: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "git",
    ["-C", repositoryPath, "diff", "HEAD", "--", "apps/backend"],
    { maxBuffer: 2_000_000 },
  );
  return stdout.trim();
}

function selectCapture(evidence: LoadedEvidence): CapturedResponse {
  const failureHash = evidence.run.clients.find(
    (result) => result.status === "incompatible",
  )?.responseSha256;
  const selected =
    evidence.captures.find((capture) => capture.sha256 === failureHash) ??
    evidence.captures.find((capture) => capture.body.includes("MANUAL_REVIEW")) ??
    evidence.captures[0];

  if (!selected) {
    throw new DashboardApiError("The latest evidence bundle contains no captured response.");
  }
  return selected;
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

function sanitizeRun(run: CompatibilityRun): CompatibilityRun {
  return {
    ...run,
    clients: run.clients.map(sanitizeClientResult),
  };
}

function presentRepair(repair: RepairProposal): PresentedRepair {
  return {
    summary: repair.summary,
    legacyProjection: repair.legacyProjection,
    allowedPaths: repair.allowedPaths,
  };
}

export async function analyzeEvidence(
  evidence: LoadedEvidence,
  diff: string,
  workflow: CodexWorkflow,
): Promise<DashboardPayload> {
  if (!diff.trim()) {
    throw new DashboardApiError(
      "No uncommitted backend diff is available for Codex to analyze.",
      409,
    );
  }

  const change = await workflow.analyzeChange({
    diff,
    capturedResponse: selectCapture(evidence),
  });
  const failures = evidence.run.clients.filter(
    (result) => result.status === "incompatible",
  );

  if (failures.length === 0) {
    return {
      compatibility: sanitizeRun(evidence.run),
      semantic: { status: "analysis_accepted", change },
      source: "local-evidence",
    };
  }

  const repair = await workflow.proposeRepair({ change, failures });
  return {
    compatibility: sanitizeRun(evidence.run),
    semantic: { status: "candidate_repair", change, repair: presentRepair(repair) },
    source: "local-evidence",
  };
}

export function evidencePayload(evidence: LoadedEvidence): DashboardPayload {
  return {
    compatibility: sanitizeRun(evidence.run),
    semantic: { status: "not_requested" },
    source: "local-evidence",
  };
}
