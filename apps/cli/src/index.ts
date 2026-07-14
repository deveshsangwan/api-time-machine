import { runScaffoldSmoke } from "./smoke.js";
import {
  compatibilityExitCode,
  renderSurvivalMatrix,
} from "@atm/orchestrator";

const run = await runScaffoldSmoke();
console.log(renderSurvivalMatrix(run));
process.exitCode = compatibilityExitCode(run.status);
