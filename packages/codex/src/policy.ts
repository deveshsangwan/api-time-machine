import type {
  CapturedResponse,
  ChangeProfile,
  ClientResult,
  RepairProposal,
} from "@atm/contracts";

import { CodexWorkflowError } from "./errors.js";
import { findLegacyProjectionPolicy } from "./knowledge.js";

function assertSafeRepositoryPath(path: string, prefix: string): void {
  if (
    path.startsWith("/") ||
    path.includes("..") ||
    !path.startsWith(prefix)
  ) {
    throw new CodexWorkflowError(
      "policy",
      `Model proposed an out-of-scope repository path: ${path}`,
    );
  }
}

function parseResponseBody(response: CapturedResponse): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(response.body);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("response body is not an object");
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new CodexWorkflowError(
      "grounding",
      "Captured response body is not a JSON object",
      { cause: error },
    );
  }
}

export function validateGroundedChange(
  input: { diff: string; capturedResponse: CapturedResponse },
  change: ChangeProfile,
): ChangeProfile {
  assertSafeRepositoryPath(change.sourceFile, "apps/backend/");

  const body = parseResponseBody(input.capturedResponse);
  const emittedValue = body[change.field];
  if (typeof emittedValue !== "string" || !change.newValues.includes(emittedValue)) {
    throw new CodexWorkflowError(
      "grounding",
      `ChangeProfile field ${change.field} is not grounded in the captured response`,
      { retryable: true },
    );
  }

  for (const value of change.newValues) {
    if (
      !change.proposedValues.includes(value) ||
      change.previousValues.includes(value) ||
      !input.diff.includes(value)
    ) {
      throw new CodexWorkflowError(
        "grounding",
        `New enum value ${value} is not grounded in the diff and value sets`,
        { retryable: true },
      );
    }
  }

  const [endpointMethod, endpointPath] = change.endpoint.trim().split(/\s+/, 2);
  const endpointRoot = endpointPath?.split("/:")[0];
  if (
    endpointMethod !== input.capturedResponse.request.method ||
    !endpointRoot ||
    !input.capturedResponse.request.url.startsWith(endpointRoot)
  ) {
    throw new CodexWorkflowError(
      "grounding",
      "ChangeProfile endpoint is not grounded in the captured request",
      { retryable: true },
    );
  }

  return change;
}

function extractUnifiedDiffPaths(patch: string): string[] {
  const paths = new Set<string>();
  for (const line of patch.split("\n")) {
    if (!line.startsWith("+++ ")) continue;
    const rawPath = line.slice(4).trim().split(/\s+/, 1)[0];
    if (!rawPath || rawPath === "/dev/null") continue;
    paths.add(rawPath.startsWith("b/") ? rawPath.slice(2) : rawPath);
  }
  return [...paths];
}

function assertPatchPaths(input: {
  patch: string;
  allowedPaths: Set<string>;
  requiredPrefix: string;
  label: string;
}): void {
  const paths = extractUnifiedDiffPaths(input.patch);
  if (paths.length === 0) {
    throw new CodexWorkflowError(
      "policy",
      `${input.label} is not a parseable unified diff`,
    );
  }

  for (const path of paths) {
    assertSafeRepositoryPath(path, input.requiredPrefix);
    if (!input.allowedPaths.has(path)) {
      throw new CodexWorkflowError(
        "policy",
        `${input.label} changed ${path} without listing it in allowedPaths`,
      );
    }
  }
}

function evidenceMentionsNewValue(
  failures: ClientResult[],
  newValues: string[],
): boolean {
  const evidence = JSON.stringify(failures).toUpperCase();
  return newValues.some((value) => evidence.includes(value.toUpperCase()));
}

export function validateRepairPolicy(
  input: { change: ChangeProfile; failures: ClientResult[] },
  proposal: RepairProposal,
): RepairProposal {
  const incompatible = input.failures.filter(
    (result) => result.status === "incompatible",
  );
  if (incompatible.length === 0 || !evidenceMentionsNewValue(incompatible, input.change.newValues)) {
    throw new CodexWorkflowError(
      "grounding",
      "Candidate Repair is not grounded in an incompatible ClientResult",
      { retryable: true },
    );
  }

  const policy = findLegacyProjectionPolicy(input.change);
  if (!policy) {
    throw new CodexWorkflowError(
      "policy",
      "ChangeProfile does not match an approved Legacy Projection policy",
    );
  }
  if (!proposal.legacyProjection) {
    throw new CodexWorkflowError(
      "policy",
      "Candidate Repair omitted the approved Legacy Projection",
      { retryable: true },
    );
  }

  const projection = proposal.legacyProjection;
  if (
    projection.from !== policy.from ||
    projection.to !== policy.to ||
    projection.capabilityThreshold !== policy.capabilityThreshold
  ) {
    throw new CodexWorkflowError(
      "policy",
      "Candidate Repair does not match the approved Legacy Projection policy",
    );
  }

  const normalizedJustification = projection.justification.toUpperCase();
  if (
    projection.justification.length < 48 ||
    !normalizedJustification.includes(policy.from) ||
    !normalizedJustification.includes(policy.to)
  ) {
    throw new CodexWorkflowError(
      "policy",
      "Legacy Projection lacks a concrete semantic justification",
    );
  }

  const allowedPaths = new Set(proposal.allowedPaths);
  if (allowedPaths.size !== proposal.allowedPaths.length) {
    throw new CodexWorkflowError("policy", "allowedPaths contains duplicates");
  }
  for (const path of allowedPaths) {
    assertSafeRepositoryPath(path, "apps/backend/");
  }

  assertPatchPaths({
    patch: proposal.patch,
    allowedPaths,
    requiredPrefix: policy.requiredBackendPathPrefix,
    label: "Backend patch",
  });
  assertPatchPaths({
    patch: proposal.regressionTestPatch,
    allowedPaths,
    requiredPrefix: policy.requiredTestPathPrefix,
    label: "Regression-test patch",
  });

  for (const requiredText of [policy.from, policy.to, policy.capabilityThreshold]) {
    if (!proposal.patch.includes(requiredText)) {
      throw new CodexWorkflowError(
        "policy",
        `Backend patch does not preserve required policy value ${requiredText}`,
        { retryable: true },
      );
    }
  }

  return proposal;
}
