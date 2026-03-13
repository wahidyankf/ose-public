# Technical Design: demo-be-fsharp-giraffe

## BDD Integration Test: TickSpec + xUnit

Integration tests parse the canonical `.feature` files in `specs/apps/demo/be/gherkin/` using
**TickSpec**, an F#-native Gherkin runner that integrates with xUnit. TickSpec discovers
feature files at test time and maps step definitions via regex-annotated methods.

HTTP calls use ASP.NET Core's `TestServer` (in-process — no live server needed, matching
`demo-be-java-springboot`'s MockMvc approach). The database layer uses EF Core's SQLite in-memory
provider for full isolation and determinism.

Step definitions follow F# module conventions:

```fsharp
// Tests/Integration/Steps/HealthSteps.fs
module DemoBefsgi.Tests.Integration.Steps.HealthSteps

open TickSpec
open System.Net
open System.Net.Http

let [<Given>] ``the API is running`` (state: State) =
    // TestServer is initialized in test fixture
    state

let [<When>] ``an operations engineer sends GET /health`` (state: State) =
    let response = state.Client.GetAsync("/health") |> Async.AwaitTask |> Async.RunSynchronously
    { state with Response = Some response }

let [<Then>] ``the response status code should be (\d+)`` (code: int) (state: State) =
    let actual = int state.Response.Value.StatusCode
    Assert.Equal(code, actual)
    state
```

### Feature File Path Resolution

Feature files are referenced via relative paths from the test project to the workspace root.
The `.fsproj` test project includes a build target that copies feature files to the output
directory:

```xml
<Target Name="CopyGherkinSpecs" BeforeTargets="Build">
  <ItemGroup>
    <GherkinFiles Include="$(ProjectDir)..\..\..\..\specs\apps\demo-be\gherkin\**\*.feature" />
  </ItemGroup>
  <Copy SourceFiles="@(GherkinFiles)"
        DestinationFolder="$(OutputPath)specs\%(RecursiveDir)" />
</Target>
```

TickSpec discovers features from the output directory at runtime.

---

## Application Architecture

### Project Structure

```
apps/demo-be-fsharp-giraffe/
├── src/
│   └── DemoBeFsgi/
│       ├── DemoBeFsgi.fsproj              # Main application
│       ├── Program.fs                      # Entry point + ASP.NET Core configuration
│       ├── Domain/
│       │   ├── Types.fs                    # Domain types (DUs, records)
│       │   ├── User.fs                     # User entity + validation
│       │   ├── Expense.fs                  # Expense entity + currency handling
│       │   └── Attachment.fs               # Attachment entity
│       ├── Infrastructure/
│       │   ├── AppDbContext.fs              # EF Core DbContext
│       │   ├── Repositories.fs             # Repository implementations
│       │   └── PasswordHasher.fs           # BCrypt wrapper
│       ├── Auth/
│       │   ├── JwtService.fs               # JWT generation + validation
│       │   ├── JwtMiddleware.fs            # Authentication middleware
│       │   └── AdminMiddleware.fs          # Admin role check
│       └── Handlers/
│           ├── HealthHandler.fs            # GET /health
│           ├── AuthHandler.fs              # register, login, refresh, logout
│           ├── UserHandler.fs              # profile, password change, deactivate
│           ├── AdminHandler.fs             # user management
│           ├── ExpenseHandler.fs           # CRUD + reporting
│           ├── AttachmentHandler.fs        # file upload/list/delete
│           └── TokenHandler.fs             # claims, JWKS
├── tests/
│   └── DemoBeFsgi.Tests/
│       ├── DemoBeFsgi.Tests.fsproj         # Test project
│       ├── TestFixture.fs                  # TestServer + HttpClient setup
│       ├── State.fs                        # Step state record
│       ├── Unit/
│       │   ├── UserValidationTests.fs      # Changeset/validation unit tests
│       │   ├── CurrencyTests.fs            # Decimal precision tests
│       │   └── PasswordHasherTests.fs      # BCrypt wrapper tests
│       └── Integration/
│           └── Steps/
│               ├── CommonSteps.fs          # Shared: status code, API running
│               ├── AuthSteps.fs            # Register, login steps
│               ├── TokenLifecycleSteps.fs
│               ├── UserAccountSteps.fs
│               ├── SecuritySteps.fs
│               ├── TokenManagementSteps.fs
│               ├── AdminSteps.fs
│               ├── ExpenseSteps.fs
│               ├── CurrencySteps.fs
│               ├── UnitHandlingSteps.fs
│               ├── ReportingSteps.fs
│               └── AttachmentSteps.fs
├── global.json                             # Pin .NET SDK version
├── .editorconfig                           # F# formatting settings
├── .fantomas                               # Fantomas config
├── project.json                            # Nx targets
└── README.md
```

### F# File Ordering (Critical)

F# requires files to be listed in dependency order in `.fsproj`. The compilation order must be:

1. `Domain/Types.fs` — foundational types (no dependencies)
2. `Domain/User.fs` — depends on Types
3. `Domain/Expense.fs` — depends on Types
4. `Domain/Attachment.fs` — depends on Types, Expense
5. `Infrastructure/AppDbContext.fs` — depends on Domain
6. `Infrastructure/Repositories.fs` — depends on Domain, AppDbContext
7. `Infrastructure/PasswordHasher.fs` — standalone
8. `Auth/JwtService.fs` — depends on Domain
9. `Auth/JwtMiddleware.fs` — depends on JwtService
10. `Auth/AdminMiddleware.fs` — depends on JwtMiddleware
11. `Handlers/*.fs` — depend on Domain, Infrastructure, Auth
12. `Program.fs` — depends on everything (composition root)

---

## Key Design Decisions

### Giraffe HttpHandler Composition

All routes use Giraffe's `HttpHandler` type and fish operator (`>=>`) for composition:

```fsharp
let webApp : HttpHandler =
    choose [
        GET >=> route "/health" >=> HealthHandler.get
        subRoute "/api/v1" (
            choose [
                subRoute "/auth" (
                    choose [
                        POST >=> route "/register" >=> AuthHandler.register
                        POST >=> route "/login" >=> AuthHandler.login
                        POST >=> route "/refresh" >=> jwtAuth >=> AuthHandler.refresh
                        POST >=> route "/logout" >=> jwtAuth >=> AuthHandler.logout
                        POST >=> route "/logout-all" >=> jwtAuth >=> AuthHandler.logoutAll
                    ])
                subRoute "/users" (
                    jwtAuth >=> choose [
                        GET >=> route "/me" >=> UserHandler.getProfile
                        PUT >=> route "/me/password" >=> UserHandler.changePassword
                        DELETE >=> route "/me" >=> UserHandler.deactivate
                    ])
                subRoute "/admin" (
                    jwtAuth >=> adminAuth >=> choose [
                        GET >=> route "/users" >=> AdminHandler.listUsers
                        PUT >=> routef "/users/%O/status" AdminHandler.setStatus
                        POST >=> routef "/users/%O/reset-password-token" AdminHandler.resetToken
                    ])
                subRoute "/expenses" (
                    jwtAuth >=> choose [
                        POST >=> route "" >=> ExpenseHandler.create
                        GET >=> route "" >=> ExpenseHandler.list
                        GET >=> route "/report" >=> ExpenseHandler.report
                        GET >=> routef "/%O" ExpenseHandler.get
                        PUT >=> routef "/%O" ExpenseHandler.update
                        DELETE >=> routef "/%O" ExpenseHandler.delete
                        POST >=> routef "/%O/attachments" AttachmentHandler.upload
                        GET >=> routef "/%O/attachments" AttachmentHandler.list
                        DELETE >=> routef "/%O/attachments/%O" AttachmentHandler.delete
                    ])
                subRoute "/tokens" (
                    jwtAuth >=> choose [
                        GET >=> route "/claims" >=> TokenHandler.claims
                    ])
            ])
        GET >=> route "/.well-known/jwks.json" >=> TokenHandler.jwks
        RequestErrors.NOT_FOUND "Not Found"
    ]
```

### Railway-Oriented Error Handling

Domain operations return `Result<'T, DomainError>` using F#'s native Result type:

```fsharp
type DomainError =
    | ValidationError of field: string * message: string
    | NotFound of entity: string
    | Forbidden of message: string
    | Conflict of message: string
    | Unauthorized of message: string
    | FileTooLarge of limit: int64

let toHttpResponse (error: DomainError) : HttpHandler =
    match error with
    | ValidationError (field, _) -> RequestErrors.BAD_REQUEST {| message = $"Validation failed for field: {field}" |}
    | NotFound _ -> RequestErrors.NOT_FOUND {| message = "Not found" |}
    | Forbidden msg -> RequestErrors.FORBIDDEN {| message = msg |}
    | Conflict msg -> RequestErrors.CONFLICT {| message = msg |}
    | Unauthorized msg -> RequestErrors.UNAUTHORIZED "Bearer" {| message = msg |}
    | FileTooLarge _ -> setStatusCode 413 >=> json {| message = "File size exceeds the maximum allowed limit" |}
```

### Database: EF Core with PostgreSQL

Production uses PostgreSQL via Npgsql. Integration tests use SQLite in-memory for isolation:

```fsharp
// Production (Program.fs)
services.AddDbContext<AppDbContext>(fun options ->
    options.UseNpgsql(connectionString) |> ignore)

// Test (TestFixture.fs)
services.AddDbContext<AppDbContext>(fun options ->
    options.UseSqlite("DataSource=:memory:") |> ignore)
```

### JWT Strategy

HMAC-SHA256 signing using `System.IdentityModel.Tokens.Jwt`. Access tokens (short-lived) and
refresh tokens (long-lived) follow the same pattern as demo-be-java-springboot:

- Access token: 15 minutes
- Refresh token: 7 days
- Secret from `APP_JWT_SECRET` environment variable
- Claims: `sub` (user ID), `username`, `role`, `exp`, `iat`, `jti`

### Currency Precision

Amounts stored as `decimal` with currency-specific precision enforced at the domain level:

```fsharp
let validateAmount (currency: string) (amount: decimal) =
    match currency.ToUpperInvariant() with
    | "USD" -> if amount <> System.Math.Round(amount, 2) then Error (ValidationError ("amount", "USD requires 2 decimal places")) else Ok amount
    | "IDR" -> if amount <> System.Math.Round(amount, 0) then Error (ValidationError ("amount", "IDR requires 0 decimal places")) else Ok amount
    | _ -> Error (ValidationError ("currency", $"Unsupported currency: {currency}"))
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-fsharp-giraffe",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-fsharp-giraffe/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet publish src/DemoBeFsgi/DemoBeFsgi.fsproj -c Release -o dist",
        "cwd": "apps/demo-be-fsharp-giraffe"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet watch run --project src/DemoBeFsgi/DemoBeFsgi.fsproj",
        "cwd": "apps/demo-be-fsharp-giraffe"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet run --project src/DemoBeFsgi/DemoBeFsgi.fsproj",
        "cwd": "apps/demo-be-fsharp-giraffe"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "dotnet test tests/DemoBeFsgi.Tests/DemoBeFsgi.Tests.fsproj --collect:\"XPlat Code Coverage\" --results-directory ./coverage -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=lcov",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-be-fsharp-giraffe/coverage/**/coverage.info 90)",
          "dotnet fantomas --check src/ tests/",
          "dotnet fsharplint lint src/DemoBeFsgi/DemoBeFsgi.fsproj"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-fsharp-giraffe"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet test tests/DemoBeFsgi.Tests/DemoBeFsgi.Tests.fsproj --filter Category=Unit",
        "cwd": "apps/demo-be-fsharp-giraffe"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet test tests/DemoBeFsgi.Tests/DemoBeFsgi.Tests.fsproj --filter Category=Integration",
        "cwd": "apps/demo-be-fsharp-giraffe"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/**/*.fs",
        "{projectRoot}/tests/**/*.fs",
        "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet fsharplint lint src/DemoBeFsgi/DemoBeFsgi.fsproj",
        "cwd": "apps/demo-be-fsharp-giraffe"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet build src/DemoBeFsgi/DemoBeFsgi.fsproj --no-restore /p:TreatWarningsAsErrors=true",
        "cwd": "apps/demo-be-fsharp-giraffe"
      }
    }
  },
  "tags": ["type:app", "platform:giraffe", "lang:fsharp", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> coverage collection must finish before `rhino-cli` validates the LCOV output. Fantomas
> check and FSharpLint run after tests to avoid masking test failures.
>
> **Note on `test:integration` caching**: Integration tests use ASP.NET Core TestServer with
> SQLite in-memory — no external services. Fully deterministic and safe to cache.

---

## Infrastructure

### Port Assignment

| Service                 | Port                                               |
| ----------------------- | -------------------------------------------------- |
| demo-be-db              | 5432                                               |
| demo-be-java-springboot | 8201                                               |
| demo-be-elixir-phoenix  | 8201 (same port — mutually exclusive alternatives) |
| demo-be-fsharp-giraffe  | 8201 (same port — mutually exclusive alternatives) |

### Docker Compose (`infra/dev/demo-be-fsharp-giraffe/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_fsharp_giraffe
      POSTGRES_USER: demo_be_fsharp_giraffe
      POSTGRES_PASSWORD: demo_be_fsharp_giraffe
    ports:
      - "5432:5432"
    volumes:
      - demo-be-fsharp-giraffe-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_fsharp_giraffe"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-fsharp-giraffe-network

  demo-be-fsharp-giraffe:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-fsharp-giraffe
    ports:
      - "8201:8201"
    environment:
      - ASPNETCORE_URLS=http://+:8201
      - DATABASE_URL=Host=demo-be-db;Database=demo_be_fsharp_giraffe;Username=demo_be_fsharp_giraffe;Password=demo_be_fsharp_giraffe
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
    volumes:
      - ../../../apps/demo-be-fsharp-giraffe:/workspace:rw
      - ../../../specs/apps/demo/be:/specs/apps/demo/be:ro
    depends_on:
      demo-be-db:
        condition: service_healthy
    command: sh -c "dotnet ef database update --project src/DemoBeFsgi/DemoBeFsgi.fsproj && dotnet watch run --project src/DemoBeFsgi/DemoBeFsgi.fsproj"
    networks:
      - demo-be-fsharp-giraffe-network

volumes:
  demo-be-fsharp-giraffe-db-data:

networks:
  demo-be-fsharp-giraffe-network:
```

### Dockerfile.be.dev

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine

RUN dotnet tool install -g dotnet-ef && \
    dotnet tool install -g fantomas

ENV PATH="$PATH:/root/.dotnet/tools"

WORKDIR /workspace

CMD ["dotnet", "watch", "run", "--project", "src/DemoBeFsgi/DemoBeFsgi.fsproj"]
```

---

## GitHub Actions

### New Workflow: `e2e-demo-be-fsharp-giraffe.yml`

Mirrors `e2e-demo-be-java-springboot.yml` with:

- Name: `E2E - Demo BE (FSGI)`
- Schedule: same crons as jasb/exph
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-fsgi` → docker down (always)

### Updated Workflow: `main-ci.yml`

Add after existing Java/Elixir setup:

```yaml
- name: Setup .NET SDK
  uses: actions/setup-dotnet@v4
  with:
    dotnet-version: "9.0.x"

- name: Upload coverage — demo-be-fsharp-giraffe
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-fsharp-giraffe/coverage/**/coverage.info
    flags: demo-be-fsharp-giraffe
    fail_ci_if_error: false
```

---

## Dependencies Summary

### NuGet Packages (DemoBeFsgi.fsproj)

| Package                               | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| Giraffe                               | Functional HTTP handlers on ASP.NET Core   |
| Microsoft.EntityFrameworkCore         | ORM                                        |
| Npgsql.EntityFrameworkCore.PostgreSQL | PostgreSQL provider                        |
| Microsoft.EntityFrameworkCore.Sqlite  | SQLite for tests                           |
| System.IdentityModel.Tokens.Jwt       | JWT creation/validation                    |
| BCrypt.Net-Next                       | Password hashing                           |
| FSharp.SystemTextJson                 | F# type serialization for System.Text.Json |

### NuGet Packages (DemoBeFsgi.Tests.fsproj)

| Package                          | Purpose                            |
| -------------------------------- | ---------------------------------- |
| TickSpec                         | F#-native Gherkin BDD runner       |
| xunit                            | Test framework                     |
| xunit.runner.visualstudio        | Test runner                        |
| Microsoft.AspNetCore.Mvc.Testing | TestServer + WebApplicationFactory |
| coverlet.collector               | Code coverage (LCOV output)        |
| Microsoft.NET.Test.Sdk           | Test SDK                           |

### .NET Tools (global or local)

| Tool              | Purpose                       |
| ----------------- | ----------------------------- |
| fantomas          | F# code formatter (MANDATORY) |
| dotnet-fsharplint | F# linter                     |
| dotnet-ef         | EF Core migrations CLI        |
