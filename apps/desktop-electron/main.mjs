import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const seniorMantisEntry = path.join(repoRoot, "seniormantis.mjs");
const globalCliCommand = process.env.SM_CLI_COMMAND?.trim() || "seniormantis";
const defaultGatewayHost = process.env.SM_GATEWAY_HOST ?? "127.0.0.1";
const defaultGatewayPort = process.env.SM_GATEWAY_PORT ?? "18789";
const defaultGatewayUrl = `http://${defaultGatewayHost}:${defaultGatewayPort}/ui`;

let mainWindow = null;
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

function resolveCliInvocation(args) {
  if (hasRepoRuntimeDependencies() && hasRepoCliBuildOutput()) {
    return {
      mode: "repo",
      command: process.execPath,
      args: [seniorMantisEntry, ...args],
      env: {
        ...process.env,
        OPENCLAW_CLI_NAME_OVERRIDE: "seniormantis",
      },
    };
  }
  return {
    mode: "global",
    command: globalCliCommand,
    args,
    env: process.env,
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
      child.on("close", (code) => {
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
        env: process.env,
      });
    }
    return primary;
  })();
}

async function openOnboardingInTerminal() {
  const command = toShellCommand(resolveCliInvocation(["onboard"]));
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

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: "ignore",
      detached: false,
    });
    child.once("error", reject);
    child.once("spawn", () => resolve(true));
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
    child.once("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({
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
      if (settled) {
        return;
      }
      settled = true;
      resolve({
        ok: true,
        message: `Gateway launch requested on loopback:${defaultGatewayPort} (${invocation.mode} CLI).`,
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
    title: "Senior Mantis Desktop",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  window.loadFile(path.join(__dirname, "renderer", "index.html"));
  return window;
}

ipcMain.handle("sm:get-config", async () => {
  const invocation = resolveCliInvocation([]);
  return {
    gatewayUrl: defaultGatewayUrl,
    cliMode: invocation.mode,
    globalCliCommand,
    cliCommand: invocation.command,
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
  const running = Boolean(gatewayProcess && gatewayProcess.exitCode == null);
  return {
    running,
    startedAt: gatewayStartTime,
    gatewayUrl: defaultGatewayUrl,
    launchMode: lastGatewayLaunchMode,
  };
});

ipcMain.handle("sm:start-gateway", async () => {
  const confirmed = await confirmSideEffect("Start local Senior Mantis gateway");
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
  await shell.openExternal(defaultGatewayUrl);
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

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
