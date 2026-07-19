import { createHash } from "node:crypto";
import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { executeCommand, type CommandExecutor } from "./command.js";

export class RepositoryResolutionError extends Error {
  override readonly name = "RepositoryResolutionError";
}

function cacheKey(source: string): string {
  return createHash("sha256").update(source).digest("hex").slice(0, 20);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assertGitRepository(
  path: string,
  execute: CommandExecutor,
): Promise<void> {
  const result = await execute({
    executable: "git",
    arguments: ["-C", path, "rev-parse", "--git-dir"],
    cwd: path,
    timeoutMs: 30_000,
    environment: process.env,
  });
  if (result.exitCode !== 0) {
    throw new RepositoryResolutionError(`${path} is not a Git repository.`);
  }
}

export async function resolveClientRepository(
  source: string,
  cacheRoot: string,
  execute: CommandExecutor = executeCommand,
): Promise<string> {
  if (!source.includes("://") && !/^[^/]+@[^:]+:/.test(source)) {
    const path = resolve(source);
    await assertGitRepository(path, execute);
    return path;
  }

  await mkdir(cacheRoot, { recursive: true });
  const path = resolve(cacheRoot, `${cacheKey(source)}.git`);
  const command = (arguments_: string[]) =>
    execute({
      executable: "git",
      arguments: arguments_,
      cwd: cacheRoot,
      timeoutMs: 60_000,
      environment: process.env,
    });
  const result = (await exists(path))
    ? await command(["-C", path, "fetch", "--tags", "--prune", "origin"])
    : await command(["clone", "--bare", source, path]);
  if (result.exitCode !== 0) {
    throw new RepositoryResolutionError(
      "Could not prepare the configured client repository. Check its URL, refs, and caller-owned Git credentials.",
    );
  }
  await assertGitRepository(path, execute);
  return path;
}
