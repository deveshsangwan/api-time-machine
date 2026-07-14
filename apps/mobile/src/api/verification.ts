import { z } from "zod";

const KnownVerificationStatusSchema = z.enum([
  "VERIFIED",
  "PENDING",
  "REJECTED",
]);

const VerificationWireResponseSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
  updatedAt: z.string().datetime(),
});

export const VerificationResponseSchema = z.object({
  id: z.string().min(1),
  status: KnownVerificationStatusSchema,
  updatedAt: z.string().datetime(),
});

export type VerificationResponse = z.infer<typeof VerificationResponseSchema>;

export function parseVerificationResponse(
  input: string | unknown,
): VerificationResponse {
  const value = typeof input === "string" ? JSON.parse(input) : input;
  const response = VerificationWireResponseSchema.parse(value);
  const status = KnownVerificationStatusSchema.safeParse(response.status);

  return VerificationResponseSchema.parse({
    ...response,
    status: status.success ? status.data : "PENDING",
  });
}
