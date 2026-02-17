import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ChannelPlugin } from "./types.js";
import { setActivePluginRegistry } from "../../plugins/runtime.js";
import { createTestRegistry } from "../../test-utils/channel-plugins.js";
import { listChannelPlugins } from "./index.js";

describe("channel plugin registry", () => {
  const emptyRegistry = createTestRegistry([]);

  const createPlugin = (id: string): ChannelPlugin => ({
    id,
    meta: {
      id,
      label: id,
      selectionLabel: id,
      docsPath: `/channels/${id}`,
      blurb: "test",
    },
    capabilities: { chatTypes: ["direct"] },
    config: {
      listAccountIds: () => [],
      resolveAccount: () => ({}),
    },
  });

  beforeEach(() => {
    setActivePluginRegistry(emptyRegistry);
  });

  afterEach(() => {
    delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    setActivePluginRegistry(emptyRegistry);
  });

  it("sorts channel plugins by configured order", () => {
    const registry = createTestRegistry(
      ["slack", "telegram", "signal"].map((id) => ({
        pluginId: id,
        plugin: createPlugin(id),
        source: "test",
      })),
    );
    setActivePluginRegistry(registry);
    const pluginIds = listChannelPlugins().map((plugin) => plugin.id);
    expect(pluginIds).toEqual(["telegram", "slack", "signal"]);
  });

  it("filters channel plugins to v1 channels in Senior Mantis mode", () => {
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";
    const registry = createTestRegistry(
      ["telegram", "whatsapp", "webchat"].map((id) => ({
        pluginId: id,
        plugin: createPlugin(id),
        source: "test",
      })),
    );
    setActivePluginRegistry(registry);
    const pluginIds = listChannelPlugins().map((plugin) => plugin.id);
    expect(pluginIds).toEqual(["whatsapp", "webchat"]);
  });
});
