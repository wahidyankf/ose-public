---
description: The principles and conventions native-first toolchain management implements, the context that prompted the decision, and the decision itself.
when_to_use: Use when tracing why native toolchain management was chosen over Terraform, Ansible, or Docker Dev Containers.
---

# Principles, Conventions, Context, and Decision

## Principles Implemented/Respected

This practice implements/respects the following core principles:

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Native package managers (`brew install`, `volta install`, `cargo install`) provide idempotent tool installation without requiring external state files, DSLs, or convergence engines. Adding Terraform, Ansible, or Docker Dev Containers introduces infrastructure complexity that solves fleet management problems this project does not have.

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: Version pinning via declarative config files (`package.json`, `Cargo.toml`, `.csproj`) combined with `./rhino toolchain validate` verification ensures every developer machine converges to the same toolchain state. The check-diff-apply pattern provides the same guarantees as IaC tools without the overhead.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: `npm run doctor -- --fix` automates the entire toolchain installation and verification process. Developers run a single command to detect drift and converge to the desired state, eliminating manual setup steps and reducing onboarding friction.

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Each tool's required version lives in a language-native config file that developers already understand. `./rhino toolchain validate` makes the full toolchain state visible with a single command, producing clear pass/fail output for every required tool.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Reproducible Environments](../reproducible-environments.md)**: This decision extends the reproducible environments convention from Node.js/npm (Volta pinning, lockfiles) to the full toolchain stack. `./rhino toolchain validate` serves as the unified verification layer across all language ecosystems.

## Context

The monorepo requires developers to install and maintain toolchains for Node.js, Rust, and .NET/F#. The question was evaluated: should Docker Dev Containers, Terraform, or Ansible manage this development environment?

## Decision

**Use native toolchain management via `./rhino toolchain validate` and package managers.** Do NOT use Terraform, Ansible, or Docker Dev Containers for development environment setup.
