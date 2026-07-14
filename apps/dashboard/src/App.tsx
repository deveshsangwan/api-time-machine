import type { ClientResult, CompatibilityRun } from "@atm/contracts";

const sha = "0".repeat(64);

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
    responseSha256: sha,
    durationMs: 184,
    summary: "Strict Zod enum rejected MANUAL_REVIEW",
    evidence: {
      command: "pnpm test -- --runInBand",
      sourceFile: "apps/mobile/src/api/verification.ts",
      sourceLine: 5,
    },
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
    responseSha256: sha,
    durationMs: 171,
    summary: "Unknown-value fallback preserved parsing",
    evidence: {
      command: "pnpm test -- --runInBand",
      sourceFile: "apps/mobile/src/api/verification.ts",
      sourceLine: 5,
    },
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
    responseSha256: sha,
    durationMs: 166,
    summary: "Native MANUAL_REVIEW support",
    evidence: {
      command: "pnpm test -- --runInBand",
      sourceFile: "apps/mobile/src/api/verification.ts",
      sourceLine: 5,
    },
  },
];

const demoRun: CompatibilityRun = {
  runId: "rauh-demo-red-path",
  status: "incompatible",
  clients: scaffoldResults,
  blastRadius: 0.18,
  startedAt: "2026-07-14T00:00:00.000Z",
  completedAt: "2026-07-14T00:00:03.000Z",
};

const statusCopy = {
  compatible: "Survived",
  incompatible: "Rejected",
  inconclusive: "Inconclusive",
} as const;

const statusOrder = ["compatible", "incompatible", "inconclusive"] as const;

export type DashboardProps = {
  run?: CompatibilityRun;
  beforeRun?: CompatibilityRun;
};

function formatEvidencePointer(result: ClientResult): string {
  const { sourceFile, sourceLine } = result.evidence;

  if (!sourceFile) {
    return "Source pointer unavailable";
  }

  return sourceLine ? `${sourceFile}:${sourceLine}` : sourceFile;
}

export default function App({ run = demoRun, beforeRun }: DashboardProps) {
  const incompatibleClients = run.clients.filter(
    (client) => client.status === "incompatible",
  );
  const observedDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(run.startedAt));
  const representativeClient = run.clients[0];
  const responseHash = representativeClient
    ? `${representativeClient.responseSha256.slice(0, 8)}...${representativeClient.responseSha256.slice(-8)}`
    : "not captured";

  return (
    <main className="shell">
      <nav className="topbar" aria-label="Primary">
        <a className="brand" href="#top" aria-label="Raüh home">
          <span className="brand-mark">R</span>
          <span>
            <strong>Raüh</strong>
            <small>pronounced roh</small>
          </span>
        </a>
        <div className="nav-links" aria-label="Dashboard views">
          <a href="#matrix">Matrix</a>
          <a href="#evidence">Evidence</a>
          <a href="#handoff">Handoff</a>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">API Time Machine now wears Raüh</p>
          <h1>Unvarnished API truth, replayed.</h1>
          <p className="lede">
            Raüh captures the exact Node.js response and proves which shipped
            React Native clients survive it. Codex interprets. Tests decide.
          </p>
          <div className="hero-actions" aria-label="Primary outcomes">
            <a href="#matrix" className="button button-primary">
              View survival matrix
            </a>
            <a href="#handoff" className="button button-secondary">
              Read brand handoff
            </a>
          </div>
          <div className="response-map" aria-hidden="true">
            <span>status: MANUAL_REVIEW</span>
            <span>sha256: {responseHash}</span>
            <span>release: {representativeClient?.release.gitTag ?? "unavailable"}</span>
            <span>parser: z.enum</span>
          </div>
        </div>

        <aside className="signal-card" aria-label="Current gate signal">
          <span>Current gate</span>
          <strong data-status={run.status}>{statusCopy[run.status]}</strong>
          <p>
            {incompatibleClients.length} supported release rejected the captured
            response.
          </p>
          <dl>
            <div>
              <dt>Run</dt>
              <dd>{run.runId}</dd>
            </div>
            <div>
              <dt>Observed</dt>
              <dd>{observedDate}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className="workspace" aria-label="Raüh evidence dashboard">
        <div className="matrix-panel" id="matrix">
          <div className="section-heading">
            <p className="kicker">Client Survival Matrix</p>
            <h2>Historical releases, tested against the same bytes.</h2>
          </div>

          <div className="matrix" role="table" aria-label="Client results">
            <div className="matrix-head" role="row">
              <span role="columnheader">Release</span>
              <span role="columnheader">Result</span>
              <span role="columnheader">Evidence</span>
              <span role="columnheader">Share</span>
            </div>
            {run.clients.map((result) => (
              <article className="matrix-row" key={result.release.version} role="row">
                <div role="cell">
                  <span className="version">v{result.release.version}</span>
                  <span className="tag">{result.release.gitTag}</span>
                </div>
                <strong data-status={result.status} role="cell">
                  {statusCopy[result.status]}
                </strong>
                <div className="evidence-cell" role="cell">
                  <p>{result.summary}</p>
                  <code>{formatEvidencePointer(result)}</code>
                </div>
                <span className="share" role="cell">
                  {Math.round(result.release.activeShare * 100)}%
                </span>
              </article>
            ))}
          </div>
        </div>

        <aside className="blast-panel">
          <span>Blast radius</span>
          <strong>{Math.round(run.blastRadius * 100)}%</strong>
          <p>
            Configured Android installation share, from sample adoption data.
            This is not live production telemetry.
          </p>
        </aside>

        <section className="evidence-panel" id="evidence">
          <div className="section-heading">
            <p className="kicker">Evidence posture</p>
            <h2>Insight without overclaiming.</h2>
          </div>
          <div className="proof-grid">
            <article>
              <span>Captured response</span>
              <p>
                The backend route emits the body that historical parsers
                consume. No dashboard mock is allowed to decide compatibility.
              </p>
            </article>
            <article>
              <span>Parser rejection</span>
              <p>
                We say parser rejection unless evidence proves an application
                crash. The language stays tight.
              </p>
            </article>
            <article>
              <span>Candidate Repair</span>
              <p>
                A legacy projection stays a candidate until backend tests and
                every supported release pass.
              </p>
            </article>
          </div>
          <div className="state-strip" aria-label="Compatibility state treatments">
            {statusOrder.map((status) => (
              <span data-status={status} key={status}>
                {statusCopy[status]}
              </span>
            ))}
          </div>
        </section>

        {beforeRun ? (
          <section className="comparison-panel" aria-label="Before and after compatibility runs">
            <div className="section-heading">
              <p className="kicker">Verification progression</p>
              <h2>Before and after the Candidate Repair.</h2>
            </div>
            <div className="comparison-grid">
              <article>
                <span>Before</span>
                <strong data-status={beforeRun.status}>
                  {statusCopy[beforeRun.status]}
                </strong>
                <p>{beforeRun.runId}</p>
              </article>
              <article>
                <span>After</span>
                <strong data-status={run.status}>{statusCopy[run.status]}</strong>
                <p>{run.runId}</p>
              </article>
            </div>
          </section>
        ) : null}
      </section>

      <footer className="handoff" id="handoff">
        <div>
          <p className="kicker">Frontend handoff</p>
          <h2>Use Raüh for the polished surface. Keep API Time Machine as the technical product name.</h2>
        </div>
        <p>
          Ship the matrix as proof, not theater. Every claim should point back
          to captured bytes, historical parser behavior, and configured Android
          share.
        </p>
      </footer>
    </main>
  );
}
