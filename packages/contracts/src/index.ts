import { z } from "zod";

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const VerificationStatusSchema = z.enum([
  "VERIFIED",
  "PENDING",
  "MANUAL_REVIEW",
  "REJECTED",
]);

export const VerificationResponseSchema = z.object({
  id: z.string().min(1),
  status: VerificationStatusSchema,
  updatedAt: z.string().datetime(),
});

export const CapturedResponseSchema = z.object({
  request: z.object({
    method: z.string().min(1),
    url: z.string().min(1),
    appVersion: z.string().nullable(),
  }),
  statusCode: z.number().int().min(100).max(599),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
  sha256: Sha256Schema,
  capturedAt: z.string().datetime(),
});

export const ClientReleaseSchema = z.object({
  platform: z.literal("android-react-native"),
  version: z.string().min(1),
  gitTag: z.string().min(1),
  activeShare: z.number().min(0).max(1),
  supported: z.boolean(),
  source: z.string().min(1),
  observedAt: z.string().datetime(),
  testCommand: z.string().min(1),
});

export const CompatibilityStatusSchema = z.enum([
  "compatible",
  "incompatible",
  "inconclusive",
]);

export const ClientResultSchema = z.object({
  release: ClientReleaseSchema,
  status: CompatibilityStatusSchema,
  responseSha256: Sha256Schema,
  durationMs: z.number().nonnegative(),
  summary: z.string().min(1),
  evidence: z
    .object({
      command: z.string().optional(),
      stdout: z.string().optional(),
      stderr: z.string().optional(),
      sourceFile: z.string().optional(),
      sourceLine: z.number().int().positive().optional(),
    })
    .default({}),
});

export const CompatibilityRunSchema = z.object({
  runId: z.string().min(1),
  status: CompatibilityStatusSchema,
  clients: z.array(ClientResultSchema),
  blastRadius: z.number().min(0).max(1),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
});

export const ChangeProfileSchema = z.object({
  endpoint: z.string().min(1),
  responseType: z.string().min(1),
  field: z.string().min(1),
  changeType: z.literal("enum_value_added"),
  previousValues: z.array(z.string()),
  proposedValues: z.array(z.string()),
  newValues: z.array(z.string()).min(1),
  sourceFile: z.string().min(1),
});

export const RepairProposalSchema = z.object({
  summary: z.string().min(1),
  patch: z.string().min(1),
  regressionTestPatch: z.string().min(1),
  allowedPaths: z.array(z.string()).min(1),
  legacyProjection: z
    .object({
      from: z.string().min(1),
      to: z.string().min(1),
      capabilityThreshold: z.string().min(1),
      justification: z.string().min(1),
    })
    .nullable(),
});

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
export type VerificationResponse = z.infer<typeof VerificationResponseSchema>;
export type CapturedResponse = z.infer<typeof CapturedResponseSchema>;
export type ClientRelease = z.infer<typeof ClientReleaseSchema>;
export type CompatibilityStatus = z.infer<typeof CompatibilityStatusSchema>;
export type ClientResult = z.infer<typeof ClientResultSchema>;
export type CompatibilityRun = z.infer<typeof CompatibilityRunSchema>;
export type ChangeProfile = z.infer<typeof ChangeProfileSchema>;
export type RepairProposal = z.infer<typeof RepairProposalSchema>;
