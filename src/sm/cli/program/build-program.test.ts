import { describe, expect, it } from "vitest";
import { buildSeniorMantisProgram } from "./build-program.js";

function findCommand(parent: { commands: Array<{ name: () => string }> }, name: string) {
  return parent.commands.find((command) => command.name() === name);
}

describe("buildSeniorMantisProgram", () => {
  it("registers the Senior Mantis v1 command surface", () => {
    const program = buildSeniorMantisProgram();
    const commandNames = program.commands.map((command) => command.name());

    expect(commandNames).toContain("setup");
    expect(commandNames).toContain("onboard");
    expect(commandNames).toContain("doctor");
    expect(commandNames).toContain("dashboard");
    expect(commandNames).toContain("message");
    expect(commandNames).toContain("agent");
    expect(commandNames).toContain("workflow");
    expect(commandNames).toContain("status");
    expect(commandNames).toContain("gateway");
  });

  it("does not register non-v1 channel management commands", () => {
    const program = buildSeniorMantisProgram();
    const commandNames = program.commands.map((command) => command.name());

    expect(commandNames).not.toContain("channels");
    expect(commandNames).not.toContain("plugins");
    expect(commandNames).not.toContain("pairing");
  });

  it("limits gateway subcommands to v1 local operations", () => {
    const program = buildSeniorMantisProgram();
    const gateway = findCommand(program, "gateway");
    expect(gateway).toBeTruthy();
    const subcommands = gateway?.commands.map((command) => command.name()) ?? [];

    expect(subcommands).toContain("run");
    expect(subcommands).toContain("status");
    expect(subcommands).not.toContain("call");
    expect(subcommands).not.toContain("discover");
    expect(subcommands).not.toContain("probe");
    expect(subcommands).not.toContain("usage-cost");
    expect(subcommands).not.toContain("start");
    expect(subcommands).not.toContain("stop");
    expect(subcommands).not.toContain("restart");
  });

  it("limits message send channel option to WhatsApp in v1 mode", () => {
    const program = buildSeniorMantisProgram();
    const message = findCommand(program, "message");
    expect(message).toBeTruthy();
    const send = message?.commands.find((command) => command.name() === "send");
    expect(send).toBeTruthy();
    const channelOption = send?.options.find((option) => option.long === "--channel");
    expect(channelOption?.description).toContain("Channel: whatsapp");
    expect(channelOption?.description).not.toContain("webchat");
  });
});
