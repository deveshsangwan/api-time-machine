import type { CodexErrorCategory } from "./types.js";

export class CodexWorkflowError extends Error {
  readonly category: CodexErrorCategory;
  readonly retryable: boolean;

  constructor(
    category: CodexErrorCategory,
    message: string,
    options: { retryable?: boolean; cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "CodexWorkflowError";
    this.category = category;
    this.retryable = options.retryable ?? false;
  }
}

export function normalizeWorkflowError(error: unknown): CodexWorkflowError {
  if (error instanceof CodexWorkflowError) return error;

  const message =
    error instanceof Error ? error.message : "Reasoning adapter failed";
  if (/\b(?:401|unauthorized|invalid_api_key)\b/i.test(message)) {
    return new CodexWorkflowError(
      "adapter",
      "Codex authentication failed; replace the configured API credential",
      { retryable: false },
    );
  }

  return new CodexWorkflowError(
    "adapter",
    message.replace(/\bsk-[A-Za-z0-9_*.-]{8,}/g, "[REDACTED_API_KEY]"),
    { retryable: true },
  );
}
