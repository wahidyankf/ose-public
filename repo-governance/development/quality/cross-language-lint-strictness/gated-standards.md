---
description: "The table of every currently-gated artifact type, its tool, threshold/config, and enforcement point, and how the three lint gates select their files."
when_to_use: "Use when checking which tool and CI job gate a given artifact type (Markdown, formatting, F#, shell, Dockerfile, or GitHub Actions YAML)."
---

# Gated standards

| Artifact              | Tool                    | Threshold / config                                      | Enforcement point                                |
| --------------------- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Markdown              | markdownlint            | see [markdown.md](.././markdown.md)                     | `markdownlint` gate; CI `repository-policy` job  |
| Formatting (per file) | `scripts/format-staged` | each language's formatter; replay must leave no diff    | `format-staged` gate; CI `repository-policy` job |
| F# projects           | TWAE                    | `TreatWarningsAsErrors` on every `.fsproj`              | Nx `typecheck`/`test:quick`; CI `dotnet` job     |
| F# projects           | fsharplint, analyzers   | G-Research.FSharp.Analyzers, `GRA-*` `--treat-as-error` | Nx `lint`; CI `dotnet` job                       |
| F# formatting         | `fantomas`              | `fantomas --check`                                      | Nx `lint`; CI `dotnet` job                       |
| Shell scripts         | `shellcheck`            | `--severity=warning`; `.shellcheckrc`                   | `shellcheck` gate; CI `repository-policy` job    |
| Dockerfiles           | `hadolint`              | `--failure-threshold warning`; `.hadolint.yaml`         | `hadolint` gate; CI `repository-policy` job      |
| GitHub Actions YAML   | `actionlint`            | every finding; embedded `shellcheck` on `run:` blocks   | `actionlint` gate; CI `repository-policy` job    |

The five registry gates run from the `repo-config.yml` gate registry through `./rhino gate run`: at
`pre-commit` in the Husky hook (formatting applies to the index) and on the `pull-request` surface
in CI's always-run `repository-policy` job (formatting replays and must stay clean).
`scripts/format-staged` selects Prettier, `rustfmt`, `fantomas`, `ruff format`, `gofmt`, `mix`
(through `scripts/format-elixir.sh`), `csharpier`, `dart format`, Spotless through the project's
Gradle wrapper, `shfmt`, `tofu fmt`, `stylua`, `clang-format`, or `buildifier` by extension. The F#
gates ride the Nx targets the language-detected `dotnet` job runs.

The three lint gates receive the staged or changed paths and select their own files:
`scripts/lint-shell` takes `*.sh`, `*.bash`, and extensionless files with a `sh`, `bash`, `dash`, or
`ksh` shebang; `scripts/lint-dockerfiles` takes `Dockerfile`, `Dockerfile.*`, and `*.Dockerfile`;
`scripts/lint-workflows` lints every workflow whenever a workflow or a local composite action
changes, because a caller can break against a file that did not change. CI installs the pinned,
digest-verified releases through `.github/actions/setup-lint-tools`. `./rhino gate run` names only
the failing gate, not the tool's findings; run its wrapper on the reported paths, for example
`scripts/lint-shell path/to/script.sh`, to read them.
