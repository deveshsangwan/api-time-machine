# Client and Presentation Handoff

## Branch and commits

- Branch: `workstream/client-ui`
- Release 1.1 commit: `6d3bdad434fcd5135a8680a409a9e3870f463fc2`
- Release 1.2 commit: `ea2e0f8867036954c14def84a715e6387752af99`
- Dashboard commit: `0bb3361d0a0d9ae613a4718af9f802ac1de6bfaf`

## Historical releases

| Tag | Commit | Production parser behavior |
| --- | --- | --- |
| `app-v1.0.0` | `c089c0a` | Strict Zod enum rejects `MANUAL_REVIEW`. |
| `app-v1.1.0` | `6d3bdad` | Unknown status is explicitly normalized to `PENDING`. |
| `app-v1.2.0` | `ea2e0f8` | `MANUAL_REVIEW` is supported natively. |

All tags are annotated, immutable local Git tags. The stable compatibility-probe
entry point is `parseVerificationResponse` in
`apps/mobile/src/api/verification.ts`. Every release has matching parser tests
and an Expo app version in `apps/mobile/app.json`.

## Dashboard delivery

Raüh renders a typed `CompatibilityRun` fixture by default and accepts a real
`run` prop from integration. It also accepts an optional `beforeRun` prop for a
before-and-after Candidate Repair view. The interface displays gate status,
Client Survival Matrix, release tags, configured installation shares, source
pointers, Blast Radius, and compatible/incompatible/inconclusive states.

The local dashboard responds at `http://localhost:5173`.

## Checks

Passed:

```text
pnpm --filter @atm/mobile typecheck
pnpm --filter @atm/mobile test
pnpm --filter @atm/dashboard typecheck
pnpm --filter @atm/dashboard build
```

The repository typecheck and all non-CLI tests also pass.

## Accessibility and visual QA

- Responsive CSS provides narrow-width layouts for the matrix, evidence cards,
  and comparison states.
- Semantic table roles and focus-visible navigation treatments are present.
- Browser automation was unavailable in this environment, so no automated
  desktop or narrow-viewport screenshot could be captured. Manual visual
  inspection remains required before release.

## Integration blocker

`pnpm check` and `pnpm smoke` currently fail in the integration-owned CLI
smoke test. `apps/cli/src/smoke.ts` imports `parseVerificationResponse` from
the branch-head `@atm/mobile` package, which now represents release 1.2 and
accepts `MANUAL_REVIEW`. The test claims to exercise release 1.0, so it must
instead use the historical `app-v1.0.0` worktree parser. No client/UI files
need changing for that fix.

## Remaining coordination

- Push is currently blocked: GitHub rejected the current account with `403`
  for `deveshsangwan/api-time-machine`. The branch and annotated release tags
  are ready locally; retry after repository write access is granted.
- Integration must replace the dashboard fixture with its persisted
  `CompatibilityRun` data when its evidence flow is available.
