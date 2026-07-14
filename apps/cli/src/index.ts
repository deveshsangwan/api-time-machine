import { runScaffoldSmoke } from "./smoke.js";

const run = await runScaffoldSmoke();
console.log(JSON.stringify(run, null, 2));
