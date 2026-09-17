---
title: How to Set Up Your Development Environment
description: Install and configure the tools needed to develop and test OSE Public locally
category: how-to
tags:
  - onboarding
  - toolchain
  - setup
  - development
  - docker
  - volta
created: 2026-04-04
---

# How to Set Up Your Development Environment

This guide walks you through installing the tools needed to work on an authorized OSE Public
project locally. After completing it, the repository can verify your toolchain, Git hooks, and the
tests relevant to the project you are changing.

> **Note**: The polyglot demo apps (`a-demo-be-*`, `a-demo-fe-*`) were removed from this repo on
> 2026-04-18. This guide covers only the toolchains this repository actually ships.

## Overview

The monorepo contains projects in TypeScript and F#, plus Rust course-example content under
`apps/ayokoding-www/content/` (no Rust app or lib remains — `rhino-cli`, the last one, was ported
to F# 2026-08-30). Each language has its own runtime, but they all share the same Nx build system
and git hooks.

**Three setup paths**. These name what _you_ install by hand.

- **Minimal** — Node.js + .NET SDK + Docker + jq. Covers git hooks, TypeScript projects, and
  basic end-to-end (E2E) tests. .NET is here rather than in Full because the tool checker
  (`rhino-cli doctor`) is itself an F#/.NET program: `npm install` runs it but discards its exit
  code, so without the .NET SDK the check fails while the install still reports success. The Quick
  Start's final `npm run doctor` keeps that exit code, and so do the Git hooks the install sets up
  — the first `git commit` stops outright.
- **Full** — All tools checked by doctor. Required for working on F# backend apps
  (`organiclever-be`, `ose-be`) or the F# CLI apps (`rhino-cli`, `crane-cli`) themselves. Install
  Rust separately, and only if you are editing a `.rs` file under `apps/ayokoding-www/content/` —
  that is its one remaining local use, formatted by the pre-commit `rustfmt` step.
- **Automated** — Run `npm run doctor -- --fix` to auto-install missing tools. The Doctor wrapper
  detects `--fix` and requests a transactional reservation; checks without that flag remain
  ephemeral. Use `npm run doctor -- --fix --dry-run` to preview what would be installed.

## Prerequisites

- **macOS** (primary) or **Linux** (Debian/Ubuntu). The Linux steps may work in WSL2, but WSL2 is
  neither supported nor verified by this project. Native Windows is not supported.
- **Admin access** to install system packages.
- **~5 GB disk space** for all runtimes, Docker images, and Playwright browsers.

## Quick Start (Minimal Setup)

If you only work on TypeScript projects, this is all you need. The .NET SDK still appears below,
for the reason the Minimal path gives above — the verify step at the end of this block will not
pass without it:

```bash
# 1. Install Homebrew (macOS — skip if already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install core tools
brew install jq
# Docker Desktop: download from https://docs.docker.com/desktop/setup/install/mac-install/

# 3. Install Volta (Node.js version manager)
curl https://get.volta.sh | bash
source ~/.zshrc   # or source ~/.bashrc on Ubuntu

# 4. Install the .NET SDK — required by step 6 and by the Git hooks
brew install dotnet   # Linux: see https://dotnet.microsoft.com/download, or run
                       # `npm run doctor -- --fix` after step 5 to auto-install it
dotnet --version   # Expected: a version line, not "command not found"

# 5. Clone and bootstrap
git clone https://github.com/wahidyankf/ose-public.git
cd ose-public
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install # Installs deps + git hooks
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec playwright -- install # Installs test browsers

# 6. Verify
npm run doctor
```

If doctor shows all green, you are ready. To run the push hook's registry gates and see their output,
use `apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push`. The hook itself runs
`./rhino gate run --surface pre-push`, which screens the push for public safety first.

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
cd ose-public
node --version   # Expected: the `volta.node` value in package.json, prefixed with `v`
npm --version    # Expected: the `volta.npm` value in package.json
```

If the versions don't match, force install by reading the pin rather than copying a version
from this page:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- \
  volta install node@$(node -p "require('./package.json').volta.node")
./hippo run --class transactional --resource-tier standard --disk-path . -- \
  volta install npm@$(node -p "require('./package.json').volta.npm")
```

### Step 4: .NET SDK

Required for `rhino-cli` (an F# CLI) and the F# backends (`organiclever-be`, `ose-be`). The pinned
SDK version lives in `apps/ose-be/global.json` — `repo-config.yml`'s `doctor.dotnet-global-json`
names that file as the source of truth `doctor` reads from.

```bash
# macOS
brew install dotnet

# Linux — run `npm run doctor -- --fix` after step 5 instead of a manual install; it runs the
# official GPG-verified dotnet-install.sh script for you

dotnet --version
```

**Editing AyoKoding's Rust course content?** Install Rust separately — it is no longer needed for
`rhino-cli` or any other app/lib, only for the pre-commit `rustfmt` step over `.rs` files under
`apps/ayokoding-www/content/`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version
```

### Step 5: Clone and Bootstrap

```bash
git clone https://github.com/wahidyankf/ose-public.git
cd ose-public
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
```

The root bootstrap verifies the release pin and cached executable identity before `npm install`
does three things:

1. Installs all npm dependencies
2. Runs `npm run doctor` automatically (postinstall script) to verify your toolchain — but discards
   its exit code, so a failed or skipped check never stops the install
3. Sets up Husky git hooks (pre-commit, commit-msg, pre-push)

### HIPPO local policy and shared coordination

The committed `hippo.local.json.example` is a safe schema-2 reservation example. **Copy it to the
ignored `hippo.local.json` as part of setup**; never commit the copy. Without that file HIPPO falls
back to schema-1 `exclusive`, which counts leases but has no memory dimension at all — a build can
then be admitted on a host that has no memory left to give it.

Then add explicit host-wide caps to **your copy only**. They stay out of the committed example on
purpose: an absolute cap is a statement about one machine, and CI executes the example on runners far
smaller than a workstation, where a workstation-sized cap defers admission with exit `75`.

```json
"coordination": {
  "mode": "reservation",
  "maxCpu": 6,
  "maxMemoryMiB": 16384,
  "maxActiveOwners": 2
}
```

| Field             | Meaning                                                          |
| ----------------- | ---------------------------------------------------------------- |
| `maxCpu`          | Host-wide CPU ceiling across every repository sharing the ledger |
| `maxMemoryMiB`    | Host-wide memory ceiling; must be at least `256`                 |
| `maxActiveOwners` | How many owners may hold a reservation at once; at most `20`     |

Size them from your own machine — roughly half the host is a reasonable start, because the other half
still has to run an editor, a browser, the window server, and the agent processes themselves. The
values above suit a 12-core, 32 GiB machine.

Set them explicitly rather than relying on a profile. A profile's `maxConcurrency` does **not**
survive into reservation mode — the allocated CPU replaces it — so `extends` alone caps nothing.
These fields may only tighten safety; a value that would weaken a compiled floor is rejected at load
time with exit `78`.

A reservation is an admission promise, not a hard RSS limit: the ledger knows what owners _asked
for_, not what they go on to allocate. That is why host pressure thresholds stay authoritative after
a vector fits, and why the caps above are a floor under the problem rather than a solution to it.

Keep the normal per-user HIPPO root so every checkout shares one CPU/memory ledger. Set `HIPPO_ROOT`
only for an explicitly isolated test or separately administered domain, not to make one repository
invisible to the others.

HIPPO exit `73` requires safe disk cleanup. Exit `75` is a temporary capacity, FIFO, lease, or
rollout-coordination deferral: let that attempt exit before retrying it, and never start duplicate
retries. Exit `78` requires configuration or reservation replanning. Do not bypass the guard,
change workload class to gain admission, or delete state whose owner may still be live. See
[Resource-Aware Development](../../repo-governance/development/practice/resource-aware-development.md).

### Step 6: Keep local environment data out of onboarding

Do not restore, copy, or commit a real `.env` file as part of a first checkout. The public
onboarding path does not require private environment values. When an application eventually needs
configuration, read its README and its tracked `.env.example` only; keep real values local and
uncommitted.

### Step 7: Install Playwright Browsers

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec playwright -- install
```

This downloads Chromium, Firefox, and WebKit (~500 MB total). Required for all `*-e2e`
projects.

On Linux, also install system dependencies:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec playwright -- install-deps
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
# Run the staged-file gate without creating a throwaway commit
apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-commit
```

**Pre-push** (delegates to the same gate registry as pre-commit):

```bash
# Run the pre-push gate set without creating a push
apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=pre-push
```

`repo-config.yml` is the source of truth for what that surface carries — a few Nx targets plus a
dozen-odd repository-wide `rhino-cli` checks that `nx affected` never sees. List them rather than
copying a set from this page:

```bash
apps/rhino-cli/scripts/rhino-bin.sh gate list --surface=pre-push
```

### Test Integration tests

```bash
# Run the OrganicLever backend's non-networked local-resource suite
npm exec nx -- run organiclever-be:test:integration
```

If this passes, the app's isolated filesystem and process-environment boundaries work correctly.
Docker-hosted databases and brokers communicate over a network path, so verify them through the
app's E2E stack instead of `test:integration`.

## Troubleshooting

### Doctor reports a tool as "missing"

The doctor command shows exactly which tool is missing, its expected version, and where the
version requirement comes from (e.g., `package.json → volta.node`). Reinstall the tool using
the matching step above.

### Pre-push hook times out

The slow half of the pre-push gate set is its Nx targets: `test:quick` (which itself composes
types/lint, `test:unit`, and every applicable static `test:coverage:*` per project),
`compat:min-version`, and `specs:structure-validation`. On a cold cache this takes a while. Warm
them first:

```bash
./hippo run --class ephemeral --resource-tier standard --disk-path . -- npm exec nx -- \
  affected -t test:quick,compat:min-version,specs:structure-validation
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

This suite publishes PostgreSQL on host port **5434** (the container's own 5432 is remapped), so
the conflict is on 5434 — not on the 5432 that the `infra/dev/ose-app` stack publishes. Find
whatever holds it:

```bash
lsof -i :5434
# If it is another Docker stack, stop that stack:
./hippo run --class transactional --resource-tier standard --disk-path . -- \
  docker compose -f infra/dev/<other-stack>/docker-compose.yml down
```

### Playwright "browser not found"

Re-install browsers:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec playwright -- install
```

On Linux, also run:

```bash
./hippo run --class transactional --resource-tier standard --disk-path . -- npm exec playwright -- install-deps
```

## Version Reference

All version requirements are auto-detected by `npm run doctor` from these config files:

| Tool       | Version Source                                                                                        |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| Node.js    | `package.json` → `volta.node`                                                                         |
| npm        | `package.json` → `volta.npm`                                                                          |
| .NET       | `repo-config.yml` → `doctor.dotnet-global-json` → `sdk.version` (currently `apps/ose-be/global.json`) |
| Docker, jq | Any (no pinned version)                                                                               |

Never hardcode version numbers in scripts — always read from these source-of-truth files.

## Related Documentation

- [Development Environment Setup Workflow](../../repo-governance/workflows/infra/development-environment-setup.md) —
  Granular workflow with phases and success criteria. Its `scope: minimal` parameter is a different
  thing from the Minimal path above: it selects which already-installed tools the checker inspects,
  and its tool set is not the same one
- [Reproducible Environments](../../repo-governance/development/workflow/reproducible-environments.md) —
  Volta, npm, Docker reproducibility practices
- [Code Quality Convention](../../repo-governance/development/quality/code.md) — Git hooks and
  automated formatting
