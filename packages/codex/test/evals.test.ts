import { describe, expect, it } from "vitest";

import { runDeterministicEvaluation } from "../src/index.js";

describe("deterministic MLOps evaluation", () => {
  it("passes grounding, retry, repair, and scope-isolation cases", async () => {
    const report = await runDeterministicEvaluation();

    expect(report.simulation).toBe(true);
    expect(report.failed).toBe(0);
    expect(report.passed).toBe(4);
    expect(report.cases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "malformed output retries once", attempts: 2 }),
        expect.objectContaining({ name: "out-of-scope mobile edit is rejected", passed: true }),
      ]),
    );
  });
});
