# Technical Design: demo-be-csharp-aspnetcore

## BDD Integration Tests: Reqnroll + WebApplicationFactory

Integration tests parse the canonical `.feature` files in `specs/apps/demo-be/gherkin/` using
**Reqnroll**, the actively maintained successor to SpecFlow. Reqnroll integrates natively with
xUnit and discovers step definitions via attributes on plain C# methods.

HTTP calls use ASP.NET Core's `WebApplicationFactory` (in-process — no live server needed,
matching `demo-be-java-springboot`'s MockMvc approach and `demo-be-fsharp-giraffe`'s TickSpec approach). The
database layer uses EF Core's SQLite in-memory provider for full isolation and determinism.

Step definitions follow Reqnroll conventions using `[Given]`, `[When]`, and `[Then]`
attributes:

```csharp
// Tests/Integration/Steps/HealthSteps.cs
using Reqnroll;
using FluentAssertions;

[Binding]
public class HealthSteps
{
    private readonly HttpClient _client;
    private HttpResponseMessage? _response;

    public HealthSteps(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [When("an operations engineer sends GET /health")]
    public async Task WhenGetHealth()
    {
        _response = await _client.GetAsync("/health");
    }

    [Then("the response status code should be {int}")]
    public void ThenStatusCode(int expectedCode)
    {
        _response.Should().NotBeNull();
        ((int)_response!.StatusCode).Should().Be(expectedCode);
    }
}
```

### Feature File Path Resolution

Feature files are referenced from the `specs/apps/demo-be/gherkin/` workspace root. Reqnroll
discovers feature files via the `FeatureFiles` item group in the `.csproj`:

```xml
<ItemGroup>
  <FeatureFiles Include="..\..\..\..\specs\apps\demo-be\gherkin\**\*.feature" />
</ItemGroup>
```

Reqnroll copies feature files to the output directory at build time and resolves them via the
configured `FeatureFilesBuildAction` (`None` or `Content`). Step bindings are discovered
via assembly scanning — no explicit registration needed.

### Reqnroll vs SpecFlow

Reqnroll is chosen over SpecFlow because:

- **Active maintenance**: Reqnroll is the community-maintained fork after SpecFlow was
  discontinued (Tricentis halted open-source development in 2023)
- **xUnit native**: First-class xUnit integration with `[assembly: TestFramework]`
- **No license server**: Reqnroll is fully open-source (MIT), no license activation required
- **Feature parity**: Identical Gherkin syntax and attribute-based step definitions to SpecFlow
- **Active NuGet releases**: Regular releases targeting .NET 8/9+

---

## Application Architecture

### Project Structure

```
apps/demo-be-csharp-aspnetcore/
├── src/
│   └── DemoBeCsas/
│       ├── DemoBeCsas.csproj              # Main application
│       ├── Program.cs                      # Entry point + ASP.NET Core configuration
│       ├── Domain/
│       │   ├── Types.cs                    # Enums: Currency, Role, UserStatus
│       │   ├── Errors.cs                   # Domain error hierarchy (sealed classes)
│       │   ├── User.cs                     # User record + validation
│       │   ├── Expense.cs                  # Expense record + currency precision
│       │   └── Attachment.cs               # Attachment record
│       ├── Infrastructure/
│       │   ├── AppDbContext.cs             # EF Core DbContext
│       │   ├── Models/
│       │   │   ├── UserModel.cs            # EF Core entity
│       │   │   ├── ExpenseModel.cs         # EF Core entity
│       │   │   ├── AttachmentModel.cs      # EF Core entity
│       │   │   └── RevokedTokenModel.cs    # EF Core entity
│       │   ├── Repositories/
│       │   │   ├── UserRepository.cs       # User CRUD
│       │   │   ├── ExpenseRepository.cs    # Expense CRUD + summary
│       │   │   ├── AttachmentRepository.cs # Attachment management
│       │   │   └── RevokedTokenRepository.cs # Token revocation
│       │   └── PasswordHasher.cs           # BCrypt.Net-Next wrapper
│       ├── Auth/
│       │   ├── JwtService.cs               # JWT generation + validation
│       │   └── AuthorizationExtensions.cs  # Middleware + policy helpers
│       └── Endpoints/
│           ├── HealthEndpoints.cs          # GET /health
│           ├── AuthEndpoints.cs            # register, login, refresh, logout
│           ├── UserEndpoints.cs            # profile, password, deactivate
│           ├── AdminEndpoints.cs           # user management
│           ├── ExpenseEndpoints.cs         # CRUD + summary
│           ├── ReportEndpoints.cs          # P&L
│           ├── AttachmentEndpoints.cs      # file upload/list/delete
│           └── TokenEndpoints.cs           # claims, JWKS
├── tests/
│   └── DemoBeCsas.Tests/
│       ├── DemoBeCsas.Tests.csproj         # Test project
│       ├── TestWebApplicationFactory.cs    # WebApplicationFactory + SQLite in-memory
│       ├── ScenarioContext/
│       │   └── SharedState.cs              # Per-scenario HTTP state holder
│       ├── Unit/
│       │   ├── UserValidationTests.cs      # Password, email, username validation
│       │   ├── CurrencyTests.cs            # Decimal precision tests
│       │   └── PasswordHasherTests.cs      # BCrypt wrapper tests
│       └── Integration/
│           └── Steps/
│               ├── CommonSteps.cs          # Shared: status code, API running
│               ├── AuthSteps.cs            # Register, login steps
│               ├── TokenLifecycleSteps.cs
│               ├── UserAccountSteps.cs
│               ├── SecuritySteps.cs
│               ├── TokenManagementSteps.cs
│               ├── AdminSteps.cs
│               ├── ExpenseSteps.cs
│               ├── CurrencySteps.cs
│               ├── UnitHandlingSteps.cs
│               ├── ReportingSteps.cs
│               └── AttachmentSteps.cs
├── global.json                             # Pin .NET SDK version
├── Directory.Build.props                   # Shared MSBuild settings
├── Directory.Packages.props                # NuGet Central Package Management
├── .editorconfig                           # Formatting rules for dotnet format
├── project.json                            # Nx targets
└── README.md
```

---

## Key Design Decisions

### ASP.NET Core 9 Minimal APIs

All routes use the Minimal API style introduced in .NET 6 and matured in .NET 8/9. This
replaces the traditional Controller-based approach with a concise, functional style that maps
well to the functional core/imperative shell pattern:

```csharp
// src/DemoBeCsas/Endpoints/HealthEndpoints.cs
public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "UP" }));
        return app;
    }
}

// src/DemoBeCsas/Program.cs
var app = builder.Build();

app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAdminEndpoints();
app.MapExpenseEndpoints();
app.MapReportEndpoints();
app.MapAttachmentEndpoints();
app.MapTokenEndpoints();

app.Run();
```

### Dependency Injection via ASP.NET Core DI

Repositories and services are registered in `Program.cs` and injected into endpoint handlers
via ASP.NET Core's built-in DI container:

```csharp
// src/DemoBeCsas/Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration["DATABASE_URL"]));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<IAttachmentRepository, AttachmentRepository>();
builder.Services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();
```

Integration tests override the database via `WebApplicationFactory<Program>`:

```csharp
// tests/DemoBeCsas.Tests/TestWebApplicationFactory.cs
public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove production EF Core registration
            var descriptor = services.SingleOrDefault(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null)
                services.Remove(descriptor);

            // Register SQLite in-memory
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite("DataSource=:memory:"));
        });
    }
}
```

### Record Types for Domain Entities

Domain entities use C# `record` types for immutability and structural equality, following the
OSE Platform C# coding standards:

```csharp
// src/DemoBeCsas/Domain/User.cs
public sealed record UserDomain(
    Guid Id,
    string Username,
    string Email,
    string PasswordHash,
    string? DisplayName,
    UserStatus Status,
    Role Role,
    int FailedLoginAttempts,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public static class UserValidation
{
    public static Result<string> ValidatePassword(string password)
    {
        if (password.Length < 12)
            return Result.Failure<string>("Password must be at least 12 characters");
        if (!password.Any(char.IsUpper))
            return Result.Failure<string>("Password must contain at least one uppercase letter");
        if (!password.Any(c => !char.IsLetterOrDigit(c)))
            return Result.Failure<string>("Password must contain at least one special character");
        return Result.Success(password);
    }
}
```

### Domain Error Handling with Result Pattern

Domain operations return a lightweight `Result<T>` type. The Minimal API endpoint maps results
to HTTP responses without exposing domain logic to the web layer:

```csharp
// src/DemoBeCsas/Domain/Errors.cs
public abstract record DomainError(string Message);
public sealed record ValidationError(string Field, string Message) : DomainError(Message);
public sealed record NotFoundError(string Entity) : DomainError($"{Entity} not found");
public sealed record ForbiddenError(string Message) : DomainError(Message);
public sealed record ConflictError(string Message) : DomainError(Message);
public sealed record UnauthorizedError(string Message) : DomainError(Message);
public sealed record FileTooLargeError(long LimitBytes) : DomainError("File size exceeds the maximum allowed limit");
public sealed record UnsupportedMediaTypeError(string Type) : DomainError("Unsupported media type");

// src/DemoBeCsas/Endpoints/AuthEndpoints.cs
public static IResult ToHttpResult(DomainError error) => error switch
{
    ValidationError e => Results.BadRequest(new { message = e.Message }),
    NotFoundError e => Results.NotFound(new { message = e.Message }),
    ForbiddenError e => Results.Forbid(),
    ConflictError e => Results.Conflict(new { message = e.Message }),
    UnauthorizedError e => Results.Unauthorized(),
    FileTooLargeError => Results.StatusCode(413),
    UnsupportedMediaTypeError => Results.StatusCode(415),
    _ => Results.Problem(error.Message),
};
```

### Database: EF Core 9 with PostgreSQL

Production uses PostgreSQL via `Npgsql.EntityFrameworkCore.PostgreSQL`. Integration tests use
SQLite in-memory via `Microsoft.EntityFrameworkCore.Sqlite` for isolation:

```csharp
// src/DemoBeCsas/Infrastructure/AppDbContext.cs
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserModel> Users => Set<UserModel>();
    public DbSet<ExpenseModel> Expenses => Set<ExpenseModel>();
    public DbSet<AttachmentModel> Attachments => Set<AttachmentModel>();
    public DbSet<RevokedTokenModel> RevokedTokens => Set<RevokedTokenModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Role).HasConversion<string>();
        });

        modelBuilder.Entity<ExpenseModel>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 6);
            entity.Property(e => e.Currency).HasConversion<string>();
            entity.Property(e => e.Type).HasConversion<string>();
        });
    }
}
```

### JWT Strategy

HMAC-SHA256 signing using `Microsoft.AspNetCore.Authentication.JwtBearer`. Access tokens
(short-lived) and refresh tokens (long-lived) follow the same scheme as all other demo-be
implementations:

- Access token: 15 minutes
- Refresh token: 7 days
- Secret from `APP_JWT_SECRET` environment variable
- Claims: `sub` (user ID), `username`, `role`, `exp`, `iat`, `jti`

```csharp
// src/DemoBeCsas/Auth/JwtService.cs
public class JwtService(IConfiguration config) : IJwtService
{
    private readonly string _secret = config["APP_JWT_SECRET"]
        ?? throw new InvalidOperationException("APP_JWT_SECRET not configured");

    public string CreateAccessToken(string userId, string username, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString();

        var token = new JwtSecurityToken(
            claims: [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("username", username),
                new Claim("role", role),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
            ],
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### Currency Precision

Amounts stored as `decimal` with currency-specific precision enforced at the domain level:

```csharp
// src/DemoBeCsas/Domain/Expense.cs
public static class CurrencyValidation
{
    private static readonly IReadOnlyDictionary<string, int> DecimalPlaces =
        new Dictionary<string, int>
        {
            ["USD"] = 2,
            ["IDR"] = 0,
        }.AsReadOnly();

    public static Result<decimal> ValidateAmount(string currency, decimal amount)
    {
        if (!DecimalPlaces.TryGetValue(currency.ToUpperInvariant(), out var places))
            return Result.Failure<decimal>($"Unsupported currency: {currency}");

        if (amount < 0)
            return Result.Failure<decimal>("Amount must not be negative");

        var rounded = Math.Round(amount, places);
        if (rounded != amount)
            return Result.Failure<decimal>($"{currency} requires {places} decimal places");

        return Result.Success(amount);
    }
}
```

### Reqnroll Scenario Context for Shared State

Reqnroll injects `ScenarioContext` for per-scenario state sharing between step definitions.
Each step class receives shared state via constructor injection:

```csharp
// tests/DemoBeCsas.Tests/ScenarioContext/SharedState.cs
public class SharedState
{
    public HttpResponseMessage? LastResponse { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public Guid? LastCreatedId { get; set; }
}

// tests/DemoBeCsas.Tests/Integration/Steps/AuthSteps.cs
[Binding]
public class AuthSteps(HttpClient client, SharedState state)
{
    [When("the user registers with username {string} and password {string}")]
    public async Task WhenRegister(string username, string password)
    {
        var body = new { username, password, email = $"{username}@test.com" };
        state.LastResponse = await client.PostAsJsonAsync("/api/v1/auth/register", body);
    }
}
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-csharp-aspnetcore",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-csharp-aspnetcore/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet publish src/DemoBeCsas/DemoBeCsas.csproj -c Release -o dist",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet watch run --project src/DemoBeCsas/DemoBeCsas.csproj",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet run --project src/DemoBeCsas/DemoBeCsas.csproj",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "dotnet test tests/DemoBeCsas.Tests/DemoBeCsas.Tests.csproj --collect:\"XPlat Code Coverage\" --results-directory ./coverage -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=lcov",
          "(cd ../../ && apps/rhino-cli/rhino-cli test-coverage validate apps/demo-be-csharp-aspnetcore/coverage/**/coverage.info 90)",
          "dotnet format --verify-no-changes",
          "dotnet build src/DemoBeCsas/DemoBeCsas.csproj /p:TreatWarningsAsErrors=true --no-restore"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-csharp-aspnetcore"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet test tests/DemoBeCsas.Tests/DemoBeCsas.Tests.csproj --filter Category=Unit",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet test tests/DemoBeCsas.Tests/DemoBeCsas.Tests.csproj --filter Category=Integration",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/**/*.cs",
        "{projectRoot}/tests/**/*.cs",
        "{workspaceRoot}/specs/apps/demo-be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet build src/DemoBeCsas/DemoBeCsas.csproj /p:TreatWarningsAsErrors=true --no-restore",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "dotnet build src/DemoBeCsas/DemoBeCsas.csproj /p:TreatWarningsAsErrors=true --no-restore",
        "cwd": "apps/demo-be-csharp-aspnetcore"
      }
    }
  },
  "tags": ["type:app", "platform:aspnetcore", "lang:csharp", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> coverage collection must finish before `rhino-cli` validates the LCOV output. `dotnet format`
> check and analyzer build run after tests to avoid masking test failures.
>
> **Note on `test:integration` caching**: Integration tests use `WebApplicationFactory` with
> EF Core SQLite in-memory — no external services. Fully deterministic and safe to cache.
>
> **Note on `lint` and `typecheck`**: Both targets invoke `dotnet build` with
> `TreatWarningsAsErrors=true`. This runs Roslyn analyzers (NetAnalyzers + SonarAnalyzer.CSharp)
> as part of the build, making compilation the enforcement mechanism for both linting and type
> safety — consistent with the F# approach in `demo-be-fsharp-giraffe`.

---

## MSBuild Configuration

### `global.json`

```json
{
  "sdk": {
    "version": "9.0.200",
    "rollForward": "latestPatch"
  }
}
```

### `Directory.Build.props`

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
</Project>
```

### `Directory.Packages.props`

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <!-- Runtime -->
    <PackageVersion Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="9.0.*" />
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="9.0.*" />
    <PackageVersion Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.*" />
    <PackageVersion Include="BCrypt.Net-Next" Version="4.0.*" />
    <PackageVersion Include="Microsoft.IdentityModel.Tokens" Version="8.7.*" />
    <PackageVersion Include="System.IdentityModel.Tokens.Jwt" Version="8.7.*" />
    <!-- Analyzers -->
    <PackageVersion Include="Microsoft.CodeAnalysis.NetAnalyzers" Version="9.0.*" />
    <PackageVersion Include="SonarAnalyzer.CSharp" Version="10.8.*" />
    <!-- Test -->
    <PackageVersion Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.*" />
    <PackageVersion Include="Microsoft.AspNetCore.Mvc.Testing" Version="9.0.*" />
    <PackageVersion Include="Reqnroll" Version="2.4.*" />
    <PackageVersion Include="Reqnroll.xUnit" Version="2.4.*" />
    <PackageVersion Include="xunit" Version="2.9.*" />
    <PackageVersion Include="xunit.runner.visualstudio" Version="2.8.*" />
    <PackageVersion Include="FluentAssertions" Version="8.3.*" />
    <PackageVersion Include="coverlet.collector" Version="6.0.*" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.13.*" />
  </ItemGroup>
</Project>
```

### `DemoBeCsas.csproj` (main application)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <AssemblyName>DemoBeCsas</AssemblyName>
    <RootNamespace>DemoBeCsas</RootNamespace>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" />
    <PackageReference Include="BCrypt.Net-Next" />
    <PackageReference Include="Microsoft.IdentityModel.Tokens" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" />
    <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" PrivateAssets="all" />
    <PackageReference Include="SonarAnalyzer.CSharp" PrivateAssets="all" />
  </ItemGroup>

</Project>
```

### `DemoBeCsas.Tests.csproj` (test project)

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" />
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" />
    <PackageReference Include="Reqnroll" />
    <PackageReference Include="Reqnroll.xUnit" />
    <PackageReference Include="xunit" />
    <PackageReference Include="xunit.runner.visualstudio" />
    <PackageReference Include="FluentAssertions" />
    <PackageReference Include="coverlet.collector" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\DemoBeCsas\DemoBeCsas.csproj" />
  </ItemGroup>

  <!-- Copy shared Gherkin feature files to output directory -->
  <Target Name="CopyGherkinSpecs" BeforeTargets="Build">
    <ItemGroup>
      <GherkinFiles Include="$(ProjectDir)..\..\..\..\specs\apps\demo-be\gherkin\**\*.feature" />
    </ItemGroup>
    <Copy SourceFiles="@(GherkinFiles)"
          DestinationFolder="$(OutputPath)specs\%(RecursiveDir)"
          SkipUnchangedFiles="true" />
  </Target>

</Project>
```

---

## Infrastructure

### Port Assignment

| Service                   | Port                                               |
| ------------------------- | -------------------------------------------------- |
| demo-be-db                | 5432                                               |
| demo-be-java-springboot   | 8201                                               |
| demo-be-elixir-phoenix    | 8201 (same port — mutually exclusive alternatives) |
| demo-be-fsharp-giraffe    | 8201 (same port — mutually exclusive alternatives) |
| demo-be-golang-gin        | 8201 (same port — mutually exclusive alternatives) |
| demo-be-python-fastapi    | 8201 (same port — mutually exclusive alternatives) |
| demo-be-rust-axum         | 8201 (same port — mutually exclusive alternatives) |
| demo-be-kotlin-ktor       | 8201 (same port — mutually exclusive alternatives) |
| demo-be-csharp-aspnetcore | 8201 (same port — mutually exclusive alternatives) |

### Docker Compose (`infra/dev/demo-be-csharp-aspnetcore/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_csharp_aspnetcore
      POSTGRES_USER: demo_be_csharp_aspnetcore
      POSTGRES_PASSWORD: demo_be_csharp_aspnetcore
    ports:
      - "5432:5432"
    volumes:
      - demo-be-csharp-aspnetcore-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_csharp_aspnetcore"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-csharp-aspnetcore-network

  demo-be-csharp-aspnetcore:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-csharp-aspnetcore
    ports:
      - "8201:8201"
    environment:
      - ASPNETCORE_URLS=http://+:8201
      - DATABASE_URL=Host=demo-be-db;Database=demo_be_csharp_aspnetcore;Username=demo_be_csharp_aspnetcore;Password=demo_be_csharp_aspnetcore
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
    volumes:
      - ../../../apps/demo-be-csharp-aspnetcore:/workspace:rw
      - ../../../specs/apps/demo-be:/specs/apps/demo-be:ro
    depends_on:
      demo-be-db:
        condition: service_healthy
    command: sh -c "dotnet ef database update --project src/DemoBeCsas/DemoBeCsas.csproj && dotnet watch run --project src/DemoBeCsas/DemoBeCsas.csproj"
    networks:
      - demo-be-csharp-aspnetcore-network

volumes:
  demo-be-csharp-aspnetcore-db-data:

networks:
  demo-be-csharp-aspnetcore-network:
```

### Dockerfile.be.dev

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine

RUN dotnet tool install -g dotnet-ef

ENV PATH="$PATH:/root/.dotnet/tools"

WORKDIR /workspace

CMD ["dotnet", "watch", "run", "--project", "src/DemoBeCsas/DemoBeCsas.csproj"]
```

---

## GitHub Actions

### New Workflow: `e2e-demo-be-csharp-aspnetcore.yml`

Mirrors `e2e-demo-be-fsharp-giraffe.yml` with:

- Name: `E2E - Demo BE (CSAS)`
- Schedule: same crons as jasb/exph/fsgi
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-csas` → docker down (always)

### Updated Workflow: `main-ci.yml`

The `.NET SDK` setup step already exists for `demo-be-fsharp-giraffe`. Add only the coverage upload step:

```yaml
- name: Upload coverage — demo-be-csharp-aspnetcore
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-csharp-aspnetcore/coverage/**/coverage.info
    flags: demo-be-csharp-aspnetcore
    fail_ci_if_error: false
```

---

## Dependencies Summary

### NuGet Packages (`DemoBeCsas.csproj` — runtime)

| Package                                       | Purpose                                    |
| --------------------------------------------- | ------------------------------------------ |
| Microsoft.AspNetCore.Authentication.JwtBearer | JWT Bearer middleware for ASP.NET Core     |
| Microsoft.EntityFrameworkCore                 | ORM                                        |
| Npgsql.EntityFrameworkCore.PostgreSQL         | PostgreSQL provider for EF Core            |
| BCrypt.Net-Next                               | Password hashing                           |
| Microsoft.IdentityModel.Tokens                | JWT key and signing credential types       |
| System.IdentityModel.Tokens.Jwt               | JWT creation and validation                |
| Microsoft.CodeAnalysis.NetAnalyzers           | Roslyn static analysis (PrivateAssets=all) |
| SonarAnalyzer.CSharp                          | SonarQube rules for C# (PrivateAssets=all) |

### NuGet Packages (`DemoBeCsas.Tests.csproj` — test)

| Package                              | Purpose                                    |
| ------------------------------------ | ------------------------------------------ |
| Reqnroll                             | Gherkin BDD runner (SpecFlow successor)    |
| Reqnroll.xUnit                       | Reqnroll integration with xUnit            |
| xunit                                | Test framework                             |
| xunit.runner.visualstudio            | Test runner                                |
| FluentAssertions                     | Expressive assertion library               |
| Microsoft.EntityFrameworkCore.Sqlite | SQLite in-memory provider for EF Core      |
| Microsoft.AspNetCore.Mvc.Testing     | WebApplicationFactory for in-process tests |
| coverlet.collector                   | Code coverage (LCOV output via XPlat)      |
| Microsoft.NET.Test.Sdk               | Test SDK                                   |

### .NET Tools (global or local dotnet tool manifest)

| Tool      | Purpose                |
| --------- | ---------------------- |
| dotnet-ef | EF Core migrations CLI |
