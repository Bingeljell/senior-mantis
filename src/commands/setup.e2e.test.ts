import JSON5 from "json5";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeEnv } from "../runtime.js";
import { setupCommand } from "./setup.js";

const tempDirs: string[] = [];

function createRuntime(logs: string[]): RuntimeEnv {
  return {
    log: (message: string) => logs.push(message),
    error: () => undefined,
    exit: () => undefined,
  } as unknown as RuntimeEnv;
}

async function createTempHome(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "setup-e2e-"));
  tempDirs.push(dir);
  return dir;
}

async function readWorkspaceFromConfig(configPath: string): Promise<string | undefined> {
  const raw = await fs.readFile(configPath, "utf-8");
  const parsed = JSON5.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    return undefined;
  }
  const agents = (parsed as { agents?: unknown }).agents;
  if (!agents || typeof agents !== "object") {
    return undefined;
  }
  const defaults = (agents as { defaults?: unknown }).defaults;
  if (!defaults || typeof defaults !== "object") {
    return undefined;
  }
  const workspace = (defaults as { workspace?: unknown }).workspace;
  return typeof workspace === "string" ? workspace : undefined;
}

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("setupCommand workspace defaults", () => {
  it("migrates HolyOps setup from legacy default workspace path", async () => {
    const home = await createTempHome();
    const stateDir = path.join(home, ".holyops");
    const configPath = path.join(stateDir, "holyops.json");
    const legacyWorkspace = path.join(home, ".openclaw", "workspace");
    const holyopsWorkspace = path.join(home, ".holyops", "workspace");
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.mkdir(legacyWorkspace, { recursive: true });
    await fs.writeFile(
      configPath,
      JSON.stringify(
        {
          agents: {
            defaults: {
              workspace: legacyWorkspace,
            },
          },
        },
        null,
        2,
      ),
      "utf-8",
    );
    vi.stubEnv("OPENCLAW_HOME", home);
    vi.stubEnv("OPENCLAW_STATE_DIR", stateDir);
    vi.stubEnv("OPENCLAW_CONFIG_PATH", configPath);
    vi.stubEnv("OPENCLAW_CLI_NAME_OVERRIDE", "holyops");

    const logs: string[] = [];
    await setupCommand(undefined, createRuntime(logs));

    expect(await readWorkspaceFromConfig(configPath)).toBe(holyopsWorkspace);
    expect(logs.join("\n")).toContain("Workspace default migrated to");
  });

  it("keeps explicit --workspace override without migration rewrite", async () => {
    const home = await createTempHome();
    const stateDir = path.join(home, ".holyops");
    const configPath = path.join(stateDir, "holyops.json");
    const legacyWorkspace = path.join(home, ".openclaw", "workspace");
    const explicitWorkspace = path.join(home, "my-workspace");
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(
      configPath,
      JSON.stringify(
        {
          agents: {
            defaults: {
              workspace: legacyWorkspace,
            },
          },
        },
        null,
        2,
      ),
      "utf-8",
    );
    vi.stubEnv("OPENCLAW_HOME", home);
    vi.stubEnv("OPENCLAW_STATE_DIR", stateDir);
    vi.stubEnv("OPENCLAW_CONFIG_PATH", configPath);
    vi.stubEnv("OPENCLAW_CLI_NAME_OVERRIDE", "holyops");

    const logs: string[] = [];
    await setupCommand({ workspace: explicitWorkspace }, createRuntime(logs));

    expect(await readWorkspaceFromConfig(configPath)).toBe(explicitWorkspace);
    expect(logs.join("\n")).not.toContain("Workspace default migrated to");
  });
});
