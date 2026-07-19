import { access, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { checkProject } from "../src/check.js";
import { loadProjectConfiguration } from "../src/project-config.js";

describe("distributed repository check", () => {
  it("runs from one project against a historical client in a separate Git repository", async () => {
    const project = await mkdtemp(join(tmpdir(), "atm-distributed-"));
    const fixtureRepository = fileURLToPath(new URL("../../../", import.meta.url));
    await writeFile(
      join(project, "api-time-machine.config.json"),
      JSON.stringify({
        schemaVersion: 1,
        releases: { manifest: "releases.json" },
        backend: { capture: { command: ["node", "capture.mjs"] } },
        client: {
          repository: pathToFileURL(fixtureRepository).href,
          cache: ".api-time-machine/repositories",
          worktrees: ".api-time-machine/worktrees",
          probe: { command: ["node", "probe.mjs"] },
        },
        evidence: { runs: ".api-time-machine/runs" },
      }),
    );
    await writeFile(
      join(project, "releases.json"),
      JSON.stringify([
        {
          platform: "android-react-native",
          version: "1.0.0",
          gitTag: "app-v1.0.0",
          activeShare: 1,
          supported: true,
          source: "distributed-test",
          observedAt: "2026-07-14T00:00:00.000Z",
          testCommand: "external protocol probe",
        },
      ]),
    );
    await writeFile(
      join(project, "capture.mjs"),
      [
        'import { createHash } from "node:crypto";',
        'const body = JSON.stringify({ id: "1", status: "PENDING", updatedAt: "2026-07-14T00:00:00.000Z" });',
        'process.stdout.write(JSON.stringify({ request: { method: "GET", url: "/verification/1", appVersion: process.env.ATM_APP_VERSION }, statusCode: 200, headers: {}, body, sha256: createHash("sha256").update(body).digest("hex"), capturedAt: "2026-07-14T00:00:00.000Z" }));',
        "",
      ].join("\n"),
    );
    await writeFile(
      join(project, "probe.mjs"),
      [
        'import { access, writeFile } from "node:fs/promises";',
        'import { resolve } from "node:path";',
        'await access(resolve(process.env.ATM_CLIENT_DIR, "apps/mobile/src/api/verification.ts"));',
        'await writeFile(process.env.ATM_RESULT_PATH, JSON.stringify({ status: "compatible", responseSha256: process.env.ATM_RESPONSE_SHA256, summary: "Separate repository parser fixture accepted the response.", evidence: { sourceFile: "apps/mobile/src/api/verification.ts" } }));',
        "",
      ].join("\n"),
    );

    const result = await checkProject(await loadProjectConfiguration(project));

    expect(result.run.status).toBe("compatible");
    expect(result.run.clients[0]?.release.gitTag).toBe("app-v1.0.0");
    await access(result.dashboardArtifact);
  }, 30_000);
});
