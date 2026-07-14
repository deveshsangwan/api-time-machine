import { createHash } from "node:crypto";

import {
  CapturedResponseSchema,
  type CapturedResponse,
} from "@atm/contracts";

import { buildApp } from "./app.js";

function normalizeHeaders(
  headers: Record<string, number | string | string[] | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([name, value]) => {
      if (value === undefined) return [];
      return [[name, Array.isArray(value) ? value.join(", ") : String(value)]];
    }),
  );
}

export async function captureVerificationResponse(input: {
  appVersion: string | null;
  verificationId?: string;
}): Promise<CapturedResponse> {
  const app = buildApp();
  const verificationId = input.verificationId ?? "verification_123";
  const url = `/verification/${encodeURIComponent(verificationId)}`;

  try {
    const response = await app.inject({
      method: "GET",
      url,
      headers:
        input.appVersion === null
          ? undefined
          : { "x-app-version": input.appVersion },
    });

    return CapturedResponseSchema.parse({
      request: {
        method: "GET",
        url,
        appVersion: input.appVersion,
      },
      statusCode: response.statusCode,
      headers: normalizeHeaders(response.headers),
      body: response.body,
      sha256: createHash("sha256").update(response.body).digest("hex"),
      capturedAt: new Date().toISOString(),
    });
  } finally {
    await app.close();
  }
}
