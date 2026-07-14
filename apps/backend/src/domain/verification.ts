import type { VerificationResponse } from "@atm/contracts";

const STABLE_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const MANUAL_REVIEW_CAPABILITY_THRESHOLD = [1n, 2n, 0n] as const;

function parseStableVersion(
  version: string,
): readonly [major: bigint, minor: bigint, patch: bigint] | null {
  const match = STABLE_VERSION_PATTERN.exec(version);
  if (!match) return null;

  return [BigInt(match[1]!), BigInt(match[2]!), BigInt(match[3]!)];
}

function supportsManualReview(version: string | string[] | undefined): boolean {
  if (typeof version !== "string") return false;

  const parsedVersion = parseStableVersion(version);
  if (!parsedVersion) return false;

  for (let index = 0; index < parsedVersion.length; index += 1) {
    const value = parsedVersion[index]!;
    const threshold = MANUAL_REVIEW_CAPABILITY_THRESHOLD[index]!;
    if (value !== threshold) return value > threshold;
  }

  return true;
}

export function getVerificationResponse(
  id: string,
  appVersion: string | string[] | undefined,
): VerificationResponse {
  return {
    id,
    status: supportsManualReview(appVersion) ? "MANUAL_REVIEW" : "PENDING",
    updatedAt: "2026-07-14T10:30:00.000Z",
  };
}
