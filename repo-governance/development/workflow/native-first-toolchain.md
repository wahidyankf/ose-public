---
description: Architectural decision to use native package managers and ./rhino toolchain validate instead of Terraform, Ansible, or Dev Containers.
when_to_use: Use when deciding how to install or verify a toolchain, or evaluating Terraform, Ansible, or Docker Dev Containers.
---

# Native-First Toolchain Management

This document records the architectural decision to use native toolchain management (`./rhino toolchain validate` and package managers) instead of infrastructure-as-code tools (Terraform, Ansible, Docker Dev Containers) for development environment setup. The open-sharia-enterprise monorepo spans multiple toolchains (Node.js, Rust, .NET/F#), making toolchain management a significant architectural concern.

## Contents

- [Principles, Conventions, Context, and Decision](./native-first-toolchain/principles-conventions-context-and-decision.md) — Why native management, and the decision itself.
- [Rationale — Package Managers Through Docker Performance](./native-first-toolchain/rationale-package-managers-through-docker-performance.md) — Idempotency, source of truth, single-machine scope, and Docker's macOS cost.
- [Rationale — Worktrees and the Doctor Pattern](./native-first-toolchain/rationale-worktrees-and-the-doctor-pattern.md) — Worktree incompatibility with containers, the doctor check-diff-apply mapping, and future-decision guidance.
- [Platform Support and Git Worktree Compatibility](./native-first-toolchain/platform-support-and-git-worktree-compatibility.md) — macOS/Ubuntu support and worktree-safe path resolution.

## Related Documentation

- [Reproducible Environments](../workflow/reproducible-environments.md) — broader reproducibility practices (Volta, lockfiles, Docker for services).
- [Development Environment Setup](../../workflows/infra/development-environment-setup.md) — workflow for setting up a development environment.
- Native Dev Setup Improvements Plan — completed plan that implemented `doctor --fix` and related improvements.

## When to Revisit This Decision

Revisit this architectural decision if any of the following conditions change:

- **Team scale**: The team grows to 5+ developers with frequent onboarding, making the setup friction cost significant enough to justify containerization overhead
- **Docker performance**: macOS Docker bind-mount performance reaches native parity, eliminating the primary objection to Dev Containers
- **Cloud development**: A cloud development environment (GitHub Codespaces) becomes necessary for external contributors who cannot install toolchains locally
- **Toolchain count**: The toolchain count exceeds what `./rhino toolchain validate` can reasonably manage as a flat list of checks

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

When implementing `doctor --fix`, each install command must be non-interactive and idempotent. The table in the Rationale section documents the re-run behaviour of each package manager. Pay particular attention to `rustup`, which requires the `-y` flag for non-interactive mode, and Flutter, which requires `brew install --cask flutter` rather than `brew install flutter`.
