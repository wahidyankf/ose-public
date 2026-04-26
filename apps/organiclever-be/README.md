# organiclever-be

OrganicLever Backend - F#/Giraffe REST API

## Overview

- **Framework**: Giraffe (functional ASP.NET Core)
- **Language**: F#
- **Runtime**: .NET 10
- **Port**: 8202
- **API Base**: `/api/v1`
- **Database**: none in v0 (no entities yet)
- **Testing**: TickSpec (BDD), xunit, AltCover

This is the backend service for the OrganicLever productivity tracker. v0 ships only the
health endpoint; productivity-tracking endpoints will be added in future iterations.

## Prerequisites

- **.NET 10 SDK** (`dotnet --version` should show 10.x)
- **Fantomas** (`dotnet tool install -g fantomas`)
- **FSharpLint** (`dotnet tool install -g dotnet-fsharplint`)

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

# Run fast quality gate (BDD unit tests + AltCover coverage)
nx run organiclever-be:test:quick

# Run isolated unit tests only
nx run organiclever-be:test:unit

# Lint with Fantomas, FSharpLint, and G-Research analyzers
nx lint organiclever-be

# Type check (build with TreatWarningsAsErrors)
nx typecheck organiclever-be
```

## API Endpoints

| Method | Path             | Auth | Description  |
| ------ | ---------------- | ---- | ------------ |
| GET    | `/api/v1/health` | No   | Health check |

## Environment Variables

The v0 surface has no required environment variables; the health endpoint runs without any
configuration. Future endpoints will document their own variables here.

## Testing Strategy

| Tier     | Nx Target    | Description                                        |
| -------- | ------------ | -------------------------------------------------- |
| Unit     | `test:unit`  | BDD scenarios via TickSpec + WebApplicationFactory |
| Coverage | `test:quick` | Unit tests + AltCover coverage (90% required)      |

All test levels consume the same Gherkin specs from `specs/apps/organiclever/be/gherkin/`.

## Architecture

```
apps/organiclever-be/
├── src/
│   └── OrganicLeverBe/
│       ├── OrganicLeverBe.fsproj    # Main project (net10.0, Giraffe)
│       ├── Program.fs               # Entry point, routing, DI
│       ├── Domain/
│       │   └── Types.fs             # Domain error types (kept for future features)
│       └── Handlers/
│           └── HealthHandler.fs     # GET /api/v1/health
├── tests/
│   └── OrganicLeverBe.Tests/
│       ├── State.fs                 # BDD step state record
│       ├── HttpTestFixture.fs       # WebApplicationFactory wrapper
│       ├── Unit/                    # Unit BDD runner (Category=Unit)
│       └── Integration/             # Integration BDD runner and step definitions
├── global.json                      # SDK version pin (10.0.x)
└── project.json                     # Nx targets
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- [Backend Gherkin Specs](../../specs/apps/organiclever/be/gherkin/)
- [Nx Target Standards](../../governance/development/infra/nx-targets.md)
