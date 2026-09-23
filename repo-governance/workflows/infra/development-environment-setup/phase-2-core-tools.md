---
description: "Phase 2: install Git, Docker Desktop, and jq — the foundational tools required before anything else."
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

## 2.2 Install Docker Desktop

```bash
# macOS — download and install Docker Desktop
# https://docs.docker.com/desktop/setup/install/mac-install/
# After installation, start Docker Desktop from Applications

# Linux — install Docker Engine + Compose plugin
# https://docs.docker.com/engine/install/

# Verify
docker --version
docker compose version
```

**Success criteria**: `docker --version` and `docker compose version` both return version strings.
Docker daemon is running (`docker info` succeeds).

**On failure**: Ensure Docker Desktop is running. On Linux, add user to docker group:
`sudo usermod -aG docker $USER` then log out and back in.

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
