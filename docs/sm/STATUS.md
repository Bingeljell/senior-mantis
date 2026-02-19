# Senior Mantis Status

Status: active staged-prune implementation
Last updated: 2026-02-19

## Source of truth

- `docs/sm/VISION.md`
- `docs/sm/HANDOFF.md`
- `docs/sm/DECISIONS.md`
- `docs/sm/KEEP_DROP_MATRIX.md`
- `docs/sm/BOOTSTRAP_NEW_REPO.md`
- `docs/sm/HOLYOPS_MIGRATION_NOTES.md`

## HolyOps pivot updates (2026-02-19)

- Added `holyops` CLI alias while preserving `seniormantis` compatibility:
  - root wrapper: `holyops.mjs`
  - package bin mapping: `package.json`
  - CLI name resolver now accepts `openclaw|holyops|seniormantis`: `src/cli/cli-name.ts`
- HolyOps is now the default CLI identity for the SM/HolyOps runtime path:
  - default `OPENCLAW_CLI_NAME_OVERRIDE` set to `holyops` in `src/sm/env.ts`
  - guardrail policy now treats `holyops` and `seniormantis` as compatibility names: `src/sm/channel-policy.ts`
- Updated HolyOps-facing user surfaces:
  - banner branding: `src/cli/banner.ts`
  - SM/HolyOps CLI help text and examples: `src/sm/cli/program/build-program.ts`, `src/sm/cli/program/register-status-health-sessions.ts`, `src/sm/cli/program/register-gateway.ts`
  - desktop shell labels and default CLI command: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/renderer/index.html`
- Implemented first HolyOps workflow adapter contract + tools:
  - adapter types/runner/registry: `src/sm/adapters/types.ts`, `src/sm/adapters/runner.ts`, `src/sm/adapters/registry.ts`
  - video adapter: `src/sm/adapters/video-cli-adapter.ts`
  - business adapter: `src/sm/adapters/business-cli-adapter.ts`
  - research adapter: `src/sm/adapters/research-cli-adapter.ts`
  - writer adapter: `src/sm/adapters/writer-cli-adapter.ts`
  - agent tools + registration: `src/agents/tools/holyops-video-tool.ts`, `src/agents/tools/holyops-business-tool.ts`, `src/agents/tools/holyops-research-tool.ts`, `src/agents/tools/holyops-writer-tool.ts`, `src/agents/openclaw-tools.ts` (HolyOps-mode only)
- Added direct workflow command for deterministic adapter execution (non-LLM path):
  - command surface + validation: `src/sm/cli/program/register-workflow.ts`
  - command registration: `src/sm/cli/program/build-program.ts`
  - parser/confirmation tests: `src/sm/cli/program/register-workflow.test.ts`, `src/sm/cli/program/build-program.test.ts`
- Added desktop quick actions that route into direct workflow command paths:
  - desktop IPC + runner: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/preload.cjs`
  - desktop UI controls: `apps/desktop-electron/renderer/index.html`, `apps/desktop-electron/renderer/renderer.js`, `apps/desktop-electron/renderer/styles.css`
  - current quick actions:
    - `video_compress`
    - `business_proposal`
    - `research_scan`
    - `writer_draft`
- Hardened adapter ergonomics for v1 reliability:
  - stricter action validation (`outputPath`, `clip` args, `musicPath`) in `src/sm/adapters/video-cli-adapter.ts`
  - richer business artifacts (`proposal_id` + URL inference) in `src/sm/adapters/business-cli-adapter.ts`
  - retryability heuristics for transient command failures in both adapters
  - expanded adapter tests in `src/sm/adapters/registry.test.ts`
- Added HolyOps-mode runtime branding pass for high-visibility output:
  - dynamic product label helper: `src/sm/brand.ts`
  - updated runtime output copy:
    - dashboard success line: `src/commands/dashboard.ts`
    - doctor title line: `src/commands/doctor.ts`
    - onboarding warnings/windows tips: `src/commands/onboard.ts`
    - status heading/docs footer links: `src/commands/status.command.ts`
  - tests: `src/sm/brand.test.ts`, `src/commands/dashboard.e2e.test.ts`, `src/commands/status.e2e.test.ts`
- Pruned extension/plugin tool surface in HolyOps mode:
  - `createOpenClawTools` now skips plugin tool resolution in HolyOps mode while retaining OpenClaw behavior in OpenClaw mode.
  - files: `src/agents/openclaw-tools.ts`, `src/agents/openclaw-tools.holyops-plugin-prune.test.ts`
- Added explicit migration tracker:
  - `docs/sm/HOLYOPS_MIGRATION_NOTES.md`
  - keeps `~/.seniormantis` path for now, tracks deferred move to `~/.holyops`.

## Reality check (implemented)

- Runtime guardrails are implemented and wired:
  - `src/sm/runtime-guardrails.ts`
  - `src/sm/runtime-guardrails.test.ts`
  - `src/sm/cli/run-main.ts` calls guardrails before CLI parse.
- Senior Mantis channel policy + onboarding restrictions are implemented:
  - `src/sm/channel-policy.ts`
  - `src/commands/onboard-channels.ts`
  - `src/wizard/onboarding.ts`
  - `src/plugins/loader.ts`
  - `src/channels/plugins/catalog.ts`
- Desktop shell exists and is runnable for local testing:
  - `apps/desktop-electron/*`
  - root scripts `desktop:dev` and `desktop:start`.

## Current pass: phase 2 prune + desktop first-run hardening

### Command/runtime pruning updates

- `src/sm/cli/program/build-program.ts`
  - removed generic gateway CLI registration from Senior Mantis runner.
  - message channel option now advertises WhatsApp-only for v1 (`message send --channel whatsapp`).
  - fixed dashboard flag wiring so `seniormantis dashboard --no-open` reliably suppresses browser launch.
- `src/sm/cli/program/register-gateway.ts` (new)
  - added Senior Mantis-only gateway command surface:
    - `seniormantis gateway run`
    - `seniormantis gateway status`
  - excludes non-v1 gateway subcommands (`call`, `discover`, `probe`, `usage-cost`, service install/start/stop/restart/uninstall).
- `src/gateway/server-http.ts`
  - in Senior Mantis mode, skip Slack HTTP route handling (`/api/slack/*`) so non-v1 channel wiring is not active in runtime path.
- `src/channels/plugins/index.ts`
  - in Senior Mantis mode, runtime channel plugin listing is filtered to v1 channels only (`whatsapp`, `webchat`) as a defense-in-depth prune layer for gateway/command channel surfaces.
  - gateway `channels.status` now returns only v1 channel snapshots in Senior Mantis mode (covered via gateway e2e test).
- `src/config/schema.ts`
  - in Senior Mantis mode, config schema channel metadata is filtered to v1 channels only (`whatsapp`, `webchat`) before hint/schema merge.
  - heartbeat target help text in `config.schema` now avoids advertising non-v1 channels.
- `src/config/validation.ts`
  - in Senior Mantis mode, plugin-aware config validation now rejects non-v1 `channels.*` keys and non-v1 heartbeat targets.
  - this prevents local config writes/load validation from accepting channel targets outside the v1 runtime scope.

### Rename pass + first-run hardening

- `src/cli/banner.ts`
  - banner branding now follows active CLI name:
    - `openclaw` => OpenClaw banner
    - `seniormantis` => Senior Mantis banner/tagline.
- `src/sm/cli/program/build-program.ts`, `src/sm/cli/program/register-status-health-sessions.ts`
  - Senior Mantis CLI help/docs hints now point to local `docs/sm/*` references instead of `docs.openclaw.ai` links in SM-only command surfaces.
- Desktop first-run flow updates:
  - `apps/desktop-electron/main.mjs` adds explicit `Run Setup` terminal action.
  - `apps/desktop-electron/preload.cjs` exposes setup action to renderer.
  - `apps/desktop-electron/renderer/index.html` adds `Run Setup` button.
  - `apps/desktop-electron/renderer/renderer.js` adds setup action wiring and setup-needed activity hints.
- Docs/readme updates for local testing path:
  - `apps/desktop-electron/README.md`
  - `README.md` (Senior Mantis section).
- Desktop launcher runtime fix for Electron:
  - root cause: repo CLI invocation used `process.execPath`, which is the Electron binary under desktop runtime.
  - symptom: terminal setup/onboarding commands failed with `unknown command '/.../seniormantis.mjs'`.
  - fix in `apps/desktop-electron/main.mjs`:
    - use `node` (or `SM_NODE_COMMAND`) for repo CLI invocation when running inside Electron
    - sanitize `npm_config_prefix` from spawned env to avoid zsh/nvm initialization warnings
    - harden spawn error handling in read-only command path.
- Desktop Control UI URL resolution fix:
  - root cause: desktop shell hardcoded `/ui`, but gateway default `gateway.controlUi.basePath` is empty (`/` root).
  - symptom: embedded Web UI frame loaded a 404 page (`Not Found`) even when gateway was running.
  - fix in `apps/desktop-electron/main.mjs`:
    - resolve UI path from `SM_GATEWAY_UI_PATH` or local config `gateway.controlUi.basePath`
    - default to root path when unset.
- Desktop auth/config isolation fix:
  - root cause: desktop-launched CLI could drift into legacy OpenClaw state/config/auth context.
  - symptom: embedded UI showed `disconnected (1008): unauthorized` while desktop reported gateway running.
  - fix in `apps/desktop-electron/main.mjs` + `apps/desktop-electron/renderer/renderer.js`:
    - force desktop CLI env defaults to Senior Mantis paths (`OPENCLAW_STATE_DIR=~/.seniormantis`, `OPENCLAW_CONFIG_PATH=~/.seniormantis/seniormantis.json`) unless explicitly overridden with `SM_STATE_DIR`/`SM_CONFIG_PATH`
    - resolve `gateway.auth.token` from Senior Mantis config and append `#token=...` for embedded/opened dashboard URL
    - re-resolve dashboard URL/token dynamically after gateway start so first-run auto-token generation does not require desktop app restart
    - token resolution now also honors `OPENCLAW_GATEWAY_TOKEN` env when present (common legacy local setup)
    - generated dashboard URL always uses a trailing slash for non-root Control UI base paths to avoid redirect edge cases
    - keep activity/status display URL token-free.
- CLI gateway auth recovery fixes:
  - `dashboard --no-open` now correctly suppresses browser launch (Commander negated option wiring fixed in `src/cli/program/register.maintenance.ts`).
  - `doctor --generate-gateway-token` now persists token config even without `--repair/--fix` (config mutation write guard fixed in `src/commands/doctor.ts`).
  - tests added:
    - `src/cli/program/register.maintenance.test.ts`
    - `src/commands/doctor.runs-legacy-state-migrations-yes-mode-without.e2e.test.ts` (token persistence case).

### Behavior impact

- Senior Mantis gateway surface is now explicitly local-v1 scoped (`run`, `status`) instead of inheriting full OpenClaw gateway command matrix.
- Senior Mantis message CLI channel option no longer advertises `webchat` for outbound send.
- Slack HTTP route handling is skipped in Senior Mantis mode.
- Desktop first-run path is explicit:
  - `Run Setup` -> `Start Gateway` -> `Run Onboarding`.
- Senior Mantis CLI banner/identity now reads as Senior Mantis in TTY banner output.

## Cleanup phase (staged, safe)

- Kept v1-safe defaults:
  - `gateway.mode=local`
  - loopback bind
  - explicit confirmations for desktop side-effect actions.
- Non-v1 cloud deploy artifacts removed:
  - `docs/install/fly.md`
  - `fly.toml`
  - `fly.private.toml`
- Non-v1 Fly docs references removed from:
  - `docs/platforms/index.md`
  - `docs/help/faq.md`
  - `docs/vps.md`
  - `docs/docs.json`

### Exact file removals in this pass

- none

## Validation (this environment)

- `pnpm build`
  - pass
- `pnpm check`
  - pass
- `pnpm exec vitest run src/sm/cli/program/build-program.test.ts src/gateway/server-http.seniormantis.test.ts`
  - pass (6 tests)
- `pnpm exec vitest run src/cron/store.test.ts src/gateway/server-methods/agent-job.test.ts src/gateway/server-methods/agents-mutate.test.ts src/logging/subsystem.test.ts`
  - pass (26 tests)
- `pnpm exec vitest run src/sm/cli/program/build-program.test.ts src/gateway/server-http.seniormantis.test.ts src/cron/store.test.ts src/gateway/server-methods/agent-job.test.ts src/gateway/server-methods/agents-mutate.test.ts src/logging/subsystem.test.ts`
  - pass (32 tests)
- `pnpm exec vitest run src/channels/plugins/index.test.ts src/sm/cli/program/build-program.test.ts src/sm/cli/program/build-program.dashboard.test.ts`
  - pass (8 tests)
- `pnpm exec vitest run src/config/schema.test.ts src/channels/plugins/index.test.ts`
  - pass (8 tests)
- `pnpm exec vitest run src/config/config.seniormantis-channel-validation.test.ts src/config/schema.test.ts`
  - pass (9 tests)
- `pnpm exec vitest run src/sm/cli/program/build-program.test.ts src/sm/cli/program/build-program.dashboard.test.ts`
  - pass (6 tests)
- `pnpm exec vitest run src/sm/adapters/registry.test.ts src/agents/openclaw-tools.holyops.test.ts src/cli/cli-name.test.ts src/sm/channel-policy.test.ts`
  - pass (14 tests)
- `pnpm exec vitest run src/sm/brand.test.ts src/sm/cli/program/register-workflow.test.ts src/sm/adapters/registry.test.ts src/agents/openclaw-tools.holyops.test.ts src/agents/openclaw-tools.holyops-plugin-prune.test.ts`
  - pass (21 tests)
- `pnpm exec vitest -c vitest.e2e.config.ts run src/commands/dashboard.e2e.test.ts src/commands/status.e2e.test.ts`
  - pass (12 tests)
- `pnpm exec vitest -c vitest.e2e.config.ts run src/gateway/server.channels.e2e.test.ts`
  - pass (4 tests)
- `node seniormantis.mjs status --json`
  - pass
- `node seniormantis.mjs gateway --help`
  - pass (shows v1-scoped subcommands: `run`, `status`)
- `node --check apps/desktop-electron/main.mjs`
  - pass
- `node seniormantis.mjs sessions --json`
  - pass
- `node dist/entry-seniormantis.js status --json`
  - pass
- `node seniormantis.mjs health --json`
  - non-zero when gateway is not running (`gateway closed`), expected in this state.
- `node seniormantis.mjs gateway run --bind loopback --port 18789 --force`
  - exits with missing-config guidance when setup is incomplete, expected on fresh local state.

## Notes

- `ERR_CONNECTION_REFUSED` for `http://127.0.0.1:18789/ui` is expected until a local gateway is actually running.
- `docs/zh-CN/**` remains unchanged by policy (generated content).

## Fork CI/CD mode (temporary)

- As of 2026-02-17, GitHub Actions in this fork are set to manual-only (`workflow_dispatch`) to avoid CI/CD noise and failed publish/release jobs during active solo development.
- Updated workflow files:
  - `.github/workflows/ci.yml`
  - `.github/workflows/install-smoke.yml`
  - `.github/workflows/docker-release.yml`
  - `.github/workflows/workflow-sanity.yml`
  - `.github/workflows/sandbox-common-smoke.yml`
  - `.github/workflows/auto-response.yml`
  - `.github/workflows/formal-conformance.yml`
  - `.github/workflows/labeler.yml`
  - `.github/workflows/stale.yml`
- Practical impact:
  - pushes to `main` no longer auto-run CI, smoke install, Docker release, or housekeeping automations.
  - workflows can still be run manually from the Actions tab when needed.
