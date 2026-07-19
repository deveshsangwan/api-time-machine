# ADR-0002: Portable compatibility runner

## Status

Accepted.

## Context

The hackathon implementation assembled concrete backend and mobile fixtures inside the CLI. That proved the deterministic compatibility loop, but an installed CLI could only execute this monorepo's Fastify capture function, React Native package, parser path, package manager, and Git tags.

The product must attach to a backend repository while historical client releases may live in the same repository, a sibling repository, or a separate remote Git repository. The CLI, Codex plugin, and dashboard must remain independently usable without duplicating compatibility logic.

## Decision

The deterministic CLI remains the assembly root and loads `api-time-machine.config.json` from the current directory or a parent directory.

Attached repositories provide two executable adapters:

- A capture command receives `ATM_APP_VERSION` and prints one validated `CapturedResponse` JSON object to stdout.
- A client probe command receives `ATM_CAPTURE_PATH`, `ATM_CLIENT_DIR`, `ATM_RELEASE_VERSION`, `ATM_RESPONSE_SHA256`, and `ATM_RESULT_PATH`. It writes a `ClientResult`-compatible JSON object and exits 0 compatible, 1 incompatible, or 2 inconclusive.

Commands are argument arrays and execute without a shell. The deterministic engine validates command output, response hashes, release identity, exit-code agreement, and Evidence Bundle integrity.

Local client repositories use Git worktrees directly. Remote repositories use a cached bare clone and the same worktree implementation. Credentials remain owned by the invoking developer or CI environment.

Each run emits the complete Evidence Bundle and a sanitized, versioned `run-view.json`. The dashboard consumes the sanitized artifact. The Codex plugin invokes the CLI and interprets the resulting evidence; it never becomes the compatibility authority.

The existing backend and mobile applications remain proof-of-concept fixtures. Their adapters live under `config/`, so the published CLI does not depend on fixture implementations.

## Consequences

- `api-time-machine init` can attach configuration and adapter stubs to an arbitrary Git repository with one command.
- Framework-specific knowledge stays in repository-owned adapters rather than the engine.
- A backend repository can check historical clients stored in a remote application repository.
- The dashboard can run through `api-time-machine dashboard` or load `run-view.json` as a static artifact.
- The frozen product contracts still describe React Native compatibility. Broader client platforms require the existing contract-change protocol.
