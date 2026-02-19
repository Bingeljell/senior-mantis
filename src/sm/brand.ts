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
  if (isHolyOpsBrand(argv)) {
    return {
      faq: "docs/sm/STATUS.md",
      troubleshooting: "docs/sm/HANDOFF.md",
    };
  }
  return {
    faq: "https://docs.openclaw.ai/faq",
    troubleshooting: "https://docs.openclaw.ai/troubleshooting",
  };
}
