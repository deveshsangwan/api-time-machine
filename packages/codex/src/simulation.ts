import { createHash } from "node:crypto";

import type {
  CapturedResponse,
  ChangeProfile,
  ClientResult,
  RepairProposal,
} from "@atm/contracts";

export interface SimulatedAdoptionSnapshot {
  observedAt: string;
  shares: Record<"1.0.0" | "1.1.0" | "1.2.0", number>;
}

export interface SimulatedMobileProjectDataset {
  simulation: true;
  source: "api-time-machine-synthetic-mobile-project";
  generatedAt: string;
  warning: string;
  adoptionHistory: SimulatedAdoptionSnapshot[];
  diff: string;
  capturedResponse: CapturedResponse;
  clientResults: ClientResult[];
  expectedChange: ChangeProfile;
  expectedRepair: RepairProposal;
}

const RESPONSE_BODY =
  '{"id":"verification_123","status":"MANUAL_REVIEW","updatedAt":"2026-07-14T10:30:00.000Z"}';

const ADOPTION_SERIES: SimulatedAdoptionSnapshot["shares"][] = [
  { "1.0.0": 0.31, "1.1.0": 0.34, "1.2.0": 0.35 },
  { "1.0.0": 0.29, "1.1.0": 0.34, "1.2.0": 0.37 },
  { "1.0.0": 0.27, "1.1.0": 0.33, "1.2.0": 0.4 },
  { "1.0.0": 0.24, "1.1.0": 0.32, "1.2.0": 0.44 },
  { "1.0.0": 0.22, "1.1.0": 0.3, "1.2.0": 0.48 },
  { "1.0.0": 0.2, "1.1.0": 0.29, "1.2.0": 0.51 },
  { "1.0.0": 0.18, "1.1.0": 0.27, "1.2.0": 0.55 },
];

function release(
  version: "1.0.0" | "1.1.0" | "1.2.0",
  activeShare: number,
  observedAt: string,
) {
  return {
    platform: "android-react-native" as const,
    version,
    gitTag: `simulated-app-v${version}`,
    activeShare,
    supported: true,
    source: "synthetic mobile adoption fixture; not production telemetry",
    observedAt,
    testCommand: "simulated production-parser compatibility probe",
  };
}

function daysBefore(isoTimestamp: string, days: number): string {
  return new Date(new Date(isoTimestamp).getTime() - days * 86_400_000).toISOString();
}

export function createSimulatedMobileProjectDataset(
  options: { observedAt?: string } = {},
): SimulatedMobileProjectDataset {
  const generatedAt = options.observedAt ?? new Date().toISOString();
  const sha256 = createHash("sha256").update(RESPONSE_BODY).digest("hex");
  const capturedResponse: CapturedResponse = {
    request: {
      method: "GET",
      url: "/verification/verification_123",
      appVersion: "1.0.0",
    },
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: RESPONSE_BODY,
    sha256,
    capturedAt: generatedAt,
  };
  const latestShares = ADOPTION_SERIES.at(-1)!;
  const releases = {
    "1.0.0": release("1.0.0", latestShares["1.0.0"], generatedAt),
    "1.1.0": release("1.1.0", latestShares["1.1.0"], generatedAt),
    "1.2.0": release("1.2.0", latestShares["1.2.0"], generatedAt),
  };
  const clientResults: ClientResult[] = [
    {
      release: releases["1.0.0"],
      status: "incompatible",
      responseSha256: sha256,
      durationMs: 184,
      summary: "Strict production enum rejected MANUAL_REVIEW",
      evidence: {
        stderr: "ZodError: Invalid enum value MANUAL_REVIEW",
        sourceFile: "apps/mobile/src/api/verification.ts",
        sourceLine: 5,
      },
    },
    {
      release: releases["1.1.0"],
      status: "compatible",
      responseSha256: sha256,
      durationMs: 171,
      summary: "Unknown-value fallback preserved parser execution",
      evidence: { sourceFile: "apps/mobile/src/api/verification.ts" },
    },
    {
      release: releases["1.2.0"],
      status: "compatible",
      responseSha256: sha256,
      durationMs: 166,
      summary: "Production parser supports MANUAL_REVIEW natively",
      evidence: { sourceFile: "apps/mobile/src/api/verification.ts" },
    },
  ];
  const expectedChange: ChangeProfile = {
    endpoint: "GET /verification/:id",
    responseType: "VerificationResponse",
    field: "status",
    changeType: "enum_value_added",
    previousValues: ["VERIFIED", "PENDING", "REJECTED"],
    proposedValues: ["VERIFIED", "PENDING", "MANUAL_REVIEW", "REJECTED"],
    newValues: ["MANUAL_REVIEW"],
    sourceFile: "apps/backend/src/domain/verification.ts",
  };
  const expectedRepair: RepairProposal = {
    summary:
      "Project MANUAL_REVIEW to PENDING below app version 1.2.0 while preserving the native value for capable clients.",
    patch: `diff --git a/apps/backend/src/domain/verification.ts b/apps/backend/src/domain/verification.ts
--- a/apps/backend/src/domain/verification.ts
+++ b/apps/backend/src/domain/verification.ts
@@ -1,2 +1,5 @@
+const MANUAL_REVIEW_THRESHOLD = "1.2.0";
+const legacyStatus = "PENDING";
+const capableStatus = "MANUAL_REVIEW";
 export function getVerificationResponse() { /* version-aware projection */ }`,
    regressionTestPatch: `diff --git a/apps/backend/test/capture.test.ts b/apps/backend/test/capture.test.ts
--- a/apps/backend/test/capture.test.ts
+++ b/apps/backend/test/capture.test.ts
@@ -1,1 +1,3 @@
+it("projects MANUAL_REVIEW to PENDING below 1.2.0", async () => {});
+it("preserves MANUAL_REVIEW at 1.2.0", async () => {});`,
    allowedPaths: [
      "apps/backend/src/domain/verification.ts",
      "apps/backend/test/capture.test.ts",
    ],
    legacyProjection: {
      from: "MANUAL_REVIEW",
      to: "PENDING",
      capabilityThreshold: "1.2.0",
      justification:
        "MANUAL_REVIEW is unresolved verification work, so representing it as PENDING for legacy clients preserves truthful business semantics.",
    },
  };

  return {
    simulation: true,
    source: "api-time-machine-synthetic-mobile-project",
    generatedAt,
    warning:
      "Synthetic hackathon evidence. Do not describe these adoption shares as live production telemetry.",
    adoptionHistory: ADOPTION_SERIES.map((shares, index) => ({
      observedAt: daysBefore(generatedAt, ADOPTION_SERIES.length - 1 - index),
      shares: { ...shares },
    })),
    diff: `diff --git a/apps/backend/src/domain/verification.ts b/apps/backend/src/domain/verification.ts
--- a/apps/backend/src/domain/verification.ts
+++ b/apps/backend/src/domain/verification.ts
@@ -1,3 +1,3 @@
-type Status = "VERIFIED" | "PENDING" | "REJECTED";
+type Status = "VERIFIED" | "PENDING" | "MANUAL_REVIEW" | "REJECTED";`,
    capturedResponse,
    clientResults,
    expectedChange,
    expectedRepair,
  };
}
