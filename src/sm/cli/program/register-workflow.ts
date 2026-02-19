import type { Command } from "commander";
import { runCommandWithRuntime } from "../../../cli/cli-utils.js";
import { formatHelpExamples } from "../../../cli/help-format.js";
import { defaultRuntime } from "../../../runtime.js";
import { invokeHolyOpsAdapter, type HolyOpsAdapterId } from "../../../sm/adapters/registry.js";
import { HOLYOPS_VIDEO_ACTIONS } from "../../../sm/adapters/video-cli-adapter.js";
import { HOLYOPS_WRITER_ACTIONS } from "../../../sm/adapters/writer-cli-adapter.js";
import { theme } from "../../../terminal/theme.js";

const BUSINESS_SIDE_EFFECT_ACTIONS = new Set<string>(["create_proposal", "create_share_link"]);
const WRITER_SIDE_EFFECT_ACTIONS = new Set<string>(
  HOLYOPS_WRITER_ACTIONS.filter((action) => action === "draft_post" || action === "draft_blog"),
);

type WorkflowArgs = Record<string, unknown>;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseWorkflowArgsJson(raw: string | undefined): WorkflowArgs {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("--args must be valid JSON object");
  }
  if (!isObjectRecord(parsed)) {
    throw new Error("--args must be a JSON object");
  }
  return parsed;
}

function parseLiteralValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (trimmed === "null") {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const parsed = Number.parseFloat(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export function parseWorkflowArgEntries(entries: string[] | undefined): WorkflowArgs {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {};
  }
  const result: WorkflowArgs = {};
  for (const entry of entries) {
    const value = String(entry ?? "").trim();
    const separatorIndex = value.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(`Invalid --arg '${value}'. Use key=value.`);
    }
    const key = value.slice(0, separatorIndex).trim();
    const raw = value.slice(separatorIndex + 1).trim();
    if (!key) {
      throw new Error(`Invalid --arg '${value}'. Key is required.`);
    }
    result[key] = parseLiteralValue(raw);
  }
  return result;
}

export function requiresWorkflowConfirmation(adapterId: HolyOpsAdapterId, action: string): boolean {
  if (adapterId === "video-agent") {
    return (HOLYOPS_VIDEO_ACTIONS as readonly string[]).includes(action);
  }
  if (adapterId === "business-agent") {
    return BUSINESS_SIDE_EFFECT_ACTIONS.has(action);
  }
  if (adapterId === "writer-agent") {
    return WRITER_SIDE_EFFECT_ACTIONS.has(action);
  }
  return false;
}

function parseAdapterId(raw: unknown): HolyOpsAdapterId {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (
    value === "video-agent" ||
    value === "business-agent" ||
    value === "research-agent" ||
    value === "writer-agent"
  ) {
    return value;
  }
  throw new Error(
    "--adapter must be one of: video-agent, business-agent, research-agent, writer-agent",
  );
}

function parseAction(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    throw new Error("--action is required");
  }
  return value;
}

export function registerSeniorMantisWorkflowCommands(program: Command) {
  program
    .command("workflow")
    .description("Run HolyOps workflow adapters directly (non-LLM path)")
    .requiredOption(
      "--adapter <id>",
      "Adapter id: video-agent | business-agent | research-agent | writer-agent",
    )
    .requiredOption("--action <name>", "Action name")
    .option("--args <json>", "JSON object payload passed to adapter")
    .option(
      "--arg <key=value>",
      "Additional payload entry (repeatable)",
      (value, memo) => {
        memo.push(String(value));
        return memo;
      },
      [] as string[],
    )
    .option("--request-id <id>", "Explicit request id")
    .option("--confirm", "Required for side-effect actions", false)
    .option("--json", "Output full adapter result JSON", false)
    .addHelpText(
      "after",
      () =>
        `\n${theme.heading("Examples:")}\n${formatHelpExamples([
          [
            "holyops workflow --adapter video-agent --action compress --arg inputPath=~/in.mp4 --arg outputPath=~/out.mp4 --confirm --json",
            "Run video compression directly through adapter contract.",
          ],
          [
            'holyops workflow --adapter business-agent --action create_proposal --args \'{"projectId":"acme","brief":"3-tier website proposal","template":"default"}\' --confirm --json',
            "Generate proposal via business adapter.",
          ],
          [
            "holyops workflow --adapter business-agent --action analytics_summary --arg projectId=acme --json",
            "Read-only business summary action.",
          ],
          [
            "holyops workflow --adapter research-agent --action scan_topic --arg topic='creator tools' --arg maxResults=5 --json",
            "Run a research scan directly through adapter contract.",
          ],
          [
            "holyops workflow --adapter writer-agent --action draft_post --arg topic='weekly build log' --arg tone=clear --confirm --json",
            "Draft a post through writer adapter (side-effect-confirmed).",
          ],
        ])}\n\n${theme.muted("Docs:")} docs/sm/HANDOFF.md\n`,
    )
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        let adapterId: HolyOpsAdapterId;
        let action: string;
        let args: WorkflowArgs;
        try {
          adapterId = parseAdapterId(opts.adapter);
          action = parseAction(opts.action);
          args = {
            ...parseWorkflowArgsJson(opts.args as string | undefined),
            ...parseWorkflowArgEntries(opts.arg as string[] | undefined),
          };
        } catch (error) {
          defaultRuntime.error(error instanceof Error ? error.message : String(error));
          defaultRuntime.exit(1);
          return;
        }

        if (requiresWorkflowConfirmation(adapterId, action) && !opts.confirm) {
          defaultRuntime.error("--confirm is required for this side-effect action.");
          defaultRuntime.exit(1);
          return;
        }

        const result = await invokeHolyOpsAdapter({
          adapterId,
          action,
          args,
          requestId: typeof opts.requestId === "string" ? opts.requestId.trim() : undefined,
          invokedBy: "desktop",
        });

        if (opts.json) {
          defaultRuntime.log(JSON.stringify(result, null, 2));
        } else {
          defaultRuntime.log(result.summary);
          if (result.artifacts?.length) {
            for (const artifact of result.artifacts) {
              const label = artifact.label ? `${artifact.label}: ` : "";
              defaultRuntime.log(`- ${artifact.type} ${label}${artifact.value}`);
            }
          }
          if (!result.ok && result.error?.message) {
            defaultRuntime.error(result.error.message);
          }
        }

        if (!result.ok) {
          defaultRuntime.exit(1);
        }
      });
    });
}
