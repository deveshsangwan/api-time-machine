import { describe, expect, it, vi } from "vitest";

import type {
  CapturedResponse,
  CompatibilityRun,
} from "@atm/contracts";

import {
  EvidenceBundleError,
  writeEvidenceBundle,
  type EvidenceDependencies,
} from "../src/index.js";

const sha256 = "a".repeat(64);
const commitSha = "b".repeat(40);

const capture: CapturedResponse = {
  request: {
    method: "GET",
    url: "/verification/verification_123",
    appVersion: "1.0.0",
  },
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: '{"status":"MANUAL_REVIEW"}',
  sha256,
  capturedAt: "2026-07-14T10:30:00.000Z",
};

const run: CompatibilityRun = {
  runId: "run_123",
  status: "incompatible",
  blastRadius: 0.18,
  startedAt: "2026-07-14T10:30:00.000Z",
  completedAt: "2026-07-14T10:30:01.000Z",
  clients: [
    {
      release: {
        platform: "android-react-native",
        version: "1.0.0",
        gitTag: "app-v1.0.0",
        activeShare: 0.18,
        supported: true,
        source: "hackathon-sample",
        observedAt: "2026-07-14T00:00:00.000Z",
        testCommand: "pnpm test -- --runInBand",
      },
      status: "incompatible",
      responseSha256: sha256,
      durationMs: 10,
      summary: "Strict enum rejected MANUAL_REVIEW",
      evidence: { stderr: "ZodError" },
    },
  ],
};

function dependencies(): EvidenceDependencies & {
  ensureDirectory: ReturnType<typeof vi.fn>;
  writeText: ReturnType<typeof vi.fn>;
} {
  return {
    ensureDirectory: vi.fn().mockResolvedValue(undefined),
    writeText: vi.fn().mockResolvedValue(undefined),
  };
}

describe("writeEvidenceBundle", () => {
  it("persists a machine-readable manifest, raw capture, and survival matrix", async () => {
    const testDependencies = dependencies();

    const bundle = await writeEvidenceBundle(
      "/repo/runs",
      { run, captures: [capture], releaseCommits: { "1.0.0": commitSha } },
      testDependencies,
    );

    expect(bundle).toEqual({
      directory: "/repo/runs/run_123",
      manifestPath: "/repo/runs/run_123/manifest.json",
      matrixPath: "/repo/runs/run_123/survival-matrix.md",
    });
    expect(testDependencies.ensureDirectory).toHaveBeenCalledWith(
      "/repo/runs/run_123/captures",
    );
    expect(testDependencies.writeText).toHaveBeenCalledTimes(3);
    expect(testDependencies.writeText).toHaveBeenCalledWith(
      "/repo/runs/run_123/survival-matrix.md",
      expect.stringContaining("Configured blast radius: **18.00%**"),
    );
  });

  it("fails closed when a client result has no matching captured bytes", async () => {
    const testDependencies = dependencies();
    const unmatchedRun: CompatibilityRun = {
      ...run,
      clients: run.clients.map((client) => ({
        ...client,
        responseSha256: "c".repeat(64),
      })),
    };

    await expect(
      writeEvidenceBundle(
        "/repo/runs",
        {
          run: unmatchedRun,
          captures: [capture],
          releaseCommits: { "1.0.0": commitSha },
        },
        testDependencies,
      ),
    ).rejects.toBeInstanceOf(EvidenceBundleError);
  });
});
