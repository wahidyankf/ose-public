---
title: Code Coverage Reference
description: How code coverage is measured, validated, and reported across all projects in the monorepo
category: reference
tags:
  - coverage
  - testing
  - codecov
  - rhino-cli
  - quality
created: 2026-03-22
updated: 2026-04-18
---

# Code Coverage Reference

How code coverage is measured locally via `rhino-cli`, uploaded to Codecov,
and why the two can differ.

> **Note**: The polyglot demo apps (`a-demo-be-*`, `a-demo-fe-*`) and their
> per-language coverage tooling were extracted to
> [ose-primer](https://github.com/wahidyankf/ose-primer) on 2026-04-18. That
> repository is the authoritative reference for polyglot coverage patterns
> (Java/JaCoCo, Kotlin/Kover, Python/coverage.py, Rust/cargo-llvm-cov,
> Elixir/excoveralls, C#/Coverlet, Clojure/cloverage, Dart/flutter test).

## Coverage Algorithm

All projects use `rhino-cli test-coverage validate` which implements
Codecov's line-based algorithm:

- **COVERED**: hit count > 0 AND all branches taken (or no branches)
- **PARTIAL**: hit count > 0 but some branches not taken
- **MISSED**: hit count = 0
- **Coverage %** = `covered / (covered + partial + missed)`

Partial lines count as NOT covered, matching Codecov's badge calculation.

## Supported Formats

`rhino-cli` auto-detects the coverage format from the file:

| Format       | Detection                                                                | Used By             |
| ------------ | ------------------------------------------------------------------------ | ------------------- |
| Go cover.out | Default (no other match)                                                 | Go projects         |
| LCOV (.info) | Filename ends in `.info` or contains `lcov`                              | TypeScript, F#      |
| JaCoCo XML   | Filename ends in `.xml` containing `jacoco`, or XML with `<report>` root | (none in this repo) |

## Thresholds

| Project Type    | Threshold | Rationale                               |
| --------------- | --------- | --------------------------------------- |
| CLI tools (Go)  | >= 90%    | Core business logic                     |
| Go libraries    | >= 90%    | Shared utilities                        |
| organiclever-be | >= 90%    | F#/Giraffe backend API                  |
| organiclever-fe | >= 70%    | Frontend app with MSW integration tests |
| ayokoding-web   | >= 80%    | Content platform with UI rendering code |
| oseplatform-web | >= 80%    | Content platform with UI rendering code |

## Per-Project Coverage Details

### Go Projects

**Tool**: `go test -coverprofile=cover.out`
**Format**: Go cover.out (statement-based, mode: set)

| Project         | Coverage File | Threshold | Exclusions |
| --------------- | ------------- | --------- | ---------- |
| rhino-cli       | `cover.out`   | 90%       | None       |
| ayokoding-cli   | `cover.out`   | 90%       | None       |
| oseplatform-cli | `cover.out`   | 90%       | None       |
| golang-commons  | `cover.out`   | 90%       | None       |
| hugo-commons    | `cover.out`   | 90%       | None       |

### TypeScript Projects

**Tool**: Vitest with `@vitest/coverage-v8`
**Format**: LCOV at `coverage/lcov.info`

| Project         | Threshold | Exclusions |
| --------------- | --------- | ---------- |
| organiclever-fe | 70%       | None       |
| ayokoding-web   | 80%       | None       |
| oseplatform-web | 80%       | None       |

### F# Projects

**Tool**: AltCover with `--linecover`
**Format**: LCOV at `coverage/altcov.info`

| Project         | Threshold | Notes                                                                                                |
| --------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| organiclever-be | 90%       | Uses AltCover instead of XPlat Code Coverage to avoid F# `task{}` async state machine BRDA inflation |

## Local vs Codecov Differences

Local validation (`rhino-cli`) and Codecov can report different numbers
for the same project. Understanding why prevents false alarms.

### Why They Can Differ

**rhino-cli** reads only what is in the coverage file. If a file is excluded
via `grep -v` or the coverage tool's own exclusion config, rhino-cli never
sees it.

**Codecov** receives the coverage file AND scans the source tree via the
`paths` directive in `codecov.yml`. If Codecov finds a source file in the
repository that is NOT in the coverage file, it counts every line in that
file as uncovered.

### When They Match

For most languages (TypeScript, F#), the coverage tool itself handles exclusions.
The output file already omits excluded code, so Codecov and rhino-cli see the
same data.

### When They Diverge: Go Projects

Go's `go test -coverprofile` has no exclusion mechanism. It instruments
every package in the module. Without matching ignore rules in `codecov.yml`,
Codecov may count excluded files as having 0% coverage.

**Fix**: Declare excluded file patterns in `codecov.yml` under `ignore:`.
Codecov applies the ignore rules server-side, matching rhino-cli's local result.

### Codecov Ignore Rules

The `codecov.yml` file contains global ignore patterns:

```yaml
ignore:
  - "**/types.go"
  - "**/generated-contracts/**"
```

The `**/types.go` rule prevents Go type-definition files (no executable
statements) from dragging down coverage across all Go projects.

## CI Integration

Coverage is measured during `test:quick` (part of the pre-push hook and
main CI) and uploaded to Codecov on push to `main`.

### Pipeline Flow

1. `test:unit` runs tests and generates the coverage file
2. `rhino-cli test-coverage validate <file> <threshold>` checks locally
3. Both steps are combined in `test:quick`
4. On push to `main`, main-ci uploads coverage files to Codecov
5. Codecov applies `codecov.yml` ignore rules and computes percentages
6. Each project has a Codecov flag with `carryforward: true` so
   non-affected projects retain their previous coverage

### Codecov Flags

Every project with coverage has a flag in `codecov.yml` with a `paths`
filter pointing to its source directory. This scopes Codecov's per-project
reporting:

```yaml
flags:
  rhino-cli:
    paths:
      - apps/rhino-cli/
    carryforward: true
```

## Troubleshooting

### Codecov shows lower coverage than local

1. Check if the coverage file excludes files that exist in the source tree
2. Add matching patterns to `codecov.yml` `ignore:` section
3. Verify the correct coverage file is uploaded in `main-ci.yml`

### Coverage drops after adding a new file

New source files with no test coverage appear as 0% in both rhino-cli and
Codecov. Either write tests or add the file to the appropriate exclusion
config (language tool config or `codecov.yml` ignore).

### `rhino-cli --exclude` flag

`rhino-cli test-coverage validate` supports `--exclude` glob patterns for
runtime exclusion without modifying the coverage file. Note: glob matching
may not work with Go's full module paths in `cover.out` — use `grep -v`
for Go projects instead.

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) - Coverage thresholds and testing levels
- [Project Dependency Graph](./project-dependency-graph.md) - Which projects depend on rhino-cli
- [Nx Configuration](./nx-configuration.md) - How test:quick targets are configured
