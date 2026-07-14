import { describe, expect, it } from "vitest";

import type {
  CapturedResponse,
  ClientRelease,
  ClientResult,
} from "@atm/contracts";

import { runCompatibilityCheck } from "../src/index.js";

const releases: ClientRelease[] = [
  {
    platform: "android-react-native",
    version: "1.0.0",
    gitTag: "app-v1.0.0",
    activeShare: 0.18,
    supported: true,
    source: "hackathon-sample",
    observedAt: "2026-07-14T00:00:00.000Z",
    testCommand: "pnpm test -- --runInBand",
  },
  {
    platform: "android-react-native",
    version: "1.2.0",
    gitTag: "app-v1.2.0",
    activeShare: 0.82,
    supported: true,
    source: "hackathon-sample",
    observedAt: "2026-07-14T00:00:00.000Z",
    testCommand: "pnpm test -- --runInBand",
  },
];

const response: CapturedResponse = {
  request: {
    method: "GET",
    url: "/verification/verification_123",
    appVersion: null,
  },
  statusCode: 200,
  headers: {},
  body: '{"status":"MANUAL_REVIEW"}',
  sha256: "0".repeat(64),
  capturedAt: "2026-07-14T10:30:00.000Z",
};

describe("runCompatibilityCheck", () => {
  it("classifies the run and calculates blast radius through one interface", async () => {
    let tick = 0;
    const run = await runCompatibilityCheck(
      { runId: "run_test", releases },
      {
        async captureResponse(release) {
          return {
            ...response,
            request: { ...response.request, appVersion: release.version },
          };
        },
        async runClient(release, captured): Promise<ClientResult> {
          const incompatible = release.version === "1.0.0";
          return {
            release,
            status: incompatible ? "incompatible" : "compatible",
            responseSha256: captured.sha256,
            durationMs: 10,
            summary: incompatible ? "Strict enum rejected" : "Parsed",
            evidence: {},
          };
        },
        now() {
          return new Date(`2026-07-14T10:30:0${tick++}.000Z`);
        },
      },
    );

    expect(run.status).toBe("incompatible");
    expect(run.blastRadius).toBe(0.18);
    expect(run.clients).toHaveLength(2);
  });
});
