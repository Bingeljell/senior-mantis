import { afterEach, describe, expect, it } from "vitest";
import { resolveConfigSchemaForMode, resolveSubsections } from "./config.ts";

function setInjectedBrand(brand?: string) {
  (globalThis as unknown as { window?: Record<string, unknown> }).window = brand
    ? { __OPENCLAW_PRODUCT_BRAND__: brand }
    : {};
}

describe("config view helpers (node-safe)", () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: Record<string, unknown> }).window;
  });

  it("filters channel subsections to holyops v1 scope", () => {
    setInjectedBrand("HolyOps");
    const entries = resolveSubsections({
      key: "channels",
      schema: {
        type: "object",
        properties: {
          whatsapp: { type: "object", properties: {} },
          telegram: { type: "object", properties: {} },
          webchat: { type: "object", properties: {} },
        },
      },
      uiHints: {},
    });
    expect(entries.map((entry) => entry.key)).toEqual(["webchat", "whatsapp"]);
  });

  it("filters config schema channel keys in holyops mode", () => {
    setInjectedBrand("HolyOps");
    const filtered = resolveConfigSchemaForMode({
      type: "object",
      properties: {
        channels: {
          type: "object",
          properties: {
            whatsapp: { type: "object", properties: {} },
            telegram: { type: "object", properties: {} },
            webchat: { type: "object", properties: {} },
          },
        },
      },
    });
    const channelKeys = Object.keys(filtered?.properties?.channels?.properties ?? {});
    expect(channelKeys).toEqual(["whatsapp", "webchat"]);
  });
});
