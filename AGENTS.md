## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues; external pull requests are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

The repository uses the five canonical triage labels without aliases. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain-documentation layout. See `docs/agents/domain.md`.

## Workstream rules

Before editing code, read `docs/PRD.md`, `CONTEXT.md`, `docs/adr/0001-contract-first-workstreams.md`, and the brief for your assigned workstream under `docs/workstreams/`.

- Work only in the paths owned by your workstream unless the integration brief explicitly assigns otherwise.
- Treat `packages/contracts` as the frozen integration seam. Propose contract changes in a separate branch from `main`; do not quietly change contracts inside a workstream branch.
- Import shared contracts instead of duplicating cross-workstream types.
- Run the workstream-specific checks in your brief before handing work back.
- Git worktrees under `.worktrees/` are runtime fixtures for historical releases, not collaboration directories for developers.
- Never commit generated run evidence from `runs/`; only curated examples belong in documentation.
