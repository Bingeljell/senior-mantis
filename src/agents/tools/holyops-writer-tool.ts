import { Type } from "@sinclair/typebox";
import { invokeHolyOpsAdapter } from "../../sm/adapters/registry.js";
import { HOLYOPS_WRITER_ACTIONS } from "../../sm/adapters/writer-cli-adapter.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam, ToolInputError } from "./common.js";

const SIDE_EFFECT_ACTIONS = new Set<string>(["draft_post", "draft_blog"]);

const HolyOpsWriterToolSchema = Type.Object({
  action: stringEnum(HOLYOPS_WRITER_ACTIONS),
  topic: Type.Optional(Type.String()),
  text: Type.Optional(Type.String()),
  tone: Type.Optional(Type.String()),
  audience: Type.Optional(Type.String()),
  format: Type.Optional(Type.String()),
  maxWords: Type.Optional(Type.Number()),
  outputPath: Type.Optional(Type.String()),
  extraArgs: Type.Optional(Type.Array(Type.String())),
  timeoutMs: Type.Optional(Type.Number()),
  confirm: Type.Optional(Type.Boolean()),
  requestId: Type.Optional(Type.String()),
});

export function createHolyOpsWriterTool(): AnyAgentTool {
  return {
    label: "HolyOps Writer",
    name: "writer_tool",
    description:
      "Run HolyOps writing workflows (draft_post, draft_blog, rewrite, outline) through your configured writer CLI adapter.",
    parameters: HolyOpsWriterToolSchema,
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
        adapterId: "writer-agent",
        action,
        args: adapterArgs,
        requestId,
        invokedBy: "agent",
      });
      return jsonResult(result);
    },
  };
}
