import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";

const dashboardCommand = vi.fn(async () => {});

vi.mock("../../../commands/dashboard.js", () => ({
  dashboardCommand,
}));

vi.mock("../../../cli/cli-utils.js", () => ({
  runCommandWithRuntime: async (_runtime: unknown, action: () => Promise<void>) => {
    await action();
  },
}));

const { buildSeniorMantisProgram } = await import("./build-program.js");

describe("buildSeniorMantisProgram dashboard command", () => {
  it("passes noOpen=true when --no-open is set", async () => {
    dashboardCommand.mockClear();
    const program: Command = buildSeniorMantisProgram();
    await program.parseAsync(["node", "seniormantis", "dashboard", "--no-open"]);
    expect(dashboardCommand).toHaveBeenCalledWith(expect.anything(), { noOpen: true });
  });

  it("passes noOpen=false by default", async () => {
    dashboardCommand.mockClear();
    const program: Command = buildSeniorMantisProgram();
    await program.parseAsync(["node", "seniormantis", "dashboard"]);
    expect(dashboardCommand).toHaveBeenCalledWith(expect.anything(), { noOpen: false });
  });
});
