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

- `src/sm/runtime-guardrails.ts`: present and wired guardrails for local-first defaults + channel/plugin pruning.
- `src/sm/runtime-guardrails.test.ts`: present.
- `src/sm/cli/run-main.ts`: calls `applySeniorMantisRuntimeGuardrails()` before CLI parse.
- `docs/sm/` updates: present (`VISION.md`, `HANDOFF.md`, `DECISIONS.md`, `KEEP_DROP_MATRIX.md`).

## Cleanup phase (this pass)

### Runtime/channel prune

- Added Senior Mantis channel policy enforcement:
  - `src/sm/channel-policy.ts`
  - `src/sm/channel-policy.test.ts`
- Restricted agent/message channel usage in Senior Mantis mode:
  - `src/commands/agent-via-gateway.ts`
  - `src/infra/outbound/channel-selection.ts`
- Added Senior Mantis-specific status/health/sessions registration text to remove non-v1 channel wording:
  - `src/sm/cli/program/register-status-health-sessions.ts`
  - `src/sm/cli/program/build-program.ts`
- Locked onboarding channel selection to v1 scope in Senior Mantis mode:
  - `src/commands/onboard-channels.ts` (filter selectable channels to WhatsApp)
  - `src/wizard/onboarding.ts` (Senior Mantis onboarding flags + DM policy prompt skip)
- Hardened onboarding channel allowlist enforcement in Senior Mantis mode:
  - `src/commands/onboard-channels.ts` (filter adapter status fetches, sanitize `initialSelection`/`forceAllowFromChannels`, reject disallowed channel choices)
- Disabled onboarding plugin catalog/install surface in Senior Mantis mode:
  - `src/commands/onboard-channels.ts` (skip catalog enumeration and plugin install paths in SM runtime)
- Added onboarding e2e coverage for Senior Mantis channel scope and primer wording:
  - `src/commands/onboard-channels.e2e.test.ts` (includes assertion that catalog enumeration is not used in SM mode)
- Added plugin loader boundary pruning in Senior Mantis mode:
  - `src/plugins/loader.ts` blocks disallowed channel plugins before module load/registration
  - `src/plugins/loader.test.ts` verifies disallowed/allowed channel plugin behavior under SM mode
- Added channel catalog filtering in Senior Mantis mode:
  - `src/channels/plugins/catalog.ts`
  - `src/channels/plugins/catalog.test.ts`
- Expanded runtime guardrails to explicitly disable non-v1 channel plugins:
  - `src/sm/runtime-guardrails.ts`
  - `src/sm/runtime-guardrails.test.ts`
- Prevented plugin auto-enable from re-enabling explicitly disabled channels:
  - `src/config/plugin-auto-enable.ts`
  - `src/config/plugin-auto-enable.test.ts`

### Brand migration (newly tracked)

- Added explicit staged brand migration policy in Senior Mantis docs:
  - `docs/sm/DECISIONS.md` (D-012)
  - `docs/sm/HANDOFF.md` (stages A/B/C)
  - `docs/sm/KEEP_DROP_MATRIX.md` (keep/defer matrix entries for naming surfaces)
- Applied Stage A user-facing rename updates in SM onboarding/help paths:
  - `src/wizard/onboarding.ts` (product naming + command rendering in security prompt)
  - `src/sm/cli/program/build-program.ts` (profile option wording)

### Desktop MVP

- Added desktop Electron shell scaffolding:
  - `apps/desktop-electron/main.mjs`
  - `apps/desktop-electron/preload.cjs`
  - `apps/desktop-electron/renderer/*`
  - `apps/desktop-electron/README.md`
- Added root scripts for local desktop run:
  - `package.json` (`desktop:dev`, `desktop:start`)
  - desktop app currently runs as a standalone package (`pnpm --dir apps/desktop-electron ...`); workspace inclusion can be added in packaging phase
- Improved desktop CLI invocation behavior for local testing:
  - onboarding terminal launch now resolves through Senior Mantis CLI mode selection (repo/global)
  - repo CLI mode now requires both runtime deps and `dist/entry-seniormantis.*`
  - gateway start now reports explicit launch errors (for example missing binary)
  - UI activity log now shows resolved CLI mode and command
- Added Electron install-script allowlisting for workspace installs:
  - `.npmrc` (`allow-build-scripts` includes `electron`)
  - `pnpm-workspace.yaml` (`onlyBuiltDependencies` includes `electron`)
  - `package.json` (`pnpm.onlyBuiltDependencies` includes `electron`)

### Exact file removals

- Removed `docs/install/fly.md`
  - Rationale: Fly deployment is out of scope for desktop-first local v1.
- Removed `fly.toml`
  - Rationale: cloud deployment artifact not needed for local-first v1 path.
- Removed `fly.private.toml`
  - Rationale: cloud deployment artifact not needed for local-first v1 path.

### Docs updates for removals

- Removed English Fly references from:
  - `docs/platforms/index.md`
  - `docs/help/faq.md`
  - `docs/vps.md`
  - `docs/docs.json` (install navigation + redirect target)

## Notes

- `docs/zh-CN/**` was intentionally not edited in this pass (generated content policy).
- README now includes an expanded Senior Mantis fork section with desktop-first v1 vision and local macOS test commands.

## Validation attempts

- `pnpm test -- --run src/commands/onboard-channels.e2e.test.ts src/sm/channel-policy.test.ts`
  - Result: pass for `src/sm/channel-policy.test.ts` (repo `test` command path still runs unit-profile selection)
- `pnpm exec vitest run --config vitest.e2e.config.ts src/commands/onboard-channels.e2e.test.ts`
  - Result: pass (6 tests)
- `pnpm exec vitest run src/plugins/loader.test.ts src/channels/plugins/catalog.test.ts src/sm/channel-policy.test.ts`
  - Result: pass (25 tests)
- `pnpm check`
  - Current blocker: `sh: oxfmt: command not found`
- `pnpm exec vitest run src/plugins/loader.test.ts src/channels/plugins/catalog.test.ts src/sm/channel-policy.test.ts src/commands/onboard-channels.e2e.test.ts`
  - Current blocker: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`
- `pnpm install`
  - Current blocker: `ENOTFOUND registry.npmjs.org` (example failed tarball request: `@opentelemetry/api/-/api-1.9.0.tgz`)
- `node --check apps/desktop-electron/main.mjs && node --check apps/desktop-electron/renderer/renderer.js`
  - Result: pass
- `pnpm --dir apps/desktop-electron install`
  - Current blocker: `ENOTFOUND registry.npmjs.org` (example failed tarball request: `@opentelemetry/api/-/api-1.9.0.tgz`)
- `node node_modules/.pnpm/electron@35.7.5/node_modules/electron/install.js`
  - Current blocker: `getaddrinfo ENOTFOUND github.com` (Electron binary download source)
- `git diff --check`
  - Result: pass
