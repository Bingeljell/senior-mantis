# Senior Mantis Desktop (Electron)

Minimal desktop shell for local Senior Mantis workflows on macOS.

## What it does

- Starts/stops a local gateway process (`bind=loopback`, port `18789`) after explicit confirmation.
- Opens setup in a terminal window after explicit confirmation.
- Opens interactive onboarding in a terminal window after explicit confirmation.
- Shows status/health/sessions snapshots.
- Embeds local web UI in-app (`http://127.0.0.1:18789` by default, or configured `gateway.controlUi.basePath`).
- Surfaces first-run setup hints when status checks detect missing config.

## Prerequisites

- Node `22.12+`
- `pnpm` `10.x`
- Root dependencies installed (`pnpm install`)
- Senior Mantis dist entry available (`pnpm build` if missing)
- Electron package dependencies installed (`pnpm --dir apps/desktop-electron install`)

## Run locally on macOS

From repo root:

```bash
pnpm install
pnpm build
node seniormantis.mjs setup
pnpm --dir apps/desktop-electron install
pnpm desktop:dev
```

## Fast local test flow

1. Start the desktop app with `pnpm desktop:dev`.
2. Click `Run Setup` and complete setup in Terminal (first run).
3. Click `Start Gateway` and accept confirmation.
4. Confirm gateway status shows `Running`.
5. Click `Run Onboarding` and accept confirmation.
6. Complete onboarding in Terminal and verify WhatsApp connection.
7. Return to desktop app and click `Refresh` on Status/Health/Sessions.

## CLI resolution behavior

- Preferred mode: repo CLI (`node seniormantis.mjs ...`) when repo runtime deps and dist entry are present.
- Fallback mode: global `seniormantis` command if repo mode fails with module-resolution errors.
- Override global command path with `SM_CLI_COMMAND` (binary path).
- Override repo Node runtime command with `SM_NODE_COMMAND` (default auto-detects `node` under Electron).
- Override UI path with `SM_GATEWAY_UI_PATH` (defaults to config `gateway.controlUi.basePath`, else `/`).

```bash
SM_CLI_COMMAND=/usr/local/bin/seniormantis pnpm desktop:dev
# optional:
SM_NODE_COMMAND=/opt/homebrew/bin/node pnpm desktop:dev
SM_GATEWAY_UI_PATH=/ui pnpm desktop:dev
```

## Notes and troubleshooting

- This is an MVP shell, not a packaged release.
- Onboarding launches in your system terminal for interactive prompts.
- If gateway start fails with `ENOENT`, install or point `SM_CLI_COMMAND` to a valid `seniormantis` binary.
- If setup/onboarding opens a terminal and reports an unexpected runtime command, set `SM_NODE_COMMAND` to your Node binary path.
- If status/health commands fail with missing `dist/entry-seniormantis`, run `pnpm build`.
- If status/health or gateway launch reports missing config, run `seniormantis setup` (or click `Run Setup` in the desktop app).
- If the embedded UI is blank or 404s, verify local gateway is running and check `gateway.controlUi.basePath` (or set `SM_GATEWAY_UI_PATH`).
