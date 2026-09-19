# .env backup scripts for rhino-cli

> **Stable v0.4 routing:** References below to the retired in-tree Rhino implementation are historical evidence only. ose-public has no product source at that location; promote any still-relevant product work to the upstream Rhino repository and use its current stable commands.

One-line summary: scripted backup/restore of the gitignored `.env*` files rhino-cli local development
depends on, so a lost or clobbered env is recoverable.

> Idea, added 2026-07-21 (original capture undated).

## Problem / context

rhino-cli local development relies on gitignored `.env*` files that, by policy, never enter git. That
policy is correct, but it also means a deleted or overwritten `.env` has no recovery path.
**Data point:** 0 backup/restore tooling exists today, so a clobbered `.env` is unrecoverable (no
baseline measured — the failure simply hasn't been counted).

## Why now

The env-file-access guardrails make ad-hoc manual copying awkward (agents cannot touch real `.env*`),
so a sanctioned scripted path is the clean way to make backups routine.

## Prior art / precedents

- **Secrets and Env Standards convention** — the no-secrets-in-git policy that makes `.env*`
  gitignored and therefore unrecoverable, the gap this idea fills.
  [convention](../../../repo-governance/conventions/security/secrets-and-env-standards.md)
- **Reproducible Environments practice** — `.env.example` plus lockfile pinning already give
  reproducibility for everything except the real secret values a backup would cover.
  [reproducible-environments](../../../repo-governance/development/workflow/reproducible-environments.md)
- **SOPS** — prior art for safely storing and recovering `.env`-style secret files, the heavier
  secrets-manager approach this idea deliberately scopes out. [sops](https://github.com/getsops/sops)

## Proposed direction (sketch)

- A script under `scripts/` (exempt from the agent env-file guardrail) that backs up and restores
  rhino-cli's `.env*` to a gitignored local location.
- Never commits, never prints secret values — just moves files between gitignored paths.

## Rough scope & non-goals

In scope: backup/restore of gitignored env files for local rhino-cli dev.

Out of scope (for now): a secrets manager; syncing env across machines; touching `.env.example` (which
is committed and needs no backup).

## Risks & open questions

- Where do backups live so they stay uncommitted and off any world-readable path? (open)
- Scope to rhino-cli only, or generalize to all apps' `.env*`? (open)

## What success looks like + promotion signal

Success: a clobbered rhino-cli `.env` is restorable from a local backup in one command, with no secret
ever entering git. Ready to promote once the backup-location question is settled.
