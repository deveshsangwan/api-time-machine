import { describe, expect, it } from "vitest";

import { runCommand } from "../src/index.js";

describe("runCommand", () => {
  it("executes an allowlisted argument array without a shell", async () => {
    const result = await runCommand(process.execPath, [
      "-e",
      "console.log('historical probe')",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe("historical probe\n");
    expect(result.stderr).toBe("");
    expect(result.timedOut).toBe(false);
  });

  it("returns a bounded failure when a command exceeds its time budget", async () => {
    const result = await runCommand(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      25,
    );

    expect(result.exitCode).toBe(-1);
    expect(result.timedOut).toBe(true);
  });
});
