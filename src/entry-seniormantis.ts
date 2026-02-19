#!/usr/bin/env node
import { spawn } from "node:child_process";
import process from "node:process";
import { shouldSkipRespawnForArgv } from "./cli/respawn-policy.js";
import { normalizeWindowsArgv } from "./cli/windows-argv.js";
import { isTruthyEnvValue, normalizeEnv } from "./infra/env.js";
import { installProcessWarningFilter } from "./infra/warning-filter.js";
import { attachChildProcessBridge } from "./process/child-process-bridge.js";
import { runSeniorMantisCli } from "./sm/cli/run-main.js";
import { applySeniorMantisDefaults } from "./sm/env.js";

const resolveCliLogLabel = () => {
  const raw = process.env.OPENCLAW_CLI_NAME_OVERRIDE?.trim();
  return raw || "holyops";
};

process.title = resolveCliLogLabel();
installProcessWarningFilter();
normalizeEnv();
applySeniorMantisDefaults();

const CLI_LOG_LABEL = resolveCliLogLabel();

if (process.argv.includes("--no-color")) {
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";
}

const EXPERIMENTAL_WARNING_FLAG = "--disable-warning=ExperimentalWarning";

function hasExperimentalWarningSuppressed(): boolean {
  const nodeOptions = process.env.NODE_OPTIONS ?? "";
  if (nodeOptions.includes(EXPERIMENTAL_WARNING_FLAG) || nodeOptions.includes("--no-warnings")) {
    return true;
  }
  for (const arg of process.execArgv) {
    if (arg === EXPERIMENTAL_WARNING_FLAG || arg === "--no-warnings") {
      return true;
    }
  }
  return false;
}

function ensureExperimentalWarningSuppressed(): boolean {
  if (shouldSkipRespawnForArgv(process.argv)) {
    return false;
  }
  if (isTruthyEnvValue(process.env.OPENCLAW_NO_RESPAWN)) {
    return false;
  }
  if (isTruthyEnvValue(process.env.OPENCLAW_NODE_OPTIONS_READY)) {
    return false;
  }
  if (hasExperimentalWarningSuppressed()) {
    return false;
  }

  process.env.OPENCLAW_NODE_OPTIONS_READY = "1";
  const child = spawn(
    process.execPath,
    [EXPERIMENTAL_WARNING_FLAG, ...process.execArgv, ...process.argv.slice(1)],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  attachChildProcessBridge(child);

  child.once("exit", (code, signal) => {
    if (signal) {
      process.exitCode = 1;
      return;
    }
    process.exit(code ?? 1);
  });

  child.once("error", (error) => {
    console.error(
      `[${CLI_LOG_LABEL}] Failed to respawn CLI:`,
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    process.exit(1);
  });

  return true;
}

process.argv = normalizeWindowsArgv(process.argv);

if (!ensureExperimentalWarningSuppressed()) {
  void runSeniorMantisCli(process.argv).catch((error) => {
    console.error(
      `[${CLI_LOG_LABEL}] Failed to start CLI:`,
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    process.exitCode = 1;
  });
}
