import { describe, expect, it } from "vitest";

import type { CompatibilityRun } from "@atm/contracts";

import {
  compatibilityExitCode,
  renderSurvivalMatrix,
} from "../src/index.js";

const run: CompatibilityRun = {
  runId: "run_123",
  status: "incompatible",
  blastRadius: 0.18,
  startedAt: "2026-07-14T10:30:00.000Z",
  completedAt: "2026-07-14T10:30:01.000Z",
  clients: [
    {
      release: {
        platform: "android-react-native",
        version: "1.0.0",
        gitTag: "app-v1.0.0",
        activeShare: 0.18,
        supported: true,
        source: "hackathon-sample",
        observedAt: "2026-07-14T00:00:00.000Z",
        testCommand: "pnpm test -- --runInBand",
      },
      status: "incompatible",
      responseSha256: "a".repeat(64),
      durationMs: 10,
      summary: "Strict enum rejected MANUAL_REVIEW",
      evidence: {},
    },
  ],
};

describe("compatibility reporting", () => {
  it("maps every deterministic gate outcome to its documented process code", () => {
    expect(compatibilityExitCode("compatible")).toBe(0);
    expect(compatibilityExitCode("incompatible")).toBe(1);
    expect(compatibilityExitCode("inconclusive")).toBe(2);
  });

  it("renders the status, configured blast radius, and client evidence summary", () => {
    expect(renderSurvivalMatrix(run)).toContain("Gate: INCOMPATIBLE | Blast radius: 18.00%");
    expect(renderSurvivalMatrix(run)).toContain(
      "Strict enum rejected MANUAL_REVIEW",
    );
  });
});
