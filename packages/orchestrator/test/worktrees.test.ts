import { describe, expect, it, vi } from "vitest";

import type { ClientRelease } from "@atm/contracts";

import {
  HistoricalWorktreeError,
  createHistoricalWorktree,
  withHistoricalWorktree,
  type CommandResult,
  type WorktreeDependencies,
} from "../src/index.js";

const release: ClientRelease = {
  platform: "android-react-native",
  version: "1.0.0",
  gitTag: "app-v1.0.0",
  activeShare: 0.18,
  supported: true,
  source: "hackathon-sample",
  observedAt: "2026-07-14T00:00:00.000Z",
  testCommand: "pnpm test -- --runInBand",
};

function successfulResult(stdout = ""): CommandResult {
  return { exitCode: 0, stdout, stderr: "" };
}

function dependencies(
  results: CommandResult[],
): WorktreeDependencies & { runCommand: ReturnType<typeof vi.fn> } {
  return {
    ensureDirectory: vi.fn().mockResolvedValue(undefined),
    runCommand: vi.fn(async () => results.shift() ?? successfulResult()),
  };
}

const options = {
  repositoryPath: "/repo",
  worktreesRoot: "/repo/.worktrees",
  runId: "run_123",
  release,
};

describe("historical worktrees", () => {
  it("checks out an immutable tag, records its revision, and removes it", async () => {
    const testDependencies = dependencies([
      successfulResult(),
      successfulResult("a".repeat(40)),
      successfulResult(),
      successfulResult(),
    ]);

    const worktree = await createHistoricalWorktree(options, testDependencies);
    await worktree.cleanup();

    expect(worktree.path).toBe("/repo/.worktrees/run_123-1.0.0");
    expect(worktree.commitSha).toBe("a".repeat(40));
    expect(testDependencies.ensureDirectory).toHaveBeenCalledWith("/repo/.worktrees");
    expect(testDependencies.runCommand).toHaveBeenNthCalledWith(1, "git", [
      "-C",
      "/repo",
      "worktree",
      "add",
      "--detach",
      "/repo/.worktrees/run_123-1.0.0",
      "app-v1.0.0",
    ]);
    expect(testDependencies.runCommand).toHaveBeenNthCalledWith(3, "git", [
      "-C",
      "/repo",
      "worktree",
      "remove",
      "--force",
      "/repo/.worktrees/run_123-1.0.0",
    ]);
  });

  it("removes the worktree when execution throws", async () => {
    const testDependencies = dependencies([
      successfulResult(),
      successfulResult("b".repeat(40)),
      successfulResult(),
      successfulResult(),
    ]);

    await expect(
      withHistoricalWorktree(
        options,
        async () => {
          throw new Error("probe failed");
        },
        testDependencies,
      ),
    ).rejects.toThrow("probe failed");

    expect(testDependencies.runCommand).toHaveBeenCalledTimes(4);
  });

  it("fails closed when Git cannot resolve the historical revision", async () => {
    const testDependencies = dependencies([
      successfulResult(),
      { exitCode: 128, stdout: "", stderr: "unknown revision" },
      successfulResult(),
      successfulResult(),
    ]);

    await expect(
      createHistoricalWorktree(options, testDependencies),
    ).rejects.toBeInstanceOf(HistoricalWorktreeError);
    expect(testDependencies.runCommand).toHaveBeenCalledTimes(4);
  });
});
