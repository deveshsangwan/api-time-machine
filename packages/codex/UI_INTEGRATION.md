# UI handoff: MLOps and Codex results

## What the UI consumes

The mobile app and dashboard consume data, not Codex credentials. They should
import shared types from `@atm/contracts` and must not import `@atm/codex`.

The frozen shared types already provide:

- `CompatibilityRun`: the authoritative deterministic gate, per-client
  outcomes, blast radius, and timestamps.
- `ClientResult`: client version, active share, status, summary, duration, and
  bounded evidence.
- `ChangeProfile`: the schema-validated semantic description of the API change.
- `RepairProposal`: the unverified Candidate Repair and Legacy Projection.

The dashboard currently contains hardcoded `ClientResult` rows. Replace those
rows with injected `CompatibilityRun.clients` when the integration owner makes
the run available. Keep compatibility status and Candidate Repair status
visually distinct: a model proposal never changes the deterministic gate.

## Recommended view payload

The integration layer should assemble, validate, and sanitize a payload like
the following. This is a proposed transport/view DTO, not a new frozen shared
contract; use the constituent `@atm/contracts` types as the source of truth.

```ts
import type {
  ChangeProfile,
  CompatibilityRun,
  RepairProposal,
} from "@atm/contracts";

export interface TimeMachineRunView {
  compatibility: CompatibilityRun;
  semantic: {
    status:
      | "not_requested"
      | "analysis_accepted"
      | "candidate_repair"
      | "rejected";
    change?: ChangeProfile;
    repair?: RepairProposal;
    message?: string;
  };
}
```

Before returning this payload to a UI, the integration layer must remove raw
prompts, API keys, provider thread IDs, full stdout/stderr, private source, and
unbounded model traces. For a hackathon view, display only the validated
contract fields and summarized latency/token metrics when needed.

## Development data flow

The UI developer can start without an API key:

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Generate the labelled dataset with
   `pnpm --filter @atm/codex simulate`.
3. Use its `clientResults` for the client survival matrix and its
   `adoptionHistory` for charts.
4. Use `pnpm --filter @atm/codex demo` to obtain deterministic example
   `change` and `repair` objects.
5. Preserve the visible synthetic-data label. These shares are not production
   telemetry.

The simulated scenario adds `MANUAL_REVIEW` to the verification status enum:

- client `1.0.0` rejects it;
- client `1.1.0` accepts it via unknown-value fallback;
- client `1.2.0` supports it natively;
- the approved Legacy Projection maps `MANUAL_REVIEW` to `PENDING` below
  version `1.2.0`.

## Live demo data flow

```text
backend change
  -> response capture
  -> historical-client compatibility run
  -> CompatibilityRun (authoritative)
  -> Codex analysis / Candidate Repair (advisory)
  -> isolated apply + historical-client rerun
  -> verified result
  -> sanitized endpoint or JSON artifact
  -> mobile/dashboard
```

Responsibilities:

- MLOps owns `packages/codex/**`: prompts, adapter, schema validation, policy,
  retry behavior, synthetic evidence, evals, and sanitized telemetry.
- Integration owns `apps/cli/**`, `packages/orchestrator/**`, workflow wiring,
  the final transport DTO/endpoint, and isolated verification.
- Client UI owns `apps/mobile/**` and `apps/dashboard/**`: rendering, loading,
  errors, and navigation. It does not call OpenAI.

## UI states to support

- Compatibility run loading, compatible, incompatible, and inconclusive.
- No semantic analysis requested.
- Analysis accepted, with a `ChangeProfile`.
- Candidate Repair available, clearly labelled **unverified**.
- Probabilistic result rejected by schema, grounding, timeout, or policy; the
  deterministic compatibility result must remain visible.
- Verified repair only after the orchestrator rerun succeeds.

## End-to-end readiness checklist

- [ ] MLOps branch is merged by the integration owner.
- [ ] Integration emits a validated `TimeMachineRunView`-equivalent payload.
- [ ] A server endpoint or CI-generated artifact supplies that payload.
- [ ] The UI has no `CODEX_API_KEY`, OpenAI SDK, or `@atm/codex` dependency.
- [ ] Deterministic checks run on every pull request.
- [ ] Live Codex evaluation runs only in a trusted secret-bearing environment.
- [ ] Candidate Repair is not shown as verified before isolated replay passes.
- [ ] Synthetic data is labelled; private evidence and provider traces are not
      sent to the client.
