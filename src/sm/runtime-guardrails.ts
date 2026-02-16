import { setConfigOverride } from "../config/runtime-overrides.js";

export const SENIOR_MANTIS_ALLOWED_CHANNELS = ["whatsapp", "webchat"] as const;

export const SENIOR_MANTIS_DISABLED_CHANNELS = [
  "telegram",
  "discord",
  "irc",
  "googlechat",
  "slack",
  "signal",
  "imessage",
  "msteams",
] as const;

export const SENIOR_MANTIS_DISABLED_CHANNEL_PLUGIN_IDS = [
  "bluebubbles",
  "discord",
  "feishu",
  "googlechat",
  "imessage",
  "irc",
  "line",
  "matrix",
  "mattermost",
  "msteams",
  "nextcloud-talk",
  "nostr",
  "signal",
  "slack",
  "telegram",
  "tlon",
  "twitch",
  "voice-call",
  "zalo",
  "zalouser",
] as const;

function setRequiredOverride(path: string, value: unknown): void {
  const result = setConfigOverride(path, value);
  if (!result.ok) {
    throw new Error(
      `[seniormantis] Failed to apply runtime guardrail override for "${path}": ${result.error ?? "unknown error"}`,
    );
  }
}

export function applySeniorMantisRuntimeGuardrails(): void {
  // Keep the gateway local-first for desktop + local Control UI flows.
  setRequiredOverride("gateway.mode", "local");
  setRequiredOverride("gateway.bind", "loopback");
  setRequiredOverride("gateway.controlUi.enabled", true);

  // Require explicit confirmation for side-effect-capable exec actions.
  setRequiredOverride("tools.exec.ask", "always");

  // v1 requires WhatsApp and local web surfaces.
  setRequiredOverride("web.enabled", true);
  setRequiredOverride("channels.whatsapp.enabled", true);
  setRequiredOverride("plugins.entries.whatsapp.enabled", true);

  // Stage-wise bloat reduction: disable non-v1 channels at runtime first.
  for (const channel of SENIOR_MANTIS_DISABLED_CHANNELS) {
    setRequiredOverride(`channels.${channel}.enabled`, false);
  }
  for (const pluginId of SENIOR_MANTIS_DISABLED_CHANNEL_PLUGIN_IDS) {
    setRequiredOverride(`plugins.entries.${pluginId}.enabled`, false);
  }
}
