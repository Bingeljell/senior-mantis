# Keep/Drop Matrix

Legend (HolyOps pivot):

- Keep: needed for HolyOps v1 runtime
- Defer: keep temporarily, remove after parity
- Drop: remove from HolyOps runtime/new repo

| Area                                   | Path                                                                                                            | Decision                    | Rationale                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Senior Mantis entry                    | `src/entry-seniormantis.ts`                                                                                     | Keep                        | Product bootstrap                                                                                                                                                                  |
| Senior Mantis CLI                      | `src/sm/**`                                                                                                     | Keep                        | Product-specific control surface                                                                                                                                                   |
| Core gateway                           | `src/gateway/**`                                                                                                | Keep                        | Core control plane                                                                                                                                                                 |
| Agent runtime                          | `src/agents/**`                                                                                                 | Keep                        | Tool orchestration and model execution                                                                                                                                             |
| Routing/sessions                       | `src/routing/**`, `src/sessions/**`                                                                             | Keep                        | Stable context + isolation                                                                                                                                                         |
| WhatsApp channel                       | `src/web/auto-reply/**`, `src/whatsapp/**`                                                                      | Keep                        | v1 channel requirement                                                                                                                                                             |
| Internal webchat                       | `src/web/**`, relevant `src/gateway/**` webchat methods                                                         | Keep                        | desktop/browser UX                                                                                                                                                                 |
| Desktop Electron shell                 | `apps/desktop-electron/**`                                                                                      | Keep                        | desktop-first local control surface for v1                                                                                                                                         |
| Senior Mantis vision docs              | `docs/sm/VISION.md`, Senior Mantis section in `README.md`, desktop runbook in `apps/desktop-electron/README.md` | Keep                        | keeps product direction + local testing flow explicit for solo fork development                                                                                                    |
| UI package                             | `ui/**`                                                                                                         | Keep                        | Control UI and chat surfaces                                                                                                                                                       |
| Core config/infra                      | `src/config/**`, `src/infra/**`                                                                                 | Keep                        | runtime plumbing                                                                                                                                                                   |
| Brand naming surfaces                  | user-facing CLI/help/onboarding/status copy                                                                     | Keep (HolyOps rename first) | establish HolyOps identity while keeping compatibility aliases during staged migration                                                                                             |
| HolyOps CLI alias                      | `holyops.mjs`, `package.json` bin map                                                                           | Keep                        | makes HolyOps the primary user-facing command while preserving `seniormantis` compatibility                                                                                        |
| Internal `openclaw` identifiers        | package names, internal script ids, env key prefixes                                                            | Defer                       | migrate after v1 parity to avoid high-risk cross-cutting breaks                                                                                                                    |
| Multi-channel CLI                      | `src/cli/channels-cli.ts` and non-v1 sub-CLIs                                                                   | Defer                       | remove after Senior Mantis onboarding is stable                                                                                                                                    |
| Senior Mantis gateway command surface  | `src/sm/cli/program/register-gateway.ts`                                                                        | Keep (minimal)              | keep only `gateway run` + `gateway status` in SM runner; exclude non-v1 gateway subcommands                                                                                        |
| HolyOps workflow command surface       | `src/sm/cli/program/register-workflow.ts` + registration in `src/sm/cli/program/build-program.ts`               | Drop (removed)              | removed in 2026-02-21 staged cleanup to keep the current v1 command surface minimal and reduce non-essential maintenance                                                           |
| HolyOps adapter/tool stack             | `src/sm/adapters/*`, `src/agents/tools/holyops-*.ts`                                                            | Drop (removed)              | removed in 2026-02-21 staged cleanup; planned to reintroduce only after core prototype stabilizes                                                                                  |
| Onboarding channel chooser             | `src/commands/onboard-channels.ts`, `src/wizard/onboarding.ts`                                                  | Keep                        | Senior Mantis runtime now filters onboarding to WhatsApp-only, disables plugin-catalog install paths, and sanitizes onboarding defaults/overrides to prevent non-v1 channel bypass |
| Plugin channels                        | `extensions/**`                                                                                                 | Drop                        | not needed in v1 (staged: non-v1 channel plugins runtime-disabled in Senior Mantis guardrails)                                                                                     |
| Mobile apps                            | `apps/ios/**`, `apps/android/**`                                                                                | Drop                        | out of scope v1                                                                                                                                                                    |
| macOS native app                       | `apps/macos/**`                                                                                                 | Drop                        | replaced by Electron                                                                                                                                                               |
| Channel implementations (non-WhatsApp) | `src/telegram/**`, `src/discord/**`, `src/slack/**`, `src/signal/**`, `src/imessage/**`, etc                    | Drop                        | reduce surface area and maintenance (runtime-disabled in Senior Mantis guardrails first)                                                                                           |
| Complex plugin management              | `src/plugins/**`                                                                                                | Defer                       | likely removable after message/gateway flows are re-wired                                                                                                                          |
| Non-v1 docs                            | `docs/channels/**` (except WhatsApp references)                                                                 | Drop                        | product docs should be Senior Mantis specific                                                                                                                                      |
| Packaging scripts (mobile/mac native)  | related scripts under `scripts/`                                                                                | Drop                        | not needed for Electron path                                                                                                                                                       |
| Desktop run scripts                    | root `package.json` (`desktop:dev`, `desktop:start`)                                                            | Keep                        | local developer entrypoint for desktop MVP                                                                                                                                         |
| Fly deployment docs/artifacts          | `docs/install/fly.md`, `fly.toml`, `fly.private.toml`                                                           | Drop                        | out of scope for desktop-first local v1 (removed)                                                                                                                                  |

## Staged runtime prune log (no deletions)

- 2026-02-17: `src/gateway/server-http.ts`
  - rationale: skip Slack HTTP route handling in Senior Mantis mode to keep active runtime channel wiring aligned to v1 scope.
- 2026-02-17: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/renderer/renderer.js`
  - rationale: enforce Senior Mantis config/state paths in desktop launcher and inject config token into dashboard URL to avoid legacy OpenClaw auth drift (`1008 unauthorized`) during local v1 flows.
- 2026-02-17: `src/channels/plugins/index.ts`
  - rationale: filter runtime channel plugin listing to Senior Mantis v1 channel set (`whatsapp`, `webchat`) so gateway channel/status/logout surfaces cannot expose non-v1 channel plugins.
- 2026-02-17: `src/config/schema.ts`
  - rationale: filter Senior Mantis config schema channel metadata to v1 channels so Control UI hint/help payloads do not advertise non-v1 channel targets.
- 2026-02-17: `src/config/validation.ts`
  - rationale: reject non-v1 channel keys/heartbeat targets during plugin-aware config validation in Senior Mantis mode to keep config writes aligned with v1 runtime scope.
- 2026-02-17: `src/sm/cli/program/build-program.ts`, `src/sm/cli/program/register-status-health-sessions.ts`
  - rationale: avoid SM-only CLI help output directing users to OpenClaw docs; point to local `docs/sm/*` during forked v1 development.
- 2026-02-19: `src/agents/openclaw-tools.ts`, `src/agents/tools/holyops-video-tool.ts`, `src/agents/tools/holyops-business-tool.ts`
  - rationale: add HolyOps-only workflow tools for personal creator ops while keeping default OpenClaw tool surface unchanged outside HolyOps mode.
- 2026-02-19: `src/sm/adapters/*`
  - rationale: introduce simple JSON adapter contract (video/business) for CLI-first personal workflow integrations without broad framework abstraction.
- 2026-02-19: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/preload.cjs`, `apps/desktop-electron/renderer/*`
  - rationale: add desktop quick-actions for HolyOps-first workflows (video/business) via direct workflow command paths while preserving explicit side-effect confirmation and local-first defaults.
- 2026-02-19: `src/sm/adapters/video-cli-adapter.ts`, `src/sm/adapters/business-cli-adapter.ts`, `src/sm/adapters/registry.test.ts`
  - rationale: harden adapter contract for v1 reliability (required action params, richer artifacts, transient-failure retry hints).
- 2026-02-19: `src/sm/cli/program/register-workflow.ts`, `src/sm/cli/program/register-workflow.test.ts`
  - rationale: add deterministic non-LLM workflow command for local adapter execution and desktop quick-action reliability.
- 2026-02-19: `src/sm/brand.ts`, `src/commands/dashboard.ts`, `src/commands/doctor.ts`, `src/commands/onboard.ts`, `src/commands/status.command.ts`
  - rationale: increase HolyOps identity visibility by switching high-frequency runtime output copy to HolyOps wording in HolyOps mode.
- 2026-02-19: `src/sm/adapters/research-cli-adapter.ts`, `src/sm/adapters/writer-cli-adapter.ts`, `src/agents/tools/holyops-research-tool.ts`, `src/agents/tools/holyops-writer-tool.ts`
  - rationale: add research/writer workflow adapters on the same deterministic contract as video/business for personal creator operations.
- 2026-02-19: `src/agents/openclaw-tools.ts`
  - rationale: prune extension/plugin tool surface in HolyOps mode by skipping plugin tool resolution while preserving OpenClaw-mode behavior.
- 2026-02-19: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/renderer/index.html`, `apps/desktop-electron/renderer/renderer.js`
  - rationale: expand desktop quick actions to research/writer workflows so visible product capability shifts beyond legacy OpenClaw defaults.
- 2026-02-19: `src/gateway/control-ui.ts`, `ui/src/ui/brand.ts`, `ui/src/ui/app-render.ts`, `ui/src/ui/views/overview.ts`, `ui/src/ui/views/debug.ts`
  - rationale: route Control UI command hints and topbar branding through active HolyOps/OpenClaw mode so web auth guidance no longer hardcodes `openclaw` in HolyOps flows.
- 2026-02-19: `src/wizard/onboarding.finalize.ts`
  - rationale: ensure onboarding completion/token guidance uses active product brand and points HolyOps mode to local `docs/sm/HANDOFF.md` for next steps.
- 2026-02-19: `src/sm/brand.ts`, `src/wizard/onboarding.ts`, `src/wizard/onboarding.finalize.ts`, `src/commands/onboard.ts`
  - rationale: centralize HolyOps/OpenClaw docs-link routing for onboarding/security/help output and remove hardcoded `docs.openclaw.ai` references from HolyOps-mode active onboarding flows.
- 2026-02-19: `ui/src/ui/brand.ts`, `ui/src/ui/views/overview.ts`, `ui/src/ui/app-render.ts`
  - rationale: show local `docs/sm/*` guidance in HolyOps mode for Control UI auth/help/resources surfaces while preserving OpenClaw docs links in OpenClaw mode.
- 2026-02-19: `ui/src/ui/views/channels.ts`, `ui/src/ui/views/channels.node.test.ts`
  - rationale: prune HolyOps-mode Control UI channel health surface to v1 channels (`whatsapp`, `webchat`) while retaining full channel visibility outside HolyOps mode.
- 2026-02-19: `src/commands/onboard-non-interactive/local.ts`, `src/commands/onboard-non-interactive/remote.ts`, `src/commands/onboard-skills.ts`, `src/sm/brand.ts`
  - rationale: remove remaining hardcoded onboarding docs links to `docs.openclaw.ai` in HolyOps-mode active onboarding paths and route all docs pointers through centralized brand-aware docs mapping.
- 2026-02-19: `apps/desktop-electron/README.md`
  - rationale: document exact local-first desktop recovery for token/auth disconnect (`1008 unauthorized`) and expected state progression during v1 testing.
- 2026-02-19: `ui/src/ui/views/config.ts`, `ui/src/ui/views/config.browser.test.ts`
  - rationale: constrain HolyOps-mode Config > Channels surfaces to v1 channels (`whatsapp`, `webchat`) even when upstream schema includes broader channel keys.
- 2026-02-19: `ui/src/ui/views/usage.ts`, `ui/src/ui/app-scroll.ts`, `ui/src/ui/brand.ts`, `ui/src/ui/brand.node.test.ts`
  - rationale: reduce high-visibility OpenClaw naming drift by using mode-aware export filename prefixes (`holyops-*` in HolyOps mode).
- 2026-02-19: `scripts/smoke-desktop-local.sh`, `apps/desktop-electron/README.md`
  - rationale: add deterministic non-GUI preflight checks for local desktop testing before launching Electron.
- 2026-02-19: `ui/src/ui/views/config.node.test.ts`, `ui/package.json`
  - rationale: ensure HolyOps Config > Channels v1 filter behavior is covered by node-safe UI tests without requiring Playwright/browser-mode execution.
- 2026-02-19: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/preload.cjs`, `apps/desktop-electron/renderer/index.html`, `apps/desktop-electron/renderer/renderer.js`
  - rationale: add in-app desktop diagnostics action that runs local smoke checks and surfaces output directly in desktop shell.
- 2026-02-19: `scripts/smoke-desktop-local.sh`
  - rationale: enforce read-only default for smoke checks (no implicit setup side effects) and require explicit `--with-setup` opt-in when setup bootstrap is desired.
- 2026-02-19: `ui/src/ui/navigation.ts`, `ui/src/ui/views/overview.ts`
  - rationale: reduce high-visibility OpenClaw naming in HolyOps mode and align visible runtime labels/placeholders to neutral or HolyOps-aware wording.
- 2026-02-21: `apps/desktop-electron/renderer/index.html`, `apps/desktop-electron/renderer/renderer.js`, `apps/desktop-electron/renderer/styles.css`
  - rationale: remove embedded Control UI iframe path and run browser-only dashboard mode to avoid frame-policy breakages (`X-Frame-Options`/CSP frame-ancestors).
- 2026-02-21: `apps/desktop-electron/preload.cjs`, `apps/desktop-electron/main.mjs`
  - rationale: remove desktop quick-action execution surface (`sm:run-quick-action`) during staged v1 prune.
- 2026-02-21: `src/sm/cli/program/build-program.ts`, `src/sm/cli/program/build-program.test.ts`
  - rationale: de-register `workflow` from HolyOps v1 CLI command surface until cleanup/migration pass is complete.
- 2026-02-21: `apps/desktop-electron/README.md`
  - rationale: align desktop docs with browser-only dashboard path and removed quick-action surface.
- 2026-02-21: `src/sm/env.ts`, `src/sm/env.test.ts`, `apps/desktop-electron/main.mjs`, `scripts/smoke-desktop-local.sh`, `src/wizard/onboarding.finalize.ts`
  - rationale: move HolyOps default state/config path to `~/.holyops/holyops.json` while preserving compatibility reads from legacy `~/.seniormantis/seniormantis.json`.
- 2026-02-21: `src/agents/workspace.ts`, `src/agents/workspace.e2e.test.ts`, `src/agents/workspace.defaults.e2e.test.ts`
  - rationale: move HolyOps-mode default workspace root to `~/.holyops/workspace` while preserving legacy workspace-state marker read compatibility.
- 2026-02-21: `src/agents/openclaw-tools.ts`
  - rationale: remove HolyOps workflow adapter-tool injection from active runtime path to reduce v1 surface area.
- 2026-02-21: `src/channels/plugins/catalog.ts`, `src/channels/plugins/catalog.test.ts`
  - rationale: return empty channel-plugin catalog in HolyOps mode to remove extension onboarding/install surface from v1 path.
- 2026-02-21: `src/channels/registry.ts`, `src/channels/registry.test.ts`
  - rationale: enforce HolyOps channel policy at core channel registry normalization/list boundaries for defense in depth.
- 2026-02-21: `src/plugins/loader.ts`, `src/plugins/loader.test.ts`
  - rationale: block non-channel plugins in HolyOps mode so plugin runtime stays focused on v1 channel scope.
- 2026-02-21: `scripts/smoke-desktop-local.sh`
  - rationale: avoid launching Electron during smoke checks (`electron --version`) and validate dependency wiring via `pnpm list electron` instead.
- 2026-02-21: `ui/src/ui/brand.ts`, `ui/src/ui/brand.node.test.ts`
  - rationale: set HolyOps as default fallback command/config identity in Control UI helper layer so disconnected/auth hints do not regress to OpenClaw copy when runtime injection is absent.
- 2026-02-21: `src/commands/onboard-helpers.ts`, `src/commands/onboard-helpers.e2e.test.ts`
  - rationale: remove hardcoded OpenClaw wizard header branding and make onboarding header mode-aware for HolyOps visibility.
- 2026-02-21: `src/cli/program/register.setup.ts`
  - rationale: make setup command help text mode-aware so HolyOps CLI output defaults to `~/.holyops/holyops.json` and `~/.holyops/workspace`.
- 2026-02-21: `src/commands/setup.ts`, `src/commands/setup.e2e.test.ts`, `src/agents/workspace.ts`, `src/agents/workspace.defaults.e2e.test.ts`
  - rationale: migrate legacy default workspace config (`~/.openclaw/workspace`) to HolyOps default (`~/.holyops/workspace`) during setup in HolyOps mode while preserving explicit `--workspace` overrides.

## Deletion log (completed)

- 2026-02-16: removed `docs/install/fly.md`
  - rationale: Fly deployment docs are out of v1 desktop-first local scope.
- 2026-02-16: removed `fly.toml`
  - rationale: cloud deployment artifact not needed for local-first v1 runtime.
- 2026-02-16: removed `fly.private.toml`
  - rationale: cloud deployment artifact not needed for local-first v1 runtime.
- 2026-02-21: removed `src/sm/cli/program/register-workflow.ts`
  - rationale: de-scoped workflow command from current v1 CLI cleanup phase.
- 2026-02-21: removed `src/sm/cli/program/register-workflow.test.ts`
  - rationale: command test removed with workflow command deletion.
- 2026-02-21: removed `src/sm/adapters/types.ts`, `src/sm/adapters/runner.ts`, `src/sm/adapters/registry.ts`, `src/sm/adapters/helpers.ts`
  - rationale: remove dormant adapter framework and helper code no longer wired to v1 runtime.
- 2026-02-21: removed `src/sm/adapters/video-cli-adapter.ts`, `src/sm/adapters/business-cli-adapter.ts`, `src/sm/adapters/research-cli-adapter.ts`, `src/sm/adapters/writer-cli-adapter.ts`
  - rationale: remove adapter implementations until post-cleanup integration phase.
- 2026-02-21: removed `src/sm/adapters/registry.test.ts`
  - rationale: adapter tests removed with adapter runtime deletion.
- 2026-02-21: removed `src/agents/tools/holyops-video-tool.ts`, `src/agents/tools/holyops-business-tool.ts`, `src/agents/tools/holyops-research-tool.ts`, `src/agents/tools/holyops-writer-tool.ts`
  - rationale: remove non-v1 HolyOps tool surface from active agent runtime.
- 2026-02-21: removed `src/agents/openclaw-tools.holyops.test.ts`
  - rationale: HolyOps tool registration test removed with tool surface deletion.
