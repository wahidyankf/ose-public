# Stack Update Plan

> Bump all runtimes, frameworks, and libraries to latest stable (LTS preferred).
> Fix preexisting issues found during audit. Ensure CI and quality gates pass.

## Documents

| File                           | Purpose                                           |
| ------------------------------ | ------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale and risk assessment            |
| [prd.md](./prd.md)             | Requirements and Gherkin acceptance criteria      |
| [tech-docs.md](./tech-docs.md) | Version table, per-file change map, upgrade notes |
| [delivery.md](./delivery.md)   | Granular task checklist (execute in order)        |

## Scope

All 11 non-E2E apps, 9 E2E apps, and 4 working libs (`web-ui`, `web-ui-token`,
`golang-commons`, `hugo-commons`) in `ose-public`, plus the root workspace and CI
workflows. Covers:

- **Runtime languages**: Node.js, Go, .NET SDK, Erlang/OTP, Rust, Dart/Flutter, Java
- **JS/TS framework & libs**: Next.js, React, TypeScript, Tailwind, Vitest,
  @vitejs/plugin-react, Playwright, Storybook, Effect, XState, tRPC, Zod, Shiki,
  lucide-react, ESLint + react-hooks + typescript-eslint
- **Go tooling**: golangci-lint
- **Build tooling**: Nx, lint-staged, markdownlint-cli2, Prettier, Husky, tsx,
  @hey-api/openapi-ts, @redocly/cli, @stoplight/spectral-cli
- **Java/Spring Boot**: organiclever-be Spring Boot 4.0.4 → 4.0.6 (CVE patches),
  Cucumber 7.34.2 → 7.34.3
- **Machine-level installs**: Go 1.26.3, .NET 10.0.300, Erlang 27.3.4.11, Rust 1.95.0,
  Dart 3.11.6, Java Temurin 25.0.3
- **CI workflows**: stale `go-version: "1.26.0"` pins; missing composite actions
  (`setup-jvm` is critical)
- **Preexisting issues**: stale doctor paths, inconsistent playwright-bdd pins, web-ui
  vitest version mismatch, AGENTS.md `organiclever-be` description, missing CI composite
  actions

## Policy Compliance

This plan complies with the [Dependency Bump Stability & Safety Policy](../../../repo-governance/development/workflow/dependency-bump-policy.md).
Cutoff date: **2026-03-16** (today − 60 days).

| Path                              | Meaning                                              | Examples                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A — LTS**                       | Latest LTS-line patch; recency irrelevant            | Node 24.15.0, Java 25.0.3, .NET 10.0.300, Spring Boot 4.0.6, PostgreSQL 17.10                                                                                                        |
| **B — 60-day stable + CVE-clean** | Latest pre-cutoff version; CVE-clean                 | Go 1.25.8, Rust 1.93.0, TypeScript 5.8.3 (NOT 6.0.3), Tailwind 4.2.1 (NOT 4.3.0), Vitest 4.1.0, Storybook 10.2.10 (DOWNGRADE), ESLint 9.x, Nx 22.5.4, Playwright 1.60.0, Shiki 4.0.2 |
| **C — Security waiver**           | Recent CVE patch required; older versions vulnerable | Next.js 16.2.6, React 19.2.6, mermaid 11.15.0, postcss 8.5.10, Eclipse Temurin 25-jdk Ubuntu base                                                                                    |

## Major Migrations DEFERRED to Future Plans

Versions post-cutoff with no security-override justification — defer until 60-day soak completes:

- **TypeScript 6.0** (use TS 5.8.3 now; eligible after ~2026-05-23)
- **ESLint 10 + react-hooks 7** (stay on ESLint 9 + react-hooks 5)
- **Zod 4** (stay on Zod 3.x)
- **lucide-react 1.x** (stay on 0.577.0)
- **@xstate/react 6** (stay on 5.x)
- **html-react-parser 6** (stay on 5.2.17)
- **tailwind-merge 3** (stay on 2.x)
- **lint-staged 17** (stay on 16.4.0)
- **@commitlint 21** (stay on 20.5.0)
- **Tailwind 4.3** (stay on 4.2.1)

## Status

**Created**: 2026-05-15
**Branch**: `worktree/stack-update`

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
