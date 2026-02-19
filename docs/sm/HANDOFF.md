# Senior Mantis Handoff

Status: active implementation baseline
Owner: Senior Mantis product fork
Last updated: 2026-02-17

Primary vision doc: `docs/sm/VISION.md`

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
- Runtime/state path remains `~/.seniormantis` for now (migration deferred, explicitly tracked).
- Surface focus remains:
  - desktop-first local control flow
  - WhatsApp interaction path
  - local web UI
- First specialist workflow adapters shipped:
  - `video-agent` adapter/tool
  - `business-agent` adapter/tool
- Migration tracking doc:
  - `docs/sm/HOLYOPS_MIGRATION_NOTES.md`
- HolyOps workflow adapter implementation:
  - adapter contract + registry: `src/sm/adapters/types.ts`, `src/sm/adapters/registry.ts`
  - command runner: `src/sm/adapters/runner.ts`
  - video adapter: `src/sm/adapters/video-cli-adapter.ts`
  - business adapter: `src/sm/adapters/business-cli-adapter.ts`
  - agent tool wiring: `src/agents/tools/holyops-video-tool.ts`, `src/agents/tools/holyops-business-tool.ts`, `src/agents/openclaw-tools.ts`

## Implemented in this baseline

- Added `seniormantis` binary entry and `holyops` primary alias (`package.json`, `seniormantis.mjs`, `holyops.mjs`).
- Added dedicated entrypoint `src/entry-seniormantis.ts`.
- Added Senior Mantis environment defaults in `src/sm/env.ts`:
  - state path defaults to `~/.seniormantis`
  - config path defaults to `~/.seniormantis/seniormantis.json`
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
  - desktop launcher now forces CLI state/config env to Senior Mantis paths by default (`~/.seniormantis`)
  - embedded dashboard/open-in-browser URLs include `#token=...` when `gateway.auth.token` exists in Senior Mantis config (or via `SM_GATEWAY_TOKEN`)
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

1. Complete phase-2 hard prune of non-v1 channel wiring beyond guardrails (runtime loaders, command surfaces, docs).
2. Harden HolyOps tool-adapter ergonomics (per-action validation, richer artifacts, retry semantics).
3. Add desktop quick-actions that route into `video_tool` and `business_tool`.
4. Add next specialist tools (`research-agent`, `writer-agent`) on the same adapter contract.
5. Add desktop packaging/distribution flow for `apps/desktop-electron` (dev -> signed release pipeline later).

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
