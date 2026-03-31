# Requirements: CI/CD Standardization

## R0: Naming Conventions

### R0.1: Current Naming Patterns

#### App Directory Naming

**Default pattern**: `apps/{service-name}-{part}`

The `{service-name}` identifies the product/domain, and `{part}` identifies the component role
within that service. For demo apps that have multiple language implementations, the part is
extended with language and framework: `{service-name}-{part}-{lang}-{framework}`.

| Segment              | Values                                                                                                                                                      | Examples |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| service-name         | `a-demo`, `organiclever`, `ayokoding-web`, `oseplatform-web`, `rhino`                                                                                       |          |
| part                 | `be` (backend), `fe` (frontend), `fs` (fullstack), `cli`, `contracts`, `be-e2e`, `fe-e2e`                                                                   |          |
| lang (optional)      | `golang`, `java`, `ts`, `python`, `rust`, `kotlin`, `fsharp`, `csharp`, `clojure`, `elixir`, `dart`                                                         |          |
| framework (optional) | `gin`, `springboot`, `vertx`, `effect`, `fastapi`, `axum`, `ktor`, `giraffe`, `aspnetcore`, `pedestal`, `phoenix`, `nextjs`, `tanstack-start`, `flutterweb` |          |

**Examples**: `a-demo-be-golang-gin`, `a-demo-fe-ts-nextjs`, `organiclever-be`,
`organiclever-fe`, `ayokoding-web`, `rhino-cli`

**Inconsistencies**:

| Artifact                 | Current Name             | Expected Name (if consistent) | Issue                                   |
| ------------------------ | ------------------------ | ----------------------------- | --------------------------------------- |
| E2E app (demo BE)        | `a-demo-be-e2e`          | `a-demo-be-e2e`               | OK -- shared across all BE impls        |
| E2E app (ayokoding BE)   | `ayokoding-web-be-e2e`   | `ayokoding-be-e2e`            | `web` inserted inconsistently           |
| E2E app (ayokoding FE)   | `ayokoding-web-fe-e2e`   | `ayokoding-fe-e2e`            | `web` inserted inconsistently           |
| E2E app (oseplatform BE) | `oseplatform-web-be-e2e` | `oseplatform-be-e2e`          | `web` inserted inconsistently           |
| E2E app (oseplatform FE) | `oseplatform-web-fe-e2e` | `oseplatform-fe-e2e`          | `web` inserted inconsistently           |
| Content platform         | `ayokoding-web`          | `ayokoding-web`               | OK -- `web` is the role, not a modifier |
| Content platform         | `oseplatform-web`        | `oseplatform-web`             | OK                                      |

**Analysis**: The E2E apps for content platforms use `{domain}-web-{role}-e2e` while the main apps
use `{domain}-web`. The `web` is part of the domain identity (the app IS `ayokoding-web`), so the
E2E naming `ayokoding-web-be-e2e` correctly derives from the app name. This is actually **consistent**
-- the pattern is `{app-name}-{role}-e2e` where `app-name = ayokoding-web`. **No rename needed.**

#### GitHub Actions Workflow Naming

| Pattern                          | Examples                               | Count |
| -------------------------------- | -------------------------------------- | ----- |
| `test-{app-name}.yml`            | `test-a-demo-be-golang-gin.yml`        | 16    |
| `test-and-deploy-{app-name}.yml` | `test-and-deploy-ayokoding-web.yml`    | 2     |
| `pr-{action}.yml`                | `pr-quality-gate.yml`, `pr-format.yml` | 3     |
| `{function}.yml`                 | `codecov-upload.yml`                   | 1     |
| **Exception**                    | `test-organiclever.yml`                | 1     |

**Inconsistency**: `test-organiclever.yml` covers both BE and FE testing in a single workflow.
All other apps have separate per-component workflows. Should be either split into
`test-organiclever-be.yml` + `test-organiclever-fe.yml` or explicitly documented as the
multi-component pattern.

#### Docker File Naming

| Type             | Location           | Name Pattern             |
| ---------------- | ------------------ | ------------------------ |
| Production       | `apps/{app}/`      | `Dockerfile`             |
| Integration test | `apps/{app}/`      | `Dockerfile.integration` |
| Dev (backend)    | `infra/dev/{app}/` | `Dockerfile.be.dev`      |
| Dev (frontend)   | `infra/dev/{app}/` | `Dockerfile.fe.dev`      |
| CI (special)     | `infra/dev/{app}/` | `Dockerfile.be.ci`       |

**Inconsistency**: Dev Dockerfiles use `Dockerfile.{role}.dev` but only Elixir has a
`Dockerfile.be.ci`. No other language has a CI-specific Dockerfile.

#### Docker Compose File Naming

| Type             | Location                              | Name Pattern                     |
| ---------------- | ------------------------------------- | -------------------------------- |
| Development      | `infra/dev/{app}/`                    | `docker-compose.yml`             |
| CI overlay       | `infra/dev/{app}/`                    | `docker-compose.ci.yml`          |
| Integration test | `apps/{app}/`                         | `docker-compose.integration.yml` |
| **Exception**    | `infra/dev/a-demo-be-elixir-phoenix/` | `docker-compose.ci-e2e.yml`      |

**Inconsistency**: Elixir has a unique `docker-compose.ci-e2e.yml` that no other app uses.

#### infra/dev Directory Naming

| Pattern                 | Examples                                     |
| ----------------------- | -------------------------------------------- |
| `infra/dev/{app-name}/` | `infra/dev/a-demo-be-golang-gin/`            |
| **Exception**           | `infra/dev/organiclever/` (BE + FE combined) |

**Inconsistency**: OrganicLever uses a single `infra/dev/organiclever/` directory containing both
`Dockerfile.be.dev` and `Dockerfile.fe.dev`, while all other apps have one directory per app.
This works because organiclever-be and organiclever-fe share a single docker-compose.yml for
full-stack local development. **No rename needed** -- the combined directory is intentional for
co-dependent services.

#### Specs Directory Naming

| App Type     | Pattern                               | Example                               |
| ------------ | ------------------------------------- | ------------------------------------- |
| Demo apps    | `specs/apps/a-demo/{role}/gherkin/`   | `specs/apps/a-demo/be/gherkin/`       |
| Product apps | `specs/apps/{domain}/{role}/gherkin/` | `specs/apps/organiclever/be/gherkin/` |
| CLIs         | `specs/apps/{cli-name}/{domain}/`     | `specs/apps/rhino-cli/test-coverage/` |
| Libraries    | `specs/libs/{lib-name}/{domain}/`     | `specs/libs/golang-commons/timeutil/` |

**Inconsistency**: CLI specs use flat domain directories without a `gherkin/` subdirectory, while
app BE/FE specs always nest under `gherkin/`. The CLI specs contain `.feature` files directly
under each domain directory.

#### Proposed Naming Standard for New Artifacts

| Artifact              | Pattern                                     | Example                             |
| --------------------- | ------------------------------------------- | ----------------------------------- |
| Composite action      | `.github/actions/setup-{tool}/action.yml`   | `setup-golang/action.yml`           |
| Reusable workflow     | `.github/workflows/_reusable-{purpose}.yml` | `_reusable-backend-integration.yml` |
| Consolidated workflow | `.github/workflows/test-{group}.yml`        | `test-demo-backends.yml`            |
| npm dev script        | `dev:{app-name}`                            | `dev:a-demo-be-golang-gin`          |

## R0.2: Standardized Test Level Definitions

The three-level testing standard defines **unit**, **integration**, and **e2e** tests. These
definitions MUST be consistent across all app types. The difference between levels is defined
by **what is real vs mocked**, not by the tooling used.

### Universal Definitions

| Level           | Definition                                                                                                                                                                                                                                                                                                                                              | Key Constraints                                                  | Cacheable                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| **Unit**        | All external dependencies are **mocked or stubbed**. Tests exercise business logic in complete isolation. No real databases, filesystems, network calls, or browsers. **Must test Gherkin specs.**                                                                                                                                                      | Everything external is fake. No I/O.                             | Always                                       |
| **Integration** | At least one external dependency is **real** (database, filesystem). Tests exercise the interaction between application code and real infrastructure. **No network calls** -- no inbound HTTP (no server listening) and no outbound HTTP (no calling external services). Tests call service/repository functions directly. **Must test Gherkin specs.** | Real local deps only. Zero network.                              | Default no; override to yes if deterministic |
| **E2E**         | The **full system** is under test. Real HTTP requests through real servers. For web apps, a real browser (Playwright). For APIs, real HTTP clients. Real databases. External service dependencies are **optional** (case by case -- mock when flaky or unavailable, real when critical to verify). **Must test Gherkin specs.**                         | Full stack is real. Network is real. External deps case-by-case. | Never                                        |

### Key Distinctions

**Unit vs Integration**: The boundary is whether external dependencies are real.
A unit test with a mocked database is still a unit test even if it uses Gherkin specs.
An integration test with a real PostgreSQL is an integration test even without network.

**Integration vs E2E**: The boundary is the network layer.
Integration tests call application functions directly (service layer, repository layer) --
no server is running, no HTTP requests are made (inbound or outbound).
E2E tests send real HTTP requests to a running server.

**Why no network in integration**: Isolating database/filesystem interaction from HTTP routing
makes failures easier to diagnose. If an integration test fails, the bug is in the data layer.
If an E2E test fails, the bug could be anywhere in the stack. "No network" means no listening
server and no outbound calls to external services -- the test process talks directly to the
database/filesystem, not through HTTP.

**Gherkin everywhere**: ALL test levels (unit, integration, e2e) MUST consume Gherkin specs from
`specs/`. The same feature files are used across all levels -- only the step implementations
differ (mocked vs real dependencies). This ensures behavioral consistency: if a Gherkin scenario
passes at the unit level with mocks, it must also pass at the integration level with a real
database, and at the E2E level with real HTTP.

### Mandatory Test Levels by App Type

Not all app types need all three levels. The matrix below defines which levels are **mandatory**.

| App Type             | Unit | Integration | E2E | Rationale                                                                                                                         |
| -------------------- | ---- | ----------- | --- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Backend (BE)**     | Yes  | Yes         | Yes | Full business logic + data layer + HTTP routing all need verification.                                                            |
| **Frontend (FE)**    | Yes  | --          | Yes | FE has no local infrastructure (no DB, no filesystem). Integration would be identical to unit. E2E tests the real BE+FE contract. |
| **Fullstack (FS)**   | Yes  | Yes         | Yes | Same as BE -- has data layer that needs real DB testing.                                                                          |
| **CLI**              | Yes  | Yes         | --  | CLIs interact with filesystem (needs integration) but have no HTTP/browser layer (no E2E).                                        |
| **Content Platform** | Yes  | --          | Yes | Content platforms are FE-heavy with tRPC. No local DB to integrate with. E2E tests real server.                                   |
| **Library**          | Yes  | Varies      | --  | Libraries have no deployment. Integration only if they interact with real I/O.                                                    |

### App-Type-Specific Manifestations

| App Type             | Unit (mocked)                                                                             | Integration (real dep, no network)                                                                          | E2E (full stack)                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Backend (BE)**     | Mocked DB + repositories. Call service functions. Gherkin via language-native BDD.        | Real PostgreSQL via Docker. Call service functions directly. No server running, no HTTP. Gherkin specs.     | Real PostgreSQL + real HTTP server + Playwright. External service deps mocked unless critical. Gherkin specs. |
| **Frontend (FE)**    | MSW for API mocking. JSDOM/happy-dom for DOM. Gherkin specs via Vitest BDD.               | -- (not applicable)                                                                                         | Real backend + real browser (Playwright). Gherkin specs.                                                      |
| **Fullstack (FS)**   | Mocked DB. JSDOM for UI. Call service functions. Gherkin specs.                           | Real PostgreSQL via Docker. Call service functions directly. No server running. Gherkin specs.              | Real PostgreSQL + real HTTP server + real browser (Playwright). Gherkin specs.                                |
| **CLI**              | Mocked filesystem I/O via package-level function variables. Godog BDD with Gherkin specs. | Real filesystem via `/tmp` fixtures. Godog BDD. Drives commands in-process via `cmd.RunE()`. Gherkin specs. | -- (not applicable)                                                                                           |
| **Content Platform** | Mocked tRPC. JSDOM for UI components. Gherkin specs via Vitest BDD.                       | -- (not applicable)                                                                                         | Real HTTP server + real browser (Playwright). Separate BE and FE E2E suites. Gherkin specs.                   |
| **Library**          | Mocked dependencies. Gherkin specs where applicable.                                      | Real dependencies (filesystem, etc.) if applicable. Gherkin specs.                                          | -- (not applicable)                                                                                           |

### Gherkin Consumption by Test Level

**ALL test levels MUST consume Gherkin specs.** This is a hard requirement -- no exceptions.

| App Type         | Unit | Integration         | E2E |
| ---------------- | ---- | ------------------- | --- |
| Backend (BE)     | Yes  | Yes                 | Yes |
| Frontend (FE)    | Yes  | --                  | Yes |
| Fullstack (FS)   | Yes  | Yes                 | Yes |
| CLI              | Yes  | Yes                 | --  |
| Content Platform | Yes  | --                  | Yes |
| Library          | Yes  | Yes (if applicable) | --  |

**All levels that consume Gherkin specs use the SAME feature files** from `specs/`. Only
the step implementations differ (mocked vs real dependencies).

**Current gap**: Frontend and content platform unit tests do NOT currently consume Gherkin specs.
This must be remediated as part of this plan.

### Coverage Thresholds with Rationale

| Tier                   | Threshold | Rationale                                                                                                                                                                       |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend (90%)          | 90%       | Pure business logic with injectable dependencies. Infrastructure code (DB adapters, HTTP handlers, config, main) is excluded via coverage exclusion patterns. High testability. |
| CLI (90%)              | 90%       | Pure command logic with mockable I/O. Similar testability profile to backends.                                                                                                  |
| Content Platform (80%) | 80%       | Mix of business logic (tRPC routers, content processing) and UI rendering. UI components are harder to unit test meaningfully.                                                  |
| Fullstack (75%)        | 75%       | Single app serving both API and UI. UI rendering code inflates the denominator, making 90% impractical without testing trivial render paths.                                    |
| Frontend (70%)         | 70%       | UI-heavy code where meaningful unit test coverage has diminishing returns beyond ~70%. API/auth/query layers are fully mocked by design.                                        |

Coverage is measured at the **unit test level only** and enforced by
`rhino-cli test-coverage validate` as part of the `test:quick` target.

### Specs Folder Standard

Every app domain in `specs/` MUST contain the following subdirectories (where applicable):

```
specs/apps/{domain}/
├── contracts/           # OpenAPI 3.1 spec (if app has API contract)
├── c4/                  # C4 architecture diagrams
├── be/gherkin/          # Backend Gherkin specs (if app has BE)
├── fe/gherkin/          # Frontend Gherkin specs (if app has FE)
├── fs/gherkin/          # Fullstack Gherkin specs (if app is FS)
└── cli/gherkin/         # CLI Gherkin specs (if app is CLI)
```

**Key rules**:

- Gherkin specs ALWAYS live under a `gherkin/` subdirectory (including CLIs -- eliminates
  current inconsistency where CLI specs use flat domain directories)
- The service-type subdirectory (`be/`, `fe/`, `fs/`, `cli/`) matches the role segment of the
  app directory name
- `contracts/` and `c4/` are optional but MUST exist for any app with an API contract or
  documented architecture
- Every `gherkin/` directory MUST contain a `README.md` explaining the spec scope

### Docker Compose Standard for All Apps

**Every app** MUST have a Docker Compose setup under `infra/dev/{app-name}/` for both local
development and CI. This includes:

| File                    | Purpose                               | Required For                           |
| ----------------------- | ------------------------------------- | -------------------------------------- |
| `docker-compose.yml`    | Local development with hot-reload     | All apps                               |
| `docker-compose.ci.yml` | CI overlay (production env, test API) | All apps with E2E or integration tests |

**Current gaps** (apps missing `infra/dev/` setup):

| App                   | Has `infra/dev/`                    | Gap                                |
| --------------------- | ----------------------------------- | ---------------------------------- |
| `organiclever-be`     | Yes (via `infra/dev/organiclever/`) | OK                                 |
| `organiclever-fe`     | Yes (via `infra/dev/organiclever/`) | OK                                 |
| `ayokoding-web`       | Yes                                 | OK                                 |
| `oseplatform-web`     | Yes                                 | OK                                 |
| All `a-demo-be-*`     | Yes                                 | OK                                 |
| All `a-demo-fe-*`     | Yes                                 | OK                                 |
| `a-demo-fs-ts-nextjs` | Yes                                 | OK                                 |
| `rhino-cli`           | **No**                              | Needs `infra/dev/rhino-cli/`       |
| `ayokoding-cli`       | **No**                              | Needs `infra/dev/ayokoding-cli/`   |
| `oseplatform-cli`     | **No**                              | Needs `infra/dev/oseplatform-cli/` |

**CLI apps**: Even though CLIs don't need a database, they benefit from a Docker Compose dev
setup for consistent local development. The compose file would provide a containerized build
environment with the correct Go version and tools, ensuring reproducibility.

## R0.3: Architectural Patterns

### Repository Pattern (Backend Services)

All backend services MUST use the **repository pattern** to abstract data access. This is the
foundation for testability across the three-level testing standard:

- **Unit tests** inject **mocked repositories** (in-memory, returning canned data)
- **Integration tests** inject **real repositories** backed by a real database
- **E2E tests** run the full application with real repositories and real HTTP

The repository interface is the **swap point** -- changing what's behind it changes the test
level without changing business logic tests. This makes Gherkin step implementations trivially
different between unit and integration: only the repository constructor call changes.

```
Service Layer (business logic, tested at all levels)
    ↓ depends on
Repository Interface (abstraction boundary)
    ↓ implemented by
Mock Repository (unit tests)  |  Real Repository (integration + e2e)
```

### Contract-Driven Development

Backend and frontend services that communicate over a network boundary MUST have an
**automatically generated contract**:

| Communication Pattern              | Contract Technology   | Generation Flow                                                                                                    |
| ---------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| REST API (BE ↔ FE)                 | **OpenAPI 3.1**       | Spec defined in `specs/apps/{domain}/contracts/` → codegen generates types + client/server stubs for each language |
| tRPC (fullstack/content platforms) | **tRPC router types** | Router defined in server code → TypeScript infers client types automatically (no spec file needed)                 |

**Contract enforcement via Nx**:

- `codegen` target generates types from the OpenAPI spec into `generated-contracts/` (gitignored)
- `codegen` is a **dependency of `typecheck` and `build`** -- contract violations are caught
  before code compiles
- `typecheck`, `lint`, `test:quick` all run after codegen, so contract drift is caught in
  pre-push hooks and PR quality gate

**Current implementations**:

- `a-demo-contracts`: OpenAPI spec for all demo BE ↔ FE communication
- `organiclever-contracts`: OpenAPI spec for OrganicLever BE ↔ FE
- `ayokoding-web`, `oseplatform-web`: tRPC (no OpenAPI spec needed -- types flow from server to
  client automatically)

## R0.4: Caching and CI Execution Rules

### Nx Target Caching Rules

| Target             | Cacheable | Rationale                                        |
| ------------------ | --------- | ------------------------------------------------ |
| `typecheck`        | Yes       | Deterministic: same source → same result         |
| `lint`             | Yes       | Deterministic: same source → same result         |
| `test:unit`        | Yes       | All dependencies mocked → deterministic          |
| `test:quick`       | Yes       | Composition of `test:unit` + coverage validation |
| `codegen`          | Yes       | Same spec → same generated code                  |
| `build`            | Yes       | Same source → same artifacts                     |
| `test:integration` | **No**    | Real database/filesystem → non-deterministic     |
| `test:e2e`         | **No**    | Full stack → non-deterministic                   |

### Coverage Enforcement

Coverage validation is enforced via `test:quick` = `test:unit` + `rhino-cli test-coverage
validate`. The `test:quick` target checks coverage against the per-project threshold (90%/80%/
75%/70% -- see [Coverage Thresholds](#coverage-thresholds-with-rationale)). This means coverage
is automatically checked wherever `test:quick` runs:

| Gate            | Coverage Enforced? | How                                     |
| --------------- | ------------------ | --------------------------------------- |
| Pre-push hook   | Yes                | `test:quick` for affected projects      |
| PR quality gate | Yes                | `test:quick` for affected projects      |
| Scheduled CRON  | Yes                | `test:quick` for all projects (Track 3) |

### Pre-Push Hook (Local Quality Gate)

Runs **affected projects only**:

```bash
npx nx affected -t typecheck lint test:quick --parallel="$PARALLEL"
```

Coverage is enforced because `test:quick` includes coverage validation.
Does **NOT** run `test:integration` or `test:e2e` (too slow for local push gate).

### PR Quality Gate (GitHub Actions)

Runs **affected projects only**. Covers:

- `format` (Prettier, gofmt, fantomas, etc. -- via PR auto-format workflow)
- `lint` (oxlint, golangci-lint, clippy, etc.)
- `typecheck` (tsc, go vet, javac, cargo check, etc.)
- `test:quick` (`test:unit` + **coverage validation** -- fails if below threshold)

Coverage is enforced because `test:quick` includes coverage validation.
Does **NOT** run `test:integration` or `test:e2e` -- these are too slow for PR feedback loops
and are covered by scheduled CI.

### Scheduled CI (CRON, 2x daily)

Runs **all projects** (not just affected). Executes **4 parallel tracks**:

```mermaid
flowchart LR
    CRON["CRON Trigger"] --> LINT["lint<br/>(all projects)"]
    CRON --> TC["typecheck<br/>(all projects)"]
    CRON --> TQ["test:quick<br/>(all projects)<br/>includes coverage"]
    CRON --> INT["test:integration<br/>(all projects)"]
    INT --> E2E["test:e2e<br/>(all projects)"]
```

| Track   | Targets                         | Parallel?        | Coverage? | Rationale                                                       |
| ------- | ------------------------------- | ---------------- | --------- | --------------------------------------------------------------- |
| Track 1 | `lint`                          | Independent      | --        | Fast, catches style issues                                      |
| Track 2 | `typecheck`                     | Independent      | --        | Fast, catches type errors                                       |
| Track 3 | `test:quick`                    | Independent      | **Yes**   | Unit tests + coverage validation                                |
| Track 4 | `test:integration` → `test:e2e` | Sequential chain | --        | Integration must pass before E2E (E2E assumes data layer works) |

**Key design**: The 4 tracks run in parallel so a slow integration test does not block lint or
typecheck feedback. Within Track 4, integration and E2E are sequential because E2E depends on
the data layer being correct (proven by integration tests). Coverage is enforced in Track 3
via `test:quick`.

## Current State Audit

### R1: Git Hooks

#### R1.1: Pre-Commit Hook (9 Steps)

**Current Implementation** (`.husky/pre-commit`):

| Step | Action                                    | Condition               | Notes                                 |
| ---- | ----------------------------------------- | ----------------------- | ------------------------------------- |
| 1    | Validate `.claude/` + `.opencode/` config | If config files staged  | rhino-cli agent sync                  |
| 2    | Validate docker-compose files             | If compose files staged | `docker compose config`               |
| 3    | Run `nx affected -t run-pre-commit`       | Always                  | Per-project pre-commit hooks          |
| 4    | Auto-add ayokoding-web content            | Always                  | `git add apps/ayokoding-web/content/` |
| 5    | Run lint-staged                           | Always                  | Prettier, gofmt, fantomas             |
| 6    | Run `mix format` for Elixir               | If `.ex`/`.exs` staged  | From project root                     |
| 7    | Validate docs naming + auto-fix           | Always                  | rhino-cli docs validate-naming        |
| 8    | Validate markdown links                   | If `.md` staged         | rhino-cli docs validate-links         |
| 9    | Run `npm run lint:md`                     | Always                  | markdownlint-cli2                     |

**Gaps**:

- Step 4 (auto-add ayokoding-web content) is app-specific logic in a global hook
- Step 6 (Elixir formatting) is language-specific logic that should be in lint-staged or per-project
- No timeout protection -- a hung step blocks the entire commit
- Steps 7-9 all touch markdown but run independently -- could be consolidated

#### R1.2: Commit-Msg Hook

**Current**: `npx commitlint --edit` with `@commitlint/config-conventional`

**Status**: Standardized. No changes needed.

#### R1.3: Pre-Push Hook

**Current**:

```bash
PARALLEL=$(( $(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) - 1 ))
npx nx affected -t typecheck lint test:quick --parallel="$PARALLEL"
npm run lint:md
```

**Gaps**:

- No mechanism to skip on `--no-verify` (intentional -- prevents bypass)
- Markdown linting runs on ALL files, not just affected -- slow on large repos
- No progress feedback during long runs (can take several minutes)
- Missing spec-coverage validation

### R2: Formatting, Typecheck, Lint, test:quick

#### R2.1: Formatting Tools by Language

| Language               | Tool                       | Trigger                  | Config                         |
| ---------------------- | -------------------------- | ------------------------ | ------------------------------ |
| JS/TS/JSON/YAML/CSS/MD | Prettier 3.6.2             | lint-staged (pre-commit) | `.prettierrc.json`             |
| Go                     | gofmt                      | lint-staged (pre-commit) | Built-in                       |
| F#                     | Fantomas                   | lint-staged (pre-commit) | `.fantomasrc.json` (if exists) |
| Elixir                 | mix format                 | Pre-commit step 6        | `.formatter.exs`               |
| Java                   | Checkstyle (lint only)     | `nx lint`                | `checkstyle.xml`               |
| Kotlin                 | ktlint (via Gradle)        | `nx lint`                | Built-in                       |
| Python                 | (not formatted on commit)  | Manual                   | N/A                            |
| Rust                   | rustfmt (not in hooks)     | Manual                   | `rustfmt.toml`                 |
| C#                     | (not formatted on commit)  | Manual                   | `.editorconfig`                |
| Clojure                | cljfmt (not in hooks)      | Manual                   | N/A                            |
| Dart                   | dart format (not in hooks) | Manual                   | Built-in                       |

**Gap**: Python, Rust, C#, Clojure, and Dart lack automated formatting in pre-commit hooks.

#### R2.2: Typecheck Tools by Language

| Language   | Tool             | Nx Target      | Notes                           |
| ---------- | ---------------- | -------------- | ------------------------------- |
| TypeScript | tsc / oxlint     | `typecheck`    | Various tsconfig setups         |
| Go         | go vet           | Part of `lint` | Integrated with golangci-lint   |
| Java       | javac (Maven)    | `typecheck`    | `mvn compile -q`                |
| Kotlin     | kotlinc (Gradle) | `typecheck`    | `./gradlew compileKotlin`       |
| F#         | dotnet build     | `typecheck`    | MSBuild with warnings-as-errors |
| C#         | dotnet build     | `typecheck`    | MSBuild with warnings-as-errors |
| Python     | mypy/pyright     | `typecheck`    | Type checking via strict mode   |
| Rust       | cargo check      | `typecheck`    | Part of Rust toolchain          |
| Elixir     | mix compile      | `typecheck`    | `--warnings-as-errors`          |
| Clojure    | clj-kondo        | `typecheck`    | Static analysis                 |
| Dart       | dart analyze     | `typecheck`    | Strict mode                     |

**Status**: Standardized across all projects via Nx targets.

#### R2.3: Lint Tools by Language

| Language   | Tool                              | Nx Target |
| ---------- | --------------------------------- | --------- |
| TypeScript | oxlint                            | `lint`    |
| Go         | golangci-lint                     | `lint`    |
| Java       | Checkstyle + PMD                  | `lint`    |
| Kotlin     | ktlint + detekt                   | `lint`    |
| F#         | fsharplint + analyzers            | `lint`    |
| C#         | dotnet format --verify-no-changes | `lint`    |
| Python     | ruff                              | `lint`    |
| Rust       | clippy                            | `lint`    |
| Elixir     | credo                             | `lint`    |
| Clojure    | clj-kondo + eastwood              | `lint`    |
| Dart       | dart analyze                      | `lint`    |

**Status**: Standardized across all projects via Nx targets.

#### R2.4: test:quick Composition

`test:quick` = `test:unit` + coverage validation (via `rhino-cli test-coverage validate`)

| Category          | Coverage Threshold | Apps                                      |
| ----------------- | ------------------ | ----------------------------------------- |
| Backends (BE)     | 90%                | 11 demo backends, organiclever-be         |
| CLIs              | 90%                | rhino-cli, ayokoding-cli, oseplatform-cli |
| Content platforms | 80%                | ayokoding-web, oseplatform-web            |
| Fullstack (FS)    | 75%                | a-demo-fs-ts-nextjs                       |
| Frontends (FE)    | 70%                | 3 demo frontends, organiclever-fe         |

**Gap**: Coverage threshold rationale is undocumented. Now addressed in
[R0.2 Coverage Thresholds](#coverage-thresholds-with-rationale).

### R3: Three-Level Testing (Current State)

Test level definitions and coverage thresholds are standardized in
[R0.2](#r02-standardized-test-level-definitions). This section documents the **current
implementation status** per app type.

#### R3.1: Backend Testing (11 implementations)

All demo backends share Gherkin specs from `specs/apps/a-demo/be/gherkin/` (14 feature files,
78 scenarios). All three test levels consume the same feature files -- only step implementations
differ.

- **Unit**: Language-native BDD runners (godog, Cucumber, TickSpec, Cabbage, etc.) with mocked
  repositories. Coverage measured here (90% threshold).
- **Integration**: Real PostgreSQL via `docker-compose.integration.yml` +
  `Dockerfile.integration`. Call service functions directly -- **no HTTP**.
- **E2E**: Full stack (DB + backend + frontend) via `docker-compose.yml` +
  `docker-compose.ci.yml`. Playwright tests via `a-demo-be-e2e`.

**Gap**: No `Dockerfile.integration` template documented. Each backend has its own with slight
variations in base image, build commands, and spec mounting.

#### R3.2: Frontend Testing (3 implementations)

All demo frontends share Gherkin specs from `specs/apps/a-demo/fe/gherkin/`.
Per R0.2, frontends require **unit + e2e** only (no integration -- no local infrastructure).

- **Unit**: MSW for API mocking, JSDOM/happy-dom for DOM, Vitest. Coverage measured here (70%).
- **E2E**: Real Go backend + real browser (Playwright) via `a-demo-fe-e2e`. Gherkin specs.

**Gaps**:

- Frontend unit tests do **not** currently consume Gherkin specs. Must be remediated.
- Current `test:integration` target exists but is redundant (identical to unit with MSW).
  Should be removed or repurposed.

#### R3.3: Fullstack Testing (1 implementation)

`a-demo-fs-ts-nextjs` combines backend and frontend in a single Next.js app.
Per R0.2, fullstack requires **unit + integration + e2e** (same as BE -- has data layer).

- **Unit**: Mocked DB, JSDOM. Consumes BE Gherkin specs. Coverage measured here (75%).
- **Integration**: Real PostgreSQL via Docker. Direct function calls (no network). Gherkin specs.
- **E2E**: Full stack + Playwright. Gherkin specs.

#### R3.4: CLI Testing (3 implementations)

All CLIs written in Go, using godog for Gherkin BDD at both unit and integration levels.
Per R0.2, CLIs require **unit + integration** only (no E2E -- no HTTP/browser).

- **Unit**: Mocked filesystem I/O via package-level function variables. Coverage measured here
  (90%). Gherkin specs via godog.
- **Integration**: Real filesystem via `/tmp` fixtures. Drives commands in-process via
  `cmd.RunE()`. Cache overridden to `true` (deterministic tmpdir fixtures). Gherkin specs.

**Status**: Well-standardized. Gherkin consumed at both levels.

**Gap**: No `infra/dev/` Docker Compose setup for local development. Must be added per
[Docker Compose Standard](#docker-compose-standard-for-all-apps).

#### R3.5: Content Platform Testing (2 implementations)

ayokoding-web and oseplatform-web (Next.js 16 with tRPC).
Per R0.2, content platforms require **unit + e2e** only (no local DB to integrate with).

- **Unit (BE + FE)**: Mocked tRPC, JSDOM for UI. Vitest. Coverage measured here (80%).
- **E2E**: Separate BE and FE E2E suites via Playwright (`{app}-be-e2e`, `{app}-fe-e2e`).

**Gaps**:

- Unit tests do **not** currently consume Gherkin specs. Must be remediated.
- Current `test:integration` target exists but is not a true integration test (no real local
  dependency). Should be evaluated for removal or reclassification.

#### R3.6: OrganicLever Testing

Follows the mandatory test levels for its component types: BE requires unit + integration + e2e;
FE requires unit + e2e.

- **organiclever-be**: Unit (mocked, 90%, Gherkin), Integration (real PostgreSQL, Docker, Gherkin),
  E2E (Playwright via `organiclever-be-e2e`, Gherkin).
- **organiclever-fe**: Unit (MSW, 70%), E2E (full stack + Playwright via `organiclever-fe-e2e`).

**Gaps**:

- organiclever-fe unit tests do **not** consume Gherkin specs. Must be remediated.
- organiclever-fe currently has a `test:integration` target (MSW-based) that is redundant.
  Should be removed per the FE standard (unit + e2e only).

### R4: Specs Folder Structure

#### R4.1: Current Structure

```
specs/
├── apps/
│   ├── a-demo/
│   │   ├── be/gherkin/          # 14 feature files, 78 scenarios
│   │   ├── fe/gherkin/          # Frontend Gherkin specs
│   │   └── contracts/           # OpenAPI 3.1 spec + generated output
│   ├── organiclever/
│   │   ├── be/gherkin/
│   │   ├── fe/gherkin/
│   │   ├── contracts/
│   │   └── c4/                  # C4 architecture diagrams
│   ├── ayokoding/
│   │   ├── be/gherkin/
│   │   ├── fe/gherkin/
│   │   ├── c4/
│   │   └── build-tools/gherkin/
│   ├── oseplatform/
│   │   ├── be/gherkin/
│   │   ├── fe/gherkin/
│   │   └── c4/
│   ├── rhino-cli/               # 15 feature files across 10 domains
│   ├── ayokoding-cli/
│   └── oseplatform-cli/
├── libs/
│   ├── golang-commons/
│   ├── hugo-commons/
│   └── ts-ui/gherkin/
└── apps-labs/                   # Empty (future)
```

**Gaps** (measured against the standard in
[R0.2 Specs Folder Standard](#specs-folder-standard)):

- `a-demo/` lacks `c4/` directory (other apps have it)
- `a-demo/` lacks `fs/gherkin/` for fullstack-specific specs
- CLI specs (`rhino-cli/`, `ayokoding-cli/`, `oseplatform-cli/`) use flat domain directories
  without `cli/gherkin/` nesting -- must be restructured to `specs/apps/{cli}/cli/gherkin/`
- No README.md in several `gherkin/` subdirectories
- `apps-labs/` exists but is empty with no convention documented
- `ayokoding/build-tools/gherkin/` doesn't follow the `{role}/gherkin/` pattern

#### R4.2: Contract Specs

Both `a-demo-contracts` and `organiclever-contracts` follow the same pattern:

```
specs/apps/{app}/contracts/
├── openapi.yaml               # Entry point
├── paths/                     # Endpoint definitions
├── schemas/                   # Data models
├── examples/                  # Request/response examples
├── generated/
│   ├── openapi-bundled.yaml
│   ├── openapi-bundled.json
│   └── docs/
├── .spectral.yaml             # Validation rules
└── project.json               # Nx targets: bundle, lint, docs
```

**Status**: Well-standardized. Contract codegen is a dependency of `typecheck` and `build`.

### R5: GitHub Actions Workflows

#### R5.1: Current Workflow Inventory

| Workflow                               | Trigger               | Jobs                    | Runtime(s)             |
| -------------------------------------- | --------------------- | ----------------------- | ---------------------- |
| `pr-quality-gate.yml`                  | PR (open/sync/reopen) | 1 monolithic            | 13+ runtimes           |
| `pr-format.yml`                        | PR                    | 1                       | Node.js                |
| `pr-validate-links.yml`                | PR                    | 1                       | Go                     |
| `codecov-upload.yml`                   | Push to main          | 1                       | 13+ runtimes           |
| `test-a-demo-be-golang-gin.yml`        | Cron 2x daily         | 2 (integration, e2e)    | Go + Node.js           |
| `test-a-demo-be-java-springboot.yml`   | Cron 2x daily         | 2                       | Java + Node.js         |
| `test-a-demo-be-java-vertx.yml`        | Cron 2x daily         | 2                       | Java + Node.js         |
| `test-a-demo-be-python-fastapi.yml`    | Cron 2x daily         | 2                       | Python + Node.js       |
| `test-a-demo-be-rust-axum.yml`         | Cron 2x daily         | 2                       | Rust + Node.js         |
| `test-a-demo-be-kotlin-ktor.yml`       | Cron 2x daily         | 2                       | Kotlin + Node.js       |
| `test-a-demo-be-fsharp-giraffe.yml`    | Cron 2x daily         | 2                       | .NET + Node.js         |
| `test-a-demo-be-csharp-aspnetcore.yml` | Cron 2x daily         | 2                       | .NET + Node.js         |
| `test-a-demo-be-clojure-pedestal.yml`  | Cron 2x daily         | 2                       | Clojure + Node.js      |
| `test-a-demo-be-elixir-phoenix.yml`    | Cron 2x daily         | 2                       | Elixir + Node.js       |
| `test-a-demo-be-ts-effect.yml`         | Cron 2x daily         | 2                       | Node.js                |
| `test-a-demo-fe-ts-nextjs.yml`         | Cron 2x daily         | 1                       | Node.js + Go           |
| `test-a-demo-fe-dart-flutterweb.yml`   | Cron 2x daily         | 1                       | Flutter + Go + Node.js |
| `test-a-demo-fe-ts-tanstack-start.yml` | Cron 2x daily         | 1                       | Node.js + Go           |
| `test-a-demo-fs-ts-nextjs.yml`         | Cron 2x daily         | 1                       | Node.js                |
| `test-organiclever.yml`                | Cron 2x daily         | 3 (BE int, FE int, E2E) | .NET + Node.js         |
| `test-and-deploy-ayokoding-web.yml`    | Push to main          | 4                       | Node.js + Go           |
| `test-and-deploy-oseplatform-web.yml`  | Push to main          | 4                       | Node.js + Go           |

**Total**: 22 workflows, ~4,500 lines of YAML

#### R5.2: Duplication Analysis

The 11 backend test workflows share this identical structure:

```
1. Checkout code
2. Setup language runtime (varies)
3. Setup Node.js + npm install
4. Generate contract types
5. Run integration tests via docker-compose
6. Checkout code (E2E job)
7. Setup Node.js + Go + npm install
8. Start full stack via docker-compose
9. Wait for health endpoints
10. Install Playwright + run E2E
11. Upload artifacts
12. Teardown docker-compose
```

Only steps 2 and the docker-compose file paths vary between backends. This is **~130 lines of
duplicated YAML per workflow** = ~1,430 lines of duplication across 11 workflows.

#### R5.3: PR Quality Gate Bottleneck

The current PR quality gate installs ALL runtimes in a single job:

- Go 1.26
- Java 21 + Java 25 (two JDKs)
- .NET 10
- Elixir 1.19 + Erlang/OTP 27
- Python 3.13
- Rust (latest stable)
- Flutter (stable)
- Clojure CLI
- golangci-lint, oapi-codegen, datamodel-code-generator, Fantomas, dotnet-fsharplint

**Problem**: A PR touching only `organiclever-fe` (TypeScript) still installs Go, Java, .NET,
Elixir, Python, Rust, Flutter, and Clojure. This wastes ~5-8 minutes of setup time.

**Solution**: Split into parallel, language-scoped jobs. Use `nx show projects --affected` to
determine which language families are needed, then only run relevant setup jobs.

**Scope**: PR quality gate runs `format`, `lint`, `typecheck`, `test:quick` for **affected
projects only**. It does **NOT** run `test:integration` or `test:e2e` -- those run on scheduled
CI only (see [R0.4](#r04-caching-and-ci-execution-rules)).

### R6: Docker Infrastructure

#### R6.1: Development Docker Compose (`infra/dev/`)

All dev compose files follow this pattern:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    ports: ["5432:5432"]
    volumes: ["{app}-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U {user}"]

  { app }:
    build:
      context: ../../../
      dockerfile: infra/dev/{app}/Dockerfile.be.dev
    ports: ["{port}:{port}"]
    volumes:
      - ../../../apps/{app}:/app/apps/{app} # Source mount for hot-reload
      - ../../../specs:/app/specs:ro # Gherkin specs
      - ../../../generated-contracts:/app/generated-contracts:ro
    depends_on:
      postgres: { condition: service_healthy }
    environment:
      DATABASE_URL: "postgres://{user}:{pass}@postgres:5432/{db}"
```

**Hot-reload mechanisms by language**:

| Language           | Mechanism               | Tool                                |
| ------------------ | ----------------------- | ----------------------------------- |
| Go                 | File watcher + rebuild  | `air` or `go run` with volume mount |
| Java (Spring Boot) | Spring DevTools         | `mvn spring-boot:run`               |
| Java (Vert.x)      | Vert.x launcher         | `mvn exec:java` with redeploy       |
| TypeScript         | tsx watch               | `npx tsx watch`                     |
| Python             | uvicorn reload          | `uvicorn --reload`                  |
| Rust               | cargo watch             | `cargo watch -x run`                |
| Kotlin             | Gradle continuous       | `./gradlew run --continuous`        |
| F#                 | dotnet watch            | `dotnet watch run`                  |
| C#                 | dotnet watch            | `dotnet watch run`                  |
| Elixir             | Phoenix code reloader   | `mix phx.server`                    |
| Clojure            | nREPL + tools.namespace | `clojure -M:dev`                    |

#### R6.2: Integration Test Docker (`apps/*/docker-compose.integration.yml`)

All integration compose files follow this pattern:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    tmpfs: /var/lib/postgresql/data # Ephemeral for speed
    healthcheck: ...

  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.integration
    depends_on:
      postgres: { condition: service_healthy }
    volumes:
      - ../../specs:/specs:ro # Mount Gherkin specs
    environment:
      DATABASE_URL: "..."
```

**Gap**: `Dockerfile.integration` files are not templated. Each backend has its own with
language-specific build and test commands.

#### R6.3: CI Overlay Docker Compose (`infra/dev/*/docker-compose.ci.yml`)

CI overlays extend dev compose files with:

- Production environment variables (`GIN_MODE=release`, `NODE_ENV=production`, etc.)
- `ENABLE_TEST_API=true` flag for test-only endpoints
- Frontend service added (for full-stack E2E)
- Hardcoded credentials (test-only)

#### R6.4: Dockerfile Patterns

**Production Dockerfiles** (multi-stage):

| Stage      | Purpose                              | Base Image Pattern                            |
| ---------- | ------------------------------------ | --------------------------------------------- |
| deps/build | Install dependencies + compile       | `{language}:{version}-alpine`                 |
| runtime    | Minimal runtime with built artifacts | `alpine:3.22` or `{runtime}:{version}-alpine` |

**Standardization needs**:

- All should use non-root users (some don't)
- Health check commands vary (curl vs wget vs none)
- `.dockerignore` is at repo root, not per-app
- No LABEL metadata (version, maintainer, etc.)

### R7: Missing CI Coverage

| Gap                                                             | Impact                                      | Priority |
| --------------------------------------------------------------- | ------------------------------------------- | -------- |
| FE/content platform unit tests don't consume Gherkin specs      | Behavioral specs not verified at unit level | High     |
| spec-coverage validation not in CI                              | Specs can drift from tests undetected       | High     |
| CLI apps lack `infra/dev/` Docker Compose setup                 | Inconsistent local dev experience           | High     |
| FE `test:integration` targets are redundant (identical to unit) | Misleading test levels                      | Medium   |
| Python/Rust/C#/Clojure/Dart not auto-formatted on commit        | Manual formatting burden                    | Medium   |
| No Docker layer caching in CI                                   | Slow integration/E2E test cycles            | Medium   |
| CLI specs use flat domain dirs instead of `cli/gherkin/`        | Inconsistent with other app types           | Medium   |
| `a-demo/` lacks `c4/` and `fs/gherkin/` directories             | Incomplete spec folder structure            | Low      |

## Acceptance Criteria

### AC1: Git Hooks

```gherkin
Feature: Standardized Git Hooks

  Scenario: Pre-commit validates staged files efficiently
    Given a developer has staged files for commit
    When the pre-commit hook runs
    Then only relevant formatters execute for the staged file types
    And language-specific formatting is handled by lint-staged (not separate hook steps)
    And the hook completes within 30 seconds for typical changes

  Scenario: Pre-push runs cacheable quality gates
    Given a developer pushes to the remote
    When the pre-push hook runs
    Then typecheck, lint, and test:quick run for affected projects only
    And Nx caching is used to skip unchanged projects
    And markdown linting runs only on affected markdown files

  Scenario: All languages have automated formatting
    Given a developer stages files in any supported language
    When the pre-commit hook runs
    Then the files are auto-formatted using the language-appropriate tool
    And the formatted files are re-staged automatically
```

### AC2: PR Quality Gate

```gherkin
Feature: Optimized PR Quality Gate

  Scenario: Language-scoped parallel jobs
    Given a PR that only modifies TypeScript files
    When the PR quality gate workflow runs
    Then only the Node.js runtime is installed
    And Go, Java, .NET, Elixir, Python, Rust, Flutter, and Clojure setup is skipped
    And the workflow completes faster than the current monolithic approach

  Scenario: Full quality gate on cross-language PR
    Given a PR that modifies both Go and TypeScript files
    When the PR quality gate workflow runs
    Then both Go and Node.js runtimes are installed in parallel jobs
    And typecheck, lint, and test:quick run for affected projects
    And results from all parallel jobs are aggregated
```

### AC3: Consolidated Backend Test Workflows

```gherkin
Feature: Consolidated Backend Test Workflows

  Scenario: Single workflow tests all backends via matrix
    Given the consolidated backend test workflow
    When triggered on schedule (2x daily)
    Then all 11 backends are tested via a matrix strategy
    And each matrix entry uses the appropriate composite action for language setup
    And integration tests run before E2E tests (sequential dependency)
    And test artifacts are uploaded per backend

  Scenario: Backend test workflow can be triggered manually
    Given a developer wants to test a specific backend
    When they trigger the workflow via workflow_dispatch
    Then they can select which backend(s) to test
    And only the selected backends are tested
```

### AC4: Docker Standardization

```gherkin
Feature: Standardized Docker Infrastructure

  Scenario: All Dockerfiles follow the template
    Given the Dockerfile template in governance documentation
    When a new backend is added
    Then the Dockerfile follows multi-stage build pattern
    And uses non-root user in runtime stage
    And includes LABEL metadata
    And has a HEALTHCHECK instruction

  Scenario: Integration test Dockerfiles are templated
    Given the Dockerfile.integration template
    When a new backend needs integration tests
    Then the template provides language-specific build and test commands
    And specs are mounted read-only from the host
    And the test runner exits with appropriate exit code

  Scenario: Docker layer caching speeds up CI
    Given the CI workflows use Docker
    When integration or E2E tests run
    Then Docker layers are cached between workflow runs
    And subsequent runs reuse cached layers when Dockerfiles haven't changed
```

### AC5: Local Development with Docker

```gherkin
Feature: Local Development with Docker Compose

  Scenario: Developer starts any backend with hot-reload
    Given a developer wants to work on a specific backend
    When they run the documented docker-compose dev command
    Then the backend starts with hot-reload enabled
    And source code changes are reflected without container restart
    And the database is seeded with initial data
    And the developer can access the service at the documented port

  Scenario: Developer starts full stack locally
    Given a developer wants to run backend + frontend + database
    When they run the full-stack docker-compose command
    Then all services start with appropriate dependencies
    And health checks ensure services are ready before dependent services start
    And hot-reload works for both backend and frontend
```

### AC6: Spec-Coverage Integration

```gherkin
Feature: Spec-Coverage Validation in CI

  Scenario: CI validates spec-to-test mapping
    Given the spec-coverage validation is integrated into CI
    When a developer adds a new Gherkin scenario without implementing it
    Then the CI pipeline flags the unimplemented scenario
    And the build fails with a clear error message

  Scenario: Spec-coverage runs for all testable projects
    Given all projects that consume Gherkin specs
    When the CI pipeline runs
    Then spec-coverage validation runs for each project
    And coverage gaps are reported per project
```

### AC7: Governance Documentation

```gherkin
Feature: CI Conventions Documentation

  Scenario: CI conventions are documented
    Given the governance documentation
    When a developer looks for CI/CD guidance
    Then they find a comprehensive CI conventions document
    And it covers git hooks, GitHub Actions, Docker, and testing standards
    And it includes decision matrices for choosing testing strategies
    And it documents coverage threshold rationale

  Scenario: Adding a new app follows documented process
    Given the CI conventions documentation
    When a developer adds a new backend in a new language
    Then they can follow the documented checklist
    And the checklist covers: Dockerfile, docker-compose, workflow, specs, coverage
    And the new app integrates into the existing CI pipeline
```
