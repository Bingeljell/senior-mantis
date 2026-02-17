import { afterEach, describe, expect, it } from "vitest";
import { validateConfigObjectWithPlugins } from "./config.js";

describe("Senior Mantis config channel validation", () => {
  afterEach(() => {
    delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
  });

  it("rejects non-v1 channel blocks in Senior Mantis mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";
    const res = validateConfigObjectWithPlugins({
      channels: {
        telegram: {},
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues).toContainEqual({
        path: "channels.telegram",
        message: "unknown channel id: telegram",
      });
    }
  });

  it("rejects non-v1 heartbeat targets in Senior Mantis mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";
    const res = validateConfigObjectWithPlugins({
      agents: {
        defaults: {
          heartbeat: { target: "telegram" },
        },
      },
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.issues).toContainEqual({
        path: "agents.defaults.heartbeat.target",
        message: "unknown heartbeat target: telegram",
      });
    }
  });

  it("accepts v1 heartbeat targets in Senior Mantis mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";
    const res = validateConfigObjectWithPlugins({
      agents: {
        defaults: {
          heartbeat: { target: "whatsapp" },
        },
        list: [{ id: "care-assistant", heartbeat: { target: "webchat" } }],
      },
    });

    expect(res.ok).toBe(true);
  });
});
