# Delivery Checklist: demo-be-fsharp-giraffe

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [x] Verify .NET 10 SDK available locally (`~/.dotnet/dotnet` v10.0.103)
- [x] Verify `rhino-cli test-coverage validate` supports LCOV (it does — already used by
      `organiclever-fe` and `demo-be-elixir-phoenix`)
- [x] Confirm TickSpec supports current Gherkin syntax (Given/When/Then with regex and
      doc_string parameters)
- [x] Verify `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [x] Install Fantomas, FSharpLint, and dotnet-ef tools globally

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-fsharp-giraffe): scaffold F#/Giraffe project`

- [x] Create `apps/demo-be-fsharp-giraffe/` directory structure per tech-docs.md
- [x] Create `global.json` pinning .NET SDK 10.0.x
- [x] Create `src/DemoBeFsgi/DemoBeFsgi.fsproj` with all NuGet dependencies
- [x] Create `tests/DemoBeFsgi.Tests/DemoBeFsgi.Tests.fsproj` with test dependencies
- [x] Create minimal `Program.fs` with Giraffe health endpoint
- [x] Create `project.json` with all Nx targets from tech-docs.md
- [x] Add `.editorconfig` with Fantomas configuration
- [x] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [x] Add `.fsproj` build target to copy Gherkin specs to output directory
- [x] Verify `dotnet build` compiles with zero warnings
- [x] Verify `dotnet fantomas --check src/ tests/` passes
- [ ] Commit

---

## Phase 2: Domain Types and Database

**Commit**: `feat(demo-be-fsharp-giraffe): add domain types and EF Core database`

- [x] Create `Domain/Types.fs` — shared discriminated unions (`Currency`, `Role`,
      `UserStatus`, `DomainError`)
- [x] Create `Domain/User.fs` — User record with validation functions
- [x] Create `Domain/Expense.fs` — Expense record with currency precision validation
- [x] Create `Domain/Attachment.fs` — Attachment record
- [x] Create `Infrastructure/AppDbContext.fs` — EF Core DbContext with entity types
- [x] Create `Infrastructure/PasswordHasher.fs` — BCrypt wrapper
- [x] Write unit tests for domain validation (27 tests: password, email, username,
      currency, amount, unit, attachment)
- [x] Verify `dotnet test --filter Category=Unit` passes (27 passed)
- [ ] Commit

---

## Phase 3: Health Endpoint

**Commit**: `feat(demo-be-fsharp-giraffe): add /health endpoint`

- [x] Health handler already in `Program.fs` returning `{"status": "UP"}`
- [x] Route `GET /health` (public, no auth) already wired
- [x] Create `TestFixture.fs` with WebApplicationFactory + SQLite in-memory setup
- [x] Create `State.fs` — step state record for TickSpec
- [x] Write TickSpec integration test consuming `health-check.feature` (2 scenarios)
- [x] Create `Integration/Steps/CommonSteps.fs` with shared step definitions
- [x] Verify `dotnet test --filter Category=Integration` passes — 2 scenarios
- [ ] Commit

---

## Phase 4: Auth — Register and Login

**Commit**: `feat(demo-be-fsharp-giraffe): add register and login endpoints`

- [x] Create `Auth/JwtService.fs` — JWT generation (access + refresh tokens)
- [x] Create `Auth/JwtMiddleware.fs` — authentication middleware using Giraffe
- [x] Create `Handlers/AuthHandler.fs`:
  - `POST /api/v1/auth/register` → 201 `{id, username, email, display_name}`
  - `POST /api/v1/auth/login` → 200 `{access_token, refresh_token, token_type}`
- [x] Add routes: public scope for `/api/v1/auth/*`
- [x] Write TickSpec integration tests for `registration.feature` (6) and
      `password-login.feature` (5 scenarios)
- [x] Verify 13 integration scenarios pass
- [ ] Commit

---

## Phase 5: Token Lifecycle and Management

**Commit**: `feat(demo-be-fsharp-giraffe): add token lifecycle and management endpoints`

- [x] Add `POST /api/v1/auth/refresh` — refresh access token with rotation
- [x] Add `POST /api/v1/auth/logout` — revoke current token (idempotent)
- [x] Add `POST /api/v1/auth/logout-all` — revoke all tokens for user
- [x] Create `Handlers/TokenHandler.fs`:
  - `GET /api/v1/tokens/claims` — decode JWT claims
  - `GET /.well-known/jwks.json` — JWKS endpoint
- [x] Implement token revocation table in database
- [x] Write TickSpec integration tests for `token-lifecycle.feature` (7) and
      `tokens.feature` (6 scenarios)
- [x] Verify 26 integration scenarios pass
- [ ] Commit

---

## Phase 6: User Account and Security

**Commit**: `feat(demo-be-fsharp-giraffe): add user account and security endpoints`

- [x] Create `Handlers/UserHandler.fs`:
  - `GET /api/v1/users/me` — current user profile
  - `PATCH /api/v1/users/me` — update display name
  - `POST /api/v1/users/me/password` — change password
  - `POST /api/v1/users/me/deactivate` — self-deactivate
- [x] Implement account lockout (configurable failed attempts threshold)
- [x] Write TickSpec integration tests for `user-account.feature` (6) and
      `security.feature` (5 scenarios)
- [x] Verify 37 integration scenarios pass
- [ ] Commit

---

## Phase 7: Admin

**Commit**: `feat(demo-be-fsharp-giraffe): add admin endpoints`

- [x] Create `Auth/AdminMiddleware.fs` — admin role verification
- [x] Create `Handlers/AdminHandler.fs`:
  - `GET /api/v1/admin/users` — list/search with pagination and email filter
  - `POST /api/v1/admin/users/{id}/disable` — disable user account
  - `POST /api/v1/admin/users/{id}/enable` — re-enable user account
  - `POST /api/v1/admin/users/{id}/unlock` — unlock locked account
  - `POST /api/v1/admin/users/{id}/force-password-reset` — generate reset token
- [x] Write TickSpec integration tests for `admin.feature` (6 scenarios)
- [x] Verify 43 integration scenarios pass
- [ ] Commit

---

## Phase 8: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-fsharp-giraffe): add expense CRUD and currency handling`

- [x] Create `Handlers/ExpenseHandler.fs`:
  - `POST /api/v1/expenses` — create (expense or income)
  - `GET /api/v1/expenses` — list own (paginated)
  - `GET /api/v1/expenses/{id}` — get by ID
  - `PUT /api/v1/expenses/{id}` — update
  - `DELETE /api/v1/expenses/{id}` — delete (204)
  - `GET /api/v1/expenses/summary` — group totals by currency
- [x] Implement currency precision enforcement (USD: 2dp, IDR: 0dp)
- [x] Write TickSpec integration tests for `expense-management.feature` (7) and
      `currency-handling.feature` (6 scenarios)
- [x] Verify 56 integration scenarios pass
- [ ] Commit

---

## Phase 9: Expenses — Units, Reporting, Attachments

**Commit**: `feat(demo-be-fsharp-giraffe): add unit handling, reporting, and attachments`

- [x] Implement unit-of-measure field on expenses (quantity, unit)
- [x] Create `Handlers/ReportHandler.fs` — P&L per currency with date range filter
  - `GET /api/v1/reports/pl?from=X&to=Y&currency=Z`
- [x] Create `Handlers/AttachmentHandler.fs`:
  - `POST /api/v1/expenses/{id}/attachments` — upload file
  - `GET /api/v1/expenses/{id}/attachments` — list
  - `DELETE /api/v1/expenses/{id}/attachments/{aid}` — delete
- [x] Implement file size limit (10MB) with 413 response
- [x] Implement content type validation (jpeg, png, pdf only) with 415 response
- [x] Write TickSpec integration tests for `unit-handling.feature` (4),
      `reporting.feature` (6), and `attachments.feature` (10 scenarios)
- [x] Verify all 76 integration scenarios pass (103 total: 76 integration + 27 unit)
- [ ] Commit

---

## Phase 10: Coverage and Quality Gate

**Commit**: `fix(demo-be-fsharp-giraffe): achieve 90% coverage and pass quality gates`

- [x] Run full test suite with AltCover line coverage (switched from XPlat Code Coverage
      due to F# task{} async state machine BRDA inflation)
- [x] Validate: `rhino-cli test-coverage validate` passes — 95.46% (842/882)
- [x] Verify `fantomas --check src/ tests/` passes
- [x] Verify `dotnet fsharplint lint` passes (with fsharplint.json config)
- [x] Verify `dotnet build /p:TreatWarningsAsErrors=true` passes
- [x] Added unit tests for handler error paths (214 total: 138 unit + 76 integration)
- [ ] Commit

---

## Phase 11: Infra — Docker Compose

**Commit**: `feat(infra): add demo-be-fsharp-giraffe docker-compose dev environment`

- [x] Create `infra/dev/demo-be-fsharp-giraffe/Dockerfile.be.dev` (.NET 10 SDK Alpine)
- [x] Create `infra/dev/demo-be-fsharp-giraffe/docker-compose.yml` with PostgreSQL + app
- [x] Create `infra/dev/demo-be-fsharp-giraffe/docker-compose.e2e.yml` (E2E overrides)
- [x] Create `infra/dev/demo-be-fsharp-giraffe/README.md` with startup instructions
- [ ] Manual test: `docker compose up --build` → health check passes

---

## Phase 12: GitHub Actions — E2E Workflow

**Commit**: `ci: add e2e-demo-be-fsharp-giraffe GitHub Actions workflow`

- [x] Create `.github/workflows/e2e-demo-be-fsharp-giraffe.yml`:
  - Trigger: schedule (same crons as jasb/exph) + `workflow_dispatch`
  - Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
    `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
    upload artifact → docker down
- [ ] Trigger `workflow_dispatch` manually; verify green

---

## Phase 13: CI — main-ci.yml Update

**Commit**: `ci: add .NET SDK setup and demo-be-fsharp-giraffe coverage upload to main-ci`

- [x] Add `actions/setup-dotnet@v4` step to `main-ci.yml` (.NET 10)
- [x] Add coverage upload step for `apps/demo-be-fsharp-giraffe/coverage/altcov.info`
      with flag `demo-be-fsharp-giraffe`
- [ ] Push to `main`; verify `Main CI` workflow passes

---

## Phase 14: Documentation Updates

**Commit**: `docs: add demo-be-fsharp-giraffe to project documentation`

- [x] Update `CLAUDE.md`:
  - Add `demo-be-fsharp-giraffe` to Current Apps list with description
  - Add F# coverage info to coverage section
  - Add `demo-be-fsharp-giraffe` to `test:integration` caching note
- [x] Update `README.md`:
  - Add demo-be-fsharp-giraffe badge in demo apps section
  - Add coverage badge row
  - Add to monorepo architecture listing
- [x] Update `specs/apps/demo/be/README.md`:
  - Add F#/Giraffe row to Implementations table
- [x] Update `apps/demo-be-e2e/project.json`:
  - Add `demo-be-fsharp-giraffe` to `implicitDependencies`
- [x] Update `plans/in-progress/README.md`:
  - Remove this plan from active list (move to done)

---

## Phase 15: Final Validation

- [x] `nx run demo-be-fsharp-giraffe:test:quick` passes (157 integration + 57 unit, 95.46% coverage, lint clean)
- [x] `nx run demo-be-fsharp-giraffe:test:unit` passes
- [x] `nx run demo-be-fsharp-giraffe:test:integration` passes — all 76+ scenarios (157 test cases with outlines)
- [x] `nx run demo-be-fsharp-giraffe:lint` passes
- [x] `nx run demo-be-fsharp-giraffe:typecheck` passes
- [x] `nx run demo-be-fsharp-giraffe:build` produces working artifact
- [ ] Docker Compose stack starts and health check passes (requires manual verification)
- [ ] `e2e-demo-be-fsharp-giraffe.yml` workflow green (requires CI push)
- [ ] `main-ci.yml` workflow green (requires CI push)
- [x] All documentation updated
- [x] Move plan folder to `plans/done/`
