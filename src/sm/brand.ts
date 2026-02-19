import { HOLYOPS_COMPAT_CLI_NAMES, resolveCliName } from "../cli/cli-name.js";

export function isHolyOpsBrand(argv: string[] = process.argv): boolean {
  const cliName = resolveCliName(argv).trim().toLowerCase();
  return (HOLYOPS_COMPAT_CLI_NAMES as readonly string[]).includes(cliName);
}

export function resolveProductBrand(argv: string[] = process.argv): "HolyOps" | "OpenClaw" {
  return isHolyOpsBrand(argv) ? "HolyOps" : "OpenClaw";
}

export function resolveStatusDocsLinks(argv: string[] = process.argv): {
  faq: string;
  troubleshooting: string;
} {
  const links = resolveBrandDocsLinks(argv);
  return {
    faq: links.faq,
    troubleshooting: links.troubleshooting,
  };
}

export function resolveBrandDocsLinks(argv: string[] = process.argv): {
  faq: string;
  troubleshooting: string;
  security: string;
  gatewayConfiguration: string;
  gatewayHealth: string;
  gatewayTroubleshooting: string;
  controlUi: string;
  agentWorkspace: string;
  toolsWeb: string;
  skills: string;
  windows: string;
} {
  if (isHolyOpsBrand(argv)) {
    return {
      faq: "docs/sm/STATUS.md",
      troubleshooting: "docs/sm/HANDOFF.md",
      security: "docs/sm/HANDOFF.md",
      gatewayConfiguration: "docs/sm/HANDOFF.md",
      gatewayHealth: "docs/sm/STATUS.md",
      gatewayTroubleshooting: "docs/sm/HANDOFF.md",
      controlUi: "docs/sm/HANDOFF.md",
      agentWorkspace: "docs/sm/HANDOFF.md",
      toolsWeb: "docs/sm/HANDOFF.md",
      skills: "docs/sm/HANDOFF.md",
      windows: "docs/sm/HANDOFF.md",
    };
  }
  return {
    faq: "https://docs.openclaw.ai/faq",
    troubleshooting: "https://docs.openclaw.ai/troubleshooting",
    security: "https://docs.openclaw.ai/security",
    gatewayConfiguration: "https://docs.openclaw.ai/gateway/configuration",
    gatewayHealth: "https://docs.openclaw.ai/gateway/health",
    gatewayTroubleshooting: "https://docs.openclaw.ai/gateway/troubleshooting",
    controlUi: "https://docs.openclaw.ai/web/control-ui",
    agentWorkspace: "https://docs.openclaw.ai/concepts/agent-workspace",
    toolsWeb: "https://docs.openclaw.ai/tools/web",
    skills: "https://docs.openclaw.ai/skills",
    windows: "https://docs.openclaw.ai/windows",
  };
}
