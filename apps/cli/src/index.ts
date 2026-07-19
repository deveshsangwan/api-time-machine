#!/usr/bin/env node

import { checkProject } from "./check.js";
import { serveDashboard } from "./dashboard.js";
import { doctorProject } from "./doctor.js";
import { initializeProject } from "./init.js";
import { findProjectConfiguration } from "./project-config.js";

const command = process.argv[2] ?? "check";

try {
  if (command === "help" || command === "--help" || command === "-h") {
    console.log("Usage: api-time-machine <init|doctor|check|dashboard>");
  } else if (command === "init") {
    console.log(await initializeProject(process.cwd()));
  } else {
    const project = await findProjectConfiguration(process.cwd());
    if (command === "doctor") {
      console.log(await doctorProject(project));
    } else if (command === "dashboard") {
      await serveDashboard(project);
    } else if (command === "check") {
      const result = await checkProject(project);
      console.log(result.report);
      console.log(`Evidence: ${result.evidence.directory}`);
      console.log(`Dashboard artifact: ${result.dashboardArtifact}`);
      process.exitCode = result.exitCode;
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }
} catch (error) {
  console.error(
    "API Time Machine could not complete compatibility verification:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 2;
}
