# Plan: Native Development Environment Setup Improvements

**Status**: In Progress
**Created**: 2026-04-04

## Overview

The native development environment setup works well (19/19 tools pass doctor) but has friction
points: doctor is diagnose-only (no auto-install), Hugo is checked despite being legacy, Playwright
browsers aren't verified, `.env` bootstrapping requires a prior backup, Homebrew dependencies aren't
declarative, the postinstall rebuilds rhino-cli unnecessarily, and 9 of 19 tools have no version
pinning.

This plan implements 8 improvements to reduce onboarding friction, remove dead weight, close
bootstrap gaps, and tighten version consistency — all while keeping the native (non-Docker)
development workflow.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) - Detailed requirements, gaps, and acceptance criteria
- [Technical Documentation](./tech-docs.md) - Implementation approach per improvement
- [Delivery Plan](./delivery.md) - Phased checklist

## Improvement Summary

| #   | Improvement                                              | Effort  | Impact                             | Phase |
| --- | -------------------------------------------------------- | ------- | ---------------------------------- | ----- |
| 1   | `doctor --fix` (auto-install missing tools)              | Medium  | Eliminates 90% of manual setup     | 1     |
| 2   | Drop Hugo from doctor                                    | Small   | Removes dead weight                | 2     |
| 3   | `rhino-cli env init` (create `.env` from `.env.example`) | Small   | Closes fresh-setup gap             | 3     |
| 4   | Add Playwright browsers to doctor                        | Small   | Catches a real failure mode        | 4     |
| 5   | Add `Brewfile` for declarative Homebrew deps             | Trivial | Accelerates Homebrew install phase | 5     |
| 6   | `doctor --scope minimal`                                 | Medium  | Quality of life for focused devs   | 6     |
| 7   | Fix `postinstall` rhino-cli caching                      | Trivial | Saves ~4s per npm install          | 7     |
| 8   | Pin more tool versions                                   | Small   | Prevents subtle version drift      | 8     |

## Context

### Current State

- `rhino-cli doctor` checks 19 tools, reads versions from config files, reports ok/warning/missing
- Doctor is diagnose-only — no install capability
- `npm run doctor` rebuilds rhino-cli from source every time (`--skip-nx-cache`)
- Hugo is still checked despite oseplatform-web migrating to Next.js
- Playwright browsers are not checked by doctor
- 18 apps have `.env.example` files but no command to bootstrap `.env` from them
- No `Brewfile` — Homebrew deps are installed manually per the 620-line workflow
- 9 of 19 tools have `(no version requirement)` — any version accepted

### Affected Files

**Primary** (rhino-cli Go code):

- `apps/rhino-cli/internal/doctor/tools.go` — tool definitions
- `apps/rhino-cli/internal/doctor/checker.go` — check logic
- `apps/rhino-cli/internal/doctor/checker_test.go` — unit tests
- `apps/rhino-cli/cmd/doctor.go` — CLI command (add `--fix`, `--scope` flags)
- `apps/rhino-cli/cmd/env.go` (or new file) — `env init` subcommand

**Governance**:

- `governance/development/workflow/native-first-toolchain.md` — architectural decision record
  (why native package managers, not Terraform/Ansible/Docker Dev Containers)

**Secondary**:

- `package.json` — fix postinstall script
- `Brewfile` (new) — declarative Homebrew dependencies
- `governance/workflows/infra/development-environment-setup.md` — update to reference new commands
- `docs/how-to/hoto__setup-development-environment.md` — update setup guide
