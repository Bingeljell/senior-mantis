import type { AdapterArtifact, AdapterInvocation, AdapterResult } from "./types.js";
import {
  parseAdapterBaseArgs,
  asString,
  asStringArray,
  asNumber,
  truncateOutput,
} from "./helpers.js";
import { runAdapterCommand } from "./runner.js";

export const HOLYOPS_BUSINESS_ACTIONS = [
  "create_proposal",
  "create_share_link",
  "analytics_summary",
] as const;

type BusinessAction = (typeof HOLYOPS_BUSINESS_ACTIONS)[number];

function isBusinessAction(value: string): value is BusinessAction {
  return (HOLYOPS_BUSINESS_ACTIONS as readonly string[]).includes(value);
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

function buildBusinessError(params: {
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

function resolveBusinessCommand(action: BusinessAction, args: Record<string, unknown>): string[] {
  const projectId = asString(args.projectId);
  const brief = asString(args.brief);
  const template = asString(args.template);
  const proposalId = asString(args.proposalId);
  const extraArgs = asStringArray(args.extraArgs);

  if (action === "create_proposal") {
    if (!brief) {
      throw new Error("brief required");
    }
    return [
      "create-proposal",
      ...(projectId ? ["--project-id", projectId] : []),
      "--brief",
      brief,
      ...(template ? ["--template", template] : []),
      ...extraArgs,
    ];
  }

  if (action === "create_share_link") {
    if (!proposalId) {
      throw new Error("proposalId required");
    }
    return ["create-share-link", "--proposal-id", proposalId, ...extraArgs];
  }

  return ["analytics-summary", ...(projectId ? ["--project-id", projectId] : []), ...extraArgs];
}

function inferBusinessArtifacts(stdout: string): AdapterArtifact[] {
  const artifacts: AdapterArtifact[] = [];
  const seen = new Set<string>();
  const pushArtifact = (artifact: AdapterArtifact) => {
    const key = `${artifact.type}:${artifact.value}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    artifacts.push(artifact);
  };

  try {
    const parsed = JSON.parse(stdout);
    if (parsed && typeof parsed === "object") {
      const proposalId =
        typeof (parsed as Record<string, unknown>).proposalId === "string"
          ? String((parsed as Record<string, unknown>).proposalId).trim()
          : "";
      if (proposalId) {
        pushArtifact({ type: "text", value: proposalId, label: "proposal_id" });
      }
      const shareUrl =
        typeof (parsed as Record<string, unknown>).shareUrl === "string"
          ? String((parsed as Record<string, unknown>).shareUrl).trim()
          : "";
      if (shareUrl) {
        pushArtifact({ type: "url", value: shareUrl, label: "link" });
      }
    }
  } catch {
    // non-JSON stdout
  }

  const idMatch =
    stdout.match(/\bproposal[-_ ]?id\b\s*[:=]\s*([A-Za-z0-9._-]+)/i) ??
    stdout.match(/\bproposal\b\s*[:=]\s*([A-Za-z0-9._-]+)/i);
  if (idMatch?.[1]) {
    pushArtifact({ type: "text", value: idMatch[1], label: "proposal_id" });
  }

  const urlMatches = stdout.match(/https?:\/\/[^\s]+/g) ?? [];
  for (const url of urlMatches.slice(0, 5)) {
    pushArtifact({ type: "url", value: url, label: "link" });
  }

  return artifacts;
}

export async function invokeBusinessCliAdapter(
  invocation: AdapterInvocation,
): Promise<AdapterResult> {
  if (!isBusinessAction(invocation.action)) {
    return buildBusinessError({
      requestId: invocation.requestId,
      summary: "Business action failed",
      code: "invalid_action",
      message: `Unsupported business action: ${invocation.action}`,
      retryable: false,
    });
  }

  const bin = process.env.HOLYOPS_BUSINESS_CLI_BIN?.trim();
  if (!bin) {
    return buildBusinessError({
      requestId: invocation.requestId,
      summary: "Business adapter not configured",
      code: "not_configured",
      message: "Set HOLYOPS_BUSINESS_CLI_BIN to enable business workflow actions.",
      retryable: false,
    });
  }

  const baseArgs = parseAdapterBaseArgs(process.env.HOLYOPS_BUSINESS_CLI_BASE_ARGS);
  let actionArgs: string[];
  try {
    actionArgs = resolveBusinessCommand(invocation.action, invocation.args);
  } catch (error) {
    return buildBusinessError({
      requestId: invocation.requestId,
      summary: "Business action rejected",
      code: "invalid_input",
      message: error instanceof Error ? error.message : String(error),
      retryable: false,
    });
  }

  const timeoutMs = asNumber(invocation.args.timeoutMs);
  const result = await runAdapterCommand({
    bin,
    args: [...baseArgs, ...actionArgs],
    cwd: process.env.HOLYOPS_BUSINESS_CLI_CWD?.trim(),
    timeoutMs,
    env: process.env,
  });

  if (!result.ok) {
    const summary = result.timedOut
      ? `Business ${invocation.action} timed out`
      : `Business ${invocation.action} failed`;
    const retryable = result.timedOut
      ? true
      : isRetryableAdapterFailure(result.stderr, result.stdout, result.exitCode);
    return buildBusinessError({
      requestId: invocation.requestId,
      summary,
      code: result.timedOut ? "timeout" : "command_failed",
      message: truncateOutput(result.stderr || result.stdout || "Unknown business command error"),
      retryable,
      details: {
        exitCode: result.exitCode,
        durationMs: result.durationMs,
      },
    });
  }

  const artifacts = inferBusinessArtifacts(result.stdout);
  return {
    ok: true,
    requestId: invocation.requestId,
    summary: `Business ${invocation.action} completed`,
    data: {
      adapterId: invocation.adapterId,
      action: invocation.action,
      command: [bin, ...baseArgs, ...actionArgs],
      durationMs: result.durationMs,
      stdout: truncateOutput(result.stdout),
      stderr: truncateOutput(result.stderr),
      exitCode: result.exitCode,
    },
    artifacts: artifacts.length > 0 ? artifacts : undefined,
  };
}
