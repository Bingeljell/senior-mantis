import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applySeniorMantisDefaults,
  HOLYOPS_CLI_NAME,
  SENIOR_MANTIS_CONFIG_FILENAME,
  SENIOR_MANTIS_STATE_DIRNAME,
} from "./env.js";

describe("applySeniorMantisDefaults", () => {
  it("sets Senior Mantis defaults when OpenClaw env vars are unset", () => {
    const env = {
      HOME: "/tmp/home-user",
    } as NodeJS.ProcessEnv;

    applySeniorMantisDefaults(env);

    expect(env.OPENCLAW_STATE_DIR).toBe(path.join("/tmp/home-user", SENIOR_MANTIS_STATE_DIRNAME));
    expect(env.OPENCLAW_CONFIG_PATH).toBe(
      path.join("/tmp/home-user", SENIOR_MANTIS_STATE_DIRNAME, SENIOR_MANTIS_CONFIG_FILENAME),
    );
    expect(env.OPENCLAW_CLI_NAME_OVERRIDE).toBe(HOLYOPS_CLI_NAME);
  });

  it("does not overwrite explicit OpenClaw env overrides", () => {
    const env = {
      HOME: "/tmp/home-user",
      OPENCLAW_STATE_DIR: "/custom/state",
      OPENCLAW_CONFIG_PATH: "/custom/sm.json",
      OPENCLAW_CLI_NAME_OVERRIDE: "custom-sm",
    } as NodeJS.ProcessEnv;

    applySeniorMantisDefaults(env);

    expect(env.OPENCLAW_STATE_DIR).toBe("/custom/state");
    expect(env.OPENCLAW_CONFIG_PATH).toBe("/custom/sm.json");
    expect(env.OPENCLAW_CLI_NAME_OVERRIDE).toBe("custom-sm");
  });
});
