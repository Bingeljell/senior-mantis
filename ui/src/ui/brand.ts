const DEFAULT_CLI_COMMAND = "openclaw";
const HOLYOPS_COMPAT_CLI_NAMES = new Set(["holyops", "seniormantis"]);
const CLI_PREFIX_RE = /^(?:((?:pnpm|npm|bunx|npx|node)\s+))?openclaw\b/i;

declare global {
  interface Window {
    __OPENCLAW_CLI_COMMAND__?: string;
    __OPENCLAW_PRODUCT_BRAND__?: string;
  }
}

function normalizeValue(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function resolveCliCommand(): string {
  if (typeof window === "undefined") {
    return DEFAULT_CLI_COMMAND;
  }
  const injected = normalizeValue(window.__OPENCLAW_CLI_COMMAND__);
  return injected || DEFAULT_CLI_COMMAND;
}

export function resolveProductBrand(): "HolyOps" | "OpenClaw" {
  if (typeof window !== "undefined") {
    const injectedBrand = normalizeValue(window.__OPENCLAW_PRODUCT_BRAND__);
    if (injectedBrand === "holyops") {
      return "HolyOps";
    }
    if (injectedBrand === "openclaw") {
      return "OpenClaw";
    }
  }
  return HOLYOPS_COMPAT_CLI_NAMES.has(resolveCliCommand()) ? "HolyOps" : "OpenClaw";
}

export function formatCliCommandForUi(command: string): string {
  if (!command.trim() || !CLI_PREFIX_RE.test(command)) {
    return command;
  }
  return command.replace(CLI_PREFIX_RE, (_match, runner: string | undefined) => {
    return `${runner ?? ""}${resolveCliCommand()}`;
  });
}

export function resolveConfigPathForUi(): string {
  return resolveProductBrand() === "HolyOps"
    ? "~/.seniormantis/seniormantis.json"
    : "~/.openclaw/openclaw.json";
}
