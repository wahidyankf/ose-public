---
description: "Phase 4: install Go for the roots-be backend and gofmt, and Lua for stylua."
when_to_use: "Use when setting up or verifying the Go and Lua toolchains."
---

# Phase 4: Go and Lua Toolchains (Sequential)

The two toolchains in this phase are no longer alike. **Go is a build-and-test dependency**:
`apps/roots-be` is written in it, so Go is needed to build, test, and lint that project as well
as to run `gofmt` over the `*.go` course corpus under `apps/ayokoding-www/content/**`. **Lua is
formatter-only**: no project is written in it, and `stylua` exists solely for the `*.lua` corpus.
The `format-gofmt` / `format-verify-gofmt` and `format-stylua` / `format-verify-stylua` gates in
`repo-config.yml` enforce the formatting half at pre-commit and in CI.

That difference decides whether you can skip this phase. `./rhino toolchain validate` checks Go — it is
declared under `toolchains` in `repo-config.yml`, so `npm run doctor` reports it when missing and
`./rhino toolchain provision --apply` provisions it only when its entry declares provisioning;
otherwise 4.1 below is the install. Doctor does **not** check `stylua`, so 4.2 stays a hand
install you can skip if you never touch course code.

## 4.1 Install Go

```bash
# macOS
brew install go

# Linux — download from https://go.dev/dl/
```

`apps/roots-be/go.mod` pins the language version, and `doctor.extra-tools` carries the matching
`required-version` floor compared with `>=`. A release below that floor fails the doctor row even
though `gofmt` alone would have run fine on it.

**Success criteria**: `go version` reports at or above the `required-version` in `repo-config.yml`,
and `gofmt --help` runs without error.

## 4.2 Install Lua formatting

```bash
# macOS
brew install stylua

# Linux — download a release binary from https://github.com/JohnnyMorganz/StyLua/releases
```

Lua itself is not required; only the `stylua` formatter is.

**Success criteria**: `stylua --version` returns a version string.
