---
description: Explains why formatting and several file-type lint checks run as staged-path registry gates instead of Nx targets, with the path-to-tool tables.
when_to_use: Use when deciding whether a new file-type check belongs in a staged-path registry gate or as an Nx target.
---

# Formatting and File-Type Linting (Registry Gates, Not Nx Targets)

Formatting and several file-type lint checks are **not** Nx targets. They run as
[`repo-config.yml`](../../../../repo-config.yml) registry gates that take a `files` input — the
staged paths at `pre-commit` and the pull request's changed paths on the `pull-request` surface.
The membership rule: a check belongs in such a gate if and only if it is (a) file-type based
(selected from the handed paths by extension or name) and (b) per-file isolated — its result does
not depend on any other file's content. See the
[Staged-Path Gate Membership Rule](../nx-target-naming/staged-path-gate-membership-rule.md).

**Formatting** — one `mutation` gate, `format-staged`, whose `scripts/format-staged` picks each
path's formatter by extension (no per-project `format` or `format:check` Nx target). At
`pre-commit` Rhino applies the formatted bytes to the index; on the pull-request surface it replays
the formatter and fails if any byte would change:

| Paths                                                          | Formatter                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------- |
| `*.{md,js,jsx,ts,tsx,mjs,cjs,json,yml,yaml,css,scss,html,sql}` | `prettier --write`                                              |
| `*.rs`                                                         | `rustfmt --edition 2024`                                        |
| `*.fs`                                                         | `fantomas`                                                      |
| `*.py`                                                         | `ruff format --no-cache`                                        |
| `*.go`                                                         | `gofmt -w`                                                      |
| `*.{ex,exs}`                                                   | `scripts/format-elixir.sh` (CWD-aware wrapper for `mix format`) |
| `*.cs`                                                         | `csharpier format`                                              |
| `*.dart`                                                       | `dart format`                                                   |
| `*.java`                                                       | `scripts/format-java.sh` (Gradle-root wrapper for Spotless)     |
| `*.sh`                                                         | `shfmt -w`                                                      |
| `*.tf`                                                         | `tofu fmt`                                                      |
| `*.lua`                                                        | `stylua`                                                        |
| `*.{c,h}`                                                      | `clang-format -i`                                               |
| `BUILD`, `BUILD.bazel`, `*.bzl`                                | `buildifier`                                                    |

The per-project `format` and `format:check` Nx targets are **not standard lifecycle targets** and
**must not be added**. Two languages use a wrapper script, both for the same reason — their
formatter is invoked from a project root rather than on bare file paths. `mix format` needs the
root that resolves `.formatter.exs`; Spotless is a whole-project Gradle task, so the wrapper maps
each staged file back to its owning Gradle root and runs the task once per root. Every other
formatter accepts bare file-path arguments and is invoked directly. To format a new file type, add
its extension and formatter to `scripts/format-staged`; do not add a new gate or Nx target.

**Tool linting** — file-scoped registry gates in `repo-config.yml`, **not** Nx targets:

| Gate         | Selected paths                                                         | Tool                                   |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------- |
| `shellcheck` | `*.sh`, `*.bash`, extensionless files with a shell shebang             | `shellcheck --severity=warning`        |
| `hadolint`   | `Dockerfile`, `Dockerfile.*`, `*.Dockerfile`                           | `hadolint --failure-threshold warning` |
| `actionlint` | every workflow, when a workflow or local composite action path changes | `actionlint`                           |

These are **not** Nx targets. Targets such as `shell:lint`, `dockerfiles:lint`, and `actions:lint`
**must not exist** as Nx targets — the gates run over the staged paths at pre-commit and the
changed paths on the pull-request surface, through `scripts/lint-shell`,
`scripts/lint-dockerfiles`, and `scripts/lint-workflows`.
