import { Type } from "@sinclair/typebox";
import { HOLYOPS_BUSINESS_ACTIONS } from "../../sm/adapters/business-cli-adapter.js";
import { invokeHolyOpsAdapter } from "../../sm/adapters/registry.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam, ToolInputError } from "./common.js";

const SIDE_EFFECT_ACTIONS = new Set<string>(["create_proposal", "create_share_link"]);

const HolyOpsBusinessToolSchema = Type.Object({
  action: stringEnum(HOLYOPS_BUSINESS_ACTIONS),
  projectId: Type.Optional(Type.String()),
  brief: Type.Optional(Type.String()),
  template: Type.Optional(Type.String()),
  proposalId: Type.Optional(Type.String()),
  extraArgs: Type.Optional(Type.Array(Type.String())),
  timeoutMs: Type.Optional(Type.Number()),
  confirm: Type.Optional(Type.Boolean()),
  requestId: Type.Optional(Type.String()),
});

export function createHolyOpsBusinessTool(): AnyAgentTool {
  return {
    label: "HolyOps Business",
    name: "business_tool",
    description:
      "Run HolyOps business workflows (create_proposal, create_share_link, analytics_summary) through your configured proposal/analytics CLI adapter.",
    parameters: HolyOpsBusinessToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const confirm = params.confirm === true;
      if (SIDE_EFFECT_ACTIONS.has(action) && !confirm) {
        throw new ToolInputError(`Set confirm=true to run ${action}.`);
      }
      const requestId =
        typeof params.requestId === "string" && params.requestId.trim()
          ? params.requestId.trim()
          : undefined;
      const adapterArgs = { ...params };
      delete adapterArgs.action;
      delete adapterArgs.confirm;
      delete adapterArgs.requestId;
      const result = await invokeHolyOpsAdapter({
        adapterId: "business-agent",
        action,
        args: adapterArgs,
        requestId,
        invokedBy: "agent",
      });
      return jsonResult(result);
    },
  };
}
