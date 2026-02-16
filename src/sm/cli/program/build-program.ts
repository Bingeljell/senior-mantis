import { Command } from "commander";
import { registerGatewayCli } from "../../../cli/gateway-cli.js";
import { runCommandWithRuntime } from "../../../cli/cli-utils.js";
import type { ProgramContext } from "../../../cli/program/context.js";
import { registerAgentCommands } from "../../../cli/program/register.agent.js";
import { registerOnboardCommand } from "../../../cli/program/register.onboard.js";
import { registerPreActionHooks } from "../../../cli/program/preaction.js";
import { registerSetupCommand } from "../../../cli/program/register.setup.js";
import { registerStatusHealthSessionsCommands } from "../../../cli/program/register.status-health-sessions.js";
import { createMessageCliHelpers } from "../../../cli/program/message/helpers.js";
import { registerMessageSendCommand } from "../../../cli/program/message/register.send.js";
import { dashboardCommand } from "../../../commands/dashboard.js";
import { doctorCommand } from "../../../commands/doctor.js";
import { defaultRuntime } from "../../../runtime.js";
import { formatDocsLink } from "../../../terminal/links.js";
import { theme } from "../../../terminal/theme.js";
import { VERSION } from "../../../version.js";

const SM_CHANNELS = ["whatsapp", "webchat"] as const;

function createSeniorMantisProgramContext(): ProgramContext {
  return {
    programVersion: VERSION,
    channelOptions: [...SM_CHANNELS],
    messageChannelOptions: SM_CHANNELS.join("|"),
    agentChannelOptions: ["last", ...SM_CHANNELS].join("|"),
  };
}

function configureSeniorMantisHelp(program: Command, ctx: ProgramContext): void {
  const example = (command: string, desc: string) => {
    return `  ${theme.command(command)}\n    ${theme.muted(desc)}`;
  };

  program
    .name("seniormantis")
    .description("Senior Mantis: personal AI assistant with desktop + WhatsApp workflows.")
    .version(ctx.programVersion)
    .option(
      "--profile <name>",
      "Use a named profile (isolates OPENCLAW_STATE_DIR/OPENCLAW_CONFIG_PATH under ~/.openclaw-<name>)",
    );

  program.configureHelp({
    sortSubcommands: true,
    sortOptions: true,
  });

  program.configureOutput({
    outputError: (str, write) => write(theme.error(str)),
  });

  const docsLink = formatDocsLink("/start/getting-started", "docs.openclaw.ai/start/getting-started");
  program.addHelpText("afterAll", () => {
    return `
${theme.heading("Quick Start:")}
${example("seniormantis onboard --install-daemon", "Run guided setup with simple prompts.")}
${example("seniormantis gateway status", "Check local gateway health.")}
${example("seniormantis dashboard", "Open desktop/browser control UI.")}
${example(
  'seniormantis agent --message "Summarize my inbox" --deliver',
  "Run one agent turn and deliver output.",
)}

${theme.muted("Docs:")} ${docsLink}
`;
  });
}

function registerSeniorMantisMaintenanceCommands(program: Command): void {
  program
    .command("doctor")
    .description("Health checks + quick fixes for Senior Mantis")
    .option("--no-workspace-suggestions", "Disable workspace memory system suggestions", false)
    .option("--yes", "Accept defaults without prompting", false)
    .option("--repair", "Apply recommended repairs without prompting", false)
    .option("--fix", "Apply recommended repairs (alias for --repair)", false)
    .option("--force", "Apply aggressive repairs (overwrites custom service config)", false)
    .option("--non-interactive", "Run without prompts (safe migrations only)", false)
    .option("--generate-gateway-token", "Generate and configure a gateway token", false)
    .option("--deep", "Scan system services for extra gateway installs", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await doctorCommand(defaultRuntime, {
          workspaceSuggestions: opts.workspaceSuggestions,
          yes: Boolean(opts.yes),
          repair: Boolean(opts.repair) || Boolean(opts.fix),
          force: Boolean(opts.force),
          nonInteractive: Boolean(opts.nonInteractive),
          generateGatewayToken: Boolean(opts.generateGatewayToken),
          deep: Boolean(opts.deep),
        });
      });
    });

  program
    .command("dashboard")
    .description("Open the local Senior Mantis Control UI")
    .option("--no-open", "Print URL but do not launch a browser", false)
    .action(async (opts) => {
      await runCommandWithRuntime(defaultRuntime, async () => {
        await dashboardCommand(defaultRuntime, {
          noOpen: Boolean(opts.noOpen),
        });
      });
    });
}

function registerSeniorMantisMessageCommands(program: Command, ctx: ProgramContext): void {
  const message = program.command("message").description("Send messages");
  const helpers = createMessageCliHelpers(message, ctx.messageChannelOptions);
  registerMessageSendCommand(message, helpers);
  message.action(() => {
    message.help({ error: true });
  });
}

export function buildSeniorMantisProgram(): Command {
  const program = new Command();
  const ctx = createSeniorMantisProgramContext();

  configureSeniorMantisHelp(program, ctx);
  registerPreActionHooks(program, ctx.programVersion);

  registerSetupCommand(program);
  registerOnboardCommand(program);
  registerSeniorMantisMaintenanceCommands(program);
  registerSeniorMantisMessageCommands(program, ctx);
  registerAgentCommands(program, { agentChannelOptions: ctx.agentChannelOptions });
  registerStatusHealthSessionsCommands(program);
  registerGatewayCli(program);

  return program;
}
