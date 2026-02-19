import { Type } from "@sinclair/typebox";
import { invokeHolyOpsAdapter } from "../../sm/adapters/registry.js";
import { HOLYOPS_RESEARCH_ACTIONS } from "../../sm/adapters/research-cli-adapter.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

const HolyOpsResearchToolSchema = Type.Object({
  action: stringEnum(HOLYOPS_RESEARCH_ACTIONS),
  topic: Type.Optional(Type.String()),
  url: Type.Optional(Type.String()),
  depth: Type.Optional(Type.Number()),
  maxResults: Type.Optional(Type.Number()),
  outputPath: Type.Optional(Type.String()),
  extraArgs: Type.Optional(Type.Array(Type.String())),
  timeoutMs: Type.Optional(Type.Number()),
  requestId: Type.Optional(Type.String()),
});

export function createHolyOpsResearchTool(): AnyAgentTool {
  return {
    label: "HolyOps Research",
    name: "research_tool",
    description:
      "Run HolyOps research workflows (scan_topic, collect_links, summarize_page) through your configured research CLI adapter.",
    parameters: HolyOpsResearchToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const requestId =
        typeof params.requestId === "string" && params.requestId.trim()
          ? params.requestId.trim()
          : undefined;
      const adapterArgs = { ...params };
      delete adapterArgs.action;
      delete adapterArgs.requestId;
      const result = await invokeHolyOpsAdapter({
        adapterId: "research-agent",
        action,
        args: adapterArgs,
        requestId,
        invokedBy: "agent",
      });
      return jsonResult(result);
    },
  };
}
