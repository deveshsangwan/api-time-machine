import type {
  CapturedResponse,
  ChangeProfile,
  ClientResult,
  RepairProposal,
} from "@atm/contracts";

export type CodexTask =
  | {
      kind: "analyze-change";
      diff: string;
      capturedResponse: CapturedResponse;
    }
  | {
      kind: "propose-repair";
      change: ChangeProfile;
      failures: ClientResult[];
    };

export interface CodexRunContext {
  attempt: number;
  maxAttempts: number;
  signal: AbortSignal;
  previousError?: {
    category: CodexErrorCategory;
    message: string;
  };
}

export interface ProviderTelemetry {
  provider: string;
  model?: string;
  reasoningEffort?: string;
  threadId?: string;
  durationMs: number;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
}

/**
 * Provider boundary for semantic reasoning. The historical-client gate does not
 * depend on a particular model vendor; Codex is the first production adapter.
 */
export interface ReasoningAdapter {
  run(task: CodexTask, context?: CodexRunContext): Promise<unknown>;
  consumeTelemetry?(): ProviderTelemetry | undefined;
}

/** Backwards-compatible name retained for the frozen scaffold interface. */
export type CodexAdapter = ReasoningAdapter;

export interface WorkflowAttemptEvent {
  taskKind: CodexTask["kind"];
  attempt: number;
  status: "succeeded" | "failed";
  durationMs: number;
  errorCategory?: CodexErrorCategory;
  provider?: ProviderTelemetry;
}

export type CodexErrorCategory =
  | "adapter"
  | "timeout"
  | "schema"
  | "grounding"
  | "policy";

export interface CodexWorkflowOptions {
  maxAttempts?: 1 | 2;
  timeoutMs?: number;
  onAttempt?: (event: WorkflowAttemptEvent) => void;
  now?: () => number;
}

export interface CodexWorkflow {
  analyzeChange(input: {
    diff: string;
    capturedResponse: CapturedResponse;
  }): Promise<ChangeProfile>;
  proposeRepair(input: {
    change: ChangeProfile;
    failures: ClientResult[];
  }): Promise<RepairProposal>;
}
