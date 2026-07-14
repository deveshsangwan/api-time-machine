import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { captureVerificationResponse } from "../src/capture.js";

describe("captureVerificationResponse", () => {
  it("captures the exact response bytes emitted by the real route", async () => {
    const response = await captureVerificationResponse({ appVersion: "1.2.0" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(
      '{"id":"verification_123","status":"MANUAL_REVIEW","updatedAt":"2026-07-14T10:30:00.000Z"}',
    );
    expect(JSON.parse(response.body)).toMatchObject({
      id: "verification_123",
      status: "MANUAL_REVIEW",
    });
    expect(response.sha256).toBe(
      createHash("sha256").update(response.body).digest("hex"),
    );
    expect(response.headers["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.headers["content-length"]).toBe(
      Buffer.byteLength(response.body).toString(),
    );
  });

  it("projects manual review to pending for the 1.0.0 legacy client", async () => {
    const response = await captureVerificationResponse({ appVersion: "1.0.0" });

    expect(JSON.parse(response.body)).toMatchObject({
      id: "verification_123",
      status: "PENDING",
    });
  });

  it("projects manual review to pending for the 1.1.0 legacy client", async () => {
    const response = await captureVerificationResponse({ appVersion: "1.1.0" });

    expect(JSON.parse(response.body)).toMatchObject({ status: "PENDING" });
  });

  it("uses the safest legacy representation when the version header is missing", async () => {
    const response = await captureVerificationResponse({ appVersion: null });

    expect(JSON.parse(response.body)).toMatchObject({ status: "PENDING" });
  });

  it.each(["not-a-version", "1.2.0-beta.1"])(
    "uses the safest legacy representation for invalid version %s",
    async (appVersion) => {
      const response = await captureVerificationResponse({ appVersion });

      expect(JSON.parse(response.body)).toMatchObject({ status: "PENDING" });
    },
  );

  it("preserves stable SemVer capability when build metadata is present", async () => {
    const response = await captureVerificationResponse({
      appVersion: "1.2.0+build.7",
    });

    expect(JSON.parse(response.body)).toMatchObject({
      status: "MANUAL_REVIEW",
    });
  });

  it("safely captures a verification ID containing reserved URL characters", async () => {
    const response = await captureVerificationResponse({
      appVersion: "1.2.0",
      verificationId: "customer/123?mode=full",
    });

    expect(response.request.url).toBe(
      "/verification/customer%2F123%3Fmode%3Dfull",
    );
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      id: "customer/123?mode=full",
    });
  });

  it.each([
    ["0.9.9", "PENDING"],
    ["1.1.99", "PENDING"],
    ["1.2.0", "MANUAL_REVIEW"],
    ["1.2.1", "MANUAL_REVIEW"],
    ["2.0.0", "MANUAL_REVIEW"],
  ])(
    "applies the 1.2.0 capability threshold to stable version %s",
    async (appVersion, expectedStatus) => {
      const response = await captureVerificationResponse({ appVersion });

      expect(JSON.parse(response.body)).toMatchObject({
        status: expectedStatus,
      });
    },
  );
});
