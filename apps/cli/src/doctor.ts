import { loadReleaseManifest } from "@atm/orchestrator";

import { captureConfiguredResponse } from "./capture-command.js";
import { executeCommand } from "./command.js";
import type { ResolvedProjectConfiguration } from "./project-config.js";
import { resolveClientRepository } from "./repository.js";

export async function doctorProject(
  project: ResolvedProjectConfiguration,
): Promise<string> {
  const releases = await loadReleaseManifest(project.releasesManifest);
  const release = releases[0];
  if (!release) throw new Error("Release manifest contains no supported releases.");

  const [response, repository] = await Promise.all([
    captureConfiguredResponse(project, release),
    resolveClientRepository(project.clientRepository, project.repositoryCache),
  ]);
  const revision = await executeCommand({
    executable: "git",
    arguments: ["-C", repository, "rev-parse", `${release.gitTag}^{commit}`],
    cwd: repository,
    timeoutMs: 30_000,
    environment: process.env,
  });
  if (revision.exitCode !== 0) {
    throw new Error(`Historical release tag is unavailable: ${release.gitTag}`);
  }
  return [
    `Configuration: ${project.projectRoot}`,
    `Supported releases: ${releases.length}`,
    `Capture command: valid response for ${release.version} (${response.sha256.slice(0, 12)}...)`,
    `Client repository: ${release.gitTag} resolved to ${revision.stdout.trim().slice(0, 12)}...`,
    "Doctor: ready",
  ].join("\n");
}
