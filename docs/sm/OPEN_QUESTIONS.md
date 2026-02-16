# Senior Mantis Open Questions

## Product

1. Should v1 support one model provider only in UI, while keeping advanced providers hidden behind an advanced menu?
2. Do we need caregiver/admin mode with remote assist controls in v1?
3. Should WhatsApp onboarding default to one trusted sender, then expand later?

## Safety and policy

1. Which actions require explicit confirmation by default:

- sending email
- executing shell commands
- browser form submission
- file deletion

2. Should confirmations be per-action or session-level temporary approvals?

## UX

1. Do we need a "simple mode" and an "advanced mode" toggle in onboarding?
2. Should voice be on by default after setup or opt-in only?
3. What minimum text size, contrast, and keyboard accessibility rules are mandatory?

## Engineering

1. When to remove plugin system dependencies from message/gateway paths?
2. Which exact non-WhatsApp modules remain in new repo for utility reuse vs deletion?
3. Should we keep protocol compatibility with OpenClaw WS clients, or freeze a Senior Mantis-specific API subset?

## Roadmap

1. v0.2: provider expansion flow and assisted API setup details.
2. v0.3: full browser automation guardrails and approval model.
