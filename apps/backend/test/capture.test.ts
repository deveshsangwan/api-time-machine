import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { captureVerificationResponse } from "../src/capture.js";

describe("captureVerificationResponse", () => {
  it("captures the exact response bytes emitted by the real route", async () => {
    const response = await captureVerificationResponse({ appVersion: "1.2.0" });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      id: "verification_123",
      status: "MANUAL_REVIEW",
    });
    expect(response.sha256).toBe(
      createHash("sha256").update(response.body).digest("hex"),
    );
  });
});
