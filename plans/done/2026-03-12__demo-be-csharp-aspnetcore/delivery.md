# Delivery Checklist: demo-be-csharp-aspnetcore

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [ ] Verify .NET 9 SDK available locally (`dotnet --version` ≥ 9.0.x)
- [ ] Verify `dotnet-ef` tool available globally (`dotnet ef --version`); install if missing
      (`dotnet tool install -g dotnet-ef`)
- [ ] Verify `rhino-cli test-coverage validate` supports LCOV (it does — already used by
      `organiclever-web`, `demo-be-elixir-phoenix`, `demo-be-python-fastapi`, `demo-be-rust-axum`, `demo-be-fsharp-giraffe`)
- [ ] Confirm Reqnroll supports current Gherkin syntax in `specs/apps/demo-be/gherkin/`
      (Given/When/Then with doc_string and data table parameters)
- [ ] Verify `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [ ] Confirm Coverlet XPlat Code Coverage with LCOV format works for C# tests (same mechanism
      as `demo-be-fsharp-giraffe` which uses the identical collector)

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-csharp-aspnetcore): scaffold C#/ASP.NET Core project`

- [ ] Create `apps/demo-be-csharp-aspnetcore/` directory structure per tech-docs.md
- [ ] Create `global.json` pinning .NET SDK 9.0.x
- [ ] Create `Directory.Build.props` with shared MSBuild settings per tech-docs.md
      (`Nullable`, `ImplicitUsings`, `TreatWarningsAsErrors`, `RestorePackagesWithLockFile`)
- [ ] Create `Directory.Packages.props` with all NuGet Central Package Management versions
      per tech-docs.md
- [ ] Create `src/DemoBeCsas/DemoBeCsas.csproj` referencing all runtime packages
- [ ] Create `tests/DemoBeCsas.Tests/DemoBeCsas.Tests.csproj` referencing all test packages
      and the main project, with the `CopyGherkinSpecs` MSBuild target
- [ ] Create minimal `src/DemoBeCsas/Program.cs` with `WebApplication.CreateBuilder` that
      starts on port 8201 (no routes yet except health)
- [ ] Create `.editorconfig` with `dotnet format` rules (indentation, braces, using directives)
- [ ] Create `project.json` with all Nx targets from tech-docs.md
- [ ] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [ ] Run `dotnet restore` to generate `packages.lock.json`
- [ ] Verify `dotnet build` compiles with zero warnings (`TreatWarningsAsErrors=true`)
- [ ] Verify `dotnet format --verify-no-changes` passes
- [ ] Commit

---

## Phase 2: Domain Types and Database

**Commit**: `feat(demo-be-csharp-aspnetcore): add domain types and EF Core database layer`

- [ ] Create `src/DemoBeCsas/Domain/Types.cs` — C# enums:
      `Currency` (USD, IDR), `Role` (User, Admin), `UserStatus` (Active, Inactive, Disabled, Locked)
- [ ] Create `src/DemoBeCsas/Domain/Errors.cs` — sealed record error hierarchy:
      `DomainError`, `ValidationError`, `NotFoundError`, `ForbiddenError`,
      `ConflictError`, `UnauthorizedError`, `FileTooLargeError`, `UnsupportedMediaTypeError`
- [ ] Create `src/DemoBeCsas/Domain/User.cs` — `UserDomain` record + static `UserValidation`
      class with `ValidatePassword`, `ValidateEmail`, `ValidateUsername` (all return
      `Result<T>` or throw `DomainError`)
- [ ] Create `src/DemoBeCsas/Domain/Expense.cs` — `ExpenseDomain` record + `CurrencyValidation`
      class with `ValidateAmount(currency, amount)` enforcing decimal precision per currency
- [ ] Create `src/DemoBeCsas/Domain/Attachment.cs` — `AttachmentDomain` record
- [ ] Create `src/DemoBeCsas/Infrastructure/Models/` — EF Core entity classes:
      `UserModel`, `ExpenseModel`, `AttachmentModel`, `RevokedTokenModel`
- [ ] Create `src/DemoBeCsas/Infrastructure/AppDbContext.cs` — EF Core `DbContext` with
      `DbSet<>` properties and `OnModelCreating` config (unique indexes, enum-to-string
      conversions, decimal precision)
- [ ] Create `src/DemoBeCsas/Infrastructure/PasswordHasher.cs` — BCrypt.Net-Next wrapper
      with `IPasswordHasher` interface, `HashPassword(string)`, `VerifyPassword(string, string)`
- [ ] Write unit tests in `tests/DemoBeCsas.Tests/Unit/`:
  - `UserValidationTests.cs`: password strength (min 12 chars, uppercase, special char),
    email format, username constraints — tagged `[Trait("Category", "Unit")]`
  - `CurrencyTests.cs`: USD 2dp enforcement, IDR 0dp enforcement, unsupported currency,
    negative amount rejection — tagged `[Trait("Category", "Unit")]`
  - `PasswordHasherTests.cs`: hash/verify roundtrip, wrong password returns false —
    tagged `[Trait("Category", "Unit")]`
- [ ] Verify `dotnet test --filter Category=Unit` passes
- [ ] Verify `dotnet build /p:TreatWarningsAsErrors=true` still passes
- [ ] Commit

---

## Phase 3: Health Endpoint

**Commit**: `feat(demo-be-csharp-aspnetcore): add /health endpoint`

- [ ] Create `src/DemoBeCsas/Endpoints/HealthEndpoints.cs` with
      `MapHealthEndpoints(this IEndpointRouteBuilder app)` extension — `GET /health` returns
      `Results.Ok(new { status = "UP" })` (public, no auth)
- [ ] Register `app.MapHealthEndpoints()` in `Program.cs`
- [ ] Register domain error → HTTP response mapping in `Program.cs` (middleware or endpoint
      filter converting `DomainError` subclasses to appropriate `IResult`)
- [ ] Create `tests/DemoBeCsas.Tests/TestWebApplicationFactory.cs` with:
  - `WebApplicationFactory<Program>` subclass
  - `ConfigureWebHost` override removing production Postgres EF registration and adding
    SQLite in-memory (`DataSource=:memory:`)
  - `EnsureDatabaseCreated()` helper calling `dbContext.Database.EnsureCreated()`
- [ ] Create `tests/DemoBeCsas.Tests/ScenarioContext/SharedState.cs` — POCO for per-scenario
      state: `LastResponse`, `AccessToken`, `RefreshToken`, `LastCreatedId`
- [ ] Create `tests/DemoBeCsas.Tests/Integration/Steps/CommonSteps.cs` with shared step
      definitions: status code assertions, API-is-running setup
- [ ] Create `tests/DemoBeCsas.Tests/Integration/Steps/HealthSteps.cs` — Reqnroll `[Binding]`
      class consuming `health-check.feature` (2 scenarios), tagged
      `[Trait("Category", "Integration")]`
- [ ] Verify `dotnet test --filter Category=Integration` passes — 2 scenarios
- [ ] Commit

---

## Phase 4: Auth — Register and Login

**Commit**: `feat(demo-be-csharp-aspnetcore): add register and login endpoints`

- [ ] Create `src/DemoBeCsas/Auth/JwtService.cs` — `IJwtService` interface +
      `JwtService` implementation:
  - `CreateAccessToken(userId, username, role) -> string`
  - `CreateRefreshToken(userId) -> string`
  - `DecodeToken(token) -> ClaimsPrincipal`
- [ ] Register `JwtService` in DI and configure `AddAuthentication().AddJwtBearer(...)` in
      `Program.cs`
- [ ] Create `src/DemoBeCsas/Infrastructure/Repositories/UserRepository.cs` —
      `IUserRepository` + `UserRepository`:
  - `CreateAsync(username, email, passwordHash, displayName) -> UserModel`
  - `FindByUsernameAsync(username) -> UserModel?`
  - `FindByIdAsync(userId) -> UserModel?`
- [ ] Create `src/DemoBeCsas/Endpoints/AuthEndpoints.cs`:
  - `POST /api/v1/auth/register` → 201 `{id, username, email, display_name}`
    (validates password strength; returns 409 on duplicate username)
  - `POST /api/v1/auth/login` → 200 `{access_token, refresh_token, token_type: "Bearer"}`
    (raises 401 on wrong password, 401 on Inactive status, 423 on Locked)
- [ ] Register `app.MapAuthEndpoints()` and all repository scopes in `Program.cs`
- [ ] Write Reqnroll integration steps in
      `tests/DemoBeCsas.Tests/Integration/Steps/AuthSteps.cs` consuming
      `registration.feature` (6 scenarios) and `password-login.feature` (5 scenarios)
- [ ] Verify `dotnet test --filter Category=Integration` passes — 13 scenarios
- [ ] Verify `dotnet build /p:TreatWarningsAsErrors=true` passes
- [ ] Commit

---

## Phase 5: Token Lifecycle and Management

**Commit**: `feat(demo-be-csharp-aspnetcore): add token lifecycle and management endpoints`

- [ ] Create `src/DemoBeCsas/Infrastructure/Repositories/RevokedTokenRepository.cs` —
      `IRevokedTokenRepository` + `RevokedTokenRepository`:
  - `RevokeAsync(jti) -> Task` — idempotent
  - `IsRevokedAsync(jti) -> Task<bool>`
  - `RevokeAllForUserAsync(userId) -> Task`
- [ ] Extend `AuthEndpoints.cs`:
  - `POST /api/v1/auth/refresh` — checks user status first (before revocation check),
    issues new pair, revokes old refresh jti (rotation); returns 401 if user inactive
  - `POST /api/v1/auth/logout` — revokes current access token jti (idempotent: 200 even
    if already revoked); public route (reads Authorization header)
  - `POST /api/v1/auth/logout-all` — protected by JWT; revokes all tokens for user
- [ ] Create `src/DemoBeCsas/Endpoints/TokenEndpoints.cs`:
  - `GET /api/v1/tokens/claims` — decode and return JWT claims (protected)
  - `GET /.well-known/jwks.json` — return JWKS public key info (public)
- [ ] Register `app.MapTokenEndpoints()` in `Program.cs`
- [ ] Write Reqnroll integration steps in `TokenLifecycleSteps.cs` consuming
      `token-lifecycle.feature` (7 scenarios) and `TokenManagementSteps.cs` consuming
      `tokens.feature` (6 scenarios)
- [ ] Verify `dotnet test --filter Category=Integration` passes — 26 scenarios
- [ ] Commit

---

## Phase 6: User Account and Security

**Commit**: `feat(demo-be-csharp-aspnetcore): add user account and security endpoints`

- [ ] Create `src/DemoBeCsas/Endpoints/UserEndpoints.cs`:
  - `GET /api/v1/users/me` — return `{id, username, email, display_name, status}` (protected)
  - `PATCH /api/v1/users/me` — update `display_name` field (protected)
  - `POST /api/v1/users/me/password` — verify old password, hash new, update (protected);
    returns 400 on incorrect old password
  - `POST /api/v1/users/me/deactivate` — set status to Inactive, revoke all tokens
    (protected)
- [ ] Implement account lockout in login logic:
  - Track `FailedLoginAttempts` counter on `UserModel`
  - After configurable threshold (5 by default), set status to Locked
  - Reset counter on successful login
- [ ] Register `app.MapUserEndpoints()` in `Program.cs`
- [ ] Write Reqnroll integration steps in `UserAccountSteps.cs` consuming
      `user-account.feature` (6 scenarios) and `SecuritySteps.cs` consuming
      `security.feature` (5 scenarios)
- [ ] Verify `dotnet test --filter Category=Integration` passes — 37 scenarios
- [ ] Verify `dotnet build /p:TreatWarningsAsErrors=true` passes
- [ ] Commit

---

## Phase 7: Admin

**Commit**: `feat(demo-be-csharp-aspnetcore): add admin endpoints`

- [ ] Create `src/DemoBeCsas/Auth/AuthorizationExtensions.cs` — admin role policy:
      `builder.Services.AddAuthorization(opts => opts.AddPolicy("Admin", ...))` and
      `RequireAuthorization("Admin")` helper
- [ ] Create `src/DemoBeCsas/Endpoints/AdminEndpoints.cs`:
  - `GET /api/v1/admin/users` — paginated list with optional `email` query filter
    (protected + Admin policy); returns `{items: [...], total, page, size}`
  - `POST /api/v1/admin/users/{id}/disable` — set status to Disabled (admin only)
  - `POST /api/v1/admin/users/{id}/enable` — set status to Active (admin only)
  - `POST /api/v1/admin/users/{id}/unlock` — set status to Active, reset failed attempts
    (admin only)
  - `POST /api/v1/admin/users/{id}/force-password-reset` — generate and return one-time
    reset token (admin only)
- [ ] Add `ListUsersAsync(page, size, emailFilter)`, `SetStatusAsync(userId, status)` to
      `UserRepository`
- [ ] Register `app.MapAdminEndpoints()` in `Program.cs`
- [ ] Write Reqnroll integration steps in `AdminSteps.cs` consuming `admin.feature`
      (6 scenarios)
- [ ] Verify `dotnet test --filter Category=Integration` passes — 43 scenarios
- [ ] Commit

---

## Phase 8: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-csharp-aspnetcore): add expense CRUD and currency handling`

- [ ] Create `src/DemoBeCsas/Infrastructure/Repositories/ExpenseRepository.cs` —
      `IExpenseRepository` + `ExpenseRepository`:
  - `CreateAsync(userId, data) -> ExpenseModel`
  - `FindByIdAsync(expenseId, userId) -> ExpenseModel?`
  - `ListByUserAsync(userId, page, size) -> (IReadOnlyList<ExpenseModel>, int)`
  - `UpdateAsync(expenseId, userId, data) -> ExpenseModel`
  - `DeleteAsync(expenseId, userId) -> Task`
  - `SummaryByCurrencyAsync(userId) -> IReadOnlyList<CurrencySummary>`
- [ ] Create `src/DemoBeCsas/Endpoints/ExpenseEndpoints.cs`:
  - `POST /api/v1/expenses` — create expense or income (protected); validates currency and
    amount precision; returns 201 with `{id, ...}`
  - `GET /api/v1/expenses` — list own (paginated, protected)
  - `GET /api/v1/expenses/summary` — grouped totals by currency (protected)
  - `GET /api/v1/expenses/{id}` — get by ID (protected, 403 if not owner)
  - `PUT /api/v1/expenses/{id}` — update (protected, 403 if not owner)
  - `DELETE /api/v1/expenses/{id}` — delete, returns 204 (protected, 403 if not owner)
- [ ] Route ordering: `/api/v1/expenses/summary` registered BEFORE `/api/v1/expenses/{id}`
      using Minimal API `MapGet` order (first match wins)
- [ ] Register `app.MapExpenseEndpoints()` in `Program.cs`
- [ ] Write Reqnroll integration steps in `ExpenseSteps.cs` consuming
      `expense-management.feature` (7 scenarios) and `CurrencySteps.cs` consuming
      `currency-handling.feature` (6 scenarios)
- [ ] Verify `dotnet test --filter Category=Integration` passes — 56 scenarios
- [ ] Commit

---

## Phase 9: Expenses — Units, Reporting, Attachments

**Commit**: `feat(demo-be-csharp-aspnetcore): add unit handling, reporting, and attachments`

- [ ] Add `Quantity` (string? nullable) and `Unit` (string? nullable) columns to `ExpenseModel`
      via EF Core migration
- [ ] Implement unit-of-measure validation in `ExpenseEndpoints.cs` — supported SI units
      (liter, kilogram, meter) and imperial equivalents (gallon, pound, foot, mile, ounce);
      unsupported returns 400
- [ ] Create `src/DemoBeCsas/Endpoints/ReportEndpoints.cs`:
  - `GET /api/v1/reports/pl` — P&L report with `from`, `to` (ISO date), and `currency`
    query params (protected); returns `{income_total, expense_total, net, breakdown}`
- [ ] Create `src/DemoBeCsas/Infrastructure/Repositories/AttachmentRepository.cs` —
      `IAttachmentRepository` + `AttachmentRepository`
- [ ] Create `src/DemoBeCsas/Endpoints/AttachmentEndpoints.cs`:
  - `POST /api/v1/expenses/{id}/attachments` — upload file via `IFormFile` (protected);
    validates content type (image/jpeg, image/png, application/pdf) → 415;
    validates size ≤ 10MB → 413; returns 201 with metadata
  - `GET /api/v1/expenses/{id}/attachments` — list attachments (protected, 403 if not owner)
  - `DELETE /api/v1/expenses/{id}/attachments/{aid}` — delete (protected, 403 if not owner,
    404 if not found)
- [ ] Register `app.MapReportEndpoints()` and `app.MapAttachmentEndpoints()` in `Program.cs`
- [ ] Write Reqnroll integration steps in:
  - `UnitHandlingSteps.cs` consuming `unit-handling.feature` (4 scenarios)
  - `ReportingSteps.cs` consuming `reporting.feature` (6 scenarios)
  - `AttachmentSteps.cs` consuming `attachments.feature` (10 scenarios)
- [ ] Verify `dotnet test --filter Category=Integration` passes — all 76 scenarios
- [ ] Commit

---

## Phase 10: Coverage and Quality Gate

**Commit**: `fix(demo-be-csharp-aspnetcore): achieve 90% coverage and pass quality gates`

- [ ] Run full test suite with Coverlet LCOV:
      `dotnet test tests/DemoBeCsas.Tests/DemoBeCsas.Tests.csproj --collect:"XPlat Code Coverage" --results-directory ./coverage -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=lcov`
- [ ] Validate: `rhino-cli test-coverage validate apps/demo-be-csharp-aspnetcore/coverage/**/coverage.info 90`
      passes
- [ ] If coverage below 90%: add unit tests for domain error paths and handler error branches
      in `DemoBeCsas.Tests/Unit/` until threshold is met
- [ ] Verify `dotnet format --verify-no-changes` passes (zero formatting changes)
- [ ] Verify `dotnet build /p:TreatWarningsAsErrors=true` passes (zero analyzer warnings)
- [ ] `nx run demo-be-csharp-aspnetcore:test:quick` passes all gates
- [ ] Commit

---

## Phase 11: Infra — Docker Compose

**Commit**: `feat(infra): add demo-be-csharp-aspnetcore docker-compose dev environment`

- [ ] Create `infra/dev/demo-be-csharp-aspnetcore/Dockerfile.be.dev` (mcr.microsoft.com/dotnet/sdk:9.0-alpine + dotnet-ef tool) per tech-docs.md
- [ ] Create `infra/dev/demo-be-csharp-aspnetcore/docker-compose.yml` with PostgreSQL 17 + app per
      tech-docs.md
- [ ] Create `infra/dev/demo-be-csharp-aspnetcore/docker-compose.e2e.yml` (E2E overrides: detach mode,
      wait-for-healthy)
- [ ] Create `infra/dev/demo-be-csharp-aspnetcore/README.md` with startup instructions
- [ ] Manual test: `docker compose up --build` → `curl http://localhost:8201/health`
      returns `{"status": "UP"}`

---

## Phase 12: GitHub Actions — E2E Workflow

**Commit**: `ci: add e2e-demo-be-csharp-aspnetcore GitHub Actions workflow`

- [ ] Create `.github/workflows/e2e-demo-be-csharp-aspnetcore.yml`:
  - Trigger: schedule (same crons as jasb/exph/fsgi) + `workflow_dispatch`
  - Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
    `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
    upload artifact `playwright-report-be-csas` → docker down (always)
- [ ] Trigger `workflow_dispatch` manually; verify green

---

## Phase 13: CI — main-ci.yml Update

**Commit**: `ci: add demo-be-csharp-aspnetcore coverage upload to main-ci`

- [ ] Verify existing `.NET SDK` `actions/setup-dotnet@v4` step in `main-ci.yml` covers .NET 9
      (it should — already added for `demo-be-fsharp-giraffe`)
- [ ] Add coverage upload step for `apps/demo-be-csharp-aspnetcore/coverage/**/coverage.info`
      with flag `demo-be-csharp-aspnetcore`
- [ ] Push to `main`; verify `Main CI` workflow passes

---

## Phase 14: Documentation Updates

**Commit**: `docs: add demo-be-csharp-aspnetcore to project documentation`

- [ ] Update `CLAUDE.md`:
  - Add `demo-be-csharp-aspnetcore` to Current Apps list with description
    (`demo-be-csharp-aspnetcore` — C#/ASP.NET Core REST API backend)
  - Add C# coverage info to coverage section
    (`demo-be-csharp-aspnetcore` enforces ≥90% via Coverlet LCOV + `rhino-cli test-coverage validate`)
  - Add `demo-be-csharp-aspnetcore` to `test:integration` caching note
    (Reqnroll + WebApplicationFactory + SQLite in-memory)
- [ ] Update `README.md`:
  - Add demo-be-csharp-aspnetcore badge in demo apps section
  - Add coverage badge row
  - Add to monorepo architecture listing
- [ ] Update `specs/apps/demo-be/README.md`:
  - Add C#/ASP.NET Core row to Implementations table
- [ ] Update `apps/demo-be-e2e/project.json`:
  - Add `demo-be-csharp-aspnetcore` to `implicitDependencies`

---

## Phase 15: Final Validation

- [ ] `nx run demo-be-csharp-aspnetcore:test:quick` passes (all integration scenarios, ≥90% coverage,
      zero format violations, zero analyzer warnings)
- [ ] `nx run demo-be-csharp-aspnetcore:test:unit` passes
- [ ] `nx run demo-be-csharp-aspnetcore:test:integration` passes — all 76 scenarios
- [ ] `nx run demo-be-csharp-aspnetcore:lint` passes
- [ ] `nx run demo-be-csharp-aspnetcore:typecheck` passes
- [ ] `nx run demo-be-csharp-aspnetcore:build` produces working artifact in `dist/`
- [ ] Docker Compose stack starts and health check passes (requires manual verification)
- [ ] `e2e-demo-be-csharp-aspnetcore.yml` workflow green (requires CI push)
- [ ] `main-ci.yml` workflow green (requires CI push)
- [ ] All documentation updated
- [ ] Move plan folder to `plans/done/`
