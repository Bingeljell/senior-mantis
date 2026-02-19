import crypto from "node:crypto";
import type { AdapterInvocation, AdapterResult } from "./types.js";
import { invokeBusinessCliAdapter } from "./business-cli-adapter.js";
import { invokeResearchCliAdapter } from "./research-cli-adapter.js";
import { invokeVideoCliAdapter } from "./video-cli-adapter.js";
import { invokeWriterCliAdapter } from "./writer-cli-adapter.js";

export const HOLYOPS_ADAPTER_IDS = [
  "video-agent",
  "business-agent",
  "research-agent",
  "writer-agent",
] as const;

export type HolyOpsAdapterId = (typeof HOLYOPS_ADAPTER_IDS)[number];

export async function invokeHolyOpsAdapter(
  params: Omit<AdapterInvocation, "requestId"> & { requestId?: string },
): Promise<AdapterResult> {
  const invocation: AdapterInvocation = {
    ...params,
    requestId: params.requestId?.trim() || crypto.randomUUID(),
  };

  if (invocation.adapterId === "video-agent") {
    return await invokeVideoCliAdapter(invocation);
  }
  if (invocation.adapterId === "business-agent") {
    return await invokeBusinessCliAdapter(invocation);
  }
  if (invocation.adapterId === "research-agent") {
    return await invokeResearchCliAdapter(invocation);
  }
  if (invocation.adapterId === "writer-agent") {
    return await invokeWriterCliAdapter(invocation);
  }

  return {
    ok: false,
    requestId: invocation.requestId,
    summary: "Adapter invocation failed",
    error: {
      code: "unknown_adapter",
      message: `Unknown adapter: ${invocation.adapterId}`,
      retryable: false,
    },
  };
}
