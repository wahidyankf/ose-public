---
description: "Auto-formatters used per language across the repository."
when_to_use: "Use when checking which formatter applies to a given language."
---

# Language-Specific Auto-Formatters

The following language-specific formatters run automatically through the `format-staged` registry
gate — at pre-commit on staged files, and as a no-change replay on the pull-request surface:

| Language | Tool                                  | Trigger                         |
| -------- | ------------------------------------- | ------------------------------- |
| Rust     | `rustfmt --edition 2024`              | `format-staged` gate (`*.rs`)   |
| F\#      | `fantomas`                            | `format-staged` gate (`*.fs`)   |
| C\#      | `csharpier format`                    | `format-staged` gate (`*.cs`)   |
| Java     | Spotless via `scripts/format-java.sh` | `format-staged` gate (`*.java`) |

The full extension-to-formatter table is in
[Formatting and File-Type Linting](../../infra/nx-targets/formatting-and-file-type-linting.md).

Each formatter uses its language's standard style conventions. No custom configuration is applied
unless a project-specific config file exists (e.g., `rustfmt.toml`, `.editorconfig`).
