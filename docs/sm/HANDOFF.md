# Senior Mantis Handoff

Status: active implementation baseline
Owner: Senior Mantis product fork
Last updated: 2026-02-16

## Goal
Ship a senior-friendly assistant app based on OpenClaw with a narrow v1:
- desktop app
- WhatsApp
- local web control UI
- guided onboarding
- safe/manual task workflows

## Implemented in this baseline
- Added `seniormantis` binary entry (`package.json`, `seniormantis.mjs`).
- Added dedicated entrypoint `src/entry-seniormantis.ts`.
- Added Senior Mantis environment defaults in `src/sm/env.ts`:
  - state path defaults to `~/.seniormantis`
  - config path defaults to `~/.seniormantis/seniormantis.json`
  - CLI name override defaults to `seniormantis`
- Added reduced CLI program at `src/sm/cli/program/build-program.ts`.
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
  - enforcement wired into agent/message runtime path
- Added Senior Mantis-specific `status`/`health`/`sessions` registration (`src/sm/cli/program/register-status-health-sessions.ts`) to avoid non-v1 channel phrasing in help text.
- Updated plugin auto-enable behavior to respect `channels.<id>.enabled=false` so disabled channels are not re-enabled from env/config detection.
- Added tests:
  - `src/sm/env.test.ts`
  - `src/sm/cli/program/build-program.test.ts`
  - `src/sm/runtime-guardrails.test.ts`
  - `src/sm/channel-policy.test.ts`
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

## Intentional non-goals in this baseline
- No destructive deletions of OpenClaw modules yet.
- No Electron app implementation yet.
- No schema rewrite yet (still reusing OpenClaw internals with different defaults).

## Immediate next tasks
1. Build Electron shell under `apps/desktop-electron`.
2. Replace generic onboarding with senior-focused question flow.
3. Continue staged prune of non-v1 channels/extensions in runtime and docs.
4. Add Senior Mantis config schema adapter (`src/sm/config/*`).
5. Add feature modules for email/manual workflows and guided browser workflows.

## Safety defaults to preserve
- loopback bind by default
- pairing/allowlist style DM controls
- user-requested email actions only (no auto-send)
- explicit confirmations for outbound side effects

## Repo migration checklist (clean non-fork)
1. Copy this `docs/sm/` folder first.
2. Copy `src/sm/*`, `src/entry-seniormantis.ts`, `seniormantis.mjs`, and retained runtime folders.
3. Run smoke checks from `docs/sm/BOOTSTRAP_NEW_REPO.md`.
4. Treat this handoff file as source of truth for continuation.
