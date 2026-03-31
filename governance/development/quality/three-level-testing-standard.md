---
title: Three-Level Testing Standard
description: Defines the three-level testing standard (unit, integration, E2E) for all projects in the monorepo
category: explanation
subcategory: development
tags:
  - testing
  - unit-tests
  - integration-tests
  - e2e-tests
  - bdd
  - gherkin
  - demo-be
created: 2026-03-13
updated: 2026-03-31
---

# Three-Level Testing Standard

Defines the mandatory three-level testing architecture for all projects in the monorepo. The standard applies universally with project-type-specific adaptations. Demo-be backends consume shared Gherkin specifications from `specs/apps/a-demo/be/gherkin/` at all three levels. Other projects follow the same isolation boundaries appropriate to their domain.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Each test level has explicit, non-overlapping boundaries for what is real and what is mocked. There is no ambiguity about whether a test hits a real database or makes HTTP calls.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: All three levels consume the same Gherkin specifications automatically. Adding a new scenario to the shared specs propagates to unit, integration, and E2E tests without manual synchronization.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Three levels — no more, no fewer. Each level tests a distinct concern: business logic (unit), data persistence (integration), full-stack behavior (E2E).

## Conventions Implemented/Respected

- **[Nx Target Standards](../infra/nx-targets.md)**: The three levels map to `test:unit`, `test:integration`, and `test:e2e` Nx targets with standard naming and caching rules.

- **[BDD Spec-to-Test Mapping](../infra/bdd-spec-test-mapping.md)**: All levels consume Gherkin feature files from the shared `specs/` directory, maintaining the 1:1 spec-to-test mapping.

## The Three Levels

### Level 1: Unit Tests (`test:unit`)

**Purpose**: Verify business logic in complete isolation.

| Aspect            | Rule                                                                |
| ----------------- | ------------------------------------------------------------------- |
| Dependencies      | **All mocked** — no real database, no real HTTP, no real filesystem |
| Gherkin specs     | **Must consume** shared specs from `specs/apps/a-demo/be/gherkin/`  |
| Database          | Mocked repositories / in-memory stores                              |
| HTTP layer        | None — call service functions directly                              |
| External services | None                                                                |
| Coverage          | Measured here (>=90% line coverage via `rhino-cli`)                 |
| Nx caching        | `cache: true` (deterministic)                                       |
| Nx inputs         | Source files + `generated-contracts/**/*` + Gherkin specs           |
| Runs in           | `test:quick` (pre-push gate)                                        |

**Architecture**: Step definitions call service/handler functions directly, injecting mocked repository implementations. No HTTP framework, no routing, no serialization.

```
Gherkin Step -> Service Function -> Mocked Repository
```

**Unit tests may also include non-BDD tests** for logic not covered by Gherkin specs — pure functions, validation helpers, algorithmic logic, error edge cases. However, unit tests must NOT duplicate scenarios already covered by the Gherkin specs. The rule: if a Gherkin scenario tests it, the unit test should not re-test the same behavior.

**Example** (conceptual):

```
Given a user "alice" exists
  -> service.createUser(mockRepo, userData)

When I create a product with name "Widget"
  -> service.createProduct(mockRepo, productData)

Then the product should be created successfully
  -> assert(result.isSuccess)
```

### Level 2: Integration Tests (`test:integration`)

**Purpose**: Verify that business logic works correctly with a real database, testing data persistence, migrations, constraints, and transactions.

| Aspect            | Rule                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| Dependencies      | **Real database only** — no HTTP, no external services                  |
| Gherkin specs     | **Must consume** shared specs from `specs/apps/a-demo/be/gherkin/`      |
| Database          | **Real PostgreSQL** via `docker-compose.integration.yml`                |
| HTTP layer        | **None** — call service/repository functions directly, no HTTP dispatch |
| External services | None                                                                    |
| Coverage          | Not measured at this level                                              |
| Nx caching        | `cache: false` (real database = non-deterministic)                      |
| Runs in           | Scheduled CI (combined with E2E in per-service workflows)               |

**Architecture**: Step definitions call service/repository functions directly with a real PostgreSQL connection. No HTTP framework is involved — no MockMvc, no TestClient, no httptest, no ConnTest, no WebApplicationFactory, no fetch, no clj-http, no Router.oneshot.

```
Gherkin Step -> Service Function -> Real PostgreSQL
```

**What "no HTTP" means**: The test harness must NOT:

- Start an HTTP server (even in-process)
- Use HTTP client libraries (even in-process dispatch like MockMvc)
- Route requests through HTTP middleware
- Serialize/deserialize HTTP request/response bodies as part of the test path

The test harness MUST:

- Call service/handler/context functions directly as function calls
- Pass domain objects (not HTTP requests) to the service layer
- Assert on return values (not HTTP response codes)

**Docker infrastructure**: Each backend has:

- `docker-compose.integration.yml` — PostgreSQL + test runner services
- `Dockerfile.integration` — language runtime + test execution

### Level 3: E2E Tests (`test:e2e`)

**Purpose**: Verify the complete system works end-to-end, including HTTP routing, serialization, authentication, and database persistence.

| Aspect            | Rule                                                               |
| ----------------- | ------------------------------------------------------------------ |
| Dependencies      | **All real** — real HTTP, real database, real server               |
| Gherkin specs     | **Must consume** shared specs from `specs/apps/a-demo/be/gherkin/` |
| Database          | Real PostgreSQL (via docker-compose in CI)                         |
| HTTP layer        | Real HTTP requests via Playwright                                  |
| External services | As needed                                                          |
| Coverage          | Not measured at this level                                         |
| Nx caching        | `cache: false` (full stack = non-deterministic)                    |
| Runs in           | Scheduled CI (per-service workflows)                               |

**Architecture**: Playwright sends real HTTP requests to a running server backed by a real database.

```
Playwright -> HTTP Request -> Running Server -> Real PostgreSQL
```

## Spec Consumption Summary

All three levels consume the same shared Gherkin scenarios from [`specs/apps/a-demo/be/gherkin/`](../../../specs/apps/a-demo/be/gherkin/README.md). The difference is HOW the step definitions execute them:

| Level       | Step Implementation                          | What Varies                |
| ----------- | -------------------------------------------- | -------------------------- |
| Unit        | Calls service functions with mocked repos    | Repository implementations |
| Integration | Calls service functions with real PostgreSQL | Database (real vs mock)    |
| E2E         | Sends HTTP requests via Playwright           | Entire stack (HTTP + DB)   |

## Nx Cache Inputs Requirement

For Nx to invalidate cached test results when relevant files change, all `test:unit` and
`test:quick` targets must declare explicit `inputs` in `project.json` that include:

1. **Source files** — language-specific glob patterns (e.g., `{projectRoot}/src/**/*.go`)
2. **Generated contracts** — `{projectRoot}/generated-contracts/**/*` (or `generated_contracts/`
   for Python and Clojure, which use underscore)
3. **Gherkin specs** — `{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature` (demo-be
   backends only)

Without these explicit inputs, Nx may serve a cached result after a Gherkin spec is updated or
after the OpenAPI contract spec triggers a `codegen` run — causing stale test results.

Frontend apps (`a-demo-fe-*`) include generated contracts in `inputs` but do not include Gherkin
specs because they use a separate spec directory (`specs/apps/a-demo/fe/gherkin/`).

See [Nx Target Standards](../infra/nx-targets.md) for the full canonical inputs table per language.

**Note on spec-coverage enforcement**: Running `rhino-cli spec-coverage validate` in `test:quick`
to enforce that all Gherkin scenarios have corresponding step definitions is planned for demo-be
backends but currently deferred. The tool needs enhancement to support demo-be test file naming
conventions (e.g., `health_steps_test.go`) before this can be enforced. Spec-coverage enforcement
is currently active for CLI apps only. This will be addressed in a follow-up plan.

## Coverage Enforcement

Coverage is enforced at three gates:

- **Pre-push hook** — `test:quick` runs `test:unit` + `rhino-cli test-coverage validate` before every push
- **PR quality gate** — same `test:quick` pipeline runs on every pull request in CI
- **Scheduled CRON** — `codecov-upload.yml` uploads coverage reports from `test:quick` on every push to `main`

`test:quick` is defined as `test:unit` followed immediately by `rhino-cli test-coverage validate <coverage-file> <threshold>`. The threshold is project-specific (see "Coverage Threshold Rationale" below).

Coverage is measured **only at the unit level**. Integration tests (`test:integration`) and E2E tests (`test:e2e`) do not measure coverage. Their purpose is correctness at different isolation boundaries, not code coverage.

## Coverage Threshold Rationale

Different project types carry different coverage thresholds, reflecting the practical testability of each category:

| Threshold | Projects                                                                                                       | Rationale                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 90%       | Demo-be backends, CLI apps (Go), Go libs, TS backend (`a-demo-be-ts-effect`)                                   | Core business logic with high mock isolation; all execution paths reachable in unit tests           |
| 80%       | Content platforms (`ayokoding-web`, `oseplatform-web`)                                                         | Significant UI rendering code; some React rendering paths are hard to unit-test                     |
| 75%       | Fullstack (`a-demo-fs-ts-nextjs`)                                                                              | Mixed server+client code; API route handlers and React components share the codebase                |
| 70%       | FE apps (`a-demo-fe-ts-nextjs`, `a-demo-fe-ts-tanstack-start`, `a-demo-fe-dart-flutterweb`, `organiclever-fe`) | API/auth/query layers are fully mocked by design; threshold reflects intentional mocking boundaries |

## Mandatory Test Levels Matrix

The table below states which test levels are mandatory per app type:

| App Type          | test:unit | test:integration            | test:e2e               |
| ----------------- | --------- | --------------------------- | ---------------------- |
| Demo-be backends  | Mandatory | Mandatory (real PostgreSQL) | Mandatory (Playwright) |
| Demo-fe frontends | Mandatory | N/A                         | Mandatory (Playwright) |
| Fullstack apps    | Mandatory | Mandatory                   | Mandatory (Playwright) |
| CLI apps          | Mandatory | Mandatory (real filesystem) | N/A                    |
| Content platforms | Mandatory | Mandatory (MSW)             | Mandatory (Playwright) |
| Libraries         | Mandatory | Optional                    | N/A                    |
| Hugo sites        | Exempt    | Exempt                      | Exempt                 |
| E2E runners       | N/A       | N/A                         | Mandatory              |

## Gherkin-Everywhere Mandate

All testable projects must consume Gherkin specs at **all applicable test levels**. The relationship between unit tests and Gherkin is additive:

- **Unit tests are a superset of Gherkin** — they MUST implement ALL Gherkin scenarios PLUS additional non-Gherkin tests (edge cases, error paths, implementation-specific behavior not captured in feature files)
- **Integration tests stick to Gherkin** — integration step definitions consume the same feature files as unit step definitions; no additional non-BDD tests at this level
- **E2E tests stick to Gherkin** — Playwright step definitions map directly to Gherkin scenarios; no additional non-BDD tests at this level

The Gherkin spec is the shared contract. Unit tests honor it and extend it. Integration and E2E tests honor it exactly.

## No Network in Integration Tests

Integration tests must not make inbound or outbound network calls. This constraint applies across all project types:

- **Demo-be backends**: The test harness calls service/repository functions directly. No HTTP server starts. No HTTP client library is used (no MockMvc, TestClient, httptest, ConnTest, WebApplicationFactory, fetch, clj-http, Router.oneshot). The only real external dependency is the PostgreSQL database.
- **Demo-fe frontends**: Integration tests do not apply (N/A per "Mandatory Test Levels Matrix").
- **CLI apps**: Integration tests drive commands via `cmd.RunE()` in-process. No network calls. The only real dependency is the local filesystem (via `/tmp` fixtures).
- **Content platforms**: Integration tests use MSW (Mock Service Worker) or equivalent in-process mocking. No real HTTP servers start and no real network calls are made.
- **Libraries**: When integration tests apply, they use real filesystem or in-process fixtures. No network calls.

The principle: integration tests introduce exactly one real dependency per project type (database for backends, filesystem for CLI apps, in-process mocking for FE/content). Everything else remains mocked.

## External Dependencies Optional in E2E

E2E tests require real HTTP and a real database. External service dependencies (payment gateways, email providers, SMS services, third-party APIs) are optional at the E2E level and may be mocked:

- The core E2E requirement is real HTTP requests via Playwright against a running server backed by a real database
- External services that are expensive, slow, or environment-dependent may be replaced with test doubles at the E2E level
- When external services are mocked in E2E, the mock boundary must be documented in the test setup so future contributors understand what is real and what is not

## Repository Pattern Requirement

Demo-be backends must implement the repository pattern as the isolation boundary between test levels.

- **Unit tests**: Inject mocked repository implementations into service functions. Service logic is tested without touching the database.
- **Integration tests**: Inject real repository implementations backed by PostgreSQL. The same service layer code runs with a different repository implementation.

This means the service layer is the same code at both levels — only the repository implementation changes. Any divergence between unit and integration test behavior indicates a bug in either the mock or the real repository implementation.

```
Unit:        Service -> MockRepository (in-memory)
Integration: Service -> RealRepository -> PostgreSQL
```

## Contract-Driven Development

Demo apps use OpenAPI 3.1 contracts to define the API surface:

- **Demo apps**: OpenAPI 3.1 spec at `specs/apps/a-demo/contracts/`; the `codegen` Nx target generates types and encoders/decoders into `generated-contracts/` (gitignored)
- **Content platforms and OrganicLever**: Use tRPC, which is typed at compile time without a separate contract file; OrganicLever also maintains an OpenAPI 3.1 spec at `specs/apps/organiclever/contracts/`

The `typecheck` and `build` Nx targets depend on `codegen`. This means contract violations surface during `nx affected -t typecheck` and the pre-push `test:quick` gate. Rust and Flutter additionally declare `codegen` as a dependency of `test:unit` because generated code is required at compile time.

## CI Workflow Mapping

The following table maps GitHub Actions workflows to the test levels they execute:

| Workflow                | test:unit        | test:integration | test:e2e | When           |
| ----------------------- | ---------------- | ---------------- | -------- | -------------- |
| Pre-push hook           | Via `test:quick` | No               | No       | Every push     |
| PR quality gate         | Via `test:quick` | No               | No       | Every PR       |
| `test-a-demo-be-*.yml`  | No               | Yes              | Yes      | CRON 2x daily  |
| `test-a-demo-fe-*.yml`  | No               | No               | Yes      | CRON 2x daily  |
| `test-and-deploy-*.yml` | Via `test:quick` | Yes              | Yes      | CRON 2x daily  |
| `codecov-upload.yml`    | Via `test:quick` | No               | No       | Push to `main` |

The pre-push hook and PR quality gate intentionally omit integration and E2E tests. These tests require Docker infrastructure (PostgreSQL, running servers) and are too slow and environment-dependent to run on every push. Scheduled CRON workflows cover integration and E2E coverage on a regular cadence.

## Spec-Coverage Validation

`rhino-cli spec-coverage validate` ensures every Gherkin scenario has corresponding step definitions. This prevents scenarios from silently having no implementation.

- **Currently active**: CLI apps only (`rhino-cli`, `ayokoding-cli`, `oseplatform-cli`)
- **Planned (Phase 4 of CI standardization)**: `rhino-cli spec-coverage validate` will be added as a `spec-coverage` Nx target to all testable projects once the tool supports demo-be naming conventions (e.g., `health_steps_test.go`)
- **Dependency**: The tool must be enhanced to recognize demo-be test file naming patterns before enforcement can be enabled for backends

When active, `spec-coverage` runs as part of `test:quick` immediately after coverage validation.

## Known Gaps

The following gaps are known and tracked for future resolution:

- **FE unit tests lack Gherkin**: `a-demo-fe-ts-nextjs`, `a-demo-fe-ts-tanstack-start`, `a-demo-fe-dart-flutterweb`, and `organiclever-fe` do not yet consume Gherkin specs at the unit level. A BDD runner compatible with Vitest-based unit tests needs to be selected (tracked in W11 of the CI standardization plan).
- **Content platform Gherkin pending**: `ayokoding-web` and `oseplatform-web` do not yet consume Gherkin specs at any test level. Gherkin consumption for content platforms is planned as part of the same standardization effort.
- **Spec-coverage not enforced for demo-be**: `rhino-cli spec-coverage validate` is not yet active for demo-be backends. See "Spec-Coverage Validation" above.

## Per-Backend Implementation Pattern

Each demo-be backend must have:

```
apps/a-demo-be-{lang}-{framework}/
  tests/
    unit/          # Unit test step definitions (mocked repos)
    integration/   # Integration test step definitions (real DB, no HTTP)
  docker-compose.integration.yml   # PostgreSQL + test runner
  Dockerfile.integration           # Integration test container
  project.json                     # test:unit, test:integration, test:e2e targets
```

The exact directory structure varies by language convention (e.g., Go uses `_test.go` files, Java uses `src/test/java/`, Elixir uses `test/`).

## CLI App Implementation Pattern

Go CLI apps (`rhino-cli`, `ayokoding-cli`, `oseplatform-cli`) consume the same Gherkin specs from `specs/apps/<cli-name>/` at both the unit and integration levels. The difference is what the step definitions use as their I/O substrate:

| Level       | Test File Pattern                       | Step Implementation                                                 | What's Real                   |
| ----------- | --------------------------------------- | ------------------------------------------------------------------- | ----------------------------- |
| Unit        | `{domain}_{action}_test.go` (no tag)    | Calls command logic with mocked I/O via package-level function vars | Application logic only        |
| Integration | `{domain}_{action}.integration_test.go` | Drives command in-process via `cmd.RunE()` against `/tmp` fixtures  | Filesystem + command pipeline |

**Architecture**: Both levels filter scenarios by the same `@tag` from the same feature files. Unit step definitions inject mock function variables (e.g., `readFileFn`, `writeFileFn`) to replace real filesystem calls. Integration step definitions run the full `cmd.RunE()` path against controlled temporary directory fixtures.

```
Unit:        Gherkin Step -> Command Logic -> Mocked I/O function vars
Integration: Gherkin Step -> cmd.RunE()   -> Real /tmp filesystem
```

**Coverage**: Coverage is measured at the unit level only (≥90% line coverage via `rhino-cli test-coverage validate`). Both levels must consume all Gherkin scenarios for their command.

**Spec directory**: `specs/apps/<cli-name>/` — one feature file per command, organized by domain subdirectory.

## Applicability by Project Type

The three-level standard applies universally, with adaptations per project type:

| Project Type                 | Unit                            | Integration                           | E2E                                    | test:quick | Gherkin Specs                          |
| ---------------------------- | ------------------------------- | ------------------------------------- | -------------------------------------- | ---------- | -------------------------------------- |
| Demo-be API backend          | All mocked + specs              | Real PostgreSQL, no HTTP + specs      | Playwright + specs                     | Yes        | `specs/apps/a-demo/be/gherkin/`        |
| Web UI app (organiclever-fe) | Vitest mocks                    | MSW in-process (cacheable)            | Playwright                             | Yes        | Project-specific                       |
| Content platform             | Vitest mocks                    | MSW/tRPC in-process (cacheable)       | Playwright + specs                     | Yes        | `specs/apps/{domain}/{be,fe}/gherkin/` |
| CLI app (Go)                 | Go test mocks + Gherkin (godog) | Godog BDD in-process (cacheable)      | N/A                                    | Yes        | `specs/{app}/`                         |
| Library (Go)                 | Go test mocks                   | Godog BDD in-process (cacheable)      | N/A                                    | Yes        | `specs/{lib}/`                         |
| Demo-fe frontend             | Vitest/Flutter mocks + specs    | N/A                                   | Playwright (via a-demo-fe-e2e) + specs | Yes        | `specs/apps/a-demo/fe/gherkin/`        |
| Fullstack (FS)               | Vitest mocks + specs            | Mandatory (MSW/real DB as applicable) | Playwright + specs                     | Yes        | `specs/apps/a-demo/fs/gherkin/`        |
| Hugo site                    | Exempt                          | Exempt                                | Exempt                                 | Yes\*      | N/A                                    |
| E2E runner                   | N/A                             | N/A                                   | Playwright                             | N/A        | Shared specs                           |

_\* Hugo sites run `test:quick` for link checking only, not test execution._

**Key rules by project type**:

- **Demo-be backends**: All three levels mandatory; all consume Gherkin specs; integration uses real PostgreSQL with no HTTP
- **Content platforms**: All three levels mandatory; integration uses MSW/tRPC in-process mocking (cacheable); Gherkin consumption planned (see "Known Gaps")
- **Web UI apps**: All three levels mandatory; integration uses in-process mocking (MSW); cacheable
- **Fullstack apps**: All three levels mandatory; consume Gherkin specs from `specs/apps/a-demo/fs/gherkin/`
- **CLI apps**: Unit + integration mandatory; both levels consume Gherkin specs via godog; unit mocks all I/O via package-level function variables; integration uses real filesystem with `/tmp` fixtures; cacheable
- **Libraries**: Unit mandatory; integration optional (Godog BDD with public API calls); cacheable
- **Demo-fe frontends**: Two-level testing (unit + E2E); no integration tier; all consume Gherkin specs from `specs/apps/a-demo/fe/gherkin/`; E2E via centralized `a-demo-fe-e2e` Playwright suite
- **Hugo sites**: Exempt from all test levels (only `test:quick` for link checking)

## Anti-Patterns

- **Using HTTP simulation in integration tests**: MockMvc, TestClient, httptest, ConnTest, WebApplicationFactory, fetch, clj-http, Router.oneshot, and similar are all HTTP dispatch mechanisms. Integration tests must bypass the HTTP layer entirely.
- **Using in-memory repositories in integration tests**: The purpose of integration tests is to verify real database behavior. In-memory repositories defeat this purpose.
- **Not consuming Gherkin specs at any level**: Every level must run the shared Gherkin scenarios. A test level that only runs non-BDD tests violates the standard.
- **Measuring coverage at integration or E2E levels**: Coverage is measured only at the unit level. Integration and E2E tests verify correctness at different boundaries, not code coverage.
- **Filtering out BDD tests from unit test runs**: Unit tests must include BDD step definitions that consume Gherkin specs (e.g., `--filter Category=Unit` must not exclude BDD scenarios).
- **Duplicating feature-level tests in unit tests**: Unit tests should consume the shared Gherkin specs via BDD step definitions, not duplicate the same scenarios as non-BDD test methods.

## CI Integration

Integration and E2E tests run together in per-service GitHub Actions workflows named "Test {service name}". Each workflow:

1. Starts PostgreSQL via docker-compose
2. Runs integration tests (direct service calls with real DB)
3. Starts the application server
4. Runs E2E tests via Playwright

See [Nx Target Standards](../infra/nx-targets.md) for CI schedule details.

## Principles Traceability

| Decision                                              | Principle                                                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Three distinct levels with non-overlapping boundaries | [Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md) |
| All levels consume shared Gherkin specs               | [Automation Over Manual](../../principles/software-engineering/automation-over-manual.md) |
| No HTTP in integration tests                          | [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)      |
| Coverage measured only at unit level                  | [Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)      |

## See Also

- [Code Coverage Reference](../../../docs/reference/re__code-coverage.md) - How coverage is measured (rhino-cli algorithm, per-project tools, exclusion patterns, local vs Codecov differences)
