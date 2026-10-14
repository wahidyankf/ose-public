---
description: "Phase 4: install Go and golangci-lint for Go projects and gofmt; Lua formatting needs no install."
when_to_use: "Use when setting up or verifying the Go toolchain, or checking where the Lua formatter comes from."
---

# Phase 4: Go and Lua Toolchains (Sequential)

The two toolchains in this phase are no longer alike. **Go is a build-and-test dependency**:
Go is needed to build, test, and lint any Go project, and to run `gofmt` over the `*.go` course
corpus under `apps/ayokoding-www/content/**`. No first-party Go project exists today, so the
course corpus is the only current `gofmt` input. **Lua is formatter-only**: no project is written
in it, and `stylua` exists solely for the `*.lua` corpus.
The `format-staged` gate in `repo-config.yml` runs both formatters at pre-commit and replays them
on the pull-request surface in CI.

`go` and `golangci-lint` are declared under `toolchains` in `repo-config.yml`, so `npm run doctor`
reports either one when missing. Neither entry declares provisioning, so 4.1 and 4.2 below are the
install. `stylua` is an npm dependency, so the guarded `npm install` in Phase 11 installs it.

## 4.1 Install Go

```bash
# macOS
brew install go

# Linux — download from https://go.dev/dl/
```

CI installs the version pinned by the `go-version` input of `.github/actions/setup-go`. Doctor proves only that
`go version` runs, so match that pin yourself.

**Success criteria**: `go version` reports at or above the `go-version` input of
`.github/actions/setup-go`, and `command -v gofmt` finds the formatter that ships with Go.

## 4.2 Install golangci-lint

```bash
go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.11.3
```

The version matches the `golangci-lint-version` input of `.github/actions/setup-go`.

**Success criteria**: `golangci-lint version` returns a version string.

## 4.3 Lua formatting

Nothing to install: `stylua` comes from the npm lockfile. Lua itself is not required.

**Success criteria**: after Phase 11, `npm exec --no -- stylua --version` returns a version string.
