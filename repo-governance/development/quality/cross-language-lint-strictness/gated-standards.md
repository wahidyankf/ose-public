---
description: "The table of every currently-gated artifact type, its tool, threshold/config, and enforcement point, plus the lint tools that currently have no gate."
when_to_use: "Use when checking which tool and CI job gate a given artifact type (Markdown, formatting, F#), or whether shell, Dockerfile, or GitHub Actions YAML lint is gated."
---

# Gated standards

| Artifact              | Tool                    | Threshold / config                                      | Enforcement point                                |
| --------------------- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Markdown              | markdownlint            | see [markdown.md](.././markdown.md)                     | `markdownlint` gate; CI `repository-policy` job  |
| Formatting (per file) | `scripts/format-staged` | each language's formatter; replay must leave no diff    | `format-staged` gate; CI `repository-policy` job |
| F# projects           | TWAE                    | `TreatWarningsAsErrors` on every `.fsproj`              | Nx `typecheck`/`test:quick`; CI `dotnet` job     |
| F# projects           | fsharplint, analyzers   | G-Research.FSharp.Analyzers, `GRA-*` `--treat-as-error` | Nx `lint`; CI `dotnet` job                       |
| F# formatting         | `fantomas`              | `fantomas --check`                                      | Nx `lint`; CI `dotnet` job                       |

The two gates run from the `repo-config.yml` gate registry through `./rhino gate run`: at
`pre-commit` in the Husky hook (formatting applies to the index) and on the `pull-request` surface
in CI's always-run `repository-policy` job (formatting replays and must stay clean).
`scripts/format-staged` selects Prettier, `rustfmt`, `fantomas`, `ruff format`, `gofmt`, `mix`
(through `scripts/format-elixir.sh`), `csharpier`, `dart format`, Spotless through the project's
Gradle wrapper, `shfmt`, `tofu fmt`, `stylua`, `clang-format`, or `buildifier` by extension. The F#
gates ride the Nx targets the language-detected `dotnet` job runs.

## Not currently gated

`shellcheck`, `hadolint`, and `actionlint` have no declared gate. Their always-run CI jobs retired
with the obsolete main workflow on 2026-08-05, and the last local `shellcheck` hook retired with the
legacy lint-staged setup on 2026-09-19. The root `.shellcheckrc` and `.hadolint.yaml` remain as the
configuration a re-admitted gate would use. Re-admission follows the policy's clean-then-gate rule
and declares the binary under `toolchains` in the same change; until then they are not
`toolchains` entries.
