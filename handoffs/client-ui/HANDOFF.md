# Codex handoff: frontend and React Native workstream

## Session purpose

Create the historical React Native release sequence and connect the focused Client Survival Matrix to shared run data.

## Start here

```bash
git fetch origin --tags
git switch workstream/client-ui
pnpm install --frozen-lockfile
```

- Branch: `workstream/client-ui`
- Existing historical tag: `app-v1.0.0`
- Owned paths: `apps/mobile/**`, `apps/dashboard/**`
- Shared scaffold verification: `pnpm check` and `pnpm smoke`

## Required reading

1. `AGENTS.md`
2. `docs/PRD.md`
3. `CONTEXT.md`
4. `docs/adr/0001-contract-first-workstreams.md`
5. `docs/WORKSTREAMS.md`
6. `docs/workstreams/client-ui.md`

The detailed objective, parser interface, tag sequence, tasks, acceptance criteria, prohibited paths, contract-change protocol, and return-handoff requirements are in `docs/workstreams/client-ui.md`.

## Coordination rules

- Edit only `apps/mobile/**` and `apps/dashboard/**`.
- Do not change `packages/contracts` on this branch.
- Push `app-v1.1.0` and `app-v1.2.0` only after their parser tests pass.
- Never rewrite historical tags after integration begins.
- Render real shared-shape data before visual polish.
- Commit in small slices and do not merge your own branch.

## Completion handback

Return commit and tag SHAs, behavior per release, test/build output, dashboard proof, accessibility limitations, and open risks to the integration owner.

## Suggested skills

- `tdd`
- `design-taste-frontend`
- `vercel:react-best-practices`
