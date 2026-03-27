# Requirements: Repository Pattern for Demo Backend Apps

## Problem Statement

Four demo backend apps access the database without an abstract repository layer. This means:

1. Unit tests cannot use lightweight mocks — they must spin up real SQLite in-memory databases
2. There is no clean interface boundary between business logic and data access
3. The three-level testing standard (unit/integration/e2e) cannot leverage different
   implementations per level as intended

## Current State

### demo-be-fsharp-giraffe

- **No repository layer at all** — 8 handler files call `ctx.GetService<AppDbContext>()` directly
  and run EF Core queries inline (Admin, Attachment, Auth, Expense, Report, Test, Token, User)
- Tests use real SQLite (`EnsureCreated`) for unit, real Postgres for integration
- Entities: User, Expense, Attachment, RevokedToken, RefreshToken
- ORM: Entity Framework Core

### demo-be-rust-axum

- **Free functions, no trait abstraction** — 5 files in `src/db/` contain async functions that
  take `&AnyPool` as a parameter; handlers call them directly
- Tests use real SQLite in-memory via `create_test_pool("sqlite::memory:")`
- Entities: User, Expense, Attachment, RevokedToken, RefreshToken
- DB library: sqlx with raw SQL

### demo-be-python-fastapi

- **Concrete repository classes, no Protocol** — 4 repo classes in a single
  `infrastructure/repositories.py` file, injected via FastAPI `Depends()`, but no abstract
  `Protocol` to program against
- Missing `RefreshTokenRepository` — refresh token logic is inline in router files
- Tests use real SQLite in-memory via `create_engine("sqlite://...")`
- Entities: User, Expense, Attachment, RevokedToken, RefreshToken
- ORM: SQLAlchemy 2.x

### demo-be-clojure-pedestal

- **Plain namespace functions, no defprotocol** — 4 repo namespaces with `defn` functions that
  take a datasource; handlers require the namespace and call functions directly
- 8 handler namespaces access the DB (admin, attachment, auth, expense, report, test_api, token,
  user); 2 do not (health, jwks)
- No `RefreshToken` entity (uses stateless approach)
- Tests use real SQLite in-memory via `schema/create-schema!`
- Entities: User, Expense, Attachment, RevokedToken
- DB library: next.jdbc with raw SQL

## Acceptance Criteria

### Per-App Criteria

```gherkin
Feature: Repository pattern abstraction

  Scenario: Abstract repository interfaces exist for all entities
    Given a demo backend app
    When I inspect the repository layer
    Then each entity has an abstract interface (trait/Protocol/defprotocol/function record)
    And each interface defines all CRUD and query operations for that entity
    And at least one concrete implementation exists (DB-backed)

  Scenario: Handlers do not access the database directly
    Given a demo backend app with the repository pattern
    When I inspect the handler/router/controller layer
    Then no handler imports or calls DB libraries directly
    And all data access goes through injected repository interfaces

  Scenario: Unit tests use mock repositories
    Given a demo backend app with the repository pattern
    When I run unit tests
    Then repositories are provided as in-memory mock implementations
    And no real database connection is created
    And tests pass with the same Gherkin specs

  Scenario: Integration tests use real DB repositories
    Given a demo backend app with the repository pattern
    When I run integration tests
    Then repositories are the real DB-backed implementations
    And tests connect to PostgreSQL via docker-compose
    And tests pass with the same Gherkin specs

  Scenario: Coverage threshold is maintained
    Given a demo backend app after repository pattern refactor
    When I run test:quick
    Then line coverage is >= 90%
    And all existing tests still pass
```

### Cross-App Criteria

```gherkin
Feature: Consistent repository pattern across demo apps

  Scenario: All demo backend apps use repository pattern
    Given all 4 apps modified by this plan (demo-be-python-fastapi, demo-be-clojure-pedestal,
      demo-be-rust-axum, demo-be-fsharp-giraffe)
    When I inspect their data access layer
    Then every app has abstract repository interfaces
    And every app injects repositories rather than accessing DB directly

  # Constraint: demo-fs-ts-nextjs is already compliant and is not modified by this plan.
  # It is listed in the README compliance table for completeness.

  Scenario: Three-level testing works with repository seams
    Given any demo backend app
    When unit tests run
    Then mock/in-memory repositories are used (no DB)
    When integration tests run
    Then real DB repositories are used (PostgreSQL)
    When e2e tests run
    Then the full stack runs with real DB
```

## Non-Functional Requirements

- **Coverage**: Line coverage must remain >= 90% for all four apps after refactor (enforced by
  `rhino-cli test-coverage validate` in `test:quick`)
- **No DB in unit tests**: Unit tests must pass without a real database connection — in-memory
  implementations must satisfy all Gherkin specs previously satisfied by SQLite in-memory
- **No API change**: The public REST API contract (routes, request/response schemas) must not
  change — only internal data-access wiring is affected
- **No test runtime regression**: Replacing SQLite in-memory startup with pure in-memory
  implementations must not increase overall unit test suite duration

## Out of Scope

- Changing the DB library or ORM in any app
- Adding new entities or API endpoints
- Changing integration or e2e test infrastructure (docker-compose, Playwright)
- Modifying apps that already have proper repository abstractions
- Adding a service layer where one does not exist (only the repository seam)
