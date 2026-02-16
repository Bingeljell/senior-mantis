# Senior Mantis Status

Status: active staged-prune implementation
Last updated: 2026-02-16

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

## Current pass: startup hardening + desktop launch diagnostics

### Root cause resolved

- The `ReferenceError: Cannot access 'CONFIG_DIR' before initialization` popup came from bundled CLI startup order (top-level eager initialization in cycle-sensitive paths).

### Code updates in this pass

- `src/cron/store.ts`
  - switched from top-level `CONFIG_DIR` constant import to `resolveConfigDir()` call.
- `src/gateway/server-methods/agent-job.ts`
  - removed module-level eager `ensureAgentRunListener()` execution.
- `src/gateway/server-methods/agents.ts`
  - replaced top-level file-name constant sets with lazy cached helpers.
- `src/logging/subsystem.ts`
  - removed runtime dependency on `defaultRuntime` default parameter to avoid cycle-time TDZ.
- `src/gateway/server.impl.ts`
  - moved `ensureOpenClawCliOnPath()` from module scope into `startGatewayServer()`.
- `apps/desktop-electron/main.mjs`
  - improved gateway start flow to detect early process exit and return actionable failure messages.
  - explicit missing-config guidance now returns: run `seniormantis setup` first.

### Behavior impact

- Senior Mantis CLI `status` and `sessions` no longer crash at startup from the previous TDZ path.
- Desktop “Start gateway” now reports early launch failures clearly instead of optimistic success on process spawn.

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

## Validation (this environment)

- `pnpm build`
  - pass
- `pnpm check`
  - pass
- `pnpm exec vitest run src/cron/store.test.ts src/gateway/server-methods/agent-job.test.ts src/gateway/server-methods/agents-mutate.test.ts src/logging/subsystem.test.ts`
  - pass (26 tests)
- `node seniormantis.mjs status --json`
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
