import type { ClientResult } from "@atm/contracts";

const scaffoldResults: ClientResult[] = [
  {
    release: {
      platform: "android-react-native",
      version: "1.0.0",
      gitTag: "app-v1.0.0",
      activeShare: 0.18,
      supported: true,
      source: "hackathon-sample",
      observedAt: "2026-07-14T00:00:00.000Z",
      testCommand: "pnpm test -- --runInBand",
    },
    status: "incompatible",
    responseSha256: "0".repeat(64),
    durationMs: 184,
    summary: "Strict runtime enum rejected MANUAL_REVIEW",
    evidence: {},
  },
  {
    release: {
      platform: "android-react-native",
      version: "1.1.0",
      gitTag: "app-v1.1.0",
      activeShare: 0.27,
      supported: true,
      source: "hackathon-sample",
      observedAt: "2026-07-14T00:00:00.000Z",
      testCommand: "pnpm test -- --runInBand",
    },
    status: "compatible",
    responseSha256: "0".repeat(64),
    durationMs: 171,
    summary: "Unknown-value fallback preserved execution",
    evidence: {},
  },
  {
    release: {
      platform: "android-react-native",
      version: "1.2.0",
      gitTag: "app-v1.2.0",
      activeShare: 0.55,
      supported: true,
      source: "hackathon-sample",
      observedAt: "2026-07-14T00:00:00.000Z",
      testCommand: "pnpm test -- --runInBand",
    },
    status: "compatible",
    responseSha256: "0".repeat(64),
    durationMs: 166,
    summary: "Native MANUAL_REVIEW support",
    evidence: {},
  },
];

export default function App() {
  return (
    <main>
      <header>
        <p className="eyebrow">API TIME MACHINE · SCAFFOLD</p>
        <h1>Client Survival Matrix</h1>
        <p className="lede">
          Exact backend responses replayed through historical React Native
          parsers.
        </p>
      </header>

      <section className="matrix" aria-label="Client Survival Matrix">
        {scaffoldResults.map((result) => (
          <article key={result.release.version}>
            <div>
              <span className="version">v{result.release.version}</span>
              <span className="share">
                {Math.round(result.release.activeShare * 100)}% configured share
              </span>
            </div>
            <strong data-status={result.status}>{result.status}</strong>
            <p>{result.summary}</p>
          </article>
        ))}
      </section>

      <aside>
        <span>Blast radius</span>
        <strong>18%</strong>
        <p>Sample configuration—not live production telemetry.</p>
      </aside>
    </main>
  );
}
