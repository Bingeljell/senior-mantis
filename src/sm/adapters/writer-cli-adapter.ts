import type { AdapterArtifact, AdapterInvocation, AdapterResult } from "./types.js";
import {
  asNumber,
  asString,
  asStringArray,
  parseAdapterBaseArgs,
  truncateOutput,
} from "./helpers.js";
import { runAdapterCommand } from "./runner.js";

export const HOLYOPS_WRITER_ACTIONS = ["draft_post", "draft_blog", "rewrite", "outline"] as const;

type WriterAction = (typeof HOLYOPS_WRITER_ACTIONS)[number];

function isWriterAction(value: string): value is WriterAction {
  return (HOLYOPS_WRITER_ACTIONS as readonly string[]).includes(value);
}

function isRetryableAdapterFailure(stderr: string, stdout: string, exitCode: number): boolean {
  if (exitCode === 75 || exitCode === 137 || exitCode === 143) {
    return true;
  }
  const text = `${stderr}\n${stdout}`.toLowerCase();
  return (
    text.includes("timed out") ||
    text.includes("timeout") ||
    text.includes("econnreset") ||
    text.includes("econnrefused") ||
    text.includes("eai_again") ||
    text.includes("temporarily unavailable") ||
    text.includes("rate limit") ||
    text.includes("429") ||
    text.includes("try again")
  );
}

function buildWriterError(params: {
  requestId: string;
  summary: string;
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}): AdapterResult {
  return {
    ok: false,
    requestId: params.requestId,
    summary: params.summary,
    error: {
      code: params.code,
      message: params.message,
      retryable: params.retryable,
      details: params.details,
    },
  };
}

function inferWriterArtifacts(params: {
  outputPath: string | undefined;
  stdout: string;
  stderr: string;
}): AdapterArtifact[] {
  const artifacts: AdapterArtifact[] = [];
  if (params.outputPath) {
    artifacts.push({ type: "file", value: params.outputPath, label: "output" });
  }

  const merged = `${params.stdout}\n${params.stderr}`;
  const urlMatches = merged.match(/https?:\/\/[^\s]+/g) ?? [];
  const seen = new Set<string>();
  for (const url of urlMatches) {
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    artifacts.push({ type: "url", value: url, label: "link" });
    if (artifacts.length >= 5) {
      break;
    }
  }
  return artifacts;
}

function resolveWriterCommand(action: WriterAction, args: Record<string, unknown>): string[] {
  const topic = asString(args.topic);
  const text = asString(args.text);
  const tone = asString(args.tone);
  const audience = asString(args.audience);
  const format = asString(args.format);
  const maxWords = asNumber(args.maxWords);
  const outputPath = asString(args.outputPath);
  const extraArgs = asStringArray(args.extraArgs);

  const commandArgs: string[] = [];
  if (action === "draft_post") {
    if (!topic) {
      throw new Error("topic required");
    }
    commandArgs.push("draft-post", "--topic", topic);
  } else if (action === "draft_blog") {
    if (!topic) {
      throw new Error("topic required");
    }
    commandArgs.push("draft-blog", "--topic", topic);
  } else if (action === "outline") {
    if (!topic) {
      throw new Error("topic required");
    }
    commandArgs.push("outline", "--topic", topic);
  } else {
    if (!text) {
      throw new Error("text required");
    }
    commandArgs.push("rewrite", "--text", text);
  }

  if (tone) {
    commandArgs.push("--tone", tone);
  }
  if (audience) {
    commandArgs.push("--audience", audience);
  }
  if (format) {
    commandArgs.push("--format", format);
  }
  if (typeof maxWords === "number" && maxWords > 0) {
    commandArgs.push("--max-words", String(Math.floor(maxWords)));
  }
  if (outputPath) {
    commandArgs.push("--output", outputPath);
  }
  return [...commandArgs, ...extraArgs];
}

export async function invokeWriterCliAdapter(
  invocation: AdapterInvocation,
): Promise<AdapterResult> {
  if (!isWriterAction(invocation.action)) {
    return buildWriterError({
      requestId: invocation.requestId,
      summary: "Writer action failed",
      code: "invalid_action",
      message: `Unsupported writer action: ${invocation.action}`,
      retryable: false,
    });
  }

  const bin = process.env.HOLYOPS_WRITER_CLI_BIN?.trim();
  if (!bin) {
    return buildWriterError({
      requestId: invocation.requestId,
      summary: "Writer adapter not configured",
      code: "not_configured",
      message: "Set HOLYOPS_WRITER_CLI_BIN to enable writer workflow actions.",
      retryable: false,
    });
  }

  const baseArgs = parseAdapterBaseArgs(process.env.HOLYOPS_WRITER_CLI_BASE_ARGS);
  let actionArgs: string[];
  try {
    actionArgs = resolveWriterCommand(invocation.action, invocation.args);
  } catch (error) {
    return buildWriterError({
      requestId: invocation.requestId,
      summary: "Writer action rejected",
      code: "invalid_input",
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    });
  }

  const timeoutMs = asNumber(invocation.args.timeoutMs);
  const result = await runAdapterCommand({
    bin,
    args: [...baseArgs, ...actionArgs],
    cwd: process.env.HOLYOPS_WRITER_CLI_CWD?.trim(),
    timeoutMs,
    env: process.env,
  });

  if (!result.ok) {
    const retryable = result.timedOut
      ? true
      : isRetryableAdapterFailure(result.stderr, result.stdout, result.exitCode);
    return buildWriterError({
      requestId: invocation.requestId,
      summary: result.timedOut
        ? `Writer ${invocation.action} timed out`
        : `Writer ${invocation.action} failed`,
      code: result.timedOut ? "timeout" : "command_failed",
      message: truncateOutput(result.stderr || result.stdout || "Unknown writer command error"),
      retryable,
      details: {
        exitCode: result.exitCode,
        durationMs: result.durationMs,
      },
    });
  }

  const outputPath = asString(invocation.args.outputPath);
  const artifacts = inferWriterArtifacts({
    outputPath,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  return {
    ok: true,
    requestId: invocation.requestId,
    summary: `Writer ${invocation.action} completed`,
    data: {
      adapterId: invocation.adapterId,
      action: invocation.action,
      command: [bin, ...baseArgs, ...actionArgs],
      durationMs: result.durationMs,
      stdout: truncateOutput(result.stdout),
      stderr: truncateOutput(result.stderr),
      exitCode: result.exitCode,
    },
    artifacts,
  };
}
