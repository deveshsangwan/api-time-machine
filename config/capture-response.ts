import { captureVerificationResponse } from "../apps/backend/src/index.js";

const appVersion = process.env.ATM_APP_VERSION;
if (!appVersion) throw new Error("ATM_APP_VERSION is required.");

process.stdout.write(
  JSON.stringify(await captureVerificationResponse({ appVersion })),
);
