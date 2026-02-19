const DEFAULT_CLI_COMMAND = "openclaw";
const HOLYOPS_COMPAT_CLI_NAMES = new Set(["holyops", "seniormantis"]);
const CLI_PREFIX_RE = /^(?:((?:pnpm|npm|bunx|npx|node)\s+))?openclaw\b/i;
const UI_DOCS_HOME = "https://docs.openclaw.ai";
const UI_DOCS_CONTROL_AUTH = "https://docs.openclaw.ai/web/dashboard";
const UI_DOCS_TAILSCALE = "https://docs.openclaw.ai/gateway/tailscale";
const UI_DOCS_INSECURE_HTTP = "https://docs.openclaw.ai/web/control-ui#insecure-http";

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

export function resolveProductSlugForUi(): "holyops" | "openclaw" {
  return resolveProductBrand() === "HolyOps" ? "holyops" : "openclaw";
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

export type UiDocLink = {
  label: string;
  href: string | null;
};

export function resolveUiDocsLinks(): {
  home: UiDocLink;
  controlUiAuth: UiDocLink;
  tailscale: UiDocLink;
  insecureHttp: UiDocLink;
} {
  if (resolveProductBrand() === "HolyOps") {
    return {
      home: { label: "Docs: docs/sm/HANDOFF.md", href: null },
      controlUiAuth: { label: "Docs: docs/sm/HANDOFF.md", href: null },
      tailscale: { label: "Docs: docs/sm/HANDOFF.md", href: null },
      insecureHttp: { label: "Docs: docs/sm/STATUS.md", href: null },
    };
  }
  return {
    home: { label: "Docs", href: UI_DOCS_HOME },
    controlUiAuth: { label: "Docs: Control UI auth", href: UI_DOCS_CONTROL_AUTH },
    tailscale: { label: "Docs: Tailscale Serve", href: UI_DOCS_TAILSCALE },
    insecureHttp: { label: "Docs: Insecure HTTP", href: UI_DOCS_INSECURE_HTTP },
  };
}
