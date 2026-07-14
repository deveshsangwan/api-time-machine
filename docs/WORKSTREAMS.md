# Workstream coordination

## Branches

| Workstream | Branch | Owned paths |
| --- | --- | --- |
| Senior backend | `workstream/backend` | `apps/backend/**` |
| MLOps | `workstream/mlops` | `packages/codex/**` |
| Frontend and app | `workstream/client-ui` | `apps/mobile/**`, `apps/dashboard/**` |
| Full-stack integration | `workstream/integration` | `apps/cli/**`, `packages/orchestrator/**`, `config/**`, `.github/**` |

`packages/contracts/**` is owned collectively but edited only through a dedicated `contract/<topic>` branch from `main`.

## Interfaces frozen on main

- `CapturedResponse` connects backend capture to historical-client execution.
- `ClientRelease` describes an immutable app version and configured adoption data.
- `ClientResult` is the only historical-runner output consumed by orchestration and presentation.
- `CompatibilityRun` is the only complete run model consumed by the CLI and dashboard.
- `ChangeProfile` and `RepairProposal` connect the Codex workflow to integration.

Do not introduce cross-workstream imports that bypass these contracts.

## Merge protocol

1. All four branches start from the same scaffold commit on `main`.
2. Backend and client work merge first after their owned tests pass.
3. MLOps merges after its structured-output tests pass.
4. Integration rebases onto updated `main`, replaces in-memory adapters with production adapters, and merges last.
5. A contract change pauses affected integration work: create `contract/<topic>`, review, merge to `main`, then rebase affected branches.
6. Do not resolve semantic contract conflicts inside a large workstream pull request.

## Checkpoints

### Checkpoint 1: contracts and local modules

Each workstream can run its owned tests without depending on unfinished implementations from another workstream.

### Checkpoint 2: first real red path

The real Node.js route emits `MANUAL_REVIEW`; the release 1.0 production Zod parser rejects the exact captured bytes; orchestration reports an incompatible Client Result.

### Checkpoint 3: complete matrix

Releases 1.0, 1.1, and 1.2 produce incompatible, compatible-with-fallback, and compatible-native results with a calculated 18 percent sample Blast Radius.

### Checkpoint 4: Verified Repair

The Candidate Repair adds a safe Legacy Projection and regression test; recaptured responses pass every supported Historical Release and the gate exits successfully.

## Shared-file policy

Avoid editing root configuration, the PRD, glossary, ADRs, or another workstream's paths. Send required root changes to the integration owner. Keep generated worktrees and run artifacts untracked.
