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
updated: 2026-03-22
---

# Code Coverage Reference

How code coverage is measured locally via `rhino-cli`, uploaded to Codecov,
and why the two can differ.

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

| Format       | Detection                                                                | Used By                                                 |
| ------------ | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| Go cover.out | Default (no other match)                                                 | Go projects                                             |
| LCOV (.info) | Filename ends in `.info` or contains `lcov`                              | TypeScript, Python, Rust, Elixir, F#, C#, Clojure, Dart |
| JaCoCo XML   | Filename ends in `.xml` containing `jacoco`, or XML with `<report>` root | Java (Spring Boot, Vert.x)                              |
| Kover XML    | JaCoCo-compatible XML                                                    | Kotlin                                                  |

## Thresholds

| Project Type      | Threshold | Rationale                                     |
| ----------------- | --------- | --------------------------------------------- |
| Demo backends     | >= 90%    | Service-layer code with full Gherkin coverage |
| CLI tools         | >= 90%    | Core business logic                           |
| Go libraries      | >= 90%    | Shared utilities                              |
| Elixir libraries  | >= 90%    | Shared libraries                              |
| Clojure libraries | >= 90%    | Codegen library                               |
| organiclever-fe   | >= 70%    | Frontend app with MSW integration tests       |
| organiclever-be   | >= 90%    | F#/Giraffe backend API                        |
| Demo frontends    | >= 70%    | API/auth/query layers fully mocked by design  |

## Per-Project Coverage Details

### Go Projects

**Tool**: `go test -coverprofile=cover.out`
**Format**: Go cover.out (statement-based, mode: set)

| Project            | Coverage File               | Threshold | Exclusions                                          |
| ------------------ | --------------------------- | --------- | --------------------------------------------------- |
| rhino-cli          | `cover.out`                 | 90%       | None                                                |
| ayokoding-cli      | `cover.out`                 | 90%       | None                                                |
| oseplatform-cli    | `cover.out`                 | 90%       | None                                                |
| golang-commons     | `cover.out`                 | 90%       | None                                                |
| hugo-commons       | `cover.out`                 | 90%       | None                                                |
| demo-be-golang-gin | `cover_unit.out` (filtered) | 90%       | gorm_store, server, cmd/server, generated-contracts |

**Go exclusion caveat**: Go's `go test -coverprofile` has no built-in
exclusion mechanism. `demo-be-golang-gin` uses `grep -v` to create a
filtered `cover_unit.out` that excludes infrastructure files. See
[Local vs Codecov Differences](#local-vs-codecov-differences) for how
this interacts with Codecov.

### Java Projects

**Tool**: JaCoCo (Maven plugin)
**Format**: JaCoCo XML at `target/site/jacoco/jacoco.xml`

| Project                 | Threshold | Exclusions                                                                     |
| ----------------------- | --------- | ------------------------------------------------------------------------------ |
| demo-be-java-springboot | 90%       | JPA models (User, Expense), Application class, JpaAuditingConfig, package-info |
| demo-be-java-vertx      | 90%       | Main class, package-info, META-INF                                             |

Exclusions are configured in `pom.xml` via JaCoCo's `<excludes>` element.
The XML output already reflects exclusions, so rhino-cli and Codecov agree.

### Kotlin Projects

**Tool**: Kover (Gradle plugin)
**Format**: JaCoCo-compatible XML at `build/reports/kover/report.xml`

| Project             | Threshold | Exclusions                       |
| ------------------- | --------- | -------------------------------- |
| demo-be-kotlin-ktor | 90%       | Configured in `build.gradle.kts` |

### TypeScript Projects

**Tool**: Vitest with `@vitest/coverage-v8`
**Format**: LCOV at `coverage/lcov.info`

| Project                   | Threshold | Exclusions                                              |
| ------------------------- | --------- | ------------------------------------------------------- |
| demo-be-ts-effect         | 90%       | `main.ts`, `routes/test-api.ts` (in `vitest.config.ts`) |
| organiclever-fe           | 70%       | None                                                    |
| demo-fe-ts-nextjs         | 70%       | None                                                    |
| demo-fe-ts-tanstack-start | 70%       | None                                                    |

Exclusions are configured in `vitest.config.ts` via the `coverage.exclude`
array. LCOV output already reflects exclusions.

### Python Projects

**Tool**: coverage.py via `uv run coverage`
**Format**: LCOV at `coverage/lcov.info`

| Project                | Threshold | Exclusions                                              |
| ---------------------- | --------- | ------------------------------------------------------- |
| demo-be-python-fastapi | 90%       | `tests/*`, `routers/*`, `main.py` (in `pyproject.toml`) |

Exclusions are configured in `[tool.coverage.run].omit` in `pyproject.toml`.

### Rust Projects

**Tool**: cargo-llvm-cov
**Format**: LCOV at `coverage/lcov.info`

| Project           | Threshold | Exclusions                                  |
| ----------------- | --------- | ------------------------------------------- |
| demo-be-rust-axum | 90%       | None (cargo-llvm-cov covers the full crate) |

### Elixir Projects

**Tool**: excoveralls (coveralls.json config)
**Format**: LCOV at `cover/lcov.info`

| Project                | Threshold | Exclusions                                                                                   |
| ---------------------- | --------- | -------------------------------------------------------------------------------------------- |
| demo-be-elixir-phoenix | 90%       | 19 files in `coveralls.json` (application, repo, behaviours, contexts, telemetry, CORS plug) |

### F# Projects

**Tool**: AltCover with `--linecover`
**Format**: LCOV at `coverage/altcov.info`

| Project                | Threshold | Exclusions                                                                                           |
| ---------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| demo-be-fsharp-giraffe | 90%       | Uses AltCover instead of XPlat Code Coverage to avoid F# `task{}` async state machine BRDA inflation |

### C# Projects

**Tool**: Coverlet (XPlat Code Coverage)
**Format**: LCOV at `coverage/**/coverage.info`

| Project                   | Threshold | Exclusions |
| ------------------------- | --------- | ---------- |
| demo-be-csharp-aspnetcore | 90%       | None       |

### Clojure Projects

**Tool**: cloverage with `--lcov`
**Format**: LCOV at `coverage/lcov.info`

| Project                  | Threshold | Exclusions |
| ------------------------ | --------- | ---------- |
| demo-be-clojure-pedestal | 90%       | None       |

### Dart Projects

**Tool**: `flutter test --coverage`
**Format**: LCOV at `coverage/lcov.info`

| Project                 | Threshold | Exclusions |
| ----------------------- | --------- | ---------- |
| demo-fe-dart-flutterweb | 70%       | None       |

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

For most languages (Java, Python, TypeScript, Rust, Elixir, F#, C#,
Clojure, Kotlin, Dart), the coverage tool itself handles exclusions. The
output file already omits excluded code, so Codecov and rhino-cli see the
same data.

### When They Diverge: Go Projects

Go's `go test -coverprofile` has no exclusion mechanism. It instruments
every package in the module. To exclude infrastructure code,
`demo-be-golang-gin` uses a `grep -v` pipeline to produce a filtered
`cover_unit.out`.

The problem: Codecov receives `cover.out` (unfiltered), but also sees the
source files. Without matching ignore rules in `codecov.yml`, Codecov
counts excluded files as having 0% coverage, producing a lower number.

**Fix applied**: The excluded file patterns are declared in `codecov.yml`
under `ignore:`, and main-ci uploads `cover.out` (unfiltered). Codecov
applies the ignore rules server-side, matching rhino-cli's local result.

### Codecov Ignore Rules

The `codecov.yml` file contains global ignore patterns:

```yaml
ignore:
  - "**/types.go"
  - "apps/demo-be-golang-gin/internal/store/gorm_store.go"
  - "apps/demo-be-golang-gin/internal/server/server.go"
  - "apps/demo-be-golang-gin/cmd/server/**"
  - "**/generated-contracts/**"
```

These patterns apply to ALL flags. The `**/types.go` rule prevents
Go type-definition files (no executable statements) from dragging down
coverage across all Go projects.

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
  demo-be-golang-gin:
    paths:
      - apps/demo-be-golang-gin/
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
- [Project Dependency Graph](./re__project-dependency-graph.md) - Which projects depend on rhino-cli
- [Nx Configuration](./re__nx-configuration.md) - How test:quick targets are configured
