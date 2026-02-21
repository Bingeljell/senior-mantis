# Senior Mantis Decision Log

## 2026-02-16

### D-001: Repo strategy

Decision: clean-copy to a new non-fork repository.
Reason: clear product identity, reduced coupling, simpler governance.

### D-002: v1 interaction surfaces

Decision: desktop app + WhatsApp + local web control UI.
Reason: covers real user workflows while minimizing complexity.

### D-003: Auth UX

Decision: OpenAI OAuth first, API key fallback.
Reason: lower setup friction for seniors and caregivers.

### D-004: Email behavior in v1

Decision: user-requested actions only.
Reason: safety and trust; avoid autonomous side effects.

### D-005: Browser capabilities in v1

Decision: guided navigation only.
Reason: assistive behavior without full autonomous automation risk.

### D-006: Voice in v1

Decision: include optional voice setup in onboarding (input/output).
Reason: accessibility and ease of use for target audience.

### D-007: Initial code strategy

Decision: add Senior Mantis namespace and wrapper first, then prune.
Reason: lower migration risk and faster first runnable milestone.

### D-008: Runtime guardrails before deletions

Decision: enforce v1-safe runtime overrides in the Senior Mantis entry path before deleting non-v1 modules.
Reason: reduce risk by keeping code available while constraining behavior to desktop + WhatsApp + local web UI defaults.

### D-009: Staged prune policy

Decision: prune non-v1 channel/plugin/deployment surfaces in stages, starting with runtime/channel enforcement and removal of Fly deployment artifacts.
Reason: keep the migration safe while converging to desktop-first local v1 scope.

### D-010: Senior Mantis onboarding channel scope

Decision: restrict onboarding channel setup to WhatsApp only in Senior Mantis mode.
Reason: align onboarding UX with v1 scope and avoid exposing non-v1 channel setup paths.

### D-011: Senior Mantis onboarding allowlist hardening

Decision: enforce onboarding allowlist checks at every setup path (status fetch, defaults, overrides, selection handling, and plugin-catalog install paths).
Reason: defense in depth; ensure non-v1 channels cannot be selected through preset values or stale adapter/plugin state, and avoid plugin-install surface in SM mode.

### D-012: Brand migration policy (OpenClaw -> Senior Mantis)

Decision: treat product rebrand as an explicit staged workstream, with user-facing rename first and internal identifier rename after runtime parity.
Reason: keep v1 delivery moving while avoiding risky broad renames across runtime/config/protocol internals too early.

### D-013: Desktop MVP implementation shape

Decision: ship a minimal Electron shell first (`apps/desktop-electron`) that wraps existing CLI/gateway paths, with explicit confirmation before side-effecting actions.
Reason: validate desktop-first UX quickly without blocking on packaging/build-system complexity.

### D-014: Channel prune at plugin loader boundary

Decision: enforce Senior Mantis channel policy inside plugin loading, so disallowed channel plugins never load in SM mode even when explicitly enabled in config.
Reason: defense in depth; remove non-v1 channel load paths instead of relying only on later runtime checks.

### D-015: Desktop CLI invocation fallback for local mac testing

Decision: desktop Electron shell should resolve CLI invocation dynamically (repo CLI first, global `seniormantis` fallback), and report explicit process-launch errors.
Reason: keep local developer testing unblocked when repo dependencies are temporarily missing, while preserving a deterministic default path.

### D-016: HolyOps default path migration with legacy compatibility

Decision: switch HolyOps default state/config paths to `~/.holyops/holyops.json`, while retaining compatibility reads from `~/.seniormantis/seniormantis.json` when HolyOps config is absent.
Reason: make HolyOps identity concrete now without breaking existing local installs during staged cleanup.
