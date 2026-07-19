import { execFile } from "node:child_process";
import { access, mkdtemp, mkdir, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryRoot = await mkdtemp(join(tmpdir(), "atm-package-smoke-"));
const projectRoot = join(temporaryRoot, "project");
await mkdir(projectRoot);
await execFileAsync("pnpm", ["pack", "--pack-destination", temporaryRoot], {
  cwd: packageRoot,
});
const tarball = (await readdir(temporaryRoot)).find((entry) => entry.endsWith(".tgz"));
if (!tarball) throw new Error("CLI package smoke could not find the packed tarball.");

await writeFile(
  join(projectRoot, "package.json"),
  '{"name":"atm-package-smoke","private":true,"type":"module"}\n',
);
await execFileAsync(
  "npm",
  ["install", "--cache", join(temporaryRoot, "npm-cache"), join(temporaryRoot, tarball)],
  { cwd: projectRoot },
);
await execFileAsync(join(projectRoot, "node_modules/.bin/api-time-machine"), ["init"], {
  cwd: projectRoot,
});
await Promise.all([
  access(join(projectRoot, "api-time-machine.config.json")),
  access(join(projectRoot, ".api-time-machine/capture.mjs")),
  access(join(projectRoot, ".api-time-machine/probe.mjs")),
  access(join(projectRoot, "node_modules/@atm/cli/dist/dashboard/index.html")),
]);
process.stdout.write("Packed CLI initialized an empty project successfully.\n");
