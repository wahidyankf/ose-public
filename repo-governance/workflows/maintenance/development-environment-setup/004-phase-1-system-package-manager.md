---
description: "Phase 1: install and update Homebrew (macOS) or apt (Linux), including the Brewfile shortcut for Homebrew-managed dependencies."
when_to_use: "Use when bootstrapping the system package manager on a fresh machine."
---

# Phase 1: System Package Manager (Sequential)

Install the system package manager needed for subsequent tool installations.

## 1.1 Install Homebrew (macOS only)

**Condition**: `{input.platform} == macos`

```bash
# Check if Homebrew is installed
brew --version

# If not installed:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Success criteria**: `brew --version` returns a version string.

**On failure**: Follow manual instructions at <https://brew.sh>.

**Alternative**: After installing Homebrew, you can install all Homebrew-managed dependencies
at once using the `Brewfile` at the repository root:

```bash
brew bundle
```

This installs Go, jq, dotnet, pyenv, asdf, Clojure CLI, and Flutter. Tools managed by other
installers (Volta, SDKMAN, rustup) still need separate installation in subsequent phases.

## 1.2 Update system package manager

```bash
# macOS
brew update

# Linux (Debian/Ubuntu)
sudo apt-get update
```

**Success criteria**: Package index updated without errors.
