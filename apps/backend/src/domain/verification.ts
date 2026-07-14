import type { VerificationResponse } from "@atm/contracts";

export function getVerificationResponse(id: string): VerificationResponse {
  return {
    id,
    status: "MANUAL_REVIEW",
    updatedAt: "2026-07-14T10:30:00.000Z",
  };
}
