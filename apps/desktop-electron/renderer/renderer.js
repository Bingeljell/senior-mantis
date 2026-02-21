const els = {
  runSetup: document.getElementById("runSetup"),
  runDiagnostics: document.getElementById("runDiagnostics"),
  startGateway: document.getElementById("startGateway"),
  stopGateway: document.getElementById("stopGateway"),
  openOnboarding: document.getElementById("openOnboarding"),
  openDashboard: document.getElementById("openDashboard"),
  refreshHealth: document.getElementById("refreshHealth"),
  refreshSessions: document.getElementById("refreshSessions"),
  refreshStatus: document.getElementById("refreshStatus"),
  gatewayStatus: document.getElementById("gatewayStatus"),
  healthOutput: document.getElementById("healthOutput"),
  sessionsOutput: document.getElementById("sessionsOutput"),
  statusOutput: document.getElementById("statusOutput"),
  diagnosticsOutput: document.getElementById("diagnosticsOutput"),
  activityLog: document.getElementById("activityLog"),
  uiUrlOutput: document.getElementById("uiUrlOutput"),
};

function logActivity(message) {
  const timestamp = new Date().toLocaleTimeString();
  const current = els.activityLog.textContent?.trim();
  const nextLine = `[${timestamp}] ${message}`;
  els.activityLog.textContent = current ? `${nextLine}\n${current}` : nextLine;
}

function pretty(result) {
  if (!result) {
    return "No result.";
  }
  if (result.ok && result.stdout) {
    try {
      return JSON.stringify(JSON.parse(result.stdout), null, 2);
    } catch {
      return result.stdout;
    }
  }
  return JSON.stringify(result, null, 2);
}

function maybeSetupHint(result) {
  if (result?.ok) {
    return null;
  }
  const details = `${result?.stderr ?? ""}\n${result?.stdout ?? ""}`.toLowerCase();
  if (
    details.includes("missing config") ||
    details.includes("run `holyops setup`") ||
    details.includes("run `seniormantis setup`")
  ) {
    return "Setup is required before first gateway start. Click 'Run Setup'.";
  }
  return null;
}

async function refreshGatewayStatus() {
  const status = await window.smDesktop.getGatewayStatus();
  const launchMode = status.launchMode ? ` (${status.launchMode} CLI)` : "";
  const startedAt = status.startedAt ? ` · started: ${status.startedAt}` : "";
  els.gatewayStatus.textContent = status.running
    ? `Running (desktop-managed)${launchMode}${startedAt}`
    : `Not running (desktop-managed) · UI URL ${status.gatewayUrl}`;
}

async function refreshReadOnlyView(action, target) {
  const result = await window.smDesktop.runReadonly(action);
  target.textContent = pretty(result);
  const hint = maybeSetupHint(result);
  if (hint) {
    logActivity(hint);
  }
}

async function refreshUiUrl(log = false) {
  const cfg = await window.smDesktop.getConfig();
  els.uiUrlOutput.textContent = cfg.gatewayUrlWithAuth || cfg.gatewayUrl;
  if (log) {
    logActivity(`Browser dashboard URL: ${cfg.gatewayUrl}`);
  }
  return cfg;
}

async function boot() {
  const cfg = await refreshUiUrl(true);
  logActivity(`CLI mode: ${cfg.cliMode} (${cfg.cliCommand})`);
  await refreshGatewayStatus();
  await Promise.all([
    refreshReadOnlyView("status", els.statusOutput),
    refreshReadOnlyView("health", els.healthOutput),
    refreshReadOnlyView("sessions", els.sessionsOutput),
  ]);
}

els.startGateway.addEventListener("click", async () => {
  const result = await window.smDesktop.startGateway();
  logActivity(result.message ?? "Start gateway completed.");
  await refreshGatewayStatus();
  await refreshUiUrl(false);
});

els.runSetup.addEventListener("click", async () => {
  const result = await window.smDesktop.runSetup();
  logActivity(result.message ?? "Setup action completed.");
});

els.runDiagnostics.addEventListener("click", async () => {
  els.diagnosticsOutput.textContent = "Running diagnostics...";
  const result = await window.smDesktop.runDiagnostics();
  els.diagnosticsOutput.textContent = pretty(result);
  if (result?.ok) {
    logActivity("Desktop diagnostics passed.");
  } else {
    logActivity(`Desktop diagnostics failed (code: ${result?.code ?? "unknown"}).`);
  }
});

els.stopGateway.addEventListener("click", async () => {
  const result = await window.smDesktop.stopGateway();
  logActivity(result.message ?? "Stop gateway completed.");
  await refreshGatewayStatus();
});

els.openOnboarding.addEventListener("click", async () => {
  const result = await window.smDesktop.runOnboarding();
  logActivity(result.message ?? "Onboarding action completed.");
});

els.openDashboard.addEventListener("click", async () => {
  const result = await window.smDesktop.openDashboard();
  logActivity(result.message ?? "Opened dashboard.");
});

els.refreshHealth.addEventListener("click", async () => {
  await refreshReadOnlyView("health", els.healthOutput);
  logActivity("Refreshed health snapshot.");
});

els.refreshSessions.addEventListener("click", async () => {
  await refreshReadOnlyView("sessions", els.sessionsOutput);
  logActivity("Refreshed sessions snapshot.");
});

els.refreshStatus.addEventListener("click", async () => {
  await refreshReadOnlyView("status", els.statusOutput);
  logActivity("Refreshed status snapshot.");
});

boot().catch((error) => {
  logActivity(`Bootstrap failure: ${String(error)}`);
});
