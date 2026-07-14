import { readFile } from "node:fs/promises";

import { ClientReleaseSchema, type ClientRelease } from "@atm/contracts";

export class ReleaseManifestError extends Error {
  override readonly name = "ReleaseManifestError";

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export function parseReleaseManifest(manifest: unknown): ClientRelease[] {
  if (!Array.isArray(manifest)) {
    throw new ReleaseManifestError(
      "Release manifest must be a JSON array of client releases.",
    );
  }

  const releases = manifest.map((record, index) => {
    const parsed = ClientReleaseSchema.safeParse(record);

    if (!parsed.success) {
      throw new ReleaseManifestError(
        `Release manifest entry ${index} is invalid: ${parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "record"}: ${issue.message}`)
          .join("; ")}`,
        parsed.error,
      );
    }

    return parsed.data;
  });

  return releases.filter((release) => release.supported);
}

export async function loadReleaseManifest(
  manifestPath: string,
): Promise<ClientRelease[]> {
  let rawManifest: string;

  try {
    rawManifest = await readFile(manifestPath, "utf8");
  } catch (error) {
    throw new ReleaseManifestError(
      `Could not read release manifest at ${manifestPath}.`,
      error,
    );
  }

  let parsedManifest: unknown;

  try {
    parsedManifest = JSON.parse(rawManifest);
  } catch (error) {
    throw new ReleaseManifestError(
      `Release manifest at ${manifestPath} is not valid JSON.`,
      error,
    );
  }

  return parseReleaseManifest(parsedManifest);
}
