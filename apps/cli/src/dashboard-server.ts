import { createServer, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";

import {
  CodexSdkAdapter,
  CodexWorkflowError,
  createCodexWorkflow,
} from "@atm/codex";

import {
  DashboardApiError,
  analyzeEvidence,
  evidencePayload,
  loadLatestEvidence,
  readBackendDiff,
} from "./dashboard-api.js";

const repositoryPath = fileURLToPath(new URL("../../../", import.meta.url));
const runsRoot = `${repositoryPath}runs`;
const port = Number(process.env.ATM_DASHBOARD_API_PORT ?? 8787);

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "access-control-allow-origin": "http://localhost:5173",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(`${JSON.stringify(body)}\n`);
}

function publicError(error: unknown): { statusCode: number; message: string } {
  if (error instanceof DashboardApiError) {
    return { statusCode: error.statusCode, message: error.message };
  }
  if (error instanceof CodexWorkflowError) {
    const messages = {
      adapter: "Codex SDK could not complete the request. Check the bridge process authentication.",
      timeout: "Codex analysis timed out without changing the deterministic result.",
      schema: "Codex returned output that did not match the required schema.",
      grounding: "Codex output could not be grounded in the captured evidence.",
      policy: "Codex output was rejected by the Candidate Repair policy.",
    } as const;
    return { statusCode: 422, message: messages[error.category] };
  }
  return { statusCode: 500, message: "Dashboard integration failed." };
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-origin": "http://localhost:5173",
    });
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && request.url === "/api/time-machine/latest") {
      sendJson(response, 200, evidencePayload(await loadLatestEvidence(runsRoot)));
      return;
    }

    if (request.method === "POST" && request.url === "/api/time-machine/codex") {
      const evidence = await loadLatestEvidence(runsRoot);
      const diff = await readBackendDiff(repositoryPath);
      const workflow = createCodexWorkflow(
        new CodexSdkAdapter({
          apiKey: process.env.CODEX_API_KEY,
          workingDirectory: repositoryPath,
        }),
      );
      sendJson(response, 200, await analyzeEvidence(evidence, diff, workflow));
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    const failure = publicError(error);
    sendJson(response, failure.statusCode, { error: failure.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`API Time Machine dashboard bridge listening on http://127.0.0.1:${port}`);
});
