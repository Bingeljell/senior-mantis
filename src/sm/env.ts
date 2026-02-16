import path from "node:path";
import { resolveRequiredHomeDir } from "../infra/home-dir.js";

export const SENIOR_MANTIS_STATE_DIRNAME = ".seniormantis";
export const SENIOR_MANTIS_CONFIG_FILENAME = "seniormantis.json";
export const SENIOR_MANTIS_CLI_NAME = "seniormantis";

export function applySeniorMantisDefaults(env: NodeJS.ProcessEnv = process.env): void {
  const home = resolveRequiredHomeDir(env);
  const stateDir = path.join(home, SENIOR_MANTIS_STATE_DIRNAME);

  if (!env.OPENCLAW_STATE_DIR?.trim()) {
    env.OPENCLAW_STATE_DIR = stateDir;
  }

  if (!env.OPENCLAW_CONFIG_PATH?.trim()) {
    env.OPENCLAW_CONFIG_PATH = path.join(env.OPENCLAW_STATE_DIR, SENIOR_MANTIS_CONFIG_FILENAME);
  }

  if (!env.OPENCLAW_CLI_NAME_OVERRIDE?.trim()) {
    env.OPENCLAW_CLI_NAME_OVERRIDE = SENIOR_MANTIS_CLI_NAME;
  }
}
