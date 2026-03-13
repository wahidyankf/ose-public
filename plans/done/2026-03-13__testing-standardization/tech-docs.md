# Technical Design: Testing Standardization

## New Testing Standard

### Unit Tests (`test:unit`)

- **Infrastructure**: Mocks exclusively. No real databases, no HTTP calls, no API calls, no external services.
- **Entry point**: Call application code directly (service/handler/context functions). NOT through HTTP or Playwright.
- **Spec consumption** (demo-be only): MUST consume all corresponding Gherkin specs from `specs/apps/demo/be/gherkin/`. Gherkin step definitions call service/handler functions with mocked dependencies.
- **Additional scope**: Individual function tests (pure logic, validation, domain rules) that go beyond what Gherkin covers.
- **Applies to**: All projects except Hugo static sites and E2E runners.
- **Deterministic**: Yes. Fully cacheable.

### Integration Tests (`test:integration`)

Integration tests vary by project type:

#### Demo-be Backends (PostgreSQL via docker-compose)

- **Infrastructure**: Runs entirely inside Docker via a per-backend `docker-compose.integration.yml`. Spins up PostgreSQL + test runner containers. No HTTP calls, no API calls, no external service/API calls.
- **Entry point**: Call application code directly (service/handler/context functions). NOT through HTTP or Playwright.
- **Spec consumption**: MUST consume corresponding Gherkin specs. Focus on how components play together with a real database under the restrictions above.
- **Purpose**: Test the service in isolation — verify that business logic, persistence, and data access work correctly together using the same database engine as production.
- **Reproducibility**: The entire test environment is defined in `docker-compose.integration.yml` — anyone with Docker can run integration tests identically, regardless of host OS or installed toolchains.
- **Database lifecycle**: Each test run: (1) `docker compose up` starts PostgreSQL + test runner, (2) test runner waits for PostgreSQL readiness, (3) runs all migrations, (4) executes seed files if present, (5) runs tests, (6) `docker compose down -v` tears down everything including volumes.
- **Deterministic**: Yes (clean containers per run, no shared state). However, NOT cacheable — Docker builds may pull updated base images, and container execution is not tracked by Nx file-based caching.

#### organiclever-web (MSW)

- **Infrastructure**: Mock Service Worker (MSW) for API mocking. In-process, no Docker needed.
- **Entry point**: Component-level tests with mocked API boundaries.
- **Purpose**: Test React components and pages with realistic API responses.
- **Deterministic**: Yes. But NOT cacheable (integration tests are never cached).
- **Status**: Already compliant. No changes needed.

#### Go CLI Apps (BDD)

- **Infrastructure**: Godog BDD tests using feature files from `specs/`. May use tmpdir mocks, mock closures, or in-memory stores. No Docker, no external services.
- **Entry point**: Direct function/command calls via Godog step definitions.
- **Purpose**: Test command workflows and component interactions beyond what unit tests cover.
- **Deterministic**: Yes. But NOT cacheable (integration tests are never cached).
- **Status**: Already compliant. No changes needed for `ayokoding-cli`, `oseplatform-cli`, `rhino-cli`.

**Note on Go libraries**: `golang-commons` and `hugo-commons` already have Godog integration tests. These are retained but **not required** by the rules — libs only need unit tests (Rule 1).

### E2E Tests (`test:e2e`)

- **Infrastructure**: No restrictions. Real HTTP calls, real PostgreSQL database, real services.
- **Entry point**: Through API calls or UI. Uses Playwright.
- **Spec consumption** (demo-be only): MUST consume corresponding Gherkin specs.
- **Purpose**: Verify the fully assembled system works end-to-end.
- **Applies to**: `demo-be-e2e` (all 11 backends), `organiclever-web-e2e`.
- **Deterministic**: Depends on external services. NOT cacheable.

### Projects Without Tests

- **`oseplatform-web`**: Hugo static site. `test:quick` runs link validation only. No unit/integration/e2e.
- **`ayokoding-web`**: Hugo static site. `test:quick` runs link validation only. No unit/integration/e2e.

### Summary Table

| Aspect            | Unit             | Integration (demo-be)   | Integration (other) | E2E                     |
| ----------------- | ---------------- | ----------------------- | ------------------- | ----------------------- |
| **Database**      | Mocked           | Real (PostgreSQL)       | Mocked/in-memory    | Real (PostgreSQL)       |
| **HTTP calls**    | None             | None                    | None (MSW) or N/A   | Yes (Playwright)        |
| **External APIs** | Mocked           | Mocked                  | Mocked              | Real                    |
| **Entry point**   | Direct code call | Direct code call        | Direct code call    | HTTP/UI via Playwright  |
| **Gherkin specs** | Yes (demo-be)    | Yes (demo-be)           | N/A                 | Yes (demo-be)           |
| **Cacheable**     | Yes              | No                      | No                  | No                      |
| **Execution**     | Host (no Docker) | Docker (docker-compose) | Host (no Docker)    | Docker (docker-compose) |

## Current State Assessment

### Per-Project Current State

#### Demo-be Backends (11 projects)

All 11 demo-be backends currently follow the same pattern:

- **"Unit" tests**: Exist in some backends (F#, Go, TS). Test individual functions. Do NOT consume Gherkin specs.
- **"Integration" tests**: Consume Gherkin specs via BDD frameworks. Use **HTTP-level testing** (MockMvc, httptest, TestClient, ConnCase, etc.) with **in-memory stores** (no real database).
- **"E2E" tests**: Single shared Playwright suite (`apps/demo-be-e2e/`) consumes Gherkin specs via playwright-bdd. Makes real HTTP calls to running services.

| Backend                     | Unit Tests       | Integration: HTTP?          | Integration: Database?      | Integration: BDD Framework |
| --------------------------- | ---------------- | --------------------------- | --------------------------- | -------------------------- |
| `demo-be-java-springboot`   | None             | Yes (MockMvc)               | In-memory maps (no real DB) | Cucumber JVM               |
| `demo-be-elixir-phoenix`    | Controller tests | Yes (ConnCase)              | In-memory Agent stores      | Cabbage                    |
| `demo-be-fsharp-giraffe`    | Domain + handler | Yes (WebApplicationFactory) | SQLite in-memory            | TickSpec                   |
| `demo-be-golang-gin`        | Handler tests    | Yes (httptest.Server)       | In-memory maps              | Godog                      |
| `demo-be-python-fastapi`    | None             | Yes (TestClient)            | In-memory maps              | pytest-bdd                 |
| `demo-be-rust-axum`         | None             | Yes (Tower TestClient)      | In-memory maps              | cucumber-rs                |
| `demo-be-kotlin-ktor`       | None             | Yes (testApplication)       | SQLite in-memory            | Cucumber JVM               |
| `demo-be-java-vertx`        | None             | Yes (Vert.x WebClient)      | In-memory maps              | Cucumber JVM               |
| `demo-be-ts-effect`         | Function tests   | Yes (HTTP client to server) | In-memory maps              | Cucumber.js                |
| `demo-be-csharp-aspnetcore` | None             | Yes (WebApplicationFactory) | SQLite in-memory            | Reqnroll                   |
| `demo-be-clojure-pedestal`  | None             | Yes (clj-http)              | SQLite in-memory            | kaocha-cucumber            |

**Key Observation**: The current "integration" tests are the **inverse** of what we want:

- **Current**: HTTP entry point + mocked/in-memory storage
- **Desired**: Direct code entry point + real PostgreSQL database

All 11 backends need to migrate to PostgreSQL. Four backends currently use SQLite in-memory (F#, Kotlin, C#, Clojure) and will need to switch to PostgreSQL. The remaining seven use plain in-memory maps with no database at all.

#### Web Apps

| Project                | Unit Tests | Integration Tests | E2E Tests                  | Status    |
| ---------------------- | ---------- | ----------------- | -------------------------- | --------- |
| `organiclever-web`     | Vitest     | Vitest + MSW      | via `organiclever-web-e2e` | Compliant |
| `organiclever-web-e2e` | —          | —                 | Playwright + bddgen        | Compliant |
| `oseplatform-web`      | —          | —                 | —                          | Compliant |
| `ayokoding-web`        | —          | —                 | —                          | Compliant |

**Gap**: None. Web apps already follow the appropriate standard for their type.

#### Go CLI Apps

| Project           | Unit Tests | Integration Tests | BDD Framework | Status    |
| ----------------- | ---------- | ----------------- | ------------- | --------- |
| `ayokoding-cli`   | Go testing | Godog + features  | Godog         | Compliant |
| `oseplatform-cli` | Go testing | Godog + features  | Godog         | Compliant |
| `rhino-cli`       | Go testing | Godog + features  | Godog         | Compliant |

**Gap**: None. CLI apps already follow the appropriate standard.

#### Libraries

| Library          | Unit Tests | Integration Tests     | BDD Framework | Status    |
| ---------------- | ---------- | --------------------- | ------------- | --------- |
| `golang-commons` | Go testing | Godog + mock closures | Godog         | Compliant |
| `hugo-commons`   | Go testing | Godog + tmpdir mocks  | Godog         | Compliant |
| `elixir-cabbage` | ExUnit     | —                     | —             | Compliant |
| `elixir-gherkin` | ExUnit     | —                     | —             | Compliant |

**Gap**: None. Libraries already follow the appropriate standard.

### E2E Tests (Current)

E2E tests already align with the new standard:

- **`demo-be-e2e`**: Uses Playwright + playwright-bdd, consumes `specs/apps/demo/be/gherkin/**/*.feature`, makes real HTTP calls. **Already compliant.**
- **`organiclever-web-e2e`**: Uses Playwright + bddgen, tests organiclever-web. **Already compliant.**

## Gap Analysis

### What Needs to Change

#### 1. Unit Tests — Demo-be Backends Only

**Current**: Some backends have unit tests but none consume Gherkin specs.

**Changes needed**:

- Add BDD framework configuration for unit test execution (same framework already used for integration)
- Create new step definition files for unit-level execution (steps call service/handler functions with mocked dependencies)
- Ensure all 76 Gherkin scenarios run at the unit level with full mocking
- Keep existing pure function tests alongside Gherkin-driven tests
- Configure `test:unit` nx target to run both Gherkin-driven and pure function unit tests

#### 2. Integration Tests — Demo-be Backends Only

**Current**: Tests call through HTTP (MockMvc, httptest, TestClient, etc.) with mocked/in-memory stores.

**Changes needed**:

- **Remove HTTP layer**: Replace MockMvc/httptest/TestClient/ConnCase/WebApplicationFactory with direct service/context function calls
- **Add docker-compose**: Each backend gets a `docker-compose.integration.yml` defining a PostgreSQL service and a test runner service. Replace SQLite/H2/in-memory maps with PostgreSQL.
- **Database lifecycle**: `docker compose up` spawns fresh PostgreSQL + test runner → migrations → seed files → tests → `docker compose down -v` tears down everything.
- **Rewrite step definitions**: Steps must call service functions directly instead of making HTTP requests
- **Retain BDD framework**: Same Gherkin runner (Cucumber, Godog, TickSpec, etc.), new step implementations
- **Update `test:integration` nx target**: Run `docker compose -f docker-compose.integration.yml up --abort-on-container-exit` and capture exit code

#### 3. All Other Projects — Minimal or No Changes

These projects are already architecturally compliant with the three rules. However, some need **test:quick reconfiguration** to separate unit from integration tests (coverage must come from `test:unit` alone):

- **Web UI** (`organiclever-web`): Rules 1+2+3 — test architecture already correct, but **needs test suite splitting**: currently `test:quick` runs unit + MSW together. Must split into separate `test:unit` (no MSW) and `test:integration` (MSW) targets so `test:quick` only runs unit tests.
- **CLI apps** (`ayokoding-cli`, `oseplatform-cli`, `rhino-cli`): Rules 1+2 — test architecture already correct, but **may need target reconfiguration**: currently coverage comes from combined unit + Godog runs. Must ensure `test:quick` runs `test:unit` only and coverage ≥90% from unit tests alone.
- **Hugo sites** (`oseplatform-web`, `ayokoding-web`): Exempt — no changes needed, build + link validation only
- **Libraries** (`golang-commons`, `hugo-commons`): Rule 1 — no changes needed, unit tests already working (integration exists but optional)
- **Libraries** (`elixir-cabbage`, `elixir-gherkin`): Rule 1 — no changes needed, unit tests already working
- **E2E runners** (`demo-be-e2e`, `organiclever-web-e2e`): No changes needed, Playwright already working

### Per-Backend Work Summary (Demo-be Only)

| Backend                     | Unit: Add Gherkin Steps | Integration: Remove HTTP | Integration: Add PostgreSQL | Effort |
| --------------------------- | ----------------------- | ------------------------ | --------------------------- | ------ |
| `demo-be-java-springboot`   | New step definitions    | Replace MockMvc          | Add PostgreSQL              | High   |
| `demo-be-elixir-phoenix`    | New step definitions    | Replace ConnCase         | Add PostgreSQL (Ecto)       | High   |
| `demo-be-fsharp-giraffe`    | New step definitions    | Replace WebAppFactory    | Replace SQLite → PostgreSQL | High   |
| `demo-be-golang-gin`        | New step definitions    | Replace httptest         | Add PostgreSQL              | High   |
| `demo-be-python-fastapi`    | New step definitions    | Replace TestClient       | Add PostgreSQL              | High   |
| `demo-be-rust-axum`         | New step definitions    | Replace Tower TestClient | Add PostgreSQL              | High   |
| `demo-be-kotlin-ktor`       | New step definitions    | Replace testApplication  | Replace SQLite → PostgreSQL | High   |
| `demo-be-java-vertx`        | New step definitions    | Replace WebClient        | Add PostgreSQL              | High   |
| `demo-be-ts-effect`         | New step definitions    | Replace HTTP client      | Add PostgreSQL              | High   |
| `demo-be-csharp-aspnetcore` | New step definitions    | Replace WebAppFactory    | Replace SQLite → PostgreSQL | High   |
| `demo-be-clojure-pedestal`  | New step definitions    | Replace clj-http         | Replace SQLite → PostgreSQL | High   |

## Implementation Strategy

### Phase 1: Update Standards and Documentation

Update all governance and documentation files to reflect the new testing standard before changing any code. See [Documentation Updates Required](#documentation-updates-required) for full list.

### Phase 2: Implement Per Demo-be Backend (One at a Time)

For each backend, follow this sequence (per-backend README + project.json updates are done alongside each backend):

1. **Add unit test step definitions** — Create a new set of Gherkin step definitions that call service/handler functions with fully mocked dependencies. Run all 76 scenarios at unit level.

2. **Refactor integration test step definitions** — Rewrite existing step definitions to:
   - Remove HTTP layer (no MockMvc, httptest, TestClient, etc.)
   - Call service/handler functions directly
   - Connect to PostgreSQL (provided by docker-compose)
   - Run migrations and seed files before test execution
   - Run all 76 scenarios at integration level

3. **Create `docker-compose.integration.yml`** — Define:
   - PostgreSQL service (with healthcheck)
   - Test runner service (language runtime + test command)
   - Volumes for source code and specs mount
   - Network for service communication

4. **Create `Dockerfile.integration`** — Define:
   - Language runtime base image
   - Source code and dependency installation
   - Migration + seed + test execution entrypoint

5. **Update `project.json`** — Ensure `test:unit`, `test:integration`, and `test:quick` targets are correctly configured with proper inputs for caching.

6. **Update app README** — Reflect new test structure and commands.

7. **Verify coverage** — Ensure >=90% line coverage from `test:unit` alone. This is critical: currently coverage is measured from integration runs (HTTP+mock). After standardization, unit tests must reach >=90% on their own. For backends with no existing unit tests (7 out of 11), this means writing comprehensive unit-level Gherkin steps that exercise enough code paths.

### Phase 3: Verify and Adapt Non-Demo-be Projects

Verify that all other projects conform to the standard. Most need no code changes, but some need test suite splitting (organiclever-web, Go CLI apps). Confirm:

- Each project has the correct Nx targets for its type
- `test:quick` is the quality gate and works correctly
- Coverage >= 90% where applicable
- `test:unit` caching works; `test:integration` and `test:e2e` are NOT cached

### Docker Compose Infrastructure (Demo-be)

Each demo-be backend gets a `docker-compose.integration.yml` at `apps/demo-be-*/docker-compose.integration.yml` with a standardized structure:

```yaml
# Example: apps/demo-be-java-springboot/docker-compose.integration.yml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: demo_be_test
      POSTGRES_USER: demo_be_test
      POSTGRES_PASSWORD: demo_be_test
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_test"]
      interval: 2s
      timeout: 5s
      retries: 10

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.integration
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://demo_be_test:demo_be_test@postgres:5432/demo_be_test
    volumes:
      - ../../specs:/specs:ro
    command: ["run-migrations-then-tests"]
```

Key design decisions:

1. **Per-backend `docker-compose.integration.yml`**: Each backend defines its own compose file. This keeps infrastructure close to the code it serves and allows language-specific customization.
2. **Per-backend `Dockerfile.integration`**: A lightweight Dockerfile that installs the language runtime, copies source code, and defines the test command. Includes migration + seed execution before running tests.
3. **Clean spawn**: `docker compose down -v && docker compose up --abort-on-container-exit` ensures no state carries over. The `-v` flag removes volumes (database data).
4. **Migrations**: The test runner container runs migrations as its first step (Flyway, Ecto, EF Core, Diesel, Alembic, JDBC, etc.) before executing tests.
5. **Seed files**: If a backend has seed data (e.g., default admin user, reference data), the seed file executes after migrations and before tests. Each backend defines its own seed mechanism.
6. **Specs mount**: Gherkin specs from `specs/apps/demo/be/gherkin/` are mounted read-only into the test runner container at `/specs`.
7. **Nx target**: `test:integration` runs `docker compose -f docker-compose.integration.yml down -v && docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build` and checks the exit code. NOT cacheable (`cache: false` in nx.json) — Docker builds and container execution are not tracked by Nx file-based caching.
8. **Coverage extraction**: The test runner writes coverage reports to a mounted volume so `rhino-cli test-coverage validate` can read them on the host.

### Recommended Backend Order

Start with the primary backend, then group by language ecosystem:

1. `demo-be-java-springboot` (primary backend, sets the pattern)
2. `demo-be-kotlin-ktor` (JVM, similar Dockerfile)
3. `demo-be-java-vertx` (JVM, similar Dockerfile)
4. `demo-be-fsharp-giraffe` (has unit tests, .NET)
5. `demo-be-csharp-aspnetcore` (.NET, similar Dockerfile)
6. `demo-be-golang-gin` (has unit tests)
7. `demo-be-ts-effect` (has unit tests, Node.js)
8. `demo-be-python-fastapi` (Python)
9. `demo-be-clojure-pedestal` (JVM/Clojure)
10. `demo-be-elixir-phoenix` (Elixir/OTP)
11. `demo-be-rust-axum` (Rust)

## Mandatory Targets Per Project Type

After standardization, each project type MUST have these Nx targets (derived from the three rules):

| Target             | API Backend (Rule 1+2+3) | Web UI (Rule 1+2+3) | CLI App (Rule 1+2) | Library (Rule 1) | Hugo Site (exempt) | E2E Runner |
| ------------------ | ------------------------ | ------------------- | ------------------ | ---------------- | ------------------ | ---------- |
| `test:unit`        | Required                 | Required            | Required           | Required         | —                  | —          |
| `test:integration` | Required (PG)            | Required (MSW)      | Required (BDD)     | Optional         | —                  | —          |
| `test:e2e`         | via demo-be-e2e          | via \*-e2e project  | —                  | —                | —                  | Required   |
| `test:quick`       | Required                 | Required            | Required           | Required         | Required           | Required   |
| `lint`             | Required                 | Required            | Required           | Required         | —                  | Required   |
| `build`            | Required                 | Required            | Required           | —                | Required           | —          |

### `test:quick` Composition

`test:quick` is the local quality gate (pre-push). It runs everything fast and deterministic — **no Docker, no external services**. It includes (where applicable to the project):

1. **`test:unit`** — unit tests with mocked dependencies
2. **Coverage check** — `rhino-cli test-coverage validate` (>= 90% line coverage from unit tests alone)
3. **Specs coverage check** — verify all Gherkin scenarios are consumed (where applicable)

`test:quick` does **NOT** include `lint`, `typecheck`, `test:integration`, or `test:e2e`:

- **`lint`** and **`typecheck`** remain separate Nx targets, run independently by the pre-push hook (`nx affected -t test:quick`) and CI workflows. This avoids double-running them on PRs where `pr-quality-gate.yml` already runs `nx affected -t lint` and `nx affected -t typecheck` as separate steps.
- **`test:integration`** and **`test:e2e`** run on separate CI schedules.

| Project Type | `test:quick` includes                               |
| ------------ | --------------------------------------------------- |
| API Backend  | `test:unit` + coverage check + specs coverage check |
| Web UI       | `test:unit` + coverage check                        |
| CLI App      | `test:unit` + coverage check                        |
| Library      | `test:unit` + coverage check                        |
| Hugo Site    | Link validation only                                |
| E2E Runner   | bddgen (no actual test execution)                   |

**Coverage measurement change**: Currently coverage for many projects is measured from integration test runs. After standardization, coverage must come from `test:unit` alone. This means unit tests must exercise enough code paths to reach ≥90%. For demo-be backends, the Gherkin-driven unit tests (with mocked dependencies) will be the primary coverage source. For Go CLI apps, unit tests (excluding Godog BDD files) must reach ≥90%.

**organiclever-web special case**: Currently `organiclever-web` runs all Vitest tests (unit + MSW integration) in a single `npx vitest run --coverage`. After standardization, MSW tests are reclassified as `test:integration` and excluded from `test:quick`. Unit tests alone must reach ≥90% coverage. This requires splitting the test suites or adding more unit tests.

### CI Schedules

Integration and E2E tests run on scheduled CI pipelines, not in `test:quick`:

| Schedule             | WIB Times                  | UTC Times                    | What runs                                |
| -------------------- | -------------------------- | ---------------------------- | ---------------------------------------- |
| **Integration** (4x) | 04:00, 10:00, 16:00, 22:00 | 21:00\*, 03:00, 09:00, 15:00 | `test:integration` for all apps          |
| **E2E** (2x)         | 06:00, 18:00               | 23:00\*, 11:00               | `test:e2e` for all web apps (APIs + UIs) |

\* Previous day UTC

This separation keeps `test:quick` fast (seconds to minutes) while integration and E2E tests run with full infrastructure on a predictable schedule. Developers can still run `test:integration` and `test:e2e` locally on demand.

### CI Trigger Summary by Push Method

Code reaches `main` via two paths — direct push or PR merge. Here's what CI runs for each:

| Push Method     | Pre-push (local)            | CI Trigger                                                                                                    |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Direct push** | `nx affected -t test:quick` | `main-ci.yml`: `nx run-many -t test:quick --all` + coverage uploads                                           |
| **PR → merge**  | `nx affected -t test:quick` | `pr-quality-gate.yml`: `nx affected -t typecheck` + `lint` + `test:quick` → then merge triggers `main-ci.yml` |

Both paths guarantee `test:quick` runs. PRs additionally run `typecheck` and `lint` as separate targets via `pr-quality-gate.yml`.

## Documentation Updates Required

### Files to Update

#### 1. `CLAUDE.md` (Root)

**Sections to update**:

- **"Unit vs. integration test principle"** — Rewrite to reflect the new three-level standard with per-type rules. Current text says "Unit tests cover only what integration tests cannot reach." New text should define each level's boundaries clearly, covering all project types.
- **`test:integration` caching section** — Update the long list describing each project's integration test approach. Remove references to MockMvc, httptest, ConnCase, etc. Describe the new pattern: demo-be uses docker-compose + PostgreSQL; others unchanged.
- **"Common Development Commands"** — Ensure `test:unit`, `test:integration`, `test:e2e` are all listed with correct descriptions.
- **Coverage sections** — Update to clarify coverage is now measured from `test:unit` runs only (not integration). Coverage file paths may change for some backends.
- **`test:quick` description** — Update to reflect that `test:quick` includes only unit + coverage + specs coverage, NOT lint or typecheck (those are separate targets).

#### 2. `governance/development/infra/nx-targets.md`

**Sections to update**:

- **`test:unit` definition** — Add: "Must consume corresponding Gherkin specs with mocked dependencies (demo-be). Calls application code directly."
- **`test:integration` definition** — Rewrite: "Demo-be backends: Uses real PostgreSQL database (clean spawn per run via docker-compose). No HTTP calls. Calls application code directly. Must consume Gherkin specs. Other projects: existing patterns (MSW, Godog, etc.)."
- **`test:e2e` definition** — Add: "Must consume corresponding Gherkin specs (demo-be). Uses Playwright."
- **Caching rules** — Only `test:unit` is cacheable. `test:integration` and `test:e2e` are NOT cacheable (`cache: false` in nx.json).
- **Mandatory targets table** — Update with the per-project-type matrix defined above.

#### 3. `governance/development/infra/bdd-spec-test-mapping.md`

**Sections to update**:

- **Scope** — Extend beyond CLI apps. Add demo-be backends as covered projects.
- **Three-level consumption** — Document that specs are consumed at unit, integration, AND e2e levels with different step implementations.
- **Validation** — Define how to validate that all 76 scenarios pass at each level.

#### 4. `specs/apps/demo/be/README.md`

**Sections to add/update**:

- **Consumption model** — Document the three-level consumption: unit (mocked), integration (PostgreSQL, no HTTP), e2e (full Playwright).
- **Step definition organization** — Recommend directory structure for separating unit vs integration steps within each backend.

#### 5. Each `apps/demo-be-*/README.md` (11 files)

**Updates per backend**:

- **Test structure section** — Document unit vs integration directory layout.
- **Test commands** — List `test:unit`, `test:integration`, `test:quick` commands.
- **Test architecture** — Describe what's mocked at each level and what's real.
- **Docker compose** — Document `docker-compose.integration.yml` and `Dockerfile.integration`.

#### 6. Each `apps/demo-be-*/project.json` (11 files)

**Updates per backend**:

- **`test:unit` target** — Add or update to run BDD specs with mocked dependencies + pure function tests.
- **`test:integration` target** — Update to run BDD specs via docker-compose with real PostgreSQL, no HTTP.
- **`test:quick` target** — Ensure it runs `test:unit` + coverage check + specs coverage check. Does NOT include lint, typecheck, `test:integration`, or `test:e2e`.
- **Caching inputs** — Ensure `specs/apps/demo/be/gherkin/**/*.feature`, `docker-compose.integration.yml`, and `Dockerfile.integration` are in inputs for `test:integration`. Specs also in inputs for `test:unit`.

### Files That Do NOT Need Documentation Overhaul

These projects don't need the same README/architecture documentation rewrite as demo-be backends. However, some need **project.json target updates** in Phase 3 of the delivery checklist:

- **`apps/organiclever-web/`** — Test architecture already correct, but `project.json` needs target splitting (unit vs MSW integration) in Phase 3.
- **`apps/ayokoding-cli/`**, **`apps/oseplatform-cli/`**, **`apps/rhino-cli/`** — Test architecture already correct, but `project.json` may need target reconfiguration (unit vs Godog integration) in Phase 3.
- **`apps/demo-be-e2e/`** — Already compliant, no changes needed.
- **`apps/organiclever-web-e2e/`** — Already compliant (Playwright + bddgen), no changes needed.
- **`apps/oseplatform-web/`** — Already compliant (link validation only), no changes needed.
- **`apps/ayokoding-web/`** — Already compliant (link validation only), no changes needed.
- **`libs/golang-commons/`** — Already compliant (Go unit + Godog integration), no changes needed.
- **`libs/hugo-commons/`** — Already compliant (Go unit + Godog integration), no changes needed.
- **`libs/elixir-cabbage/`** — Already compliant (ExUnit), no changes needed.
- **`libs/elixir-gherkin/`** — Already compliant (ExUnit), no changes needed.
- **`governance/conventions/`** — No convention changes needed.
- **`governance/principles/`** — Principles remain the same.

#### 7. `.github/workflows/` — CI Workflow Updates

##### Current State (18 workflow files)

| Workflow                                             | Trigger                            | What it does                                                                     |
| ---------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `main-ci.yml`                                        | Push to `main`                     | `npx nx run-many -t test:quick --all` + coverage uploads to Codecov              |
| `pr-quality-gate.yml`                                | PR opened/sync/reopen              | `nx affected -t typecheck` + `nx affected -t lint` + `nx affected -t test:quick` |
| `pr-validate-links.yml`                              | PR opened/sync/reopen              | `rhino-cli docs validate-links`                                                  |
| `pr-format.yml`                                      | PR opened/sync/reopen              | Formatting checks                                                                |
| `test-and-deploy-ayokoding-web.yml`                  | Push to `prod-ayokoding-web`       | Deploy to Vercel                                                                 |
| `test-and-deploy-oseplatform-web.yml`                | Push to `prod-oseplatform-web`     | Deploy to Vercel                                                                 |
| `test-integration-e2e-demo-be-java-springboot.yml`   | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-kotlin-ktor.yml`       | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-java-vertx.yml`        | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-fsharp-giraffe.yml`    | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-csharp-aspnetcore.yml` | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-golang-gin.yml`        | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-ts-effect.yml`         | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-python-fastapi.yml`    | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-clojure-pedestal.yml`  | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-elixir-phoenix.yml`    | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-demo-be-rust-axum.yml`         | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |
| `test-integration-e2e-organiclever-web.yml`          | Cron 2x daily (WIB 06/18) + manual | Docker compose up → Playwright E2E → teardown                                    |

##### Changes Needed

**`main-ci.yml`** — Update coverage file paths:

- **Current**: Coverage uploads reference paths produced by integration test runs (e.g., `apps/demo-be-java-springboot/target/site/jacoco/jacoco.xml` from `mvn jacoco:report -Pintegration`). After standardization, `test:quick` only runs `test:unit`, so coverage comes from unit test runs.
- **Action**: Update each coverage upload's `files:` path to point to the unit test coverage output. The exact paths depend on how each backend configures unit test coverage reporting.
- **JaCoCo report step**: Remove `mvn jacoco:report -Pintegration` step (line 110) — unit test coverage is generated directly by `test:unit`.
- **No structural changes** to the workflow itself — it still runs `test:quick` for all projects on push to `main`.

**`pr-quality-gate.yml`** — No changes needed:

- Already runs `typecheck`, `lint`, and `test:quick` as separate steps. Since `test:quick` no longer includes lint/typecheck, there's no double-running. Already compliant.

**`integration-tests.yml`** — Removed. The scheduled all-projects integration workflow was deleted. Integration tests now run only via per-service "Test Integration + E2E" workflows (2x daily at WIB 06/18).

**E2E workflows (12 files)** — Already compliant:

- All 12 E2E workflows already run at WIB 06:00/18:00 (UTC cron `0 23 * * *` and `0 11 * * *`). **No changes needed.**

**Other workflows** — No changes needed:

- `pr-validate-links.yml` — PR link validation, unrelated to testing
- `pr-format.yml` — PR formatting checks, unrelated to testing
- `test-and-deploy-ayokoding-web.yml` — Deployment only
- `test-and-deploy-oseplatform-web.yml` — Deployment only

#### 8. Root `README.md`

**Sections to update**:

- **"CI & Test Coverage" section** — Currently shows E2E + Coverage badges per demo-be backend. After standardization:
  - Add **Integration** badge column for demo-be backends (new CI workflow)
  - Add Integration badge for `organiclever-web` and Go CLI apps
  - Update table headers to reflect three CI types: Integration (4x daily) | E2E (2x daily) | Coverage
- **Badge descriptions** — Update text to explain the CI schedule (integration 4x daily, E2E 2x daily)
- **Clarify** that `test:quick` (run on every push via `main-ci.yml` and on every PR via `pr-quality-gate.yml`) includes unit tests + coverage, but NOT lint, typecheck, integration, or E2E (lint and typecheck run as separate targets)
