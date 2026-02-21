# HolyOps Migration Notes

Last updated: 2026-02-21

## Current state

- Primary product direction is now `HolyOps` (personal creator ops).
- CLI compatibility is dual-mode:
  - primary: `holyops`
  - compatibility alias: `seniormantis`
- HolyOps defaults now target:
  - state: `~/.holyops`
  - config: `~/.holyops/holyops.json`
- Legacy compatibility read path remains active:
  - `~/.seniormantis/seniormantis.json` is still detected and used when no HolyOps config exists.

## Why this is staged

- Keep active local installs stable while we continue cleanup and feature delivery.
- Avoid migration regressions during ongoing channel/runtime pruning and desktop hardening.

## Deferred cleanup items (tracked)

1. Remove `seniormantis` command alias after HolyOps rollout window closes.
2. Add explicit one-time migrator from `~/.seniormantis` to `~/.holyops` (copy + verify + backup, operator-confirmed).
3. Rename internal identifiers/file paths that still mention Senior Mantis.
4. Replace `docs/sm/*` path naming once repo split timing is locked.

## Safety defaults (must stay)

- `gateway.mode=local`
- loopback bind
- explicit confirmation for side effects
- WhatsApp + local web UI v1 perimeter
