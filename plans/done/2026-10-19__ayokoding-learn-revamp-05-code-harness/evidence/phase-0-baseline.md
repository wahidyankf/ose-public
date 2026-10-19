# Phase 0 Baseline — Plan 05 Code Harness (2026-10-18)

Worktree `worktrees/ayokoding-learn-revamp-05-code-harness/`, branch
`ayokoding-learn-revamp-05-code-harness` (ff-only on `origin/main` d25ccb696).
`npm install` exit 0 (Husky hooks installed); `npm run doctor` exit 0, no toolchain drift.

## Preconditions

- CLI stub: `git ls-tree -r --name-only origin/main apps/ayokoding-cli/` returns exactly
  `apps/ayokoding-cli/LICENSE`. PASS.
- No opted-in courses: 0 lines ending `/run.yaml` under
  `apps/ayokoding-www/content/en/learn/courses/` on `origin/main`. PASS.

## Overlap (plans 01–04)

`git diff --stat bb7f90137 origin/main` over the plan-listed surfaces: 25 files changed,
426 insertions, 315 deletions — quality-workflow docs (`plan-quality-gate.md`, `pr-leak-review/*`,
`pr-review/*`, rules-propagation), `scripts/format-staged`. Recorded; Phases 6–7 edit on top.

## HIPPO re-read (sibling hippo checkout, read-only)

Against tech-docs/002 parity table; Phase 1 applies the rows below.

- Row 10 (depguard): table says 2 rules (`production`, `test-support`); HIPPO now has 7 —
  plus `native-terminal-support`, `host-evidence-verifier`, `tui-production`,
  `tui-test-support`, `native-fault-test` (TUI/host-evidence scopes).
- Row 17 (exclusions): table says 2 path-scoped rules; HIPPO now has 3 — plus
  `internal/adapters/tui/model.go` (ireturn, Update-returns-Model text).
- No other differences: `go 1.26.1` / `toolchain go1.26.9`; tool block (golangci-lint,
  nilaway, goimports, govulncheck, gofumpt, shfmt); golangci-lint/v2 v2.13.2 indirect;
  cobra v1.10.2, godog v0.16.0, messages v34.2.0 all match; `default: all`, 15-item disable
  list, exhaustruct_v5/exhaustive/gosec/cyclop/gocognit/funlen/govet-nilness/nolintlint/revive/
  goconst/issues/gofumpt/goimports all match; `test-quick.sh` matches rows 20–22, 25–27, 29–30, 33.

## Version table (tech-docs/005 catalog, checked 2026-10-18)

Policy: newest final release on Phase 0 day, no betas/RCs, per-toolchain exceptions.
`[Verified]` = independently corroborated against the listed source by a second route;
`[Sourced]` = single-route check against the listed source on the check date.

| id             | chosen version                                                | source                                                                          | confidence |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- |
| python         | 3.15.0 (was 3.14.8; 3.15.0 final Oct 9)                       | https://www.python.org/downloads/                                               | [Verified] |
| go             | 1.27.2                                                        | https://go.dev/dl/?mode=json                                                    | [Sourced]  |
| rust           | 1.99.1 (was 1.99.0; fixes 3 regressions)                      | https://api.github.com/repos/rust-lang/rust/releases/latest                     | [Verified] |
| node           | 24.22.0 patch only (line stays 24; 26 Active LTS ~Oct 20–28)  | https://nodejs.org/en/about/previous-releases                                   | [Sourced]  |
| typescript     | 7.0.2                                                         | https://registry.npmjs.org/typescript/latest                                    | [Sourced]  |
| java           | JDK 25 LTS (Temurin 25.0.4.1+1)                               | hub.docker.com eclipse-temurin tags                                             | [Sourced]  |
| kotlin         | 2.4.21 (2.5.0-Beta1 excluded)                                 | https://api.github.com/repos/JetBrains/kotlin/releases/latest                   | [Sourced]  |
| dotnet         | SDK 10.0.402 (release 10.0.13; 11.0 RC excluded)              | https://builds.dotnet.microsoft.com/dotnet/release-metadata/releases-index.json | [Verified] |
| elixir         | 1.20.4, OTP 29.1.2 (was 29.1.1)                               | https://api.github.com/repos/elixir-lang/elixir/releases/latest                 | [Sourced]  |
| lua            | 5.5.1                                                         | https://www.lua.org/ftp/                                                        | [Sourced]  |
| luajit         | v2.1 at `2a8e017` (was `c6ffc14`; rolling branch HEAD Oct 14) | https://luajit.org/status.html                                                  | [Sourced]  |
| neovim         | 0.12.6 (was 0.12.5)                                           | https://api.github.com/repos/neovim/neovim/releases/latest                      | [Verified] |
| gcc            | 16.2                                                          | https://gcc.gnu.org/releases.html                                               | [Sourced]  |
| racket         | 9.3                                                           | https://api.github.com/repos/racket/racket/releases/latest                      | [Sourced]  |
| ocaml          | 5.5.1                                                         | https://ocaml.org/releases                                                      | [Sourced]  |
| swift          | 6.4.1 (was 6.4.0)                                             | https://www.swift.org/install/linux/                                            | [Sourced]  |
| dart           | 3.13.5                                                        | hub.docker.com dart tags                                                        | [Sourced]  |
| flutter        | 3.41.5 (repo `.fvmrc` pin, unchanged)                         | local `.fvmrc`                                                                  | [Sourced]  |
| shell          | Debian trixie snapshot (Phase 3 pins date)                    | https://snapshot.debian.org/                                                    | [Sourced]  |
| powershell     | 7.x LTS (resolves 7.6.7)                                      | mcr.microsoft.com powershell tags                                               | [Sourced]  |
| postgres       | 18.6                                                          | https://www.postgresql.org/support/versioning/                                  | [Sourced]  |
| neo4j          | 2026.09.0 Community                                           | hub.docker.com neo4j tags                                                       | [Sourced]  |
| swift-parse    | 6.4.1 (follows swift)                                         | as swift                                                                        | [Sourced]  |
| ktlint         | newest final 1.8.0, pinned in Phase 3                         | https://github.com/pinterest/ktlint/releases                                    | [Sourced]  |
| opentofu       | newest final 1.13.1, pinned in Phase 3                        | https://github.com/opentofu/opentofu/releases                                   | [Sourced]  |
| kubeconform    | newest final v0.8.0, pinned in Phase 3                        | https://github.com/yannh/kubeconform/releases                                   | [Sourced]  |
| windows-static | Debian trixie snapshot (same basis as shell)                  | https://snapshot.debian.org/                                                    | [Sourced]  |

Phase 3 pins images/digests from this table.

## Docker

Daemon server version 24.0.2 (Docker Desktop, relaunched 2026-10-18 for Phase 3).

## Green baseline (all exit 0, before any product change)

- `WWW-QUICK` (`nx run ayokoding-www:test:quick`): exit 0.
- `SCRIPT-TESTS` (node --test format-staged, workflow-language-lanes, behaviour-coverage): 126 pass, 0 fail.
- `LINT-WORKFLOWS` (`scripts/lint-workflows`): exit 0.
- `ENV-VALIDATE` (`rhino env validate`): 20 files, no findings.
- `LINT-MD` (`npm run lint:md`): 7689 files, 0 errors.
