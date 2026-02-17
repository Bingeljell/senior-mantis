# Senior Mantis Status

Status: active staged-prune implementation
Last updated: 2026-02-17

## Source of truth

- `docs/sm/VISION.md`
- `docs/sm/HANDOFF.md`
- `docs/sm/DECISIONS.md`
- `docs/sm/KEEP_DROP_MATRIX.md`
- `docs/sm/BOOTSTRAP_NEW_REPO.md`

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
- `src/sm/cli/program/register-gateway.ts` (new)
  - added Senior Mantis-only gateway command surface:
    - `seniormantis gateway run`
    - `seniormantis gateway status`
  - excludes non-v1 gateway subcommands (`call`, `discover`, `probe`, `usage-cost`, service install/start/stop/restart/uninstall).
- `src/gateway/server-http.ts`
  - in Senior Mantis mode, skip Slack HTTP route handling (`/api/slack/*`) so non-v1 channel wiring is not active in runtime path.

### Rename pass + first-run hardening

- `src/cli/banner.ts`
  - banner branding now follows active CLI name:
    - `openclaw` => OpenClaw banner
    - `seniormantis` => Senior Mantis banner/tagline.
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
