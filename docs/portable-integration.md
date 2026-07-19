# Portable integration

## Attach a repository

After installing or invoking the CLI, run:

```bash
api-time-machine init
```

This creates `api-time-machine.config.json` and capture, probe, and release-manifest stubs under `.api-time-machine/`. The adapter stubs intentionally fail until connected to the repository's real route execution and historical production parser. API Time Machine cannot safely infer those trust-boundary entry points for every framework.

```bash
api-time-machine doctor
api-time-machine check
api-time-machine dashboard
```

`doctor` validates configuration, one real capture, the client repository, and the first Historical Release tag without creating a complete run.

## Command protocol

The capture command receives `ATM_APP_VERSION` and must print exactly one `CapturedResponse` JSON object to stdout. Logs belong on stderr. API Time Machine independently validates the response body SHA-256 and requested application version.

The probe command receives:

| Variable | Meaning |
| --- | --- |
| `ATM_CAPTURE_PATH` | Validated captured-response JSON file |
| `ATM_CLIENT_DIR` | Disposable checkout of the Historical Release |
| `ATM_RELEASE_VERSION` | Configured release version |
| `ATM_RESPONSE_SHA256` | Expected response-body hash |
| `ATM_RESULT_PATH` | Destination for `ClientResult`-compatible JSON |

The probe exits 0 for compatible, 1 for incompatible, and 2 for inconclusive. Its JSON status, exit code, and response hash must agree or the engine records an inconclusive result.

## Repository layouts

For a monorepo, set `client.repository` to `.`. When the backend and application live in separate repositories, run the CLI from the backend repository and use the application Git URL:

```json
{
  "client": {
    "repository": "git@github.com:example/mobile-app.git",
    "cache": ".api-time-machine/repositories",
    "worktrees": ".api-time-machine/worktrees",
    "probe": { "command": ["node", ".api-time-machine/probe.mjs"] }
  }
}
```

Git credentials come from the invoking environment and are never written to configuration or evidence. Each manifest entry identifies an immutable tag, and evidence records its resolved commit.

## Dashboard and plugin

Every check writes `run-view.json` beside the full evidence manifest. It excludes raw stdout, stderr, prompts, secrets, and model-provider traces.

The dashboard consumes this artifact from the CLI's local server or from an artifact URL using `?artifact=<encoded-url>`. The Codex plugin runs the deterministic CLI first, reads the Evidence Bundle, and labels model-authored changes as Candidate Repairs until deterministic checks pass.
