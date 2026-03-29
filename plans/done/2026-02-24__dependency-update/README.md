# Dependency Update: Full Repository Audit and Upgrade

**Status**: Done

## Overview

Audit and update all dependencies across every ecosystem in the open-sharia-enterprise monorepo.
The repository spans five package managers and runtimes (NPM, Go, Flutter/Dart, Maven, Hugo).
Each has drifted independently and requires a structured, ecosystem-aware upgrade process
that preserves correctness and does not break running applications.

**Git Workflow**: Work on `main` branch (Trunk Based Development)

**Delivery Type**: Series of small, independently tested commits — one per ecosystem or concern

## Quick Links

- [Requirements](./requirements.md) — Objectives, user stories, acceptance criteria
- [Technical Documentation](./tech-docs.md) — Per-ecosystem strategy, version table, breaking changes
- [Delivery Plan](./delivery.md) — Phased implementation with checkboxes

## Goals

- Establish a verified snapshot of current dependency versions across all five ecosystems
- Update all dependencies to the latest stable releases appropriate for this project
- Normalize inconsistencies (e.g., Go toolchain version mismatch across go.mod files)
- Ensure all lock files are regenerated and consistent after updates
- Validate that every application builds, lints, and passes its test suite after updates
- Document the update methodology so future updates can repeat the process

## Ecosystems in Scope

| Ecosystem      | Apps / Files                                                     | Package Manager       |
| -------------- | ---------------------------------------------------------------- | --------------------- |
| Node.js / NPM  | root workspace, `organiclever-fe`, all `*-e2e` apps              | npm                   |
| Go modules     | `ayokoding-cli`, `rhino-cli`, `ayokoding-web`, `oseplatform-web` | go mod                |
| Flutter / Dart | `organiclever-app`                                               | pub / flutter pub     |
| Java / Maven   | `organiclever-be`                                                | Maven                 |
| Hugo themes    | `ayokoding-web` (Hextra), `oseplatform-web` (PaperMod)           | go mod (Hugo modules) |

## Out of Scope

- **Physically installing runtime tools** (Node.js, Go SDK, Java JDK, Flutter SDK, Hugo binary)
  on developer machines — Volta, sdkman, and system installers handle that automatically once the
  version pins in the repository files are updated.
- Changes to application logic, feature flags, or configuration values unrelated to version bumps.
- Dependency updates inside `apps-labs/` (experimental apps outside Nx).
