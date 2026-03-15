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
updated: 2026-03-13
---

# Three-Level Testing Standard

Defines the mandatory three-level testing architecture for all projects in the monorepo. The standard applies universally with project-type-specific adaptations. Demo-be backends consume shared Gherkin specifications from `specs/apps/demo/be/gherkin/` at all three levels. Other projects follow the same isolation boundaries appropriate to their domain.

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
| Gherkin specs     | **Must consume** shared specs from `specs/apps/demo/be/gherkin/`    |
| Database          | Mocked repositories / in-memory stores                              |
| HTTP layer        | None — call service functions directly                              |
| External services | None                                                                |
| Coverage          | Measured here (>=90% line coverage via `rhino-cli`)                 |
| Nx caching        | `cache: true` (deterministic)                                       |
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
| Gherkin specs     | **Must consume** shared specs from `specs/apps/demo/be/gherkin/`        |
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

| Aspect            | Rule                                                             |
| ----------------- | ---------------------------------------------------------------- |
| Dependencies      | **All real** — real HTTP, real database, real server             |
| Gherkin specs     | **Must consume** shared specs from `specs/apps/demo/be/gherkin/` |
| Database          | Real PostgreSQL (via docker-compose in CI)                       |
| HTTP layer        | Real HTTP requests via Playwright                                |
| External services | As needed                                                        |
| Coverage          | Not measured at this level                                       |
| Nx caching        | `cache: false` (full stack = non-deterministic)                  |
| Runs in           | Scheduled CI (per-service workflows)                             |

**Architecture**: Playwright sends real HTTP requests to a running server backed by a real database.

```
Playwright -> HTTP Request -> Running Server -> Real PostgreSQL
```

## Spec Consumption Summary

All three levels consume the same 76 Gherkin scenarios from 13 feature files in `specs/apps/demo/be/gherkin/`. The difference is HOW the step definitions execute them:

| Level       | Step Implementation                          | What Varies                |
| ----------- | -------------------------------------------- | -------------------------- |
| Unit        | Calls service functions with mocked repos    | Repository implementations |
| Integration | Calls service functions with real PostgreSQL | Database (real vs mock)    |
| E2E         | Sends HTTP requests via Playwright           | Entire stack (HTTP + DB)   |

## Per-Backend Implementation Pattern

Each demo-be backend must have:

```
apps/demo-be-{lang}-{framework}/
  tests/
    unit/          # Unit test step definitions (mocked repos)
    integration/   # Integration test step definitions (real DB, no HTTP)
  docker-compose.integration.yml   # PostgreSQL + test runner
  Dockerfile.integration           # Integration test container
  project.json                     # test:unit, test:integration, test:e2e targets
```

The exact directory structure varies by language convention (e.g., Go uses `_test.go` files, Java uses `src/test/java/`, Elixir uses `test/`).

## Applicability by Project Type

The three-level standard applies universally, with adaptations per project type:

| Project Type                  | Unit                         | Integration                      | E2E                                  | Gherkin Specs                 |
| ----------------------------- | ---------------------------- | -------------------------------- | ------------------------------------ | ----------------------------- |
| Demo-be API backend           | All mocked + specs           | Real PostgreSQL, no HTTP + specs | Playwright + specs                   | `specs/apps/demo/be/gherkin/` |
| Web UI app (organiclever-web) | Vitest mocks                 | MSW in-process (cacheable)       | Playwright                           | Project-specific              |
| CLI app (Go)                  | Go test mocks                | Godog BDD in-process (cacheable) | N/A                                  | `specs/{app}/`                |
| Library (Go)                  | Go test mocks                | Godog BDD in-process (cacheable) | N/A                                  | `specs/{lib}/`                |
| Demo-fe frontend              | Vitest/Flutter mocks + specs | N/A                              | Playwright (via demo-fe-e2e) + specs | `specs/apps/demo/fe/gherkin/` |
| Hugo site                     | Exempt                       | Exempt                           | Exempt                               | N/A                           |
| E2E runner                    | N/A                          | N/A                              | Playwright                           | Shared specs                  |

**Key rules by project type**:

- **Demo-be backends**: All three levels mandatory; all consume Gherkin specs; integration uses real PostgreSQL with no HTTP
- **Web UI apps**: All three levels mandatory; integration uses in-process mocking (MSW); cacheable
- **CLI apps**: Unit + integration mandatory; integration uses Godog BDD with in-process command execution; cacheable
- **Libraries**: Unit mandatory; integration optional (Godog BDD with public API calls); cacheable
- **Demo-fe frontends**: Two-level testing (unit + E2E); no integration tier; all consume Gherkin specs from `specs/apps/demo/fe/gherkin/`; E2E via centralized `demo-fe-e2e` Playwright suite
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
