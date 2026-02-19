import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { invokeHolyOpsAdapter } from "./registry.js";

const ENV_KEYS = [
  "HOLYOPS_VIDEO_CLI_BIN",
  "HOLYOPS_VIDEO_CLI_BASE_ARGS",
  "HOLYOPS_BUSINESS_CLI_BIN",
  "HOLYOPS_BUSINESS_CLI_BASE_ARGS",
] as const;

async function createAdapterCliScript(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "holyops-adapter-"));
  const scriptPath = path.join(dir, "adapter-cli.mjs");
  await fs.writeFile(
    scriptPath,
    [
      "const args = process.argv.slice(2);",
      'if (args.includes("--fail-transient")) {',
      '  console.error("ECONNRESET: temporary upstream error, try again");',
      "  process.exit(75);",
      "}",
      'if (args.includes("--fail")) {',
      '  console.error("forced failure");',
      "  process.exit(2);",
      "}",
      'if (args[0] === "create-share-link") {',
      '  console.log("https://example.com/share/abc123");',
      '} else if (args[0] === "create-proposal") {',
      '  console.log(JSON.stringify({ proposalId: "proposal-123", shareUrl: "https://example.com/proposal/proposal-123" }));',
      "} else {",
      "  console.log(JSON.stringify(args));",
      "}",
    ].join("\n"),
    "utf8",
  );
  return scriptPath;
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe("holyops adapter registry", () => {
  it("returns unknown_adapter for unsupported ids", async () => {
    const res = await invokeHolyOpsAdapter({
      adapterId: "unknown-agent",
      action: "run",
      args: {},
      invokedBy: "agent",
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("unknown_adapter");
  });

  it("returns not_configured when video adapter is missing CLI bin", async () => {
    const res = await invokeHolyOpsAdapter({
      adapterId: "video-agent",
      action: "compress",
      args: { inputPath: "/tmp/in.mp4", outputPath: "/tmp/out.mp4" },
      invokedBy: "agent",
    });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("not_configured");
  });

  it("runs video adapter command and reports file artifact", async () => {
    const scriptPath = await createAdapterCliScript();
    process.env.HOLYOPS_VIDEO_CLI_BIN = process.execPath;
    process.env.HOLYOPS_VIDEO_CLI_BASE_ARGS = JSON.stringify([scriptPath]);

    const res = await invokeHolyOpsAdapter({
      adapterId: "video-agent",
      action: "compress",
      args: {
        inputPath: "/tmp/source.mp4",
        outputPath: "/tmp/output.mp4",
      },
      invokedBy: "agent",
    });

    expect(res.ok).toBe(true);
    expect(res.summary).toContain("Video compress completed");
    expect(res.artifacts).toEqual([{ type: "file", value: "/tmp/output.mp4", label: "output" }]);
  });

  it("extracts URLs from business adapter output", async () => {
    const scriptPath = await createAdapterCliScript();
    process.env.HOLYOPS_BUSINESS_CLI_BIN = process.execPath;
    process.env.HOLYOPS_BUSINESS_CLI_BASE_ARGS = JSON.stringify([scriptPath]);

    const res = await invokeHolyOpsAdapter({
      adapterId: "business-agent",
      action: "create_share_link",
      args: {
        proposalId: "proposal-123",
      },
      invokedBy: "agent",
    });

    expect(res.ok).toBe(true);
    expect(res.artifacts?.[0]?.type).toBe("url");
    expect(res.artifacts?.[0]?.value).toContain("https://example.com/share/abc123");
  });

  it("returns command_failed when adapter command exits non-zero", async () => {
    const scriptPath = await createAdapterCliScript();
    process.env.HOLYOPS_BUSINESS_CLI_BIN = process.execPath;
    process.env.HOLYOPS_BUSINESS_CLI_BASE_ARGS = JSON.stringify([scriptPath]);

    const res = await invokeHolyOpsAdapter({
      adapterId: "business-agent",
      action: "analytics_summary",
      args: {
        projectId: "proj-1",
        extraArgs: ["--fail"],
      },
      invokedBy: "agent",
    });

    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("command_failed");
  });

  it("rejects invalid clip input with invalid_input", async () => {
    const scriptPath = await createAdapterCliScript();
    process.env.HOLYOPS_VIDEO_CLI_BIN = process.execPath;
    process.env.HOLYOPS_VIDEO_CLI_BASE_ARGS = JSON.stringify([scriptPath]);

    const res = await invokeHolyOpsAdapter({
      adapterId: "video-agent",
      action: "clip",
      args: {
        inputPath: "/tmp/source.mp4",
        outputPath: "/tmp/out.mp4",
        startTime: "00:00:10",
      },
      invokedBy: "agent",
    });

    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("invalid_input");
    expect(res.error?.message).toContain("durationSec");
  });

  it("extracts proposal id artifact from create_proposal JSON output", async () => {
    const scriptPath = await createAdapterCliScript();
    process.env.HOLYOPS_BUSINESS_CLI_BIN = process.execPath;
    process.env.HOLYOPS_BUSINESS_CLI_BASE_ARGS = JSON.stringify([scriptPath]);

    const res = await invokeHolyOpsAdapter({
      adapterId: "business-agent",
      action: "create_proposal",
      args: {
        projectId: "proj-9",
        brief: "New proposal draft",
        template: "default",
      },
      invokedBy: "agent",
    });

    expect(res.ok).toBe(true);
    expect(res.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text", value: "proposal-123", label: "proposal_id" }),
        expect.objectContaining({
          type: "url",
          value: "https://example.com/proposal/proposal-123",
          label: "link",
        }),
      ]),
    );
  });

  it("marks transient adapter failures as retryable", async () => {
    const scriptPath = await createAdapterCliScript();
    process.env.HOLYOPS_BUSINESS_CLI_BIN = process.execPath;
    process.env.HOLYOPS_BUSINESS_CLI_BASE_ARGS = JSON.stringify([scriptPath]);

    const res = await invokeHolyOpsAdapter({
      adapterId: "business-agent",
      action: "analytics_summary",
      args: {
        projectId: "proj-1",
        extraArgs: ["--fail-transient"],
      },
      invokedBy: "agent",
    });

    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe("command_failed");
    expect(res.error?.retryable).toBe(true);
  });
});
