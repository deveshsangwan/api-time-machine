import { createServer } from "node:http";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ResolvedProjectConfiguration } from "./project-config.js";

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

export async function findLatestDashboardArtifact(runsRoot: string): Promise<string> {
  const candidates = await Promise.all(
    (await readdir(runsRoot)).map(async (entry) => {
      const path = resolve(runsRoot, entry, "run-view.json");
      try {
        return { path, modifiedAt: (await stat(path)).mtimeMs };
      } catch {
        return null;
      }
    }),
  );
  const latest = candidates
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => right.modifiedAt - left.modifiedAt)[0];
  if (!latest) throw new Error("No dashboard artifact exists. Run a check first.");
  return latest.path;
}

async function dashboardRoot(): Promise<string> {
  const candidates = [
    fileURLToPath(new URL("./dashboard/", import.meta.url)),
    fileURLToPath(new URL("../../dashboard/dist/", import.meta.url)),
  ];
  for (const candidate of candidates) {
    try {
      if ((await stat(resolve(candidate, "index.html"))).isFile()) return candidate;
    } catch {
      // Try the development layout after the packaged layout.
    }
  }
  throw new Error("Dashboard assets are missing. Build the dashboard before serving it.");
}

export async function serveDashboard(
  project: ResolvedProjectConfiguration,
  port = Number(process.env.ATM_DASHBOARD_PORT ?? 4173),
): Promise<void> {
  const assetsRoot = await dashboardRoot();
  const server = createServer(async (request, response) => {
    try {
      if (request.url === "/api/time-machine/latest") {
        const artifact = await findLatestDashboardArtifact(project.runsRoot);
        response.writeHead(200, { "content-type": contentTypes[".json"] });
        response.end(await readFile(artifact));
        return;
      }

      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      const requested = pathname === "/" ? "index.html" : pathname.slice(1);
      const path = resolve(assetsRoot, requested);
      const relativePath = relative(assetsRoot, path);
      if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, {
        "content-type": contentTypes[extname(path)] ?? "application/octet-stream",
      });
      response.end(await readFile(path));
    } catch (error) {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(
        `${JSON.stringify({ error: error instanceof Error ? error.message : String(error) })}\n`,
      );
    }
  });

  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolveListen);
  });
  console.log(`API Time Machine dashboard: http://127.0.0.1:${port}`);
}
