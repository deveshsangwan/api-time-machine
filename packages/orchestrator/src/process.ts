import { spawn } from "node:child_process";

import type { CommandResult, CommandRunner } from "./worktrees.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const FORCE_KILL_GRACE_MS = 500;

export async function runCommand(
  executable: string,
  arguments_: string[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<CommandResult> {
  const startedAt = performance.now();

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let forceKillTimer: NodeJS.Timeout | undefined;

    const finish = (exitCode: number) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      if (forceKillTimer) {
        clearTimeout(forceKillTimer);
      }
      resolve({
        exitCode,
        stdout,
        stderr,
        durationMs: Math.round(performance.now() - startedAt),
        timedOut,
      });
    };

    const child = spawn(executable, arguments_, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      stderr += `${error.message}\n`;
      finish(-1);
    });
    child.on("close", (code) => {
      finish(code ?? -1);
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      forceKillTimer = setTimeout(() => child.kill("SIGKILL"), FORCE_KILL_GRACE_MS);
    }, timeoutMs);
  });
}

export const defaultCommandRunner: CommandRunner = runCommand;
