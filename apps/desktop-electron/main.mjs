import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import JSON5 from "json5";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const seniorMantisEntry = path.join(repoRoot, "holyops.mjs");
const desktopSmokeScript = path.join(repoRoot, "scripts", "smoke-desktop-local.sh");
const globalCliCommand = process.env.SM_CLI_COMMAND?.trim() || "holyops";
const repoNodeCommand =
  process.env.SM_NODE_COMMAND?.trim() || (process.versions?.electron ? "node" : process.execPath);
const defaultGatewayHost = process.env.SM_GATEWAY_HOST ?? "127.0.0.1";
const defaultGatewayPort = process.env.SM_GATEWAY_PORT ?? "18789";
const HOLYOPS_STATE_DIRNAME = ".holyops";
const HOLYOPS_CONFIG_FILENAME = "holyops.json";
const LEGACY_SM_STATE_DIRNAME = ".seniormantis";
const LEGACY_SM_CONFIG_FILENAME = "seniormantis.json";
const holyOpsStateDir = resolveStateDir();
const holyOpsConfigPath = resolveGatewayConfigPath();

function normalizeUiPath(rawPath) {
  if (typeof rawPath !== "string") {
    return "";
  }
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function resolveStateDir() {
  const explicit = process.env.SM_STATE_DIR?.trim();
  if (explicit) {
    return explicit;
  }
  const home = os.homedir();
  const holyopsStateDir = path.join(home, HOLYOPS_STATE_DIRNAME);
  const legacyStateDir = path.join(home, LEGACY_SM_STATE_DIRNAME);
  if (fs.existsSync(holyopsStateDir)) {
    return holyopsStateDir;
  }
  if (fs.existsSync(path.join(legacyStateDir, LEGACY_SM_CONFIG_FILENAME))) {
    return legacyStateDir;
  }
  return holyopsStateDir;
}

function resolveGatewayConfigPath() {
  const explicit = process.env.SM_CONFIG_PATH?.trim();
  if (explicit) {
    return explicit;
  }
  const holyopsConfigPath = path.join(holyOpsStateDir, HOLYOPS_CONFIG_FILENAME);
  const legacyConfigPath = path.join(holyOpsStateDir, LEGACY_SM_CONFIG_FILENAME);
  if (fs.existsSync(holyopsConfigPath)) {
    return holyopsConfigPath;
  }
  if (fs.existsSync(legacyConfigPath)) {
    return legacyConfigPath;
  }
  return holyopsConfigPath;
}

function readGatewayConfig() {
  if (!fs.existsSync(holyOpsConfigPath)) {
    return null;
  }
  try {
    return JSON5.parse(fs.readFileSync(holyOpsConfigPath, "utf8"));
  } catch {
    return null;
  }
}

function resolveGatewayUiPath(parsedConfig) {
  const fromEnv = normalizeUiPath(process.env.SM_GATEWAY_UI_PATH ?? "");
  if (fromEnv || process.env.SM_GATEWAY_UI_PATH !== undefined) {
    return fromEnv;
  }
  return normalizeUiPath(parsedConfig?.gateway?.controlUi?.basePath);
}

function resolveGatewayToken(parsedConfig) {
  const fromEnv = process.env.SM_GATEWAY_TOKEN;
  if (fromEnv !== undefined) {
    return fromEnv.trim();
  }
  const fromGatewayEnv = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (fromGatewayEnv !== undefined) {
    return fromGatewayEnv.trim();
  }
  const token = parsedConfig?.gateway?.auth?.token;
  return typeof token === "string" ? token.trim() : "";
}

function resolveGatewayUrls() {
  const gatewayConfig = readGatewayConfig();
  const uiPath = resolveGatewayUiPath(gatewayConfig);
  const uiPathForUrl = uiPath ? `${uiPath}/` : "/";
  const gatewayUrl = `http://${defaultGatewayHost}:${defaultGatewayPort}${uiPathForUrl}`;
  const token = resolveGatewayToken(gatewayConfig);
  const gatewayUrlWithAuth = token
    ? `${gatewayUrl}#token=${encodeURIComponent(token)}`
    : gatewayUrl;
  return {
    gatewayUrl,
    gatewayUrlWithAuth,
  };
}

let gatewayProcess = null;
let gatewayStartTime = null;
let lastGatewayLaunchMode = "repo";

function quoted(command) {
  return `"${command.replace(/(["\\$`])/g, "\\$1")}"`;
}

function hasRepoRuntimeDependencies() {
  return fs.existsSync(path.join(repoRoot, "node_modules", "commander", "package.json"));
}

function hasRepoCliBuildOutput() {
  return (
    fs.existsSync(path.join(repoRoot, "dist", "entry-seniormantis.js")) ||
    fs.existsSync(path.join(repoRoot, "dist", "entry-seniormantis.mjs"))
  );
}

function resolveCliEnv(baseEnv = process.env) {
  const env = { ...baseEnv };
  // pnpm desktop launches can leak npm_config_prefix and trigger nvm startup warnings in spawned shells.
  delete env.npm_config_prefix;
  // Force HolyOps-local state/config so desktop workflows do not accidentally bind to legacy OpenClaw paths.
  env.OPENCLAW_STATE_DIR = holyOpsStateDir;
  env.OPENCLAW_CONFIG_PATH = holyOpsConfigPath;
  env.OPENCLAW_CLI_NAME_OVERRIDE = "holyops";
  return env;
}

function resolveCliInvocation(args) {
  if (hasRepoRuntimeDependencies() && hasRepoCliBuildOutput()) {
    return {
      mode: "repo",
      command: repoNodeCommand,
      args: [seniorMantisEntry, ...args],
      env: {
        ...resolveCliEnv(),
        OPENCLAW_CLI_NAME_OVERRIDE: "holyops",
      },
    };
  }
  return {
    mode: "global",
    command: globalCliCommand,
    args,
    env: resolveCliEnv(),
  };
}

function toShellCommand(invocation) {
  return [invocation.command, ...invocation.args].map(quoted).join(" ");
}

function shouldRetryWithGlobalCli(result) {
  if (result.ok) {
    return false;
  }
  const merged = `${result.stderr}\n${result.stdout}`;
  return (
    merged.includes("Cannot find module") ||
    merged.includes("ERR_MODULE_NOT_FOUND") ||
    merged.includes("MODULE_NOT_FOUND") ||
    merged.includes("missing dist/entry-seniormantis")
  );
}

function formatGatewayStartFailure(invocation, code, stderr, stdout) {
  const merged = `${stderr}\n${stdout}`.trim();
  const firstLine = merged
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (merged.includes("Missing config.")) {
    return "Gateway is not configured yet. Run `holyops setup` first, then try again.";
  }
  const reason = firstLine ? `: ${firstLine}` : "";
  return `Gateway exited early (code ${code ?? -1}) while launching with ${invocation.mode} CLI${reason}`;
}

function createSideEffectPrompt(actionLabel) {
  return dialog.showMessageBox({
    type: "question",
    buttons: ["Continue", "Cancel"],
    defaultId: 1,
    cancelId: 1,
    title: "Confirm action",
    message: "Explicit confirmation required",
    detail: `${actionLabel}\n\nThis action can change local runtime state.`,
  });
}

async function confirmSideEffect(actionLabel) {
  const result = await createSideEffectPrompt(actionLabel);
  return result.response === 0;
}

function runSeniorMantis(args, opts = {}) {
  const runInvocation = (invocation) =>
    new Promise((resolve) => {
      let settled = false;
      const child = spawn(invocation.command, invocation.args, {
        cwd: repoRoot,
        env: invocation.env,
        stdio: ["ignore", "pipe", "pipe"],
        ...opts,
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({
          ok: false,
          code: -1,
          stdout: stdout.trim(),
          stderr: `${stderr}\n${String(error)}`.trim(),
          mode: invocation.mode,
          command: invocation.command,
        });
      });
      child.on("close", (code) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({
          ok: code === 0,
          code: code ?? -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          mode: invocation.mode,
          command: invocation.command,
        });
      });
    });

  return (async () => {
    const primary = await runInvocation(resolveCliInvocation(args));
    if (primary.mode === "repo" && shouldRetryWithGlobalCli(primary)) {
      return runInvocation({
        mode: "global",
        command: globalCliCommand,
        args,
        env: resolveCliEnv(),
      });
    }
    return primary;
  })();
}

async function openCommandInTerminal(args) {
  const command = toShellCommand(resolveCliInvocation(args));
  if (process.platform === "darwin") {
    const escaped = command.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const script = [
      `tell application "Terminal" to activate`,
      `tell application "Terminal" to do script "${escaped}"`,
    ];
    await runCommand("osascript", script.flatMap((entry) => ["-e", entry]));
    return;
  }
  if (process.platform === "win32") {
    await runCommand("cmd.exe", ["/c", "start", "cmd.exe", "/k", command]);
    return;
  }
  await runCommand("x-terminal-emulator", ["-e", "bash", "-lc", command]);
}

async function openSetupInTerminal() {
  await openCommandInTerminal(["setup"]);
}

async function openOnboardingInTerminal() {
  await openCommandInTerminal(["onboard"]);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: resolveCliEnv(),
      stdio: "ignore",
      detached: false,
    });
    child.once("error", reject);
    child.once("spawn", () => resolve(true));
  });
}

function runDesktopDiagnostics() {
  if (!fs.existsSync(desktopSmokeScript)) {
    return Promise.resolve({
      ok: false,
      code: 127,
      stdout: "",
      stderr: `Missing diagnostics script: ${desktopSmokeScript}`,
      command: desktopSmokeScript,
    });
  }
  return new Promise((resolve) => {
    const child = spawn("bash", [desktopSmokeScript], {
      cwd: repoRoot,
      env: resolveCliEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      resolve({
        ok: false,
        code: -1,
        stdout: stdout.trim(),
        stderr: `${stderr}\n${String(error)}`.trim(),
        command: `bash ${desktopSmokeScript}`,
      });
    });
    child.once("close", (code) => {
      resolve({
        ok: code === 0,
        code: code ?? -1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command: `bash ${desktopSmokeScript}`,
      });
    });
  });
}

async function startGateway() {
  if (gatewayProcess && gatewayProcess.exitCode == null) {
    return {
      ok: true,
      message: "Gateway is already running from this desktop session.",
    };
  }
  const invocation = resolveCliInvocation([
    "gateway",
    "run",
    "--bind",
    "loopback",
    "--port",
    defaultGatewayPort,
    "--force",
  ]);
  return new Promise((resolve) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: repoRoot,
      env: invocation.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let settled = false;
    let stderr = "";
    let stdout = "";
    let startupTimer = null;

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = null;
      }
      resolve(result);
    };

    child.once("error", (error) => {
      finish({
        ok: false,
        message: `Failed to start gateway with ${invocation.mode} CLI (${invocation.command}): ${String(error)}`,
      });
    });
    child.once("spawn", () => {
      gatewayProcess = child;
      lastGatewayLaunchMode = invocation.mode;
      gatewayStartTime = new Date().toISOString();
      child.on("close", () => {
        gatewayProcess = null;
      });

      startupTimer = setTimeout(() => {
        finish({
          ok: true,
          message: `Gateway launch requested on loopback:${defaultGatewayPort} (${invocation.mode} CLI).`,
        });
      }, 1200);
    });

    child.once("close", (code) => {
      if (gatewayProcess === child) {
        gatewayProcess = null;
      }
      finish({
        ok: false,
        message: formatGatewayStartFailure(invocation, code, stderr, stdout),
      });
    });
  });
}

async function stopGateway() {
  if (!gatewayProcess || gatewayProcess.exitCode != null) {
    return {
      ok: true,
      message: "No desktop-managed gateway process is running.",
    };
  }
  gatewayProcess.kill("SIGTERM");
  return {
    ok: true,
    message: "Sent SIGTERM to desktop-managed gateway process.",
  };
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#091f18",
    title: "HolyOps Desktop",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  void window.loadFile(path.join(__dirname, "renderer", "index.html"));
  return window;
}

ipcMain.handle("sm:get-config", async () => {
  const urls = resolveGatewayUrls();
  const invocation = resolveCliInvocation([]);
  return {
    gatewayUrl: urls.gatewayUrl,
    gatewayUrlWithAuth: urls.gatewayUrlWithAuth,
    cliMode: invocation.mode,
    globalCliCommand,
    cliCommand: invocation.command,
    configPath: holyOpsConfigPath,
  };
});

ipcMain.handle("sm:run-readonly", async (_event, action) => {
  if (action === "status") {
    return runSeniorMantis(["status", "--json"]);
  }
  if (action === "health") {
    return runSeniorMantis(["health", "--json"]);
  }
  if (action === "sessions") {
    return runSeniorMantis(["sessions", "--json"]);
  }
  return {
    ok: false,
    code: -1,
    stdout: "",
    stderr: `unsupported action: ${action}`,
  };
});

ipcMain.handle("sm:gateway-status", async () => {
  const urls = resolveGatewayUrls();
  const running = Boolean(gatewayProcess && gatewayProcess.exitCode == null);
  return {
    running,
    startedAt: gatewayStartTime,
    gatewayUrl: urls.gatewayUrl,
    launchMode: lastGatewayLaunchMode,
  };
});

ipcMain.handle("sm:start-gateway", async () => {
  const confirmed = await confirmSideEffect("Start local HolyOps gateway");
  if (!confirmed) {
    return { ok: false, message: "Cancelled by user." };
  }
  return startGateway();
});

ipcMain.handle("sm:stop-gateway", async () => {
  const confirmed = await confirmSideEffect("Stop desktop-managed gateway process");
  if (!confirmed) {
    return { ok: false, message: "Cancelled by user." };
  }
  return stopGateway();
});

ipcMain.handle("sm:open-dashboard", async () => {
  const urls = resolveGatewayUrls();
  await shell.openExternal(urls.gatewayUrlWithAuth);
  return { ok: true, message: "Opened dashboard in default browser." };
});

ipcMain.handle("sm:run-onboarding", async () => {
  const confirmed = await confirmSideEffect("Open interactive onboarding in a terminal window");
  if (!confirmed) {
    return { ok: false, message: "Cancelled by user." };
  }
  try {
    await openOnboardingInTerminal();
    return { ok: true, message: "Opened onboarding terminal." };
  } catch (error) {
    return {
      ok: false,
      message: `Failed to open onboarding terminal: ${String(error)}`,
    };
  }
});

ipcMain.handle("sm:run-setup", async () => {
  const confirmed = await confirmSideEffect("Open setup in a terminal window");
  if (!confirmed) {
    return { ok: false, message: "Cancelled by user." };
  }
  try {
    await openSetupInTerminal();
    return { ok: true, message: "Opened setup terminal." };
  } catch (error) {
    return {
      ok: false,
      message: `Failed to open setup terminal: ${String(error)}`,
    };
  }
});

ipcMain.handle("sm:run-diagnostics", async () => {
  return runDesktopDiagnostics();
});

void app
  .whenReady()
  .then(() => {
    createMainWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((error) => {
    console.error("Failed to start HolyOps desktop app:", error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
