---
title: "Repository Shell Scripts"
description: The two formatter wrapper scripts that the gate registry invokes, why each one cannot be replaced by a direct CLI call, and the adopted public-safety gate
when_to_use: Read this before adding a script here, or when tracing which gate invokes one of these wrappers.
---

# Repository Shell Scripts

Wrapper scripts invoked by entries in [`repo-config.yml`](../repo-config.yml)'s `gates:`
registry. Every file here exists because the underlying tool cannot be called directly with
the file paths a gate hands it — a wrapper that merely renames a working command does not
belong here.

- [`format-elixir.sh`](./format-elixir.sh) — Runs `mix format` from the nearest `mix.exs`
  ancestor of each file. Use when formatting or checking `*.{ex,exs}`; `mix format` resolves
  `.formatter.exs` and `import_deps` relative to the current directory, so it must `cd` into
  the project root, while lint-staged passes absolute paths from the monorepo root. Pass
  `--check` for the non-mutating form.
- [`verify-gofmt.sh`](./verify-gofmt.sh) — Reports unformatted Go files as a failure. Use
  when verifying `*.go` formatting without rewriting anything; `gofmt -l` prints each
  unformatted path but still exits 0, so its output has to be converted into a non-zero exit
  code.

## The public-safety gate

[`public-safety/`](./public-safety/README.md) is not a wrapper. It is the outbound public-safety gate, copied byte
for byte from the [ose-rules](https://github.com/wahidyankf/ose-rules) catalog at published `main` commit
`0d38b3e387b0d73e4bff3b8ccafabab6bbce8ccd`. A change lands upstream first; this repository then explicitly
re-adopts the files from a newly resolved full `main` commit. Its README says what it screens, what it prohibits,
and how to run its tests.

## Which gates invoke these

| Gate id                | Command                            | Surface                  |
| ---------------------- | ---------------------------------- | ------------------------ |
| `format-elixir`        | `scripts/format-elixir.sh`         | pre-commit, `*.{ex,exs}` |
| `format-verify-elixir` | `scripts/format-elixir.sh --check` | CI, `*.{ex,exs}`         |
| `format-verify-gofmt`  | `scripts/verify-gofmt.sh`          | CI, `*.go`               |

The mutating Go counterpart (`format-gofmt`) calls `gofmt -w` directly and needs no wrapper.

Both wrappers serve `apps/ayokoding-www/content/**`, where the kata corpora are written —
Go, Elixir, and the other teaching languages ship as course content rather than as built
projects, and their formatters run so that content stays consistently formatted.

## Adding a script here

Every other formatter in the map accepts bare file-path arguments and is wired as a direct
CLI call in the registry — see
[Formatting and File-Type Linting](../repo-governance/development/infra/nx-targets/formatting-and-file-type-linting.md)
for the canonical `glob → formatter` map. Add a wrapper only when the tool itself makes the
direct call impossible, and say why in a comment at the top of the script, as both files here
do. Scripts are formatted by `shfmt` and linted by `shellcheck --severity=warning` at
pre-commit.
