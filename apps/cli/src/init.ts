import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PROJECT_CONFIG_FILE } from "./project-config.js";

const scaffoldDirectory = ".api-time-machine";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(path: string, contents: string): Promise<void> {
  if (!(await exists(path))) await writeFile(path, contents, "utf8");
}

export async function initializeProject(projectRoot: string): Promise<string> {
  const root = resolve(projectRoot);
  const configPath = resolve(root, PROJECT_CONFIG_FILE);
  if (await exists(configPath)) {
    return `Already attached: ${configPath}`;
  }

  const directory = resolve(root, scaffoldDirectory);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeIfMissing(resolve(directory, "releases.json"), "[]\n"),
    writeIfMissing(
      resolve(directory, "capture.mjs"),
      [
        'throw new Error("Implement this command to print one CapturedResponse JSON object to stdout. ATM_APP_VERSION contains the release being checked.");',
        "",
      ].join("\n"),
    ),
    writeIfMissing(
      resolve(directory, "probe.mjs"),
      [
        'throw new Error("Implement this command to replay ATM_CAPTURE_PATH through the historical client at ATM_CLIENT_DIR and write ClientResult-compatible JSON to ATM_RESULT_PATH.");',
        "",
      ].join("\n"),
    ),
  ]);

  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        releases: { manifest: `${scaffoldDirectory}/releases.json` },
        backend: {
          capture: { command: ["node", `${scaffoldDirectory}/capture.mjs`] },
        },
        client: {
          repository: ".",
          worktrees: `${scaffoldDirectory}/worktrees`,
          probe: { command: ["node", `${scaffoldDirectory}/probe.mjs`] },
        },
        evidence: { runs: `${scaffoldDirectory}/runs` },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const gitignorePath = resolve(root, ".gitignore");
  const existingGitignore = (await exists(gitignorePath))
    ? await readFile(gitignorePath, "utf8")
    : "";
  const ignored = [
    `${scaffoldDirectory}/repositories/`,
    `${scaffoldDirectory}/worktrees/`,
    `${scaffoldDirectory}/runs/`,
  ].filter((line) => !existingGitignore.split(/\r?\n/).includes(line));
  if (ignored.length > 0) {
    await writeFile(
      gitignorePath,
      `${existingGitignore}${existingGitignore && !existingGitignore.endsWith("\n") ? "\n" : ""}${ignored.join("\n")}\n`,
      "utf8",
    );
  }

  return [
    `Attached API Time Machine at ${root}.`,
    `Configure ${scaffoldDirectory}/releases.json, capture.mjs, and probe.mjs.`,
    "Then run: api-time-machine doctor",
  ].join("\n");
}
