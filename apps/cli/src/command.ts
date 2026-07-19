import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type CommandExecutor = (input: {
  executable: string;
  arguments: string[];
  cwd: string;
  timeoutMs: number;
  environment: NodeJS.ProcessEnv;
}) => Promise<CommandResult>;

export const executeCommand: CommandExecutor = async (input) => {
  try {
    const { stderr, stdout } = await execFileAsync(
      input.executable,
      input.arguments,
      {
        cwd: input.cwd,
        env: input.environment,
        maxBuffer: 2_000_000,
        timeout: input.timeoutMs,
      },
    );
    return { exitCode: 0, stdout, stderr };
  } catch (error) {
    const failure = error as Error & {
      code?: number | string;
      stdout?: string;
      stderr?: string;
      killed?: boolean;
    };
    return {
      exitCode: failure.killed
        ? 2
        : typeof failure.code === "number"
          ? failure.code
          : -1,
      stdout: failure.stdout ?? "",
      stderr: failure.stderr ?? failure.message,
    };
  }
};
