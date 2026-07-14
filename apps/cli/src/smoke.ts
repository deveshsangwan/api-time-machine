import { captureVerificationResponse } from "@atm/backend";
import {
  ClientReleaseSchema,
  type ClientResult,
} from "@atm/contracts";
import { parseVerificationResponse } from "@atm/mobile";
import { runCompatibilityCheck } from "@atm/orchestrator";

const scaffoldRelease = ClientReleaseSchema.parse({
  platform: "android-react-native",
  version: "1.0.0",
  gitTag: "app-v1.0.0",
  activeShare: 1,
  supported: true,
  source: "scaffold-smoke",
  observedAt: "2026-07-14T00:00:00.000Z",
  testCommand: "in-process production parser",
});

export function runScaffoldSmoke() {
  return runCompatibilityCheck(
    { runId: "scaffold-smoke", releases: [scaffoldRelease] },
    {
      captureResponse(release) {
        return captureVerificationResponse({ appVersion: release.version });
      },
      async runClient(release, response): Promise<ClientResult> {
        const startedAt = performance.now();
        try {
          parseVerificationResponse(response.body);
          return {
            release,
            status: "compatible",
            responseSha256: response.sha256,
            durationMs: performance.now() - startedAt,
            summary: "Production parser accepted the captured response",
            evidence: {},
          };
        } catch (error) {
          return {
            release,
            status: "incompatible",
            responseSha256: response.sha256,
            durationMs: performance.now() - startedAt,
            summary:
              error instanceof Error ? error.message : "Parser rejected response",
            evidence: {},
          };
        }
      },
    },
  );
}
