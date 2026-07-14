# Full-stack integration workstream

## Assignment

- Branch: `workstream/integration`
- Owned paths: `apps/cli/**`, `packages/orchestrator/**`, `config/**`, `.github/**`
- Assembly-only access after upstream merges: import production adapters from other workstreams without editing their implementations.
- Do not edit: shared contracts or another workstream's implementation paths.

Read `docs/PRD.md`, `CONTEXT.md`, `docs/adr/0001-contract-first-workstreams.md`, and `docs/WORKSTREAMS.md` before editing.

## Objective

Build the deterministic compatibility gate that connects real response capture, historical Git tags, production parsers, evidence persistence, blast-radius calculation, Codex proposals, and verification behind one reliable CLI command.

## Existing interface

`runCompatibilityCheck` is the orchestration module interface. It accepts releases and two adapters—response capture and historical-client execution—and returns a validated `CompatibilityRun`. The CLI is the only assembly root allowed to connect concrete workstream implementations.

## Required work

1. Validate `config/releases.json` through `ClientRelease` before execution.
2. Implement disposable historical worktrees under `.worktrees/` and guarantee cleanup after success or failure.
3. Generate or inject a temporary Compatibility Probe that calls the stable production parser entry point for each tag.
4. Execute the configured package-manager test command with bounded time, captured output, and distinct incompatible versus inconclusive classification.
5. Verify that the bytes replayed through each parser match the Captured Response SHA-256.
6. Persist the Evidence Bundle under `runs/` with stable machine-readable JSON and human-readable matrix output.
7. Implement CLI exit codes: 0 compatible or Verified Repair, 1 incompatible, 2 inconclusive or infrastructure failure.
8. Connect the Codex workflow only after the deterministic red path works; never use model output as the pass/fail signal.
9. Apply Candidate Repairs only in isolated backend worktrees, enforce allowed paths, limit attempts to two, and recapture responses before verification.
10. Replace the scaffold smoke path with the real red-to-green command and add CI coverage.

## Acceptance criteria

- The first real red path executes the backend and `app-v1.0.0` parser from separate revisions and exits 1.
- Releases 1.0.0, 1.1.0, and 1.2.0 produce the expected matrix and an 18 percent sample Blast Radius.
- Missing tags, install failures, timeouts, malformed evidence, and cleanup failures cannot become compatible results.
- Evidence includes commit SHAs, commands, raw logs, source locations where available, response hashes, durations, and configured shares.
- The Candidate Repair is verified only after backend tests and every supported Historical Release pass.
- A complete local run works without manual file edits after dependencies are cached.
- `pnpm --filter @atm/orchestrator typecheck` and `test` pass.
- `pnpm --filter @atm/cli typecheck` and the final smoke/demo command pass.
- `pnpm check` passes after rebasing onto all merged workstreams.

## Merge responsibility

This branch merges last. Rebase it after backend, client, and MLOps land on `main`; resolve only assembly-level changes. If a semantic conflict appears in a shared contract or another module, return it to the owning workstream instead of resolving it silently.

## Return handoff

Report the final integration commit, exact demo command, exit-code behavior, evidence location, check results, runtime, dependency-cache requirements, and any manual fallback used by the recorded demo.

## Suggested skills

- `tdd` for the complete red-to-green gate.
- `codebase-design` when deciding whether a runner or evidence concern belongs behind the orchestration interface.
- `diagnosing-bugs` for worktree, process, or cleanup failures that resist direct reproduction.
- `vercel:verification` only if the dashboard is served as part of the final flow.
