import { describe, expect, it } from "vitest";

import { createCodexWorkflow, type CodexAdapter } from "../src/index.js";

describe("createCodexWorkflow", () => {
  it("validates structured analysis before returning it", async () => {
    const adapter: CodexAdapter = {
      async run() {
        return {
          endpoint: "GET /verification/:id",
          responseType: "VerificationResponse",
          field: "status",
          changeType: "enum_value_added",
          previousValues: ["VERIFIED", "PENDING", "REJECTED"],
          proposedValues: [
            "VERIFIED",
            "PENDING",
            "MANUAL_REVIEW",
            "REJECTED",
          ],
          newValues: ["MANUAL_REVIEW"],
          sourceFile: "apps/backend/src/domain/verification.ts",
        };
      },
    };

    const workflow = createCodexWorkflow(adapter);
    const change = await workflow.analyzeChange({
      diff: "+ MANUAL_REVIEW",
      capturedResponse: {
        request: {
          method: "GET",
          url: "/verification/verification_123",
          appVersion: "1.0.0",
        },
        statusCode: 200,
        headers: {},
        body: '{"status":"MANUAL_REVIEW"}',
        sha256: "0".repeat(64),
        capturedAt: "2026-07-14T10:30:00.000Z",
      },
    });

    expect(change.newValues).toEqual(["MANUAL_REVIEW"]);
  });
});
