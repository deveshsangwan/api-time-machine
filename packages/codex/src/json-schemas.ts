export const CHANGE_PROFILE_JSON_SCHEMA = {
  type: "object",
  properties: {
    endpoint: { type: "string", minLength: 1 },
    responseType: { type: "string", minLength: 1 },
    field: { type: "string", minLength: 1 },
    changeType: { type: "string", enum: ["enum_value_added"] },
    previousValues: { type: "array", items: { type: "string" } },
    proposedValues: { type: "array", items: { type: "string" } },
    newValues: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    sourceFile: { type: "string", minLength: 1 },
  },
  required: [
    "endpoint",
    "responseType",
    "field",
    "changeType",
    "previousValues",
    "proposedValues",
    "newValues",
    "sourceFile",
  ],
  additionalProperties: false,
} as const;

const LEGACY_PROJECTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    from: { type: "string", minLength: 1 },
    to: { type: "string", minLength: 1 },
    capabilityThreshold: { type: "string", minLength: 1 },
    justification: { type: "string", minLength: 1 },
  },
  required: ["from", "to", "capabilityThreshold", "justification"],
  additionalProperties: false,
} as const;

export const REPAIR_PROPOSAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", minLength: 1 },
    patch: { type: "string", minLength: 1 },
    regressionTestPatch: { type: "string", minLength: 1 },
    allowedPaths: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    legacyProjection: {
      ...LEGACY_PROJECTION_JSON_SCHEMA,
    },
  },
  required: [
    "summary",
    "patch",
    "regressionTestPatch",
    "allowedPaths",
    "legacyProjection",
  ],
  additionalProperties: false,
} as const;
