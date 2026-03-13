# Delivery Checklist: demo-be-kotlin-ktor

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [x] Verify JDK 21 available locally (`java -version` — eclipse-temurin 21 or equivalent)
- [x] Verify Gradle 8.x available or that Gradle wrapper will be committed
- [x] Verify `rhino-cli test-coverage validate` supports Kover XML format (same JaCoCo-compatible
      XML schema — already used by `demo-be-java-springboot`)
- [x] Confirm Cucumber JVM 7.x supports JUnit Platform Engine with Kotlin lambda DSL
- [x] Verify `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [x] Confirm Koin 4.x is compatible with Ktor 3.x integration module
- [x] Confirm ktfmt Gradle plugin (`com.ncorti.ktfmt.gradle`) version compatible with Kotlin 2.1

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-kotlin-ktor): scaffold Kotlin/Ktor project`

- [x] Create `apps/demo-be-kotlin-ktor/` directory structure per tech-docs.md
- [x] Create `settings.gradle.kts` declaring project name `demo-be-kotlin-ktor`
- [x] Create `gradle.properties` pinning Kotlin, Ktor, and Exposed versions
- [x] Create `build.gradle.kts` with all Gradle plugins and dependency groups (main + test)
  - Add Ktor fatJar (`ktor { fatJar { archiveFileName.set("demo-be-kotlin-ktor-all.jar") } }`)
  - Add Kover configuration with XML report output
  - Add detekt configuration referencing `detekt.yml`
  - Add ktfmt configuration with Google style
  - Add `processTestResources` task copying Gherkin specs into test classpath
- [x] Create Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/`)
- [x] Create minimal `Application.kt` with Ktor health endpoint on port 8201
- [x] Create `plugins/Routing.kt` wiring `GET /health` route
- [x] Create `plugins/Serialization.kt` configuring kotlinx.serialization JSON
- [x] Create `project.json` with all Nx targets from tech-docs.md
- [x] Add `detekt.yml` config (disable rules incompatible with Ktor DSL patterns)
- [x] Add `.editorconfig` with Kotlin code style settings
- [x] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [x] Verify `./gradlew build -x test` compiles with zero errors
- [x] Verify `./gradlew ktfmtCheck` passes
- [x] Verify `./gradlew detekt` passes
- [x] Commit

---

## Phase 2: Domain Models and Repository Interfaces

**Commit**: `feat(demo-be-kotlin-ktor): add domain models and repository interfaces`

- [x] Create `domain/models.kt` — data classes and sealed classes:
  - `DomainError` sealed class (ValidationError, NotFound, Forbidden, Conflict,
    Unauthorized, FileTooLarge, UnsupportedMediaType)
  - `Role` enum (USER, ADMIN)
  - `UserStatus` enum (ACTIVE, INACTIVE, DISABLED, LOCKED)
  - `EntryType` enum (EXPENSE, INCOME)
  - `User` data class
  - `Expense` data class
  - `Attachment` data class
  - `Page<T>` data class (items, totalItems, page, pageSize)
- [x] Create `domain/UserDomain.kt` — validation functions (pure, no side effects):
  - `validatePassword(password: String): Result<String, DomainError>` (min 12 chars, special char)
  - `validateEmail(email: String): Result<String, DomainError>`
  - `validateUsername(username: String): Result<String, DomainError>`
  - `validateDisplayName(name: String): Result<String, DomainError>`
- [x] Create `domain/ExpenseDomain.kt` — validation functions:
  - `validateAmount(currency: String, amount: BigDecimal): Result<BigDecimal, DomainError>`
  - `validateCurrency(currency: String): Result<String, DomainError>`
  - `validateUnit(unit: String?): Result<String?, DomainError>`
- [x] Create `domain/AttachmentDomain.kt` — validation functions:
  - `validateContentType(contentType: String): Result<String, DomainError>`
  - `validateFileSize(sizeBytes: Long, limitBytes: Long): Result<Long, DomainError>`
- [x] Create repository interfaces in `infrastructure/repositories/`:
  - `UserRepository.kt`, `TokenRepository.kt`, `ExpenseRepository.kt`,
    `AttachmentRepository.kt` (all `suspend` methods)
- [x] Write unit tests in `unit/`:
  - `UserValidationTest.kt` — password, email, username validation edge cases
  - `CurrencyValidationTest.kt` — USD 2dp, IDR 0dp, negative amount, unsupported currency
  - `AttachmentValidationTest.kt` — content type and file size validation
- [x] Verify `./gradlew test --tests '*.unit.*'` passes
- [x] Commit

---

## Phase 3: Database Layer

**Commit**: `feat(demo-be-kotlin-ktor): add Exposed database tables and implementations`

- [x] Create `infrastructure/DatabaseFactory.kt` with `init(jdbcUrl, driver)` function
  - Creates schema with `SchemaUtils.create(...)` in a transaction
  - Reads `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` from env
- [x] Create Exposed table objects in `infrastructure/tables/`:
  - `UsersTable.kt` — id, username, email, displayName, passwordHash, role, status,
    failedLoginCount, createdAt, updatedAt
  - `TokensTable.kt` — jti, userId, tokenType (ACCESS/REFRESH), expiresAt, revokedAt
  - `ExpensesTable.kt` — id, userId, type, amount, currency, category, description, date,
    quantity (nullable), unit (nullable), createdAt, updatedAt
  - `AttachmentsTable.kt` — id, expenseId, userId, filename, contentType, sizeBytes,
    storedPath, createdAt
- [x] Create Exposed repository implementations:
  - `ExposedUserRepository.kt`
  - `ExposedTokenRepository.kt`
  - `ExposedExpenseRepository.kt`
  - `ExposedAttachmentRepository.kt`
- [x] Create in-memory repository implementations for tests:
  - `InMemoryUserRepository.kt` (ConcurrentHashMap-backed, implements `UserRepository`)
  - `InMemoryTokenRepository.kt`
  - `InMemoryExpenseRepository.kt`
  - `InMemoryAttachmentRepository.kt`
- [x] Create `infrastructure/PasswordService.kt` — jBCrypt wrapper
  - `hash(plaintext: String): String`
  - `verify(plaintext: String, hash: String): Boolean`
- [x] Commit

---

## Phase 4: Health Endpoint

**Commit**: `feat(demo-be-kotlin-ktor): add /health endpoint with integration tests`

- [x] Health endpoint already in `Application.kt` returning `{"status": "UP"}`
- [x] Route `GET /health` (public, no auth) already wired
- [x] Create `TestApplication.kt` with `testApp {}` helper:
  - Starts `testApplication {}` with in-memory Koin module
  - Provides `HttpClient` configured for JSON
- [x] Create `integration/steps/CommonSteps.kt` with shared step definitions:
  - `Given("the API is running")` — initializes `testApp` in `BeforeScenario` hook
  - `Then("the response status code should be {int}")` — asserts status
  - `Then("the response body should contain key {string}")` — JSON key existence check
- [x] Write Cucumber integration step definitions for `health-check.feature` (2 scenarios)
      in `integration/steps/HealthSteps.kt`
- [x] Add `junit-platform.properties` pointing Cucumber at the classpath feature path and
      glue package
- [x] Verify `./gradlew test --tests '*.integration.*'` passes — 2 scenarios
- [x] Commit

---

## Phase 5: Auth — Register and Login

**Commit**: `feat(demo-be-kotlin-ktor): add register and login endpoints`

- [x] Create `auth/JwtService.kt` — JWT generation using `com.auth0:java-jwt`:
  - `generateAccessToken(userId, username, role)` — 15 min, HMAC-SHA256
  - `generateRefreshToken(userId)` — 7 days, HMAC-SHA256
  - `verifier()` — `JWTVerifier` for the configured secret
  - `decodeToken(token)` — `DecodedJWT` for claims inspection
- [x] Create `plugins/Authentication.kt` — install Ktor JWT auth plugin:
  - Validates access tokens against `JwtService.verifier()`
  - Extracts user ID, role, and jti from claims
  - Rejects blacklisted tokens (checks `TokenRepository.isRevoked(jti)`)
- [x] Create `plugins/DI.kt` — Koin module registration:
  - Production Koin module with Exposed repositories
  - `Application.configureDI()` extension function
- [x] Create `routes/AuthRoutes.kt`:
  - `POST /api/v1/auth/register` → 201 `{id, username, email, display_name}`
  - `POST /api/v1/auth/login` → 200 `{access_token, refresh_token, token_type}`
  - Validates input using domain functions; rejects weak passwords
  - Hashes password with `PasswordService`; stores via `UserRepository`
- [x] Create `plugins/StatusPages.kt` — global exception → HTTP response mapping
- [x] Write Cucumber step definitions for `registration.feature` (6) and
      `password-login.feature` (5 scenarios)
- [x] Verify 13 integration scenarios pass
- [x] Commit

---

## Phase 6: Token Lifecycle and Management

**Commit**: `feat(demo-be-kotlin-ktor): add token lifecycle and management endpoints`

- [x] Extend `routes/AuthRoutes.kt`:
  - `POST /api/v1/auth/refresh` — validates refresh token, issues new pair (rotation),
    revokes old token jti via `TokenRepository`
  - `POST /api/v1/auth/logout` — revokes current access token jti (idempotent — 200 always)
  - `POST /api/v1/auth/logout-all` — revokes all token JTIs for the authenticated user
- [x] Create `routes/TokenRoutes.kt`:
  - `GET /api/v1/tokens/claims` — decodes JWT and returns all claims as JSON
  - `GET /.well-known/jwks.json` — returns JWKS (public key for HMAC: symmetric key
    identifier only; include `kid`, `alg`, `kty` per spec)
- [x] Implement token revocation table logic in `ExposedTokenRepository`
- [x] Write Cucumber step definitions for `token-lifecycle.feature` (7) and
      `tokens.feature` (6 scenarios)
- [x] Verify 26 integration scenarios pass
- [x] Commit

---

## Phase 7: User Account and Security

**Commit**: `feat(demo-be-kotlin-ktor): add user account and security endpoints`

- [x] Create `routes/UserRoutes.kt`:
  - `GET /api/v1/users/me` — current user profile from JWT principal
  - `PATCH /api/v1/users/me` — update display name; validate length
  - `POST /api/v1/users/me/password` — change password; verify old password first
  - `POST /api/v1/users/me/deactivate` — set status to INACTIVE, revoke all tokens
- [x] Implement account lockout in `routes/AuthRoutes.kt` login handler:
  - Increment `failedLoginCount` on bad password
  - Set status to LOCKED after threshold (5 attempts)
  - Return 401 with "Account is locked" message for LOCKED accounts
  - Reset `failedLoginCount` to 0 on successful login
- [x] Write Cucumber step definitions for `user-account.feature` (6) and
      `security.feature` (5 scenarios)
- [x] Verify 37 integration scenarios pass
- [x] Commit

---

## Phase 8: Admin

**Commit**: `feat(demo-be-kotlin-ktor): add admin endpoints`

- [x] Add admin guard in `plugins/Routing.kt` — route-level check for `role == ADMIN`:
  - Extract role from `JWTPrincipal`; respond 403 if not ADMIN
- [x] Create `routes/AdminRoutes.kt`:
  - `GET /api/v1/admin/users` — paginated list with optional `email` query param filter
  - `POST /api/v1/admin/users/{id}/disable` — set status to DISABLED
  - `POST /api/v1/admin/users/{id}/enable` — set status to ACTIVE
  - `POST /api/v1/admin/users/{id}/unlock` — set status to ACTIVE, reset failedLoginCount
  - `POST /api/v1/admin/users/{id}/force-password-reset` — generate + return reset token
- [x] Write Cucumber step definitions for `admin.feature` (6 scenarios)
- [x] Verify 43 integration scenarios pass
- [x] Commit

---

## Phase 9: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-kotlin-ktor): add expense CRUD and currency handling`

- [x] Create `routes/ExpenseRoutes.kt`:
  - `POST /api/v1/expenses` — create (expense or income); validate amount + currency
  - `GET /api/v1/expenses` — list own (paginated, page + pageSize query params)
  - `GET /api/v1/expenses/{id}` — get by ID; 403 if not owner
  - `PUT /api/v1/expenses/{id}` — update amount, description; 403 if not owner
  - `DELETE /api/v1/expenses/{id}` — delete; 204; 403 if not owner
  - `GET /api/v1/expenses/summary` — group totals by currency for authenticated user
  - Note: `/summary` route must be declared before `/{id}` to avoid path shadowing
- [x] Implement currency precision in `domain/ExpenseDomain.kt`
- [x] Write Cucumber step definitions for `expense-management.feature` (7) and
      `currency-handling.feature` (6 scenarios)
- [x] Verify 56 integration scenarios pass
- [x] Commit

---

## Phase 10: Units, Reporting, and Attachments

**Commit**: `feat(demo-be-kotlin-ktor): add unit handling, reporting, and attachments`

- [x] Add `quantity` and `unit` fields to expense create/update request and response DTOs
- [x] Implement supported unit validation in `domain/ExpenseDomain.kt`:
  - Accepted units: metric (liter, kilogram, meter, etc.) + imperial (gallon, pound, foot, etc.)
  - Reject unknown units with 400
  - Allow null quantity and unit (optional field)
- [x] Create `routes/ReportRoutes.kt`:
  - `GET /api/v1/reports/pl?from=X&to=Y&currency=Z` — income total, expense total, net,
    and category-level breakdown; zero totals for empty periods
- [x] Create `routes/AttachmentRoutes.kt`:
  - `POST /api/v1/expenses/{id}/attachments` — multipart/form-data upload; validate
    content type (image/jpeg, image/png, application/pdf) and size (≤10MB); 415/413 on violation
  - `GET /api/v1/expenses/{id}/attachments` — list with metadata; 403 if not owner
  - `DELETE /api/v1/expenses/{id}/attachments/{aid}` — delete; 204; 403 if not owner; 404
    if not found
- [x] Configure Ktor multipart upload limit in `Application.kt`:
  - Set `maxFormDataSize` (or equivalent Ktor config) to avoid HTTP 413 before controller
- [x] Write Cucumber step definitions for `unit-handling.feature` (4),
      `reporting.feature` (6), and `attachments.feature` (10 scenarios)
- [x] Verify all 76 integration scenarios pass
- [x] Commit

---

## Phase 11: Coverage and Quality Gate

**Commit**: `fix(demo-be-kotlin-ktor): achieve 90% coverage and pass quality gates`

- [x] Run full test suite: `./gradlew test koverXmlReport`
- [x] Inspect Kover XML report — identify uncovered branches and lines
- [x] Add unit tests for domain validation edge cases not reached by integration tests
      (error paths, boundary conditions, null handling)
- [x] Add integration step definitions or separate unit tests for route-level error paths
      (missing fields, malformed JSON, missing `Authorization` header on protected routes)
- [x] Validate coverage: `rhino-cli test-coverage validate
apps/demo-be-kotlin-ktor/build/reports/kover/report.xml 90` passes (91.27% >= 90%)
- [x] Verify `./gradlew ktfmtCheck` passes (no formatting violations)
- [x] Verify `./gradlew detekt` passes (no lint violations)
- [x] `nx run demo-be-kotlin-ktor:test:quick` passes (all quality gates green)

---

## Phase 12: Infra — Docker Compose

**Commit**: `feat(infra): add demo-be-kotlin-ktor docker-compose dev environment`

- [x] Create `infra/dev/demo-be-kotlin-ktor/Dockerfile.be.dev` (eclipse-temurin JDK 21 Alpine)
- [x] Create `infra/dev/demo-be-kotlin-ktor/docker-compose.yml` with PostgreSQL 17 + Ktor app on
      port 8201
- [x] Create `infra/dev/demo-be-kotlin-ktor/docker-compose.e2e.yml` (E2E overrides)
- [x] Create `infra/dev/demo-be-kotlin-ktor/README.md` with startup instructions and env var
      reference
- [x] Manual test: `docker compose up --build` → `GET http://localhost:8201/health` returns
      `{"status": "UP"}`
- [x] Commit

---

## Phase 13: GitHub Actions — E2E Workflow

**Commit**: `ci: add e2e-demo-be-kotlin-ktor GitHub Actions workflow`

- [x] Create `.github/workflows/e2e-demo-be-kotlin-ktor.yml`:
  - Trigger: schedule (same crons as jasb/exph/fsgi) + `workflow_dispatch`
  - Job: checkout → `docker compose -f infra/dev/demo-be-kotlin-ktor/docker-compose.e2e.yml up -d
--build` → wait-on health (`http://localhost:8201/health`) → Volta → `npm ci` →
    `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` → upload artifact
    `playwright-report-be-ktkt` → docker down (always)
- [x] Trigger `workflow_dispatch` manually; verify green

---

## Phase 14: CI — main-ci.yml Update

**Commit**: `ci: add demo-be-kotlin-ktor coverage upload to main-ci`

- [x] Add Kover XML upload step to `main-ci.yml` after existing coverage steps:

  ```yaml
  - name: Upload coverage — demo-be-kotlin-ktor
    uses: codecov/codecov-action@v5
    with:
      token: ${{ secrets.CODECOV_TOKEN }}
      files: apps/demo-be-kotlin-ktor/build/reports/kover/report.xml
      flags: demo-be-kotlin-ktor
      fail_ci_if_error: false
  ```

- [x] Verify JDK setup step already covers JDK 21 (it does — reuse existing setup)
- [x] Push to `main`; verify `Main CI` workflow passes

---

## Phase 15: Documentation Updates

**Commit**: `docs: add demo-be-kotlin-ktor to project documentation`

- [x] Update `CLAUDE.md`:
  - Add `demo-be-kotlin-ktor` to Current Apps list with description
  - Add Kotlin/Kover coverage info to coverage section
  - Add `demo-be-kotlin-ktor` to `test:integration` caching note
- [x] Update `README.md`:
  - Add demo-be-kotlin-ktor badge in demo apps section
  - Add coverage badge row
  - Add to monorepo architecture listing
- [x] Update `specs/apps/demo/be/README.md`:
  - Add Kotlin/Ktor row to Implementations table
- [x] Update `apps/demo-be-e2e/project.json`:
  - Add `demo-be-kotlin-ktor` to `implicitDependencies`
- [x] Update `governance/development/infra/nx-targets.md`:
  - Add `platform:ktor` to tag vocabulary table
  - Update Kotlin/JVM row if present, or add new row
- [x] Commit

---

## Phase 16: Final Validation

- [x] `nx run demo-be-kotlin-ktor:test:quick` passes (unit + integration tests, ≥90% coverage,
      detekt clean, ktfmt clean)
- [x] `nx run demo-be-kotlin-ktor:test:unit` passes
- [x] `nx run demo-be-kotlin-ktor:test:integration` passes — all 76 scenarios
- [x] `nx run demo-be-kotlin-ktor:lint` passes
- [x] `nx run demo-be-kotlin-ktor:build` produces `build/libs/demo-be-kotlin-ktor-all.jar`
- [x] Docker Compose stack starts and health check passes (requires manual verification)
- [x] `e2e-demo-be-kotlin-ktor.yml` workflow green (requires CI push)
- [x] `main-ci.yml` workflow green (requires CI push)
- [x] All documentation updated
- [x] Move plan folder from `plans/in-progress/` to `plans/done/`

---

## Git Workflow

**Branch**: `main` (Trunk Based Development)

All commits go directly to `main`. No feature branch is needed — the project is a new app
addition with no conflicts to existing functionality.
