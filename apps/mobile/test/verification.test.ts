import { describe, expect, it } from "vitest";

import { parseVerificationResponse } from "../src/api/verification.js";

describe("parseVerificationResponse", () => {
  it("accepts a status known to release 1.0", () => {
    expect(
      parseVerificationResponse({
        id: "verification_123",
        status: "PENDING",
        updatedAt: "2026-07-14T10:30:00.000Z",
      }).status,
    ).toBe("PENDING");
  });

  it("supports MANUAL_REVIEW natively in release 1.2", () => {
    expect(
      parseVerificationResponse({
        id: "verification_123",
        status: "MANUAL_REVIEW",
        updatedAt: "2026-07-14T10:30:00.000Z",
      }).status,
    ).toBe("MANUAL_REVIEW");
  });
});
