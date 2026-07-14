# MLOps workstream

## Assignment

- Branch: `workstream/mlops`
- Owned path: `packages/codex/**`
- Do not edit: shared contracts, backend, React Native client, dashboard, orchestrator, CLI, root configuration, or CI.

Read `docs/PRD.md`, `CONTEXT.md`, `docs/adr/0001-contract-first-workstreams.md`, and `docs/WORKSTREAMS.md` before editing.

## Objective

Implement the Codex workflow that converts repository evidence into a validated Change Profile and a narrowly scoped Candidate Repair without becoming the authority for compatibility.

## Existing interface

`createCodexWorkflow` is the module interface. It accepts one external Codex adapter and exposes two operations: analyze a Backend Change and propose a Candidate Repair. Both operations must validate unknown model output against shared contracts before returning.

## Required work

1. Implement the real Codex adapter behind the existing interface.
2. Ground change analysis in the backend diff and Captured Response; return the exact endpoint, field, enum values, and source file.
3. Ground repair proposals in incompatible Client Results and their evidence.
4. Require a semantic justification for the `MANUAL_REVIEW` to `PENDING` Legacy Projection and the 1.2.0 capability threshold.
5. Generate a narrowly scoped backend patch and regression-test patch without applying or executing them in this module.
6. Reject malformed, incomplete, ungrounded, or out-of-scope structured output.
7. Add deterministic adapter fixtures for tests and at least one documented real-Codex evaluation path.
8. Keep model prompts, parsing, retries, and provider details behind the module interface.

## Acceptance criteria

- Analysis output is rejected if it does not match `ChangeProfile`.
- Repair output is rejected if it lacks a patch, regression test, allowed paths, or semantic justification.
- The workflow never marks a Client Result compatible and never marks a Candidate Repair verified.
- Prompt/evaluation fixtures cover correct output, malformed output, unsupported repair, and an attempted out-of-scope edit.
- Retry behavior is bounded and observable.
- `pnpm --filter @atm/codex typecheck` passes.
- `pnpm --filter @atm/codex test` passes.

## Contract-change protocol

If `ChangeProfile` or `RepairProposal` lacks required evidence, stop and propose a `contract/<topic>` branch from `main`. Do not change `packages/contracts` on this branch.

## Return handoff

Report the commits, test and evaluation commands, structured-output examples, model/configuration assumptions, token or latency observations, and unresolved risks. Never include secrets in the handoff.

## Suggested skills

- `openai-docs` before choosing or implementing the current Codex integration surface.
- `tdd` for schema validation, bounded retries, and rejection behavior.
- `codebase-design` if provider concerns begin leaking through the workflow interface.
