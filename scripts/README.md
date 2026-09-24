---
title: "Repository Shell Scripts"
description: The formatter entry point and wrapper scripts that the gate registry invokes, why each wrapper cannot be replaced by a direct CLI call, and the adopted public-safety gate
when_to_use: Read this before adding a script here, or when tracing which gate invokes one of these wrappers.
---

# Repository Shell Scripts

Wrapper scripts invoked by entries in [`repo-config.yml`](../repo-config.yml)'s `gates:`
registry. Every file here exists because the underlying tool cannot be called directly with
the file paths a gate hands it — a wrapper that merely renames a working command does not
belong here.

- [`format-staged`](./format-staged) — The `format-staged` gate's command. Rhino hands it the
  staged (pre-commit) or changed (pull-request) paths, and it picks each path's formatter by
  extension; see
  [Formatting and File-Type Linting](../repo-governance/development/infra/nx-targets/formatting-and-file-type-linting.md).
- [`format-elixir.sh`](./format-elixir.sh) — Runs `mix format` from the nearest `mix.exs`
  ancestor of each file. Use when formatting or checking `*.{ex,exs}`; `mix format` resolves
  `.formatter.exs` and `import_deps` relative to the current directory, so it must `cd` into
  the project root, while `format-staged` passes paths relative to the monorepo root. Pass
  `--check` for the non-mutating form.
- [`format-java.sh`](./format-java.sh) — Runs Spotless once per owning Gradle root. Use when
  formatting or checking `*.java`; Spotless is a whole-project Gradle task, so each path is mapped
  back to its project root. Pass `--check` for the non-mutating form.

## The lint gate wrappers

Rhino hands a lint gate every staged or changed path, so each wrapper selects its own file type
before calling the tool; the tool itself cannot be pointed at an arbitrary path list.

- [`lint-shell`](./lint-shell) — Runs `shellcheck --severity=warning` over `*.sh`, `*.bash`, and
  extensionless files whose shebang names `sh`, `bash`, `dash`, or `ksh`. Use when tracing the
  `shellcheck` gate.
- [`lint-dockerfiles`](./lint-dockerfiles) — Runs `hadolint --failure-threshold warning` over
  `Dockerfile`, `Dockerfile.*`, and `*.Dockerfile` paths. Use when tracing the `hadolint` gate.
- [`lint-workflows`](./lint-workflows) — Runs `actionlint` over every workflow when any workflow
  or local composite action path changed, because a caller can break against an unchanged file.
  Use when tracing the `actionlint` gate.

`lint-gates.test.mjs` proves each selector in both directions and runs in `npm run test:validators`.

## The public-safety gate

[`public-safety/`](./public-safety/README.md) is not a wrapper. It is the outbound public-safety gate, copied byte
for byte from the [ose-rules](https://github.com/wahidyankf/ose-rules) catalog at published `main` commit
`0d38b3e387b0d73e4bff3b8ccafabab6bbce8ccd`. A change lands upstream first; this repository then explicitly
re-adopts the files from a newly resolved full `main` commit. Its README says what it screens, what it prohibits,
and how to run its tests.

## Which gates invoke these

| Gate id         | Command                                                 | Surface                                     |
| --------------- | ------------------------------------------------------- | ------------------------------------------- |
| `format-staged` | `scripts/format-staged` (calls both formatter wrappers) | pre-commit (staged), pull-request (changed) |

At pre-commit Rhino applies the formatted bytes to the index; on the pull-request surface it
replays `format-staged` and fails on any change, so no separate verify gate exists.

Both wrappers serve `apps/ayokoding-www/content/**`, where the kata corpora are written —
Go, Elixir, and the other teaching languages ship as course content rather than as built
projects, and their formatters run so that content stays consistently formatted.

## Adding a script here

Every other formatter in the map accepts bare file-path arguments and is called directly by
`scripts/format-staged` — see
[Formatting and File-Type Linting](../repo-governance/development/infra/nx-targets/formatting-and-file-type-linting.md)
for the canonical `extension → formatter` map. Add a wrapper only when the tool itself makes the
direct call impossible, and say why in a comment at the top of the script, as both files here
do. Scripts are formatted by `shfmt` and linted by `shellcheck --severity=warning` at
pre-commit.
