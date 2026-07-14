# API Time Machine

**CI for mobile clients you can no longer update.**

API Time Machine executes a proposed Node.js response and replays its exact bytes through production response parsers from historical React Native releases. Codex interprets failures and proposes repairs; deterministic backend and client tests decide whether the compatibility gate opens.

## Scaffold status

This repository currently provides the shared contracts, a real Fastify response-capture path, the strict React Native 1.0 parser, a minimal compatibility orchestrator, a structured Codex workflow seam, a CLI smoke path, and a focused Client Survival Matrix scaffold.

The common `main` baseline is intentionally red for historical release 1.0: the backend emits `MANUAL_REVIEW`, while the strict 1.0 Zod parser understands only `VERIFIED`, `PENDING`, and `REJECTED`.

## Quick start

```bash
pnpm install
pnpm check
pnpm smoke
```

Development entry points:

```bash
pnpm dev:backend
pnpm dev:mobile
pnpm dev:dashboard
```

## Workstreams

| Owner | Branch | Module |
| --- | --- | --- |
| Senior backend developer | `workstream/backend` | Node.js route capture and compatibility serialization |
| MLOps engineer | `workstream/mlops` | Codex analysis, repair, structured outputs, and safeguards |
| Frontend and app developer | `workstream/client-ui` | React Native release history and evidence presentation |
| Full-stack developer | `workstream/integration` | Worktree execution, orchestration, evidence, CLI, and CI |

Read [the coordination guide](docs/WORKSTREAMS.md) and the brief under `docs/workstreams/` before starting a workstream.

## Repository shape

```text
apps/
  backend/       real Fastify route and exact response capture
  mobile/        React Native release data layer and demo application
  dashboard/     focused survival-matrix presentation
  cli/           assembly root for the complete gate
packages/
  contracts/     frozen cross-workstream contracts
  codex/         semantic analysis and repair workflow
  orchestrator/  deterministic compatibility orchestration
config/
  releases.json  sample Android adoption and release registry
docs/
  workstreams/   developer-specific implementation briefs
```

## Integration rule

Workstreams may import `@atm/contracts` but must not import another workstream's implementation. The CLI is the assembly root where production adapters are connected. Changes to `packages/contracts` use a separate `contract/<topic>` branch merged to `main` before affected workstreams continue.

## Source of truth

- [Product requirements](docs/PRD.md)
- [Domain glossary](CONTEXT.md)
- [Contract-first ADR](docs/adr/0001-contract-first-workstreams.md)
- [Published PRD issue](https://github.com/deveshsangwan/api-time-machine/issues/1)
