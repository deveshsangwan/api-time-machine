# Frontend and app workstream

## Assignment

- Branch: `workstream/client-ui`
- Owned paths: `apps/mobile/**`, `apps/dashboard/**`
- Do not edit: shared contracts, backend, Codex workflow, orchestrator, CLI, root configuration, or CI.

Read `docs/PRD.md`, `CONTEXT.md`, `docs/adr/0001-contract-first-workstreams.md`, and `docs/WORKSTREAMS.md` before editing.

## Objective

Create honest React Native release history with real production parser behavior, then connect the focused dashboard to real `CompatibilityRun` data without building a broad product UI.

## Existing interfaces

The client seam is `parseVerificationResponse`: a Historical Release's production data-layer parser consumes unknown input and either returns its normalized response or rejects it. The dashboard consumes only `CompatibilityRun` and must not learn runner or Git details.

## Required work

1. Treat the scaffold commit tagged `app-v1.0.0` as the strict historical release.
2. Create release 1.1.0 as a separate commit whose production Zod parser maps unknown enum values to an explicit fallback; test and tag it `app-v1.1.0`.
3. Create release 1.2.0 as a later commit whose production schema supports `MANUAL_REVIEW` natively; test and tag it `app-v1.2.0`.
4. Preserve a stable parser entry point across all three tags so integration can generate the same shape of Compatibility Probe.
5. Ensure every tag contains its matching production parser tests and application version metadata.
6. Replace dashboard scaffold rows with a `CompatibilityRun` input adapter or fixture that has the exact shared shape.
7. Present the Client Survival Matrix, configured installation shares, evidence links, Blast Radius, and before/after states in one focused view.
8. Clearly label sample adoption data and distinguish parser rejection from application crash.

## Acceptance criteria

- `app-v1.0.0` rejects `MANUAL_REVIEW`.
- `app-v1.1.0` accepts the response through an explicit unknown fallback.
- `app-v1.2.0` accepts `MANUAL_REVIEW` natively.
- All tags are annotated and point to distinct, inspectable commits.
- The parser entry point remains stable across tags.
- The dashboard renders incompatible, compatible, and inconclusive states from `CompatibilityRun` data.
- The dashboard remains usable at desktop and narrow viewport widths.
- `pnpm --filter @atm/mobile typecheck` and `test` pass at the branch head.
- `pnpm --filter @atm/dashboard typecheck` and `build` pass.

## Contract-change protocol

If `CompatibilityRun` lacks a presentation-critical fact, stop and propose a `contract/<topic>` branch from `main`. Do not change `packages/contracts` on this branch.

## Return handoff

Report the commits and tag SHAs, parser behavior per tag, test/build commands and results, dashboard screenshots or recording, accessibility limitations, and unresolved risks. Do not rewrite tag history after handing it off.

## Suggested skills

- `tdd` for the three historical parser behaviors.
- `design-taste-frontend` after real matrix data renders correctly.
- `vercel:react-best-practices` after editing the dashboard's React implementation.
