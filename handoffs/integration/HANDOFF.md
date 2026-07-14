# Codex handoff: full-stack integration workstream

## Session purpose

Build the deterministic historical-client gate and assemble the four modules into the final red-to-green workflow.

## Start here

```bash
git fetch origin --tags
git switch workstream/integration
pnpm install --frozen-lockfile
```

- Branch: `workstream/integration`
- Historical baseline tag: `app-v1.0.0`
- Owned paths: `apps/cli/**`, `packages/orchestrator/**`, `config/**`, `.github/**`
- Shared scaffold verification: `pnpm check` and `pnpm smoke`

## Required reading

1. `AGENTS.md`
2. `docs/PRD.md`
3. `CONTEXT.md`
4. `docs/adr/0001-contract-first-workstreams.md`
5. `docs/WORKSTREAMS.md`
6. `docs/workstreams/integration.md`

The detailed objective, orchestration interface, tasks, acceptance criteria, prohibited paths, merge order, contract-change protocol, and return-handoff requirements are in `docs/workstreams/integration.md`.

## Coordination rules

- Stay within owned paths until upstream work merges.
- Do not change `packages/contracts` on this branch.
- Do not edit another workstream's implementation to hide an integration problem.
- Keep `.worktrees/` disposable and `runs/` generated.
- Establish the deterministic red path before connecting Codex.
- Rebase after backend, client/UI, and MLOps merge; this branch merges last.

## Completion handback

Return the final commit, exact demo command, exit-code behavior, evidence location, full check output, runtime, cache requirements, and open risks.

## Suggested skills

- `tdd`
- `codebase-design`
- `diagnosing-bugs`
- `vercel:verification` only if the dashboard is served in the final flow
