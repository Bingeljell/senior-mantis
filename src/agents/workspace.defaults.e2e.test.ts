import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveDefaultAgentWorkspaceDir,
  resolveLegacyDefaultAgentWorkspaceDir,
} from "./workspace.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DEFAULT_AGENT_WORKSPACE_DIR", () => {
  it("uses OPENCLAW_HOME when resolving the default workspace dir", () => {
    const home = path.join(path.sep, "srv", "openclaw-home");
    vi.stubEnv("OPENCLAW_HOME", home);
    vi.stubEnv("HOME", path.join(path.sep, "home", "other"));

    expect(resolveDefaultAgentWorkspaceDir()).toBe(
      path.join(path.resolve(home), ".openclaw", "workspace"),
    );
  });

  it("uses .holyops workspace root when HolyOps mode is active", () => {
    const home = path.join(path.sep, "srv", "holyops-home");
    vi.stubEnv("OPENCLAW_HOME", home);
    vi.stubEnv("OPENCLAW_CLI_NAME_OVERRIDE", "holyops");

    expect(resolveDefaultAgentWorkspaceDir()).toBe(
      path.join(path.resolve(home), ".holyops", "workspace"),
    );
  });

  it("resolves legacy workspace path under .openclaw", () => {
    const home = path.join(path.sep, "srv", "holyops-home");
    vi.stubEnv("OPENCLAW_HOME", home);
    vi.stubEnv("OPENCLAW_PROFILE", "default");

    expect(resolveLegacyDefaultAgentWorkspaceDir()).toBe(
      path.join(path.resolve(home), ".openclaw", "workspace"),
    );
  });
});
