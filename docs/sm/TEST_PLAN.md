# Senior Mantis Test Plan

## Test levels

1. Unit tests for product defaults and command registration.
2. Integration tests for onboarding, gateway lifecycle, and WhatsApp routing.
3. E2E smoke tests from install to first successful chat.

## Must-pass checks for v1

1. `seniormantis --help` shows reduced command surface.
2. `seniormantis onboard --install-daemon` completes on clean machine.
3. `seniormantis gateway status` reports healthy after onboarding.
4. WhatsApp inbound message produces a response in same chat.
5. Dashboard opens and connects with local auth.
6. Desktop shell flow (`apps/desktop-electron`):

- launches locally
- explicit confirmation appears before gateway start/stop and onboarding launch
- status/health/sessions snapshots render
- local web UI embeds and reloads
- activity log shows resolved CLI mode/command
- gateway start returns actionable error if CLI binary is missing

7. Manual email workflow:

- read/summarize works
- draft works
- send requires explicit confirmation

8. Guided web workflow:

- open page
- summarize page
- guided navigation instruction response

9. Voice setup:

- mic/speaker test path executes
- disabled voice path does not block onboarding

## Regression checks

1. Senior Mantis runner does not expose `channels` command in help.
2. Non-v1 command families are absent from default workflows.
3. State/config writes go under `~/.seniormantis` when no explicit override is set.
4. In Senior Mantis mode, disallowed channel plugins do not load at plugin-loader boundary.

## Suggested command suite

1. `pnpm tsgo`
2. `pnpm test -- --run src/sm/env.test.ts`
3. `pnpm test -- --run src/sm/cli/program/build-program.test.ts`
4. `pnpm exec vitest run src/plugins/loader.test.ts src/channels/plugins/catalog.test.ts src/sm/channel-policy.test.ts`
5. Targeted gateway + WhatsApp integration smoke checks in CI environment.
