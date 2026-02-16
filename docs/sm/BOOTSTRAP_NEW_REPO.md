# Bootstrap New Non-Fork Repo

This guide creates a clean-history Senior Mantis repository from curated files.

## 1. Create new repository

```bash
mkdir seniormantis
cd seniormantis
git init
```

## 2. Copy curated files from current workspace

Copy at minimum:

- `package.json`
- `pnpm-lock.yaml`
- `tsconfig*.json`
- `tsdown.config.ts`
- `seniormantis.mjs`
- `src/sm/**`
- `src/entry-seniormantis.ts`
- `apps/desktop-electron/**` (desktop MVP shell)
- runtime dependencies needed by that path (gateway/agents/config/infra/web/whatsapp/ui)
- `docs/sm/**`
- `README.md` Senior Mantis fork section (or equivalent root runbook)

If you want top-level `pnpm` workspace commands for desktop app development, add `apps/desktop-electron` to `pnpm-workspace.yaml`.

## 3. Install and build

```bash
pnpm install
pnpm build
```

## 4. Validate core flow

```bash
node dist/entry-seniormantis.js --help
node dist/entry-seniormantis.js gateway status
```

## 5. Add first commit

```bash
git add .
git commit -m "feat: bootstrap Senior Mantis base runtime"
```

## 6. Push to new remote

```bash
git remote add origin <new-repo-url>
git branch -M main
git push -u origin main
```

## 7. Start next implementation session

In your first prompt, include:

- "Use `docs/sm/HANDOFF.md` as source of truth."
- current milestone target
- whether to prioritize Electron shell or onboarding flow first

## 8. Brand-first rename checklist (new repo)

After the first runnable bootstrap, perform staged rename work:

- user-facing first: CLI help text, onboarding text, docs/product copy should say "Senior Mantis"
- internal second: package/module/env identifiers that still use `openclaw`
- keep temporary compatibility aliases only where migration requires them
- run checks after each rename slice to avoid broad breakage
