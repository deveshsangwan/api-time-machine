import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findLatestDashboardArtifact } from "../src/dashboard.js";

describe("dashboard server", () => {
  it("selects the latest portable artifact", async () => {
    const root = await mkdtemp(join(tmpdir(), "atm-dashboard-server-"));
    await mkdir(join(root, "run-1"));
    await writeFile(join(root, "run-1", "run-view.json"), "{}\n");

    expect(await findLatestDashboardArtifact(root)).toBe(
      join(root, "run-1", "run-view.json"),
    );
  });
});
