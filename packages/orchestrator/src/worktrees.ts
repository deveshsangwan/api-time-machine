import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import type { ClientRelease } from "@atm/contracts";
import { defaultCommandRunner } from "./process.js";

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs?: number;
  timedOut?: boolean;
}

export type CommandRunner = (
  executable: string,
  arguments_: string[],
) => Promise<CommandResult>;

export interface HistoricalWorktreeOptions {
  repositoryPath: string;
  worktreesRoot: string;
  runId: string;
  release: ClientRelease;
}

export interface HistoricalWorktree {
  path: string;
  commitSha: string;
  cleanup(): Promise<void>;
}

export interface WorktreeDependencies {
  ensureDirectory(path: string): Promise<void>;
  runCommand: CommandRunner;
}

export class HistoricalWorktreeError extends Error {
  override readonly name = "HistoricalWorktreeError";

  constructor(
    message: string,
    readonly result?: CommandResult,
  ) {
    super(message);
  }
}

const defaultDependencies: WorktreeDependencies = {
  async ensureDirectory(path) {
    await mkdir(path, { recursive: true });
  },
  runCommand: defaultCommandRunner,
};

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function assertSuccess(
  description: string,
  result: CommandResult,
): void {
  if (result.exitCode !== 0) {
    throw new HistoricalWorktreeError(
      `${description} failed with exit code ${result.exitCode}: ${result.stderr || result.stdout}`,
      result,
    );
  }
}

function worktreeDirectory(
  worktreesRoot: string,
  runId: string,
  release: ClientRelease,
): string {
  const safeRunId = safePathSegment(runId);
  const safeVersion = safePathSegment(release.version);

  if (!safeRunId || !safeVersion) {
    throw new HistoricalWorktreeError(
      "A historical worktree requires a non-empty run ID and release version.",
    );
  }

  return resolve(worktreesRoot, `${safeRunId}-${safeVersion}`);
}

async function removeWorktree(
  options: HistoricalWorktreeOptions,
  path: string,
  dependencies: WorktreeDependencies,
): Promise<void> {
  const removeResult = await dependencies.runCommand("git", [
    "-C",
    options.repositoryPath,
    "worktree",
    "remove",
    "--force",
    path,
  ]);
  assertSuccess(`Removing historical worktree for ${options.release.gitTag}`, removeResult);

  const pruneResult = await dependencies.runCommand("git", [
    "-C",
    options.repositoryPath,
    "worktree",
    "prune",
  ]);
  assertSuccess(`Pruning historical worktrees`, pruneResult);
}

export async function createHistoricalWorktree(
  options: HistoricalWorktreeOptions,
  dependencies: WorktreeDependencies = defaultDependencies,
): Promise<HistoricalWorktree> {
  const path = worktreeDirectory(
    options.worktreesRoot,
    options.runId,
    options.release,
  );
  await dependencies.ensureDirectory(options.worktreesRoot);

  const addResult = await dependencies.runCommand("git", [
    "-C",
    options.repositoryPath,
    "worktree",
    "add",
    "--detach",
    path,
    options.release.gitTag,
  ]);
  assertSuccess(`Creating historical worktree for ${options.release.gitTag}`, addResult);

  const revisionResult = await dependencies.runCommand("git", [
    "-C",
    path,
    "rev-parse",
    "HEAD",
  ]);

  try {
    assertSuccess(
      `Resolving commit SHA for historical release ${options.release.gitTag}`,
      revisionResult,
    );
  } catch (error) {
    await removeWorktree(options, path, dependencies);
    throw error;
  }

  const commitSha = revisionResult.stdout.trim();
  if (!/^[a-f0-9]{40}$/i.test(commitSha)) {
    try {
      await removeWorktree(options, path, dependencies);
    } catch (cleanupError) {
      throw new HistoricalWorktreeError(
        `Historical release ${options.release.gitTag} returned an invalid commit SHA and cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
      );
    }
    throw new HistoricalWorktreeError(
      `Historical release ${options.release.gitTag} returned an invalid commit SHA.`,
      revisionResult,
    );
  }

  return {
    path,
    commitSha,
    cleanup: () => removeWorktree(options, path, dependencies),
  };
}

export async function withHistoricalWorktree<T>(
  options: HistoricalWorktreeOptions,
  execute: (worktree: HistoricalWorktree) => Promise<T>,
  dependencies?: WorktreeDependencies,
): Promise<T> {
  const worktree = await createHistoricalWorktree(options, dependencies);
  let primaryError: unknown;

  try {
    return await execute(worktree);
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await worktree.cleanup();
    } catch (cleanupError) {
      if (primaryError) {
        throw new HistoricalWorktreeError(
          `Historical worktree cleanup failed after execution failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
      throw cleanupError;
    }
  }
}
