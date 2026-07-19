import { createHash } from "node:crypto";

import {
  CapturedResponseSchema,
  type CapturedResponse,
  type ClientRelease,
} from "@atm/contracts";

import type { ResolvedProjectConfiguration } from "./project-config.js";
import {
  executeCommand,
  type CommandExecutor,
  type CommandResult,
} from "./command.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export type CaptureCommandResult = CommandResult;
export type CaptureCommandExecutor = CommandExecutor;

export class CaptureCommandError extends Error {
  override readonly name = "CaptureCommandError";
}

export async function captureConfiguredResponse(
  config: ResolvedProjectConfiguration,
  release: ClientRelease,
  execute: CaptureCommandExecutor = executeCommand,
): Promise<CapturedResponse> {
  const [executable, ...arguments_] = config.capture.command;
  const result = await execute({
    executable,
    arguments: arguments_,
    cwd: config.capture.cwd,
    timeoutMs: config.capture.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    environment: {
      ...process.env,
      ATM_APP_VERSION: release.version,
    },
  });
  if (result.exitCode !== 0) {
    throw new CaptureCommandError(
      `Capture command failed with exit code ${result.exitCode}: ${result.stderr.trim() || "no error output"}`,
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(result.stdout);
  } catch {
    throw new CaptureCommandError("Capture command did not return JSON on stdout.");
  }

  const response = CapturedResponseSchema.parse(value);
  if (response.request.appVersion !== release.version) {
    throw new CaptureCommandError(
      `Capture command returned app version ${response.request.appVersion ?? "null"}; expected ${release.version}.`,
    );
  }
  const actualHash = createHash("sha256").update(response.body).digest("hex");
  if (actualHash !== response.sha256) {
    throw new CaptureCommandError("Capture command returned a body with an invalid SHA-256.");
  }
  return response;
}
