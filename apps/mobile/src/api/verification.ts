import { z } from "zod";

export const VerificationResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["VERIFIED", "PENDING", "REJECTED"]),
  updatedAt: z.string().datetime(),
});

export type VerificationResponse = z.infer<typeof VerificationResponseSchema>;

export function parseVerificationResponse(
  input: string | unknown,
): VerificationResponse {
  const value = typeof input === "string" ? JSON.parse(input) : input;
  return VerificationResponseSchema.parse(value);
}
