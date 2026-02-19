import type { AdapterInvocation, AdapterResult } from "./types.js";
import {
  parseAdapterBaseArgs,
  asString,
  asNumber,
  asStringArray,
  truncateOutput,
} from "./helpers.js";
import { runAdapterCommand } from "./runner.js";

export const HOLYOPS_VIDEO_ACTIONS = [
  "compress",
  "denoise",
  "caption",
  "clip",
  "add_music",
] as const;

type VideoAction = (typeof HOLYOPS_VIDEO_ACTIONS)[number];

function isVideoAction(value: string): value is VideoAction {
  return (HOLYOPS_VIDEO_ACTIONS as readonly string[]).includes(value);
}

function resolveVideoCommand(action: VideoAction, args: Record<string, unknown>): string[] {
  const inputPath = asString(args.inputPath);
  const outputPath = asString(args.outputPath);
  const extraArgs = asStringArray(args.extraArgs);
  const timeoutMs = asNumber(args.timeoutMs);

  if (!inputPath) {
    throw new Error("inputPath required");
  }

  const commandArgs: string[] = [action, "--input", inputPath];
  if (outputPath) {
    commandArgs.push("--output", outputPath);
  }

  if (action === "caption") {
    const language = asString(args.language);
    const style = asString(args.captionStyle);
    if (language) {
      commandArgs.push("--language", language);
    }
    if (style) {
      commandArgs.push("--caption-style", style);
    }
  }

  if (action === "clip") {
    const startTime = asString(args.startTime);
    const durationSec = asNumber(args.durationSec);
    if (startTime) {
      commandArgs.push("--start", startTime);
    }
    if (typeof durationSec === "number") {
      commandArgs.push("--duration", String(durationSec));
    }
  }

  if (action === "add_music") {
    const musicPath = asString(args.musicPath);
    if (musicPath) {
      commandArgs.push("--music", musicPath);
    }
  }

  return [
    ...commandArgs,
    ...extraArgs,
    ...(typeof timeoutMs === "number" ? ["--timeout-ms", String(Math.floor(timeoutMs))] : []),
  ];
}

function buildVideoError(params: {
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

export async function invokeVideoCliAdapter(invocation: AdapterInvocation): Promise<AdapterResult> {
  if (!isVideoAction(invocation.action)) {
    return buildVideoError({
      requestId: invocation.requestId,
      summary: "Video action failed",
      code: "invalid_action",
      message: `Unsupported video action: ${invocation.action}`,
      retryable: false,
    });
  }

  const bin = process.env.HOLYOPS_VIDEO_CLI_BIN?.trim();
  if (!bin) {
    return buildVideoError({
      requestId: invocation.requestId,
      summary: "Video adapter not configured",
      code: "not_configured",
      message: "Set HOLYOPS_VIDEO_CLI_BIN to enable video workflow actions.",
      retryable: false,
    });
  }

  const baseArgs = parseAdapterBaseArgs(process.env.HOLYOPS_VIDEO_CLI_BASE_ARGS);
  let actionArgs: string[];
  try {
    actionArgs = resolveVideoCommand(invocation.action, invocation.args);
  } catch (error) {
    return buildVideoError({
      requestId: invocation.requestId,
      summary: "Video action rejected",
      code: "invalid_input",
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    });
  }

  const timeoutMs = asNumber(invocation.args.timeoutMs);
  const result = await runAdapterCommand({
    bin,
    args: [...baseArgs, ...actionArgs],
    cwd: process.env.HOLYOPS_VIDEO_CLI_CWD?.trim(),
    timeoutMs,
    env: process.env,
  });

  const outputPath = asString(invocation.args.outputPath);
  if (!result.ok) {
    const summary = result.timedOut
      ? `Video ${invocation.action} timed out`
      : `Video ${invocation.action} failed`;
    return buildVideoError({
      requestId: invocation.requestId,
      summary,
      code: result.timedOut ? "timeout" : "command_failed",
      message: truncateOutput(result.stderr || result.stdout || "Unknown video command error"),
      retryable: result.timedOut,
      details: {
        exitCode: result.exitCode,
        durationMs: result.durationMs,
      },
    });
  }

  return {
    ok: true,
    requestId: invocation.requestId,
    summary: `Video ${invocation.action} completed`,
    data: {
      adapterId: invocation.adapterId,
      action: invocation.action,
      command: [bin, ...baseArgs, ...actionArgs],
      durationMs: result.durationMs,
      stdout: truncateOutput(result.stdout),
      stderr: truncateOutput(result.stderr),
      exitCode: result.exitCode,
    },
    artifacts: outputPath ? [{ type: "file", value: outputPath, label: "output" }] : undefined,
  };
}
