# API Time Machine: Plain-English Project Guide

## What this project does

API Time Machine is a safety check for backend changes.

Mobile apps do not all update immediately. A backend team can deploy a new API
response today while customers still use an old app version that was installed
months ago. If that old app does not understand the new response, it can reject
the data and stop that part of the app from working.

This project catches that problem before the backend change is merged.

## The demonstration example

The backend starts returning a new identity-verification status:

`MANUAL_REVIEW`

Older mobile apps know only:

`VERIFIED`, `PENDING`, and `REJECTED`

There are three historical Android React Native releases:

| Release | What happens when it receives `MANUAL_REVIEW` |
| --- | --- |
| `app-v1.0.0` | Rejects it because the Zod enum is strict. |
| `app-v1.1.0` | Accepts it by using an explicit unknown-value fallback. |
| `app-v1.2.0` | Accepts it because it supports the value natively. |

The first release represents 18% of the configured sample Android installation
share. Therefore, the unsafe backend change has an 18% sample blast radius.

## How the product works

1. The real Node.js backend route runs.
2. Its exact HTTP response is captured, including status, headers, body bytes,
   and a SHA-256 hash.
3. The captured body is passed into the real production parser from each old
   React Native release.
4. The system reports whether each release is compatible, incompatible, or
   inconclusive.
5. It displays a Client Survival Matrix and calculates the affected configured
   installation share.
6. If an older client rejects the new value, Codex may propose a narrow backend
   repair.
7. The repair is only verified after the real backend tests and every supported
   historical parser pass again.

For this demo, the safe repair is to send `PENDING` to older clients and keep
`MANUAL_REVIEW` for newer clients. This is valid only because manual review is
a more specific form of pending verification.

## The important trust boundary

Codex helps interpret the change and propose a repair. It does not decide
whether the change is compatible.

Real Node.js route execution and real React Native production parser tests are
the source of truth.

## Your frontend and app tasks

You own only these paths:

- `apps/mobile/**`
- `apps/dashboard/**`

### 1. Create honest mobile release history

- Keep `app-v1.0.0` as the strict parser release. It must reject
  `MANUAL_REVIEW`.
- Create a later commit and annotated tag `app-v1.1.0`. Its production parser
  must explicitly map unknown statuses to a fallback.
- Create a still later commit and annotated tag `app-v1.2.0`. Its production
  schema must support `MANUAL_REVIEW` natively.
- Keep `parseVerificationResponse` as the stable entry point in all three
  releases.
- Include matching parser tests and application-version metadata in every tag.
- Do not rewrite tags after handing them to integration.

### 2. Build the focused evidence dashboard

The dashboard is called **Raüh** (pronounced "roh"). API Time Machine remains
the technical product name.

Replace placeholder data with an adapter or fixture that has the exact shared
`CompatibilityRun` shape. The dashboard must show:

- overall gate status;
- the Client Survival Matrix;
- release tags and configured installation shares;
- evidence pointers;
- Blast Radius;
- compatible, incompatible, and inconclusive results; and
- before-and-after results once a repair is available.

The dashboard must work at desktop and narrow viewport widths. It is an
inspectable evidence surface, not a broad product dashboard.

### 3. Use precise language

- Say **parser rejection**, unless evidence proves an application crash.
- Say **configured installation share**, unless live telemetry is connected.
- Say **Candidate Repair** until backend tests and all supported historical
  releases pass.
- Label adoption percentages as sample data when they are sample configuration.

## Your boundaries

Do not edit these paths on the frontend/app workstream:

- `packages/contracts/**` (the frozen shared contract seam)
- `apps/backend/**`
- `apps/cli/**`
- `packages/orchestrator/**`
- `packages/codex/**`
- `config/**`
- `.github/**`
- root configuration

If `CompatibilityRun` does not contain a fact the dashboard truly needs, do
not change `packages/contracts` here. Propose a separate `contract/<topic>`
branch from `main`.

## Completion checks

Run these before handing the work back:

```bash
pnpm --filter @atm/mobile typecheck
pnpm --filter @atm/mobile test
pnpm --filter @atm/dashboard typecheck
pnpm --filter @atm/dashboard build
```

Report the release commit and tag SHAs, behavior of each release, command
results, dashboard screenshots or recording, accessibility limitations, and
remaining risks.

## Current starting point

At the time this guide was written, `app-v1.0.0` exists. The required
`app-v1.1.0` and `app-v1.2.0` tags still need to be created.
