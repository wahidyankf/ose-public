---
title: "Native-First Toolchain Management"
description: Architectural decision to use native package managers and rhino-cli doctor instead of Terraform, Ansible, or Docker Dev Containers for development environment setup
category: explanation
subcategory: development
tags:
  - development
  - toolchain
  - doctor
  - environment
  - architecture-decision
created: 2026-04-04
---

# Native-First Toolchain Management

This document records the architectural decision to use native toolchain management (`rhino-cli doctor` and package managers) instead of infrastructure-as-code tools (Terraform, Ansible, Docker Dev Containers) for development environment setup. The open-sharia-enterprise monorepo spans 18 toolchains across 11 languages (Node.js, Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, C#), making toolchain management a significant architectural concern.

## Principles Implemented/Respected

This practice implements/respects the following core principles:

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Native package managers (`brew install`, `volta install`, `cargo install`) provide idempotent tool installation without requiring external state files, DSLs, or convergence engines. Adding Terraform, Ansible, or Docker Dev Containers introduces infrastructure complexity that solves fleet management problems this project does not have.

- **[Reproducibility First](../../principles/software-engineering/reproducibility.md)**: Version pinning via declarative config files (`package.json`, `go.mod`, `.tool-versions`, `Cargo.toml`, `pubspec.yaml`) combined with `rhino-cli doctor` verification ensures every developer machine converges to the same toolchain state. The check-diff-apply pattern provides the same guarantees as IaC tools without the overhead.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: `rhino-cli doctor --fix` automates the entire toolchain installation and verification process. Developers run a single command to detect drift and converge to the desired state, eliminating manual setup steps and reducing onboarding friction.

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Each tool's required version lives in a language-native config file that developers already understand. `rhino-cli doctor` makes the full toolchain state visible with a single command, producing clear pass/fail output for every required tool.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Reproducible Environments](./reproducible-environments.md)**: This decision extends the reproducible environments convention from Node.js/npm (Volta pinning, lockfiles) to the full 19-toolchain stack. `rhino-cli doctor` serves as the unified verification layer across all language ecosystems.

## Context

The monorepo requires developers to install and maintain toolchains for Node.js, Go, Java (Maven + SDKMAN), Rust, Elixir (Mix), Python (pyenv), .NET, Dart (Flutter), Clojure (Leiningen), Kotlin, and C#. The question was evaluated: should Docker Dev Containers, Terraform, or Ansible manage this development environment?

## Decision

**Use native toolchain management via `rhino-cli doctor` and package managers.** Do NOT use Terraform, Ansible, or Docker Dev Containers for development environment setup.

## Rationale

### 1. Package Managers Are Already Idempotent

Every major package manager handles re-installation gracefully:

| Command                        | Re-run Behavior                 | Idempotent? | Notes                  |
| ------------------------------ | ------------------------------- | ----------- | ---------------------- |
| `brew install go`              | Fetches manifest, skips install | Yes         | Network call but no-op |
| `volta install node@X`         | Silent no-op                    | Yes         |                        |
| `cargo install cargo-llvm-cov` | Downloads index, skips          | Yes         | Slow but safe          |
| `asdf plugin add X`            | "already added"                 | Yes         |                        |
| `pyenv install X`              | "already exists"                | Yes         |                        |
| `curl get.volta.sh \| bash`    | Re-installs                     | Yes         | Noisy but safe         |
| `rustup-init -y`               | Non-interactive install         | Yes         | Must use `-y` flag     |
| `brew install --cask flutter`  | Skips if installed              | Yes         | Must use `--cask`      |
| `sudo apt-get install -y X`    | "already newest version"        | Yes         | Ubuntu/Linux           |
| `sudo snap install X`          | "already installed"             | Yes         | Ubuntu/Linux           |

No external state file or convergence engine is needed when the underlying tools already guarantee idempotency.

### 2. State Is the Installed Binaries

`which go` + `go version` IS the state query. Terraform's state file would be a stale cache of something `rhino-cli doctor` can detect in seconds. The filesystem and PATH are the single source of truth for "what is installed," and querying them directly is simpler and more accurate than maintaining a parallel state file.

### 3. Single Developer Machine, Not a Fleet

Terraform and Ansible solve fleet management across hundreds of servers. This repository targets one macOS laptop per developer. The overhead of a DSL, provider plugins, or inventory files provides zero value for a single-machine target.

### 4. Docker Dev Containers Have Unacceptable Performance Cost on macOS

Nineteen toolchains produce a 15-30 GB Docker image. macOS Docker bind-mount I/O runs 2-5x slower than native filesystem access. Pre-commit hooks that complete in 5 seconds natively take 30-60 seconds inside a container. Developers disable hooks out of frustration, which degrades code quality -- a worse outcome than not using Docker at all.

### 5. Git Worktrees Are Incompatible with Dev Containers

The repository uses git worktrees for AI agent isolation (`.claude/worktrees/`). Worktrees are host-level filesystem constructs that do not map cleanly to Docker volumes. Each worktree would require its own container, multiplying the resource cost and eliminating the lightweight isolation that worktrees provide.

### 6. `rhino-cli doctor` Already Provides the Check-Diff-Apply Pattern

The `doctor` command maps directly to familiar IaC concepts:

| `rhino-cli` Command      | IaC Equivalent                   | Purpose                         |
| ------------------------ | -------------------------------- | ------------------------------- |
| `doctor`                 | `terraform plan`                 | Detect drift from desired state |
| `doctor --fix`           | `terraform apply`                | Converge to desired state       |
| `doctor --fix --dry-run` | `terraform plan` (without apply) | Preview changes before applying |

Config files serve as the desired state declarations:

- `package.json` (volta field) declares Node.js and npm versions
- `go.mod` declares Go version
- `.tool-versions` declares asdf-managed tool versions
- `Cargo.toml` declares Rust edition
- `pubspec.yaml` declares Dart/Flutter SDK constraints

## Guidance for Future Decisions

### DO

- Use `rhino-cli doctor` for toolchain verification and auto-install
- Use version managers (Volta, SDKMAN, asdf, pyenv, rustup) for language version pinning
- Use `Brewfile` for declarative Homebrew dependencies
- Use Docker for integration tests (PostgreSQL via docker-compose) and CI pipelines

### DO NOT

- Introduce Terraform, Ansible, Nix, or similar IaC tools for dev environment setup
- Create Docker Dev Containers (`.devcontainer/`) as the primary development mode
- Add external state files for tracking installed tools

## Platform Support

`doctor --fix` supports both **macOS** and **Ubuntu/Linux**. Platform detection uses `runtime.GOOS`.

Install commands differ per platform:

- **macOS**: Homebrew (`brew install`), Homebrew casks (`brew install --cask`)
- **Ubuntu**: apt (`sudo apt-get install`), snap (`sudo snap install --classic`), curl scripts (Volta, SDKMAN, rustup, pyenv, Clojure)
- **Cross-platform**: Volta, SDKMAN, rustup, asdf, cargo — same install commands on both platforms

Ubuntu requires system build dependencies before compiling some toolchains:

```bash
sudo apt-get install -y build-essential autoconf curl git \
  libncurses-dev libssl-dev libreadline-dev libsqlite3-dev \
  libbz2-dev libffi-dev zlib1g-dev
```

The `Brewfile` is macOS-only (harmless on Linux — `brew` command not available).

## Git Worktree Compatibility

All commands work correctly from git worktrees. `findGitRoot()` uses `os.Stat` to detect `.git`, which succeeds for both directories (main repo) and files (worktrees). All config file paths are constructed relative to the repo root via `filepath.Join(repoRoot, ...)`, which resolves correctly in both contexts.

This is important because the repository uses git worktrees heavily for AI agent isolation (`.claude/worktrees/`).

Per the [Worktree Toolchain Initialization](./worktree-setup.md) practice, `npm run doctor -- --fix` is required as the second step of a mandatory two-step init (after `npm install`) whenever a worktree is created or entered. Doctor's idempotency (documented in the Rationale section above) is what makes running it unconditionally at worktree entry cheap enough to codify as a rule — when the toolchain is healthy, `doctor --fix` is a no-op pass; when it has drifted, it actively converges.

## Implementation Notes

### Shell Restart Caveat

Volta, SDKMAN, and rustup modify shell profile files. After installing any of these tools, the fixer must `source` the relevant init script before installing dependent tools:

```bash
# After Volta install
source ~/.zshrc  # Or detect shell dynamically

# After SDKMAN install
source "$HOME/.sdkman/bin/sdkman-init.sh"

# After rustup install
source "$HOME/.cargo/env"
```

### `--dry-run` Mode

`doctor --fix --dry-run` prints what would be installed without executing. This preview capability gives developers confidence before applying changes, equivalent to reviewing a Terraform plan before applying.

### Idempotency Contract

When implementing `doctor --fix`, each install command must be non-interactive and idempotent. The table in the Rationale section documents the re-run behavior of each package manager. Pay particular attention to `rustup`, which requires the `-y` flag for non-interactive mode, and Flutter, which requires `brew install --cask flutter` rather than `brew install flutter`.

## When to Revisit This Decision

Revisit this architectural decision if any of the following conditions change:

- **Team scale**: The team grows to 5+ developers with frequent onboarding, making the setup friction cost significant enough to justify containerization overhead
- **Docker performance**: macOS Docker bind-mount performance reaches native parity, eliminating the primary objection to Dev Containers
- **Cloud development**: A cloud development environment (GitHub Codespaces) becomes necessary for external contributors who cannot install toolchains locally
- **Toolchain count**: The toolchain count exceeds what `rhino-cli doctor` can reasonably manage as a flat list of checks

## Related Documentation

- [Reproducible Environments](./reproducible-environments.md) - Broader reproducibility practices (Volta, lockfiles, Docker for services)
- [Development Environment Setup](../../workflows/infra/development-environment-setup.md) - Workflow for setting up a development environment
- [Native Dev Setup Improvements Plan](../../../plans/done/2026-04-04__native-dev-setup-improvements/README.md) - Completed plan that implemented `doctor --fix` and related improvements
