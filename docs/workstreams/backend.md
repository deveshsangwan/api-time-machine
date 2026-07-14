# Senior backend workstream

## Assignment

- Branch: `workstream/backend`
- Owned path: `apps/backend/**`
- Do not edit: shared contracts, client applications, Codex workflow, orchestrator, CLI, root configuration, or CI.

Read `docs/PRD.md`, `CONTEXT.md`, `docs/adr/0001-contract-first-workstreams.md`, and `docs/WORKSTREAMS.md` before editing.

## Objective

Turn the scaffolded Fastify route into a credible backend compatibility module while preserving the exact pre-repair and post-repair behaviors needed by the red-to-green demonstration.

## Existing interface

`captureVerificationResponse` is the module interface. It accepts an app version and returns a validated `CapturedResponse`. Callers must not need to understand Fastify injection, header normalization, hashing, or server lifecycle.

## Required work

1. Keep real route execution as the only source of a Captured Response.
2. Add deterministic application-version parsing and a capability threshold for release 1.2.0.
3. Implement the safe Legacy Projection: emit `PENDING` for releases below 1.2.0 and for missing or invalid version headers; emit `MANUAL_REVIEW` for capable releases.
4. Preserve the original breaking behavior as an identifiable Git revision so integration can demonstrate red before repair.
5. Add the Node.js regression contract proving that the repair is red against the breaking revision and green against the repaired revision.
6. Ensure captured status, headers, bytes, and SHA-256 come from the actual Fastify response.
7. Keep timestamps and business fixtures deterministic where evidence comparisons require it.

## Acceptance criteria

- Release 1.0.0 receives `PENDING` after repair.
- Release 1.1.0 receives `PENDING` after repair.
- Release 1.2.0 receives `MANUAL_REVIEW`.
- Missing, malformed, and prerelease version headers use the safest legacy representation.
- The capture test proves the stored hash matches the actual response body.
- Tests cover both the breaking revision's behavior and the repaired behavior.
- `pnpm --filter @atm/backend typecheck` passes.
- `pnpm --filter @atm/backend test` passes.

## Contract-change protocol

If `CapturedResponse` cannot express required evidence, stop and propose a `contract/<topic>` branch from `main`. Do not change `packages/contracts` on this branch.

## Return handoff

Report the commits, test commands and results, the exact breaking revision, the exact repaired revision, any version-header assumptions, and unresolved risks. Do not merge your own branch.

## Suggested skills

- `tdd` for the red-to-green serialization contract.
- `codebase-design` if the capture interface starts leaking Fastify or version-policy details.
- `diagnosing-bugs` only for a reproducible failing behavior that resists the normal test loop.
