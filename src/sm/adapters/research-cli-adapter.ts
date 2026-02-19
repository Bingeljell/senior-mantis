import type { AdapterArtifact, AdapterInvocation, AdapterResult } from "./types.js";
import {
  asNumber,
  asString,
  asStringArray,
  parseAdapterBaseArgs,
  truncateOutput,
} from "./helpers.js";
import { runAdapterCommand } from "./runner.js";

export const HOLYOPS_RESEARCH_ACTIONS = ["scan_topic", "collect_links", "summarize_page"] as const;

type ResearchAction = (typeof HOLYOPS_RESEARCH_ACTIONS)[number];

function isResearchAction(value: string): value is ResearchAction {
  return (HOLYOPS_RESEARCH_ACTIONS as readonly string[]).includes(value);
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

function buildResearchError(params: {
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

function inferResearchArtifacts(params: {
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
    artifacts.push({ type: "url", value: url, label: "source" });
    if (artifacts.length >= 8) {
      break;
    }
  }
  return artifacts;
}

function resolveResearchCommand(action: ResearchAction, args: Record<string, unknown>): string[] {
  const topic = asString(args.topic);
  const url = asString(args.url);
  const outputPath = asString(args.outputPath);
  const depth = asNumber(args.depth);
  const maxResults = asNumber(args.maxResults);
  const extraArgs = asStringArray(args.extraArgs);
  const commandArgs: string[] = [];

  if (action === "scan_topic") {
    if (!topic) {
      throw new Error("topic required");
    }
    commandArgs.push("scan-topic", "--topic", topic);
  } else if (action === "collect_links") {
    if (!topic) {
      throw new Error("topic required");
    }
    commandArgs.push("collect-links", "--topic", topic);
  } else {
    if (!url) {
      throw new Error("url required");
    }
    commandArgs.push("summarize-page", "--url", url);
  }

  if (typeof depth === "number" && depth > 0) {
    commandArgs.push("--depth", String(Math.floor(depth)));
  }
  if (typeof maxResults === "number" && maxResults > 0) {
    commandArgs.push("--max-results", String(Math.floor(maxResults)));
  }
  if (outputPath) {
    commandArgs.push("--output", outputPath);
  }
  return [...commandArgs, ...extraArgs];
}

export async function invokeResearchCliAdapter(
  invocation: AdapterInvocation,
): Promise<AdapterResult> {
  if (!isResearchAction(invocation.action)) {
    return buildResearchError({
      requestId: invocation.requestId,
      summary: "Research action failed",
      code: "invalid_action",
      message: `Unsupported research action: ${invocation.action}`,
      retryable: false,
    });
  }

  const bin = process.env.HOLYOPS_RESEARCH_CLI_BIN?.trim();
  if (!bin) {
    return buildResearchError({
      requestId: invocation.requestId,
      summary: "Research adapter not configured",
      code: "not_configured",
      message: "Set HOLYOPS_RESEARCH_CLI_BIN to enable research workflow actions.",
      retryable: false,
    });
  }

  const baseArgs = parseAdapterBaseArgs(process.env.HOLYOPS_RESEARCH_CLI_BASE_ARGS);
  let actionArgs: string[];
  try {
    actionArgs = resolveResearchCommand(invocation.action, invocation.args);
  } catch (error) {
    return buildResearchError({
      requestId: invocation.requestId,
      summary: "Research action rejected",
      code: "invalid_input",
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    });
  }

  const timeoutMs = asNumber(invocation.args.timeoutMs);
  const result = await runAdapterCommand({
    bin,
    args: [...baseArgs, ...actionArgs],
    cwd: process.env.HOLYOPS_RESEARCH_CLI_CWD?.trim(),
    timeoutMs,
    env: process.env,
  });

  if (!result.ok) {
    const retryable = result.timedOut
      ? true
      : isRetryableAdapterFailure(result.stderr, result.stdout, result.exitCode);
    return buildResearchError({
      requestId: invocation.requestId,
      summary: result.timedOut
        ? `Research ${invocation.action} timed out`
        : `Research ${invocation.action} failed`,
      code: result.timedOut ? "timeout" : "command_failed",
      message: truncateOutput(result.stderr || result.stdout || "Unknown research command error"),
      retryable,
      details: {
        exitCode: result.exitCode,
        durationMs: result.durationMs,
      },
    });
  }

  const outputPath = asString(invocation.args.outputPath);
  const artifacts = inferResearchArtifacts({
    outputPath,
    stdout: result.stdout,
    stderr: result.stderr,
  });
  return {
    ok: true,
    requestId: invocation.requestId,
    summary: `Research ${invocation.action} completed`,
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
