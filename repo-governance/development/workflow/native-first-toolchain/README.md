---
description: "Architectural decision to use native package managers and ./rhino toolchain validate instead of Terraform, Ansible, or Dev Containers."
when_to_use: "Read this index to find the right Native-First Toolchain Management child document."
---

# Native-First Toolchain Management

- [Principles, Conventions, Context, and Decision](./principles-conventions-context-and-decision.md) — The principles and conventions native-first toolchain management implements, the context that prompted the decision, and the decision itself. Use when tracing why native toolchain management was chosen over Terraform, Ansible, or Docker Dev Containers.
- [Rationale — Package Managers Through Docker Performance](./rationale-package-managers-through-docker-performance.md) — Why native package managers are already idempotent, why installed binaries are the source of truth, why this is a single-machine problem, and why Docker Dev Containers cost too much on macOS. Use when justifying why native toolchain management beats IaC or containerized dev environments for this monorepo.
- [Rationale — Worktrees and the Doctor Pattern](./rationale-worktrees-and-the-doctor-pattern.md) — Why Docker Dev Containers are incompatible with git worktree isolation, how ./rhino toolchain validate mirrors the IaC check-diff-apply pattern, and guidance for future toolchain decisions. Use when justifying the doctor-based check-diff-apply pattern, or when deciding whether a new tool fits native-first management.
- [Platform Support and Git Worktree Compatibility](./platform-support-and-git-worktree-compatibility.md) — Which platforms doctor --fix supports and how, and why every command already works correctly from a git worktree. Use when setting up doctor on Ubuntu/Linux, or when confirming toolchain commands are worktree-safe.
