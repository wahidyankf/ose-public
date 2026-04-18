---
title: How to Set Up Your Development Environment
description: Install and configure all tools needed to develop, test, and contribute to the open-sharia-enterprise monorepo
category: how-to
tags:
  - onboarding
  - toolchain
  - setup
  - development
  - docker
  - volta
created: 2026-04-04
updated: 2026-04-18
---

# How to Set Up Your Development Environment

This guide walks you through installing every tool required to work on any project in this
monorepo. After completing it, your pre-commit hooks, pre-push hooks, unit tests, integration
tests, and E2E tests will all work locally.

> **Note**: The polyglot demo apps (`a-demo-be-*`, `a-demo-fe-*`) were extracted to
> [ose-primer](https://github.com/wahidyankf/ose-primer) on 2026-04-18. If you need to set
> up Elixir, Clojure, Java, Kotlin, Python, Rust, or Dart toolchains for those apps, see
> the setup guide in the `ose-primer` repository.

## Overview

The monorepo contains projects in TypeScript, Go, and F#. Each language has its own runtime,
but they all share the same Nx build system and git hooks.

**Two setup paths**:

- **Minimal** — Node.js + Go + Docker + jq. Covers git hooks, TypeScript/Go projects, and
  basic E2E tests.
- **Full** — All tools checked by doctor. Required if you also work on `organiclever-be`
  (F#/Giraffe) which needs the .NET SDK.
- **Automated** — Run `npm run doctor -- --fix` to auto-install missing tools. Use
  `npm run doctor -- --fix --dry-run` to preview what would be installed.

## Prerequisites

- **macOS** (primary) or **Linux** (Debian/Ubuntu). Windows is not supported.
- **Admin access** to install system packages.
- **~5 GB disk space** for all runtimes, Docker images, and Playwright browsers.

## Quick Start (Minimal Setup)

If you only work on TypeScript or Go projects, this is all you need:

```bash
# 1. Install Homebrew (macOS — skip if already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install core tools
brew install jq
# Docker Desktop: download from https://docs.docker.com/desktop/setup/install/mac-install/

# 3. Install Volta (Node.js version manager)
curl https://get.volta.sh | bash
source ~/.zshrc

# 4. Install Go
brew install go

# 5. Clone and bootstrap
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
npm install          # Installs deps + git hooks
npx playwright install  # Installs test browsers

# 6. Verify
npm run doctor
```

If doctor shows all green, you are ready. Run `npx nx affected -t typecheck lint test:quick spec-coverage`
to verify the full pre-push pipeline.

## Full Setup

### Step 1: System Package Manager

**macOS**:

```bash
# Install or update Homebrew
brew --version || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew update
```

**Linux (Debian/Ubuntu)**:

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl git
```

### Step 2: Git and Docker

Git is usually pre-installed on macOS (via Xcode Command Line Tools):

```bash
git --version || xcode-select --install
```

Install Docker Desktop from <https://docs.docker.com/desktop/setup/install/mac-install/>
(macOS) or Docker Engine from <https://docs.docker.com/engine/install/> (Linux).

After installation, verify:

```bash
docker --version
docker compose version
docker info   # Confirms daemon is running
```

Install jq (needed for Claude Code hooks and shell scripts):

```bash
# macOS
brew install jq

# Linux
sudo apt-get install -y jq
```

### Step 3: Node.js via Volta

[Volta](https://volta.sh/) pins Node.js and npm versions per-project. The pinned versions
live in `package.json` under `volta.node` and `volta.npm`.

```bash
curl https://get.volta.sh | bash
source ~/.zshrc   # or source ~/.bashrc
```

After installation, entering the repo directory auto-installs the correct versions:

```bash
cd open-sharia-enterprise
node --version   # Expected: v24.13.1
npm --version    # Expected: 11.10.1
```

If the versions don't match, force install:

```bash
volta install node@24.13.1
volta install npm@11.10.1
```

### Step 4: Go

Required for `rhino-cli`, `ayokoding-cli`, `oseplatform-cli`,
and `libs/golang-commons`.

```bash
# macOS
brew install go

# Linux — download from https://go.dev/dl/
```

Verify the installed version meets or exceeds the `go` directive in `apps/rhino-cli/go.mod`:

```bash
go version
```

### Step 5: .NET SDK

Required for `organiclever-be` (F#/Giraffe).

The required major version is in `apps/organiclever-be/global.json`.

```bash
# macOS
brew install dotnet

# Linux — https://learn.microsoft.com/en-us/dotnet/core/install/linux

dotnet --version
```

### Step 6: Clone and Bootstrap

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd open-sharia-enterprise
npm install
```

`npm install` does three things:

1. Installs all npm dependencies
2. Runs `npm run doctor` automatically (postinstall script) to verify your toolchain
3. Sets up Husky git hooks (pre-commit, commit-msg, pre-push)

### Step 7: Restore Environment Files

`.env` files are gitignored but required by many apps. If you have a previous backup,
restore them:

```bash
# Restore .env files from default backup location (~/ose-open-env-backup)
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env restore --force

# Also restore uncommitted config files (AI tool settings, Docker overrides, etc.)
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env restore --force --include-config
```

If this is a fresh setup with no backup, copy `.env.example` to `.env` in each app you
plan to work on and fill in the required values.

To create a backup for future use:

```bash
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env backup --include-config
```

### Step 8: Install Playwright Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit (~500 MB total). Required for all `*-e2e`
projects.

On Linux, also install system dependencies:

```bash
npx playwright install-deps
```

## Verification

### Check all tools

```bash
npm run doctor
```

Expected output: all tools show `ok` status. If any show `missing`, revisit the corresponding
step above.

### Test git hooks

**Pre-commit** (runs on every commit — Prettier, markdownlint, lint-staged):

```bash
# Make a trivial change and commit
git commit --allow-empty -m "test: verify pre-commit hook"
# If it succeeds, the hook works. Undo:
git reset HEAD~1
```

**Pre-push** (runs on every push — typecheck, lint, test:quick, spec-coverage):

```bash
# Dry-run: execute the same targets pre-push would
npx nx affected -t typecheck lint test:quick spec-coverage
```

This also warms the Nx cache, making subsequent pushes fast.

### Test integration tests

```bash
# Run the OrganicLever backend's integration suite (uses Docker + PostgreSQL)
nx run organiclever-be:test:integration
```

If this passes, Docker and database integration work correctly.

## Troubleshooting

### Doctor reports a tool as "missing"

The doctor command shows exactly which tool is missing, its expected version, and where the
version requirement comes from (e.g., `package.json → volta.node`). Reinstall the tool using
the matching step above.

### Pre-push hook times out

The pre-push hook runs `typecheck`, `lint`, `test:quick`, and `spec-coverage` for affected
projects. On first run with a cold cache, this takes several minutes. Warm the cache first:

```bash
npx nx affected -t typecheck lint test:quick spec-coverage
```

Subsequent pushes reuse cached results and complete in seconds.

### Volta not switching Node.js version

Ensure Volta's shims are first in your PATH:

```bash
echo $PATH | tr ':' '\n' | head -5
# ~/.volta/bin should appear before /usr/local/bin
```

If not, add to your shell profile:

```bash
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"
```

### Docker "permission denied" on Linux

Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

### Integration test fails with "port already in use"

Another Docker stack or service is using port 5432. Stop it:

```bash
docker compose -f infra/dev/<other-stack>/docker-compose.yml down
# Or find the process:
lsof -i :5432
```

### Playwright "browser not found"

Re-install browsers:

```bash
npx playwright install
```

On Linux, also run:

```bash
npx playwright install-deps
```

## Version Reference

All version requirements are auto-detected by `npm run doctor` from these config files:

| Tool       | Version Source                             |
| ---------- | ------------------------------------------ |
| Node.js    | `package.json` → `volta.node`              |
| npm        | `package.json` → `volta.npm`               |
| Go         | `apps/rhino-cli/go.mod` → `go` directive   |
| .NET       | `apps/organiclever-be/global.json` → `sdk` |
| Hugo       | (legacy — no active config file)           |
| Docker, jq | Any (no pinned version)                    |

Never hardcode version numbers in scripts — always read from these source-of-truth files.

## Related Documentation

- [Development Environment Setup Workflow](../../governance/workflows/infra/development-environment-setup.md) —
  Granular workflow with phases and success criteria
- [Reproducible Environments](../../governance/development/workflow/reproducible-environments.md) —
  Volta, npm, Docker reproducibility practices
- [Code Quality Convention](../../governance/development/quality/code.md) — Git hooks and
  automated formatting
