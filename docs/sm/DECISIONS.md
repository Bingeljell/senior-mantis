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
