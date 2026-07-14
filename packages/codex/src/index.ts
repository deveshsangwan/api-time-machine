import {
  ChangeProfileSchema,
  RepairProposalSchema,
  type CapturedResponse,
  type ChangeProfile,
  type ClientResult,
  type RepairProposal,
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

export interface CodexAdapter {
  run(task: CodexTask): Promise<unknown>;
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

export function createCodexWorkflow(adapter: CodexAdapter): CodexWorkflow {
  return {
    async analyzeChange(input) {
      return ChangeProfileSchema.parse(
        await adapter.run({ kind: "analyze-change", ...input }),
      );
    },
    async proposeRepair(input) {
      return RepairProposalSchema.parse(
        await adapter.run({ kind: "propose-repair", ...input }),
      );
    },
  };
}
