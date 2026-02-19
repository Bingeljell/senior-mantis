import { afterEach, describe, expect, it } from "vitest";
import {
  formatCliCommandForUi,
  resolveConfigPathForUi,
  resolveProductBrand,
  resolveProductSlugForUi,
  resolveUiDocsLinks,
} from "./brand.ts";

function setInjectedUiEnv(values: { cli?: string; brand?: string }) {
  (globalThis as unknown as { window?: Record<string, unknown> }).window = {
    __OPENCLAW_CLI_COMMAND__: values.cli,
    __OPENCLAW_PRODUCT_BRAND__: values.brand,
  };
}

describe("ui brand helpers", () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: Record<string, unknown> }).window;
  });

  it("uses OpenClaw defaults when no injection exists", () => {
    expect(resolveProductBrand()).toBe("OpenClaw");
    expect(resolveProductSlugForUi()).toBe("openclaw");
    expect(resolveConfigPathForUi()).toBe("~/.openclaw/openclaw.json");
    const docs = resolveUiDocsLinks();
    expect(docs.home.href).toBe("https://docs.openclaw.ai");
    expect(docs.controlUiAuth.href).toBe("https://docs.openclaw.ai/web/dashboard");
    expect(formatCliCommandForUi("openclaw dashboard --no-open")).toBe(
      "openclaw dashboard --no-open",
    );
  });

  it("switches to HolyOps docs/paths when injected", () => {
    setInjectedUiEnv({ cli: "holyops", brand: "HolyOps" });
    expect(resolveProductBrand()).toBe("HolyOps");
    expect(resolveProductSlugForUi()).toBe("holyops");
    expect(resolveConfigPathForUi()).toBe("~/.seniormantis/seniormantis.json");
    const docs = resolveUiDocsLinks();
    expect(docs.home.href).toBeNull();
    expect(docs.home.label).toContain("docs/sm/HANDOFF.md");
    expect(docs.insecureHttp.label).toContain("docs/sm/STATUS.md");
    expect(formatCliCommandForUi("openclaw doctor --generate-gateway-token")).toBe(
      "holyops doctor --generate-gateway-token",
    );
  });
});
