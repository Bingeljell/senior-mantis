# Keep/Drop Matrix

Legend:
- Keep: needed for Senior Mantis v1 runtime
- Defer: keep temporarily, remove after parity
- Drop: remove from Senior Mantis runtime/new repo

| Area | Path | Decision | Rationale |
|---|---|---|---|
| Senior Mantis entry | `src/entry-seniormantis.ts` | Keep | Product bootstrap |
| Senior Mantis CLI | `src/sm/**` | Keep | Product-specific control surface |
| Core gateway | `src/gateway/**` | Keep | Core control plane |
| Agent runtime | `src/agents/**` | Keep | Tool orchestration and model execution |
| Routing/sessions | `src/routing/**`, `src/sessions/**` | Keep | Stable context + isolation |
| WhatsApp channel | `src/web/auto-reply/**`, `src/whatsapp/**` | Keep | v1 channel requirement |
| Internal webchat | `src/web/**`, relevant `src/gateway/**` webchat methods | Keep | desktop/browser UX |
| UI package | `ui/**` | Keep | Control UI and chat surfaces |
| Core config/infra | `src/config/**`, `src/infra/**` | Keep | runtime plumbing |
| Multi-channel CLI | `src/cli/channels-cli.ts` and non-v1 sub-CLIs | Defer | remove after Senior Mantis onboarding is stable |
| Onboarding channel chooser | `src/commands/onboard-channels.ts`, `src/wizard/onboarding.ts` | Keep | Senior Mantis runtime now filters onboarding to WhatsApp-only and sanitizes onboarding defaults/overrides to prevent non-v1 channel bypass |
| Plugin channels | `extensions/**` | Drop | not needed in v1 (staged: non-v1 channel plugins runtime-disabled in Senior Mantis guardrails) |
| Mobile apps | `apps/ios/**`, `apps/android/**` | Drop | out of scope v1 |
| macOS native app | `apps/macos/**` | Drop | replaced by Electron |
| Channel implementations (non-WhatsApp) | `src/telegram/**`, `src/discord/**`, `src/slack/**`, `src/signal/**`, `src/imessage/**`, etc | Drop | reduce surface area and maintenance (runtime-disabled in Senior Mantis guardrails first) |
| Complex plugin management | `src/plugins/**` | Defer | likely removable after message/gateway flows are re-wired |
| Non-v1 docs | `docs/channels/**` (except WhatsApp references) | Drop | product docs should be Senior Mantis specific |
| Packaging scripts (mobile/mac native) | related scripts under `scripts/` | Drop | not needed for Electron path |
| Fly deployment docs/artifacts | `docs/install/fly.md`, `fly.toml`, `fly.private.toml` | Drop | out of scope for desktop-first local v1 (removed) |
