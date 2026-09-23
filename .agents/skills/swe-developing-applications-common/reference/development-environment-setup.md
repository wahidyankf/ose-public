# Common Development Workflow — Development Environment Setup

Before implementing any changes, ensure the development environment is ready. This prevents wasted time on toolchain issues mid-implementation.

## Quick Verification

```bash
# Verify every declared toolchain (read-only; accepts no arguments)
rtk npm run doctor

# Only if doctor reports a missing or drifted toolchain: provision, then verify again
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply
rtk npm run doctor
```

`npm run doctor` already carries its own HIPPO guard; never wrap it again. It rejects every
argument with exit 2, so the retired `--fix`, `--dry-run`, and `--scope` forms no longer work.

## Environment File Management (Rhino)

The repository uses Rhino for environment file management:

```bash
# Initialize .env files from .env.example templates
rtk ./rhino env init --apply

# Backup current .env files
rtk ./rhino env backup --dir local-tmp/env-backup --apply

# Restore .env files from backup
rtk ./rhino env restore --dir local-tmp/env-backup --apply --force
```

## When to Run Environment Setup

- **Immediately after creating a git worktree** — from that new worktree's root, run BOTH
  `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` (dependencies plus Husky hook
  activation) AND `rtk npm run doctor`, in order, provisioning only on reported drift. Another
  checkout's setup and
  `postinstall`'s tolerant `doctor || true` are not substitutes. See
  [Worktree Toolchain Initialization](../../../../repo-governance/development/workflow/worktree-setup.md)
- **Not merely after re-entering an existing worktree** — rerun setup only when missing or drifted
  dependencies are actually observed
- **Before starting any implementation work** — verify tools and env files are ready
- **After pulling changes** that modify `package.json`, `go.mod`, `.tool-versions`, or other version config
- **After switching between projects** that use different toolchains
- **When any build/test/lint command fails with a "not found" or version error** — run `rtk npm run doctor` first

## Full Setup Guide

For complete step-by-step environment setup (new machine, fresh OS, or broken toolchain), see:
[Development Environment Setup Workflow](../../../../repo-governance/workflows/infra/development-environment-setup.md)
