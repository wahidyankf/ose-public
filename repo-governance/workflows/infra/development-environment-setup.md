---
description: "Guides installing and verifying every toolchain needed for pre-commit, pre-push, integration, and E2E work in this monorepo."
when_to_use: "Use for new developer onboarding, a fresh machine/OS setup, or recovering a broken toolchain."
---

# Development Environment Setup Workflow

**Purpose**: Guide a developer (or AI assistant helping a developer) through installing and
configuring every tool required to work on any project in this monorepo — from git hooks to
integration tests to E2E tests.

> **Note**: The polyglot demo apps (`a-demo-be-*`, `a-demo-fe-*`) were removed from this repo on
> 2026-04-18. The optional-scope phases below survive for languages this repo may still need; a phase
> with no project in this repo is safe to skip.

**When to use**: new developer onboarding, a fresh machine/OS install, recovering a broken
toolchain, or verifying an environment after adding a new project language.

## Goal and Termination

**Goal**: Set up a complete local development environment with all toolchains required for pre-commit, pre-push, integration tests, and E2E tests across all projects

**Termination**: npm run doctor reports all tools OK and nx affected -t test:quick passes for all projects

## Inputs

- **`platform`** (enum: macos, linux, optional, default `macos`) — Target operating system
- **`scope`** (enum: full, minimal, optional, default `full`) — full: all 19 tools for all projects; minimal: core tools only (Node.js, Go, Docker, jq)

## Outputs

- **`doctor-status`** (enum: all-ok, warnings, missing) — Result of npm run doctor after setup
- **`tools-installed`** (number) — Count of tools successfully installed and verified

## Contents

- [Execution Mode](./development-environment-setup/execution-mode.md) — manual orchestration.
- [Tool Inventory](./development-environment-setup/tool-inventory.md) — the 16 built-in tools, plus
  how `doctor.extra-tools` adds more.
- [Quick Start: doctor --fix](./development-environment-setup/quick-start-doctor-fix.md) — one-command setup.

### Phases

- [Phase 1: System Package Manager](./development-environment-setup/phase-1-system-package-manager.md) — Homebrew/apt.
- [Phase 2: Core Tools](./development-environment-setup/phase-2-core-tools.md) — Git, Docker, jq.
- [Phase 3: Node.js Ecosystem](./development-environment-setup/phase-3-nodejs-ecosystem.md) — Volta, Node, npm.
- [Phase 4: Go Ecosystem](./development-environment-setup/phase-4-go-ecosystem.md) — Go toolchain.
- [Phase 6: Python Ecosystem](./development-environment-setup/phase-6-python-ecosystem.md) — full scope only.
- [Phase 7: Rust Ecosystem](./development-environment-setup/phase-7-rust-ecosystem.md) — full scope only.
- [Phase 8: Elixir/Erlang Ecosystem](./development-environment-setup/phase-8-elixir-erlang-ecosystem.md) — full scope only.
- [Phase 9: .NET Ecosystem](./development-environment-setup/phase-9-dotnet-ecosystem.md) — full scope only.
- [Phase 10: Dart/Flutter Ecosystem](./development-environment-setup/phase-10-dart-flutter-ecosystem.md) — full scope only.
- [Phase 11: Repository Bootstrap](./development-environment-setup/phase-11-repository-bootstrap.md) — clone, install, env, doctor.
- [Phase 12: Playwright Browsers](./development-environment-setup/phase-12-playwright-browsers.md) — E2E browser install.
- [Phase 13: Verification](./development-environment-setup/phase-13-verification.md) — end-to-end smoke test.

### Reference

- [Termination Criteria](./development-environment-setup/termination-criteria.md) — success/partial/failure.
- [Minimal Scope Quick Reference](./development-environment-setup/minimal-scope-quick-reference.md) — minimal-scope table.
- [Notes](./development-environment-setup/notes.md) — pinning, idempotency, platform notes.
- [Principles Respected](./development-environment-setup/principles-implemented-respected.md) — governance.
- [Related Documentation](./development-environment-setup/related-documentation.md) — how-to guide, governance docs.
- [Related Agents](./development-environment-setup/related-agents.md) — rules-checker follow-up.

## Related Workflows

- [CI Quality Gate](../ci/ci-quality-gate.md) — Validates CI/CD compliance (assumes toolchain
  is already set up)

## Conventions Implemented/Respected

- **[Workflow Identifier Convention](../meta/workflow-identifier.md)**: Follows standard workflow
  structure with YAML frontmatter
- **[Reproducible Environments](../../development/workflow/reproducible-environments.md)**: Implements
  the environment reproducibility practices defined in governance
- **[Code Quality Convention](../../development/quality/code.md)**: Verification steps ensure
