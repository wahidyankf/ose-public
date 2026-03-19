# demo-be-java-vertx

Java + Vert.x REST API backend — a functional twin of `demo-be-golang-gin` (Go/Gin),
`demo-be-elixir-phoenix` (Elixir/Phoenix), and other demo-be backends using Java and Eclipse Vert.x.

## Tech Stack

| Concern     | Choice                               |
| ----------- | ------------------------------------ |
| Language    | Java 25                              |
| Framework   | Eclipse Vert.x 4.x (Vert.x Web)      |
| Build       | Maven                                |
| Database    | PostgreSQL (via Vert.x SQL Client)   |
| JWT         | Vert.x Auth JWT                      |
| Passwords   | jBCrypt                              |
| BDD Tests   | Cucumber JVM + JUnit 5 + Vert.x Test |
| Coverage    | JaCoCo (XML) + rhino-cli validate    |
| Linting     | Checkstyle                           |
| Null Safety | JSpecify @NullMarked + NullAway      |
| Port        | 8201                                 |

## Local Development

### Prerequisites

- JDK 25+
- PostgreSQL (or use Docker Compose)

### Environment Variables

| Variable            | Default                                               | Description         |
| ------------------- | ----------------------------------------------------- | ------------------- |
| `PORT`              | `8201`                                                | HTTP port           |
| `DATABASE_URL`      | `jdbc:postgresql://localhost:5432/demo_be_java_vertx` | JDBC connection URL |
| `DATABASE_USER`     | `demo_be_java_vertx`                                  | Database username   |
| `DATABASE_PASSWORD` | `demo_be_java_vertx`                                  | Database password   |
| `JWT_SECRET`        | (dev default)                                         | JWT signing secret  |

### Run locally

```bash
# Start PostgreSQL
docker compose -f ../../infra/dev/demo-be-java-vertx/docker-compose.yml up -d demo-be-java-vertx-db

# Run dev server
mvn compile exec:java

# Health check
curl http://localhost:8201/health
```

## Nx Targets

```bash
nx build demo-be-java-vertx                    # Compile with Maven (depends on codegen)
nx dev demo-be-java-vertx                      # Start development server
nx run demo-be-java-vertx:typecheck            # Annotation + null-safety check (JSpecify + NullAway; depends on codegen)
nx run demo-be-java-vertx:test:quick           # Unit tests + coverage gate (fast, cacheable)
nx run demo-be-java-vertx:test:unit            # Unit tests only (mvn test)
nx run demo-be-java-vertx:test:integration     # Integration tests via Docker Compose + PostgreSQL
nx lint demo-be-java-vertx                     # Run Checkstyle + PMD
```

`codegen` generates Java model classes from the OpenAPI contract spec into `generated-contracts/`
and is a dependency of both `typecheck` and `build`.

## API Endpoints

See [plan README](../../plans/done/2026-03-11__demo-be-java-vertx/README.md) for the full API surface.

## Test Architecture

Three-level testing strategy with clear separation of concerns.

### Level 1: Unit Tests (`test:unit` / `test:quick`)

Runs with `mvn test` (default Maven profile, no `-P` flag needed).

- **Cucumber BDD scenarios** (76 scenarios): All Gherkin feature files from
  `specs/apps/demo/be/gherkin/` run against an in-process Vert.x HTTP server
  backed by in-memory repositories (ConcurrentHashMap). Step definitions live in
  `src/test/java/.../unit/steps/`. Runner: `UnitCucumberTest.java`.
- **Plain JUnit tests**: `ExpenseValidatorTest`, `JwtServiceTest`, `PasswordServiceTest`,
  `UserValidatorTest`, `HandlerNullGuardTest` (NullAway compliance paths via Mockito).
- **Coverage error-path tests**: `UnitCoverageTest.java` exercises HTTP error paths
  (null bodies, forbidden access, expired tokens) not covered by Gherkin scenarios.
- **Coverage**: JaCoCo generates `target/site/jacoco/jacoco.xml`, validated by
  `rhino-cli test-coverage validate` at the 90% threshold.
- **What is mocked**: No external services. All repositories are in-memory
  (`InMemoryUserRepository`, `InMemoryExpenseRepository`, etc.).

### Level 2: Integration Tests (`test:integration`)

Runs via `docker compose` against a real PostgreSQL database.

- **Docker Compose**: `docker-compose.integration.yml` starts a PostgreSQL 17 container
  and a test-runner container (`Dockerfile.integration`).
- **Profile**: `mvn test -Pintegration` runs both `*IT.java` Cucumber runners and
  unit tests, with JaCoCo producing `target/site/jacoco-integration/jacoco.xml`.
- **What is real**: PostgreSQL database with schema auto-migration.
- **Not cached**: Each run starts fresh containers (`cache: false`).

### Level 3: E2E Tests (`demo-be-e2e`)

Runs Playwright against any backend implementation. See `apps/demo-be-e2e/`.

### Test Commands Summary

| Command                                                | Scope           | Speed   | Cached |
| ------------------------------------------------------ | --------------- | ------- | ------ |
| `nx run demo-be-java-vertx:test:quick`                 | Unit + coverage | Fast    | Yes    |
| `nx run demo-be-java-vertx:test:unit`                  | Unit only       | Fast    | Yes    |
| `nx run demo-be-java-vertx:test:integration`           | Docker + PG     | Slow    | No     |
| `nx run demo-be-e2e:test:e2e --app=demo-be-java-vertx` | Full E2E        | Slowest | No     |
