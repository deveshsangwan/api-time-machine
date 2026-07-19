import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createSimulatedMobileProjectDataset } from "@atm/codex";
import { describe, expect, it } from "vitest";

import { writeDashboardArtifact } from "../src/dashboard-artifact.js";

describe("dashboard artifact", () => {
  it("writes a versioned browser-safe view of deterministic evidence", async () => {
    const dataset = createSimulatedMobileProjectDataset();
    const directory = await mkdtemp(join(tmpdir(), "atm-artifact-"));
    const path = await writeDashboardArtifact(directory, {
      runId: "run-1",
      status: "incompatible",
      clients: dataset.clientResults,
      blastRadius: 0.18,
      startedAt: "2026-07-14T00:00:00.000Z",
      completedAt: "2026-07-14T00:00:01.000Z",
    });
    const artifact = JSON.parse(await readFile(path, "utf8")) as Record<
      string,
      unknown
    >;

    expect(artifact.schemaVersion).toBe(1);
    expect(JSON.stringify(artifact)).not.toContain("stderr");
    expect(JSON.stringify(artifact)).not.toContain("stdout");
  });
});
