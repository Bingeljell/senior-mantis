import { describe, expect, it } from "vitest";
import {
  assertSeniorMantisAllowedDeliverableChannel,
  assertSeniorMantisAllowedGatewayChannel,
  isSeniorMantisAllowedDeliverableChannel,
  isSeniorMantisAllowedGatewayChannel,
  isSeniorMantisAllowedOnboardingChannel,
  isSeniorMantisCli,
} from "./channel-policy.js";

describe("Senior Mantis channel policy", () => {
  it("detects Senior Mantis CLI mode from env override", () => {
    expect(
      isSeniorMantisCli({ OPENCLAW_CLI_NAME_OVERRIDE: "seniormantis" } as NodeJS.ProcessEnv),
    ).toBe(true);
    expect(isSeniorMantisCli({ OPENCLAW_CLI_NAME_OVERRIDE: "openclaw" } as NodeJS.ProcessEnv)).toBe(
      false,
    );
  });

  it("enforces gateway channels", () => {
    expect(isSeniorMantisAllowedGatewayChannel("whatsapp")).toBe(true);
    expect(isSeniorMantisAllowedGatewayChannel("webchat")).toBe(true);
    expect(isSeniorMantisAllowedGatewayChannel("telegram")).toBe(false);
  });

  it("enforces deliverable channels", () => {
    expect(isSeniorMantisAllowedDeliverableChannel("whatsapp")).toBe(true);
    expect(isSeniorMantisAllowedDeliverableChannel("webchat")).toBe(false);
  });

  it("enforces onboarding channels", () => {
    expect(isSeniorMantisAllowedOnboardingChannel("whatsapp")).toBe(true);
    expect(isSeniorMantisAllowedOnboardingChannel("telegram")).toBe(false);
  });

  it("throws for disallowed channels in Senior Mantis mode", () => {
    const previous = process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";
    try {
      expect(() => assertSeniorMantisAllowedGatewayChannel("telegram", "--channel")).toThrow(
        /Senior Mantis supports/,
      );
      expect(() => assertSeniorMantisAllowedDeliverableChannel("webchat", "--channel")).toThrow(
        /Senior Mantis supports/,
      );
    } finally {
      if (previous === undefined) {
        delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
      } else {
        process.env.OPENCLAW_CLI_NAME_OVERRIDE = previous;
      }
    }
  });
});
