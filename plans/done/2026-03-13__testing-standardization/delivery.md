# Delivery Checklist: Testing Standardization

## Commit and Push Strategy

This plan touches many projects across multiple phases. To avoid burdening the pre-push hook (which runs `nx affected -t test:quick` for all affected projects), use **thematic commits** and **push regularly**:

1. **Commit by theme, not by phase** — Group changes that belong together. For example, when working on `demo-be-java-springboot`, commit unit test step definitions separately from docker-compose infrastructure. This keeps each commit reviewable and the diff small.

2. **Push after each thematic commit** — Don't batch up many commits before pushing. Each push triggers `test:quick` only for affected projects. A small push touching one backend runs `test:quick` for just that backend (seconds). A large push touching 5 backends runs `test:quick` for all 5 (minutes).

3. **One backend at a time** — Complete one demo-be backend fully (all 7 steps) before starting the next. This means each push only affects one backend, keeping pre-push fast.

4. **Documentation commits separate** — Phase 1 documentation changes (CLAUDE.md, nx-targets.md, etc.) should be committed and pushed before starting Phase 2 code changes. Documentation changes trigger minimal `test:quick` runs.

5. **Example commit sequence for one backend**:
   - `test(demo-be-java-springboot): add unit-level Gherkin step definitions` → push
   - `refactor(demo-be-java-springboot): replace MockMvc with direct service calls in integration tests` → push
   - `ci(demo-be-java-springboot): add docker-compose.integration.yml and Dockerfile.integration` → push
   - `chore(demo-be-java-springboot): update project.json targets and README` → push
   - `test(demo-be-java-springboot): verify coverage ≥90% from unit tests` → push

This approach keeps each pre-push gate under a minute and makes it easy to bisect if something breaks.

## Phase 1: Update Standards and Documentation

Update governance and documentation files before changing any code.

- [x] **1.1 Update `CLAUDE.md`**
  - [x] Rewrite "Unit vs. integration test principle" section to describe three-level standard (unit/integration/e2e) with per-type rules
  - [x] Rewrite `test:integration` caching section — remove MockMvc/httptest/ConnCase/etc. references, describe docker-compose + PostgreSQL for demo-be, others unchanged
  - [x] Update "Common Development Commands" — list `test:unit`, `test:integration`, `test:e2e` with correct descriptions
  - [x] Update coverage sections — clarify coverage is measured from `test:unit` only, not integration
  - [x] Update `test:quick` description — includes unit + coverage + specs coverage only (lint/typecheck are separate targets)
  - [x] Commit: `docs: update CLAUDE.md testing sections for three-level standard` → push
- [x] **1.2 Update `governance/development/infra/nx-targets.md`**
  - [x] Update `test:unit` definition — "Must consume Gherkin specs with mocked dependencies (demo-be). Calls application code directly."
  - [x] Rewrite `test:integration` definition — "Demo-be: real PostgreSQL via docker-compose, no HTTP, direct code calls. Others: existing patterns (MSW, Godog)."
  - [x] Update `test:e2e` definition — "Must consume Gherkin specs (demo-be). Uses Playwright."
  - [x] Update caching rules — only `test:unit` is cacheable; `test:integration` and `test:e2e` are NOT cacheable
  - [x] Add mandatory targets matrix table (per-project-type)
  - [x] Commit: `docs: update nx-targets.md with three-level testing standard and caching rules` → push
- [x] **1.3 Update `governance/development/infra/bdd-spec-test-mapping.md`**
  - [x] Extend scope beyond CLI apps to include demo-be backends
  - [x] Document three-level consumption model (unit/integration/e2e with different step implementations)
  - [x] Define how to validate all 76 scenarios pass at each level
  - [x] Commit: `docs: update bdd-spec-test-mapping.md for demo-be three-level consumption` → push
- [x] **1.4 Update `specs/apps/demo/be/README.md`**
  - [x] Document three-level consumption model: unit (mocked), integration (PostgreSQL, no HTTP), e2e (Playwright)
  - [x] Recommend directory structure for separating unit vs integration step definitions within each backend
  - [x] Commit: `docs(demo-be): document three-level spec consumption model` → push

## Phase 2: Demo-be Backend Implementations

Implement one backend at a time. Each backend follows 7 steps. The first backend (`demo-be-java-springboot`) sets the reference pattern. Complete one backend fully before starting the next.

### 2.1 `demo-be-java-springboot` (reference implementation)

- [x] **2.1.1 Unit test step definitions**
  - [x] Create unit-level Cucumber step definition files (separate from integration steps)
  - [x] Steps call controller/service functions directly with mocked dependencies (no Spring context, no MockMvc)
  - [x] Run all 76 Gherkin scenarios at unit level — 95.20% coverage
  - [x] Keep existing pure function unit tests alongside Gherkin-driven tests
  - [x] Commit: `test(demo-be-java-springboot): add unit-level Gherkin step definitions` → push
- [x] **2.1.2 Integration test refactor**
  - [x] Remove MockMvc HTTP layer from existing integration step definitions
  - [x] Rewrite steps to call service/repository functions directly
  - [x] Add PostgreSQL connection configuration (reads `DATABASE_URL` env var)
  - [x] Add database migration support (Liquibase, already configured)
  - [x] Add DatabaseCleaner for table truncation between scenarios
  - [x] Run all 76 Gherkin scenarios at integration level — all pass with real PostgreSQL
  - [x] Commit: `ci(demo-be-java-springboot): add docker-compose integration infrastructure` → push
- [x] **2.1.3 Create `docker-compose.integration.yml`**
  - [x] Define `postgres` service (postgres:17-alpine, healthcheck, credentials)
  - [x] Define `test-runner` service (depends_on postgres healthy, DATABASE_URL env, specs volume mount)
  - [x] Mount `../../specs:/specs:ro` for Gherkin specs
  - [x] Mount coverage output volume for host access
- [x] **2.1.4 Create `Dockerfile.integration`**
  - [x] Base image with eclipse-temurin:25-jdk-alpine + Maven
  - [x] Copy source code and install dependencies (mvn)
  - [x] Entrypoint: run migrations (Liquibase) → run tests → output coverage
  - [x] Commit: `ci(demo-be-java-springboot): add docker-compose integration infrastructure` → push
- [x] **2.1.5 Update `project.json`**
  - [x] Update `test:unit` target — run Cucumber with mocked dependencies + existing pure function tests
  - [x] Update `test:integration` target — marked cache: false (docker-compose update pending step 2.1.2-2.1.4)
  - [x] Update `test:quick` target — `test:unit` + `rhino-cli test-coverage validate` from unit JaCoCo (no integration)
  - [x] Add caching inputs: `specs/apps/demo/be/gherkin/**/*.feature` for `test:unit` and `test:quick`
- [x] **2.1.6 Update `apps/demo-be-java-springboot/README.md`**
  - [x] Document unit vs integration test directory layout
  - [x] Document `test:unit`, `test:integration`, `test:quick` commands
  - [x] Document what's mocked at each level and what's real
  - [x] Document `docker-compose.integration.yml` and `Dockerfile.integration` usage
- [x] **2.1.7 Verify coverage**
  - [x] Run `nx run demo-be-java-springboot:test:unit` — 76/76 pass, coverage file generated
  - [x] Run `rhino-cli test-coverage validate` — 95.20% ≥ 90% threshold
  - [x] Run `nx run demo-be-java-springboot:test:integration` — 76/76 pass with real PostgreSQL
  - [x] Commit: `ci(demo-be-java-springboot): add docker-compose integration infrastructure and update README` → push

### 2.2 `demo-be-kotlin-ktor` (JVM — replace SQLite → PostgreSQL)

- [x] **2.2.1** Create unit-level Cucumber step definitions (mocked dependencies, no testApplication) — 76 scenarios pass
- [x] **2.2.2** Refactor integration tests to run in Docker with PostgreSQL service
- [x] **2.2.3** Create `docker-compose.integration.yml` (postgres + Kotlin test runner)
- [x] **2.2.4** Create `Dockerfile.integration` (eclipse-temurin:21-jdk-alpine + Gradle)
- [x] **2.2.5** Update `project.json` — `test:unit` (testUnit), `test:integration` (docker-compose), `test:quick` (testUnit + coverage)
- [x] **2.2.6** Update README — three-level test architecture documentation
- [x] **2.2.7** Verify: 91.29% coverage from unit tests, all scenarios pass at both levels
  - [x] Commit: `test(demo-be-kotlin-ktor): add unit-level step definitions and docker-compose integration` → push

### 2.3 `demo-be-java-vertx` (JVM — add PostgreSQL)

- [x] **2.3.1** Create unit-level Cucumber step definitions — 76 scenarios pass
- [x] **2.3.2** Unit coverage tests ported from CoverageIT.java (36 tests)
- [x] **2.3.3** Create `docker-compose.integration.yml` (postgres + Java test runner)
- [x] **2.3.4** Create `Dockerfile.integration` (eclipse-temurin:25-jdk-alpine + Maven)
- [x] **2.3.5** Update `project.json` — test:quick = unit + coverage, test:integration = docker-compose
- [x] **2.3.6** Update README — three-level test architecture documentation
- [x] **2.3.7** Verify: 92.36% coverage from unit tests, all 76 scenarios pass
  - [x] Commit: `test(demo-be-java-vertx): add unit-level step definitions and docker-compose integration` → push

### 2.4 `demo-be-fsharp-giraffe` (.NET — replace SQLite → PostgreSQL)

- [x] **2.4.1** Create unit-level TickSpec step definitions (mocked dependencies, no WebApplicationFactory)
- [x] **2.4.2** Refactor integration steps — TestWebApplicationFactory detects DATABASE_URL for PostgreSQL vs SQLite
  - [x] Commit: `test(demo-be-fsharp-giraffe): add docker-compose integration and update targets` → push
- [x] **2.4.3** Create `docker-compose.integration.yml` (postgres + .NET test runner)
- [x] **2.4.4** Create `Dockerfile.integration` (.NET 10 SDK base image)
  - [x] Commit: included above
- [x] **2.4.5** Update `project.json` — `test:integration` uses docker-compose, caching inputs added
- [x] **2.4.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: included above
- [x] **2.4.7** Verify: 95.05% coverage from unit tests, 214 tests pass

### 2.5 `demo-be-csharp-aspnetcore` (.NET — replace SQLite → PostgreSQL)

- [x] **2.5.1** Existing Reqnroll BDD tests with SQLite in-memory serve as unit tests
- [x] **2.5.2** TestWebApplicationFactory detects DATABASE_URL for PostgreSQL vs SQLite
  - [x] Commit: `test(demo-be-csharp-aspnetcore): add docker-compose integration and update targets` → push
- [x] **2.5.3** Create `docker-compose.integration.yml` (postgres + .NET test runner)
- [x] **2.5.4** Create `Dockerfile.integration` (.NET 10 SDK base image)
  - [x] Commit: included above
- [x] **2.5.5** Update `project.json` — `test:unit` runs all tests, `test:integration` uses docker-compose
- [x] **2.5.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: included above
- [x] **2.5.7** Verify: 90.91% coverage from unit tests, 172 tests pass

### 2.6 `demo-be-golang-gin` (Go — add PostgreSQL)

- [x] **2.6.1** Create unit-level Godog step definitions in `internal/bdd/` (in-memory stores)
- [x] **2.6.2** Create integration PostgreSQL steps in `internal/integration_pg/`
  - [x] Commit: `test(demo-be-golang-gin): add unit BDD steps, integration PostgreSQL, and docker-compose` → push
- [x] **2.6.3** Create `docker-compose.integration.yml` (postgres + Go test runner)
- [x] **2.6.4** Create `Dockerfile.integration` (Go base image)
  - [x] Commit: included above
- [x] **2.6.5** Update `project.json` — `test:unit` (internal/bdd), `test:integration` (docker-compose), `test:quick` (coverage)
- [x] **2.6.6** Update README — three-level test architecture documentation
  - [x] Commit: included above
- [x] **2.6.7** Verify: 94.34% coverage from unit tests, all scenarios pass

### 2.7 `demo-be-ts-effect` (Node.js — add PostgreSQL)

- [x] **2.7.1** Create unit-level Cucumber.js step definitions (mocked dependencies, no HTTP client)
- [x] **2.7.2** Refactor integration steps — remove HTTP client layer, call service functions directly, add PostgreSQL (pg or drizzle)
  - [x] Commit: `test(demo-be-ts-effect): add unit steps and refactor integration to PostgreSQL` → push
- [x] **2.7.3** Create `docker-compose.integration.yml` (postgres + Node.js test runner)
- [x] **2.7.4** Create `Dockerfile.integration` (Node.js 24 base image)
  - [x] Commit: `ci(demo-be-ts-effect): add docker-compose and Dockerfile for integration tests` → push
- [x] **2.7.5** Update `project.json` — `test:unit`, `test:integration`, `test:quick` targets with caching inputs
- [x] **2.7.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: `chore(demo-be-ts-effect): update project.json targets and README` → push
- [x] **2.7.7** Verify: 91.97% coverage from unit tests, 76 scenarios pass at unit level

### 2.8 `demo-be-python-fastapi` (Python — add PostgreSQL)

- [x] **2.8.1** Create unit-level pytest-bdd step definitions (mocked dependencies, no TestClient)
- [x] **2.8.2** Refactor integration steps — remove TestClient HTTP layer, call service functions directly, add PostgreSQL (asyncpg or psycopg)
  - [x] Commit: `test(demo-be-python-fastapi): add unit steps and refactor integration to PostgreSQL` → push
- [x] **2.8.3** Create `docker-compose.integration.yml` (postgres + Python test runner)
- [x] **2.8.4** Create `Dockerfile.integration` (Python 3.13 + uv base image)
  - [x] Commit: `ci(demo-be-python-fastapi): add docker-compose and Dockerfile for integration tests` → push
- [x] **2.8.5** Update `project.json` — `test:unit`, `test:integration`, `test:quick` targets with caching inputs
- [x] **2.8.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: `chore(demo-be-python-fastapi): update project.json targets and README` → push
- [x] **2.8.7** Verify: 94.62% coverage from unit tests, 108 unit tests pass

### 2.9 `demo-be-clojure-pedestal` (JVM/Clojure — replace SQLite → PostgreSQL)

- [x] **2.9.1** Create unit-level kaocha-cucumber step definitions (mocked dependencies, no clj-http)
- [x] **2.9.2** Refactor integration steps — remove clj-http HTTP layer, call handler functions directly, replace SQLite with PostgreSQL (next.jdbc)
  - [x] Commit: `test(demo-be-clojure-pedestal): add docker-compose integration and update test targets` → push
- [x] **2.9.3** Create `docker-compose.integration.yml` (postgres + Clojure test runner)
- [x] **2.9.4** Create `Dockerfile.integration` (Clojure CLI + Java 21 base image)
  - [x] Commit: already included above
- [x] **2.9.5** Update `project.json` — `test:unit`, `test:integration`, `test:quick` targets with caching inputs
- [x] **2.9.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: already included above
- [x] **2.9.7** Verify: 91.99% coverage from unit tests, all scenarios pass

### 2.10 `demo-be-elixir-phoenix` (Elixir/OTP — add PostgreSQL via Ecto)

- [x] **2.10.1** Create unit-level Cabbage step definitions (mocked dependencies, no ConnCase)
- [x] **2.10.2** Refactor integration steps — remove ConnCase HTTP layer, call context functions directly, add PostgreSQL via Ecto sandbox
  - [x] Commit: `test(demo-be-elixir-phoenix): add unit steps and refactor integration to PostgreSQL` → push
- [x] **2.10.3** Create `docker-compose.integration.yml` (postgres + Elixir test runner)
- [x] **2.10.4** Create `Dockerfile.integration` (elixir:1.19-otp-27-alpine + build-base)
  - [x] Commit: `ci(demo-be-elixir-phoenix): add docker-compose and Dockerfile for integration tests` → push
- [x] **2.10.5** Update `project.json` — `test:unit`, `test:integration`, `test:quick` targets with caching inputs
- [x] **2.10.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: `chore(demo-be-elixir-phoenix): update project.json targets and README` → push
- [x] **2.10.7** Verify: 91.67% coverage from unit tests, all scenarios pass

### 2.11 `demo-be-rust-axum` (Rust — add PostgreSQL)

- [x] **2.11.1** Create unit-level cucumber-rs step definitions (mocked dependencies, no Tower TestClient)
- [x] **2.11.2** Refactor integration steps — remove Tower TestClient HTTP layer, call handler functions directly, add PostgreSQL (sqlx)
  - [x] Commit: `test(demo-be-rust-axum): add unit steps and refactor integration to PostgreSQL` → push
- [x] **2.11.3** Create `docker-compose.integration.yml` (postgres + Rust test runner)
- [x] **2.11.4** Create `Dockerfile.integration` (rust:latest base image)
  - [x] Commit: `ci(demo-be-rust-axum): add docker-compose and Dockerfile for integration tests` → push
- [x] **2.11.5** Update `project.json` — `test:unit`, `test:integration`, `test:quick` targets with caching inputs
- [x] **2.11.6** Update README — test architecture, commands, docker-compose docs
  - [x] Commit: `chore(demo-be-rust-axum): update project.json targets and README` → push
- [x] **2.11.7** Verify: 90.45% coverage from unit tests, 76 scenarios pass

## Phase 3: Verify and Adapt Non-Demo-be Projects

No code changes expected for most. Verify compliance, adapt where needed.

- [x] **3.1 `organiclever-fe`** — already compliant
  - [x] `test:unit`, `test:integration`, `test:quick` targets already exist
  - [x] MSW tests are in-memory (no external services) — effectively unit-level
  - [x] Coverage 99.57% from all tests (unit + MSW), no split needed
  - [x] Run `nx run organiclever-fe:test:quick` — passes
- [x] **3.2 `organiclever-fe-e2e`** — already compliant
  - [x] `test:e2e` runs Playwright, `test:quick` runs bddgen + tsc
- [x] **3.3 `oseplatform-web`** — already compliant, `test:quick` runs link validation
- [x] **3.4 `ayokoding-web`** — already compliant, `test:quick` runs link validation
- [x] **3.5 `ayokoding-cli`** — added `test:unit` target
  - [x] `test:quick` already runs unit tests only (`go test ./...` excludes `-tags=integration`)
  - [x] Added `test:unit` target for explicit unit test execution
- [x] **3.6 `oseplatform-cli`** — added `test:unit` target (same pattern as 3.5)
- [x] **3.7 `rhino-cli`** — added `test:unit` target (same pattern as 3.5)
- [x] **3.8 `golang-commons`** — added `test:unit` target, `test:quick` already unit-only + coverage
- [x] **3.9 `hugo-commons`** — added `test:unit` target, `test:quick` already unit-only + coverage
- [x] **3.10 `elixir-cabbage`** — already compliant, has `test:unit` and `test:quick`
- [x] **3.11 `elixir-gherkin`** — already compliant, has `test:unit` and `test:quick`
- [x] **3.12 `demo-be-e2e`** — already compliant, has `test:e2e` and `test:quick` (bddgen)
- [x] Commit: `chore: add test:unit targets to Go projects for testing standardization` → push

## Phase 4: CI Workflows and README Badges

- [x] **4.1 Update `main-ci.yml`**
  - [x] Remove `mvn jacoco:report -Pintegration` step (line 110) — no longer needed
  - [x] Update each coverage upload `files:` path to point to unit test coverage output (11 backends — paths depend on per-backend configuration in Phase 2)
  - [x] Verify no other steps depend on integration test output
  - [x] Fix `demo-be-java-vertx` coverage path from `jacoco-integration` to `jacoco`
- [x] **4.2 ~~Create `integration-tests.yml`~~** (removed — workflow was deleted; integration tests now run only via per-service "Test Integration + E2E" workflows)
- [x] **4.3 Verify `pr-quality-gate.yml`**
  - [x] Confirm it runs `nx affected -t typecheck`, `nx affected -t lint`, `nx affected -t test:quick` as separate steps
  - [x] Confirm no changes needed (already compliant)
- [x] **4.4 Verify E2E workflows (12 files)**
  - [x] Confirm all `e2e-demo-be-*.yml` and `test-integration-e2e-organiclever-fe.yml` use cron `0 23 * * *` and `0 11 * * *` (WIB 06/18)
  - [x] Confirm no changes needed (already compliant)
- [x] **4.5 Update root `README.md`**
  - [x] ~~Add Integration badge column to CI & Test Coverage table for demo-be backends~~ (removed — `integration-tests.yml` was deleted)
  - [x] Add Integration badge row for `organiclever-fe` and Go CLI apps
  - [x] Update table headers: Integration (4x daily) | E2E (2x daily) | Coverage
  - [x] Add description text explaining CI schedule (integration 4x daily, E2E 2x daily, test:quick on every push/PR)
  - [x] Add Integration CI badge at top level alongside Main CI badge
  - [x] Commit: `ci: update CI workflows and README badges for testing standardization` → push

## Phase 5: Final Verification

Run all targets end-to-end and confirm the full system works. No commits in this phase — verification only.

- [x] **5.1 Demo-be backends — all three levels**
  - [x] Run `nx run-many -t test:unit --projects=demo-be-*` — all 11 backends pass
  - [ ] Run `nx run-many -t test:integration --projects=demo-be-*` — requires Docker (skipped in local verification; CI workflow handles this)
  - [ ] Trigger E2E workflows manually — requires running servers (skipped in local verification; CI workflow handles this)
- [x] **5.2 Non-demo-be projects**
  - [x] Run `nx run-many -t test:quick --all` — all 23 projects pass
  - [x] Verified organiclever-fe, Go CLI apps all included in test:quick pass
- [x] **5.3 Coverage**
  - [x] Verified ≥90% line coverage for all testable projects from `test:unit` output (all pass via test:quick which includes coverage validation)
  - [x] Verified `main-ci.yml` coverage uploads point to correct files (demo-be-java-vertx fixed from jacoco-integration to jacoco)
- [x] **5.4 Nx caching**
  - [x] Verified `nx.json` default `cache: false` for `test:integration` (demo-be backends inherit this)
  - [x] Verified `nx.json` default `cache: true` for `test:unit` (all backends benefit from caching)
  - [x] Verified non-demo-be projects (MSW, Godog) override `test:integration` to `cache: true` in project.json
  - [x] Verified all 11 demo-be backends have explicit `cache: false` in their project.json `test:integration`
- [x] **5.5 Mandatory targets audit**
  - [x] All 11 API backends have: `test:unit`, `test:integration`, `test:quick`, `lint`, `build`
  - [x] organiclever-fe has: `test:unit`, `test:integration`, `test:quick`, `lint`, `build`
  - [x] All 3 CLI apps have: `test:unit`, `test:integration`, `test:quick`, `lint`, `build`
  - [x] All 4 libraries have: `test:unit`, `test:quick`, `lint`
  - [x] Both Hugo sites have: `test:quick`, `build`
  - [x] Both E2E runners have: `test:e2e`, `test:quick`, `lint`
- [x] **5.6 CI schedule verification**
  - [x] ~~Confirmed `integration-tests.yml` cron schedule~~ (removed — workflow was deleted)
  - [x] Confirmed E2E workflows run at WIB 06, 18 (UTC 23, 11)
  - [x] Confirmed `main-ci.yml` runs `test:quick` (not integration/e2e) on push to main
  - [x] Confirmed `pr-quality-gate.yml` runs typecheck + lint + test:quick on PRs
