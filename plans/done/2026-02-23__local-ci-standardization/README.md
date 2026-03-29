# Local CI Standardization: Nx Targets

**Status**: Done
**Date**: 2026-02-23
**Priority**: High
**Standard**: [governance/development/infra/nx-targets.md](../../../governance/development/infra/nx-targets.md)

## Overview

Bring all 10 apps and the workspace `nx.json` into full compliance with the Nx Target Standards
convention. The convention defines canonical target names, mandatory targets per project type, and
caching rules. All project.json files were written before the standard was finalized — they use
non-standard names and are missing required targets.

**Scope**: `nx.json` + `package.json` (workspace root) + 10 `project.json` files in `apps/` + `.husky/pre-push` + `apps/organiclever-fe/package.json` + `apps/organiclever-fe/vitest.config.ts` (new file)

**No documentation changes needed**: READMEs were already updated by `repo-governance-maker` in a
prior session to reference canonical target names. Only `project.json`, `nx.json`, and
`package.json` files require changes.

## Files

- [requirements.md](./requirements.md) — gap analysis per project with acceptance criteria
- [tech-docs.md](./tech-docs.md) — exact JSON changes needed for every file
- [delivery.md](./delivery.md) — ordered implementation checklist

## Gap Summary

| App                        | Type        | Existing Targets                                                  | Missing / Non-Standard                                                                                                                                       |
| -------------------------- | ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nx.json`                  | workspace   | `build`, `test` ⚠️, `lint` (targetDefaults)                       | Remove legacy `tasksRunnerOptions`; missing `test:quick`, `test:unit`, `typecheck`, `test:integration`, `test:e2e` defaults; has non-standard `test` default |
| `package.json`             | workspace   | `"test"` ⚠️ → `nx run-many -t test`, `"affected:test"` ⚠️         | Both scripts reference non-standard `test`; update to `test:quick`                                                                                           |
| `ayokoding-cli`            | Go CLI      | `build`, `test:quick`, `run`, `install`                           | Missing `lint`                                                                                                                                               |
| `rhino-cli`                | Go CLI      | `build`, `test:quick`, `run`, `install`                           | Missing `lint`                                                                                                                                               |
| `ayokoding-web`            | Hugo site   | `dev`, `build`, `clean`, `test:quick`, `run-pre-commit`           | Missing `lint`                                                                                                                                               |
| `oseplatform-web`          | Hugo site   | `dev`, `build`, `clean` ⚠️                                        | Missing `test:quick`, `lint`; `clean` incomplete                                                                                                             |
| `organiclever-fe`          | Next.js     | `dev`, `build`, `start`, `lint` ⚠️                                | `lint`→oxlint (replaces `next lint`); missing `test:quick`, `typecheck`, `test:unit`, `test:integration`; add vitest + devDeps                               |
| `organiclever-be`          | Spring Boot | `build`, `serve` ⚠️, `test` ⚠️, `lint`                            | `serve`→`dev`, `test`→`test:unit`; missing `test:quick`, `start`, `outputs` on `build`                                                                       |
| `organiclever-app`         | Flutter     | `install`, `dev`, `build:web`, `test` ⚠️, `test:quick`, `lint` ⚠️ | `test`→`test:unit`; `lint` removed (redundant with `typecheck`); missing `typecheck`, `dependsOn` on `test:quick`                                            |
| `organiclever-fe-e2e`      | Playwright  | `install`, `e2e` ⚠️, `e2e:ui` ⚠️, `e2e:report` ⚠️                 | `e2e`→`test:e2e`, `e2e:ui`→`test:e2e:ui`, `e2e:report`→`test:e2e:report`; missing `lint`, `test:quick`                                                       |
| `organiclever-be-e2e`      | Playwright  | `install`, `e2e` ⚠️, `e2e:ui` ⚠️, `e2e:report` ⚠️                 | Same as `organiclever-fe-e2e`                                                                                                                                |
| `organiclever-app-web-e2e` | Playwright  | `install`, `e2e` ⚠️, `e2e:ui` ⚠️, `e2e:report` ⚠️                 | Same as `organiclever-fe-e2e`                                                                                                                                |
| `.husky/pre-push`          | hook        | `nx affected -t test:quick` only                                  | Add `nx affected -t typecheck` and `nx affected -t lint`; fixes diagram bug (lint shown but never blocked push)                                              |

## Critical Finding

`oseplatform-web` has **no `test:quick` target** — it is silently excluded from the pre-push hook
(`nx affected -t test:quick`) and the PR merge gate. This is the highest-priority fix.

`organiclever-fe` also has **no `test:quick` target** — same consequence.

All three Playwright E2E projects use **`e2e`** instead of **`test:e2e`** — their existing tests
cannot be invoked via the workspace-level `nx affected -t test:e2e` cron pattern.

## Git Workflow

This plan uses **Trunk Based Development** — all changes commit directly to `main`.

Commit after each phase using [Conventional Commits](../../../governance/development/workflow/commit-messages.md)
format. Suggested messages per phase:

- Phase 1: `chore(infra): update nx.json targetDefaults and package.json test scripts`
- Phase 2: `chore(infra): add test:quick and vitest to oseplatform-web and organiclever-fe`
- Phase 3: `chore(infra): add lint target to Hugo sites and Go CLIs`
- Phase 4: `chore(infra): standardize Spring Boot nx targets`
- Phase 5: `chore(infra): standardize Flutter nx targets`
- Phase 6: `chore(infra): standardize Playwright E2E nx targets`
- Phase 7: `chore(infra): update pre-push hook with typecheck and lint gates`

Small, focused commits make it easy to revert individual phases if issues arise.

## Prerequisites

Before executing Phase 3 (Go CLI lint), ensure the following tools are installed:

- **golangci-lint**: `curl -sSfL https://golangci-lint.run/install.sh | sh -s -- -b $(go env GOPATH)/bin`
  (or `brew install golangci-lint`)
- **Flutter SDK**: required for Phase 5 Flutter standardization
- **Java 25** and **Maven**: required for Phase 4 Spring Boot standardization
- **Go 1.21+**: required for Phase 3 Go CLI lint verification
- **Node.js 24.11.1**: pinned by Volta; required for Phase 2 and Phase 6 vitest and oxlint targets

All tools except `golangci-lint` are required by the existing codebase and should already be present.

## Non-Goals

- Changing test frameworks or build tools
- Adding test coverage where none exists today
- Changing the logic of any existing command (only renaming and adding targets)
- Updating README or documentation files (already done)
- Removing ESLint devDependencies from `organiclever-fe` (`eslint`, `eslint-config-next`) after
  replacing `next lint` with oxlint — ESLint cleanup is a separate concern and should not block
  CI standardization
