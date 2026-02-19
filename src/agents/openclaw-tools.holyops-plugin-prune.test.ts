import { Type } from "@sinclair/typebox";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    resolvePluginTools: vi.fn(() => [
      {
        name: "mock_plugin_tool",
        label: "Mock Plugin",
        description: "mock plugin tool",
        parameters: Type.Object({}),
        execute: async () => ({ content: [{ type: "text", text: "ok" }], details: {} }),
      },
    ]),
  };
});

vi.mock("../plugins/tools.js", () => ({
  resolvePluginTools: mocks.resolvePluginTools,
}));

import { createOpenClawTools } from "./openclaw-tools.js";

afterEach(() => {
  delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
  mocks.resolvePluginTools.mockClear();
});

describe("createOpenClawTools HolyOps plugin prune", () => {
  it("skips plugin tool resolution in holyops mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "holyops";
    const names = createOpenClawTools({ disableMessageTool: true }).map((tool) => tool.name);
    expect(mocks.resolvePluginTools).not.toHaveBeenCalled();
    expect(names).not.toContain("mock_plugin_tool");
  });

  it("keeps plugin tool resolution in openclaw mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "openclaw";
    const names = createOpenClawTools({ disableMessageTool: true }).map((tool) => tool.name);
    expect(mocks.resolvePluginTools).toHaveBeenCalledTimes(1);
    expect(names).toContain("mock_plugin_tool");
  });
});
