# Senior Mantis Handoff

Status: active implementation baseline
Owner: Senior Mantis product fork
Last updated: 2026-02-21

Primary vision doc: `docs/sm/VISION.md`

## Phase 2 cleanup update (2026-02-21)

- Desktop now runs in browser-dashboard mode only (no embedded iframe panel in Electron UI).
- Desktop quick-action surface was removed from UI + IPC + runtime handler.
- HolyOps v1 CLI surface no longer registers `workflow`.
- HolyOps mode default workspace path now resolves to `~/.holyops/workspace` (legacy workspace-state marker is still read for compatibility).
- Updated desktop runbook docs to match this reduced v1 surface.

Files changed in this cleanup pass:

- `apps/desktop-electron/renderer/index.html`
- `apps/desktop-electron/renderer/renderer.js`
- `apps/desktop-electron/renderer/styles.css`
- `apps/desktop-electron/preload.cjs`
- `apps/desktop-electron/main.mjs`
- `src/sm/cli/program/build-program.ts`
- `src/sm/cli/program/build-program.test.ts`
- `apps/desktop-electron/README.md`

Rationale:

- keep v1 stable/local-first while pruning non-essential feature surfaces
- avoid frame-policy breakage from gateway anti-framing headers
- reduce launch/test complexity before deeper HolyOps rename + path migration

## Goal

Ship a senior-friendly assistant app based on OpenClaw with a narrow v1:

- desktop app
- WhatsApp
- local web control UI
- guided onboarding
- safe/manual task workflows

## HolyOps pivot (2026-02-19)

Direction is now personal-first `HolyOps` (creator workflow cockpit) while preserving safe staged cleanup.

- Primary UX command is now `holyops`; `seniormantis` remains as a compatibility alias.
- Runtime/state defaults now target `~/.holyops` with legacy fallback to `~/.seniormantis/seniormantis.json` when present.
- Surface focus remains:
  - desktop-first local control flow
  - WhatsApp interaction path
  - local web UI
- First specialist workflow adapters shipped:
  - `video-agent` adapter/tool
  - `business-agent` adapter/tool
  - `research-agent` adapter/tool
  - `writer-agent` adapter/tool
- Desktop quick-actions shipped for first adapters (later removed from desktop shell in 2026-02-21 cleanup pass):
  - `Run Video Compress` (routes through direct `workflow` command to `video-agent`)
  - `Run Business Proposal` (routes through direct `workflow` command to `business-agent`)
  - `Run Research Scan` (routes through direct `workflow` command to `research-agent`)
  - `Run Writer Draft` (routes through direct `workflow` command to `writer-agent`)
- Direct non-LLM workflow command shipped (later de-registered from HolyOps v1 CLI surface in 2026-02-21 cleanup pass):
  - `holyops workflow --adapter ... --action ... --arg key=value --confirm --json`
  - file: `src/sm/cli/program/register-workflow.ts`
- Adapter hardening shipped:
  - per-action validation for video workflows (`outputPath`, clip timing, music path)
  - business artifact enrichment (`proposal_id`, URL extraction)
  - retryability heuristics for transient adapter failures
- HolyOps branding visibility pass shipped:
  - user-facing runtime output now switches to HolyOps wording in HolyOps mode (`dashboard`, `doctor`, `onboard`, `status`)
  - helper: `src/sm/brand.ts`
- Plugin/extension tool surface pruned in HolyOps mode:
  - `src/agents/openclaw-tools.ts` now skips `resolvePluginTools(...)` when HolyOps mode is active
  - keeps OpenClaw-mode plugin behavior unchanged outside HolyOps mode
- Control UI brand/command seam shipped for HolyOps mode:
  - gateway HTML injection now provides CLI command + product brand (`src/gateway/control-ui.ts`)
  - web UI now renders HolyOps-aware command hints and topbar brand (`ui/src/ui/brand.ts`, `ui/src/ui/views/overview.ts`, `ui/src/ui/views/debug.ts`, `ui/src/ui/app-render.ts`)
  - regression test: `src/gateway/control-ui.test.ts`
- Onboarding finalization copy now follows active brand:
  - HolyOps mode now shows HolyOps control wording and local "What now" guidance (`docs/sm/HANDOFF.md`) in final onboarding notes/outro.
  - files: `src/wizard/onboarding.finalize.ts`, `src/wizard/onboarding.test.ts`
- Active-flow docs-link routing now uses centralized HolyOps/OpenClaw docs mapping:
  - `src/sm/brand.ts` (`resolveBrandDocsLinks`) controls onboarding/docs pointers per mode.
  - `src/wizard/onboarding.ts`, `src/wizard/onboarding.finalize.ts`, and `src/commands/onboard.ts` use mode-aware docs links.
  - `ui/src/ui/brand.ts` (`resolveUiDocsLinks`) controls Control UI docs labels/links in HolyOps mode.
  - HolyOps mode now avoids `docs.openclaw.ai` links in key Control UI auth/help hints (`ui/src/ui/views/overview.ts`, `ui/src/ui/app-render.ts`).
- Continued docs-link migration in onboarding and skills flows:
  - `src/commands/onboard-non-interactive/local.ts` and `src/commands/onboard-non-interactive/remote.ts` now route web tools docs hints through `resolveBrandDocsLinks().toolsWeb`.
  - `src/commands/onboard-skills.ts` now routes skill docs hints through `resolveBrandDocsLinks().skills`.
  - `src/sm/brand.ts` now includes a `skills` docs-link key.
- Continued v1 channel-surface prune in Control UI:
  - HolyOps mode channel health view now filters displayed channel cards/order to `whatsapp` + `webchat`.
  - files: `ui/src/ui/views/channels.ts`, `ui/src/ui/views/channels.node.test.ts`.
- Desktop local test runbook tightening:
  - `apps/desktop-electron/README.md` now includes explicit token/unauthorized recovery and expected state checklist.
- Control UI config hardening for v1 scope:
  - `ui/src/ui/views/config.ts` now filters HolyOps-mode channel subsections/schema to `whatsapp` + `webchat`.
  - `ui/src/ui/views/config.browser.test.ts` verifies HolyOps mode hides non-v1 channel entries in Config > Channels.
- High-visibility export naming cleanup:
  - `ui/src/ui/views/usage.ts` and `ui/src/ui/app-scroll.ts` now use product-aware file prefixes in HolyOps mode (`holyops-*`).
  - resolver: `ui/src/ui/brand.ts` (`resolveProductSlugForUi`), covered by `ui/src/ui/brand.node.test.ts`.
- Local desktop preflight smoke script added:
  - `scripts/smoke-desktop-local.sh`
  - checks Node/pnpm/Electron dependency wiring, HolyOps CLI command surface, setup bootstrap (if needed), and status JSON probe.
  - documented in `apps/desktop-electron/README.md`.
- Added node-safe Control UI regression path for Config view:
  - new `ui/src/ui/views/config.node.test.ts` (`happy-dom`) covers HolyOps Config > Channels v1 filtering.
  - `ui/package.json` adds `test:node` script to run node-safe UI tests without Playwright browser mode.
- Added desktop diagnostics action in app shell:
  - IPC: `sm:run-diagnostics` in `apps/desktop-electron/main.mjs`
  - preload bridge: `apps/desktop-electron/preload.cjs`
  - renderer UI wiring: `apps/desktop-electron/renderer/index.html`, `apps/desktop-electron/renderer/renderer.js`
  - diagnostics runs `scripts/smoke-desktop-local.sh` and renders command output inline.
- Updated smoke script safety default:
  - `scripts/smoke-desktop-local.sh` now defaults to read-only behavior and exits with actionable setup instruction if config is missing.
  - setup bootstrap is now opt-in via `--with-setup`.
- Continued high-visibility naming cleanup:
  - `ui/src/ui/navigation.ts` config subtitle no longer references `~/.openclaw/openclaw.json`.
  - `ui/src/ui/views/overview.ts` token field placeholder now uses generic copy.
- Migration tracking doc:
  - `docs/sm/HOLYOPS_MIGRATION_NOTES.md`
- HolyOps workflow adapter implementation:
  - adapter contract + registry: `src/sm/adapters/types.ts`, `src/sm/adapters/registry.ts`
  - command runner: `src/sm/adapters/runner.ts`
  - video adapter: `src/sm/adapters/video-cli-adapter.ts`
  - business adapter: `src/sm/adapters/business-cli-adapter.ts`
  - research adapter: `src/sm/adapters/research-cli-adapter.ts`
  - writer adapter: `src/sm/adapters/writer-cli-adapter.ts`
  - agent tool wiring: `src/agents/tools/holyops-video-tool.ts`, `src/agents/tools/holyops-business-tool.ts`, `src/agents/tools/holyops-research-tool.ts`, `src/agents/tools/holyops-writer-tool.ts`, `src/agents/openclaw-tools.ts`

## Implemented in this baseline

- Added `seniormantis` binary entry and `holyops` primary alias (`package.json`, `seniormantis.mjs`, `holyops.mjs`).
- Added dedicated entrypoint `src/entry-seniormantis.ts`.
- Added Senior Mantis environment defaults in `src/sm/env.ts`:
  - state path defaults to `~/.holyops`
  - config path defaults to `~/.holyops/holyops.json`
  - compatibility reads legacy `~/.seniormantis/seniormantis.json` when no HolyOps config exists
  - CLI name override defaults to `holyops` (with `seniormantis` compatibility)
- Added reduced CLI program at `src/sm/cli/program/build-program.ts`.
- Added Senior Mantis-only gateway CLI registration at `src/sm/cli/program/register-gateway.ts`:
  - keeps `gateway run` + `gateway status`
  - excludes non-v1 gateway subcommands (`call`, `discover`, `probe`, `usage-cost`, service lifecycle installers/controls)
- Added dedicated runner at `src/sm/cli/run-main.ts`.
- Added Senior Mantis runtime guardrails in `src/sm/runtime-guardrails.ts`:
  - force `gateway.mode=local`
  - force `gateway.bind=loopback`
  - force local control UI enabled
  - force `tools.exec.ask=always` for explicit exec confirmations
  - keep WhatsApp web provider enabled
  - disable non-v1 channels at runtime (`telegram`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `msteams`)
  - disable non-v1 channel plugins in runtime plugin entries (`bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `tlon`, `twitch`, `voice-call`, `zalo`, `zalouser`)
- Added Senior Mantis channel policy guard at `src/sm/channel-policy.ts`:
  - gateway channel policy: `whatsapp|webchat` only
  - deliverable channel policy: `whatsapp` only
  - onboarding channel policy: `whatsapp` only
  - enforcement wired into agent/message runtime path
- Tightened Senior Mantis CLI message channel scope in `src/sm/cli/program/build-program.ts`:
  - `message send --channel` option now resolves to WhatsApp-only in v1 mode.
- Added Senior Mantis-specific `status`/`health`/`sessions` registration (`src/sm/cli/program/register-status-health-sessions.ts`) to avoid non-v1 channel phrasing in help text.
- Added minimal desktop shell at `apps/desktop-electron/*`:
  - local web UI embed (`http://127.0.0.1:18789` root by default, respects `gateway.controlUi.basePath`)
  - setup launch from desktop flow (opens terminal command)
  - onboarding launch from desktop flow (opens terminal command)
  - status/health/sessions snapshots via Senior Mantis CLI commands
  - explicit confirmations before side effects (start/stop gateway, onboarding launch)
  - CLI invocation mode selection:
    - prefer repo CLI when local dependencies and `dist/entry-seniormantis.*` are present
    - fallback to global `holyops` command when repo runtime modules are missing
    - return explicit startup errors if gateway command cannot be launched
- Hardened startup-cycle paths for bundled Senior Mantis CLI:
  - removed eager module-scope initialization that caused TDZ startup failures in bundled desktop CLI path
  - changed files:
    - `src/cron/store.ts`
    - `src/gateway/server-methods/agent-job.ts`
    - `src/gateway/server-methods/agents.ts`
    - `src/gateway/server.impl.ts`
    - `src/logging/subsystem.ts`
- Improved desktop gateway launch diagnostics:
  - `apps/desktop-electron/main.mjs` now detects early gateway process exit and reports actionable messages (including missing setup/config guidance) instead of reporting success immediately on spawn
- Added setup-aware desktop first-run hints:
  - renderer logs explicit guidance to run setup when status/health output indicates missing config.
- Fixed Electron repo CLI invocation mismatch in desktop shell:
  - under Electron, `process.execPath` points to Electron, not Node
  - desktop launcher now uses Node command resolution for repo mode (`SM_NODE_COMMAND` override supported)
  - launcher sanitizes `npm_config_prefix` to avoid zsh/nvm initialization warnings in setup/onboarding terminal launches
  - file: `apps/desktop-electron/main.mjs`
- Fixed desktop Control UI URL default:
  - `/ui` is not the universal default route; when `gateway.controlUi.basePath` is unset, Control UI serves from root (`/`)
  - desktop shell now resolves UI path from config (or `SM_GATEWAY_UI_PATH`) before loading iframe URL
  - file: `apps/desktop-electron/main.mjs`
- Fixed desktop auth/config drift with legacy OpenClaw installs:
  - desktop launcher now defaults CLI state/config env to HolyOps paths (`~/.holyops/holyops.json`) with legacy config fallback
  - embedded dashboard/open-in-browser URLs include `#token=...` when `gateway.auth.token` exists in HolyOps config (legacy-compatible, or via `SM_GATEWAY_TOKEN`)
  - dashboard URL/token are resolved dynamically after gateway start to pick up first-run auto-generated tokens without restarting desktop
  - token resolution also reads `OPENCLAW_GATEWAY_TOKEN` env for legacy local setups
  - dashboard URL uses trailing slash for non-root base paths to avoid auth fragment loss on redirect edge cases
  - file: `apps/desktop-electron/main.mjs`
- Fixed CLI auth-recovery command behavior:
  - `holyops dashboard --no-open` now honors `--no-open` correctly (`src/cli/program/register.maintenance.ts`)
  - `holyops doctor --generate-gateway-token` now persists generated token config even when not using `--fix` (`src/commands/doctor.ts`)
  - tests added:
    - `src/cli/program/register.maintenance.test.ts`
    - `src/commands/doctor.runs-legacy-state-migrations-yes-mode-without.e2e.test.ts` (token persistence case)
- Added HolyOps banner branding path:
  - `src/cli/banner.ts` switches banner identity/tagline based on active CLI name (`openclaw` vs `holyops`/`seniormantis`).
- Added runtime HTTP channel wiring prune for HolyOps mode:
  - `src/gateway/server-http.ts` skips Slack HTTP route handling when `OPENCLAW_CLI_NAME_OVERRIDE=holyops`.
- Added runtime channel-plugin listing prune for HolyOps mode:
  - `src/channels/plugins/index.ts` filters runtime channel list to `whatsapp|webchat` when `OPENCLAW_CLI_NAME_OVERRIDE=holyops` (defense in depth beyond loader/config guardrails).
  - gateway channel status/logout behavior now inherits this filter (non-v1 channels are not surfaced in `channels.status`; non-v1 logout attempts are rejected).
- Added config schema channel metadata prune for Senior Mantis mode:
  - `src/config/schema.ts` filters channel metadata to v1 channel policy before building merged schema/ui hints.
  - `config.schema` heartbeat target hint text now lists only v1 channels in Senior Mantis mode.
- Added config validation prune for Senior Mantis mode:
  - `src/config/validation.ts` now rejects non-v1 `channels.*` keys and non-v1 heartbeat targets in plugin-aware validation (`validateConfigObjectWithPlugins`).
  - protects config write/load validation path from non-v1 channel drift.
- Updated Senior Mantis CLI docs hints to local project docs:
  - `src/sm/cli/program/build-program.ts` and `src/sm/cli/program/register-status-health-sessions.ts` now reference `docs/sm/*` instead of `docs.openclaw.ai` in SM-specific help output.
- Locked onboarding channel selection to WhatsApp-only in Senior Mantis mode (`src/commands/onboard-channels.ts`, `src/wizard/onboarding.ts`).
- Hardened Senior Mantis onboarding allowlist enforcement in `src/commands/onboard-channels.ts`:
  - adapter status is fetched only for allowed onboarding channels
  - plugin catalog/install paths are disabled in Senior Mantis mode
  - `initialSelection` and `forceAllowFromChannels` are sanitized to the allowed set
  - disallowed or unavailable channels are explicitly rejected in channel choice handling
- Added loader-level channel prune in Senior Mantis mode:
  - `src/plugins/loader.ts` blocks disallowed channel plugins before plugin module load/registration
  - `src/plugins/loader.test.ts` covers disallowed/allowed SM channel cases
  - `src/channels/plugins/catalog.ts` filters SM plugin catalog to v1 onboarding channel policy
- Updated plugin auto-enable behavior to respect `channels.<id>.enabled=false` so disabled channels are not re-enabled from env/config detection.
- Added tests:
  - `src/sm/env.test.ts`
  - `src/sm/cli/program/build-program.test.ts`
  - `src/sm/runtime-guardrails.test.ts`
  - `src/sm/channel-policy.test.ts`
  - `src/commands/onboard-channels.e2e.test.ts` (Senior Mantis onboarding scope and primer wording)
  - `src/plugins/loader.test.ts` (SM loader channel prune)
  - `src/channels/plugins/catalog.test.ts` (SM catalog filter)
  - `src/channels/plugins/index.test.ts` (SM runtime channel listing filter)
  - `src/sm/cli/program/build-program.dashboard.test.ts` (`seniormantis dashboard --no-open` wiring)
  - `src/gateway/server.channels.e2e.test.ts` (SM mode channel status/logout prune behavior)
- Added bundler entry in `tsdown.config.ts` for `src/entry-seniormantis.ts`.
- Removed non-v1 Fly deployment artifacts:
  - deleted `docs/install/fly.md`
  - deleted `fly.toml`
  - deleted `fly.private.toml`
  - removed English docs references in `docs/platforms/index.md`, `docs/help/faq.md`, `docs/vps.md`, `docs/docs.json`

## Current command surface (Senior Mantis runner)

- `setup`
- `onboard`
- `doctor`
- `dashboard`
- `message` (send-focused registration)
- `agent` / `agents`
- `status` / `health` / `sessions`
- `gateway`

Gateway subcommands intentionally exposed in Senior Mantis runner:

- `gateway run`
- `gateway status`

## Intentional non-goals in this baseline

- No destructive deletions of OpenClaw modules yet.
- No schema rewrite yet (still reusing OpenClaw internals with different defaults).

## Immediate next tasks

1. Add explicit one-time state migrator (`~/.seniormantis` -> `~/.holyops`) with backup + confirmation.
2. Continue pruning non-v1 channel/runtime surfaces (remove dormant extension/plugin/channel paths where unused in HolyOps mode).
3. Run desktop-first manual smoke loop (`setup -> gateway -> dashboard -> onboarding`) and fix remaining UI/launch instability.

## Brand migration track (OpenClaw -> HolyOps)

This is now an explicit implementation track, not an implicit cleanup.

### Stage A (now): user-facing rename first

- Keep `holyops` CLI as primary surface (`seniormantis` remains compatibility-only) and avoid new `openclaw` mentions in HolyOps docs/help text.
- Prefer "HolyOps" naming in onboarding/status/help copy for SM/HolyOps runner.
- Keep safe behavior unchanged (local mode, loopback bind, explicit confirmations).

### Stage B (after v1 parity): internal identifier migration

- Rename package/module/script identifiers that still use `openclaw` where safe.
- Introduce explicit compatibility shims only where needed (migration scripts, alias entrypoints).
- Preserve config/session migration path for existing local installs.

### Stage C (new repo cut)

- Publish from a clean non-fork repo with HolyOps-first naming throughout.
- Remove temporary compatibility aliases once migration window closes.

## Safety defaults to preserve

- loopback bind by default
- pairing/allowlist style DM controls
- user-requested email actions only (no auto-send)
- explicit confirmations for outbound side effects

## Fork CI/CD policy (dev mode)

- Temporary fork policy (2026-02-17): all GitHub workflows are manual-only (`workflow_dispatch`) while v1 is under active solo development.
- Rationale:
  - avoid repeated CI/CD runs on every push while refactors are still high-churn
  - avoid accidental Docker/publish/release side effects from inherited OpenClaw workflows
- Re-enable plan:
  1. restore push/PR triggers for `ci.yml` and `install-smoke.yml`
  2. keep release workflows manual until first Senior Mantis release process is defined
  3. re-enable housekeeping workflows (`stale`, `labeler`, `auto-response`) only if needed

### Disabled workflow inventory (2026-02-17)

All entries below were changed to `on: workflow_dispatch` only.

- `.github/workflows/ci.yml`
  - removed: `push` on `main`, `pull_request`
- `.github/workflows/install-smoke.yml`
  - removed: `push` on `main`, `pull_request`
- `.github/workflows/docker-release.yml`
  - removed: `push` on `main`/`v*` tags
- `.github/workflows/workflow-sanity.yml`
  - removed: `push` on `main`, `pull_request`
- `.github/workflows/sandbox-common-smoke.yml`
  - removed: `push` path triggers, `pull_request` path triggers
- `.github/workflows/auto-response.yml`
  - removed: `issues` (`opened`, `edited`, `labeled`), `pull_request_target` (`labeled`)
- `.github/workflows/formal-conformance.yml`
  - removed: `pull_request`
- `.github/workflows/labeler.yml`
  - removed: `pull_request_target` (`opened`, `synchronize`, `reopened`), `issues` (`opened`)
- `.github/workflows/stale.yml`
  - removed: scheduled cron (`17 3 * * *`)

## Repo migration checklist (clean non-fork)

1. Copy this `docs/sm/` folder first.
2. Copy `src/sm/*`, `src/entry-seniormantis.ts`, `seniormantis.mjs`, and retained runtime folders.
3. Run smoke checks from `docs/sm/BOOTSTRAP_NEW_REPO.md`.
4. Treat this handoff file as source of truth for continuation.

## Local macOS desktop test path

```bash
pnpm install
pnpm build
node seniormantis.mjs setup
node holyops.mjs setup
pnpm --dir apps/desktop-electron install
pnpm desktop:dev
```

Desktop first-run click path:

1. `Run Setup`
2. `Start Gateway`
3. `Run Onboarding`
