import { useEffect, useMemo, useState } from "react";
import { GrainGradient, StaticRadialGradient } from "@paper-design/shaders-react";

import type {
  ChangeProfile,
  ClientResult,
  CompatibilityRun,
  RepairProposal,
} from "@atm/contracts";

const sha = "a7618f2c62b0e8ab95f3a9c00d35e4ba8e76b1a7d778987a4d35c29cc7b64ab9";

const demoRun: CompatibilityRun = {
  runId: "run_01J2R6P0V9N1H6B6D75M6NXPVA",
  status: "incompatible",
  blastRadius: 0.18,
  startedAt: "2026-07-14T00:00:00.000Z",
  completedAt: "2026-07-14T00:00:03.184Z",
  clients: [
    {
      release: {
        platform: "android-react-native",
        version: "1.0.0",
        gitTag: "app-v1.0.0",
        activeShare: 0.18,
        supported: true,
        source: "sample Android adoption configuration",
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
        source: "sample Android adoption configuration",
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
        sourceLine: 22,
      },
    },
    {
      release: {
        platform: "android-react-native",
        version: "1.2.0",
        gitTag: "app-v1.2.0",
        activeShare: 0.55,
        supported: true,
        source: "sample Android adoption configuration",
        observedAt: "2026-07-14T00:00:00.000Z",
        testCommand: "pnpm test -- --runInBand",
      },
      status: "compatible",
      responseSha256: sha,
      durationMs: 166,
      summary: "MANUAL_REVIEW is supported natively",
      evidence: {
        command: "pnpm test -- --runInBand",
        sourceFile: "apps/mobile/src/api/verification.ts",
        sourceLine: 4,
      },
    },
  ],
};

const statusCopy = {
  compatible: "Compatible",
  incompatible: "Parser rejection",
  inconclusive: "Inconclusive",
} as const;

export type DashboardProps = {
  run?: CompatibilityRun;
  beforeRun?: CompatibilityRun;
  semantic?: SemanticResult;
};

type SemanticResult =
  | { status: "not_requested" }
  | { status: "analysis_accepted"; change: ChangeProfile }
  | {
      status: "candidate_repair";
      change: ChangeProfile;
      repair: Pick<RepairProposal, "summary" | "legacyProjection" | "allowedPaths">;
    }
  | { status: "rejected"; message: string };

type DashboardPayload = {
  schemaVersion: 1;
  compatibility: CompatibilityRun;
  semantic: SemanticResult;
  source: "artifact" | "local-evidence";
};

function sourcePointer(result: ClientResult) {
  const { sourceFile, sourceLine } = result.evidence;
  return sourceFile ? `${sourceFile}${sourceLine ? `:${sourceLine}` : ""}` : "No source pointer";
}

function shortHash(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function formatDuration(value: number) {
  return `${Math.round(value)} ms`;
}

type DashboardViewProps = DashboardProps & {
  onExit: () => void;
  onAnalyze: () => void;
  codexState: "idle" | "running" | "failed";
  canAnalyze: boolean;
  integrationMessage: string;
};

function DashboardView({
  run = demoRun,
  beforeRun,
  semantic = { status: "not_requested" },
  onExit,
  onAnalyze,
  codexState,
  canAnalyze,
  integrationMessage,
}: DashboardViewProps) {
  const [selectedVersion, setSelectedVersion] = useState(run.clients[0]?.release.version ?? "");
  const [copied, setCopied] = useState(false);
  const selected = run.clients.find((result) => result.release.version === selectedVersion) ?? run.clients[0];
  const previous = beforeRun?.clients.find((result) => result.release.version === selected?.release.version);
  const rejected = run.clients.filter((result) => result.status === "incompatible");
  const completedAt = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(new Date(run.completedAt));
  const evidenceSummary = useMemo(
    () => JSON.stringify({
      release: selected?.release.gitTag ?? null,
      classification: selected?.status ?? "inconclusive",
      responseSha256: selected?.responseSha256 ?? null,
      parserSummary: selected?.summary ?? null,
    }, null, 2),
    [selected],
  );

  useEffect(() => {
    setSelectedVersion(run.clients[0]?.release.version ?? "");
  }, [run]);

  async function copyRunId() {
    try {
      await navigator.clipboard?.writeText(run.runId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="app-shell">
      <DashboardBackdrop />
      <aside className="sidebar" aria-label="Raüh navigation">
        <a className="wordmark" href="#" onClick={onExit} aria-label="Raüh overview">Raüh</a>
        <p className="product-name">API Time Machine</p>

        <nav className="side-nav" aria-label="Run views">
          <a className="active" href="#run">Current run</a>
          <a href="#clients">Client releases <span>{run.clients.length}</span></a>
          <a href="#response">Captured response</a>
          <a href="#evidence">Evidence</a>
        </nav>

        <div className="sidebar-bottom">
          <p className="eyebrow">Meaning</p>
          <p>
            <strong>raüh</strong> is the raw wire response before interpretation. The surface shows the bytes, then the proof.
          </p>
          <span className="environment">sample Android adoption data</span>
        </div>
      </aside>

      <main className="workspace" id="run">
        <header className="topbar">
          <div>
            <p className="eyebrow">Compatibility gate / run detail</p>
            <h1>Client survival review</h1>
          </div>
          <div className="topbar-actions">
            <button className="quiet-button" type="button" onClick={onExit}>Overview</button>
            <span className={`status status-${run.status}`}>{statusCopy[run.status]}</span>
            <button
              className="quiet-button codex-button"
              type="button"
              disabled={codexState === "running" || !canAnalyze}
              onClick={onAnalyze}
            >
              {codexState === "running"
                ? "Codex is analyzing…"
                : canAnalyze
                  ? "Analyze with Codex"
                  : "Use Codex plugin"}
            </button>
            <button className="quiet-button" type="button" onClick={copyRunId}>
              {copied ? "Copied" : "Copy run ID"}
            </button>
          </div>
        </header>

        <section className="run-strip" aria-label="Current run summary">
          <div>
            <span>Run ID</span>
            <strong>{run.runId}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedAt}</strong>
          </div>
          <div>
            <span>Scope</span>
            <strong>{run.clients.length} configured releases</strong>
          </div>
          <div>
            <span>Response hash</span>
            <strong>{shortHash(selected?.responseSha256 ?? sha)}</strong>
          </div>
        </section>

        <section className="outcome-grid" aria-label="Gate outcome">
          <article className="outcome primary-outcome">
            <span className="eyebrow">Gate result</span>
            <strong className={`outcome-value status-${run.status}`}>{statusCopy[run.status]}</strong>
            <p>{rejected.length} supported release{rejected.length === 1 ? "" : "s"} rejected the exact backend response.</p>
          </article>
          <article className="outcome">
            <span className="eyebrow">Blast radius</span>
            <strong className="outcome-value">{Math.round(run.blastRadius * 100)}%</strong>
            <p>Configured installation share. Sample data, not production telemetry.</p>
          </article>
          <article className="outcome">
            <span className="eyebrow">Replay coverage</span>
            <strong className="outcome-value">{run.clients.length}/{run.clients.length}</strong>
            <p>Supported releases replayed against the same response bytes.</p>
          </article>
        </section>

        <section className="execution" aria-labelledby="execution-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Execution path</p>
              <h2 id="execution-title">One captured response. Historical parsers.</h2>
            </div>
            <span className="hash-label">sha256 {shortHash(selected?.responseSha256 ?? sha)}</span>
          </div>
          <div className="execution-track">
            <article className="step captured">
              <span>01</span>
              <strong>Response captured</strong>
              <p>Exact response hash retained for this compatibility run.</p>
            </article>
            {run.clients.map((result, index) => (
              <button
                className={`step parser status-${result.status} ${selected?.release.version === result.release.version ? "selected" : ""}`}
                key={result.release.version}
                type="button"
                onClick={() => setSelectedVersion(result.release.version)}
              >
                <span>0{index + 2}</span>
                <strong>v{result.release.version}</strong>
                <p>{statusCopy[result.status]}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="review-grid">
          <section className="surface clients-surface" id="clients" aria-labelledby="clients-title">
            <div className="surface-header">
              <div>
                <p className="eyebrow">Client survival matrix</p>
                <h2 id="clients-title">Release-by-release result</h2>
              </div>
              <span>{run.clients.length} releases</span>
            </div>

            <div className="client-table" role="table" aria-label="Client survival matrix">
              <div className="table-row table-head" role="row">
                <span role="columnheader">Release</span>
                <span role="columnheader">Parser result</span>
                <span role="columnheader">Configured installation share</span>
                <span role="columnheader">Probe time</span>
              </div>
              {run.clients.map((result) => (
                <button
                  className={`table-row status-${result.status} ${selected?.release.version === result.release.version ? "selected" : ""}`}
                  key={result.release.version}
                  role="row"
                  type="button"
                  onClick={() => setSelectedVersion(result.release.version)}
                >
                  <span role="cell"><strong>v{result.release.version}</strong><small>{result.release.gitTag}</small></span>
                  <span role="cell"><b>{statusCopy[result.status]}</b><small>{result.summary}</small></span>
                  <span role="cell" className="numeric">{Math.round(result.release.activeShare * 100)}%</span>
                  <span role="cell" className="numeric">{formatDuration(result.durationMs)}</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="surface inspector" id="response" aria-labelledby="inspector-title">
            <div className="surface-header">
              <div>
                <p className="eyebrow">Evidence inspector</p>
                <h2 id="inspector-title">Recorded run evidence</h2>
              </div>
              <span className="method">SHA-256</span>
            </div>
            <pre aria-label="Recorded compatibility evidence"><code>{evidenceSummary}</code></pre>
            <dl className="inspector-meta">
              <div><dt>Selected parser</dt><dd>v{selected?.release.version ?? "-"}</dd></div>
              <div><dt>Source</dt><dd>{selected ? sourcePointer(selected) : "-"}</dd></div>
              <div><dt>Command</dt><dd>{selected?.evidence.command ?? "No command recorded"}</dd></div>
              <div><dt>Adoption input</dt><dd>{selected ? `${selected.release.source}; observed ${new Date(selected.release.observedAt).toLocaleString()}` : "No adoption input recorded"}</dd></div>
            </dl>
          </aside>
        </section>

        <section className="surface semantic-surface" aria-labelledby="semantic-title">
          <div className="surface-header">
            <div>
              <p className="eyebrow">Codex SDK / advisory layer</p>
              <h2 id="semantic-title">Semantic analysis</h2>
            </div>
            <span className={`semantic-state semantic-${semantic.status}`}>
              {semantic.status === "candidate_repair" ? "Candidate Repair · unverified" : semantic.status.replaceAll("_", " ")}
            </span>
          </div>
          <div className="semantic-body">
            {semantic.status === "not_requested" ? (
              <p>Run Codex against the latest captured response and the current uncommitted backend diff.</p>
            ) : null}
            {semantic.status === "analysis_accepted" ? (
              <>
                <strong>{semantic.change.endpoint}</strong>
                <p>Accepted change profile: <code>{semantic.change.field}</code> adds <code>{semantic.change.newValues.join(", ")}</code>. Deterministic parser results above remain authoritative.</p>
              </>
            ) : null}
            {semantic.status === "candidate_repair" ? (
              <>
                <strong>{semantic.repair.summary}</strong>
                <p>
                  Proposed legacy projection: <code>{semantic.repair.legacyProjection?.from}</code> to <code>{semantic.repair.legacyProjection?.to}</code> below <code>{semantic.repair.legacyProjection?.capabilityThreshold}</code>. This is not verified until the isolated historical-client rerun passes.
                </p>
              </>
            ) : null}
            {semantic.status === "rejected" ? <p>{semantic.message}</p> : null}
            <small>{integrationMessage}</small>
          </div>
        </section>

        <section className="surface evidence" id="evidence" aria-labelledby="evidence-title">
          <div className="surface-header">
            <div>
              <p className="eyebrow">Evidence ledger</p>
              <h2 id="evidence-title">Selected release: v{selected?.release.version ?? "-"}</h2>
            </div>
          </div>
          <div className="evidence-grid">
            <div><span>Classification</span><strong className={`status-${selected?.status ?? "inconclusive"}`}>{selected ? statusCopy[selected.status] : "Inconclusive"}</strong></div>
            <div><span>Response hash</span><strong>{shortHash(selected?.responseSha256 ?? sha)}</strong></div>
            <div><span>Observed behavior</span><strong>{selected?.summary ?? "No release selected"}</strong></div>
            <div><span>Trust boundary</span><strong>Route and parser tests decide</strong></div>
          </div>
          {beforeRun ? (
            <div className="comparison-row">
              <span>Candidate Repair comparison</span>
              <strong>{previous ? statusCopy[previous.status] : "No prior release result"} to {selected ? statusCopy[selected.status] : "Inconclusive"}</strong>
              <small>Before run: {beforeRun.runId}</small>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function Landing({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  const [hasWebgl, setHasWebgl] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    setHasWebgl(Boolean(canvas.getContext("webgl2")));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(media.matches);
    syncMotionPreference();
    media.addEventListener("change", syncMotionPreference);
    return () => media.removeEventListener("change", syncMotionPreference);
  }, []);

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="hero-shader" aria-hidden="true">
          {hasWebgl ? (
            <GrainGradient
              width="100%"
              height="100%"
              colors={["#1a202a", "#263652", "#38527c", "#222c3c"]}
              colorBack="#151513"
              softness={0.5}
              intensity={0.62}
              noise={0.24}
              shape="sphere"
              speed={reduceMotion ? 0 : 0.46}
              scale={0.68}
              minPixelRatio={1}
              maxPixelCount={1_100_000}
            />
          ) : null}
        </div>

        <header className="landing-nav">
          <a className="landing-wordmark" href="#" aria-label="Raüh home">Raüh</a>
          <div className="landing-nav-actions">
            <span>API Time Machine · CI for mobile clients you can no longer update</span>
            <button className="nav-dashboard-button" type="button" onClick={onOpenDashboard}>Open dashboard</button>
          </div>
        </header>

        <div className="landing-copy">
          <p className="landing-kicker">Raw response compatibility</p>
          <h1>Ship API changes with every client release in view.</h1>
          <p className="landing-summary">
            Raüh captures the exact response your route emits, replays it through the apps people still use, and leaves an evidence trail for every decision.
          </p>
          <div className="landing-actions">
            <button className="primary-button" type="button" onClick={onOpenDashboard}>Review the latest run</button>
            <a className="text-link" href="#how-it-works">How it works</a>
          </div>
        </div>

        <button className="landing-preview" type="button" onClick={onOpenDashboard} aria-label="Open compatibility dashboard">
          <div className="preview-topline">
            <span>Latest compatibility gate</span>
            <b>1 release rejected</b>
          </div>
          <div className="preview-table">
            <div><span>Response</span><strong>MANUAL_REVIEW</strong></div>
            <div><span>v1.0.0</span><strong className="preview-rejected">Rejected</strong></div>
            <div><span>v1.1.0</span><strong className="preview-compatible">Compatible</strong></div>
            <div><span>v1.2.0</span><strong className="preview-compatible">Compatible</strong></div>
          </div>
          <div className="preview-footer"><span>GET /verification/:id</span><span>Open run detail</span></div>
        </button>
      </section>

      <section className="landing-proof" id="how-it-works">
        <p className="landing-kicker">The raw truth, replayed</p>
        <h2>Capture the bytes. Test the past. Know the blast radius.</h2>
        <div className="proof-grid">
          <article><span>01</span><h3>Capture</h3><p>Take the response from the real route, not a hand-written fixture.</p></article>
          <article><span>02</span><h3>Replay</h3><p>Run it through the production parsers from the releases still in circulation.</p></article>
          <article><span>03</span><h3>Decide</h3><p>See exactly what survives, what breaks, and the evidence behind it.</p></article>
        </div>
      </section>
    </div>
  );
}

function DashboardBackdrop() {
  const [hasWebgl, setHasWebgl] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    setHasWebgl(Boolean(canvas.getContext("webgl2")));
  }, []);

  return (
    <div className="dashboard-shader" aria-hidden="true">
      {hasWebgl ? (
        <StaticRadialGradient
          width="100%"
          height="100%"
          colors={["#17191b", "#202938", "#2d3b52"]}
          colorBack="#151513"
          radius={1.2}
          focalDistance={1.16}
          focalAngle={30}
          falloff={0.42}
          mixing={0.3}
          distortion={0}
          distortionShift={0}
          distortionFreq={8}
          grainMixer={0.075}
          grainOverlay={0.03}
          minPixelRatio={1}
          maxPixelCount={1_100_000}
        />
      ) : null}
    </div>
  );
}

export default function App({ run, beforeRun, semantic: suppliedSemantic }: DashboardProps) {
  const [dashboardOpen, setDashboardOpen] = useState(() => window.location.hash === "#dashboard");
  const [livePayload, setLivePayload] = useState<DashboardPayload>();
  const [semanticOverride, setSemanticOverride] = useState<SemanticResult>();
  const [codexState, setCodexState] = useState<"idle" | "running" | "failed">("idle");
  const [integrationMessage, setIntegrationMessage] = useState(
    run ? "CompatibilityRun supplied by the host application." : "Connecting to the local evidence bridge…",
  );

  const activeRun = run ?? livePayload?.compatibility ?? demoRun;
  const activeSemantic = suppliedSemantic ?? semanticOverride ?? livePayload?.semantic ?? { status: "not_requested" as const };

  useEffect(() => {
    const syncRoute = () => setDashboardOpen(window.location.hash === "#dashboard");
    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    if (run) return;

    const controller = new AbortController();
    const artifactUrl = new URLSearchParams(window.location.search).get("artifact");
    fetch(artifactUrl ?? "/api/time-machine/latest", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Local evidence bridge is unavailable.");
        return response.json() as Promise<DashboardPayload>;
      })
      .then((payload) => {
        if (payload.schemaVersion !== 1 || !payload.compatibility) {
          throw new Error("Dashboard artifact is invalid or unsupported.");
        }
        setLivePayload(payload);
        setIntegrationMessage(
          payload.source === "artifact"
            ? "Loaded from a portable deterministic run artifact."
            : "Loaded from the latest local deterministic evidence bundle.",
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setIntegrationMessage("Showing bundled sample data. Start the local dashboard bridge to load real evidence.");
      });

    return () => controller.abort();
  }, [run]);

  async function analyzeWithCodex() {
    setCodexState("running");
    try {
      const response = await fetch("/api/time-machine/codex", { method: "POST" });
      const body = await response.json() as DashboardPayload | { error?: string };
      if (!response.ok || !("compatibility" in body)) {
        throw new Error("error" in body ? body.error : "Codex analysis failed.");
      }
      setLivePayload(body);
      setSemanticOverride(body.semantic);
      setCodexState("idle");
      setIntegrationMessage("Validated Codex SDK output grounded in the current backend diff and local run evidence.");
    } catch (error) {
      setCodexState("failed");
      setSemanticOverride({
        status: "rejected",
        message: error instanceof Error ? error.message : "Codex analysis failed.",
      });
      setIntegrationMessage("Codex output was not accepted; deterministic compatibility evidence is unchanged.");
    }
  }

  function openDashboard() {
    window.location.hash = "dashboard";
    setDashboardOpen(true);
  }

  function closeDashboard() {
    window.location.hash = "";
    setDashboardOpen(false);
  }

  return dashboardOpen ? (
    <DashboardView
      run={activeRun}
      beforeRun={beforeRun}
      semantic={activeSemantic}
      onExit={closeDashboard}
      onAnalyze={analyzeWithCodex}
      codexState={codexState}
      canAnalyze={livePayload?.source !== "artifact"}
      integrationMessage={integrationMessage}
    />
  ) : (
    <Landing onOpenDashboard={openDashboard} />
  );
}
