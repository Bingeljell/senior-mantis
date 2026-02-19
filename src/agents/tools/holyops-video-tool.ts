import { Type } from "@sinclair/typebox";
import { invokeHolyOpsAdapter } from "../../sm/adapters/registry.js";
import { HOLYOPS_VIDEO_ACTIONS } from "../../sm/adapters/video-cli-adapter.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam, ToolInputError } from "./common.js";

const HolyOpsVideoToolSchema = Type.Object({
  action: stringEnum(HOLYOPS_VIDEO_ACTIONS),
  inputPath: Type.Optional(Type.String()),
  outputPath: Type.Optional(Type.String()),
  musicPath: Type.Optional(Type.String()),
  language: Type.Optional(Type.String()),
  captionStyle: Type.Optional(Type.String()),
  startTime: Type.Optional(Type.String()),
  durationSec: Type.Optional(Type.Number()),
  extraArgs: Type.Optional(Type.Array(Type.String())),
  timeoutMs: Type.Optional(Type.Number()),
  confirm: Type.Optional(Type.Boolean()),
  requestId: Type.Optional(Type.String()),
});

export function createHolyOpsVideoTool(): AnyAgentTool {
  return {
    label: "HolyOps Video",
    name: "video_tool",
    description:
      "Run HolyOps video workflows (compress, denoise, caption, clip, add_music) through your configured video CLI adapter. Set confirm=true for execution.",
    parameters: HolyOpsVideoToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });
      const confirm = params.confirm === true;
      if (!confirm) {
        throw new ToolInputError("Set confirm=true to run video workflow actions.");
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
        adapterId: "video-agent",
        action,
        args: adapterArgs,
        requestId,
        invokedBy: "agent",
      });
      return jsonResult(result);
    },
  };
}
