---
description: Explains why formatting and several file-type lint checks run as lint-staged entries instead of Nx targets, with the glob-to-tool tables.
when_to_use: Use when deciding whether a new file-type check belongs in lint-staged or as an Nx target.
---

# Formatting and File-Type Linting (lint-staged, not Nx targets)

Formatting and several file-type lint checks are **not** Nx targets. They run as
[lint-staged](https://github.com/lint-staged/lint-staged) entries in `.husky/pre-commit`, keyed by
glob pattern. The membership rule: a check belongs in lint-staged if and only if it is (a)
file-type based (selected by a path glob) and (b) per-file isolated — its result does not depend on
any other file's content.

**Formatting** — direct CLI, one entry per shipped file type (no per-project `format` or
`format:check` Nx target):

| Glob                                              | Formatter                                                       |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `*.{md,json,yml,yaml,css,scss,js,jsx,ts,tsx,...}` | `prettier --write`                                              |
| `*.rs`                                            | `rustfmt`                                                       |
| `*.fs`                                            | `fantomas`                                                      |
| `*.go`                                            | `gofmt -w`                                                      |
| `*.py`                                            | `ruff format`                                                   |
| `*.dart`                                          | `dart format`                                                   |
| `*.clj`                                           | `cljfmt fix` (native binary)                                    |
| `*.cs`                                            | `csharpier format`                                              |
| `*.{ex,exs}`                                      | `scripts/format-elixir.sh` (CWD-aware wrapper for `mix format`) |
| `*.java`                                          | `scripts/format-java.sh` (Gradle-root wrapper for Spotless)     |

The per-project `format` and `format:check` Nx targets are **not standard lifecycle targets** and
**must not be added**. Two languages use a wrapper script, both for the same reason — their
formatter is invoked from a project root rather than on bare file paths. `mix format` needs the
root that resolves `.formatter.exs`; Spotless is a whole-project Gradle task, so the wrapper maps
each staged file back to its owning Gradle root and runs the task once per root. Every other
formatter accepts bare file-path arguments and is invoked directly.

**Tool linting** — also lint-staged file-type entries, **not** Nx targets:

| Glob                             | Tool                                   |
| -------------------------------- | -------------------------------------- |
| `*.sh`                           | `shellcheck --severity=warning`        |
| `Dockerfile`, `*.Dockerfile`     | `hadolint --failure-threshold warning` |
| `.github/workflows/*.{yml,yaml}` | `actionlint`                           |

These are **not** Nx targets. Targets such as `shell:lint`, `dockerfiles:lint`, and `actions:lint`
**must not exist** as Nx targets — they are lint-staged entries that run over the changed file set
at pre-commit.
