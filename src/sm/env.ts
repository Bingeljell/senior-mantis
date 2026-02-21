import fs from "node:fs";
import path from "node:path";
import { HOLYOPS_CLI_NAME, SENIOR_MANTIS_CLI_NAME } from "../cli/cli-name.js";
import { resolveRequiredHomeDir } from "../infra/home-dir.js";

export const HOLYOPS_STATE_DIRNAME = ".holyops";
export const HOLYOPS_CONFIG_FILENAME = "holyops.json";
export const SENIOR_MANTIS_STATE_DIRNAME = ".seniormantis";
export const SENIOR_MANTIS_CONFIG_FILENAME = "seniormantis.json";
export { HOLYOPS_CLI_NAME, SENIOR_MANTIS_CLI_NAME };

function resolveDefaultStateDir(home: string): string {
  const holyopsStateDir = path.join(home, HOLYOPS_STATE_DIRNAME);
  const legacyStateDir = path.join(home, SENIOR_MANTIS_STATE_DIRNAME);

  if (fs.existsSync(holyopsStateDir)) {
    return holyopsStateDir;
  }
  if (fs.existsSync(path.join(legacyStateDir, SENIOR_MANTIS_CONFIG_FILENAME))) {
    return legacyStateDir;
  }
  return holyopsStateDir;
}

function resolveDefaultConfigPath(stateDir: string): string {
  const holyopsConfigPath = path.join(stateDir, HOLYOPS_CONFIG_FILENAME);
  const legacyConfigPath = path.join(stateDir, SENIOR_MANTIS_CONFIG_FILENAME);

  if (fs.existsSync(holyopsConfigPath)) {
    return holyopsConfigPath;
  }
  if (fs.existsSync(legacyConfigPath)) {
    return legacyConfigPath;
  }
  return holyopsConfigPath;
}

export function applySeniorMantisDefaults(env: NodeJS.ProcessEnv = process.env): void {
  const home = resolveRequiredHomeDir(env);
  const stateDir = resolveDefaultStateDir(home);

  if (!env.OPENCLAW_STATE_DIR?.trim()) {
    env.OPENCLAW_STATE_DIR = stateDir;
  }

  if (!env.OPENCLAW_CONFIG_PATH?.trim()) {
    env.OPENCLAW_CONFIG_PATH = resolveDefaultConfigPath(env.OPENCLAW_STATE_DIR);
  }

  if (!env.OPENCLAW_CLI_NAME_OVERRIDE?.trim()) {
    env.OPENCLAW_CLI_NAME_OVERRIDE = HOLYOPS_CLI_NAME;
  }
}
