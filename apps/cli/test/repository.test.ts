import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { resolveClientRepository } from "../src/repository.js";

const execFileAsync = promisify(execFile);

describe("client repository resolution", () => {
  it("clones and reuses a separately located Git repository", async () => {
    const root = await mkdtemp(join(tmpdir(), "atm-repository-"));
    const source = join(root, "source");
    const cache = join(root, "cache");
    await execFileAsync("git", ["init", source]);
    await writeFile(join(source, "fixture.txt"), "fixture\n");
    await execFileAsync("git", ["-C", source, "add", "fixture.txt"]);
    await execFileAsync("git", [
      "-C",
      source,
      "-c",
      "user.name=API Time Machine",
      "-c",
      "user.email=atm@example.test",
      "commit",
      "-m",
      "fixture",
    ]);

    const sourceUrl = new URL(`file://${source}`).href;
    const repository = await resolveClientRepository(sourceUrl, cache);
    expect(repository).toMatch(/\.git$/);
    expect(await resolveClientRepository(sourceUrl, cache)).toBe(repository);
  });
});
