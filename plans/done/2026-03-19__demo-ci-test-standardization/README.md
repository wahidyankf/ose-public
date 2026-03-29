# Demo CI and Test Standardization

**Status**: Done

**Created**: 2026-03-19

**Delivery Type**: Multi-phase rollout

**Git Workflow**: Trunk Based Development (work on `main` branch)

## Overview

The demo app ecosystem (11 backends, 3 frontends, 2 E2E apps) has grown organically across multiple
plans. Each new backend or frontend was added with its own CI workflow, test targets, Docker
infrastructure, and coverage setup. While all apps nominally follow the three-level testing standard,
a detailed audit reveals significant inconsistencies that undermine reliability, maintainability, and
developer confidence.

This plan standardizes CI workflows, Nx test targets, Docker infrastructure, and tooling versions
across all 16 demo apps to establish a single, predictable pattern that new apps can replicate and
existing apps can rely on.

### Problem Statement

Four categories of drift have accumulated:

1. **CI version mismatches** — The main CI pipeline (`main-ci.yml`) and individual scheduled test
   workflows (`test-demo-be-*.yml`) use different language versions. Go is 1.26.0 in main CI but
   1.24 in scheduled workflows. Elixir is 1.19 vs 1.18. Python is 3.13 vs 3.12. Tests may pass in
   one pipeline but fail in another, or worse, pass in both but with subtly different behavior.

2. **Nx target inconsistencies** — Missing `typecheck` targets (Go, Rust, Kotlin, Clojure),
   duplicated `test:unit`/`test:quick` (Elixir), F# and Flutter bundling lint inside `test:quick`,
   missing `typecheck` codegen dependency (Elixir, Python), inconsistent `cache` settings,
   inconsistent `dependsOn` for `codegen`, missing `build` codegen dependency (most backends), and
   non-standard `test:quick` in E2E apps. The three-level testing standard exists on paper but is
   unevenly implemented.

3. **Spec and contract consumption gaps** — The three-level testing standard requires all test
   levels to consume Gherkin specs from `specs/apps/demo/` and generated contracts from
   `specs/apps/demo/contracts/`. In practice, several backends have incomplete `inputs` declarations
   (specs/contracts missing from test:unit), no `spec-coverage` validation in `test:quick`, and
   inconsistent contract consumption across test levels.

4. **Docker/infrastructure drift** — Health check commands vary (wget vs curl), timeouts range from
   4 to 10 minutes with no rationale, start periods range from 30s to 300s, and database naming
   conventions are inconsistent across backends.

### Current State Audit

#### CI Version Mismatches

| Tool    | main-ci.yml | Scheduled Workflows            | Delta   |
| ------- | ----------- | ------------------------------ | ------- |
| Go      | 1.26.0      | 1.24 (4 workflows: gin + 3 FE) | 2 minor |
| Elixir  | 1.19        | 1.18 (1 workflow)              | 1 minor |
| Python  | 3.13        | 3.12 (1 workflow)              | 1 minor |
| Rust    | stable      | stable                         | OK      |
| .NET    | 10.0.x      | N/A (Docker)                   | OK      |
| Node.js | 24          | 24                             | OK      |
| Java    | 21+25       | N/A (Docker)                   | OK      |
| Flutter | stable      | stable                         | OK      |
| Clojure | latest      | 21+latest                      | OK      |

#### Missing Nx Targets

| App                      | typecheck | lint | Notes                                              |
| ------------------------ | --------- | ---- | -------------------------------------------------- |
| demo-be-golang-gin       | Missing   | OK   | Go has `go vet` but no typecheck target            |
| demo-be-rust-axum        | Missing   | OK   | Rust compiles = typechecks, but no Nx target       |
| demo-be-elixir-phoenix   | Exists    | OK   | Has typecheck but missing `dependsOn: ["codegen"]` |
| demo-be-python-fastapi   | Exists    | OK   | Has typecheck but missing `dependsOn: ["codegen"]` |
| demo-be-kotlin-ktor      | Missing   | OK   | detekt lint exists, but no typecheck target        |
| demo-be-clojure-pedestal | Missing   | OK   | clj-kondo lint exists, but no typecheck target     |

#### Test Target Anomalies

| Issue                                    | Apps Affected                                   |
| ---------------------------------------- | ----------------------------------------------- |
| test:unit = test:quick (identical)       | demo-be-elixir-phoenix                          |
| lint/format bundled in test:quick        | demo-be-fsharp-giraffe, demo-fe-dart-flutterweb |
| No coverage enforcement in test:quick    | demo-fe-dart-flutterweb                         |
| typecheck missing codegen dependency     | demo-be-elixir-phoenix, demo-be-python-fastapi  |
| build missing codegen dependency         | 10 of 11 backends (only Rust has it)            |
| Non-standard test:quick (lint only)      | demo-be-e2e, demo-fe-e2e                        |
| Inconsistent cache declarations          | Most backends (rely on nx.json default)         |
| Missing test:quick outputs (for caching) | Most backends                                   |

#### Spec and Contract Consumption Gaps

**Gherkin spec consumption** — Whether test target inputs include
`specs/apps/demo/be/gherkin/**/*.feature`:

| App                       | test:unit inputs | test:quick inputs | test:integration (Docker mount) |
| ------------------------- | ---------------- | ----------------- | ------------------------------- |
| demo-be-golang-gin        | Missing          | Has specs         | Has `/specs:ro` mount           |
| demo-be-java-springboot   | Has specs        | Has specs         | Has `/specs:ro` mount           |
| demo-be-java-vertx        | Has specs        | Has specs         | Has `/specs:ro` mount           |
| demo-be-elixir-phoenix    | Has specs        | Has specs         | Has `/specs:ro` mount           |
| demo-be-python-fastapi    | Has specs        | Has specs         | Has `/specs:ro` mount           |
| demo-be-rust-axum         | Has specs        | Has specs         | Has `/specs:ro` mount           |
| demo-be-fsharp-giraffe    | Missing          | Has specs         | Has `/specs:ro` mount           |
| demo-be-ts-effect         | Has specs        | Has specs         | Has `/specs:ro` mount           |
| demo-be-kotlin-ktor       | Missing          | Has specs         | Has `/specs:ro` mount           |
| demo-be-csharp-aspnetcore | Missing          | Has specs         | Has `/specs:ro` mount           |
| demo-be-clojure-pedestal  | Has specs        | Has specs         | Has `/specs:ro` mount           |

**Generated contract consumption** — Whether test target inputs include
`generated-contracts/` and codegen is a transitive dependency:

| App                       | test:unit inputs   | test:quick inputs  | test:integration (Docker COPY) |
| ------------------------- | ------------------ | ------------------ | ------------------------------ |
| demo-be-golang-gin        | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-java-springboot   | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-java-vertx        | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-elixir-phoenix    | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-python-fastapi    | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-rust-axum         | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-fsharp-giraffe    | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-ts-effect         | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-kotlin-ktor       | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-csharp-aspnetcore | No contracts input | No contracts input | COPY generated-contracts/      |
| demo-be-clojure-pedestal  | No contracts input | No contracts input | COPY generated-contracts/      |

**Spec-coverage validation** — Whether `test:quick` runs `rhino-cli spec-coverage validate`:

- **0 of 11** demo backends run spec-coverage validation
- **0 of 3** demo frontends run spec-coverage validation
- **0 of 2** E2E apps run spec-coverage validation
- Only `organiclever-fe` uses spec-coverage validation in the entire repo

#### E2E Workflow Patterns

| Pattern                     | Apps                                       |
| --------------------------- | ------------------------------------------ |
| Uses `test:e2e` (full)      | demo-be-golang-gin only                    |
| Uses `test:e2e:no-test-api` | All other 10 backends                      |
| Backend E2E always builds   | demo-fe-ts-nextjs (never TanStack/Flutter) |

#### Docker Health Check Variance

| Backend          | Start Period | Wait Timeout | Health Command |
| ---------------- | ------------ | ------------ | -------------- |
| Go/Gin           | 30s          | 4 min        | wget           |
| Java/SpringBoot  | 60s          | 4 min        | wget           |
| Java/Vert.x      | 240s         | 2.5 min      | wget           |
| Kotlin/Ktor      | 120s         | 6 min        | wget           |
| Clojure/Pedestal | 120s         | 10 min       | wget           |
| Elixir/Phoenix   | 180s         | 6 min        | curl           |
| Python/FastAPI   | 30s          | 4 min        | curl           |
| Rust/Axum        | 300s         | 10 min       | curl           |
| F#/Giraffe       | 120s         | 6 min        | curl           |
| TS/Effect        | 60s          | 4 min        | curl           |
| C#/ASP.NET       | 120s         | 6 min        | curl           |

## Goals

1. **Version parity** — All CI pipelines (main, PR, scheduled) use identical language/tool versions
2. **Target completeness** — Every demo-be app has all mandatory Nx targets (`codegen`, `typecheck`,
   `lint`, `build`, `test:unit`, `test:quick`, `test:integration`) with correct semantics
3. **Target consistency** — Identical cache settings, inputs, outputs, and `dependsOn` chains across
   all apps of the same type (backend vs frontend)
4. **Separation of concerns** — `test:quick` does unit tests + coverage only (no lint/format);
   `test:unit` and `test:quick` are distinct
5. **Spec consumption at all levels** — Every test target (`test:unit`, `test:quick`,
   `test:integration`) declares Gherkin specs in its `inputs` for cache invalidation; every backend
   consumes specs from `specs/apps/demo/be/gherkin/` at all three test levels
6. **Contract consumption at all levels** — Every test target declares `generated-contracts/` in
   its `inputs` for cache invalidation; contract types are used in source code (already done per
   API contract adoption plan); Nx caching invalidates when contracts change
7. **Spec-coverage validation** — Every demo backend `test:quick` runs `rhino-cli spec-coverage
validate` to ensure all Gherkin scenarios have matching test implementations
8. **Docker standardization** — Consistent health check approach, reasonable timeouts
9. **Frontend parity** — Flutter frontend has coverage enforcement matching TypeScript frontends
10. **E2E app alignment** — E2E apps have appropriate test:quick semantics

## Scope

### In Scope

- Updating language versions in scheduled CI workflows to match main-ci.yml
- Adding missing typecheck Nx targets (Go, Rust, Kotlin, Clojure)
- Fixing missing codegen dependencies on existing typecheck/build targets
- Separating test:unit from test:quick where they are duplicated (Elixir)
- Removing lint/format from test:quick where bundled
- Adding coverage enforcement to Flutter frontend test:quick
- Standardizing cache, inputs, outputs, dependsOn across all project.json files
- Adding Gherkin spec paths to all test target `inputs` (for cache invalidation)
- Adding `generated-contracts/` to all test target `inputs` (for cache invalidation)
- Adding `rhino-cli spec-coverage validate` to all demo backend `test:quick` targets
- Standardizing Docker health check commands and timeouts
- Updating all related documentation (governance, reference, how-to, per-app READMEs, specs)
- Validating via main CI push + all 15 scheduled E2E workflow triggers

### Out of Scope

- Changing the three-level testing standard itself
- Adding new test scenarios or Gherkin specs
- Changing the contract codegen approach
- Modifying E2E test infrastructure (Playwright, bddgen)
- Changing which frontend is built in backend E2E workflows
- Adding test:e2e targets to individual backend project.json files (E2E runs via demo-be-e2e)
- Adding test:integration to frontend apps (unit + MSW is sufficient for frontends)

## Plan Structure

- **[requirements.md](./requirements.md)** — Objectives, user stories, functional/non-functional
  requirements, acceptance criteria
- **[tech-docs.md](./tech-docs.md)** — Canonical target definitions, version matrix, Docker
  standardization approach, design decisions
- **[delivery.md](./delivery.md)** — Phased implementation with per-file granular checklists
