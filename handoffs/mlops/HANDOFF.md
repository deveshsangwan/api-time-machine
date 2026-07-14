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

## Completion handback

Return commit SHAs, test and evaluation output, structured-output examples, integration assumptions, token/latency observations, and open risks to the integration owner.

## Suggested skills

- `openai-docs`
- `tdd`
- `codebase-design`
