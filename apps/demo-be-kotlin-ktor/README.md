# demo-be-kotlin-ktor

Kotlin + Ktor REST API backend — a functional twin of `demo-be-golang-gin` (Go/Gin),
`demo-be-elixir-phoenix` (Elixir/Phoenix), and `demo-be-fsharp-giraffe` (F#/Giraffe) using Kotlin, Ktor, and Exposed.

## Tech Stack

| Concern      | Choice                                    |
| ------------ | ----------------------------------------- |
| Language     | Kotlin 2.1 (JVM)                          |
| Framework    | Ktor 3.x (Netty engine)                   |
| Build        | Gradle 8.14 (Kotlin DSL)                  |
| Database ORM | Exposed + PostgreSQL                      |
| JWT          | com.auth0:java-jwt + Ktor JWT auth plugin |
| Passwords    | jBCrypt                                   |
| DI           | Koin 4.x                                  |
| BDD Tests    | Cucumber JVM + JUnit 5 Platform           |
| Coverage     | Kover (JaCoCo XML) + rhino-cli validate   |
| Linting      | detekt                                    |
| Formatting   | ktfmt (Google style)                      |
| Port         | 8201                                      |

## Local Development

### Prerequisites

- JDK 21+
- PostgreSQL (or use Docker Compose)

### Environment Variables

| Variable            | Default                                                | Description         |
| ------------------- | ------------------------------------------------------ | ------------------- |
| `PORT`              | `8201`                                                 | HTTP port           |
| `DATABASE_URL`      | `jdbc:postgresql://localhost:5432/demo_be_kotlin_ktor` | JDBC connection URL |
| `DATABASE_USER`     | `demo_be_kotlin_ktor`                                  | Database username   |
| `DATABASE_PASSWORD` | `demo_be_kotlin_ktor`                                  | Database password   |
| `JWT_SECRET`        | (dev default)                                          | JWT signing secret  |

### Run locally

```bash
# Start PostgreSQL
docker compose -f ../../infra/dev/demo-be-kotlin-ktor/docker-compose.yml up -d demo-be-db

# Run dev server
./gradlew run

# Health check
curl http://localhost:8201/health
```

## Nx Targets

```bash
nx build demo-be-kotlin-ktor              # Compile and package fat JAR (depends on codegen)
nx dev demo-be-kotlin-ktor               # Start development server
nx start demo-be-kotlin-ktor             # Start production JAR
nx run demo-be-kotlin-ktor:codegen       # Generate contract types from OpenAPI spec
nx run demo-be-kotlin-ktor:test:quick    # Unit tests + coverage gate (no lint)
nx run demo-be-kotlin-ktor:test:unit     # Unit tests only (Cucumber + JUnit)
nx run demo-be-kotlin-ktor:test:integration  # Integration tests (Docker + PostgreSQL)
nx lint demo-be-kotlin-ktor              # Run detekt linter
nx run demo-be-kotlin-ktor:typecheck     # Compile Kotlin sources (./gradlew compileKotlin, depends on codegen)
```

## API Endpoints

See [plan README](../../plans/done/2026-03-11__demo-be-kotlin-ktor/README.md) for the full API
surface.

## Test Architecture

Three-level testing strategy following the same pattern as `demo-be-golang-gin`:

### Level 1: Unit Tests (`test:unit` / `testUnit`)

Unit-level Cucumber BDD scenarios + JUnit tests using `UnitServiceDispatcher` which calls
domain/repository logic directly with in-memory repository implementations (ConcurrentHashMap).
No HTTP server, no Koin DI, no external services required.

- **Cucumber step definitions**: `src/test/kotlin/.../unit/steps/`
- **JUnit error-path tests**: `src/test/kotlin/.../unit/UnitErrorPathsTest.kt`, `UnitAdditionalCoverageTest.kt`
- **Service dispatcher**: `UnitServiceDispatcher` mirrors route handler logic, bypassing HTTP
- **Coverage**: Kover instruments only `testUnit`; must pass >= 90% via `rhino-cli`

### Level 2: Integration Tests (`test:integration` / `testIntegration`)

Integration-level Cucumber BDD scenarios + JUnit tests using the same embedded Netty server approach
with in-memory repositories. These share the same Gherkin feature files as unit tests but use a
separate set of step definitions.

- **Cucumber step definitions**: `src/test/kotlin/.../integration/steps/`
- **JUnit error-path tests**: `src/test/kotlin/.../integration/ErrorPathsTest.kt`, `AdditionalCoverageTest.kt`
- **Server**: `TestServer` starts a real Netty instance with Koin DI wired to in-memory repos

### Level 3: E2E Tests (`demo-be-e2e`)

Playwright E2E tests in `apps/demo-be-e2e/` run against a real PostgreSQL database via
`docker-compose.integration.yml`. The `Dockerfile.integration` builds the project inside a container
and runs `testIntegration` against the PostgreSQL service.

### Cucumber Glue Isolation

Both unit and integration test suites share the same Gherkin feature files
(`specs/apps/demo/be/gherkin/`). The `cucumber.glue` system property in each Gradle task controls
which step definitions are used:

- `testUnit`: `cucumber.glue=com.demobektkt.unit.steps`
- `testIntegration`: `cucumber.glue=com.demobektkt.integration.steps`

JUnit test separation uses `@Tag("integration")` annotations on integration-only test classes,
excluded via `excludeTags("integration")` in `testUnit`.

## Database Migrations

This app uses [Flyway Community Edition](https://flywaydb.org/) (Apache 2.0) for schema management.

### Migration files

All SQL migrations live in `src/main/resources/db/migration/` and follow the Flyway naming
convention: `V{N}__{description}.sql` (V + sequential number + double underscore + description).

| File                         | Description                                                               |
| ---------------------------- | ------------------------------------------------------------------------- |
| `V1__create_users.sql`       | `users` table — accounts with audit columns                               |
| `V2__create_tokens.sql`      | `tokens` table — JWT JTI tracking (single table with `token_type` column) |
| `V3__create_expenses.sql`    | `expenses` table — expense entries                                        |
| `V4__create_attachments.sql` | `attachments` table — file attachments for expenses                       |

### How migrations run

Flyway runs automatically on application startup inside `DatabaseFactory.init()`. It checks the
`flyway_schema_history` table, applies any unapplied migrations in version order, and skips
migrations that have already been applied. No manual steps are required.

### Adding a new migration

Create a new file in `src/main/resources/db/migration/` using the next sequential version number:

```
V5__your_description.sql
```

Write standard PostgreSQL DDL. Flyway applies it automatically on the next startup.

### Schema note

This app uses a single `tokens` table with a `token_type` column (values: `ACCESS`, `REFRESH`).
This differs from the 5-table standard used by other demo backends (which split into separate
`refresh_tokens` and `revoked_tokens` tables). The Exposed ORM definitions in
`infrastructure/tables/` reflect this design and stay as-is.

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) — Unit, integration, and E2E testing boundaries
- [Code Coverage Reference](../../docs/reference/re__code-coverage.md) — Coverage tools, thresholds, and local vs Codecov
- [Project Dependency Graph](../../docs/reference/re__project-dependency-graph.md) — Nx dependency visualization
- [Backend Gherkin Specs](../../specs/apps/demo/be/gherkin/README.md) — Shared feature files (source of truth)
- [OpenAPI Contract](../../specs/apps/demo/contracts/README.md) — API contract and codegen
