# ayokoding-cli Rust Migration

Migrate `apps/ayokoding-cli/` from Go to Rust, following the same pattern used for
`ose-cli-rust-migration`. The shared Rust library `libs/rust-commons/` is created by the
`ose-cli-rust-migration` plan and must exist before execution of this plan begins. As the final
step, this plan removes the now-unused Go shared libraries (`libs/golang-link-commons/` and
`libs/golang-commons/`) once both CLIs have been migrated.

## Status

Completed (2026-05-25)

## Context

`apps/ayokoding-cli/` is a Go CLI tool that validates internal links in `apps/ayokoding-web/content`.
It is nearly identical to `apps/ose-cli/` — same flags, same `links check` subcommand, same output
formats (text / JSON / markdown), same dependency on `libs/golang-link-commons/` and
`libs/golang-commons/`. The only differences are the binary name (`ayokoding-cli`) and the default
content directory (`apps/ayokoding-web/content`).

The `ose-cli-rust-migration` plan migrates `ose-cli` first and creates the shared
`libs/rust-commons/` crate that encapsulates the link-checking logic. This plan reuses that crate
to migrate `ayokoding-cli` with minimal duplication.

## Scope

**In scope:**

- Replace the Go source in `apps/ayokoding-cli/` with a Rust implementation
- Use `libs/rust-commons/` for link-checking logic (path: `../../libs/rust-commons`)
- Match the existing CLI surface: root flags (`--verbose`, `--quiet`, `--output`, `--no-color`) and
  `links check --content` subcommand
- Keep the default content directory as `apps/ayokoding-web/content`
- Configure identical linting, coverage, and toolchain settings as `rhino-cli`
- Achieve 90% line coverage via `cargo llvm-cov --fail-under-lines 90`
- Archive Go source in `archived/ayokoding-cli/`
- Delete `libs/golang-link-commons/` and `libs/golang-commons/` after verifying no remaining
  Go consumers

**Out of scope:**

- Changes to `libs/rust-commons/` internals (owned by `ose-cli-rust-migration`)
- Changes to `apps/ayokoding-web/` content
- New CLI subcommands beyond `links check`
- External link validation (intentionally skipped, as in the Go version)

## Prerequisite

`libs/rust-commons/` must exist at `libs/rust-commons/` in the repo root before execution begins.
This crate is created by the `ose-cli-rust-migration` plan (Phase 0 of that plan). Verify with:

```bash
test -d ~/ose-projects/ose-public/libs/rust-commons && echo "OK" || echo "MISSING — run ose-cli-rust-migration first"
```

## Approach Summary

1. **Phase 0 — Prerequisites**: Verify `libs/rust-commons/` exists.
2. **Phase 1 — Rust rewrite**: Delete Go source, write Cargo.toml / src / tests, update
   `project.json` with Rust Nx targets.
3. **Phase 2 — Archive Go source**: `git mv` Go files to `archived/ayokoding-cli/`.
4. **Phase 3 — Go libs cleanup**: Verify no remaining Go consumers, then delete
   `libs/golang-link-commons/` and `libs/golang-commons/`.
5. **Phase 4 — Local quality gates**: typecheck, lint, test:quick, spec-coverage.
6. **Phase 5 — Post-push CI verification**: push to `main`, monitor GitHub Actions.
7. **Phase 6 — Plan archival**.

## Documents

| Document                       | Purpose                                                          |
| ------------------------------ | ---------------------------------------------------------------- |
| [brd.md](./brd.md)             | WHY — business rationale, affected roles, success metrics, risks |
| [prd.md](./prd.md)             | WHAT — user stories, Gherkin acceptance criteria, product scope  |
| [tech-docs.md](./tech-docs.md) | HOW — architecture, design decisions, file impact, dependencies  |
| [delivery.md](./delivery.md)   | DO — phased execution checklist                                  |

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
