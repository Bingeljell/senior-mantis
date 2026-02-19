import { describe, expect, it } from "vitest";
import {
  HOLYOPS_CLI_NAME,
  replaceCliName,
  resolveCliName,
  SENIOR_MANTIS_CLI_NAME,
} from "./cli-name.js";

describe("cli-name", () => {
  it("resolves holyops and seniormantis wrapper names", () => {
    expect(resolveCliName(["node", "/tmp/holyops"])).toBe(HOLYOPS_CLI_NAME);
    expect(resolveCliName(["node", "/tmp/seniormantis"])).toBe(SENIOR_MANTIS_CLI_NAME);
  });

  it("rewrites supported prefixes to the active cli name", () => {
    expect(replaceCliName("seniormantis status", HOLYOPS_CLI_NAME)).toBe("holyops status");
    expect(replaceCliName("pnpm seniormantis dashboard", HOLYOPS_CLI_NAME)).toBe(
      "pnpm holyops dashboard",
    );
    expect(replaceCliName("openclaw status", HOLYOPS_CLI_NAME)).toBe("holyops status");
  });
});
