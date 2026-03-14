# demo-be-fsharp-giraffe

Demo Backend - F#/Giraffe REST API

## Overview

- **Framework**: Giraffe (functional ASP.NET Core)
- **Language**: F#
- **Runtime**: .NET 10
- **Port**: 8201
- **API Base**: `/api/v1`
- **Security**: Stateless JWT authentication
- **Database**: PostgreSQL (dev/prod) / SQLite (tests)
- **Testing**: TickSpec (BDD), xunit, Microsoft.AspNetCore.Mvc.Testing

This application mirrors the same REST API contract as `demo-be-golang-gin` (Go/Gin) and
`demo-be-elixir-phoenix` (Elixir/Phoenix), providing an F#/Giraffe alternative implementation.

## Prerequisites

- **.NET 10 SDK** (`~/.dotnet/dotnet --version` should show 10.x)
- **Fantomas** (`dotnet tool install -g fantomas`)
- **FSharpLint** (`dotnet tool install -g dotnet-fsharplint`)
- **PostgreSQL 17** (via Docker Compose for dev)

## Quick Start

```bash
# Restore NuGet packages
dotnet restore src/DemoBeFsgi/DemoBeFsgi.fsproj

# Run in development mode
dotnet run --project src/DemoBeFsgi/DemoBeFsgi.fsproj

# Or via Nx
nx start demo-be-fsharp-giraffe
```

The application starts on `http://localhost:8201`.

## Nx Targets

```bash
# Build release artifact
nx build demo-be-fsharp-giraffe

# Start development server with hot reload
nx dev demo-be-fsharp-giraffe

# Start production server
nx start demo-be-fsharp-giraffe

# Run fast quality gate (BDD + unit tests with SQLite in-memory + coverage + format + lint)
nx run demo-be-fsharp-giraffe:test:quick

# Run isolated unit tests only (pure function tests, no WebApplicationFactory)
nx run demo-be-fsharp-giraffe:test:unit

# Run integration tests against real PostgreSQL via Docker Compose
nx run demo-be-fsharp-giraffe:test:integration

# Lint with FSharpLint
nx lint demo-be-fsharp-giraffe

# Type check (build with TreatWarningsAsErrors)
nx typecheck demo-be-fsharp-giraffe
```

## API Endpoints

| Method | Path                                            | Auth  | Description           |
| ------ | ----------------------------------------------- | ----- | --------------------- |
| GET    | `/health`                                       | No    | Health check          |
| POST   | `/api/v1/auth/register`                         | No    | Register new user     |
| POST   | `/api/v1/auth/login`                            | No    | Login, return JWT     |
| POST   | `/api/v1/auth/refresh`                          | JWT   | Refresh access token  |
| POST   | `/api/v1/auth/logout`                           | JWT   | Logout (revoke token) |
| POST   | `/api/v1/auth/logout-all`                       | JWT   | Revoke all tokens     |
| GET    | `/api/v1/users/me`                              | JWT   | Current user profile  |
| PUT    | `/api/v1/users/me/password`                     | JWT   | Change password       |
| DELETE | `/api/v1/users/me`                              | JWT   | Self-deactivate       |
| GET    | `/api/v1/admin/users`                           | Admin | List/search users     |
| PUT    | `/api/v1/admin/users/{id}/status`               | Admin | Enable/disable user   |
| POST   | `/api/v1/admin/users/{id}/reset-password-token` | Admin | Generate reset token  |
| POST   | `/api/v1/expenses`                              | JWT   | Create expense        |
| GET    | `/api/v1/expenses`                              | JWT   | List expenses         |
| GET    | `/api/v1/expenses/{id}`                         | JWT   | Get expense           |
| PUT    | `/api/v1/expenses/{id}`                         | JWT   | Update expense        |
| DELETE | `/api/v1/expenses/{id}`                         | JWT   | Delete expense        |
| GET    | `/api/v1/expenses/report`                       | JWT   | P&L report            |
| POST   | `/api/v1/expenses/{id}/attachments`             | JWT   | Upload attachment     |
| GET    | `/api/v1/expenses/{id}/attachments`             | JWT   | List attachments      |
| DELETE | `/api/v1/expenses/{id}/attachments/{aid}`       | JWT   | Delete attachment     |
| GET    | `/api/v1/tokens/claims`                         | JWT   | Decode JWT claims     |
| GET    | `/.well-known/jwks.json`                        | No    | JWKS endpoint         |

## Environment Variables

| Variable          | Required       | Default                                          | Description                                                                                                                                           |
| ----------------- | -------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | Yes (non-test) | —                                                | PostgreSQL connection string (e.g., `Host=localhost;Database=demo_be_fsharp_giraffe;Username=demo_be_fsharp_giraffe;Password=demo_be_fsharp_giraffe`) |
| `APP_JWT_SECRET`  | Yes (prod)     | `change-me-in-production-at-least-32-chars-long` | JWT signing secret (min 32 chars for HS256)                                                                                                           |
| `ASPNETCORE_URLS` | No             | `http://+:8201`                                  | Override the listening URL                                                                                                                            |

**Security note**: Set a strong `APP_JWT_SECRET` in production. Never commit real secrets to
version control.

## Docker Compose

Docker Compose configuration for local development will be added in a later phase under
`infra/dev/demo-be-fsharp-giraffe/`. It will start PostgreSQL 17 and the F#/Giraffe application with
volume-mounted source code for hot reload.

For integration testing against real PostgreSQL, use `docker-compose.integration.yml`:

```bash
# Run integration tests against real PostgreSQL (via Nx)
nx run demo-be-fsharp-giraffe:test:integration

# Or directly with docker compose
docker compose -f docker-compose.integration.yml down -v
docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build
```

## Architecture

```
apps/demo-be-fsharp-giraffe/
├── src/
│   └── DemoBeFsgi/
│       ├── DemoBeFsgi.fsproj    # Main project (net10.0, Giraffe)
│       └── Program.fs           # Entry point, Giraffe web app config
├── tests/
│   └── DemoBeFsgi.Tests/
│       ├── DemoBeFsgi.Tests.fsproj  # Test project (TickSpec, xunit, AltCover)
│       ├── TestFixture.fs           # WebApplicationFactory (SQLite or PostgreSQL)
│       ├── State.fs                 # BDD step state record
│       ├── Unit/                    # Isolated unit tests (Category=Unit)
│       └── Integration/             # BDD step definitions and feature runner
├── docker-compose.integration.yml   # PostgreSQL + test-runner for real DB tests
├── Dockerfile.integration           # Test image build (mcr.microsoft.com/dotnet/sdk:10.0)
├── global.json                  # SDK version pin (10.0.x)
├── .editorconfig                # F# formatting (Fantomas settings)
└── project.json                 # Nx targets
```

## Testing Strategy

Three levels of tests provide fast feedback at every stage:

| Tier        | Nx Target          | Tool                                        | Database             | Description                                   | Requires External Service |
| ----------- | ------------------ | ------------------------------------------- | -------------------- | --------------------------------------------- | ------------------------- |
| Unit        | `test:unit`        | xunit (`Category=Unit`)                     | None                 | Isolated pure functions and domain logic      | No                        |
| BDD (quick) | `test:quick`       | TickSpec + WebApplicationFactory + AltCover | SQLite in-memory     | Full BDD scenarios, in-process, with coverage | No                        |
| Integration | `test:integration` | TickSpec + WebApplicationFactory + Docker   | PostgreSQL 17 (real) | Full BDD scenarios against real PostgreSQL    | Yes (Docker)              |
| E2E         | (demo-be-e2e)      | Playwright                                  | PostgreSQL 17 (real) | Full HTTP against running server              | Yes (port 8201)           |

The `TestWebAppFactory` automatically switches database providers based on the `DATABASE_URL`
environment variable:

- **`DATABASE_URL` absent** (unit/`test:quick` mode): uses SQLite in-memory with a shared
  connection per scenario — no external services required.
- **`DATABASE_URL` present** (docker-compose integration mode): delegates to the production
  Npgsql/PostgreSQL registration in `Program.fs` — uses real PostgreSQL.

All BDD tests share the same Gherkin feature files from `specs/apps/demo/be/gherkin/` as
`demo-be-golang-gin`, `demo-be-elixir-phoenix`, and other backend implementations.

## See Also

- [demo-be-java-springboot](../demo-be-java-springboot/README.md) - Spring Boot implementation (same API)
- [demo-be-elixir-phoenix](../demo-be-elixir-phoenix/README.md) - Elixir/Phoenix implementation (same API)
- [demo-be-e2e](../demo-be-e2e/README.md) - Shared E2E tests
- [Nx Target Standards](../../governance/development/infra/nx-targets.md)
