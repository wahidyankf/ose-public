# demo-be-csas — C#/ASP.NET Core REST API Backend

C# 12 / ASP.NET Core 10 Minimal APIs implementation of the demo backend REST API. A functional
twin of `demo-be-jasb` (Java Spring Boot), `demo-be-exph` (Elixir Phoenix), `demo-be-fsgi`
(F# Giraffe), and other alternatives. Runs on port **8201**.

## Local Development

### Prerequisites

- .NET 10 SDK (`dotnet --version` ≥ 10.0)
- Docker + Docker Compose (for local PostgreSQL)

### Run with Docker Compose

```bash
cd infra/dev/demo-be-csas
docker compose up --build
```

### Run locally (requires PostgreSQL)

```bash
cd apps/demo-be-csas
export APP_JWT_SECRET="change-me-in-dev-only-not-for-production"
export DATABASE_URL="Host=localhost;Port=5432;Database=demo_be_csas;Username=demo_be_csas;Password=demo_be_csas"
dotnet run --project src/DemoBeCsas/DemoBeCsas.csproj
```

## Nx Targets

| Target             | Command                                | Description                                          |
| ------------------ | -------------------------------------- | ---------------------------------------------------- |
| `build`            | `nx build demo-be-csas`                | Publish release artifact to `dist/`                  |
| `dev`              | `nx dev demo-be-csas`                  | Hot-reload development server                        |
| `start`            | `nx start demo-be-csas`                | Run without hot-reload                               |
| `test:quick`       | `nx run demo-be-csas:test:quick`       | Full quality gate (tests + coverage + format + lint) |
| `test:unit`        | `nx run demo-be-csas:test:unit`        | Unit tests only                                      |
| `test:integration` | `nx run demo-be-csas:test:integration` | Integration tests only (Reqnroll BDD)                |
| `lint`             | `nx run demo-be-csas:lint`             | Run Roslyn analyzers                                 |
| `typecheck`        | `nx run demo-be-csas:typecheck`        | Build with TreatWarningsAsErrors                     |

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
| Coverage         | Coverlet LCOV → `rhino-cli test-coverage validate` ≥90%          |
| Port             | 8201                                                             |

## Project Structure

```
apps/demo-be-csas/
├── src/DemoBeCsas/
│   ├── Domain/          # Records, enums, validation functions
│   ├── Infrastructure/  # EF Core DbContext, repositories, password hasher
│   ├── Auth/            # JWT service, authorization extensions
│   └── Endpoints/       # Minimal API route handlers
└── tests/DemoBeCsas.Tests/
    ├── Unit/            # Pure function tests (xUnit)
    └── Integration/     # Reqnroll BDD scenarios (WebApplicationFactory + SQLite)
```
