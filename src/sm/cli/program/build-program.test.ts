import { describe, expect, it } from "vitest";
import { buildSeniorMantisProgram } from "./build-program.js";

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
});
