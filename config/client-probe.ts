import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import type { CapturedResponse } from "../packages/contracts/src/index.js";

const execFileAsync = promisify(execFile);
const capturePath = process.env.ATM_CAPTURE_PATH;
const clientDirectory = process.env.ATM_CLIENT_DIR;
const resultPath = process.env.ATM_RESULT_PATH;
const expectedHash = process.env.ATM_RESPONSE_SHA256;
if (!capturePath || !clientDirectory || !resultPath || !expectedHash) {
  throw new Error("API Time Machine probe environment is incomplete.");
}

const capture = JSON.parse(await readFile(capturePath, "utf8")) as CapturedResponse;
const marker = `ATM_RESPONSE_SHA256=${expectedHash}`;
const rejectionMarker = "ATM_PARSER_REJECTION";
const probePath = resolve(
  clientDirectory,
  "apps/mobile/test/api-time-machine.probe.test.ts",
);
await writeFile(
  probePath,
  [
    'import { createHash } from "node:crypto";',
    'import { describe, expect, it } from "vitest";',
    'import { parseVerificationResponse } from "../src/api/verification.js";',
    `const body = ${JSON.stringify(capture.body)};`,
    `const expected = ${JSON.stringify(expectedHash)};`,
    'describe("API Time Machine compatibility probe", () => {',
    '  it("replays the exact captured response", () => {',
    '    const actual = createHash("sha256").update(body).digest("hex");',
    '    expect(actual).toBe(expected);',
    '    console.log("ATM_RESPONSE_SHA256=" + actual);',
    '    try { parseVerificationResponse(body); } catch (error) {',
    '      console.error("ATM_PARSER_REJECTION", error);',
    '      throw error;',
    '    }',
    '  });',
    '});',
    '',
  ].join("\n"),
  "utf8",
);

async function run(arguments_: string[]) {
  try {
    const result = await execFileAsync("npm", arguments_, {
      maxBuffer: 2_000_000,
      timeout: 60_000,
    });
    return { exitCode: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const failure = error as Error & {
      code?: number;
      stdout?: string;
      stderr?: string;
    };
    return {
      exitCode: typeof failure.code === "number" ? failure.code : 2,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? failure.message,
    };
  }
}

const pnpm = (arguments_: string[]) => [
  "exec",
  "--yes",
  "pnpm@11.7.0",
  "--",
  "pnpm",
  "--dir",
  clientDirectory,
  ...arguments_,
];
const install = await run(pnpm(["install", "--frozen-lockfile"]));
const probe =
  install.exitCode === 0
    ? await run(
        pnpm([
          "--filter",
          "@atm/mobile",
          "test",
          "--",
          "test/api-time-machine.probe.test.ts",
        ]),
      )
    : install;
const output = `${probe.stdout}\n${probe.stderr}`;
const status =
  probe.exitCode === 0
    ? "compatible"
    : output.includes(marker) && output.includes(rejectionMarker)
      ? "incompatible"
      : "inconclusive";

await writeFile(
  resultPath,
  JSON.stringify({
    status,
    responseSha256: expectedHash,
    summary:
      status === "compatible"
        ? "Production parser accepted the captured response."
        : status === "incompatible"
          ? "Production parser rejected the captured response."
          : "Historical parser probe did not produce conclusive evidence.",
    evidence: { sourceFile: "apps/mobile/src/api/verification.ts" },
  }),
  "utf8",
);
process.stdout.write(`[install]\n${install.stdout}\n[probe]\n${probe.stdout}`);
process.stderr.write(`[install]\n${install.stderr}\n[probe]\n${probe.stderr}`);
process.exitCode = status === "compatible" ? 0 : status === "incompatible" ? 1 : 2;
