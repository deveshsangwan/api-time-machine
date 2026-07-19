import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createSimulatedMobileProjectDataset,
  type CodexWorkflow,
} from "@atm/codex";
import { describe, expect, it } from "vitest";

import {
  DashboardApiError,
  analyzeEvidence,
  evidencePayload,
  loadLatestEvidence,
} from "../src/dashboard-api.js";

function fixtureWorkflow(): CodexWorkflow {
  const dataset = createSimulatedMobileProjectDataset({
    observedAt: "2026-07-14T00:00:00.000Z",
  });
  return {
    async analyzeChange() {
      return dataset.expectedChange;
    },
    async proposeRepair() {
      return dataset.expectedRepair;
    },
  };
}

describe("dashboard API", () => {
  it("loads the latest validated evidence bundle", async () => {
    const dataset = createSimulatedMobileProjectDataset({
      observedAt: "2026-07-14T00:00:00.000Z",
    });
    const runsRoot = await mkdtemp(join(tmpdir(), "atm-dashboard-"));
    const runDirectory = join(runsRoot, "run-1");
    const capturesDirectory = join(runDirectory, "captures");
    await mkdir(capturesDirectory, { recursive: true });
    await writeFile(
      join(capturesDirectory, `${dataset.capturedResponse.sha256}.json`),
      JSON.stringify(dataset.capturedResponse),
    );
    await writeFile(
      join(runDirectory, "manifest.json"),
      JSON.stringify({
        run: {
          runId: "run-1",
          status: "incompatible",
          clients: dataset.clientResults,
          blastRadius: 0.18,
          startedAt: "2026-07-14T00:00:00.000Z",
          completedAt: "2026-07-14T00:00:01.000Z",
        },
        captures: [
          {
            sha256: dataset.capturedResponse.sha256,
            path: `captures/${dataset.capturedResponse.sha256}.json`,
          },
        ],
      }),
    );

    const evidence = await loadLatestEvidence(runsRoot);

    expect(evidence.run.runId).toBe("run-1");
    expect(evidence.captures).toEqual([dataset.capturedResponse]);
    const payload = evidencePayload(evidence);
    expect(payload.semantic.status).toBe("not_requested");
    expect(payload.compatibility.clients[0]?.evidence.stderr).toBeUndefined();
  });

  it("returns a validated unverified Candidate Repair for incompatible evidence", async () => {
    const dataset = createSimulatedMobileProjectDataset({
      observedAt: "2026-07-14T00:00:00.000Z",
    });
    const payload = await analyzeEvidence(
      {
        directory: "/tmp/run-1",
        run: {
          runId: "run-1",
          status: "incompatible",
          clients: dataset.clientResults,
          blastRadius: 0.18,
          startedAt: "2026-07-14T00:00:00.000Z",
          completedAt: "2026-07-14T00:00:01.000Z",
        },
        captures: [dataset.capturedResponse],
      },
      dataset.diff,
      fixtureWorkflow(),
    );

    expect(payload.semantic.status).toBe("candidate_repair");
    expect(payload.compatibility.status).toBe("incompatible");
    if (payload.semantic.status === "candidate_repair") {
      expect(payload.semantic.repair).not.toHaveProperty("patch");
      expect(payload.semantic.repair).not.toHaveProperty("regressionTestPatch");
    }
  });

  it("does not call Codex without a backend diff", async () => {
    const dataset = createSimulatedMobileProjectDataset();

    await expect(
      analyzeEvidence(
        {
          directory: "/tmp/run-1",
          run: {
            runId: "run-1",
            status: "incompatible",
            clients: dataset.clientResults,
            blastRadius: 0.18,
            startedAt: "2026-07-14T00:00:00.000Z",
            completedAt: "2026-07-14T00:00:01.000Z",
          },
          captures: [dataset.capturedResponse],
        },
        "",
        fixtureWorkflow(),
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<DashboardApiError>>({ statusCode: 409 }),
    );
  });
});
