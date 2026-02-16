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
- runtime dependencies needed by that path (gateway/agents/config/infra/web/whatsapp/ui)
- `docs/sm/**`

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
