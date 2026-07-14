# Developer handoffs

Give each developer's Codex the matching folder and branch. Every handoff references the canonical PRD, glossary, ADR, coordination guide, and detailed workstream brief instead of duplicating them.

| Developer | Branch | Handoff |
| --- | --- | --- |
| Senior backend developer | `workstream/backend` | [`backend/HANDOFF.md`](backend/HANDOFF.md) |
| MLOps engineer | `workstream/mlops` | [`mlops/HANDOFF.md`](mlops/HANDOFF.md) |
| Frontend and app developer | `workstream/client-ui` | [`client-ui/HANDOFF.md`](client-ui/HANDOFF.md) |
| Full-stack integration developer | `workstream/integration` | [`integration/HANDOFF.md`](integration/HANDOFF.md) |

All four branches are created from the same verified scaffold. Developers should use separate clones or Codex workspaces. Product-created Git worktrees under `.worktrees/` are reserved for historical-release execution.
