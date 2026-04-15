# Delivery Checklist: a-demo-be-golang-gin

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [x] Verify Go 1.24+ available locally (`go version`)
- [x] Verify `golangci-lint` installed (`golangci-lint --version`)
- [x] Verify `rhino-cli test-coverage validate` supports Go coverprofile format (it does — already
      used by `rhino-cli`, `ayokoding-cli`, `oseplatform-cli`, `golang-commons`, `hugo-commons`)
- [x] Verify `a-demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [x] Verify Godog is compatible with the Gherkin feature files in
      `specs/apps/a-demo/be/gherkin/` (Godog v0.15+ supports all used syntax)
- [x] Confirm SQLite CGO is available for integration test builds (requires `gcc` in PATH)

---

## Phase 1: Project Scaffold

**Commit**: `feat(a-demo-be-golang-gin): scaffold Go/Gin project`

- [x] Create `apps/a-demo-be-golang-gin/` directory structure per tech-docs.md
- [x] Create `go.mod` with module path
      `github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin` and Go 1.24
- [x] Run `go get` to add all direct dependencies from tech-docs.md Dependencies Summary
- [x] Create minimal `cmd/server/main.go` calling `server.Run()`
- [x] Create `internal/server/server.go` with `Run()` function reading `PORT` env var
- [x] Create `internal/config/config.go` loading env vars (`PORT`, `APP_JWT_SECRET`,
      `DATABASE_URL`)
- [x] Create `internal/router/router.go` with empty Gin engine (health route only)
- [x] Create `project.json` with all Nx targets from tech-docs.md
- [x] Create `.golangci.yml` via root-level config (inherits platform-wide linter config)
- [x] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [x] Verify `CGO_ENABLED=0 go build ./cmd/server` compiles with zero errors
- [x] Verify `gofmt -l .` returns no files (all files already formatted)
- [x] Verify `golangci-lint run ./...` passes (no violations on scaffold)

---

## Phase 2: Domain Types and Database

**Commit**: `feat(a-demo-be-golang-gin): add domain types and GORM store`

- [x] Create `internal/domain/errors.go` — `DomainError` struct, `DomainErrorCode` constants,
      sentinel `Error()` method
- [x] Create `internal/domain/user.go` — `User` struct (GORM model), `Role`, `UserStatus`
      constants, `validateEmail`, `validateUsername`, `validatePasswordStrength` functions
- [x] Create `internal/domain/expense.go` — `Expense` struct, `Currency`, `EntryType`
      constants, `validateAmount`, `validateCurrency`, `validateUnit` functions
- [x] Create `internal/domain/attachment.go` — `Attachment` struct, allowed MIME types constant
- [x] Create `internal/store/store.go` — `Store` interface per tech-docs.md
- [x] Create `internal/store/gorm_store.go` — GORM implementation (`GORMStore` struct)
      implementing `Store` with PostgreSQL
- [x] Create `internal/store/memory_store.go` — `MemoryStore` struct with `sync.RWMutex`
      implementing `Store` for integration tests
- [x] Write unit tests in `internal/domain/user_test.go` — cover `validateEmail`,
      `validateUsername`, `validatePasswordStrength` (all validation branches)
- [x] Write unit tests in `internal/domain/expense_test.go` — cover `validateAmount`,
      `validateCurrency`, `validateUnit` for USD, IDR, unsupported, negative, malformed
- [x] Write unit tests in `internal/domain/attachment_test.go` — cover allowed/disallowed
      MIME types and file size limit
- [x] Verify `CGO_ENABLED=0 go test ./internal/domain/... -count=1` passes
- [x] Verify `golangci-lint run ./...` passes

---

## Phase 3: Health Endpoint

**Commit**: `feat(a-demo-be-golang-gin): add /health endpoint`

- [x] Create `internal/handler/health.go` — `Health` handler returning
      `{"status": "UP"}` with HTTP 200
- [x] Create `internal/handler/response.go` — `RespondError` helper per tech-docs.md error
      handling pattern
- [x] Wire `GET /health` route in `internal/router/router.go`
- [x] Create `internal/integration/context.go` with `ScenarioCtx` struct and `newTestRouter()`
      function using `MemoryStore` and `httptest.NewRecorder`
- [x] Create `internal/integration/suite_test.go` with `TestIntegration` Godog suite entry
      point (build tag `//go:build integration`)
- [x] Create `internal/integration/health_steps_test.go` with step definitions for
      `health-check.feature` (2 scenarios)
- [x] Verify `CGO_ENABLED=1 go test -tags=integration -run TestIntegration ./... -count=1`
      passes — 2 scenarios
- [x] Verify `CGO_ENABLED=0 go build ./cmd/server` still compiles (SQLite import excluded)

---

## Phase 4: Auth — Register and Login

**Commit**: `feat(a-demo-be-golang-gin): add register and login endpoints`

- [x] Create `internal/auth/jwt.go` — `JWTService` struct with `GenerateAccessToken`,
      `GenerateRefreshToken`, `ValidateToken`, `ExtractClaims` methods using golang-jwt/v5
- [x] Create `internal/auth/middleware.go` — `JWTMiddleware` Gin middleware that extracts
      Bearer token, validates it, checks blacklist, and sets user claims in Gin context
- [x] Create `internal/handler/auth.go`:
  - `Register` handler: `POST /api/v1/auth/register` → 201 `{id, username, email, display_name}`
  - `Login` handler: `POST /api/v1/auth/login` → 200 `{access_token, refresh_token, token_type}`
- [x] Wire auth routes in router (public scope)
- [x] Create `internal/integration/auth_steps_test.go` with step definitions for
      `registration.feature` (6 scenarios) and `password-login.feature` (5 scenarios)
- [x] Verify 13 integration scenarios pass (2 health + 11 auth)

---

## Phase 5: Token Lifecycle and Management

**Commit**: `feat(a-demo-be-golang-gin): add token lifecycle and management endpoints`

- [x] Add `Refresh` handler to `internal/handler/auth.go`:
      `POST /api/v1/auth/refresh` — validates refresh token, rotates (issues new pair,
      revokes old), returns new `{access_token, refresh_token, token_type}`
- [x] Add `Logout` handler: `POST /api/v1/auth/logout` — revokes current refresh token
      and blacklists access token JTI; idempotent (returns 200 even if already revoked)
- [x] Add `LogoutAll` handler (JWT-protected): `POST /api/v1/auth/logout-all` — revokes all
      refresh tokens for the authenticated user
- [x] Create `internal/handler/token.go`:
  - `TokenClaims` handler: `GET /api/v1/tokens/claims` — returns decoded JWT claims as JSON
  - `JWKS` handler: `GET /.well-known/jwks.json` — returns JWKS representation
- [x] Wire token lifecycle routes in router
- [x] Create `internal/integration/token_lifecycle_steps_test.go` for
      `token-lifecycle.feature` (7 scenarios)
- [x] Create `internal/integration/token_management_steps_test.go` for
      `tokens.feature` (6 scenarios)
- [x] Verify 26 integration scenarios pass

---

## Phase 6: User Account and Security

**Commit**: `feat(a-demo-be-golang-gin): add user account and security endpoints`

- [x] Create `internal/handler/user.go`:
  - `GetProfile` handler: `GET /api/v1/users/me` — returns authenticated user profile
  - `UpdateProfile` handler: `PATCH /api/v1/users/me` — updates display name
  - `ChangePassword` handler: `POST /api/v1/users/me/password` — validates old password,
    sets new password hash
  - `Deactivate` handler: `POST /api/v1/users/me/deactivate` — sets user status to INACTIVE,
    revokes all tokens
- [x] Implement account lockout in `Login` handler: increment `FailedAttempts` on wrong
      password; set status to LOCKED when threshold exceeded; reset on successful login
- [x] Wire user routes in router (JWT-protected group)
- [x] Create `internal/integration/user_account_steps_test.go` for
      `user-account.feature` (6 scenarios)
- [x] Create `internal/integration/security_steps_test.go` for
      `security.feature` (5 scenarios)
- [x] Verify 37 integration scenarios pass

---

## Phase 7: Admin

**Commit**: `feat(a-demo-be-golang-gin): add admin endpoints`

- [x] Create `internal/auth/admin_middleware.go` — Gin middleware that checks `role == "ADMIN"`
      from the JWT context set by `JWTMiddleware`; returns 403 if not admin
- [x] Create `internal/handler/admin.go`:
  - `ListUsers` handler: `GET /api/v1/admin/users` — paginated list with optional email
    filter query param; returns `{users, total, page, size}`
  - `DisableUser` handler: `POST /api/v1/admin/users/:id/disable` — sets status to DISABLED,
    revokes all tokens
  - `EnableUser` handler: `POST /api/v1/admin/users/:id/enable` — sets status back to ACTIVE
  - `UnlockUser` handler: `POST /api/v1/admin/users/:id/unlock` — clears lockout
    (`FailedAttempts = 0`, status back to ACTIVE)
  - `ForcePasswordReset` handler: `POST /api/v1/admin/users/:id/force-password-reset` —
    generates and returns a reset token
- [x] Wire admin routes in router (JWT + admin middleware)
- [x] Create `internal/integration/admin_steps_test.go` for `admin.feature` (6 scenarios)
- [x] Verify 43 integration scenarios pass

---

## Phase 8: Expenses — CRUD and Currency

**Commit**: `feat(a-demo-be-golang-gin): add expense CRUD and currency handling`

- [x] Create `internal/handler/expense.go`:
  - `CreateExpense` handler: `POST /api/v1/expenses` — validates amount+currency+unit, returns
    201 with created expense
  - `ListExpenses` handler: `GET /api/v1/expenses` — returns paginated list for authenticated
    user; returns only own expenses
  - `GetExpense` handler: `GET /api/v1/expenses/:id` — returns expense by ID; 403 if not owner
  - `UpdateExpense` handler: `PUT /api/v1/expenses/:id` — updates amount, description, category,
    date; validates currency precision again
  - `DeleteExpense` handler: `DELETE /api/v1/expenses/:id` — returns 204; 403 if not owner
  - `ExpenseSummary` handler: `GET /api/v1/expenses/summary` — groups totals by currency
- [x] Implement currency precision validation in `validateAmount` (USD: 2dp, IDR: 0dp)
- [x] Create `internal/integration/expense_steps_test.go` for
      `expense-management.feature` (7 scenarios)
- [x] Create `internal/integration/currency_steps_test.go` for
      `currency-handling.feature` (6 scenarios)
- [x] Verify 56 integration scenarios pass

---

## Phase 9: Expenses — Units, Reporting, Attachments

**Commit**: `feat(a-demo-be-golang-gin): add unit handling, reporting, and attachments`

- [x] Add `Quantity` and `Unit` fields to `Expense` struct; implement `validateUnit`
      (supported: metric — liter, kg, etc.; imperial — gallon, lb, etc.; empty is allowed)
- [x] Create `internal/handler/report.go`:
  - `PLReport` handler: `GET /api/v1/reports/pl` — accepts `from`, `to` (ISO date), `currency`
    query params; returns `{income_total, expense_total, net, breakdown_by_category}`
- [x] Create `internal/handler/attachment.go`:
  - `UploadAttachment` handler: `POST /api/v1/expenses/:id/attachments` — accepts multipart form
    upload; validates MIME type (JPEG, PNG, PDF only → 415 on other); validates size ≤ 10MB
    (→ 413); stores metadata in `attachments` table; returns 201 with attachment metadata
  - `ListAttachments` handler: `GET /api/v1/expenses/:id/attachments` — returns list; 403 if
    not owner of the expense
  - `DeleteAttachment` handler: `DELETE /api/v1/expenses/:id/attachments/:aid` — returns 204;
    403 if not owner; 404 if not found
- [x] Create `internal/integration/unit_handling_steps_test.go` for
      `unit-handling.feature` (4 scenarios)
- [x] Create `internal/integration/reporting_steps_test.go` for `reporting.feature` (6 scenarios)
- [x] Create `internal/integration/attachment_steps_test.go` for
      `attachments.feature` (10 scenarios)
- [x] Verify all 76 integration scenarios pass

---

## Phase 10: Coverage and Quality Gate

**Commit**: `fix(a-demo-be-golang-gin): achieve 90% coverage and pass quality gates`

- [x] Run full test suite: `CGO_ENABLED=0 go test -coverprofile=cover.out ./... -count=1`
- [x] Validate: `rhino-cli test-coverage validate apps/a-demo-be-golang-gin/cover_unit.out 90` — passes
      at 95.09% (filtering gorm_store, internal/server, cmd/server from cover.out)
- [x] Identify uncovered lines; add targeted unit tests for domain validation branches not yet
      covered (error paths, edge cases for currency/unit/password/email validation)
- [x] Add unit tests for handler response mapping (`RespondError` for each `DomainErrorCode`)
- [x] Verify `gofmt -l .` returns no files (pre-commit would catch this, but verify manually)
- [x] Verify `golangci-lint run ./...` passes with zero violations - Fixed `errcheck` violations (unchecked error returns) - Fixed `exhaustive` violations (non-exhaustive switch statements) - Fixed `staticcheck` violations (SA/S/ST checks including ST1000 package comments) - Fixed `forcetypeassert` violations (safe type assertions with ok check) - Fixed `unparam` violations (constant parameters removed from test helpers)
- [x] Verify `CGO_ENABLED=0 go build ./cmd/server` produces clean binary
- [x] Added `//go:build integration` tag to `gorm_store_test.go` to prevent CGO build failures
      when running with `CGO_ENABLED=0`

**gofmt constraint**: The pre-commit hook runs `gofmt -w` on staged Go files. Inline
`if err != nil { return err }` patterns are reformatted to multi-line by gofmt. Use
multi-line error checks from the start to avoid pre-commit reformat surprises:

```go
// Correct — gofmt-stable
if err != nil {
    return err
}

// Will be reformatted by gofmt — avoid
if err != nil { return err }
```

---

## Phase 11: Infra — Docker Compose

**Commit**: `feat(infra): add a-demo-be-golang-gin docker-compose dev environment`

- [x] Create `infra/dev/a-demo-be-golang-gin/Dockerfile.be.dev` (golang:1.24-alpine + apk gcc)
- [x] Create `infra/dev/a-demo-be-golang-gin/docker-compose.yml` with PostgreSQL 17 + app
      per tech-docs.md Infrastructure section
- [x] Create `infra/dev/a-demo-be-golang-gin/docker-compose.e2e.yml` (E2E overrides — removes
      volume mount and uses built binary for speed)
- [x] Create `infra/dev/a-demo-be-golang-gin/README.md` with startup instructions and env vars
- [x] Manual test: `docker compose up --build` → `GET http://localhost:8201/health` returns
      `{"status": "UP"}`

---

## Phase 12: GitHub Actions — E2E Workflow

**Commit**: `ci: add e2e-a-demo-be-golang-gin GitHub Actions workflow`

- [x] Create `.github/workflows/e2e-a-demo-be-golang-gin.yml`:
  - Trigger: `schedule` (cron `0 23 * * *` and `0 11 * * *`) + `workflow_dispatch`
  - `permissions: contents: read`
  - Job `e2e-be`:
    - `actions/checkout@v4`
    - Start backend: `docker compose -f infra/dev/a-demo-be-golang-gin/docker-compose.yml -f infra/dev/a-demo-be-golang-gin/docker-compose.e2e.yml up --build -d a-demo-be-golang-gin`
    - Wait for healthy: poll `docker inspect` health status (36 × 10s = 6 min timeout)
    - `volta-cli/action@v4`
    - `npm ci`
    - `npx nx run a-demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201`
    - Upload artifact `playwright-report-a-demo-be-golang-gin` (always, 7 days)
    - Stop backend: `docker compose -f infra/dev/a-demo-be-golang-gin/docker-compose.yml down` (always)
- [x] Trigger `workflow_dispatch` manually; verify green

---

## Phase 13: CI — main-ci.yml Update

**Commit**: `ci: add a-demo-be-golang-gin coverage upload to main-ci`

- [x] Add coverage upload step to `.github/workflows/main-ci.yml`:

  ```yaml
  - name: Upload coverage — a-demo-be-golang-gin
    uses: codecov/codecov-action@v5
    with:
      token: ${{ secrets.CODECOV_TOKEN }}
      files: apps/a-demo-be-golang-gin/cover.out
      flags: a-demo-be-golang-gin
      fail_ci_if_error: false
  ```

- [x] No new SDK setup step required — Go SDK is already present in `main-ci.yml` for other
      Go projects (`rhino-cli`, `ayokoding-cli`, `oseplatform-cli`, `golang-commons`,
      `hugo-commons`)
- [x] Push to `main`; verify `Main CI` workflow passes

---

## Phase 14: Documentation Updates

**Commit**: `docs: add a-demo-be-golang-gin to project documentation`

- [x] Update `CLAUDE.md`:
  - Add `a-demo-be-golang-gin` to Current Apps list with description
  - Add `a-demo-be-golang-gin` to `test:integration` caching note (Godog + MemoryStore)
- [x] Update `README.md`:
  - Add a-demo-be-golang-gin badge in demo apps section
  - Add coverage badge row
  - Add to monorepo architecture listing
- [x] Update `specs/apps/a-demo/be/README.md`:
  - Add Go/Gin row to Implementations table
- [x] Update `apps/a-demo-be-e2e/project.json`:
  - Add `a-demo-be-golang-gin` to `implicitDependencies`
- [x] Update `governance/development/infra/nx-targets.md`:
  - Add `a-demo-be-golang-gin` row to Current Project Tags table:
    `["type:app", "platform:gin", "lang:golang", "domain:a-demo-be"]`
  - Add `platform:gin` to the Platform allowed values in the Four-Dimension Scheme table

---

## Phase 15: Final Validation

- [x] `nx run a-demo-be-golang-gin:test:quick` passes (≥90% coverage, zero lint violations)
- [x] `nx run a-demo-be-golang-gin:test:unit` passes (all domain unit tests)
- [x] `nx run a-demo-be-golang-gin:test:integration` passes — all 76 Gherkin scenarios
- [x] `nx run a-demo-be-golang-gin:lint` passes (golangci-lint clean)
- [x] `nx run a-demo-be-golang-gin:build` produces working binary at `apps/a-demo-be-golang-gin/dist/a-demo-be-golang-gin`
- [x] `gofmt -l apps/a-demo-be-golang-gin` returns no files (all files correctly formatted)
- [x] Docker Compose stack starts and health check passes (manual verification)
- [x] `e2e-a-demo-be-golang-gin.yml` workflow green (requires CI push)
- [x] `main-ci.yml` workflow green (requires CI push)
- [x] All documentation updated
- [x] Move plan folder to `plans/done/`
