---
description: "Table of every toolchain ./rhino toolchain validate probes, as declared under repo-config.yml toolchains, with the phase or manager that installs each."
when_to_use: "Use as a quick reference for which tools npm run doctor checks, where a version is pinned, or which manager installs a reported tool."
---

# Tool Inventory

`npm run doctor` runs `./rhino toolchain validate`, which probes exactly the entries under
`toolchains.entries` in `repo-config.yml`, in declaration order. There is no built-in inventory and
no scope flag: the declaration is the whole set, and every entry is `required`, so a tool that is
missing or whose probe fails is a finding. No entry declares a `version` constraint, so doctor
proves presence only; the pins below are enforced by the named manager or project, not by doctor.
No entry declares a provision vector either, so `./rhino toolchain provision --apply` installs
nothing here — install a reported tool through the phase or manager listed, then run doctor again.

| #   | Tool          | Needed by                                       | Pinned by                           | Install                     |
| --- | ------------- | ----------------------------------------------- | ----------------------------------- | --------------------------- |
| 1   | git           | everything                                      | —                                   | Phase 2                     |
| 2   | volta         | Node.js pinning                                 | —                                   | Phase 3                     |
| 3   | node          | Nx, hooks, TypeScript projects                  | `package.json` → `volta.node`       | Phase 3                     |
| 4   | npm           | dependency install, `npx`                       | `package.json` → `volta.npm`        | Phase 3                     |
| 5   | dotnet        | .NET projects, `format-staged` (F#)             | each .NET project's `global.json`   | Phase 9                     |
| 6   | go            | `roots-be`, `gofmt` in `format-staged`          | `apps/roots-be/go.mod`              | Phase 4                     |
| 7   | golangci-lint | `roots-be` lint                                 | CI `setup-go` input                 | Phase 4                     |
| 8   | java          | `ose-lms-be`                                    | the project's Gradle toolchain      | SDKMAN or a JDK 25 package  |
| 9   | docker        | dev stacks, E2E                                 | —                                   | Phase 2                     |
| 10  | jq            | hooks, CI scripts                               | —                                   | Phase 2                     |
| 11  | bash          | every gate script                               | —                                   | Phase 2 (ships with the OS) |
| 12  | curl          | cold-cache `./rhino`, `./hippo`, safety scanner | —                                   | Phase 2 (ships with the OS) |
| 13  | rustfmt       | `format-staged` (`*.rs`)                        | —                                   | Phase 7                     |
| 14  | fantomas      | `format-staged` (`*.fs`)                        | `.config/dotnet-tools.json`         | Phase 9                     |
| 15  | csharpier     | `format-staged` (`*.cs`)                        | `.config/dotnet-tools.json`         | Phase 9                     |
| 16  | ruff          | `format-staged` (`*.py`)                        | FERRET `uv.lock` (CI uses its venv) | Phase 6                     |
| 17  | mix           | `format-staged` (`*.ex`, `*.exs`)               | —                                   | Phase 8                     |
| 18  | dart          | `format-staged` (`*.dart`)                      | `.fvmrc`                            | Phase 10                    |
| 19  | shfmt         | `format-staged` (`*.sh`)                        | CI `setup-go` input                 | Phase 2                     |
| 20  | tofu          | `format-staged` (`*.tf`)                        | —                                   | Phase 2                     |
| 21  | clang-format  | `format-staged` (`*.c`, `*.h`)                  | —                                   | Phase 2                     |
| 22  | shellcheck    | `shellcheck` gate; `actionlint` `run:` checks   | CI `setup-lint-tools` input         | Phase 2                     |
| 23  | hadolint      | `hadolint` gate                                 | CI `setup-lint-tools` input         | Phase 2                     |
| 24  | actionlint    | `actionlint` gate                               | CI `setup-lint-tools` input         | Phase 2                     |

## Deliberately not declared

The [cross-language lint-strictness policy](../../../development/quality/cross-language-lint-strictness/policy.md)
exempts some binaries the gates call, and `repo-config.yml` records the same list beside the
declaration: `prettier`, `markdownlint-cli2`, `stylua`, and `buildifier` come from the npm lockfile
through the guarded `npm install`; `gofmt` and `npx` ship with `go` and `npm`; Java formatting runs
Spotless through the owning project's `gradlew`; the public-safety scanner downloads and verifies
its own pinned release; and base utilities (`awk`, `sed`, `tar`, `shasum`) are assumed.

Playwright browsers are installed by Phase 12 and are not a doctor probe.

## Adding a tool

Declare it in the same change that adds the gate or project needing it, as an entry with `id`,
`executable`, a non-empty `probe` argv that exits 0, and `required: true`; `./rhino repo-config
validate` checks the shape. Add a `provision` vector only when a non-interactive, idempotent install
command exists for each platform, because `provision --apply` refuses when any entry that declares
provisioning lacks a vector for the current platform.
