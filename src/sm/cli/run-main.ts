import process from "node:process";
import { loadDotEnv } from "../../infra/dotenv.js";
import { normalizeEnv } from "../../infra/env.js";
import { formatUncaughtError } from "../../infra/errors.js";
import { ensureOpenClawCliOnPath } from "../../infra/path-env.js";
import { assertSupportedRuntime } from "../../infra/runtime-guard.js";
import { installUnhandledRejectionHandler } from "../../infra/unhandled-rejections.js";
import { enableConsoleCapture } from "../../logging.js";
import { normalizeWindowsArgv } from "../../cli/windows-argv.js";
import { applySeniorMantisDefaults } from "../env.js";
import { buildSeniorMantisProgram } from "./program/build-program.js";

function rewriteUpdateFlagArgv(argv: string[]): string[] {
  const index = argv.indexOf("--update");
  if (index === -1) {
    return argv;
  }

  const next = [...argv];
  next.splice(index, 1, "update");
  return next;
}

export async function runSeniorMantisCli(argv: string[] = process.argv): Promise<void> {
  const normalizedArgv = normalizeWindowsArgv(argv);

  loadDotEnv({ quiet: true });
  normalizeEnv();
  applySeniorMantisDefaults();
  ensureOpenClawCliOnPath();

  // Enforce minimum runtime before doing any work.
  assertSupportedRuntime();

  // Capture console output into structured logs while keeping stdout/stderr behavior.
  enableConsoleCapture();

  const program = buildSeniorMantisProgram();

  // Global error handlers to prevent silent crashes from unhandled rejections/exceptions.
  installUnhandledRejectionHandler();
  process.on("uncaughtException", (error) => {
    console.error("[seniormantis] Uncaught exception:", formatUncaughtError(error));
    process.exit(1);
  });

  const parseArgv = rewriteUpdateFlagArgv(normalizedArgv);
  await program.parseAsync(parseArgv);
}
