# API Time Machine Codex workflow

This package is the probabilistic analysis and Candidate Repair layer. It is a
server/CLI component: React Native and the browser dashboard must never import
it or receive an OpenAI API key.

The deterministic compatibility runner remains the authority. Codex can
classify a grounded API change and propose a repair, but that proposal is not
verified until the orchestrator applies it in an isolated worktree and reruns
the historical clients.

## Security boundary

```text
mobile/dashboard -> sanitized @atm/contracts data
                              ^
integration CLI/backend -> deterministic orchestrator -> @atm/codex -> OpenAI
```

Never put `CODEX_API_KEY` in any of the following:

- Git, a committed `.env` file, fixtures, screenshots, logs, or issue text.
- `EXPO_PUBLIC_*`, `VITE_*`, React Native configuration, or browser JavaScript.
- An API response returned to the mobile app or dashboard.

The UI developer does **not** need the key. The integration process invokes
this package on a trusted machine and returns only validated, sanitized JSON.

### Local macOS storage

Store the key in macOS Keychain without placing it in shell history:

```bash
security add-generic-password \
  -a "$USER" \
  -s api-time-machine-codex \
  -w
```

The command prompts for the value. Run a live evaluation without printing it:

```bash
CODEX_API_KEY="$(security find-generic-password \
  -a "$USER" \
  -s api-time-machine-codex \
  -w)" pnpm --filter @atm/codex eval:sdk
```

Use a project-scoped key for this project. For shared automation, prefer a
project service-account key with the minimum permissions required. Do not
share one developer's personal key with the team.

### GitHub Actions storage

Push the code, never the key. In GitHub:

1. Open the repository **Settings**.
2. Open **Environments** and create or select `hackthon-demo`.
3. Add an environment secret named `CODEX_API_KEY`.
4. If available, add a required reviewer to that environment.
5. Reference the secret only from a trusted manual or protected-branch job.

The repository includes
`.github/workflows/codex-live-eval.yml`. It is manual-only, attaches the
`hackthon-demo` environment, and offers three modes:

- `auth-only` checks that the environment secret exists and can access the
  pinned model without making a generation request.
- `repair-only` performs the authentication check and then exercises the live
  Candidate Repair path.
- `full` performs the authentication check followed by live change analysis
  and Candidate Repair.

After pushing the branch, open **Actions → Live Codex evaluation → Run
workflow**, select the branch and start with `auth-only`. Use `full` for the
hackathon end-to-end engine demonstration.

Do not expose this secret to pull requests from forks or to unreviewed workflow
changes. Run deterministic checks on every pull request; reserve the paid live
evaluation for manual, nightly, or protected-branch runs.

If a key has appeared in a chat, screenshot, terminal output, accessibility
log, or commit, treat it as compromised: revoke it, create a replacement, and
update Keychain/GitHub. Deleting the text later is not sufficient.

Official references:

- [OpenAI API key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [OpenAI project keys and service accounts](https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform)

## Commands

From the repository root:

```bash
pnpm --filter @atm/codex simulate        # labelled synthetic mobile history
pnpm --filter @atm/codex eval            # deterministic MLOps evaluation
pnpm --filter @atm/codex demo            # fixture-backed workflow, no API key
pnpm --filter @atm/codex eval:sdk        # live analysis + Candidate Repair
pnpm --filter @atm/codex eval:sdk:repair # live repair-only rerun
pnpm --filter @atm/codex test
pnpm --filter @atm/codex typecheck
```

The production adapter is currently pinned to `gpt-5.6-sol` with `medium`
reasoning. Its thread is read-only, has approvals disabled, and cannot use the
network or web search. Returned JSON is schema-validated and then checked by
grounding and repair policy before it is accepted.

## UI integration

See [UI_INTEGRATION.md](./UI_INTEGRATION.md) for the exact ownership boundary,
available contract types, demo data flow, and completion checklist.

Current limitation: this branch provides the Codex library and CLI, not an HTTP
service. A true live UI flow therefore requires the integration owner to wire
the orchestrator/CLI result into a backend endpoint or a generated JSON
artifact. Until then, the UI can be built and demonstrated against the
explicitly labelled synthetic dataset.
