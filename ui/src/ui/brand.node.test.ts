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

  it("uses HolyOps defaults when no injection exists", () => {
    expect(resolveProductBrand()).toBe("HolyOps");
    expect(resolveProductSlugForUi()).toBe("holyops");
    expect(resolveConfigPathForUi()).toBe("~/.holyops/holyops.json");
    const docs = resolveUiDocsLinks();
    expect(docs.home.href).toBeNull();
    expect(docs.controlUiAuth.href).toBeNull();
    expect(formatCliCommandForUi("openclaw dashboard --no-open")).toBe(
      "holyops dashboard --no-open",
    );
  });

  it("switches to HolyOps docs/paths when injected", () => {
    setInjectedUiEnv({ cli: "holyops", brand: "HolyOps" });
    expect(resolveProductBrand()).toBe("HolyOps");
    expect(resolveProductSlugForUi()).toBe("holyops");
    expect(resolveConfigPathForUi()).toBe("~/.holyops/holyops.json");
    const docs = resolveUiDocsLinks();
    expect(docs.home.href).toBeNull();
    expect(docs.home.label).toContain("docs/sm/HANDOFF.md");
    expect(docs.insecureHttp.label).toContain("docs/sm/STATUS.md");
    expect(formatCliCommandForUi("openclaw doctor --generate-gateway-token")).toBe(
      "holyops doctor --generate-gateway-token",
    );
  });
});
