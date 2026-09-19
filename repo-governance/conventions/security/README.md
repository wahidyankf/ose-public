---
description: Repository security conventions governing agent behaviour and data protection
when_to_use: Use before a change touches configuration, credentials, or environment files, to find the applicable security rule.
---

# Security Conventions

Read these conventions before a change might touch configuration, credentials, or environment files.
They protect people and the project by keeping sensitive values out of tracked content and by making
the safe path explicit.

**Governance**: All conventions in this directory implement the [Core Principles](../../principles/README.md)
(Layer 1) and are part of the [six-layer governance architecture](../../repository-governance-architecture.md).

## Conventions

- [Secrets and Environment-Variable Standards](./secrets-and-env-standards.md) — The authoritative
  hub for how this repository handles secrets and environment variables — naming convention, layout,
  annotation format, startup validation, tooling (./rhino env family), tiered injection standard
  (env-injection section in repo-config.yml), storage tiers, and the env-contract drift guard. Use
  when you need any rule about handling secrets or environment variables in this repository —
  naming, storage, injection, or agent access.
- [No Secrets in Committed Files](./no-secrets-in-committed-files.md) — Hard iron rule — no system
  secret may enter any git-tracked file. Full standards in secrets-and-env-standards.md. Use when
  checking whether a value is safe to commit to this repository.
- [Environment File Access Convention](./env-file-access.md) — AI agents must not directly read,
  write, or edit exactly .env.prod or .env.stag; every other real .env\* file is agent-readable.
  Full policy in secrets-and-env-standards.md. Use when an AI agent needs to know whether it may
  directly open a specific .env\* file.
- [Public Outbound Safety](./public-outbound-safety.md) — Requires every outbound artifact from a public
  repository to pass a safety screen first, with no allowlist, suppression, or bypass, plus a full read
  of each change before commit, synthetic fixtures, and a disclosure response. Use before any commit,
  push, pull request, comment, release, or published log, when adding a publication surface or writing
  examples or fixtures, and after something unsafe was published.

## Related Documentation

- [Conventions Index](../README.md) — All conventions organized by category
- [Repository Governance Architecture](../../repository-governance-architecture.md) — Six-layer hierarchy
- [Core Principles](../../principles/README.md) — Foundational values governing all conventions
