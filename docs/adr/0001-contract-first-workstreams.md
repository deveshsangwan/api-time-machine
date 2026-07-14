# ADR-0001: Contract-first workstreams

## Status

Accepted.

## Context

Four developers must implement the hackathon MVP in parallel and merge into one reliable main branch. The highest integration risks are duplicated cross-workstream types, shared-file edits, late coupling between implementations, and treating developer worktrees as collaboration branches.

## Decision

The repository is a pnpm monorepo organized into four workstreams behind one shared-contracts seam.

- Backend Capture owns real Node.js route execution and compatibility serialization.
- Client and Presentation owns historical React Native parser behavior and the focused evidence UI.
- Codex Workflow owns semantic analysis, structured outputs, repair generation, and safeguards.
- Integration owns orchestration, historical Git worktrees, evidence persistence, blast-radius calculation, CLI assembly, and CI.

`packages/contracts` is the only shared implementation path. Its interface is frozen on `main` before parallel work. A workstream that needs a contract change must propose it in a separate contract branch, merge it to `main` after review by the integration owner and every affected owner, and then rebase all affected workstreams.

Each developer uses a normal clone and a workstream branch. Product-created Git worktrees live under `.worktrees/` and exist only to execute Historical Releases.

The assembly root is the CLI application. It may import concrete adapters from other workstreams; the underlying modules must communicate through shared contracts rather than importing each other's implementations.

## Consequences

- Most development touches disjoint paths and merges mechanically.
- Shared contract changes are visible and coordinated.
- Integration can use in-memory adapters until production adapters land.
- Workstream branches may live through the hackathon, but changes should still be committed in small, reviewable slices.
- The integration branch merges last after rebasing onto the backend, client, and Codex work.
