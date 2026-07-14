# Compatibility policy

## Decision boundary

API Time Machine has two layers:

- Deterministic: capture exact backend bytes, hash the response, run each historical production parser/test, classify results, and calculate impact from supplied shares.
- Probabilistic: identify the semantic API change, summarize grounded evidence, and propose a narrowly scoped Candidate Repair.

Only the deterministic layer may decide compatibility and verification.

## Simulated identity-verification scenario

All values below are hackathon fixtures, not production telemetry.

| Mobile release | Configured share | Parser behavior for `MANUAL_REVIEW` |
| --- | ---: | --- |
| 1.0.0 | 18% | Strict enum rejects the value |
| 1.1.0 | 27% | Unknown-value fallback keeps parsing |
| 1.2.0 | 55% | Supports the value natively |

The synthetic endpoint is `GET /verification/:id`, response type `VerificationResponse`, field `status`, with client capability header `x-app-version`.

## Approved legacy projection

For `VerificationResponse.status` only:

- New value: `MANUAL_REVIEW`
- Legacy projection: `PENDING`
- Capability threshold: app version `1.2.0`
- Backend source scope: `apps/backend/src/`
- Regression-test scope: `apps/backend/test/`

This projection is semantically truthful because manual review is unresolved verification work: it refines the legacy `PENDING` state and must never be projected as `VERIFIED` or `REJECTED`.

Reject a proposal when the incompatible evidence does not mention the new value, the projection differs from this registry, the justification is vague, a path escapes backend source/test scope, or the patch omits the from/to/threshold values.
