import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const PROJECT_CONFIG_FILE = "api-time-machine.config.json";

export interface CommandConfiguration {
  command: [string, ...string[]];
  cwd?: string;
  timeoutMs?: number;
}

export interface ProjectConfiguration {
  schemaVersion: 1;
  releases: { manifest: string };
  backend: { capture: CommandConfiguration };
  client: {
    repository: string;
    cache?: string;
    worktrees: string;
    probe: CommandConfiguration;
  };
  evidence: { runs: string };
}

export interface ResolvedProjectConfiguration {
  projectRoot: string;
  releasesManifest: string;
  capture: CommandConfiguration & { cwd: string };
  clientRepository: string;
  repositoryCache: string;
  worktreesRoot: string;
  probe: CommandConfiguration & { cwd: string };
  runsRoot: string;
}

export class ProjectConfigurationError extends Error {
  override readonly name = "ProjectConfigurationError";

  constructor(message: string, readonly cause?: unknown) {
    super(message);
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ProjectConfigurationError(`${path} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ProjectConfigurationError(`${path} must be a non-empty string.`);
  }
  return value;
}

function repository(value: unknown): string {
  const source = string(value, "client.repository");
  if (source.includes("://")) {
    let url: URL;
    try {
      url = new URL(source);
    } catch {
      throw new ProjectConfigurationError("client.repository URL is invalid.");
    }
    if (url.username || url.password) {
      throw new ProjectConfigurationError(
        "client.repository must not contain embedded credentials.",
      );
    }
  }
  return source;
}

function command(value: unknown, path: string): CommandConfiguration {
  const input = record(value, path);
  if (
    !Array.isArray(input.command) ||
    input.command.length === 0 ||
    input.command.some((part) => typeof part !== "string" || part === "")
  ) {
    throw new ProjectConfigurationError(
      `${path}.command must be a non-empty array of command arguments.`,
    );
  }
  if (
    input.timeoutMs !== undefined &&
    (typeof input.timeoutMs !== "number" ||
      !Number.isInteger(input.timeoutMs) ||
      input.timeoutMs <= 0)
  ) {
    throw new ProjectConfigurationError(
      `${path}.timeoutMs must be a positive integer.`,
    );
  }

  return {
    command: input.command as [string, ...string[]],
    cwd: input.cwd === undefined ? undefined : string(input.cwd, `${path}.cwd`),
    timeoutMs: input.timeoutMs as number | undefined,
  };
}

export function parseProjectConfiguration(value: unknown): ProjectConfiguration {
  const input = record(value, "configuration");
  if (input.schemaVersion !== 1) {
    throw new ProjectConfigurationError("schemaVersion must be 1.");
  }
  const releases = record(input.releases, "releases");
  const backend = record(input.backend, "backend");
  const client = record(input.client, "client");
  const evidence = record(input.evidence, "evidence");

  return {
    schemaVersion: 1,
    releases: { manifest: string(releases.manifest, "releases.manifest") },
    backend: { capture: command(backend.capture, "backend.capture") },
    client: {
      repository: repository(client.repository),
      cache:
        client.cache === undefined ? undefined : string(client.cache, "client.cache"),
      worktrees: string(client.worktrees, "client.worktrees"),
      probe: command(client.probe, "client.probe"),
    },
    evidence: { runs: string(evidence.runs, "evidence.runs") },
  };
}

export async function loadProjectConfiguration(
  projectRoot: string,
  readText: (path: string) => Promise<string> = (path) => readFile(path, "utf8"),
): Promise<ResolvedProjectConfiguration> {
  const root = resolve(projectRoot);
  const path = resolve(root, PROJECT_CONFIG_FILE);
  let raw: string;
  try {
    raw = await readText(path);
  } catch (error) {
    throw new ProjectConfigurationError(
      `Could not read ${PROJECT_CONFIG_FILE} from ${root}: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ProjectConfigurationError(`${PROJECT_CONFIG_FILE} is not valid JSON.`);
  }

  const config = parseProjectConfiguration(json);
  return {
    projectRoot: root,
    releasesManifest: resolve(root, config.releases.manifest),
    capture: {
      ...config.backend.capture,
      cwd: resolve(root, config.backend.capture.cwd ?? "."),
    },
    clientRepository:
      config.client.repository.includes("://") ||
      /^[^/]+@[^:]+:/.test(config.client.repository)
        ? config.client.repository
        : resolve(root, config.client.repository),
    repositoryCache: resolve(
      root,
      config.client.cache ?? ".api-time-machine/repositories",
    ),
    worktreesRoot: resolve(root, config.client.worktrees),
    probe: {
      ...config.client.probe,
      cwd: resolve(root, config.client.probe.cwd ?? "."),
    },
    runsRoot: resolve(root, config.evidence.runs),
  };
}

export async function findProjectConfiguration(
  startDirectory: string,
  readText: (path: string) => Promise<string> = (path) => readFile(path, "utf8"),
): Promise<ResolvedProjectConfiguration> {
  let directory = resolve(startDirectory);
  while (true) {
    try {
      return await loadProjectConfiguration(directory, readText);
    } catch (error) {
      const cause = error instanceof ProjectConfigurationError ? error.cause : undefined;
      if (!(cause instanceof Error) || !("code" in cause) || cause.code !== "ENOENT") {
        throw error;
      }
    }

    const parent = dirname(directory);
    if (parent === directory) {
      throw new ProjectConfigurationError(
        `Could not find ${PROJECT_CONFIG_FILE} from ${resolve(startDirectory)} or its parents.`,
      );
    }
    directory = parent;
  }
}
