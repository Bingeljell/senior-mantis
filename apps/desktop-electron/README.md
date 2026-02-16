# Senior Mantis Desktop (Electron)

Minimal desktop shell for local Senior Mantis workflows.

## What it does

- Starts/stops a local gateway process (`bind=loopback`, port `18789`) after explicit confirmation.
- Opens interactive onboarding in a terminal window after explicit confirmation.
- Shows status/health/sessions snapshots.
- Embeds local web UI (`http://127.0.0.1:18789/ui`) in-app.

## Run locally

From repo root:

```bash
pnpm install
pnpm desktop:dev
```

If you only want this app:

```bash
pnpm --dir apps/desktop-electron install
pnpm --dir apps/desktop-electron dev
```

## Notes

- This is an MVP shell, not a packaged release.
- It assumes `seniormantis.mjs` exists at repo root.
- Onboarding is launched in your system terminal for interactive prompts.
