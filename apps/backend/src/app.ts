import Fastify from "fastify";

import { getVerificationResponse } from "./domain/verification.js";

export function buildApp() {
  const app = Fastify({ logger: false });

  app.get<{ Params: { id: string } }>("/verification/:id", async (request) => {
    return getVerificationResponse(
      request.params.id,
      request.headers["x-app-version"],
    );
  });

  return app;
}
