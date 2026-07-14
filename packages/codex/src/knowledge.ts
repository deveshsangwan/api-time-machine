export interface LegacyProjectionPolicy {
  responseType: string;
  field: string;
  from: string;
  to: string;
  capabilityThreshold: string;
  rationale: string;
  requiredBackendPathPrefix: string;
  requiredTestPathPrefix: string;
}

export const MOBILE_COMPATIBILITY_KNOWLEDGE = {
  project: "API Time Machine simulated identity-verification mobile project",
  simulation: true,
  endpoint: "GET /verification/:id",
  responseType: "VerificationResponse",
  appVersionHeader: "x-app-version",
  releases: [
    {
      version: "1.0.0",
      behavior: "Strict Zod enum rejects MANUAL_REVIEW",
    },
    {
      version: "1.1.0",
      behavior: "Unknown status falls back without parser rejection",
    },
    {
      version: "1.2.0",
      behavior: "MANUAL_REVIEW is supported natively",
    },
  ],
  policies: [
    {
      responseType: "VerificationResponse",
      field: "status",
      from: "MANUAL_REVIEW",
      to: "PENDING",
      capabilityThreshold: "1.2.0",
      rationale:
        "Manual review is unresolved verification work and is therefore a refinement of the legacy PENDING state, not a verified or rejected outcome.",
      requiredBackendPathPrefix: "apps/backend/src/",
      requiredTestPathPrefix: "apps/backend/test/",
    },
  ] satisfies LegacyProjectionPolicy[],
  languageRules: [
    "Say parser rejection unless evidence proves an application crash.",
    "Say configured installation share because the fixture is not live telemetry.",
    "Call a repair a Candidate Repair until deterministic verification passes.",
    "Never invent a legacy projection that is absent from the policy registry.",
  ],
} as const;

export function findLegacyProjectionPolicy(input: {
  responseType: string;
  field: string;
  newValues: string[];
}): LegacyProjectionPolicy | undefined {
  return MOBILE_COMPATIBILITY_KNOWLEDGE.policies.find(
    (policy) =>
      policy.responseType === input.responseType &&
      policy.field === input.field &&
      input.newValues.includes(policy.from),
  );
}

export function renderKnowledgeForPrompt(): string {
  return JSON.stringify(MOBILE_COMPATIBILITY_KNOWLEDGE, null, 2);
}
