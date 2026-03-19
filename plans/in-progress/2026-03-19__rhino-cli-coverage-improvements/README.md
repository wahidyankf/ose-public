# rhino-cli Coverage Improvements

## Status

**Status**: In Progress
**Created**: 2026-03-19
**Scope**: `apps/rhino-cli/` (v0.12.0 → v0.13.0)

## Overview

Enhance rhino-cli's `test-coverage` command family with additional format support, per-file
reporting, coverage merging, diff coverage, and file exclusion. Extend `spec-coverage validate`
to support all demo projects (backends, frontends, E2E) across all languages. All coverage
calculations use the Codecov-compatible algorithm: `covered / (covered + partial + missed)`.

### Current State

rhino-cli v0.12.0 supports 3 coverage formats (Go cover.out, LCOV, JaCoCo XML) with single-file
threshold validation. The tool outputs aggregate coverage percentage and pass/fail status.
`spec-coverage validate` only supports Go and TS/JS test file matching and step extraction.

### Coverage Format Map (All Projects)

| Format           | Projects                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Go cover.out** | rhino-cli, ayokoding-cli, oseplatform-cli, demo-be-golang-gin, golang-commons, hugo-commons                                                                                                                                                                                                                                                 |
| **LCOV**         | demo-be-elixir-phoenix, demo-be-python-fastapi, demo-be-rust-axum, demo-be-fsharp-giraffe, demo-be-csharp-aspnetcore, demo-be-ts-effect, demo-be-clojure-pedestal, demo-fe-ts-nextjs, demo-fe-ts-tanstack-start, demo-fe-dart-flutterweb, organiclever-web, elixir-cabbage, elixir-gherkin, elixir-openapi-codegen, clojure-openapi-codegen |
| **JaCoCo XML**   | demo-be-java-springboot, demo-be-java-vertx, demo-be-kotlin-ktor (Kover `report.xml` -- no "jacoco" in filename, uses content-based detection)                                                                                                                                                                                              |
| **No coverage**  | ayokoding-web, oseplatform-web (Hugo sites), demo-be-e2e, demo-fe-e2e, organiclever-web-e2e (E2E test suites)                                                                                                                                                                                                                               |

All projects are already covered by the existing 3 formats. Cobertura XML (R1) adds future-proofing
for external use cases (GitLab CI, Python default, .NET Coverlet default).

### Goals

1. **Cobertura XML format** -- Add the #2 most widely used coverage format (Python `coverage xml`
   default, .NET Coverlet default, GitLab CI standard)
2. **Per-file reporting** -- Show file-level coverage breakdown to identify weak spots
3. **Coverage merging** -- Combine multiple coverage files into a unified report
4. **Diff coverage** -- Report coverage only for changed lines (git diff), enabling PR quality gates
5. **File exclusion patterns** -- Exclude generated code and test utilities from coverage calculation
6. **spec-coverage multi-language and multi-project support** -- Extend `spec-coverage validate`
   to support all demo projects: 11 backends (10 languages), 3 frontends, and 2 E2E suites.
   Add `--shared-steps` mode for playwright-bdd E2E and shared step libraries. Add file matching,
   scenario extraction, and step extraction for Go, TS/JS, Java, Kotlin, Python, Elixir, Rust,
   F#, C#, Clojure, and Dart. Every Gherkin spec must be implemented without exception.

### Non-Goals

- Coverage trend tracking (better served by Codecov/CI dashboard)
- Istanbul JSON format (JS/TS ecosystem already uses LCOV via Vitest v8)
- Clover XML format (niche, mostly PHP)
- HTML report generation (out of scope for CLI tool)

## Plan Files

- [Requirements](./requirements.md) -- Detailed requirements with Gherkin acceptance criteria
- [Technical Documentation](./tech-docs.md) -- Architecture, design decisions, implementation approach
- [Delivery](./delivery.md) -- Phased delivery checklist with validation steps

## Impact

### Projects Affected

| Component                    | Change                                         |
| ---------------------------- | ---------------------------------------------- |
| `apps/rhino-cli/`            | New parsers, commands, flags, tests            |
| `apps/rhino-cli/README.md`   | Document new features                          |
| All `demo-be-*/project.json` | Potential spec-coverage integration            |
| All `demo-fe-*/project.json` | Potential spec-coverage integration (FE specs) |
| `demo-be-e2e/project.json`   | Potential `--shared-steps` spec-coverage       |
| `demo-fe-e2e/project.json`   | Potential `--shared-steps` spec-coverage       |

### Version Bump

v0.12.0 → v0.13.0 (minor version: new features, backward compatible)
