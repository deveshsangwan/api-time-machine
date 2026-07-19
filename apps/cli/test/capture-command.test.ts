import { createHash } from "node:crypto";

import { ClientReleaseSchema } from "@atm/contracts";
import { describe, expect, it } from "vitest";

import {
  CaptureCommandError,
  captureConfiguredResponse,
} from "../src/capture-command.js";
import type { ResolvedProjectConfiguration } from "../src/project-config.js";

const release = ClientReleaseSchema.parse({
  platform: "android-react-native",
  version: "1.2.0",
  gitTag: "app-v1.2.0",
  activeShare: 1,
  supported: true,
  source: "test",
  observedAt: "2026-07-14T00:00:00.000Z",
  testCommand: "pnpm test -- --runInBand",
});
const config: ResolvedProjectConfiguration = {
  projectRoot: "/repo",
  releasesManifest: "/repo/releases.json",
  capture: { command: ["node", "capture.mjs"], cwd: "/repo" },
  clientRepository: "/repo",
  repositoryCache: "/repo/.api-time-machine/repositories",
  worktreesRoot: "/repo/.worktrees",
  probe: { command: ["node", "probe.mjs"], cwd: "/repo" },
  runsRoot: "/repo/runs",
};

describe("configured capture command", () => {
  it("validates the exact response returned by the attached repository", async () => {
    const body = JSON.stringify({ status: "MANUAL_REVIEW" });
    const response = await captureConfiguredResponse(config, release, async (input) => {
      expect(input.environment.ATM_APP_VERSION).toBe("1.2.0");
      return {
        exitCode: 0,
        stderr: "",
        stdout: JSON.stringify({
          request: { method: "GET", url: "/verification/1", appVersion: "1.2.0" },
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body,
          sha256: createHash("sha256").update(body).digest("hex"),
          capturedAt: "2026-07-14T00:00:00.000Z",
        }),
      };
    });

    expect(response.body).toBe(body);
  });

  it("rejects a capture whose declared hash does not match its body", async () => {
    await expect(
      captureConfiguredResponse(config, release, async () => ({
        exitCode: 0,
        stderr: "",
        stdout: JSON.stringify({
          request: { method: "GET", url: "/verification/1", appVersion: "1.2.0" },
          statusCode: 200,
          headers: {},
          body: "{}",
          sha256: "0".repeat(64),
          capturedAt: "2026-07-14T00:00:00.000Z",
        }),
      })),
    ).rejects.toThrow(CaptureCommandError);
  });
});
