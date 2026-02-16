# Senior Mantis Status

Status: active staged-prune implementation
Last updated: 2026-02-16

## Source of truth
- `docs/sm/HANDOFF.md`
- `docs/sm/DECISIONS.md`
- `docs/sm/KEEP_DROP_MATRIX.md`
- `docs/sm/BOOTSTRAP_NEW_REPO.md`

## Reality check (implemented)
- `src/sm/runtime-guardrails.ts`: present and wired guardrails for local-first defaults + channel/plugin pruning.
- `src/sm/runtime-guardrails.test.ts`: present.
- `src/sm/cli/run-main.ts`: calls `applySeniorMantisRuntimeGuardrails()` before CLI parse.
- `docs/sm/` updates: present (`HANDOFF.md`, `DECISIONS.md`, `KEEP_DROP_MATRIX.md`).

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
- Added onboarding e2e coverage for Senior Mantis channel scope and primer wording:
  - `src/commands/onboard-channels.e2e.test.ts`
- Expanded runtime guardrails to explicitly disable non-v1 channel plugins:
  - `src/sm/runtime-guardrails.ts`
  - `src/sm/runtime-guardrails.test.ts`
- Prevented plugin auto-enable from re-enabling explicitly disabled channels:
  - `src/config/plugin-auto-enable.ts`
  - `src/config/plugin-auto-enable.test.ts`

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

## Validation attempts
- `pnpm test -- --run src/commands/onboard-channels.e2e.test.ts src/sm/channel-policy.test.ts`
  - Error: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`
- `pnpm install`
  - Error: `ENOTFOUND registry.npmjs.org` while fetching packages
- `pnpm check`
  - Error: `oxfmt: command not found`
- `git diff --check`
  - Result: pass
