import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getChannelPluginCatalogEntry, listChannelPluginCatalogEntries } from "./catalog.js";

describe("channel plugin catalog", () => {
  it("includes Microsoft Teams", () => {
    const entry = getChannelPluginCatalogEntry("msteams");
    expect(entry?.install.npmSpec).toBe("@openclaw/msteams");
    expect(entry?.meta.aliases).toContain("teams");
  });

  it("lists plugin catalog entries", () => {
    const ids = listChannelPluginCatalogEntries().map((entry) => entry.id);
    expect(ids).toContain("msteams");
  });

  it("includes external catalog entries", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-catalog-"));
    const catalogPath = path.join(dir, "catalog.json");
    fs.writeFileSync(
      catalogPath,
      JSON.stringify({
        entries: [
          {
            name: "@openclaw/demo-channel",
            openclaw: {
              channel: {
                id: "demo-channel",
                label: "Demo Channel",
                selectionLabel: "Demo Channel",
                docsPath: "/channels/demo-channel",
                blurb: "Demo entry",
                order: 999,
              },
              install: {
                npmSpec: "@openclaw/demo-channel",
              },
            },
          },
        ],
      }),
    );

    const ids = listChannelPluginCatalogEntries({ catalogPaths: [catalogPath] }).map(
      (entry) => entry.id,
    );
    expect(ids).toContain("demo-channel");
  });

  it("returns no catalog entries in Senior Mantis mode", () => {
    const previousCliName = process.env.OPENCLAW_CLI_NAME_OVERRIDE;
    process.env.OPENCLAW_CLI_NAME_OVERRIDE = "seniormantis";
    try {
      const ids = listChannelPluginCatalogEntries().map((entry) => entry.id);
      expect(ids).not.toContain("msteams");
      expect(ids).toHaveLength(0);
    } finally {
      if (previousCliName === undefined) {
        delete process.env.OPENCLAW_CLI_NAME_OVERRIDE;
      } else {
        process.env.OPENCLAW_CLI_NAME_OVERRIDE = previousCliName;
      }
    }
  });
});
