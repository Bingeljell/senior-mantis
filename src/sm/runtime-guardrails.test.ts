import { beforeEach, describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  applyConfigOverrides,
  getConfigOverrides,
  resetConfigOverrides,
} from "../config/config.js";
import {
  applySeniorMantisRuntimeGuardrails,
  SENIOR_MANTIS_DISABLED_CHANNEL_PLUGIN_IDS,
  SENIOR_MANTIS_DISABLED_CHANNELS,
} from "./runtime-guardrails.js";

describe("applySeniorMantisRuntimeGuardrails", () => {
  beforeEach(() => {
    resetConfigOverrides();
  });

  it("enforces local gateway + v1 channel runtime guardrails", () => {
    applySeniorMantisRuntimeGuardrails();

    const overrides = getConfigOverrides();
    expect(overrides.gateway).toEqual({
      mode: "local",
      bind: "loopback",
      controlUi: {
        enabled: true,
      },
    });
    expect(overrides.tools).toEqual({
      exec: {
        ask: "always",
      },
    });
    expect(overrides.web).toEqual({ enabled: true });
    expect(overrides.channels).toMatchObject({
      whatsapp: { enabled: true },
    });
    expect(overrides.plugins).toMatchObject({
      entries: {
        whatsapp: { enabled: true },
      },
    });

    for (const channel of SENIOR_MANTIS_DISABLED_CHANNELS) {
      const channelOverride = (overrides.channels as Record<string, { enabled?: boolean }>)[
        channel
      ];
      expect(channelOverride?.enabled).toBe(false);
    }
    for (const pluginId of SENIOR_MANTIS_DISABLED_CHANNEL_PLUGIN_IDS) {
      const pluginOverride = (
        (overrides.plugins as Record<string, unknown>)?.entries as Record<
          string,
          { enabled?: boolean }
        >
      )?.[pluginId];
      expect(pluginOverride?.enabled).toBe(false);
    }
  });

  it("keeps existing whatsapp config values while forcing enabled", () => {
    applySeniorMantisRuntimeGuardrails();

    const cfg = {
      channels: {
        whatsapp: {
          dmPolicy: "pairing",
          allowFrom: ["+15555550123"],
        },
      },
    } as OpenClawConfig;
    const next = applyConfigOverrides(cfg);

    expect(next.channels?.whatsapp?.enabled).toBe(true);
    expect(next.channels?.whatsapp?.dmPolicy).toBe("pairing");
    expect(next.channels?.whatsapp?.allowFrom).toEqual(["+15555550123"]);
  });
});
