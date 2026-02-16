# Senior Mantis Architecture

## Runtime topology

```text
Desktop (Electron) / CLI / Web UI
            |
            v
      Senior Mantis Gateway
            |
   -------------------------
   |                       |
WhatsApp channel      Pi runtime + tools
                           |
                     Models / Providers
```

## Components

1. Entry/bootstrap

- `src/entry-seniormantis.ts`
- `seniormantis.mjs`

2. Product defaults

- `src/sm/env.ts`
- Sets isolated state/config defaults under `~/.seniormantis`.

3. CLI runner

- `src/sm/cli/run-main.ts`
- `src/sm/cli/program/build-program.ts`

4. Desktop shell

- `apps/desktop-electron/*`
- wraps local gateway/web UI and onboarding/status/health/sessions actions

5. Core gateway and sessions (reused)

- `src/gateway/*`
- `src/routing/*`
- `src/sessions/*`

6. Channel surface for v1

- WhatsApp path: `src/web/auto-reply/*`, `src/whatsapp/*`
- Internal webchat channel for UI operations.

7. Agent runtime

- `src/agents/*`
- Tool orchestration and model provider execution.

## Trust boundaries

1. Inbound messages are untrusted.
2. Gateway enforces access and routing before execution.
3. Tool calls are policy-gated.
4. Outbound side effects (email send, edits, browser interactions) require explicit user intent in v1.

## State model

1. State root: `~/.seniormantis` (default).
2. Config file: `~/.seniormantis/seniormantis.json`.
3. Sessions/transcripts still use existing gateway/session internals.

## Security defaults (target)

1. `gateway.bind = loopback`
2. DM pairing/allowlist active by default
3. no autonomous email send in v1
4. explicit confirmation for high-risk actions

## Migration note

This architecture intentionally wraps existing OpenClaw internals first.
Deletion/pruning is phase-2 once the Senior Mantis path is stable and test-covered.
Brand migration follows the same staged approach: user-facing naming first, internal identifier renames after parity.
