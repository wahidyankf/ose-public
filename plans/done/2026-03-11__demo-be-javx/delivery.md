# Delivery Checklist: demo-be-javx

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [x] Verify Java 25 available locally (`java -version` shows 25)
- [x] Verify Maven available (`mvn -version`)
- [x] Verify `rhino-cli test-coverage validate` supports JaCoCo XML (same as demo-be-jasb — it does)
- [x] Confirm Cucumber JVM 7+ supports the Gherkin syntax used in `specs/apps/demo-be/gherkin/`
- [x] Verify `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [x] Verify Vert.x 4.x or 5.x release available on Maven Central
- [x] Check that `rhino-cli java validate-annotations` recognizes `@NullMarked` from JSpecify
      (same as demo-be-jasb — it does)

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-javx): scaffold Java/Vert.x project`

- [x] Create `apps/demo-be-javx/` directory structure per tech-docs.md
- [x] Create `pom.xml` with:
  - Java 25 compiler settings
  - Vert.x Core, Vert.x Web, Vert.x PG Client dependencies
  - java-jwt (Auth0) dependency
  - jBCrypt dependency
  - JSpecify dependency
  - JUnit 5, Vert.x JUnit5, Vert.x WebClient (test scope)
  - Cucumber JVM dependencies (test scope, integration profile)
  - JaCoCo plugin (integration profile)
  - Checkstyle plugin
  - Error Prone + NullAway plugin (nullcheck profile)
  - maven-resources-plugin to copy Gherkin specs to test classpath
- [x] Create `src/main/java/com/organiclever/demojavx/` package tree with `package-info.java`
      files containing `@NullMarked` in each package
- [x] Create minimal `MainVerticle.java` and `Main.java` entry point
- [x] Create `AppRouter.java` with only the health route wired
- [x] Create `HealthHandler.java` returning `{"status": "UP"}`
- [x] Create `project.json` with all Nx targets from tech-docs.md
- [x] Create `checkstyle.xml` (copy and adapt from `apps/demo-be-jasb/checkstyle.xml`)
- [x] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [x] Verify `mvn compile` succeeds with zero errors
- [x] Verify `mvn checkstyle:check` passes
- [x] Verify `nx run demo-be-javx:build` succeeds
- [x] Commit

---

## Phase 2: Domain Types and Validators

**Commit**: `feat(demo-be-javx): add domain model and validators`

- [x] Create `domain/model/User.java` — record with id, username, email, displayName,
      passwordHash, role, status, failedLoginAttempts, createdAt
- [x] Create `domain/model/Expense.java` — record with id, userId, type, amount, currency,
      category, description, date, quantity, unit, createdAt
- [x] Create `domain/model/Attachment.java` — record with id, expenseId, userId, filename,
      contentType, size, data, createdAt
- [x] Create `domain/model/TokenRevocation.java` — record with jti, userId, revokedAt
- [x] Create `domain/validation/UserValidator.java` — password (min 12, uppercase, special),
      email format, username non-empty validation
- [x] Create `domain/validation/ExpenseValidator.java` — currency (USD/IDR), amount precision,
      unit validation (metric/imperial allowlist), negative amount rejection
- [x] Add `package-info.java` with `@NullMarked` to all domain sub-packages
- [x] Write unit tests in `src/test/java/com/organiclever/demojavx/unit/`:
  - `UserValidatorTest.java` — password rules, email format, username rules
  - `ExpenseValidatorTest.java` — currency validation, amount precision, unit validation
- [x] Verify `mvn test` passes (unit tests only)
- [x] Commit

---

## Phase 3: Auth Services and In-Memory Repositories

**Commit**: `feat(demo-be-javx): add auth services and in-memory repositories`

- [x] Create `auth/JwtService.java` — JWT generation (access token 15min, refresh token 7d),
      validation, claims extraction; uses java-jwt (Auth0)
- [x] Create `auth/PasswordService.java` — BCrypt hash + verify via jBCrypt
- [x] Create `repository/UserRepository.java` — interface with `Future<T>` return types
- [x] Create `repository/ExpenseRepository.java` — interface with `Future<T>` return types
- [x] Create `repository/AttachmentRepository.java` — interface with `Future<T>` return types
- [x] Create `repository/TokenRevocationRepository.java` — interface with `Future<T>` return types
- [x] Create `repository/memory/InMemoryUserRepository.java` — `ConcurrentHashMap` impl with
      `reset()` method for test isolation
- [x] Create `repository/memory/InMemoryExpenseRepository.java`
- [x] Create `repository/memory/InMemoryAttachmentRepository.java`
- [x] Create `repository/memory/InMemoryTokenRevocationRepository.java`
- [x] Write unit tests:
  - `JwtServiceTest.java` — token generation, validation, expiry, claims extraction
  - `PasswordServiceTest.java` — hash + verify correctness
- [x] Verify `mvn test` passes
- [x] Commit

---

## Phase 4: Health Endpoint and Test Infrastructure

**Commit**: `feat(demo-be-javx): add /health endpoint with Cucumber test infrastructure`

- [x] Create `support/AppFactory.java` — deploys `MainVerticle` with in-memory repositories
      on a random free port; exposes `WebClient` and `reset()` for test isolation
- [x] Create `support/ScenarioState.java` — thread-local shared state for Cucumber steps
      (last response, access token, refresh token, current user context)
- [x] Create `integration/steps/CommonSteps.java` with:
  - `@BeforeAll` static: deploy `AppFactory`
  - `@Before` instance: call `AppFactory.reset()` to clear in-memory state between scenarios
  - `@AfterAll` static: close Vert.x
  - Shared step: `the response status code should be {int}`
- [x] Create `integration/steps/HealthSteps.java` for `health-check.feature`
- [x] Create integration test runner `CucumberIT.java` annotated with
      `@Suite`, `@SelectClasspathResource("specs/health")`,
      `@ConfigurationParameter(GLUE_PROPERTY_NAME, "com.organiclever.demojavx.integration.steps")`
- [x] Verify `mvn test -Pintegration` runs Cucumber and 2 health scenarios pass
- [x] Commit

---

## Phase 5: Auth — Register and Login

**Commit**: `feat(demo-be-javx): add register and login endpoints`

- [x] Create `auth/JwtAuthHandler.java` — validates Bearer token, checks revocation list,
      stores `userId` and `role` in `RoutingContext`; calls `ctx.next()` on success
- [x] Create `handler/AuthHandler.java`:
  - `POST /api/v1/auth/register` → 201 `{id, username, email, display_name, role}`
  - `POST /api/v1/auth/login` → 200 `{access_token, refresh_token, token_type: "Bearer"}`
- [x] Wire `BodyHandler.create()` on router before all body-consuming routes
- [x] Add public routes for `/api/v1/auth/register` and `/api/v1/auth/login`
- [x] Wire global failure handler to translate domain exceptions to HTTP status codes
- [x] Create `integration/steps/AuthSteps.java` for `registration.feature` and
      `password-login.feature`
- [x] Update `CucumberIT.java` to include `specs/authentication` and `specs/user-lifecycle`
- [x] Verify `mvn test -Pintegration` passes — 13 scenarios (2 health + 6 registration +
      5 password-login)
- [x] Commit

---

## Phase 6: Token Lifecycle and Management

**Commit**: `feat(demo-be-javx): add token lifecycle and management endpoints`

- [x] Add to `AuthHandler.java`:
  - `POST /api/v1/auth/refresh` — validate refresh token, rotate (issue new pair), revoke old
  - `POST /api/v1/auth/logout` — revoke current access token (idempotent, returns 200)
  - `POST /api/v1/auth/logout-all` — revoke all tokens for authenticated user
- [x] Create `handler/TokenHandler.java`:
  - `GET /api/v1/tokens/claims` — decode JWT claims from Bearer token, return as JSON
  - `GET /.well-known/jwks.json` — return public key in JWKS format
- [x] Wire JWT-protected route for `logout-all` and `tokens/claims`
- [x] Ensure `logout` (public route) extracts token manually without `JwtAuthHandler`
- [x] Create `integration/steps/TokenLifecycleSteps.java` for `token-lifecycle.feature`
- [x] Create `integration/steps/TokenManagementSteps.java` for `tokens.feature`
- [x] Update `CucumberIT.java` to include `specs/authentication` and `specs/token-management`
- [x] Verify `mvn test -Pintegration` passes — 26 scenarios
- [x] Commit

---

## Phase 7: User Account and Security

**Commit**: `feat(demo-be-javx): add user account and security endpoints`

- [x] Create `handler/UserHandler.java`:
  - `GET /api/v1/users/me` — return current user profile (no password field)
  - `PATCH /api/v1/users/me` — update displayName
  - `POST /api/v1/users/me/password` — change password (verify old, hash new)
  - `POST /api/v1/users/me/deactivate` — set user status to INACTIVE, revoke all tokens
- [x] Implement account lockout: increment `failedLoginAttempts` on each bad password;
      set status to LOCKED after threshold (e.g., 5 attempts); reset on successful login
- [x] Wire `JwtAuthHandler` before all `/api/v1/users/me` routes
- [x] Create `integration/steps/UserAccountSteps.java` for `user-account.feature`
- [x] Create `integration/steps/SecuritySteps.java` for `security.feature`
- [x] Update `CucumberIT.java` to include `specs/user-lifecycle` and `specs/security`
- [x] Verify `mvn test -Pintegration` passes — 37 scenarios
- [x] Commit

---

## Phase 8: Admin

**Commit**: `feat(demo-be-javx): add admin endpoints`

- [x] Create `auth/AdminAuthHandler.java` — checks `role == "ADMIN"` from routing context;
      calls `ctx.fail(403)` if not admin
- [x] Create `handler/AdminHandler.java`:
  - `GET /api/v1/admin/users` — paginated user list with optional `email` query param filter
  - `POST /api/v1/admin/users/{id}/disable` — set user status to DISABLED
  - `POST /api/v1/admin/users/{id}/enable` — set user status to ACTIVE
  - `POST /api/v1/admin/users/{id}/unlock` — clear lockout (set status to ACTIVE,
    reset failedLoginAttempts)
  - `POST /api/v1/admin/users/{id}/force-password-reset` — generate and return reset token
- [x] Wire `JwtAuthHandler` then `AdminAuthHandler` before all `/api/v1/admin` routes
- [x] Ensure pagination: `page` (default 1, minimum 1) and `size` query params
- [x] Create `integration/steps/AdminSteps.java` for `admin.feature`
- [x] Update `CucumberIT.java` to include `specs/admin`
- [x] Verify `mvn test -Pintegration` passes — 43 scenarios
- [x] Commit

---

## Phase 9: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-javx): add expense CRUD and currency handling`

- [x] Create `handler/ExpenseHandler.java`:
  - `POST /api/v1/expenses` — create expense or income; validate currency + amount precision
  - `GET /api/v1/expenses/summary` — group totals by currency (register BEFORE `/:id` route)
  - `GET /api/v1/expenses` — list own entries (paginated, default page=1)
  - `GET /api/v1/expenses/{id}` — get by ID (user-scoped, 403 if not owner)
  - `PUT /api/v1/expenses/{id}` — update amount, description
  - `DELETE /api/v1/expenses/{id}` — delete (204)
- [x] Enforce `GET /api/v1/expenses/summary` route is registered before `GET /api/v1/expenses/:id`
      to prevent "summary" being matched as an expense ID
- [x] Implement currency precision: USD 2dp, IDR 0dp, reject unsupported currencies
- [x] Reject negative amounts at validation layer
- [x] Create `integration/steps/ExpenseSteps.java` for `expense-management.feature`
- [x] Create `integration/steps/CurrencySteps.java` for `currency-handling.feature`
- [x] Update `CucumberIT.java` to include `specs/expenses`
- [x] Verify `mvn test -Pintegration` passes — 56 scenarios
- [x] Commit

---

## Phase 10: Expenses — Units, Reporting, Attachments

**Commit**: `feat(demo-be-javx): add unit handling, reporting, and attachments`

- [x] Add `quantity` and `unit` fields to expense creation/retrieval
- [x] Enforce unit allowlist (metric: liter, kg, meter, etc.; imperial: gallon, lb, foot, etc.)
      — reject unsupported units with 400
- [x] Create `handler/ReportHandler.java`:
  - `GET /api/v1/reports/pl` — P&L per currency with `from`, `to`, `currency` query params;
    register BEFORE any wildcard expense routes to avoid path conflicts
  - Response: `{income, expenses, net}` at summary level and `{category, amount}` at breakdown
  - Return zero totals for periods with no entries
- [x] Create `handler/AttachmentHandler.java`:
  - `POST /api/v1/expenses/{id}/attachments` — upload file (multipart); validate content type
    (JPEG, PNG, PDF only → 415 for others); validate size (max 10MB → 413 for over-limit)
  - `GET /api/v1/expenses/{id}/attachments` — list attachments for entry (user-scoped)
  - `DELETE /api/v1/expenses/{id}/attachments/{aid}` — delete attachment (user-scoped, 404 if not found)
- [x] Ensure attachment endpoints enforce ownership: 403 if expense belongs to another user
- [x] Create `integration/steps/UnitHandlingSteps.java` for `unit-handling.feature`
- [x] Create `integration/steps/ReportingSteps.java` for `reporting.feature`
- [x] Create `integration/steps/AttachmentSteps.java` for `attachments.feature`
- [x] Update `CucumberIT.java` to include all remaining `specs/expenses` feature files
- [x] Verify `mvn test -Pintegration` passes — all 76 scenarios
- [x] Commit

---

## Phase 11: PostgreSQL Repository Implementations

**Commit**: `feat(demo-be-javx): add PostgreSQL repository implementations`

- [x] Create `repository/pg/PgUserRepository.java` — Vert.x SQL Client reactive queries
- [x] Create `repository/pg/PgExpenseRepository.java`
- [x] Create `repository/pg/PgAttachmentRepository.java`
- [x] Create `repository/pg/PgTokenRevocationRepository.java`
- [x] Create SQL migration scripts in `src/main/resources/db/migration/` (Flyway or
      plain SQL executed at startup via `vertx-pg-client`)
- [x] Update `MainVerticle.java` to wire `Pg*Repository` implementations using
      `PgPool.create(vertx, connectOptions, poolOptions)`
- [x] Verify `nx run demo-be-javx:build` compiles without errors
- [x] Verify `mvn test -Pintegration` still passes (still uses in-memory repos)
- [x] Commit

---

## Phase 12: Coverage and Quality Gate

**Commit**: `fix(demo-be-javx): achieve 90% coverage and pass quality gates`

- [x] Run full test suite: `mvn test && mvn test -Pintegration`
- [x] Check JaCoCo XML report at `target/site/jacoco-integration/jacoco.xml`
- [x] Validate: `rhino-cli test-coverage validate ... 90` passes (92.76% line coverage)
- [x] Verify `nx run demo-be-javx:test:quick` passes end-to-end

**Key fixes applied:**
- Jackson version conflict: `jackson-core 2.16.1` (from Vert.x) conflicted with `jackson-databind 2.18.3`;
  fixed by explicitly declaring `jackson-core 2.18.3` in pom.xml. The `getNumberTypeFP()` method was
  added in Jackson 2.17+ and caused `NoSuchMethodError` when parsing JSON with floating-point numbers.
- Login flow: refresh JTI was incorrectly saved to revocation store on login (making it immediately appear
  revoked); removed the erroneous `revocationRepo.save(revocation)` call from `handleLogin`.
- Dead code removal: removed unused `findByUserId` from `TokenRevocationRepository` interface and impl;
  removed unused `withAmount`/`withDescription` helpers from `Expense` model.
- `JwtAuthHandler` refactored from raw `Object` instanceof pattern to typed generics.
- `TokenManagementSteps.aliceDecodesHerAccessTokenPayload` updated to call `GET /api/v1/tokens/claims`
  API (covering `TokenHandler.handleClaims`).

---

## Phase 13: Infra — Docker Compose

**Commit**: `feat(infra): add demo-be-javx docker-compose dev environment`

- [x] Create `infra/dev/demo-be-javx/Dockerfile.be.dev` (eclipse-temurin:25-jdk-alpine + Maven)
- [x] Create `infra/dev/demo-be-javx/docker-compose.yml` with PostgreSQL 17 + Vert.x app
- [x] Create `infra/dev/demo-be-javx/docker-compose.e2e.yml` (E2E overrides, same pattern as jasb)
- [x] Create `infra/dev/demo-be-javx/README.md` with startup instructions, env vars, health check
- [x] Manual test: `docker compose up --build` → `GET /health` returns `{"status":"UP"}`

---

## Phase 14: GitHub Actions — E2E Workflow

**Commit**: `ci: add e2e-demo-be-javx GitHub Actions workflow`

- [x] Create `.github/workflows/e2e-demo-be-javx.yml`:
  - Trigger: schedule (same crons as jasb/exph/fsgi) + `workflow_dispatch`
  - Job steps:
    1. `actions/checkout@v4`
    2. `docker compose -f infra/dev/demo-be-javx/docker-compose.e2e.yml up -d --build`
    3. Wait for health check (poll `http://localhost:8201/health` with retry)
    4. Volta + `npm ci`
    5. `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201`
    6. Upload artifact `playwright-report-be-javx` (always)
    7. `docker compose -f infra/dev/demo-be-javx/docker-compose.e2e.yml down` (always)
- [x] Trigger `workflow_dispatch` manually; verify green

---

## Phase 15: CI — main-ci.yml Update

**Commit**: `ci: add demo-be-javx coverage upload to main-ci`

- [x] Add coverage upload step to `.github/workflows/main-ci.yml` after existing Java steps:
  ```yaml
  - name: Upload coverage — demo-be-javx
    uses: codecov/codecov-action@v5
    with:
      token: ${{ secrets.CODECOV_TOKEN }}
      files: apps/demo-be-javx/target/site/jacoco-integration/jacoco.xml
      flags: demo-be-javx
      fail_ci_if_error: false
  ```
- [x] Note: JDK 25 setup step already exists for `demo-be-jasb` — reuse it, do not duplicate
- [x] Push to `main`; verify `Main CI` workflow passes

---

## Phase 16: Documentation Updates

**Commit**: `docs: add demo-be-javx to project documentation`

- [x] Update `CLAUDE.md`:
  - Add `demo-be-javx` to Current Apps list with description (Java 25 + Vert.x reactive API)
  - Add `demo-be-javx` to `test:integration` caching note (in-memory, no external services)
- [x] Update `README.md`:
  - Add demo-be-javx badge in demo apps section
  - Add coverage badge row
  - Add to monorepo architecture listing
- [x] Update `specs/apps/demo-be/README.md`:
  - Add Java/Vert.x row to Implementations table
- [x] Update `apps/demo-be-e2e/project.json`:
  - Add `demo-be-javx` to `implicitDependencies`
- [x] Update `governance/development/infra/nx-targets.md`:
  - Add `platform:vertx` to platform vocabulary table
  - Add demo-be-javx row to app registry
- [x] Update `plans/in-progress/README.md`:
  - Remove this plan from active list

---

## Phase 17: Final Validation

- [x] `nx run demo-be-javx:test:quick` passes (unit + integration, ≥90% coverage, lint clean)
- [x] `nx run demo-be-javx:test:unit` passes
- [x] `nx run demo-be-javx:test:integration` passes — all 76 scenarios
- [x] `nx run demo-be-javx:lint` passes
- [x] `nx run demo-be-javx:typecheck` passes (NullAway + `@NullMarked` validation)
- [x] `nx run demo-be-javx:build` produces working JAR artifact
- [x] Docker Compose stack starts and health check passes (manual verification)
- [x] `e2e-demo-be-javx.yml` workflow green (requires CI push)
- [x] `main-ci.yml` workflow green (requires CI push)
- [x] All documentation updated
- [x] Move plan folder from `plans/in-progress/` to `plans/done/`
