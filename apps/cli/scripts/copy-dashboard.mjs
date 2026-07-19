import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const cliRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const source = resolve(cliRoot, "../dashboard/dist");
const target = resolve(cliRoot, "dist/dashboard");
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
