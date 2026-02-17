import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";

const dashboardCommand = vi.fn(async () => {});
const doctorCommand = vi.fn(async () => {});
const resetCommand = vi.fn(async () => {});
const uninstallCommand = vi.fn(async () => {});

vi.mock("../../commands/dashboard.js", () => ({
  dashboardCommand,
}));

vi.mock("../../commands/doctor.js", () => ({
  doctorCommand,
}));

vi.mock("../../commands/reset.js", () => ({
  resetCommand,
}));

vi.mock("../../commands/uninstall.js", () => ({
  uninstallCommand,
}));

vi.mock("../cli-utils.js", () => ({
  runCommandWithRuntime: async (_runtime: unknown, action: () => Promise<void>) => {
    await action();
  },
}));

const { registerMaintenanceCommands } = await import("./register.maintenance.js");

describe("registerMaintenanceCommands", () => {
  it("maps --no-open to dashboardCommand noOpen=true", async () => {
    const program = new Command();
    registerMaintenanceCommands(program);
    await program.parseAsync(["node", "seniormantis", "dashboard", "--no-open"]);
    expect(dashboardCommand).toHaveBeenCalledWith(expect.anything(), { noOpen: true });
  });

  it("defaults dashboardCommand noOpen=false", async () => {
    const program = new Command();
    registerMaintenanceCommands(program);
    await program.parseAsync(["node", "seniormantis", "dashboard"]);
    expect(dashboardCommand).toHaveBeenCalledWith(expect.anything(), { noOpen: false });
  });
});
