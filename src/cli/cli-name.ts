import path from "node:path";

export const DEFAULT_CLI_NAME = "openclaw";
export const SENIOR_MANTIS_CLI_NAME = "seniormantis";

const KNOWN_CLI_NAMES = new Set([DEFAULT_CLI_NAME, SENIOR_MANTIS_CLI_NAME]);
const CLI_PREFIX_RE = /^(?:((?:pnpm|npm|bunx|npx)\s+))?(openclaw|seniormantis)\b/;

export function resolveCliName(argv: string[] = process.argv): string {
  const override = process.env.OPENCLAW_CLI_NAME_OVERRIDE?.trim();
  if (override) {
    return override;
  }
  const argv1 = argv[1];
  if (!argv1) {
    return DEFAULT_CLI_NAME;
  }
  const base = path.basename(argv1).trim();
  if (KNOWN_CLI_NAMES.has(base)) {
    return base;
  }
  return DEFAULT_CLI_NAME;
}

export function replaceCliName(command: string, cliName = resolveCliName()): string {
  if (!command.trim()) {
    return command;
  }
  if (!CLI_PREFIX_RE.test(command)) {
    return command;
  }
  return command.replace(CLI_PREFIX_RE, (_match, runner: string | undefined) => {
    return `${runner ?? ""}${cliName}`;
  });
}
