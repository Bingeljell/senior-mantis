const els = {
  runSetup: document.getElementById("runSetup"),
  startGateway: document.getElementById("startGateway"),
  stopGateway: document.getElementById("stopGateway"),
  openOnboarding: document.getElementById("openOnboarding"),
  openDashboard: document.getElementById("openDashboard"),
  refreshHealth: document.getElementById("refreshHealth"),
  refreshSessions: document.getElementById("refreshSessions"),
  refreshStatus: document.getElementById("refreshStatus"),
  refreshFrame: document.getElementById("refreshFrame"),
  runVideoCompress: document.getElementById("runVideoCompress"),
  runBusinessProposal: document.getElementById("runBusinessProposal"),
  runResearchScan: document.getElementById("runResearchScan"),
  runWriterDraft: document.getElementById("runWriterDraft"),
  gatewayStatus: document.getElementById("gatewayStatus"),
  healthOutput: document.getElementById("healthOutput"),
  sessionsOutput: document.getElementById("sessionsOutput"),
  statusOutput: document.getElementById("statusOutput"),
  activityLog: document.getElementById("activityLog"),
  webUiFrame: document.getElementById("webUiFrame"),
  quickActionOutput: document.getElementById("quickActionOutput"),
  videoInputPath: document.getElementById("videoInputPath"),
  videoOutputPath: document.getElementById("videoOutputPath"),
  businessProjectId: document.getElementById("businessProjectId"),
  businessTemplate: document.getElementById("businessTemplate"),
  businessBrief: document.getElementById("businessBrief"),
  researchTopic: document.getElementById("researchTopic"),
  researchMaxResults: document.getElementById("researchMaxResults"),
  writerTopic: document.getElementById("writerTopic"),
  writerTone: document.getElementById("writerTone"),
  writerMaxWords: document.getElementById("writerMaxWords"),
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

function getFieldValue(inputEl) {
  if (!inputEl) {
    return "";
  }
  return (inputEl.value ?? "").trim();
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

async function loadUiFrame(log = false) {
  const cfg = await window.smDesktop.getConfig();
  els.webUiFrame.src = cfg.gatewayUrlWithAuth || cfg.gatewayUrl;
  if (log) {
    logActivity(`Loaded UI frame: ${cfg.gatewayUrl}`);
  }
  return cfg;
}

async function runQuickAction(actionId, payload, label) {
  els.quickActionOutput.textContent = "Running quick action...";
  const response = await window.smDesktop.runQuickAction({
    actionId,
    payload,
  });
  const resultBody = response?.result ? response.result : response;
  els.quickActionOutput.textContent = pretty(resultBody);
  logActivity(response?.message ?? `${label} completed.`);
}

async function boot() {
  const cfg = await loadUiFrame(true);
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
  await loadUiFrame(false);
});

els.runSetup.addEventListener("click", async () => {
  const result = await window.smDesktop.runSetup();
  logActivity(result.message ?? "Setup action completed.");
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

els.refreshFrame.addEventListener("click", async () => {
  await loadUiFrame(false);
  els.webUiFrame.contentWindow?.location.reload();
  logActivity("Reloaded embedded local web UI.");
});

els.runVideoCompress.addEventListener("click", async () => {
  const inputPath = getFieldValue(els.videoInputPath);
  const outputPath = getFieldValue(els.videoOutputPath);
  await runQuickAction(
    "video_compress",
    {
      inputPath,
      outputPath,
    },
    "Video compress quick action",
  );
});

els.runBusinessProposal.addEventListener("click", async () => {
  const projectId = getFieldValue(els.businessProjectId);
  const template = getFieldValue(els.businessTemplate);
  const brief = getFieldValue(els.businessBrief);
  await runQuickAction(
    "business_proposal",
    {
      projectId,
      template,
      brief,
    },
    "Business proposal quick action",
  );
});

els.runResearchScan.addEventListener("click", async () => {
  const topic = getFieldValue(els.researchTopic);
  const maxResults = getFieldValue(els.researchMaxResults);
  await runQuickAction(
    "research_scan",
    {
      topic,
      maxResults,
    },
    "Research scan quick action",
  );
});

els.runWriterDraft.addEventListener("click", async () => {
  const topic = getFieldValue(els.writerTopic);
  const tone = getFieldValue(els.writerTone);
  const maxWords = getFieldValue(els.writerMaxWords);
  await runQuickAction(
    "writer_draft",
    {
      topic,
      tone,
      maxWords,
    },
    "Writer draft quick action",
  );
});

boot().catch((error) => {
  logActivity(`Bootstrap failure: ${String(error)}`);
});
