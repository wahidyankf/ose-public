---
description: "Phase 11: clone, run guarded npm install, restore or initialize local env files, then run Doctor to verify every tool."
when_to_use: "Use when bootstrapping the repository itself after language toolchains are installed."
---

# Phase 11: Repository Bootstrap (Sequential)

**Depends on**: Phases 1-3 (minimum), Phases 4-10 (for full scope)

## 11.1 Clone the repository

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
```

**Condition**: Skip if already cloned.

## 11.2 Install npm dependencies

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
```

This also triggers Husky to install git hooks (pre-commit, commit-msg, pre-push).

**Success criteria**: the guarded `npm install` exits 0. `.husky/pre-commit`, `.husky/commit-msg`,
`.husky/pre-push` exist.

## 11.3 Restore environment files

`.env` files are gitignored but required by many apps. If you have a previous backup
(from `./rhino env backup`), restore them now:

```bash
# Restore .env files from default backup location (~/ose-public-env-backup)
./rhino env restore --dir local-tmp/env-backup --apply --force

# Include uncommitted config files (AI tool settings, Docker overrides, direnv, etc.)
./rhino env restore --dir local-tmp/env-backup --apply --force
```

**Condition**: Skip if this is a brand-new setup with no previous backup. Instead, use
`env init` to bootstrap `.env` files from `.env.example` templates:

```bash
./rhino env init --apply
```

This creates `.env` files from all `.env.example` templates in `infra/dev/`. Use `--force`
to overwrite existing files.

**Success criteria**: Restored files appear in their original app directories (e.g.,
`apps/ayokoding-www/.env.local`, `apps/organiclever-be/.env`).

**On failure**: If no backup exists, copy `.env.example` to `.env` in each app you plan to
work on and fill in the required values.

## 11.4 Run doctor to verify all tools

```bash
npm run doctor
```

**Success criteria**: All tools show `ok` status. No `missing` entries.

**On failure**: Review doctor output. Each missing tool maps to one of the phases above.
Install the missing tool and re-run doctor.
