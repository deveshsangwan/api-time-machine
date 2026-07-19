import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { initializeProject } from "../src/init.js";
import { loadProjectConfiguration } from "../src/project-config.js";

describe("project initialization", () => {
  it("attaches the portable command protocol without overwriting it", async () => {
    const root = await mkdtemp(join(tmpdir(), "atm-init-"));
    expect(await initializeProject(root)).toContain("Attached API Time Machine");

    const config = await loadProjectConfiguration(root);
    expect(config.capture.command).toEqual([
      "node",
      ".api-time-machine/capture.mjs",
    ]);
    expect(config.probe.command).toEqual([
      "node",
      ".api-time-machine/probe.mjs",
    ]);
    expect(await readFile(join(root, ".gitignore"), "utf8")).toContain(
      ".api-time-machine/runs/",
    );
    expect(await initializeProject(root)).toContain("Already attached");
  });
});
