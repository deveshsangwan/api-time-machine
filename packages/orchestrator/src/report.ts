import type { CompatibilityRun } from "@atm/contracts";

export type CompatibilityExitCode = 0 | 1 | 2;

export function compatibilityExitCode(
  status: CompatibilityRun["status"],
): CompatibilityExitCode {
  switch (status) {
    case "compatible":
      return 0;
    case "incompatible":
      return 1;
    case "inconclusive":
      return 2;
  }
}

export function renderSurvivalMatrix(run: CompatibilityRun): string {
  const rows = [
    "API Time Machine — Client Survival Matrix",
    `Run: ${run.runId}`,
    `Gate: ${run.status.toUpperCase()} | Blast radius: ${(run.blastRadius * 100).toFixed(2)}%`,
    "",
    "Version | Result       | Configured share | Summary",
    "--------|--------------|------------------|--------",
  ];

  for (const client of run.clients) {
    rows.push(
      `${client.release.version.padEnd(7)} | ${client.status.padEnd(12)} | ${(client.release.activeShare * 100).toFixed(2).padStart(15)}% | ${client.summary}`,
    );
  }

  return rows.join("\n");
}
