import { describe, expect, it } from "vitest";
import {
  parseWorkflowArgEntries,
  parseWorkflowArgsJson,
  requiresWorkflowConfirmation,
} from "./register-workflow.js";

describe("register workflow helpers", () => {
  it("parses JSON args object", () => {
    expect(parseWorkflowArgsJson('{"inputPath":"/tmp/in.mp4","durationSec":12.5}')).toEqual({
      inputPath: "/tmp/in.mp4",
      durationSec: 12.5,
    });
  });

  it("rejects non-object JSON args", () => {
    expect(() => parseWorkflowArgsJson('["not","object"]')).toThrow("--args must be a JSON object");
  });

  it("parses repeated key=value args with primitive coercion", () => {
    expect(
      parseWorkflowArgEntries([
        "inputPath=/tmp/in.mp4",
        "durationSec=30",
        "confirm=true",
        'extra=["--fast"]',
      ]),
    ).toEqual({
      inputPath: "/tmp/in.mp4",
      durationSec: 30,
      confirm: true,
      extra: ["--fast"],
    });
  });

  it("requires confirmation for side-effect actions only", () => {
    expect(requiresWorkflowConfirmation("video-agent", "compress")).toBe(true);
    expect(requiresWorkflowConfirmation("business-agent", "create_proposal")).toBe(true);
    expect(requiresWorkflowConfirmation("business-agent", "analytics_summary")).toBe(false);
    expect(requiresWorkflowConfirmation("writer-agent", "draft_post")).toBe(true);
    expect(requiresWorkflowConfirmation("writer-agent", "rewrite")).toBe(false);
  });
});
