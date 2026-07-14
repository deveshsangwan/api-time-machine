# Raüh brand handoff

## Name

Use **Raüh** as the dashboard and presentation brand. Pronounce it **roh**.

Raüh is typed like `rauh`, with an umlaut on the `u`. The name keeps the raw backend-truth association while changing the sound and mark into something more deliberate than plain "Raw". Keep **API Time Machine** as the technical product name in repository, PRD, and integration language unless the team approves a contract-wide rename.

## Positioning

Raüh is the evidence surface for API Time Machine:

> Raw backend truth, replayed with taste.

The product promise stays precise: exact Node.js response bytes are replayed through historical React Native production parsers. Codex interprets and proposes. Deterministic tests decide.

## UI Direction

- Dark graphite base: `#080907`, `#10110d`, `#12130f`.
- Signal accent: citrine `#dbff48`.
- Failure accent: hot repair red `#ff644f`.
- Success accent: parser green `#76f1a4`.
- Typography: compressed technical sans first, currently `"Bahnschrift"` with `"Aptos"` and `"Segoe UI Variable"` fallbacks.
- Mono voice: `"Cascadia Code"` first for tags, evidence, run IDs, and small machine labels.
- Shape language: squared edges, 1px borders, no soft SaaS cards.
- Imagery: grainy terminal or infrastructure texture, desaturated and contrast-raised.

## Component Rules

- Do not use Lucide icons or Lucide components.
- Prefer no icons unless the control truly needs one. If icons are introduced later, choose one family such as Phosphor or Tabler and use it consistently.
- Keep the Client Survival Matrix dense and inspectable. It is a judge-facing evidence surface, not a decorative dashboard.
- Say **parser rejection** unless evidence proves an application crash.
- Say **configured installation share** unless live telemetry is actually connected.
- Say **Candidate Repair** until backend tests and every supported release pass.
- Do not imply sample adoption data is production telemetry.

## Current Dashboard Contract

The dashboard should consume `CompatibilityRun` data and render:

- overall gate status,
- Client Survival Matrix,
- release tag and configured share,
- evidence source pointers,
- Blast Radius,
- before and after states once integration provides them.

If `CompatibilityRun` cannot express a presentation-critical fact, stop and propose a separate `contract/<topic>` branch. Do not change `packages/contracts` from the frontend workstream.

## Handoff Notes

Owned paths for this workstream are `apps/mobile/**` and `apps/dashboard/**`.

Required checks before handoff:

```bash
pnpm --filter @atm/mobile typecheck
pnpm --filter @atm/mobile test
pnpm --filter @atm/dashboard typecheck
pnpm --filter @atm/dashboard build
```
