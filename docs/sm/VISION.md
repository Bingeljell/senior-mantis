# Senior Mantis Vision (v1)

Last updated: 2026-02-16

## Product direction

Senior Mantis is a focused assistant fork optimized for seniors and caregivers.

v1 scope is intentionally narrow:

1. Desktop-first app experience (Electron shell as primary control surface).
2. WhatsApp as the primary messaging channel.
3. Local web UI for transparent status/control.
4. Guided onboarding with safe, explicit side-effect confirmations.

## Safety-first defaults

1. `gateway.mode=local`
2. loopback bind for local surfaces
3. explicit confirmations for side-effecting desktop actions
4. no autonomous outbound actions by default

## v1 constraints

1. Remove non-v1 channel and plugin surfaces in staged cleanup passes.
2. Keep OpenClaw internals where required for runtime stability until parity is achieved.
3. Prefer user-facing Senior Mantis naming now; defer risky internal identifier renames.

## Current desktop testing target

1. Start desktop app locally on macOS.
2. Start local gateway from desktop app and verify loopback/local web UI.
3. Run onboarding from desktop app and complete WhatsApp setup.
4. Verify status/health/sessions views update in-app.
