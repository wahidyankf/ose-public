---
description: "Table of the tools ./rhino toolchain validate checks by default, plus how repo-config.yml adds more."
when_to_use: "Use as a quick reference for which tool version a given config file pins, or which manager installs it."
---

# Tool Inventory

The tools `./rhino toolchain validate` checks **by default**, in the order it reports them. This is the
built-in inventory, not the whole one — see [Configured extra tools](#configured-extra-tools) below.

| #   | Tool           | Required Version      | Version Source                              | Manager        |
| --- | -------------- | --------------------- | ------------------------------------------- | -------------- |
| 1   | git            | Any                   | (no config file)                            | System/Brew    |
| 2   | volta          | Any                   | (no config file)                            | curl script    |
| 3   | node           | Exact                 | package.json → volta.node                   | Volta          |
| 4   | npm            | Exact                 | package.json → volta.npm                    | Volta          |
| 6   | cargo-llvm-cov | Any                   | (no config file)                            | cargo install  |
| 7   | dotnet         | >= global.json major  | repo-config.yml → doctor.dotnet-global-json | Brew/Script    |
| 8   | docker         | Any                   | (no config file)                            | Docker Desktop |
| 9   | jq             | Any                   | (no config file)                            | Brew           |
| 10  | shellcheck     | Any                   | (no config file)                            | Brew/apt       |
| 11  | hadolint       | Any                   | (no config file)                            | Brew/binary    |
| 12  | actionlint     | Any                   | (no config file)                            | Brew/binary    |
| 13  | playwright     | (matches npm version) | node_modules (npx playwright)               | npx            |
| 14  | shfmt          | Any                   | (no config file)                            | Brew/apt       |
| 15  | tofu           | >= pinned floor       | Rhino constant (`OPENTOFU_VERSION`)         | Brew/binary    |
| 16  | clang-format   | Any                   | (no config file)                            | Brew/apt       |

## Configured extra tools

A repository may add tools to this inventory without a Rhino source change, by declaring them
under `doctor.extra-tools` in `repo-config.yml`. A declared tool is probed, version-compared, and
reported exactly like a built-in, and `--tools <name>` accepts it. A name in **neither** the table
above **nor** `doctor.extra-tools` is still rejected before any tool is probed, so the inventory
stays a closed set — it is just no longer a set fixed at compile time.

`repo-config.yml`'s `doctor.extra-tools` block is the schema's canonical home and documents each
field. The one worth knowing here is `version-stream`: a tool whose version banner goes to stderr
rather than stdout (`java -version` does) must say so, or the probe reads an empty string and
reports an installed tool as missing.

A gate's `doctor-tools:` dependency resolves against the same closed set: `repo-config validate`
rejects a gate naming a tool in neither the built-in table nor `doctor.extra-tools`. So declaring a
tool here is also what lets a new gate depend on an external binary with no Rhino source change.

This repository declares three: `java` for the LMS backend's JDK, and `go` and `golangci-lint` for
the Roots backend lane. The table above plus those three is today's complete inventory.

## Not checked by doctor

The toolchains that exist only to format the AyoKoding course corpora — Lua (`stylua`), Python
(`ruff`), and Elixir (`mix format`). They are installed by hand in Phases 4, 6, and 8, and enforced
by their own `format-*` gates in `repo-config.yml`. `doctor --fix` will not install them. They are
absent from `doctor.extra-tools` deliberately: `doctor` reports on the toolchain a contributor
needs to build and test, and these are needed only to format one content corpus.

Go used to be on that list. Once `apps/roots-be` shipped it became a build-and-test toolchain
rather than a formatter-only one, and moved into `doctor.extra-tools` with a `required-version`
floor. A language crosses that line when the first project is written in it, not when its formatter
gate is added.
