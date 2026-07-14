## Problem Statement

Backend services can deploy immediately, while React Native application releases installed on Android devices remain active for weeks or months. A Node.js API change that works with the newest app release can cause an older shipped React Native client to reject the response because its production runtime schema or response normalizer does not understand a new enum value or other wire-contract behavior.

Backend CI usually validates the current server and, at best, the newest client contract. Schema-diff tools inspect declared contracts but do not execute the exact HTTP response produced by the proposed backend code through the actual response parsers from historical React Native releases. Teams therefore lack executable proof of which still-supported releases will survive a backend change, how much of the configured Android installation base is affected, and whether a server-side compatibility repair genuinely restores support.

The user needs a narrow, deterministic, pre-merge compatibility gate with inspectable evidence. Codex may interpret code and propose repairs, but it must not be the authority for compatibility. The authority must be real Node.js route execution and real React Native data-layer tests against the exact response bytes emitted by the proposed backend change.

## Solution

Build API Time Machine, a Codex-native compatibility gate for React Native clients that can no longer be updated.

Given a proposed Node.js backend change, API Time Machine will execute the real changed route, capture its exact HTTP response, and replay that response through production TypeScript response schemas and normalizers checked out from every configured historical React Native release tag. It will produce a Client Survival Matrix, calculate the affected configured Android installation share, and preserve an evidence bundle containing the response, release revisions, commands, logs, and source locations.

When a supported release fails, Codex will use the captured evidence to propose the smallest semantically safe server-side compatibility repair and a permanent Node.js regression test. The candidate repair will be applied only in an isolated worktree and will be considered verified only when the Node.js regression suite and every required historical React Native parser pass. The gate will fail closed when compatibility is broken, evidence is inconclusive, or no safe legacy representation exists.

The hackathon demonstration will focus deeply on one enum-evolution case. The Node.js backend adds `MANUAL_REVIEW` to an identity-verification status that previously supported `VERIFIED`, `PENDING`, and `REJECTED`. App release 1.0 uses a strict Zod enum and rejects the new value, app release 1.1 has an unknown-value fallback, and app release 1.2 supports the value natively. Because `MANUAL_REVIEW` is a refinement of the existing `PENDING` state, the backend can safely project it to `PENDING` for legacy clients using a pre-existing application-version request header while preserving `MANUAL_REVIEW` for capable clients.

## User Stories

1. As a backend engineer, I want to check a proposed Node.js API change against still-supported React Native releases, so that I can detect compatibility failures before merge.
2. As a backend engineer, I want the check to execute the real changed route, so that the tested payload is the response the proposed code actually emits.
3. As a backend engineer, I want the exact HTTP status, headers, and body bytes saved, so that I can inspect and reproduce the compatibility input.
4. As a mobile engineer, I want historical React Native releases represented by real Git tags and commit revisions, so that the results refer to immutable shipped-client code rather than illustrative folders.
5. As a mobile engineer, I want each release tested with its production TypeScript runtime schema and response normalizer, so that the gate captures client behavior absent from a static type or API schema.
6. As a mobile engineer, I want compatibility probes to run as Jest tests against the production data layer, so that the demonstration does not depend on an emulator or device farm.
7. As a mobile engineer, I want each historical worktree isolated, so that generated probes and fixtures cannot contaminate another release.
8. As a reviewer, I want a Client Survival Matrix, so that I can see which app versions accept or reject the proposed response at a glance.
9. As a reviewer, I want each matrix result linked to its release tag, commit, test command, output, and relevant schema or normalizer source location, so that every claim is auditable.
10. As a product owner, I want the configured Android installation share of failing releases summed, so that I can understand the relative exposure of the change.
11. As a product owner, I want installation-share data labeled with its source and observation time, so that sample configuration is not mistaken for live production telemetry.
12. As a product owner, I want unsupported or inactive releases excluded according to an explicit support policy, so that the gate reflects the versions the team has committed to maintain.
13. As a CI maintainer, I want a compatible result to return a success exit status, so that normal merge automation can proceed.
14. As a CI maintainer, I want a verified incompatibility to return a failure exit status, so that the proposed backend change blocks the merge.
15. As a CI maintainer, I want infrastructure or inconclusive failures distinguished from compatibility failures, so that a broken Jest or package-manager environment is never reported as a passing client.
16. As a CI maintainer, I want machine-readable JSON and JUnit-compatible results, so that other CI systems can consume and display the evidence.
17. As a developer, I want one reliable local demo command, so that I can reproduce the complete gate without assembling several services manually.
18. As a hackathon judge, I want the initial change to produce a genuine historical-client parsing failure, so that the demonstration is not a styled mock.
19. As a hackathon judge, I want to see the exact Node.js response bytes enter the historical React Native test, so that the causal connection is visible.
20. As a hackathon judge, I want the gate to change from failing to passing after a repair, so that the product demonstrates a closed operational loop.
21. As a hackathon judge, I want a short video and repository artifacts for the same run, so that the implementation can be evaluated after the live presentation.
22. As a Codex user, I want to request a compatibility check in natural language, so that the workflow feels native to the coding environment.
23. As a Codex user, I want Codex to identify the changed response contract and relevant React Native schemas or normalizers, so that I do not need to maintain hardcoded mappings.
24. As a Codex user, I want Codex to generate a temporary Jest compatibility probe grounded in the selected app release, so that the real production response parser can be exercised without permanently modifying historical tags.
25. As a Codex user, I want Codex to explain a failure using only captured response, source, and test evidence, so that the explanation is inspectable rather than speculative.
26. As a backend engineer, I want Codex to propose a narrowly scoped server repair, so that the already-installed clients can be protected without waiting for a mobile release.
27. As a backend engineer, I want the repair to preserve the new response for capable clients, so that backward compatibility does not silently remove the new feature.
28. As a backend engineer, I want legacy projections to be declared and semantically justified, so that compatibility is not achieved by lying about business state.
29. As a backend engineer, I want the system to refuse automatic repair when no safe legacy representation or reliable client-version signal exists, so that an unsafe patch is never presented as verified.
30. As a backend engineer, I want a generated Node.js regression test to fail before the repair and pass after it, so that the compatibility contract becomes permanent.
31. As a reviewer, I want the candidate patch displayed as a diff before verification, so that I can evaluate its scope and semantics.
32. As a reviewer, I want patch writes restricted to approved backend serialization and test boundaries, so that Codex cannot solve the check by weakening unrelated behavior.
33. As a reviewer, I want the candidate patch tested in an isolated worktree, so that the original working tree remains untouched until a human accepts the result.
34. As a reviewer, I want before-and-after matrices preserved in one run, so that I can compare the original failure with the verified outcome.
35. As an MLOps engineer, I want semantic analysis and deterministic execution represented as separate stages, so that model reasoning can be evaluated independently from test truth.
36. As an MLOps engineer, I want structured Codex outputs validated before execution, so that malformed model responses fail safely.
37. As an MLOps engineer, I want repair attempts and repeated-failure limits, so that the workflow remains bounded and demoable.
38. As a repository maintainer, I want dependencies and Node.js toolchains pinned and cached, so that the live demonstration does not depend on network availability.
39. As a repository maintainer, I want the README to distinguish implemented behavior from future work, so that repository evidence matches product claims.
40. As a security-conscious maintainer, I want commands and repository paths constrained by configuration, so that the MVP does not imply safe arbitrary-repository execution.
41. As a team member, I want backend, MLOps, React Native, and integration ownership to be separable, so that four engineers can work in parallel without building disconnected features.
42. As a team member, I want the terminal or chat matrix to be the primary interface, so that engineering time is spent on executable proof instead of a broad dashboard.
43. As an evaluator, I want a second small headless holdout check if time permits, so that the team can demonstrate the semantic workflow is not hardcoded to one model name or enum value.
44. As an evaluator, I want a parser rejection described precisely rather than automatically called an application crash, so that the product does not overclaim what its evidence proves.

## Implementation Decisions

- The product name remains **API Time Machine** and the tagline remains **CI for mobile clients you can no longer update**.
- The implementation will be a Codex-native workflow around a deterministic command-line compatibility engine. A separate chat application is not required.
- The initial backend fixture will use Node.js, TypeScript, and Fastify. Fastify's in-memory route injection will execute the real route and capture its exact serialized response without depending on a network port.
- The historical client fixture will use React Native, TypeScript, Zod runtime schemas, and Jest. Compatibility will be exercised against production response parsing and normalization code without launching a simulator or emulator.
- The React Native application is demonstrated as an Android-distributed client. The compatibility seam is shared TypeScript data-layer behavior, not native Android bridge behavior.
- The primary demonstration supports one change category: a new enum value emitted in a response body.
- The domain scenario will use identity-verification status. `MANUAL_REVIEW` is a refinement of legacy `PENDING`, making the legacy projection explicit and semantically defensible.
- Three immutable application releases will be represented by Git tags and recorded commit revisions: release 1.0 with a strict Zod enum, release 1.1 with unknown-value fallback behavior, and release 1.2 with native `MANUAL_REVIEW` support.
- All three historical client releases will already send an application-version header. The repair workflow may rely on that existing signal; it will not pretend that already-installed clients can begin sending a new header.
- When the version header is absent or invalid, the demonstration backend will use the oldest supported wire representation. This fail-safe behavior will be covered by the generated regression contract.
- The Node.js route, not Codex, will produce the decisive response. Codex may determine how to exercise the new backend state, but the compatibility engine will capture the exact status, headers, body bytes, and a content hash from real route execution.
- Codex will interpret the backend diff, produce a structured change profile, locate corresponding Zod schemas and response normalizers across historical tags, and generate a temporary release-specific Jest compatibility probe.
- Client mappings will not be hardcoded into the orchestrator. Repository configuration may identify repositories, tags, support status, installation shares, package-manager commands, and test commands, but not the answer for the demonstration field.
- Generated client probes will be written only inside disposable Git worktrees. They will import and execute the checked-out release's production parser or normalizer, then be discarded with the worktree.
- Each React Native release will be tested with its own pinned Node.js and package-manager configuration. The runner will invoke the targeted Jest test and capture exit code, standard output, standard error, and duration.
- Compatibility truth will have three classifications: compatible, incompatible, and inconclusive. Compatible returns process exit code 0, incompatible returns 1, and infrastructure or evidence failures return 2.
- An inconclusive release will fail the CI gate. It will never be silently omitted or counted as compatible.
- The release-adoption manifest will record platform, application version, Git tag, active share, support status, source label, and observation time. Demonstration shares will be labeled as sample Android installation configuration.
- Blast radius will equal the sum of configured active shares for supported releases with verified incompatibility. Inconclusive releases will be reported separately rather than added to a fabricated numeric estimate.
- The evidence bundle will include the backend revisions, diff-derived change profile, exact captured response and hash, release tag and commit, generated probe, invoked command, raw logs, source location, duration, compatibility classification, adoption input, and blast-radius calculation.
- The primary human-facing result will be a Client Survival Matrix rendered in Codex chat or the terminal. A focused read-only evidence view may be added only after the deterministic loop is reliable.
- A failed compatibility run will allow Codex to propose a candidate backend repair and a focused Node.js regression test. The repair remains a candidate until deterministic verification completes.
- The repair for the demonstration will serialize `MANUAL_REVIEW` as `PENDING` for legacy app versions while preserving `MANUAL_REVIEW` for the capable release.
- Codex must state the legacy projection and its preconditions. If the projection cannot be justified by the domain semantics or the backend lacks a reliable compatibility signal, the result will remain blocked with no automatically verified repair.
- Candidate changes will be applied in an isolated backend worktree and constrained to configured serialization and test boundaries. Changes outside the allowed scope will be rejected before verification.
- Verification will first run the generated Node.js regression test, then the existing Node.js tests, recapture responses from the patched route, and finally replay the patched responses through every supported React Native release.
- The generated regression test must demonstrate red before green: it must fail against the original proposed backend behavior and pass only after the compatibility repair.
- A repair will be marked verified only when required Node.js tests pass, every supported React Native release is compatible, evidence collection succeeds, and patch-scope checks pass.
- Repair generation will be bounded to two attempts. Repeated identical failures, test-environment errors, time-budget exhaustion, or out-of-scope changes will stop the workflow.
- The CLI will support a check operation for initial compatibility and a verify operation for candidate repairs. Both operations will emit human-readable output and structured run data.
- The repository will include a CI workflow that executes the full red-to-green fixture using pinned Node.js and package-manager versions. No Android SDK, JDK, Gradle installation, emulator, or device is required for the compatibility seam.
- Dependencies will be pinned, and the live demonstration will be runnable after dependencies are pre-cached. Network access will not be required during the judged compatibility run.
- The four engineers will work in parallel: the senior backend engineer owns the Node.js route and compatibility serializer; the MLOps engineer owns Codex analysis, structured outputs, repair, and safeguards; the frontend/app engineer owns tagged React Native releases, Zod parser behavior, and the focused evidence presentation; the full-stack engineer owns orchestration, worktrees, evidence, blast radius, CI, and integration.
- The repository README will lead with a one-sentence identity, a short demo video, a reproducible quick start, the closed operational loop, actual evidence, the Codex-versus-tests trust boundary, verification commands, repository structure, and honest limitations.

## Testing Decisions

- The primary and highest test seam is the complete compatibility-gate command. A test will execute the real Node.js route, capture its response, create isolated worktrees for the configured React Native tags, run release-specific Jest probes against production parsing code, classify results, calculate blast radius, and assert the process exit status and evidence bundle.
- The initial red-path acceptance test will prove that the proposed Node.js response containing `MANUAL_REVIEW` causes app release 1.0 to fail strict Zod parsing, release 1.1 to survive through its unknown fallback, and release 1.2 to parse the value natively.
- The red-path acceptance test will assert an incompatible exit status, an 18 percent sample blast radius when release 1.0 has an 18 percent configured Android share, and evidence that references the exact release 1.0 revision and parser failure.
- The green-path acceptance test will apply the candidate legacy projection in an isolated worktree, prove that the generated Node.js regression test fails before the repair and passes after it, recapture the real responses, and show all three React Native releases as compatible.
- The green-path acceptance test will assert a success exit status and a before-and-after matrix that preserves the original evidence instead of overwriting it.
- Good tests will assert externally observable behavior: emitted response bytes, process exit status, compatibility classification, evidence contents, patch boundaries, and before-and-after results. They will not assert private helper calls or prompt wording.
- The decisive compatibility tests will not mock the React Native response parser, the Node.js route, Git tags, or process exit codes. The demonstration must execute real production data-layer code at those boundaries.
- Model calls may be replaced by fixed structured responses in narrow unit tests, but at least one end-to-end demonstration and recorded artifact must use the real Codex workflow.
- Focused lower-level tests will cover release-adoption validation, blast-radius arithmetic, result classification, content hashing, command allowlisting, patch-scope enforcement, and evidence serialization where failures would otherwise be difficult to diagnose through the high seam.
- A malformed or missing release tag will produce an inconclusive gate result and exit code 2, never a pass.
- A Jest startup, dependency, or package-manager failure will produce an inconclusive result distinct from a production parser rejection.
- A Node.js route failure or response-capture mismatch will stop the run before historical client claims are emitted.
- Evidence tests will verify that the response bytes replayed by React Native parsing code have the same hash as the response captured from the Node.js route.
- Patch-scope tests will prove that a candidate touching an unapproved file category is rejected without running it.
- Semantic-safety tests will cover valid client versions, malformed versions, missing version headers, capable-client preservation, and the legacy `MANUAL_REVIEW` to `PENDING` projection.
- Repeatability testing will run the complete demo multiple times from clean worktrees and require equivalent classifications and evidence structure.
- CI will exercise the project on a clean runner with pinned Node.js and package-manager versions.
- The repository is greenfield, so there is no existing testing prior art to preserve. The first implementation should establish the complete compatibility-gate acceptance test as the dominant pattern and add lower seams only when the end-to-end failure cannot identify the defect economically.
- If time remains, a second small headless enum fixture with different type and field names will verify that semantic discovery is not hardcoded while keeping the judged demonstration focused on one scenario.

## Out of Scope

- Native Kotlin or Java Android client support and native Swift or Objective-C iOS client support.
- React Native screen automation, native-module compatibility, bridge compatibility, emulator or simulator automation, device farms, and end-to-end UI testing.
- More than one primary compatibility-change category during the hackathon.
- Nullability, date-format, field-removal, request-contract, authentication, and transport compatibility analysis.
- Support for backend runtimes other than Node.js in the MVP.
- General support for arbitrary Node.js frameworks or arbitrary public repositories.
- General OpenAPI schema-diff functionality.
- Google Play Console, Firebase, analytics-provider, or live production telemetry integrations.
- Claiming that every parser rejection causes an application crash. The product will report only the behavior proven by the historical test.
- Automatically inventing a legacy mapping when the business semantics do not provide a safe projection.
- Automatically creating, merging, or deploying a pull request.
- Production-grade execution sandboxing for untrusted repositories.
- GitHub authentication and multi-tenant repository management inside the product.
- A database, long-term run analytics, user accounts, and a large dashboard.
- Multiple agent personas, general agent orchestration, long-term memory, or model-routing infrastructure.
- More than two automated repair attempts.
- Treating sample Android installation percentages as live production facts.

## Further Notes

- The core positioning is executable mobile backward-compatibility proof, not AI risk prediction: **Codex interprets and repairs; real Node.js and React Native tests decide.**
- The memorable product loop is: capture the changed response, replay historical clients, block the merge, quantify exposure, propose a repair, and reopen the gate only after historical clients verify it.
- The primary differentiation from schema-diff and ordinary contract-testing tools is execution of exact proposed-backend output through actual historical production response parsing code, including release-specific runtime validation and normalization behavior.
- The submission should prioritize repository evidence over breadth. A passing CI workflow, immutable release tags, a checked-in sample evidence bundle, a short demo video, and one-command reproduction are more valuable than additional screens or change categories.
- The intended 90-second demonstration is: show the Node.js diff; run the gate; show exact response capture; reveal app release 1.0 failing with 18 percent sample Android exposure; show the Zod parser evidence; show the Codex-generated safe projection and regression test; rerun; finish with a success exit status and every supported release green.
- The final demonstrated claim should be precise: **A verified response-parsing failure affecting 18 percent of configured Android installations was stopped before merge, and the compatibility contract is now permanent.**
- Demo readiness requires the full workflow to run repeatedly without manual repair, all decisive claims to be traceable to evidence, and every unsupported or mocked behavior to be disclosed clearly.
