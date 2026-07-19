import {
  compatibilityExitCode,
  renderSurvivalMatrix,
  runHistoricalCompatibilityGate,
} from "@atm/orchestrator";

import { captureConfiguredResponse } from "./capture-command.js";
import { runConfiguredClientProbe } from "./client-probe.js";
import { writeDashboardArtifact } from "./dashboard-artifact.js";
import type { ResolvedProjectConfiguration } from "./project-config.js";
import { resolveClientRepository } from "./repository.js";

export async function checkProject(project: ResolvedProjectConfiguration) {
  const runId = `run-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const clientRepository = await resolveClientRepository(
    project.clientRepository,
    project.repositoryCache,
  );
  const result = await runHistoricalCompatibilityGate(
    {
      runId,
      manifestPath: project.releasesManifest,
      repositoryPath: clientRepository,
      worktreesRoot: project.worktreesRoot,
      runsRoot: project.runsRoot,
    },
    {
      captureResponse(release) {
        return captureConfiguredResponse(project, release);
      },
      runClient(release, response) {
        return runConfiguredClientProbe(
          { ...project, clientRepository },
          runId,
          release,
          response,
        );
      },
    },
  );
  const dashboardArtifact = await writeDashboardArtifact(
    result.evidence.directory,
    result.run,
  );

  return {
    ...result,
    dashboardArtifact,
    exitCode: compatibilityExitCode(result.run.status),
    report: renderSurvivalMatrix(result.run),
  };
}
