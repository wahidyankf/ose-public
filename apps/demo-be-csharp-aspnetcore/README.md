# demo-be-csharp-aspnetcore — C#/ASP.NET Core REST API Backend

C# 12 / ASP.NET Core 10 Minimal APIs implementation of the demo backend REST API. A functional
twin of `demo-be-golang-gin` (Go/Gin), `demo-be-elixir-phoenix` (Elixir Phoenix), `demo-be-fsharp-giraffe`
(F# Giraffe), and other alternatives. Runs on port **8201**.

## Local Development

### Prerequisites

- .NET 10 SDK (`dotnet --version` ≥ 10.0)
- Docker + Docker Compose (for local PostgreSQL and integration tests)

### Run with Docker Compose

```bash
cd infra/dev/demo-be-csharp-aspnetcore
docker compose up --build
```

### Run locally (requires PostgreSQL)

```bash
cd apps/demo-be-csharp-aspnetcore
export APP_JWT_SECRET="change-me-in-dev-only-not-for-production"
export DATABASE_URL="Host=localhost;Port=5432;Database=demo_be_csharp_aspnetcore;Username=demo_be_csharp_aspnetcore;Password=demo_be_csharp_aspnetcore"
dotnet run --project src/DemoBeCsas/DemoBeCsas.csproj
```

## Database Migrations

This project uses **EF Core Migrations** to manage the PostgreSQL schema.

### Tool

EF Core Migrations (MIT license) via `Microsoft.EntityFrameworkCore.Design` (build-time only,
`PrivateAssets="all"`).

### How migrations run

On application startup, `Database.MigrateAsync()` in `Program.cs` applies all pending migrations
to the connected PostgreSQL database. This runs only when `DATABASE_URL` is set — SQLite in-memory
databases used by unit tests use `EnsureCreated` instead (EF Core migrations do not support the
SQLite in-memory provider).

### Create a new migration

```bash
cd apps/demo-be-csharp-aspnetcore
dotnet ef migrations add <MigrationName> \
  --project src/DemoBeCsas/DemoBeCsas.csproj \
  --startup-project src/DemoBeCsas/DemoBeCsas.csproj
```

If `dotnet ef` is not installed:

```bash
dotnet tool install --global dotnet-ef
```

Migration files are committed to git under `src/DemoBeCsas/Migrations/`.

## Test Architecture

This project uses a three-level test architecture:

### Level 1: Unit tests (`test:unit`)

All tests in `tests/DemoBeCsas.Tests/` run against SQLite in-memory using
`WebApplicationFactory`. No external services are required. This includes:

- **Reqnroll BDD scenarios** (`Integration/Steps/`) — Gherkin feature scenarios run
  in-process with SQLite in-memory. `TestWebApplicationFactory` substitutes the
  production PostgreSQL registration when `DATABASE_URL` is not set.
- **Pure xUnit unit tests** (`Unit/`) — Isolated tests for domain functions, validators,
  JWT service, and endpoint edge cases.

### Level 2: Quick quality gate (`test:quick`)

Runs all unit tests (Level 1) and then validates coverage with `rhino-cli`. Coverage
must reach at least 90% (Coverlet LCOV → `rhino-cli test-coverage validate`). This is
the pre-push gate — no external services required, fully cacheable by Nx.

### Level 3: Integration tests (`test:integration`)

The same Reqnroll BDD scenarios run inside Docker against a real PostgreSQL 17 instance.
This validates that the production database configuration (Npgsql + snake_case naming
conventions) works correctly end-to-end. Not cached by Nx.

```bash
# Run docker-compose integration tests
nx run demo-be-csharp-aspnetcore:test:integration
```

## Nx Targets

| Target             | Command                                             | Description                                               |
| ------------------ | --------------------------------------------------- | --------------------------------------------------------- |
| `codegen`          | `nx run demo-be-csharp-aspnetcore:codegen`          | Generate contract types from OpenAPI spec                 |
| `build`            | `nx build demo-be-csharp-aspnetcore`                | Publish release artifact to `dist/` (depends on codegen)  |
| `dev`              | `nx dev demo-be-csharp-aspnetcore`                  | Hot-reload development server                             |
| `start`            | `nx start demo-be-csharp-aspnetcore`                | Run without hot-reload                                    |
| `test:quick`       | `nx run demo-be-csharp-aspnetcore:test:quick`       | All tests (SQLite) + Coverlet LCOV coverage ≥90% (cached) |
| `test:unit`        | `nx run demo-be-csharp-aspnetcore:test:unit`        | All tests (SQLite in-memory, no coverage report)          |
| `test:integration` | `nx run demo-be-csharp-aspnetcore:test:integration` | BDD scenarios against real PostgreSQL via docker-compose  |
| `lint`             | `nx run demo-be-csharp-aspnetcore:lint`             | Run Roslyn analyzers                                      |
| `typecheck`        | `nx run demo-be-csharp-aspnetcore:typecheck`        | Build with TreatWarningsAsErrors (depends on codegen)     |

## Environment Variables

| Variable         | Required | Description                        |
| ---------------- | -------- | ---------------------------------- |
| `APP_JWT_SECRET` | Yes      | HMAC-SHA256 secret for JWT signing |
| `DATABASE_URL`   | Yes      | PostgreSQL connection string       |
| `PORT`           | No       | HTTP port (default: 8201)          |

## API Endpoints

| Method | Path                                            | Auth  | Description           |
| ------ | ----------------------------------------------- | ----- | --------------------- |
| GET    | `/health`                                       | No    | Health check          |
| POST   | `/api/v1/auth/register`                         | No    | Register new user     |
| POST   | `/api/v1/auth/login`                            | No    | Login, return JWT     |
| POST   | `/api/v1/auth/refresh`                          | JWT   | Refresh access token  |
| POST   | `/api/v1/auth/logout`                           | No    | Logout (revoke token) |
| POST   | `/api/v1/auth/logout-all`                       | JWT   | Revoke all tokens     |
| GET    | `/api/v1/users/me`                              | JWT   | Current user profile  |
| PATCH  | `/api/v1/users/me`                              | JWT   | Update display name   |
| POST   | `/api/v1/users/me/password`                     | JWT   | Change password       |
| POST   | `/api/v1/users/me/deactivate`                   | JWT   | Self-deactivate       |
| GET    | `/api/v1/admin/users`                           | Admin | List/search users     |
| POST   | `/api/v1/admin/users/{id}/disable`              | Admin | Disable user          |
| POST   | `/api/v1/admin/users/{id}/enable`               | Admin | Enable user           |
| POST   | `/api/v1/admin/users/{id}/unlock`               | Admin | Unlock locked account |
| POST   | `/api/v1/admin/users/{id}/force-password-reset` | Admin | Generate reset token  |
| POST   | `/api/v1/expenses`                              | JWT   | Create expense        |
| GET    | `/api/v1/expenses`                              | JWT   | List expenses         |
| GET    | `/api/v1/expenses/{id}`                         | JWT   | Get expense           |
| PUT    | `/api/v1/expenses/{id}`                         | JWT   | Update expense        |
| DELETE | `/api/v1/expenses/{id}`                         | JWT   | Delete expense        |
| GET    | `/api/v1/expenses/summary`                      | JWT   | Summary by currency   |
| POST   | `/api/v1/expenses/{id}/attachments`             | JWT   | Upload attachment     |
| GET    | `/api/v1/expenses/{id}/attachments`             | JWT   | List attachments      |
| DELETE | `/api/v1/expenses/{id}/attachments/{aid}`       | JWT   | Delete attachment     |
| GET    | `/api/v1/reports/pl`                            | JWT   | P&L report            |
| GET    | `/api/v1/tokens/claims`                         | JWT   | Decode JWT claims     |
| GET    | `/.well-known/jwks.json`                        | No    | JWKS endpoint         |

## Tech Stack

| Concern          | Choice                                                           |
| ---------------- | ---------------------------------------------------------------- |
| Language         | C# 12+ with nullable reference types                             |
| Web framework    | ASP.NET Core 10 Minimal APIs                                     |
| Database ORM     | Entity Framework Core 10 with PostgreSQL (prod) / SQLite (tests) |
| JWT              | Microsoft.AspNetCore.Authentication.JwtBearer                    |
| Password hashing | BCrypt.Net-Next                                                  |
| BDD integration  | Reqnroll (Gherkin BDD runner) + WebApplicationFactory + xUnit    |
| Unit tests       | xUnit + FluentAssertions                                         |
| Linting          | Roslyn Analyzers + SonarAnalyzer.CSharp                          |
| Coverage         | Coverlet XPlat Code Coverage (LCOV) → `rhino-cli` ≥90%           |
| Port             | 8201                                                             |

## Project Structure

```
apps/demo-be-csharp-aspnetcore/
├── docker-compose.integration.yml  # PostgreSQL + test-runner for integration tests
├── Dockerfile.integration          # .NET 10 SDK image for docker-compose integration tests
├── src/DemoBeCsas/
│   ├── Domain/          # Records, enums, validation functions
│   ├── Infrastructure/  # EF Core DbContext, repositories, password hasher
│   ├── Auth/            # JWT service, authorization extensions
│   └── Endpoints/       # Minimal API route handlers
└── tests/DemoBeCsas.Tests/
    ├── Unit/            # Pure function tests (xUnit, Category=Unit)
    └── Integration/     # Reqnroll BDD step definitions (WebApplicationFactory)
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) — Unit, integration, and E2E testing boundaries
- [Code Coverage Reference](../../docs/reference/re__code-coverage.md) — Coverage tools, thresholds, and local vs Codecov
- [Project Dependency Graph](../../docs/reference/re__project-dependency-graph.md) — Nx dependency visualization
- [Backend Gherkin Specs](../../specs/apps/demo/be/gherkin/README.md) — Shared feature files (source of truth)
- [OpenAPI Contract](../../specs/apps/demo/contracts/README.md) — API contract and codegen
