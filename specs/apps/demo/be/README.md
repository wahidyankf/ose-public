# Demo Backend API Specs

Platform-agnostic Gherkin acceptance specifications for a demo-scale backend service covering
authentication, user management, and a multi-currency expense domain. The spec is sized for
ergonomic evaluation — small enough to implement in a weekend, but complex enough to exercise
the patterns that matter: JWT lifecycle, input validation, error handling, password hashing,
dependency injection, decimal money handling, unit-of-measure validation, and file upload
handling.

Supported currencies: **USD** and **IDR**.

## What This Covers

| Domain           | Description                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| health           | Service liveness check                                                                    |
| authentication   | Password login, token refresh, logout                                                     |
| user-lifecycle   | Registration, profile, password change, self-deactivation                                 |
| security         | Password policy, account lockout, admin unlock                                            |
| token-management | JWT claims, JWKS endpoint, token revocation                                               |
| admin            | User listing, search, account control, password reset token                               |
| expenses         | Income/expense CRUD, currency precision, unit-of-measure, P&L reporting, file attachments |

## Three-Level Spec Consumption

Every backend consumes these 76 Gherkin scenarios at **three test levels**. The feature files are the shared contract — only the step implementations differ per level.

| Level           | Nx Target          | What Happens                                                     | Dependencies             |
| --------------- | ------------------ | ---------------------------------------------------------------- | ------------------------ |
| **Unit**        | `test:unit`        | Steps call service/repository functions with mocked dependencies | All mocked               |
| **Integration** | `test:integration` | Steps call service/repository functions with real PostgreSQL     | Real PostgreSQL (Docker) |
| **E2E**         | `test:e2e`         | Playwright makes HTTP requests to running backend                | Full running server      |

### Unit Level

- Steps instantiate services directly with mocked/in-memory repositories
- No framework context (no Spring, no Phoenix, no HTTP server)
- Coverage is measured here (>=90% line coverage via `rhino-cli test-coverage validate`)
- All 76 scenarios must pass

### Integration Level

- Each backend has `docker-compose.integration.yml` (PostgreSQL + test runner) and `Dockerfile.integration` (language runtime)
- Steps call the same service/repository functions but with real PostgreSQL connections
- Migrations run against a fresh database each time
- No HTTP layer — tests call application code directly
- All 76 scenarios must pass
- Coverage is NOT measured at this level

### E2E Level

- Shared Playwright suite in `apps/demo-be-e2e/`
- Tests make real HTTP requests to a running backend
- Runs against any of the 11 backends
- All 76 scenarios must pass

### Recommended Directory Structure for Step Definitions

Each backend should separate unit and integration step definitions:

```
apps/demo-be-{lang}-{framework}/
├── src/                          # Application source code
├── test/
│   ├── unit/                     # Unit-level step definitions (mocked deps)
│   │   ├── steps/                # Gherkin step implementations
│   │   └── support/              # Test helpers, mock factories
│   └── integration/              # Integration-level step definitions (real DB)
│       ├── steps/                # Gherkin step implementations
│       └── support/              # DB connection, migration helpers
├── docker-compose.integration.yml
├── Dockerfile.integration
└── project.json
```

The exact structure varies by language convention (e.g., Go uses `//go:build` tags, Java uses Maven profiles, Elixir uses `--only` tags).

## Implementations

| Implementation            | Language            | Unit Test Framework     | Integration Framework   | E2E runner |
| ------------------------- | ------------------- | ----------------------- | ----------------------- | ---------- |
| demo-be-java-springboot   | Java (Spring)       | Cucumber JVM + mocks    | Cucumber JVM + PG       | Playwright |
| demo-be-elixir-phoenix    | Elixir (Phoenix)    | Cabbage + mocks         | Cabbage + Ecto/PG       | Playwright |
| demo-be-fsharp-giraffe    | F# (Giraffe)        | TickSpec + mocks        | TickSpec + Npgsql/PG    | Playwright |
| demo-be-golang-gin        | Go (Gin)            | Godog + mocks           | Godog + pgx/PG          | Playwright |
| demo-be-python-fastapi    | Python (FastAPI)    | pytest-bdd + mocks      | pytest-bdd + asyncpg/PG | Playwright |
| demo-be-rust-axum         | Rust (Axum)         | cucumber-rs + mocks     | cucumber-rs + sqlx/PG   | Playwright |
| demo-be-kotlin-ktor       | Kotlin (Ktor)       | Cucumber JVM + mocks    | Cucumber JVM + PG       | Playwright |
| demo-be-java-vertx        | Java (Vert.x)       | Cucumber JVM + mocks    | Cucumber JVM + PG       | Playwright |
| demo-be-ts-effect         | TypeScript (Effect) | Cucumber.js + mocks     | Cucumber.js + pg/PG     | Playwright |
| demo-be-csharp-aspnetcore | C# (ASP.NET Core)   | Reqnroll + mocks        | Reqnroll + Npgsql/PG    | Playwright |
| demo-be-clojure-pedestal  | Clojure (Pedestal)  | kaocha-cucumber + mocks | kaocha-cucumber + PG    | Playwright |

Each new language implementation adds its own step definitions at all three levels. The feature
files here are the single source of truth and must not contain language-specific concepts
(framework names, library paths, runtime-specific error formats).

## Spec Artifacts

This spec is organized into two subdirectories:

- **[gherkin/](./gherkin/README.md)** — 13 Gherkin feature files, 76 scenarios, covering 7
  domains
- **[c4/](../c4/README.md)** — C4 architecture diagrams for the demo application

## Feature File Organization

```
specs/apps/demo/be/
├── README.md
└── gherkin/
    ├── README.md
    ├── health/
    │   └── health-check.feature          (2 scenarios)
    ├── authentication/
    │   ├── password-login.feature        (5 scenarios)
    │   └── token-lifecycle.feature       (7 scenarios)
    ├── user-lifecycle/
    │   ├── registration.feature          (6 scenarios)
    │   └── user-account.feature          (6 scenarios)
    ├── security/
    │   └── security.feature              (5 scenarios)
    ├── token-management/
    │   └── tokens.feature                (6 scenarios)
    ├── admin/
    │   └── admin.feature                 (6 scenarios)
    └── expenses/
        ├── expense-management.feature    (7 scenarios)
        ├── currency-handling.feature     (6 scenarios)
        ├── unit-handling.feature         (4 scenarios)
        ├── reporting.feature             (6 scenarios)
        └── attachments.feature           (10 scenarios)
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Running Specs

```bash
# Unit tests (mocked dependencies, coverage measured here)
nx run demo-be-{lang}-{framework}:test:unit

# Integration tests (real PostgreSQL via docker-compose)
nx run demo-be-{lang}-{framework}:test:integration

# E2E tests (Playwright HTTP against running backend)
nx run demo-be-e2e:test:e2e

# Fast quality gate (unit + coverage check)
nx run demo-be-{lang}-{framework}:test:quick
```

## Adding a Feature File

1. Identify the bounded context (e.g., `authentication`, `user-lifecycle`)
2. Create the folder if it does not exist: `specs/apps/demo/be/gherkin/[context]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Open with `Feature:` then a user story block (`As a … / I want … / So that …`)
5. Use `Given the API is running` as the first Background step
6. Use only HTTP-semantic steps — no framework or library names

## Related

- **Parent**: [demo specs](../README.md)
- **Frontend counterpart**: [fe/](../fe/README.md) — UI-semantic frontend specs
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
