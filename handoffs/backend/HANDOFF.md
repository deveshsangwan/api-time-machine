# Codex handoff: senior backend workstream

## Session purpose

Implement the Node.js backend capture and compatibility-serialization workstream for API Time Machine.

## Start here

```bash
git fetch origin --tags
git switch workstream/backend
pnpm install --frozen-lockfile
```

- Branch: `workstream/backend`
- Historical baseline tag: `app-v1.0.0`
- Owned path: `apps/backend/**`
- Shared scaffold verification: `pnpm check` and `pnpm smoke`

## Required reading

1. `AGENTS.md`
2. `docs/PRD.md`
3. `CONTEXT.md`
4. `docs/adr/0001-contract-first-workstreams.md`
5. `docs/WORKSTREAMS.md`
6. `docs/workstreams/backend.md`

The detailed objective, interface, tasks, acceptance criteria, prohibited paths, contract-change protocol, and return-handoff requirements are in `docs/workstreams/backend.md`.

## Coordination rules

- Edit only `apps/backend/**`.
- Do not change `packages/contracts` on this branch.
- Keep the original breaking revision identifiable for the red-path demo.
- Commit in small slices and do not merge your own branch.
- Run the backend typecheck and tests specified in the workstream brief.

## Completion handback

Return commit SHAs, red and green revisions, test output, version-header assumptions, and open risks to the integration owner.

## Suggested skills

- `tdd`
- `codebase-design`
- `diagnosing-bugs` only if a reproducible failure resists the normal test loop
