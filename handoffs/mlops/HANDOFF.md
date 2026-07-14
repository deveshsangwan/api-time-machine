# Codex handoff: MLOps workstream

## Session purpose

Implement the Codex change-analysis and Candidate Repair workflow for API Time Machine.

## Start here

```bash
git fetch origin --tags
git switch workstream/mlops
pnpm install --frozen-lockfile
```

- Branch: `workstream/mlops`
- Owned path: `packages/codex/**`
- Shared scaffold verification: `pnpm check` and `pnpm smoke`

## Required reading

1. `AGENTS.md`
2. `docs/PRD.md`
3. `CONTEXT.md`
4. `docs/adr/0001-contract-first-workstreams.md`
5. `docs/WORKSTREAMS.md`
6. `docs/workstreams/mlops.md`

The detailed objective, interface, tasks, acceptance criteria, prohibited paths, contract-change protocol, and return-handoff requirements are in `docs/workstreams/mlops.md`.

## Coordination rules

- Edit only `packages/codex/**`.
- Do not change `packages/contracts` on this branch.
- Codex may interpret and propose; it must never decide compatibility or verification.
- Never commit model credentials or private trace data.
- Commit in small slices and do not merge your own branch.

## Implemented on this branch

- Provider-neutral `ReasoningAdapter` boundary with an OpenAI Codex SDK
  adapter pinned to `gpt-5.6-sol` / `medium` reasoning.
- Structured-output schemas for `ChangeProfile` and `RepairProposal`.
- Grounding, allowed-path, Legacy Projection, timeout, and retry guardrails.
- Explicitly labelled synthetic mobile history and deterministic evaluations.
- CLI commands for simulation, fixture demo, full live evaluation, and a
  repair-only live rerun.
- Local Codex plugin/skill under `plugins/api-time-machine/**`.
- Security and client integration guides in
  `packages/codex/README.md` and `packages/codex/UI_INTEGRATION.md`.

## Verification completed

- `pnpm check` passes.
- `packages/codex` has 18 passing tests.
- Plugin manifest, marketplace, and skill validation pass.
- The live SDK authenticated successfully with a project key.
- Live change analysis returned a valid grounded `ChangeProfile`.
- The first full Candidate Repair was rejected because the proposed patch did
  not contain the literal capability threshold; this demonstrated that the
  deterministic policy guardrail rejects plausible but non-compliant output.
- A repair-only retry returned an accepted Candidate Repair that projects
  `MANUAL_REVIEW` to `PENDING` below `1.2.0` and preserves the native value for
  capable clients.

The accepted Candidate Repair remains **unverified** until the integration
orchestrator applies it in isolation and reruns the real historical clients.

Observed full live run telemetry:

- Analysis: 12.379 s, 11,100 input tokens, 209 output tokens, 117 reasoning
  output tokens.
- Initially rejected repair: 25.132 s, 11,241 input tokens, 1,378 output
  tokens, 773 reasoning output tokens.
- Accepted repair-only retry: 20.679 s, 11,263 input tokens, 746 output tokens,
  252 reasoning output tokens.

These are single-run hackathon observations, not an SLO or benchmark.

## Integration assumptions and open work

- UI code imports only `@atm/contracts`; it never imports `@atm/codex` and
  never receives `CODEX_API_KEY`.
- Integration owns the final CLI/orchestrator composition, isolated patch
  application, verification rerun, sanitized transport DTO, and any HTTP
  endpoint or JSON artifact consumed by the UI.
- No HTTP service exists on this branch. The UI can start against
  `pnpm --filter @atm/codex simulate` and `demo`, but a live end-to-end UI flow
  requires the integration wiring described above.
- Deterministic evaluation belongs on every pull request. Paid live SDK evals
  should run manually, nightly, or on a protected branch with a GitHub
  Environment secret.
- Never commit credentials or private traces. A key exposed in any UI or
  automation log must be revoked and replaced before shared CI use.

## Completion handback

Return commit SHAs, test and evaluation output, structured-output examples,
integration assumptions, token/latency observations, and open risks to the
integration owner.

## Suggested skills

- `openai-docs`
- `tdd`
- `codebase-design`
