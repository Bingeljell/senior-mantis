# Senior Mantis Status

Status: active staged-prune implementation
Last updated: 2026-02-21

## Source of truth

- `docs/sm/VISION.md`
- `docs/sm/HANDOFF.md`
- `docs/sm/DECISIONS.md`
- `docs/sm/KEEP_DROP_MATRIX.md`
- `docs/sm/BOOTSTRAP_NEW_REPO.md`
- `docs/sm/HOLYOPS_MIGRATION_NOTES.md`

## Phase 2 cleanup pass (2026-02-21)

- Removed desktop in-app iframe surface and switched to browser-only dashboard flow:
  - `apps/desktop-electron/renderer/index.html`
  - `apps/desktop-electron/renderer/renderer.js`
  - `apps/desktop-electron/renderer/styles.css`
- Removed desktop quick-action UI + IPC execution surface:
  - `apps/desktop-electron/preload.cjs`
  - `apps/desktop-electron/main.mjs`
- Pruned `workflow` from HolyOps v1 CLI registration:
  - `src/sm/cli/program/build-program.ts`
  - `src/sm/cli/program/build-program.test.ts`
- Updated desktop runbook docs to match browser-only Local Web UI:
  - `apps/desktop-electron/README.md`

Behavior impact:

- Desktop app no longer attempts to embed Control UI; this avoids frame-policy crashes/blank state caused by gateway anti-framing headers.
- Desktop app no longer exposes quick-action buttons for workflow adapters during cleanup phase.
- HolyOps v1 top-level CLI no longer advertises/registers `workflow`; command surface stays focused on setup/onboarding/gateway/status/session flows.

## HolyOps path migration pass (2026-02-21)

- HolyOps default state/config paths now target:
  - `~/.holyops`
  - `~/.holyops/holyops.json`
- Legacy compatibility read path remains active:
  - if `~/.seniormantis/seniormantis.json` exists and HolyOps config is absent, defaults fall back to legacy config.
- Updated path resolution and docs:
  - `src/sm/env.ts`, `src/sm/env.test.ts`
  - `apps/desktop-electron/main.mjs`
  - `scripts/smoke-desktop-local.sh`
  - `src/wizard/onboarding.finalize.ts`
  - `apps/desktop-electron/README.md`
  - `src/agents/workspace.ts`, `src/agents/workspace.e2e.test.ts`, `src/agents/workspace.defaults.e2e.test.ts`

Additional behavior impact:

- In HolyOps mode, default workspace path now resolves to `~/.holyops/workspace` (instead of `~/.openclaw/workspace`).
- Workspace onboarding state now writes HolyOps-mode metadata under `.holyops/workspace-state.json` and still reads legacy `.openclaw/workspace-state.json` when present.

## Workflow/adapter removal pass (2026-02-21)

- Removed dormant HolyOps workflow adapter runtime surface from current v1 path:
  - deleted `src/sm/cli/program/register-workflow.ts`
  - deleted `src/sm/cli/program/register-workflow.test.ts`
  - deleted `src/sm/adapters/business-cli-adapter.ts`
  - deleted `src/sm/adapters/helpers.ts`
  - deleted `src/sm/adapters/research-cli-adapter.ts`
  - deleted `src/sm/adapters/runner.ts`
  - deleted `src/sm/adapters/registry.ts`
  - deleted `src/sm/adapters/registry.test.ts`
  - deleted `src/sm/adapters/types.ts`
  - deleted `src/sm/adapters/video-cli-adapter.ts`
  - deleted `src/sm/adapters/writer-cli-adapter.ts`
  - deleted `src/agents/tools/holyops-business-tool.ts`
  - deleted `src/agents/tools/holyops-research-tool.ts`
  - deleted `src/agents/tools/holyops-video-tool.ts`
  - deleted `src/agents/tools/holyops-writer-tool.ts`
  - deleted `src/agents/openclaw-tools.holyops.test.ts`
- Updated runtime tool wiring:
  - `src/agents/openclaw-tools.ts` no longer injects HolyOps workflow adapter tools.

Behavior impact:

- HolyOps v1 runtime no longer exposes video/business/research/writer adapter tools.
- Adapter stack is removed until a dedicated post-cleanup integration phase.

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
- Historical note: HolyOps workflow adapters and direct `workflow` command were prototyped during 2026-02-19 and fully removed from runtime/code in 2026-02-21 cleanup pass.
- Added desktop quick actions that route into direct workflow command paths (removed from desktop UI/IPC surface in 2026-02-21 cleanup pass):
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
- Added HolyOps-aware Control UI branding seam:
  - gateway-served Control UI HTML now injects CLI command + product brand:
    - `src/gateway/control-ui.ts`
  - new UI helper for command/product rendering:
    - `ui/src/ui/brand.ts`
  - updated Control UI surfaces:
    - `ui/src/ui/app-render.ts` (topbar brand + config path subtitle)
    - `ui/src/ui/views/overview.ts` (auth recovery commands)
    - `ui/src/ui/views/debug.ts` (security audit command hint)
  - tests:
    - `src/gateway/control-ui.test.ts`
- Updated onboarding finalization copy to follow active HolyOps/OpenClaw branding:
  - `src/wizard/onboarding.finalize.ts` now uses active brand wording for dashboard control copy and local "What now" guidance in HolyOps mode.
  - tests:
    - `src/wizard/onboarding.test.ts`
- Completed active-flow docs-link migration pass for HolyOps mode:
  - centralized docs routing for HolyOps/OpenClaw mode:
    - `src/sm/brand.ts` (`resolveBrandDocsLinks`)
  - onboarding docs/help text now routes through HolyOps local docs in HolyOps mode:
    - `src/wizard/onboarding.ts`
    - `src/wizard/onboarding.finalize.ts`
    - `src/commands/onboard.ts`
  - Control UI docs/help hints now use HolyOps local docs labels in HolyOps mode:
    - `ui/src/ui/brand.ts` (`resolveUiDocsLinks`)
    - `ui/src/ui/views/overview.ts`
    - `ui/src/ui/app-render.ts`
  - tests:
    - `src/sm/brand.test.ts`
    - `src/wizard/onboarding.test.ts`
    - `ui/src/ui/brand.node.test.ts`
- Added explicit migration tracker:
  - `docs/sm/HOLYOPS_MIGRATION_NOTES.md`
  - tracks default-path migration (`~/.holyops`) and legacy compatibility behavior.

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

### Control UI and onboarding prune continuation (2026-02-19)

- `ui/src/ui/views/channels.ts`
  - HolyOps mode now filters channel cards/order to v1 channels only (`whatsapp`, `webchat`).
  - Channel health subtitle now reflects HolyOps v1 scope when HolyOps mode is active.
- `ui/src/ui/views/channels.node.test.ts` (new)
  - added regression coverage for HolyOps-mode channel filtering vs OpenClaw/full mode order.
- `src/commands/onboard-non-interactive/local.ts`
  - web tools docs hint now routes through `resolveBrandDocsLinks()` (`toolsWeb`) instead of hardcoded `docs.openclaw.ai`.
- `src/commands/onboard-non-interactive/remote.ts`
  - web tools docs hint now routes through `resolveBrandDocsLinks()` (`toolsWeb`) instead of hardcoded `docs.openclaw.ai`.
- `src/commands/onboard-skills.ts`
  - skills docs hint now routes through `resolveBrandDocsLinks()` (`skills`) instead of hardcoded `docs.openclaw.ai`.
- `src/sm/brand.ts`
  - added `skills` docs-link key to centralized HolyOps/OpenClaw docs resolver.
- `apps/desktop-electron/README.md`
  - added explicit unauthorized/token recovery flow and expected desktop-state checklist for local testing.

### Control UI v1 hardening + local smoke pass (2026-02-19)

- `ui/src/ui/views/config.ts`
  - HolyOps mode now filters Config > Channels subsection entries to v1 channels only (`whatsapp`, `webchat`).
  - HolyOps mode now narrows form schema rendering for `channels.*` to v1 keys as defense in depth.
  - HolyOps mode channel section description now reflects v1 scope (WhatsApp + local web UI).
- `ui/src/ui/views/config.browser.test.ts`
  - added regression coverage to confirm HolyOps mode hides non-v1 channel subsections (example: `telegram`).
- `ui/src/ui/brand.ts`, `ui/src/ui/brand.node.test.ts`
  - added product slug resolver for HolyOps/OpenClaw UI mode (`holyops`/`openclaw`).
- `ui/src/ui/views/usage.ts`, `ui/src/ui/app-scroll.ts`
  - export filenames are now brand-aware in HolyOps mode:
    - usage exports: `holyops-usage-*`
    - log exports: `holyops-logs-*`
- `scripts/smoke-desktop-local.sh` (new)
  - added non-GUI local desktop smoke checks:
    - Node/pnpm availability
    - Electron dependency resolution in desktop app package
    - HolyOps CLI wiring (`--help`, `gateway --help`)
    - setup bootstrap if local config is missing
    - status JSON probe.
- `apps/desktop-electron/README.md`
  - added `scripts/smoke-desktop-local.sh` runbook step before `pnpm desktop:dev`.

### Node-safe test wiring + desktop diagnostics action (2026-02-19)

- `ui/src/ui/views/config.node.test.ts` (new)
  - added node-safe regression coverage for HolyOps Config > Channels filtering.
- `ui/package.json`
  - added `test:node` script for deterministic non-Playwright UI test runs (`vitest.node.config.ts`).
- `ui/src/ui/navigation.ts`, `ui/src/ui/navigation.test.ts`
  - removed high-visibility OpenClaw path copy from Config subtitle (`Edit local gateway config safely.`).
- `ui/src/ui/views/overview.ts`
  - token input placeholder now uses generic wording (`gateway auth token`) instead of OpenClaw-specific env label.
- `scripts/smoke-desktop-local.sh`
  - now defaults to read-only behavior when config is missing (no implicit setup side effect).
  - added `--with-setup` opt-in flag for setup bootstrap.
- Desktop diagnostics action shipped:
  - `apps/desktop-electron/main.mjs`: new `sm:run-diagnostics` IPC handler runs smoke script and returns full output.
  - `apps/desktop-electron/preload.cjs`: exposes `runDiagnostics`.
  - `apps/desktop-electron/renderer/index.html`, `apps/desktop-electron/renderer/renderer.js`: added `Run Diagnostics` button and diagnostics output panel.
  - `apps/desktop-electron/README.md`: updated local testing flow for diagnostics-first startup.

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
    - default desktop CLI env to HolyOps paths (`OPENCLAW_STATE_DIR=~/.holyops`, `OPENCLAW_CONFIG_PATH=~/.holyops/holyops.json`) with legacy config fallback, unless explicitly overridden with `SM_STATE_DIR`/`SM_CONFIG_PATH`
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

## Active-flow docs migration table (HolyOps mode)

| File                                | Old reference                                                                                                                                                   | HolyOps-mode replacement                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/wizard/onboarding.ts`          | `https://docs.openclaw.ai/gateway/security` and `.../gateway/configuration`                                                                                     | `docs/sm/HANDOFF.md`                                                            |
| `src/wizard/onboarding.finalize.ts` | `https://docs.openclaw.ai/web/control-ui`, `.../gateway/health`, `.../gateway/troubleshooting`, `.../concepts/agent-workspace`, `.../security`, `.../tools/web` | `docs/sm/HANDOFF.md` and `docs/sm/STATUS.md` (health/insecure-http context)     |
| `src/commands/onboard.ts`           | `https://docs.openclaw.ai/windows`                                                                                                                              | `docs/sm/HANDOFF.md`                                                            |
| `ui/src/ui/views/overview.ts`       | `https://docs.openclaw.ai/web/dashboard`, `.../gateway/tailscale`, `.../web/control-ui#insecure-http`                                                           | `Docs: docs/sm/HANDOFF.md` and `Docs: docs/sm/STATUS.md` labels in HolyOps mode |
| `ui/src/ui/app-render.ts`           | `https://docs.openclaw.ai` resource nav link                                                                                                                    | `Docs: docs/sm/HANDOFF.md` label in HolyOps mode                                |

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
- `pnpm exec vitest run src/gateway/control-ui.test.ts src/wizard/onboarding.test.ts`
  - pass (8 tests)
- `pnpm exec vitest run src/sm/brand.test.ts src/wizard/onboarding.test.ts`
  - pass (8 tests)
- `pnpm --dir ui exec vitest run --config vitest.node.config.ts src/ui/brand.node.test.ts src/ui/app-gateway.node.test.ts`
  - pass (5 tests)
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
- `pnpm exec vitest run ui/src/ui/app-gateway.node.test.ts ui/src/ui/navigation.test.ts`
  - exits with `No test files found` because root Vitest include is `src/**/*.test.ts`; `ui/src/**` tests are excluded from this runner.

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
