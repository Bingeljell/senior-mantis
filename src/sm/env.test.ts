import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applySeniorMantisDefaults,
  HOLYOPS_CONFIG_FILENAME,
  HOLYOPS_STATE_DIRNAME,
  HOLYOPS_CLI_NAME,
  SENIOR_MANTIS_CONFIG_FILENAME,
  SENIOR_MANTIS_STATE_DIRNAME,
} from "./env.js";

describe("applySeniorMantisDefaults", () => {
  it("sets HolyOps defaults when OpenClaw env vars are unset", () => {
    const env = {
      HOME: "/tmp/home-user",
    } as NodeJS.ProcessEnv;

    applySeniorMantisDefaults(env);

    expect(env.OPENCLAW_STATE_DIR).toBe(path.join("/tmp/home-user", HOLYOPS_STATE_DIRNAME));
    expect(env.OPENCLAW_CONFIG_PATH).toBe(
      path.join("/tmp/home-user", HOLYOPS_STATE_DIRNAME, HOLYOPS_CONFIG_FILENAME),
    );
    expect(env.OPENCLAW_CLI_NAME_OVERRIDE).toBe(HOLYOPS_CLI_NAME);
  });

  it("falls back to legacy Senior Mantis paths when legacy config exists", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "holyops-env-"));
    const legacyStateDir = path.join(home, SENIOR_MANTIS_STATE_DIRNAME);
    const legacyConfigPath = path.join(legacyStateDir, SENIOR_MANTIS_CONFIG_FILENAME);
    fs.mkdirSync(legacyStateDir, { recursive: true });
    fs.writeFileSync(legacyConfigPath, "{}\n", "utf8");

    const env = {
      HOME: home,
    } as NodeJS.ProcessEnv;

    try {
      applySeniorMantisDefaults(env);
      expect(env.OPENCLAW_STATE_DIR).toBe(legacyStateDir);
      expect(env.OPENCLAW_CONFIG_PATH).toBe(legacyConfigPath);
      expect(env.OPENCLAW_CLI_NAME_OVERRIDE).toBe(HOLYOPS_CLI_NAME);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
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
