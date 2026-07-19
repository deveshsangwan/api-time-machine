import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  ClientResultSchema,
  type CapturedResponse,
  type ClientRelease,
  type ClientResult,
} from "@atm/contracts";
import { withHistoricalWorktree } from "@atm/orchestrator";

import { executeCommand, type CommandExecutor } from "./command.js";
import type { ResolvedProjectConfiguration } from "./project-config.js";

const DEFAULT_TIMEOUT_MS = 120_000;

function inconclusive(
  release: ClientRelease,
  response: CapturedResponse,
  summary: string,
  evidence: ClientResult["evidence"] = {},
): ClientResult {
  return {
    release,
    status: "inconclusive",
    responseSha256: response.sha256,
    durationMs: 0,
    summary,
    evidence,
  };
}

function expectedExitCode(status: ClientResult["status"]): number {
  return status === "compatible" ? 0 : status === "incompatible" ? 1 : 2;
}

export async function runConfiguredClientProbe(
  project: ResolvedProjectConfiguration,
  runId: string,
  release: ClientRelease,
  response: CapturedResponse,
  execute: CommandExecutor = executeCommand,
): Promise<ClientResult> {
  const startedAt = performance.now();
  try {
    return await withHistoricalWorktree(
      {
        repositoryPath: project.clientRepository,
        worktreesRoot: project.worktreesRoot,
        runId,
        release,
      },
      async (worktree) => {
        const protocolDirectory = resolve(worktree.path, ".api-time-machine");
        const capturePath = resolve(protocolDirectory, "capture.json");
        const resultPath = resolve(protocolDirectory, "result.json");
        await mkdir(protocolDirectory, { recursive: true });
        await writeFile(capturePath, `${JSON.stringify(response)}\n`, "utf8");

        const [executable, ...arguments_] = project.probe.command;
        const commandResult = await execute({
          executable,
          arguments: arguments_,
          cwd: project.probe.cwd,
          timeoutMs: project.probe.timeoutMs ?? DEFAULT_TIMEOUT_MS,
          environment: {
            ...process.env,
            ATM_CAPTURE_PATH: capturePath,
            ATM_CLIENT_DIR: worktree.path,
            ATM_RELEASE_VERSION: release.version,
            ATM_RESPONSE_SHA256: response.sha256,
            ATM_RESULT_PATH: resultPath,
          },
        });

        let output: unknown;
        try {
          output = JSON.parse(await readFile(resultPath, "utf8"));
        } catch {
          return inconclusive(
            release,
            response,
            "Client probe did not write valid protocol output.",
            { stdout: commandResult.stdout, stderr: commandResult.stderr },
          );
        }

        const parsed = ClientResultSchema.safeParse({
          ...(typeof output === "object" && output !== null ? output : {}),
          release,
          durationMs: Math.round(performance.now() - startedAt),
          evidence: {
            ...(typeof output === "object" &&
            output !== null &&
            "evidence" in output &&
            typeof output.evidence === "object" &&
            output.evidence !== null
              ? output.evidence
              : {}),
            command: project.probe.command.join(" "),
            stdout: commandResult.stdout,
            stderr: commandResult.stderr,
          },
        });
        if (!parsed.success) {
          return inconclusive(
            release,
            response,
            "Client probe protocol output failed validation.",
            { stdout: commandResult.stdout, stderr: commandResult.stderr },
          );
        }
        if (parsed.data.responseSha256 !== response.sha256) {
          return inconclusive(
            release,
            response,
            "Client probe did not prove it replayed the captured response bytes.",
            parsed.data.evidence,
          );
        }
        if (commandResult.exitCode !== expectedExitCode(parsed.data.status)) {
          return inconclusive(
            release,
            response,
            "Client probe exit code disagreed with its protocol result.",
            parsed.data.evidence,
          );
        }
        return parsed.data;
      },
    );
  } catch (error) {
    return inconclusive(
      release,
      response,
      `Historical client could not be prepared: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
