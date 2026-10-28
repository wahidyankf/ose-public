---
description: "Phase 2: install Git, rootless Podman with its Compose provider, and jq — the foundational tools required before anything else."
when_to_use: "Use when installing the core tools a fresh environment needs before language ecosystems."
---

# Phase 2: Core Tools (Sequential)

Install foundational tools required before anything else, then the file formatters that no
language phase covers.

## 2.1 Install Git

```bash
# macOS (usually pre-installed with Xcode CLT)
git --version || xcode-select --install

# Linux
sudo apt-get install -y git
```

**Success criteria**: `git --version` returns a version string.

## 2.2 Install Podman and the Compose provider

The repository runs containers with rootless Podman and the explicit `podman-compose` provider. Do not
install Docker Compose for repository use.

```bash
# macOS — install Podman from the official release page, verifying the package digest and signature
# https://podman.io/docs/installation
# Create a machine only when none exists, with rootless mode; never replace an existing machine
podman machine list
podman machine init --rootful=false   # Only when no machine exists
podman machine start

# Linux (Ubuntu) — install the Podman version reviewed for the ubuntu/resolute/amd64 runner tuple in
# .github/actions/setup-podman/action.yml. Other releases and architectures have no reviewed pin yet,
# so do not install Podman there from this guide.
sudo apt-get install -y "podman=5.7.0+ds2-3build1"

# Compose provider, in an isolated pipx environment (requires pipx and python3-venv)
sudo apt-get install -y pipx python3-venv
pipx install --python "$(command -v python3)" podman-compose==1.6.0
export PODMAN_COMPOSE_PROVIDER="$(command -v podman-compose)"

# Verify
podman --version
podman-compose --version
podman info --format json | jq -e '.host.security.rootless == true'
```

**Success criteria**: `podman --version` and `podman-compose --version` both return version strings
(`podman-compose` reports `1.6.0`). The rootless assertion exits 0 for the selected connection.

**On failure**: Confirm the selected connection is rootless with `podman system connection list`, and
start a stopped machine with `podman machine start`. Do not run repository workflows with `sudo` or
against a rootful engine.

## 2.3 Install jq

```bash
# macOS
brew install jq

# Linux
sudo apt-get install -y jq
```

**Success criteria**: `jq --version` returns a version string. Required for coding agent hooks.

## 2.4 Install the shell, OpenTofu, and C formatters

**Condition**: `{input.scope} == full`

`scripts/format-staged` runs `shfmt`, `tofu fmt`, and `clang-format` on staged `*.sh`, `*.tf`, and
`*.c`/`*.h` files, and all three are declared under `toolchains` in `repo-config.yml`.

```bash
# macOS
brew install shfmt opentofu clang-format

# Linux
sudo apt-get install -y shfmt clang-format
# OpenTofu — https://opentofu.org/docs/intro/install/
```

**Success criteria**: `shfmt --version`, `tofu --version`, and `clang-format --version` return
version strings. `bash` and `curl`, also declared, ship with macOS and Ubuntu.

## 2.5 Install the shell, Dockerfile, and workflow linters

**Condition**: `{input.scope} == full`

The `shellcheck`, `hadolint`, and `actionlint` gates run these binaries on staged shell scripts,
Dockerfiles, and GitHub Actions workflows; all three are declared under `toolchains`.

```bash
# macOS
brew install shellcheck hadolint actionlint

# Linux
sudo apt-get install -y shellcheck
# hadolint — https://github.com/hadolint/hadolint/releases
# actionlint — https://github.com/rhysd/actionlint/releases
```

**Success criteria**: `shellcheck --version`, `hadolint --version`, and `actionlint --version`
return version strings. CI pins the versions in `.github/actions/setup-lint-tools`.
