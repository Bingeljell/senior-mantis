# Keep/Drop Matrix

Legend (HolyOps pivot):

- Keep: needed for HolyOps v1 runtime
- Defer: keep temporarily, remove after parity
- Drop: remove from HolyOps runtime/new repo

| Area                                   | Path                                                                                                            | Decision                    | Rationale                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Senior Mantis entry                    | `src/entry-seniormantis.ts`                                                                                     | Keep                        | Product bootstrap                                                                                                                                                                  |
| Senior Mantis CLI                      | `src/sm/**`                                                                                                     | Keep                        | Product-specific control surface                                                                                                                                                   |
| Core gateway                           | `src/gateway/**`                                                                                                | Keep                        | Core control plane                                                                                                                                                                 |
| Agent runtime                          | `src/agents/**`                                                                                                 | Keep                        | Tool orchestration and model execution                                                                                                                                             |
| Routing/sessions                       | `src/routing/**`, `src/sessions/**`                                                                             | Keep                        | Stable context + isolation                                                                                                                                                         |
| WhatsApp channel                       | `src/web/auto-reply/**`, `src/whatsapp/**`                                                                      | Keep                        | v1 channel requirement                                                                                                                                                             |
| Internal webchat                       | `src/web/**`, relevant `src/gateway/**` webchat methods                                                         | Keep                        | desktop/browser UX                                                                                                                                                                 |
| Desktop Electron shell                 | `apps/desktop-electron/**`                                                                                      | Keep                        | desktop-first local control surface for v1                                                                                                                                         |
| Senior Mantis vision docs              | `docs/sm/VISION.md`, Senior Mantis section in `README.md`, desktop runbook in `apps/desktop-electron/README.md` | Keep                        | keeps product direction + local testing flow explicit for solo fork development                                                                                                    |
| UI package                             | `ui/**`                                                                                                         | Keep                        | Control UI and chat surfaces                                                                                                                                                       |
| Core config/infra                      | `src/config/**`, `src/infra/**`                                                                                 | Keep                        | runtime plumbing                                                                                                                                                                   |
| Brand naming surfaces                  | user-facing CLI/help/onboarding/status copy                                                                     | Keep (HolyOps rename first) | establish HolyOps identity while keeping compatibility aliases during staged migration                                                                                             |
| HolyOps CLI alias                      | `holyops.mjs`, `package.json` bin map                                                                           | Keep                        | makes HolyOps the primary user-facing command while preserving `seniormantis` compatibility                                                                                        |
| Internal `openclaw` identifiers        | package names, internal script ids, env key prefixes                                                            | Defer                       | migrate after v1 parity to avoid high-risk cross-cutting breaks                                                                                                                    |
| Multi-channel CLI                      | `src/cli/channels-cli.ts` and non-v1 sub-CLIs                                                                   | Defer                       | remove after Senior Mantis onboarding is stable                                                                                                                                    |
| Senior Mantis gateway command surface  | `src/sm/cli/program/register-gateway.ts`                                                                        | Keep (minimal)              | keep only `gateway run` + `gateway status` in SM runner; exclude non-v1 gateway subcommands                                                                                        |
| Onboarding channel chooser             | `src/commands/onboard-channels.ts`, `src/wizard/onboarding.ts`                                                  | Keep                        | Senior Mantis runtime now filters onboarding to WhatsApp-only, disables plugin-catalog install paths, and sanitizes onboarding defaults/overrides to prevent non-v1 channel bypass |
| Plugin channels                        | `extensions/**`                                                                                                 | Drop                        | not needed in v1 (staged: non-v1 channel plugins runtime-disabled in Senior Mantis guardrails)                                                                                     |
| Mobile apps                            | `apps/ios/**`, `apps/android/**`                                                                                | Drop                        | out of scope v1                                                                                                                                                                    |
| macOS native app                       | `apps/macos/**`                                                                                                 | Drop                        | replaced by Electron                                                                                                                                                               |
| Channel implementations (non-WhatsApp) | `src/telegram/**`, `src/discord/**`, `src/slack/**`, `src/signal/**`, `src/imessage/**`, etc                    | Drop                        | reduce surface area and maintenance (runtime-disabled in Senior Mantis guardrails first)                                                                                           |
| Complex plugin management              | `src/plugins/**`                                                                                                | Defer                       | likely removable after message/gateway flows are re-wired                                                                                                                          |
| Non-v1 docs                            | `docs/channels/**` (except WhatsApp references)                                                                 | Drop                        | product docs should be Senior Mantis specific                                                                                                                                      |
| Packaging scripts (mobile/mac native)  | related scripts under `scripts/`                                                                                | Drop                        | not needed for Electron path                                                                                                                                                       |
| Desktop run scripts                    | root `package.json` (`desktop:dev`, `desktop:start`)                                                            | Keep                        | local developer entrypoint for desktop MVP                                                                                                                                         |
| Fly deployment docs/artifacts          | `docs/install/fly.md`, `fly.toml`, `fly.private.toml`                                                           | Drop                        | out of scope for desktop-first local v1 (removed)                                                                                                                                  |

## Staged runtime prune log (no deletions)

- 2026-02-17: `src/gateway/server-http.ts`
  - rationale: skip Slack HTTP route handling in Senior Mantis mode to keep active runtime channel wiring aligned to v1 scope.
- 2026-02-17: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/renderer/renderer.js`
  - rationale: enforce Senior Mantis config/state paths in desktop launcher and inject config token into dashboard URL to avoid legacy OpenClaw auth drift (`1008 unauthorized`) during local v1 flows.
- 2026-02-17: `src/channels/plugins/index.ts`
  - rationale: filter runtime channel plugin listing to Senior Mantis v1 channel set (`whatsapp`, `webchat`) so gateway channel/status/logout surfaces cannot expose non-v1 channel plugins.
- 2026-02-17: `src/config/schema.ts`
  - rationale: filter Senior Mantis config schema channel metadata to v1 channels so Control UI hint/help payloads do not advertise non-v1 channel targets.
- 2026-02-17: `src/config/validation.ts`
  - rationale: reject non-v1 channel keys/heartbeat targets during plugin-aware config validation in Senior Mantis mode to keep config writes aligned with v1 runtime scope.
- 2026-02-17: `src/sm/cli/program/build-program.ts`, `src/sm/cli/program/register-status-health-sessions.ts`
  - rationale: avoid SM-only CLI help output directing users to OpenClaw docs; point to local `docs/sm/*` during forked v1 development.
- 2026-02-19: `src/agents/openclaw-tools.ts`, `src/agents/tools/holyops-video-tool.ts`, `src/agents/tools/holyops-business-tool.ts`
  - rationale: add HolyOps-only workflow tools for personal creator ops while keeping default OpenClaw tool surface unchanged outside HolyOps mode.
- 2026-02-19: `src/sm/adapters/*`
  - rationale: introduce simple JSON adapter contract (video/business) for CLI-first personal workflow integrations without broad framework abstraction.
- 2026-02-19: `apps/desktop-electron/main.mjs`, `apps/desktop-electron/preload.cjs`, `apps/desktop-electron/renderer/*`
  - rationale: add desktop quick-actions for HolyOps-first workflows (video/business) while preserving explicit side-effect confirmation and local-first defaults.

## Deletion log (completed)

- 2026-02-16: removed `docs/install/fly.md`
  - rationale: Fly deployment docs are out of v1 desktop-first local scope.
- 2026-02-16: removed `fly.toml`
  - rationale: cloud deployment artifact not needed for local-first v1 runtime.
- 2026-02-16: removed `fly.private.toml`
  - rationale: cloud deployment artifact not needed for local-first v1 runtime.
