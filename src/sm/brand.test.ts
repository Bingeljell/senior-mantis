import { describe, expect, it } from "vitest";
import {
  isHolyOpsBrand,
  resolveBrandDocsLinks,
  resolveProductBrand,
  resolveStatusDocsLinks,
} from "./brand.js";

describe("HolyOps brand helpers", () => {
  it("detects HolyOps aliases", () => {
    const prev = process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "holyops";
    try {
      expect(isHolyOpsBrand()).toBe(true);
      expect(resolveProductBrand()).toBe("HolyOps");
      expect(resolveBrandDocsLinks().controlUi).toBe("docs/sm/HANDOFF.md");
      expect(resolveBrandDocsLinks().toolsWeb).toBe("docs/sm/HANDOFF.md");
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
      } else {
        process.env.OPENCLAW_CLI_NAME_OVERRIDE = prev;
      }
    }
  });

  it("returns OpenClaw defaults when override is absent", () => {
    const prev = process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    try {
      expect(resolveProductBrand(["node", "/tmp/openclaw.mjs"])).toBe("OpenClaw");
      expect(resolveStatusDocsLinks(["node", "/tmp/openclaw.mjs"])).toEqual({
        faq: "https://docs.openclaw.ai/faq",
        troubleshooting: "https://docs.openclaw.ai/troubleshooting",
      });
      expect(resolveBrandDocsLinks(["node", "/tmp/openclaw.mjs"])).toMatchObject({
        security: "https://docs.openclaw.ai/security",
        gatewayConfiguration: "https://docs.openclaw.ai/gateway/configuration",
      });
    } finally {
      if (prev === undefined) {
        delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
      } else {
        process.env.OPENCLAW_CLI_NAME_OVERRIDE = prev;
      }
    }
  });
});
