import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createSimulatedMobileProjectDataset } from "../src/index.js";

describe("simulated mobile project history", () => {
  const observedAt = "2026-07-14T12:00:00.000Z";
  const dataset = createSimulatedMobileProjectDataset({ observedAt });

  it("is explicitly labeled synthetic and never presented as production telemetry", () => {
    expect(dataset.simulation).toBe(true);
    expect(dataset.source).toContain("synthetic");
    expect(dataset.warning.toLowerCase()).toContain("not");
    expect(dataset.warning.toLowerCase()).toContain("production telemetry");
    expect(dataset.clientResults.every((result) => result.release.gitTag.startsWith("simulated-"))).toBe(true);
  });

  it("contains a normalized seven-day adoption history", () => {
    expect(dataset.adoptionHistory).toHaveLength(7);
    for (const snapshot of dataset.adoptionHistory) {
      const total = Object.values(snapshot.shares).reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(1, 10);
    }
    expect(dataset.adoptionHistory.at(-1)?.shares).toEqual({
      "1.0.0": 0.18,
      "1.1.0": 0.27,
      "1.2.0": 0.55,
    });
  });

  it("hashes the exact captured bytes used by every compatibility result", () => {
    const expected = createHash("sha256")
      .update(dataset.capturedResponse.body)
      .digest("hex");
    expect(dataset.capturedResponse.sha256).toBe(expected);
    expect(dataset.clientResults.every((result) => result.responseSha256 === expected)).toBe(true);
  });
});
