import type { Command } from "commander";
import { runCommandWithRuntime } from "../../../cli/cli-utils.js";
import { addGatewayRunCommand } from "../../../cli/gateway-cli/run.js";
import { parsePositiveIntOrUndefined } from "../../../cli/program/helpers.js";
import { gatewayStatusCommand } from "../../../commands/gateway-status.js";
import { defaultRuntime } from "../../../runtime.js";

function parseTimeoutOrExit(timeout: unknown): number | undefined {
  const parsed = parsePositiveIntOrUndefined(timeout);
  if (timeout !== undefined && parsed === undefined) {
    defaultRuntime.error("--timeout must be a positive integer (milliseconds)");
    defaultRuntime.exit(1);
    return undefined;
  }
  return parsed;
}

export function registerSeniorMantisGatewayCommands(program: Command): void {
  const gateway = program
    .command("gateway")
    .description("Run and inspect local Senior Mantis gateway");

  addGatewayRunCommand(gateway.command("run").description("Run local gateway (foreground)"));

  gateway
    .command("status")
    .description("Show local gateway reachability")
    .option("--json", "Output JSON", false)
    .option("--timeout <ms>", "Probe timeout in milliseconds", "3000")
    .action(async (opts) => {
      const timeout = parseTimeoutOrExit(opts.timeout);
      if (timeout === undefined && opts.timeout !== undefined) {
        return;
      }
      await runCommandWithRuntime(defaultRuntime, async () => {
        await gatewayStatusCommand(
          {
            json: Boolean(opts.json),
            timeout,
          },
          defaultRuntime,
        );
      });
    });

  gateway.action(() => {
    gateway.help({ error: true });
  });
}
