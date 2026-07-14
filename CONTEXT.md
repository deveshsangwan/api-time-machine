# API Time Machine domain context

## Product statement

API Time Machine is a pre-merge compatibility gate for React Native clients that can no longer be updated. Codex interprets and repairs; deterministic Node.js and historical-client tests decide compatibility.

## Glossary

**Backend Change** — the proposed Node.js change being evaluated before merge.

**Captured Response** — the exact status code, headers, body bytes, and body hash emitted by executing the changed backend route for a specific app version.

**Historical Release** — an immutable React Native application revision identified by both a Git tag and commit SHA, with explicit support status and configured Android installation share.

**Compatibility Probe** — a temporary test that feeds a Captured Response into a Historical Release's production response parser or normalizer.

**Client Result** — the compatible, incompatible, or inconclusive outcome for one Historical Release, including its evidence.

**Client Survival Matrix** — the ordered collection of Client Results shown to developers and judges.

**Blast Radius** — the sum of configured installation shares for supported Historical Releases with an incompatible Client Result.

**Evidence Bundle** — the inspectable run artifacts connecting a Backend Change, Captured Responses, Historical Releases, commands, logs, source locations, and Client Results.

**Legacy Projection** — a semantically justified mapping from a new wire value to an older supported representation for clients below a capability threshold.

**Candidate Repair** — a Codex-proposed backend patch and regression test that has not yet passed verification.

**Verified Repair** — a Candidate Repair for which backend tests, scope checks, evidence capture, and every supported Historical Release pass.

**Inconclusive** — a gate failure caused by missing or invalid evidence, toolchain failure, or an unexecutable probe. Inconclusive never means compatible.

## Language rules

- Say **parser rejection** unless evidence proves an application crash.
- Say **configured installation share** unless the data comes from a live telemetry integration.
- Say **Candidate Repair** until all verification conditions pass.
- Do not call a generated fixture a Captured Response unless the real backend route emitted it.
