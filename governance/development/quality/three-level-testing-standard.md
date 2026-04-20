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
created: 2026-03-13
updated: 2026-04-02
---

# Three-Level Testing Standard

Defines the mandatory three-level testing architecture for all projects in the monorepo. The standard applies universally with project-type-specific adaptations. Each project consumes shared Gherkin specifications from its own `specs/apps/<app-name>/` directory at all three levels, following the same isolation boundaries appropriate to its domain.

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

| Aspect            | Rule                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| Dependencies      | **All mocked** — no real database, no real HTTP, no real filesystem                 |
| Gherkin specs     | **Must consume** shared specs from the project's `specs/apps/<app-name>/` directory |
| Database          | Mocked repositories / in-memory stores                                              |
| HTTP layer        | None — call service functions directly                                              |
| External services | None                                                                                |
| Coverage          | Measured here (>=90% line coverage via `rhino-cli`)                                 |
| Nx caching        | `cache: true` (deterministic)                                                       |
| Nx inputs         | Source files + `generated-contracts/**/*` + Gherkin specs                           |
| Runs in           | `test:quick` (pre-push gate)                                                        |

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

| Aspect            | Rule                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| Dependencies      | **Real database only** — no HTTP, no external services                              |
| Gherkin specs     | **Must consume** shared specs from the project's `specs/apps/<app-name>/` directory |
| Database          | **Real PostgreSQL** via `docker-compose.integration.yml`                            |
| HTTP layer        | **None** — call service/repository functions directly, no HTTP dispatch             |
| External services | None                                                                                |
| Coverage          | Not measured at this level                                                          |
| Nx caching        | `cache: false` (real database = non-deterministic)                                  |
| Runs in           | Scheduled CI (combined with E2E in per-service workflows)                           |

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

| Aspect            | Rule                                                                                |
| ----------------- | ----------------------------------------------------------------------------------- |
| Dependencies      | **All real** — real HTTP, real database, real server                                |
| Gherkin specs     | **Must consume** shared specs from the project's `specs/apps/<app-name>/` directory |
| Database          | Real PostgreSQL (via docker-compose in CI)                                          |
| HTTP layer        | Real HTTP requests via Playwright                                                   |
| External services | As needed                                                                           |
| Coverage          | Not measured at this level                                                          |
| Nx caching        | `cache: false` (full stack = non-deterministic)                                     |
| Runs in           | Scheduled CI (per-service workflows)                                                |

**Architecture**: Playwright sends real HTTP requests to a running server backed by a real database.

```
Playwright -> HTTP Request -> Running Server -> Real PostgreSQL
```

## Spec Consumption Summary

All three levels consume the same shared Gherkin scenarios from the project's `specs/apps/<app-name>/` directory. The difference is HOW the step definitions execute them:

| Level       | Step Implementation                          | What Varies                |
| ----------- | -------------------------------------------- | -------------------------- |
| Unit        | Calls service functions with mocked repos    | Repository implementations |
| Integration | Calls service functions with real PostgreSQL | Database (real vs mock)    |
| E2E         | Sends HTTP requests via Playwright           | Entire stack (HTTP + DB)   |

## Nx Cache Inputs Requirement

For Nx to invalidate cached test results when relevant files change, all `test:unit` and
`test:quick` targets must declare explicit `inputs` in `project.json` that include:

1. **Source files** — language-specific glob patterns (e.g., `{projectRoot}/src/**/*.go`)
2. **Generated contracts** — `{projectRoot}/generated-contracts/**/*`
3. **Gherkin specs** — `{workspaceRoot}/specs/apps/<app-name>/**/*.feature` (for backends with BDD)

Without these explicit inputs, Nx may serve a cached result after a Gherkin spec is updated or
after the OpenAPI contract spec triggers a `codegen` run — causing stale test results.

Frontend apps include generated contracts in `inputs` but may use a separate spec directory path
(e.g., `specs/apps/<domain>/fe/gherkin/`).

See [Nx Target Standards](../infra/nx-targets.md) for the full canonical inputs table per language.

**Spec-coverage enforcement**: `spec-coverage` is compulsory for all apps and E2E runners.
`rhino-cli spec-coverage validate` runs as the dedicated `spec-coverage` Nx target and is enforced
by the pre-push hook and all scheduled Test CI workflows. Projects with genuine step gaps have the
target deferred temporarily until step implementations are complete. See [Nx Target
Standards](../infra/nx-targets.md) for the full project-by-project status and command flags.

## Coverage Enforcement

Coverage is enforced at three gates:

- **Pre-push hook** — `test:quick` runs `test:unit` + `rhino-cli test-coverage validate` before every push
- **PR quality gate** — same `test:quick` pipeline runs on every pull request in CI

`test:quick` is defined as `test:unit` followed immediately by `rhino-cli test-coverage validate <coverage-file> <threshold>`. The threshold is project-specific (see "Coverage Threshold Rationale" below).

Coverage is measured **only at the unit level**. Integration tests (`test:integration`) and E2E tests (`test:e2e`) do not measure coverage. Their purpose is correctness at different isolation boundaries, not code coverage.

## Coverage Threshold Rationale

Different project types carry different coverage thresholds, reflecting the practical testability of each category:

| Threshold | Projects                                                 | Rationale                                                                                           |
| --------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 90%       | API backends (`organiclever-be`), CLI apps (Go), Go libs | Core business logic with high mock isolation; all execution paths reachable in unit tests           |
| 80%       | Content platforms (`ayokoding-web`, `oseplatform-web`)   | Significant UI rendering code; some React rendering paths are hard to unit-test                     |
| 70%       | FE apps (`organiclever-fe`)                              | API/auth/query layers are fully mocked by design; threshold reflects intentional mocking boundaries |

## Mandatory Test Levels Matrix

The table below states which test levels are mandatory per app type:

| App Type          | test:unit | test:integration            | test:e2e               |
| ----------------- | --------- | --------------------------- | ---------------------- |
| API backends      | Mandatory | Mandatory (real PostgreSQL) | Mandatory (Playwright) |
| CLI apps          | Mandatory | Mandatory (real filesystem) | N/A                    |
| Content platforms | Mandatory | Mandatory (MSW)             | Mandatory (Playwright) |
| FE apps           | Mandatory | N/A                         | Mandatory (Playwright) |
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

- **API backends**: The test harness calls service/repository functions directly. No HTTP server starts. No HTTP client library is used. The only real external dependency is the PostgreSQL database.
- **FE apps**: Integration tests do not apply (N/A per "Mandatory Test Levels Matrix").
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

API backends must implement the repository pattern as the isolation boundary between test levels.

- **Unit tests**: Inject mocked repository implementations into service functions. Service logic is tested without touching the database.
- **Integration tests**: Inject real repository implementations backed by PostgreSQL. The same service layer code runs with a different repository implementation.

This means the service layer is the same code at both levels — only the repository implementation changes. Any divergence between unit and integration test behavior indicates a bug in either the mock or the real repository implementation.

```
Unit:        Service -> MockRepository (in-memory)
Integration: Service -> RealRepository -> PostgreSQL
```

## Contract-Driven Development

Apps with OpenAPI 3.1 contracts use a `codegen` target to define the API surface:

- **OrganicLever**: OpenAPI 3.1 spec at `specs/apps/organiclever/contracts/`; the `codegen` Nx target generates types and encoders/decoders into `generated-contracts/` (gitignored)
- **Content platforms**: Use tRPC, which is typed at compile time without a separate contract file

The `typecheck` and `build` Nx targets depend on `codegen`. This means contract violations surface during `nx affected -t typecheck` and the pre-push `test:quick` gate. Rust and Flutter additionally declare `codegen` as a dependency of `test:unit` because generated code is required at compile time.

## CI Workflow Mapping

The following table maps GitHub Actions workflows to the test levels they execute:

| Workflow                | lint | test:unit        | spec-coverage | test:integration | test:e2e | When          |
| ----------------------- | ---- | ---------------- | ------------- | ---------------- | -------- | ------------- |
| Pre-push hook           | Yes  | Via `test:quick` | Yes           | No               | No       | Every push    |
| PR quality gate         | Yes  | Via `test:quick` | No            | No               | No       | Every PR      |
| `test-and-deploy-*.yml` | Yes  | Via `test:quick` | Yes           | Yes              | Yes      | CRON 2x daily |

`lint` (including static a11y checks via oxlint jsx-a11y plugin for TypeScript UI projects) runs in all three enforcement gates: the pre-push hook, the PR quality gate, and Test CI workflows. `spec-coverage` runs in the pre-push hook and all Test CI workflows, ensuring every Gherkin step has a matching step definition. The pre-push hook intentionally omits integration and E2E tests. These tests require Docker infrastructure (PostgreSQL, running servers) and are too slow and environment-dependent to run on every push. The PR quality gate omits `spec-coverage` because it targets only the fast `test:quick` path used for merge checks. The scheduled `test-and-deploy-*.yml` workflows cover integration, E2E, and spec-coverage on a regular cadence for production apps.

## Spec-Coverage Validation

`rhino-cli spec-coverage validate` ensures every Gherkin step has a matching step definition. This
prevents scenarios from silently having no implementation.

The tool is invoked as the `spec-coverage` Nx target and is enforced by the pre-push hook alongside
`typecheck`, `lint`, and `test:quick`. All four targets are cacheable.

### Flags

**`--shared-steps`**: All projects use this flag. It validates steps across ALL source files in the
supplied directories rather than requiring a 1:1 match between each feature file and a
corresponding step file. This accommodates shared step libraries and the varying naming conventions
across languages (e.g., `health_steps_test.go`, `UserSteps.java`, `user_steps.ex`).

**`--exclude-dir test-support`**: API backends and FE apps use this flag. It excludes
E2E-only `test-support` API spec files from validation. These specs exist only to support E2E
testing infrastructure and are not implemented at the unit or integration level. E2E runners do
**not** use this flag because they implement those steps.

### Project Coverage Status

19 projects currently have `spec-coverage` enforced. 11 projects have it temporarily deferred
pending step implementation. The project-by-project breakdown is maintained in
[Nx Target Standards](../infra/nx-targets.md).

### Relationship to the Three Test Levels

All three test levels (unit, integration, E2E) consume the same Gherkin specs. `spec-coverage`
enforces that every step referenced in the feature files has at least one step definition
somewhere in the project's source tree. It does not verify which test level implements each step —
it verifies that no step is silently unimplemented across all levels combined.

```
Gherkin feature file
  -> spec-coverage validates: every step has a matching step definition
  -> test:unit runs: unit-level step definitions (mocked dependencies)
  -> test:integration runs: integration-level step definitions (real DB, no HTTP)
  -> test:e2e runs: E2E-level step definitions (real HTTP + real DB)
```

## Accessibility Testing

Accessibility testing is compulsory for all UI-related projects and operates at two levels that
complement the three-level testing standard.

### Static A11y Linting (via `lint` target)

All UI projects must include static accessibility checks in their `lint` target. These checks catch
common accessibility violations at compile time and are enforced at all three gates: pre-push hook,
PR quality gate, and scheduled Test CI workflows.

- **TypeScript UI projects** (`organiclever-fe`, `ayokoding-web`, `oseplatform-web`, `libs/ts-ui`):
  `oxlint --jsx-a11y-plugin`

### Runtime Accessibility E2E Tests (via `test:e2e`)

All UI projects must have runtime accessibility E2E tests using `@axe-core/playwright` (axe-core)
covering WCAG AA compliance:

- Color contrast ratios (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation (all interactive elements reachable via Tab/Shift+Tab)
- ARIA labels and roles on interactive elements
- Focus management (focus moves logically, focus traps work correctly)
- Heading hierarchy (no skipped levels, single H1)

### Gherkin Accessibility Specs

UI projects must have an `accessibility.feature` file under a domain subdirectory in
`specs/apps/<domain>/fe/gherkin/` (e.g., `accessibility/accessibility.feature` or
`layout/accessibility.feature`). UI component library specs in
`specs/libs/ts-ui/gherkin/<component>/` must include "Has no accessibility violations" scenarios for
each component.

See [Nx Target Standards](../infra/nx-targets.md) for the full list of projects with static a11y
linting and the enforcement gates.

## Known Gaps

The following gaps are known and tracked for future resolution:

- **FE unit tests lack Gherkin**: `organiclever-fe` does not yet consume Gherkin specs at the unit level. A BDD runner compatible with Vitest-based unit tests needs to be selected.
- **Content platform Gherkin pending**: `ayokoding-web` and `oseplatform-web` do not yet consume Gherkin specs at any test level. Gherkin consumption for content platforms is planned as part of the same standardization effort.
- **Spec-coverage deferred for some projects**: Some projects have `spec-coverage` temporarily deferred until step implementations are complete. See "Spec-Coverage Validation" above and [Nx Target Standards](../infra/nx-targets.md) for the deferred project list.

## Per-Backend Implementation Pattern

Each API backend must have:

```
apps/{backend-name}/
  tests/
    unit/          # Unit test step definitions (mocked repos)
    integration/   # Integration test step definitions (real DB, no HTTP)
  docker-compose.integration.yml   # PostgreSQL + test runner
  Dockerfile.integration           # Integration test container
  project.json                     # test:unit, test:integration, test:e2e targets
```

The exact directory structure varies by language convention (e.g., Go uses `_test.go` files, F# uses `tests/` with xUnit).

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

| Project Type                    | Unit                            | Integration                      | E2E                | test:quick | Gherkin Specs                          |
| ------------------------------- | ------------------------------- | -------------------------------- | ------------------ | ---------- | -------------------------------------- |
| API backend (`organiclever-be`) | All mocked + specs              | Real PostgreSQL, no HTTP + specs | Playwright + specs | Yes        | `specs/apps/<backend-name>/`           |
| Web UI app (`organiclever-fe`)  | Vitest mocks                    | MSW in-process (cacheable)       | Playwright         | Yes        | Project-specific                       |
| Content platform                | Vitest mocks                    | MSW/tRPC in-process (cacheable)  | Playwright + specs | Yes        | `specs/apps/{domain}/{be,fe}/gherkin/` |
| CLI app (Go)                    | Go test mocks + Gherkin (godog) | Godog BDD in-process (cacheable) | N/A                | Yes        | `specs/apps/<cli-name>/`               |
| Library (Go)                    | Go test mocks                   | Godog BDD in-process (cacheable) | N/A                | Yes        | `specs/libs/<lib-name>/`               |
| Hugo site                       | Exempt                          | Exempt                           | Exempt             | Yes\*      | N/A                                    |
| E2E runner                      | N/A                             | N/A                              | Playwright         | N/A        | Shared specs                           |

_\* Hugo sites run `test:quick` for link checking only, not test execution._

**Key rules by project type**:

- **API backends**: All three levels mandatory; all consume Gherkin specs; integration uses real PostgreSQL with no HTTP
- **Content platforms**: All three levels mandatory; integration uses MSW/tRPC in-process mocking (cacheable); Gherkin consumption planned (see "Known Gaps")
- **Web UI apps**: All three levels mandatory; integration uses in-process mocking (MSW); cacheable
- **CLI apps**: Unit + integration mandatory; both levels consume Gherkin specs via godog; unit mocks all I/O via package-level function variables; integration uses real filesystem with `/tmp` fixtures; cacheable
- **Libraries**: Unit mandatory; integration optional (Godog BDD with public API calls); cacheable
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

- [Code Coverage Reference](../../../docs/reference/code-coverage.md) - How coverage is measured (rhino-cli algorithm, per-project tools, exclusion patterns)
