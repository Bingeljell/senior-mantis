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
- Added tests:
  - `src/sm/env.test.ts`
  - `src/sm/cli/program/build-program.test.ts`
- Added bundler entry in `tsdown.config.ts` for `src/entry-seniormantis.ts`.

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
3. Lock message channel behavior to WhatsApp + internal webchat in runtime config checks.
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
