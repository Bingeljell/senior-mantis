import { SENIOR_MANTIS_CLI_NAME } from "./env.js";

export const SENIOR_MANTIS_ALLOWED_GATEWAY_CHANNELS = ["whatsapp", "webchat"] as const;
export const SENIOR_MANTIS_ALLOWED_DELIVERABLE_CHANNELS = ["whatsapp"] as const;

export function isSeniorMantisCli(env: NodeJS.ProcessEnv = process.env): boolean {
  const cliName = env.OPENCLAW_CLI_NAME_OVERRIDE?.trim().toLowerCase();
  return cliName === SENIOR_MANTIS_CLI_NAME;
}

export function isSeniorMantisAllowedGatewayChannel(raw: string): boolean {
  return (SENIOR_MANTIS_ALLOWED_GATEWAY_CHANNELS as readonly string[]).includes(raw);
}

export function isSeniorMantisAllowedDeliverableChannel(raw: string): boolean {
  return (SENIOR_MANTIS_ALLOWED_DELIVERABLE_CHANNELS as readonly string[]).includes(raw);
}

export function assertSeniorMantisAllowedGatewayChannel(raw: string, optionName: string): void {
  if (!isSeniorMantisCli()) {
    return;
  }
  if (isSeniorMantisAllowedGatewayChannel(raw)) {
    return;
  }
  throw new Error(
    `Senior Mantis supports ${SENIOR_MANTIS_ALLOWED_GATEWAY_CHANNELS.join(", ")} channels only. ` +
      `Received ${optionName}=${raw}.`,
  );
}

export function assertSeniorMantisAllowedDeliverableChannel(
  raw: string,
  optionName: string,
): void {
  if (!isSeniorMantisCli()) {
    return;
  }
  if (isSeniorMantisAllowedDeliverableChannel(raw)) {
    return;
  }
  throw new Error(
    `Senior Mantis supports ${SENIOR_MANTIS_ALLOWED_DELIVERABLE_CHANNELS.join(", ")} deliverable channel only. ` +
      `Received ${optionName}=${raw}.`,
  );
}
