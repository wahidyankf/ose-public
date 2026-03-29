# organiclever-be

OrganicLever Backend - F#/Giraffe REST API

## Overview

- **Framework**: Giraffe (functional ASP.NET Core)
- **Language**: F#
- **Runtime**: .NET 10
- **Port**: 8202
- **API Base**: `/api/v1`
- **Security**: Stateless JWT authentication with Google OAuth
- **Database**: PostgreSQL (dev/prod) / SQLite (tests)
- **Testing**: TickSpec (BDD), xunit, AltCover

This is the backend service for the OrganicLever productivity tracker. Authentication is
Google OAuth only — no email/password registration or login.

## Prerequisites

- **.NET 10 SDK** (`dotnet --version` should show 10.x)
- **Fantomas** (`dotnet tool install -g fantomas`)
- **FSharpLint** (`dotnet tool install -g dotnet-fsharplint`)
- **PostgreSQL 17** (via Docker Compose for integration tests)

## Quick Start

```bash
# Restore NuGet packages
dotnet restore src/OrganicLeverBe/OrganicLeverBe.fsproj

# Run in development mode
dotnet run --project src/OrganicLeverBe/OrganicLeverBe.fsproj

# Or via Nx
nx start organiclever-be
```

The application starts on `http://localhost:8202`.

## Nx Targets

```bash
# Build release artifact
nx build organiclever-be

# Start development server with hot reload
nx dev organiclever-be

# Start production server
nx start organiclever-be

# Run fast quality gate (BDD + unit tests with SQLite in-memory + coverage)
nx run organiclever-be:test:quick

# Run isolated unit tests only
nx run organiclever-be:test:unit

# Run integration tests against real PostgreSQL via Docker Compose
nx run organiclever-be:test:integration

# Lint with Fantomas, FSharpLint, and G-Research analyzers
nx lint organiclever-be

# Type check (build with TreatWarningsAsErrors)
nx typecheck organiclever-be
```

## API Endpoints

| Method | Path                    | Auth | Description                     |
| ------ | ----------------------- | ---- | ------------------------------- |
| GET    | `/api/v1/health`        | No   | Health check                    |
| POST   | `/api/v1/auth/google`   | No   | Login with Google ID token      |
| POST   | `/api/v1/auth/refresh`  | No   | Refresh access token (rotation) |
| GET    | `/api/v1/auth/me`       | JWT  | Get current user profile        |
| POST   | `/api/v1/test/reset-db` | No   | Reset database (test API only)  |

## Environment Variables

| Variable           | Required       | Default                | Description                                       |
| ------------------ | -------------- | ---------------------- | ------------------------------------------------- |
| `DATABASE_URL`     | Yes (non-test) | —                      | PostgreSQL connection string                      |
| `APP_JWT_SECRET`   | Yes (prod)     | dev secret (32+ chars) | JWT signing secret (min 32 chars for HS256)       |
| `GOOGLE_CLIENT_ID` | Yes (prod)     | —                      | Google OAuth Client ID                            |
| `APP_ENV`          | No             | —                      | Set to `test` to bypass Google token verification |
| `ENABLE_TEST_API`  | No             | —                      | Set to `true` to enable test reset endpoint       |

## Authentication

Authentication is Google OAuth only. The flow:

1. Frontend obtains a Google ID token via Google Sign-In
2. Frontend sends the ID token to `POST /api/v1/auth/google`
3. Backend verifies the ID token with Google, creates or updates the user record
4. Backend returns an access token (15-minute JWT) and a refresh token (7-day, single-use)
5. Frontend uses the access token for authenticated requests
6. Frontend rotates the refresh token before expiry via `POST /api/v1/auth/refresh`

**Refresh token rotation**: Each refresh call deletes the old token and creates a new one.
This is a single-use rotation model — a token can only be used once.

**Test mode**: When `APP_ENV=test`, Google token verification is bypassed. Test tokens use the
format `test:<email>:<name>:<googleId>`. This enables integration tests without real Google credentials.

## Database Migrations

This application uses [DbUp](https://dbup.readthedocs.io/) for PostgreSQL schema migrations.

**Migration file location**: `src/OrganicLeverBe/db/migrations/`

Migration files follow the naming convention `NNN-description.sql`. DbUp applies them in
lexicographic order and tracks applied scripts in a `schemaversions` table.

**SQLite test note**: DbUp does not support SQLite. Unit tests use SQLite in-memory with EF
Core's `EnsureCreated()`. Integration tests use real PostgreSQL via docker-compose.

## Testing Strategy

| Tier        | Nx Target          | Database            | Description                                   |
| ----------- | ------------------ | ------------------- | --------------------------------------------- |
| Unit        | `test:unit`        | SQLite in-memory    | BDD scenarios with mocked repositories        |
| Coverage    | `test:quick`       | SQLite in-memory    | Unit tests + AltCover coverage (90% required) |
| Integration | `test:integration` | PostgreSQL (Docker) | BDD scenarios against real PostgreSQL         |

All test levels consume the same Gherkin specs from `specs/apps/organiclever/be/gherkin/`.

## Architecture

```
apps/organiclever-be/
├── src/
│   └── OrganicLeverBe/
│       ├── OrganicLeverBe.fsproj    # Main project (net10.0, Giraffe)
│       ├── Program.fs               # Entry point, routing, DI
│       ├── Domain/
│       │   └── Types.fs             # Domain error types
│       ├── Auth/
│       │   ├── GoogleAuthService.fs # Google ID token verification
│       │   ├── JwtService.fs        # JWT generation/validation
│       │   └── JwtMiddleware.fs     # Bearer token auth middleware
│       ├── Handlers/
│       │   ├── HealthHandler.fs     # GET /api/v1/health
│       │   ├── AuthHandler.fs       # Google login, refresh, me
│       │   └── TestHandler.fs       # Test-only reset-db
│       ├── Infrastructure/
│       │   ├── AppDbContext.fs      # EF Core DbContext
│       │   └── Repositories/
│       │       ├── RepositoryTypes.fs  # Repository function records
│       │       └── EfRepositories.fs   # EF Core implementations
│       ├── Contracts/
│       │   └── ContractWrappers.fs  # CLIMutable request DTOs
│       └── db/migrations/
│           └── 001-initial-schema.sql
├── tests/
│   └── OrganicLeverBe.Tests/
│       ├── State.fs                 # BDD step state record
│       ├── TestFixture.fs           # DB context factory (SQLite or PostgreSQL)
│       ├── DirectServices.fs        # Direct service layer (no HTTP)
│       ├── InMemory/                # In-memory repository implementations
│       ├── Unit/                    # Unit BDD runner (Category=Unit)
│       └── Integration/             # Integration BDD runner and step definitions
├── docker-compose.integration.yml   # PostgreSQL + test-runner
├── Dockerfile.integration           # Test image build
├── global.json                      # SDK version pin (10.0.x)
└── project.json                     # Nx targets
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- [Backend Gherkin Specs](../../specs/apps/organiclever/be/gherkin/)
- [Nx Target Standards](../../governance/development/infra/nx-targets.md)
- [OrganicLever Fullstack Evolution Plan](../../plans/in-progress/2026-03-28__organiclever-fullstack-evolution/)
