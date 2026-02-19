#!/usr/bin/env node

if (!process.env.OPENCLAW_CLI_NAME_OVERRIDE?.trim()) {
  process.env.OPENCLAW_CLI_NAME_OVERRIDE = "holyops";
}

await import("./seniormantis.mjs");
