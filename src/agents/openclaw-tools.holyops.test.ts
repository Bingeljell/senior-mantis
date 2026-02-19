import { afterEach, describe, expect, it } from "vitest";
import { createOpenClawTools } from "./openclaw-tools.js";

afterEach(() => {
  delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
});

describe("createOpenClawTools HolyOps registration", () => {
  it("adds holyops workflow tools in holyops mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "holyops";
    const names = createOpenClawTools({ disableMessageTool: true }).map((tool) => tool.name);
    expect(names).toContain("video_tool");
    expect(names).toContain("business_tool");
    expect(names).toContain("research_tool");
    expect(names).toContain("writer_tool");
  });

  it("does not add holyops workflow tools in openclaw mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "openclaw";
    const names = createOpenClawTools({ disableMessageTool: true }).map((tool) => tool.name);
    expect(names).not.toContain("video_tool");
    expect(names).not.toContain("business_tool");
    expect(names).not.toContain("research_tool");
    expect(names).not.toContain("writer_tool");
  });
});
