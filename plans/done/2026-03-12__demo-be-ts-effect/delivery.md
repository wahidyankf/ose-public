# Delivery Checklist: demo-be-ts-effect

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [ ] Verify Node.js version matches workspace Volta pin (`node --version`)
- [ ] Verify `npm` available (`npm --version`)
- [ ] Verify `tsx` available globally or confirm it will be invoked via `npx tsx`
- [ ] Verify `vite` available or confirm it will be invoked via `npx vite`
- [ ] Verify `vitest` available or confirm it will be invoked via `npx vitest`
- [ ] Verify `cucumber-js` available or confirm it will be invoked via `npx cucumber-js`
- [ ] Verify `oxlint` available or confirm it will be invoked via `npx oxlint`
- [ ] Verify `rhino-cli test-coverage validate` supports LCOV (it does — already used by
      `organiclever-fe`, `demo-be-python-fastapi`, and `demo-be-rust-axum`)
- [ ] Confirm `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [ ] Confirm Cucumber.js is compatible with the current Gherkin syntax in
      `specs/apps/demo/be/gherkin/` (Given/When/Then with doc string and data table parameters)
- [ ] Review `@effect/platform` Node.js HTTP server API for current stable version

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-ts-effect): scaffold TypeScript/Effect project`

- [ ] Create `apps/demo-be-ts-effect/` directory structure per tech-docs.md
- [ ] Create `package.json` with all runtime and dev dependencies per tech-docs.md
- [ ] Run `npm install` to generate `package-lock.json`
- [ ] Create `tsconfig.json` with strict TypeScript config per tech-docs.md
- [ ] Create `vite.config.ts` with library mode build config per tech-docs.md
- [ ] Create `vitest.config.ts` with v8 coverage config per tech-docs.md
- [ ] Create `.cucumber.js` pointing to `specs/apps/demo/be/gherkin/**/*.feature`
- [ ] Create `oxlint.json` with TypeScript-appropriate rules
- [ ] Create `src/main.ts` — entry point that starts the Effect HTTP server on port 8201
- [ ] Create `src/app.ts` — minimal Effect `Layer` composition (no routes yet)
- [ ] Create `src/config.ts` — Effect `Config` layer reading `DATABASE_URL` and
      `APP_JWT_SECRET` from environment
- [ ] Create `project.json` with all Nx targets from tech-docs.md
- [ ] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [ ] Verify `npx tsx src/main.ts` starts without error
- [ ] Verify `npx tsc --noEmit` passes (zero type errors)
- [ ] Verify `npx oxlint .` passes (zero violations)
- [ ] Verify `npx prettier --check .` passes (zero formatting violations)
- [ ] Commit

---

## Phase 2: Domain Types and Database Layer

**Commit**: `feat(demo-be-ts-effect): add domain types and Effect SQL database layer`

- [ ] Create `src/domain/types.ts` — branded types using Effect `Brand`:
      `Currency` (USD, IDR), `Role` (USER, ADMIN), `UserStatus` (ACTIVE, INACTIVE, DISABLED, LOCKED)
- [ ] Create `src/domain/errors.ts` — tagged error union using `Data.TaggedError`:
      `ValidationError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`,
      `FileTooLargeError`, `UnsupportedMediaTypeError`
- [ ] Create `src/domain/user.ts` — `User` type with validation functions:
      `validatePasswordStrength`, `validateEmailFormat`, `validateUsername`
- [ ] Create `src/domain/expense.ts` — `Expense` type with `validateAmount(currency, amount)`
      enforcing decimal precision per currency (USD: 2dp, IDR: 0dp)
- [ ] Create `src/domain/attachment.ts` — `Attachment` type
- [ ] Create `src/infrastructure/db/schema.ts` — `@effect/sql` table definitions:
      `users`, `expenses`, `attachments`, `revoked_tokens`
- [ ] Create `src/infrastructure/db/user-repo.ts` — `UserRepository` Effect service with
      `create`, `findByUsername`, `findById`, `updateStatus`, `updateDisplayName`, `updatePassword`
- [ ] Create `src/infrastructure/db/expense-repo.ts` — `ExpenseRepository` Effect service
- [ ] Create `src/infrastructure/db/attachment-repo.ts` — `AttachmentRepository` Effect service
- [ ] Create `src/infrastructure/db/token-repo.ts` — `RevokedTokenRepository` Effect service
- [ ] Create `src/infrastructure/password.ts` — `PasswordService` Effect service wrapping
      `bcrypt.hash` and `bcrypt.compare`
- [ ] Write unit tests in `tests/unit/`:
  - `domain.user.test.ts`: password strength (min 12 chars, uppercase, special char),
    email format, username validation (pure function tests)
  - `domain.expense.test.ts`: USD 2dp enforcement, IDR 0dp enforcement, unsupported currency,
    negative amount rejection
  - `domain.password.test.ts`: hash/verify roundtrip, wrong password returns false
- [ ] Verify `npx vitest run tests/unit` passes
- [ ] Verify `npx tsc --noEmit` still passes
- [ ] Commit

---

## Phase 3: Health Endpoint

**Commit**: `feat(demo-be-ts-effect): add /health endpoint`

- [ ] Create `src/routes/health.ts` — `GET /health` returning `{"status": "UP"}` (public, no auth)
- [ ] Register health router in `src/app.ts`
- [ ] Add global error handler middleware in `src/app.ts` mapping `DomainError` tagged variants
      to HTTP responses (`ValidationError` → 400, `UnauthorizedError` → 401, `ForbiddenError` → 403,
      `NotFoundError` → 404, `ConflictError` → 409, `FileTooLargeError` → 413,
      `UnsupportedMediaTypeError` → 415)
- [ ] Create `tests/integration/world.ts` — `CustomWorld` class with:
  - `client`: HTTP client pointing to in-process server
  - `response`: last HTTP response
  - `tokens`: map of named tokens for step sharing
  - `userIds`: map of named user IDs
- [ ] Create `tests/integration/hooks.ts` — Cucumber.js `BeforeAll`/`AfterAll` hooks that
      start/stop the Effect HTTP server with SQLite in-memory database layer
- [ ] Create `tests/integration/steps/common.steps.ts` — shared steps:
      `"the API is running"`, `"the response status code should be {int}"`
- [ ] Create `tests/integration/steps/health.steps.ts` consuming `health-check.feature`
      (2 scenarios)
- [ ] Verify `npx cucumber-js` passes — 2 scenarios
- [ ] Commit

---

## Phase 4: Auth — Register and Login

**Commit**: `feat(demo-be-ts-effect): add register and login endpoints`

- [ ] Create `src/auth/jwt.ts` — `JwtService` Effect service:
  - `signAccess(userId, username, role) → Effect<string, never>`
  - `signRefresh(userId) → Effect<string, never>`
  - `verify(token) → Effect<JwtClaims, UnauthorizedError>`
- [ ] Create `src/auth/middleware.ts`:
  - `requireAuth` — middleware that extracts and verifies JWT from `Authorization` header,
    fails with `UnauthorizedError` if token missing, invalid, or revoked
  - `requireAdmin` — middleware composing `requireAuth` + admin role check,
    fails with `ForbiddenError` if not admin
- [ ] Create `src/routes/auth.ts`:
  - `POST /api/v1/auth/register` → 201 `{id, username, email, displayName}`
    (validates password strength; returns 409 on duplicate username)
  - `POST /api/v1/auth/login` → 200 `{accessToken, refreshToken, tokenType: "Bearer"}`
    (returns 401 on wrong password, 401 on INACTIVE status, 423 on LOCKED)
- [ ] Register auth router in `src/app.ts` with prefix `/api/v1/auth`
- [ ] Write integration steps in `tests/integration/steps/auth.steps.ts` consuming
      `registration.feature` (6 scenarios) and `password-login.feature` (5 scenarios)
- [ ] Verify `npx cucumber-js` passes — 13 scenarios
- [ ] Verify `npx tsc --noEmit` passes
- [ ] Commit

---

## Phase 5: Token Lifecycle and Management

**Commit**: `feat(demo-be-ts-effect): add token lifecycle and management endpoints`

- [ ] Extend `src/infrastructure/db/token-repo.ts` `RevokedTokenRepository`:
  - `revoke(jti: string) → Effect<void, never>` — idempotent
  - `isRevoked(jti: string) → Effect<boolean, never>`
  - `revokeAllForUser(userId: string) → Effect<void, never>`
- [ ] Extend `src/routes/auth.ts`:
  - `POST /api/v1/auth/refresh` — verify refresh token, check user status first (before
    revocation check), issue new pair, revoke old refresh jti (rotation); returns 401 if user
    inactive
  - `POST /api/v1/auth/logout` — revoke current access token jti (idempotent: 200 even if
    already revoked); public route (accepts token in Authorization header)
  - `POST /api/v1/auth/logout-all` — protected by `requireAuth`; revokes all tokens for user
- [ ] Create `src/routes/tokens.ts`:
  - `GET /api/v1/tokens/claims` — decode and return JWT claims (protected by `requireAuth`)
  - `GET /.well-known/jwks.json` — return JWKS public key info (public)
- [ ] Register tokens router in `src/app.ts`
- [ ] Write integration steps in `tests/integration/steps/token-lifecycle.steps.ts`
      consuming `token-lifecycle.feature` (7 scenarios) and
      `tests/integration/steps/token-management.steps.ts` consuming `tokens.feature` (6 scenarios)
- [ ] Verify `npx cucumber-js` passes — 26 scenarios
- [ ] Commit

---

## Phase 6: User Account and Security

**Commit**: `feat(demo-be-ts-effect): add user account and security endpoints`

- [ ] Create `src/routes/users.ts`:
  - `GET /api/v1/users/me` — return `{id, username, email, displayName, status}` (protected)
  - `PATCH /api/v1/users/me` — update `displayName` field (protected)
  - `POST /api/v1/users/me/password` — verify old password, hash new, update (protected);
    returns 400 on incorrect old password
  - `POST /api/v1/users/me/deactivate` — set status to INACTIVE, revoke all tokens (protected)
- [ ] Register users router in `src/app.ts` with prefix `/api/v1/users`
- [ ] Implement account lockout in login logic:
  - Track `failedLoginAttempts` counter on users table
  - After configurable threshold (default: 5), set status to LOCKED
  - Reset counter on successful login
- [ ] Write integration steps in `tests/integration/steps/user-account.steps.ts`
      consuming `user-account.feature` (6 scenarios) and
      `tests/integration/steps/security.steps.ts` consuming `security.feature` (5 scenarios)
- [ ] Verify `npx cucumber-js` passes — 37 scenarios
- [ ] Verify `npx tsc --noEmit` passes
- [ ] Commit

---

## Phase 7: Admin

**Commit**: `feat(demo-be-ts-effect): add admin endpoints`

- [ ] Create `src/routes/admin.ts`:
  - `GET /api/v1/admin/users` — paginated list with optional `email` query filter
    (protected + admin role); returns `{items: [...], total, page, size}`
  - `POST /api/v1/admin/users/:id/disable` — set status to DISABLED (admin only)
  - `POST /api/v1/admin/users/:id/enable` — set status to ACTIVE (admin only)
  - `POST /api/v1/admin/users/:id/unlock` — set status to ACTIVE, reset failed attempts
    (admin only)
  - `POST /api/v1/admin/users/:id/force-password-reset` — generate and return one-time
    reset token (admin only)
- [ ] Register admin router in `src/app.ts` with prefix `/api/v1/admin`
- [ ] Apply `requireAdmin` middleware to all admin router endpoints
- [ ] Write integration steps in `tests/integration/steps/admin.steps.ts`
      consuming `admin.feature` (6 scenarios)
- [ ] Verify `npx cucumber-js` passes — 43 scenarios
- [ ] Commit

---

## Phase 8: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-ts-effect): add expense CRUD and currency handling`

- [ ] Create `src/routes/expenses.ts`:
  - `POST /api/v1/expenses` — create expense or income (protected); validates currency and
    amount precision; returns 201 with `{id, ...}`
  - `GET /api/v1/expenses` — list own (paginated, protected)
  - `GET /api/v1/expenses/summary` — grouped totals by currency (protected)
  - `GET /api/v1/expenses/:id` — get by ID (protected, 403 if not owner)
  - `PUT /api/v1/expenses/:id` — update (protected, 403 if not owner)
  - `DELETE /api/v1/expenses/:id` — delete, returns 204 (protected, 403 if not owner)
- [ ] Route ordering: `/api/v1/expenses/summary` registered BEFORE `/api/v1/expenses/:id`
- [ ] Register expenses router in `src/app.ts` with prefix `/api/v1/expenses`
- [ ] Write integration steps in `tests/integration/steps/expense.steps.ts`
      consuming `expense-management.feature` (7 scenarios) and
      `tests/integration/steps/currency.steps.ts` consuming `currency-handling.feature`
      (6 scenarios)
- [ ] Verify `npx cucumber-js` passes — 56 scenarios
- [ ] Commit

---

## Phase 9: Expenses — Units, Reporting, Attachments

**Commit**: `feat(demo-be-ts-effect): add unit handling, reporting, and attachments`

- [ ] Extend expenses table schema with `quantity` (nullable string) and `unit` (nullable string)
- [ ] Implement unit-of-measure validation — supported: SI units (liter, kilogram, meter) and
      imperial equivalents (gallon, pound, foot, mile, ounce); unsupported returns 400
- [ ] Create `src/routes/reports.ts`:
  - `GET /api/v1/reports/pl` — P&L report with `from`, `to` (ISO date), and `currency`
    query params (protected); returns `{incomeTotal, expenseTotal, net, breakdown}`
- [ ] Create `src/routes/attachments.ts`:
  - `POST /api/v1/expenses/:id/attachments` — upload file via multipart/form-data
    (protected); validates content type (image/jpeg, image/png, application/pdf) → 415;
    validates size ≤ 10MB → 413; returns 201 with metadata
  - `GET /api/v1/expenses/:id/attachments` — list attachments (protected, 403 if not owner)
  - `DELETE /api/v1/expenses/:id/attachments/:aid` — delete (protected, 403 if not owner,
    404 if not found)
- [ ] Register reports and attachments routers in `src/app.ts`
- [ ] Write integration steps in:
  - `tests/integration/steps/unit-handling.steps.ts` consuming `unit-handling.feature`
    (4 scenarios)
  - `tests/integration/steps/reporting.steps.ts` consuming `reporting.feature` (6 scenarios)
  - `tests/integration/steps/attachment.steps.ts` consuming `attachments.feature`
    (10 scenarios)
- [ ] Verify `npx cucumber-js` passes — all 76 scenarios
- [ ] Commit

---

## Phase 10: Coverage and Quality Gate

**Commit**: `fix(demo-be-ts-effect): achieve 90% coverage and pass quality gates`

- [ ] Run full unit test suite with coverage: `npx vitest run --coverage`
- [ ] Validate: `apps/rhino-cli/rhino-cli test-coverage validate apps/demo-be-ts-effect/coverage/lcov.info 90`
      passes — ≥90%
- [ ] Verify `npx tsc --noEmit` passes (zero type errors)
- [ ] Verify `npx oxlint .` passes (zero lint violations)
- [ ] Verify `npx prettier --check .` passes (zero formatting changes)
- [ ] `nx run demo-be-ts-effect:test:quick` passes all gates
- [ ] Commit

---

## Phase 11: Infra — Docker Compose

**Commit**: `feat(infra): add demo-be-ts-effect docker-compose dev environment`

- [ ] Create `infra/dev/demo-be-ts-effect/Dockerfile.be.dev` (node:24-alpine + npm ci)
- [ ] Create `infra/dev/demo-be-ts-effect/docker-compose.yml` with PostgreSQL 17 + app per
      tech-docs.md
- [ ] Create `infra/dev/demo-be-ts-effect/docker-compose.e2e.yml` (E2E overrides: detach mode,
      wait-for-healthy)
- [ ] Create `infra/dev/demo-be-ts-effect/README.md` with startup instructions
- [ ] Manual test: `docker compose up --build` → `curl http://localhost:8201/health`
      returns `{"status":"UP"}`

---

## Phase 12: CI — GitHub Actions

**Commit**: `ci: add demo-be-ts-effect E2E workflow and coverage upload`

- [ ] Create `.github/workflows/e2e-demo-be-ts-effect.yml` per tech-docs.md:
  - Job: checkout → docker compose up (`infra/dev/demo-be-ts-effect/docker-compose.e2e.yml`) →
    wait-for-healthy → Volta → npm ci → `nx run demo-be-e2e:test:e2e` with
    `BASE_URL=http://localhost:8201` → upload artifact `playwright-report-be-tsex` →
    docker down (always)
- [ ] Update `.github/workflows/main-ci.yml` — add coverage upload step for demo-be-ts-effect
      LCOV per tech-docs.md

---

## Phase 13: Monorepo Integration

**Commit**: `feat(demo-be-ts-effect): integrate into monorepo and update documentation`

- [ ] Update `apps/demo-be-e2e/project.json` — add `demo-be-ts-effect` to `implicitDependencies`
- [ ] Update `specs/apps/demo/be/README.md` — add TypeScript/Effect row to Implementations
      table: `| demo-be-ts-effect | TypeScript (Effect) | Cucumber.js + Effect HTTP client | Playwright |`
- [ ] Update `CLAUDE.md`:
  - Add `demo-be-ts-effect` to Current Apps list under demo backend variants
  - Add TypeScript/Effect coverage note: vitest v8 → LCOV → `rhino-cli test-coverage validate`
- [ ] Update root `README.md` — add `demo-be-ts-effect` badge and description in demo apps section
- [ ] Verify `nx run demo-be-ts-effect:test:quick` passes
- [ ] Verify `nx run demo-be-ts-effect:test:integration` passes with cache enabled
- [ ] Commit

---

## Acceptance Criteria

```gherkin
Scenario: demo-be-ts-effect implementation complete
  Given all 13 phases of the delivery checklist are complete
  When running nx run demo-be-ts-effect:test:quick
  Then all 76 Gherkin scenarios pass in integration tests
  And coverage is ≥ 90% as validated by rhino-cli
  And tsc --noEmit passes with zero errors
  And oxlint passes with zero violations
  And the Docker stack starts and responds at port 8201

Scenario: demo-be-ts-effect integrated into monorepo
  Given demo-be-ts-effect passes all quality gates
  When running nx affected -t test:quick
  Then demo-be-ts-effect appears in affected projects
  And demo-be-e2e lists demo-be-ts-effect as an implicit dependency
  And specs/apps/demo/be/README.md lists demo-be-ts-effect in the Implementations table

Scenario: demo-be-ts-effect E2E tests pass
  Given the Docker Compose stack is running at port 8201
  When running nx run demo-be-e2e:test:e2e with BASE_URL=http://localhost:8201
  Then all 76 Gherkin scenarios pass
  And the GitHub Actions E2E workflow completes without failure
```
