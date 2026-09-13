# Plan: Add .env Backup and Restore Commands to rhino-cli

**Status**: Done
**Created**: 2026-03-30
**Completed**: 2026-03-31

## Overview

Add two new subcommands to rhino-cli under a new `env` command group:

- **`env backup`** — Recursively find all `.env*` files in the repository and copy them to a backup
  directory (default: `~/ose-env-bkup`), preserving the relative directory structure.
- **`env restore`** — Copy backed-up `.env*` files from the backup directory back into the
  repository, restoring them to their original relative paths.

Environment files (`.env`, `.env.local`, `.env.development`, etc.) are gitignored and contain
secrets that can be lost during branch switches, clean clones, or accidental deletions. This feature
provides a simple, repository-aware backup mechanism.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) — Functional requirements, edge cases, and acceptance criteria
- [Technical Documentation](./tech-docs.md) — Architecture, file discovery logic, and implementation
  details
- [Delivery Plan](./delivery.md) — Phased checklist and validation steps

## Why This Matters

1. **Secret recovery**: `.env*` files are gitignored — if deleted or corrupted, secrets must be
   manually re-gathered from Vercel, Vault, teammates, or provider dashboards.
2. **Branch safety**: Switching branches or running `git clean` can wipe `.env*` files with no
   recovery path.
3. **Team onboarding**: A backed-up env folder can be shared (securely) to bootstrap a new
   developer's local environment instantly.
4. **Consistency with rhino-cli's mission**: rhino-cli is the "Repository Hygiene & INtegration
   Orchestrator" — env file management is squarely within its scope.

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
