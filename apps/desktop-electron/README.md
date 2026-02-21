# HolyOps Desktop (Electron)

Minimal desktop shell for local HolyOps workflows on macOS.

## What it does

- Starts/stops a local gateway process (`bind=loopback`, port `18789`) after explicit confirmation.
- Opens setup in a terminal window after explicit confirmation.
- Opens interactive onboarding in a terminal window after explicit confirmation.
- Runs desktop diagnostics from the app (`Run Diagnostics`) using `scripts/smoke-desktop-local.sh`.
- Shows status/health/sessions snapshots.
- Uses browser-only dashboard opening (`Open Browser Dashboard`) for the local web UI.
- Surfaces first-run setup hints when status checks detect missing config.

## Prerequisites

- Node `22.12+`
- `pnpm` `10.x`
- Root dependencies installed (`pnpm install`)
- HolyOps/Senior Mantis dist entry available (`pnpm build` if missing)
- Electron package dependencies installed (`pnpm --dir apps/desktop-electron install`)

## Run locally on macOS

From repo root:

```bash
pnpm install
pnpm build
node holyops.mjs setup
pnpm --dir apps/desktop-electron install
pnpm desktop:dev
```

## Non-GUI smoke check

Run this before `pnpm desktop:dev` to verify desktop dependencies + HolyOps CLI wiring:

```bash
scripts/smoke-desktop-local.sh
```

- Default behavior is read-only and exits with an actionable error if setup/config is missing.
- To allow setup from this script when config is missing, use:

```bash
scripts/smoke-desktop-local.sh --with-setup
```

## Fast local test flow

1. Start the desktop app with `pnpm desktop:dev`.
2. Click `Run Setup` and complete setup in Terminal (first run).
3. Click `Run Diagnostics` and confirm diagnostics output is successful.
4. Click `Start Gateway` and accept confirmation.
5. Confirm gateway status shows `Running`.
6. Click `Run Onboarding` and accept confirmation.
7. Complete onboarding in Terminal and verify WhatsApp connection.
8. Return to desktop app and click `Refresh` on Status/Health/Sessions.
9. If browser dashboard says `unauthorized`, run:
   - `node holyops.mjs dashboard --no-open`
   - copy the `#token=...` URL and reconnect in dashboard settings.

## Expected desktop states

- `Gateway` card should show `Running (desktop-managed) ...` after successful start.
- `Health` should return JSON output (not gateway closed/connection errors).
- `Sessions` should return JSON output with at least default/main keys after setup.
- `Local Web UI` URL card should show a reachable dashboard URL, and browser dashboard should connect once token is configured.

## CLI resolution behavior

- Preferred mode: repo CLI (`node holyops.mjs ...`) when repo runtime deps and dist entry are present.
- Fallback mode: global `holyops` command if repo mode fails with module-resolution errors.
- Desktop launcher always sets `OPENCLAW_STATE_DIR` + `OPENCLAW_CONFIG_PATH` to HolyOps compatibility paths by default (`~/.seniormantis`, `~/.seniormantis/seniormantis.json`) to avoid accidental OpenClaw config reuse.
- Override global command path with `SM_CLI_COMMAND` (binary path).
- Override repo Node runtime command with `SM_NODE_COMMAND` (default auto-detects `node` under Electron).
- Override state/config paths with `SM_STATE_DIR` and `SM_CONFIG_PATH`.
- Override UI path with `SM_GATEWAY_UI_PATH` (defaults to config `gateway.controlUi.basePath`, else `/`).
- Override dashboard token with `SM_GATEWAY_TOKEN` (otherwise uses `OPENCLAW_GATEWAY_TOKEN` env if set, then `gateway.auth.token` from HolyOps config).

```bash
SM_CLI_COMMAND=/usr/local/bin/holyops pnpm desktop:dev
# optional:
SM_NODE_COMMAND=/opt/homebrew/bin/node pnpm desktop:dev
SM_STATE_DIR=$HOME/.seniormantis pnpm desktop:dev
SM_CONFIG_PATH=$HOME/.seniormantis/seniormantis.json pnpm desktop:dev
SM_GATEWAY_UI_PATH=/ui pnpm desktop:dev
SM_GATEWAY_TOKEN=replace-with-token pnpm desktop:dev
```

## Notes and troubleshooting

- This is an MVP shell, not a packaged release.
- Onboarding launches in your system terminal for interactive prompts.
- If gateway start fails with `ENOENT`, install or point `SM_CLI_COMMAND` to a valid `holyops` binary.
- If setup/onboarding opens a terminal and reports an unexpected runtime command, set `SM_NODE_COMMAND` to your Node binary path.
- If status/health commands fail with missing `dist/entry-seniormantis`, run `pnpm build`.
- If status/health or gateway launch reports missing config, run `holyops setup` (or click `Run Setup` in the desktop app).
- If browser dashboard is blank or 404s, verify local gateway is running and check `gateway.controlUi.basePath` (or set `SM_GATEWAY_UI_PATH`).
- If dashboard shows `disconnected (1008): unauthorized`, generate/read the gateway token and reconnect:
  - `node holyops.mjs dashboard --no-open`
  - `node holyops.mjs doctor --generate-gateway-token`
