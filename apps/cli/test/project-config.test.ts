import { describe, expect, it } from "vitest";

import {
  ProjectConfigurationError,
  findProjectConfiguration,
  loadProjectConfiguration,
  parseProjectConfiguration,
} from "../src/project-config.js";

const configuration = {
  schemaVersion: 1,
  releases: { manifest: "config/releases.json" },
  backend: {
    capture: {
      command: ["node", "capture.mjs"],
      cwd: "tools",
      timeoutMs: 10_000,
    },
  },
  client: {
    repository: ".",
    worktrees: ".worktrees",
    probe: { command: ["node", "probe.mjs"] },
  },
  evidence: { runs: "runs" },
};

describe("project configuration", () => {
  it("resolves one portable configuration from the attached project root", async () => {
    const loaded = await loadProjectConfiguration("/repo", async () =>
      JSON.stringify(configuration),
    );

    expect(loaded).toEqual({
      projectRoot: "/repo",
      releasesManifest: "/repo/config/releases.json",
      capture: {
        command: ["node", "capture.mjs"],
        cwd: "/repo/tools",
        timeoutMs: 10_000,
      },
      clientRepository: "/repo",
      repositoryCache: "/repo/.api-time-machine/repositories",
      worktreesRoot: "/repo/.worktrees",
      probe: {
        command: ["node", "probe.mjs"],
        cwd: "/repo",
        timeoutMs: undefined,
      },
      runsRoot: "/repo/runs",
    });
  });

  it("rejects shell command strings", () => {
    expect(() =>
      parseProjectConfiguration({
        ...configuration,
        backend: { capture: { command: "node capture.mjs" } },
      }),
    ).toThrow(ProjectConfigurationError);
  });

  it("finds an attached project configuration from a workspace package", async () => {
    const missing = Object.assign(new Error("missing"), { code: "ENOENT" });
    const loaded = await findProjectConfiguration("/repo/apps/cli", async (path) => {
      if (path !== "/repo/api-time-machine.config.json") throw missing;
      return JSON.stringify(configuration);
    });

    expect(loaded.projectRoot).toBe("/repo");
  });

  it("rejects repository URLs containing credentials", () => {
    expect(() =>
      parseProjectConfiguration({
        ...configuration,
        client: {
          ...configuration.client,
          repository: "https://token@example.test/mobile.git",
        },
      }),
    ).toThrow("must not contain embedded credentials");
  });
});
