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
