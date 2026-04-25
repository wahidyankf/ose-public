---
title: "C# Security Standards"
description: Authoritative OSE Platform C# security standards (ASP.NET Core Data Protection, JWT, FluentValidation, CORS, secrets management)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - security
  - aspnet-core
  - jwt
  - oauth2
  - data-protection
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Security Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative security standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers building user-facing APIs and services

**Scope**: ASP.NET Core Data Protection, JWT validation, input validation with FluentValidation, anti-forgery, CORS, secrets management, SQL injection prevention, HTTPS, SameSite cookies

## Software Engineering Principles

### 1. Explicit Over Implicit

**PASS Example** (Explicit security policy registration):

```csharp
// CORRECT: all security policies explicitly registered and named
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ZakatAdministrator", policy =>
        policy.RequireRole("ZakatAdmin")
              .RequireClaim("permission", "zakat:write"));

    options.AddPolicy("ZakatViewer", policy =>
        policy.RequireRole("ZakatAdmin", "ZakatViewer")
              .RequireClaim("permission", "zakat:read"));
});
```

### 2. Automation Over Manual

**PASS Example** (Automated input validation with FluentValidation):

```csharp
// CORRECT: automated validation registered in DI - runs before controller action
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Validator definition
public sealed class CreateZakatRequestValidator : AbstractValidator<CreateZakatRequest>
{
    public CreateZakatRequestValidator()
    {
        RuleFor(r => r.PayerId)
            .NotEmpty().WithMessage("PayerId is required.");

        RuleFor(r => r.Wealth)
            .GreaterThan(0).WithMessage("Wealth must be a positive amount.")
            .LessThanOrEqualTo(1_000_000_000m).WithMessage("Wealth exceeds maximum limit.");
    }
}
```

## ASP.NET Core Data Protection API

**MUST** use ASP.NET Core Data Protection API for encrypting sensitive data at rest and for secure cookie tokens.

```csharp
// Program.cs - Data Protection configuration
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/app/data-protection-keys"))
    .SetApplicationName("OsePlatform.Zakat")
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

// Usage: encrypt PII (e.g., national ID for Zakat payer)
public sealed class ZakatPayerEncryptionService(IDataProtectionProvider dataProtection)
{
    private readonly IDataProtector _protector =
        dataProtection.CreateProtector("OsePlatform.Zakat.PayerPII");

    public string EncryptNationalId(string nationalId)
        => _protector.Protect(nationalId);

    public string DecryptNationalId(string encryptedNationalId)
        => _protector.Unprotect(encryptedNationalId);
}
```

## JWT Validation

**MUST** use `Microsoft.AspNetCore.Authentication.JwtBearer` for JWT token validation. **MUST NOT** implement custom JWT parsing.

```csharp
// Program.cs - JWT Bearer configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"];
        options.Audience = builder.Configuration["Auth:Audience"];
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(5) // tolerate small clock drift
        };
    });

// Protect endpoint with authorization
[HttpPost]
[Authorize(Policy = "ZakatAdministrator")]
public async Task<IActionResult> ProcessZakat(
    [FromBody] CreateZakatRequest request,
    CancellationToken cancellationToken)
{
    // ...
}
```

## Input Validation with FluentValidation

**MUST** use FluentValidation for all input validation in application layer. **MUST NOT** use data annotations (`[Required]`, `[Range]`) for domain validation (they are acceptable for API documentation only).

```csharp
// CreateZakatRequestValidator.cs
public sealed class CreateZakatRequestValidator : AbstractValidator<CreateZakatRequest>
{
    public CreateZakatRequestValidator()
    {
        RuleFor(r => r.PayerId)
            .NotEmpty().WithMessage("PayerId is required.")
            .NotEqual(Guid.Empty).WithMessage("PayerId must be a valid GUID.");

        RuleFor(r => r.Wealth)
            .GreaterThan(0m).WithMessage("Wealth must be greater than zero.")
            .LessThanOrEqualTo(1_000_000_000m).WithMessage("Wealth exceeds maximum allowed amount.");

        RuleFor(r => r.AssetType)
            .IsInEnum().WithMessage("AssetType must be a valid Zakat asset category.");
    }
}

// Minimal API validation integration
app.MapPost("/api/zakat", async (
    [FromBody] CreateZakatRequest request,
    IValidator<CreateZakatRequest> validator,
    IZakatService service,
    CancellationToken cancellationToken) =>
{
    var validation = await validator.ValidateAsync(request, cancellationToken);
    if (!validation.IsValid)
    {
        return Results.ValidationProblem(validation.ToDictionary());
    }
    var transaction = await service.ProcessAsync(request, cancellationToken);
    return Results.Created($"/api/zakat/{transaction.TransactionId}", transaction);
});
```

## CORS Configuration

**MUST** define explicit CORS policies. **MUST NOT** use `AllowAnyOrigin()` in production.

```csharp
// Program.cs - explicit CORS policy
const string ZakatPortalCorsPolicy = "ZakatPortalCors";

builder.Services.AddCors(options =>
{
    options.AddPolicy(ZakatPortalCorsPolicy, policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:3000", "https://localhost:3001")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.WithOrigins("https://portal.ose-platform.com")
                  .WithHeaders("Authorization", "Content-Type")
                  .WithMethods("GET", "POST", "PUT", "DELETE")
                  .AllowCredentials();
        }
    });
});

app.UseCors(ZakatPortalCorsPolicy);
```

## Secrets Management

**MUST** use environment variables or secret management services for all sensitive configuration. **MUST NOT** hardcode secrets in source code or appsettings.json.

```csharp
// CORRECT: secrets from environment variables / Azure Key Vault
builder.Configuration.AddEnvironmentVariables();

if (builder.Environment.IsProduction())
{
    builder.Configuration.AddAzureKeyVault(
        new Uri(builder.Configuration["Azure:KeyVaultUri"]!),
        new DefaultAzureCredential());
}

// CORRECT: user secrets for local development
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
}

// appsettings.json - only non-sensitive config
{
  "ConnectionStrings": {
    "ZakatDb": ""  // populated from environment variable: ConnectionStrings__ZakatDb
  },
  "Auth": {
    "Authority": "https://login.microsoftonline.com/tenant-id",
    "Audience": "ose-platform-zakat-api"
  }
}
```

```bash
# Local development: set user secrets (never committed to git)
dotnet user-secrets set "ConnectionStrings:ZakatDb" "Host=localhost;Database=zakat;..."
dotnet user-secrets set "Auth:ClientSecret" "your-secret-here"
```

## SQL Injection Prevention

**MUST** use EF Core parameterized queries. **MUST NOT** use string interpolation or concatenation in SQL queries.

```csharp
// CORRECT: EF Core LINQ (automatically parameterized)
var transactions = await _dbContext.ZakatTransactions
    .Where(t => t.PayerId == payerId && t.PaidAt >= fromDate)
    .ToListAsync(cancellationToken);

// CORRECT: EF Core raw SQL with parameters
var transactions = await _dbContext.ZakatTransactions
    .FromSqlRaw("SELECT * FROM zakat_transactions WHERE payer_id = {0}", payerId)
    .ToListAsync(cancellationToken);

// WRONG: string interpolation in SQL (SQL injection vulnerability)
var transactions = await _dbContext.ZakatTransactions
    .FromSqlRaw($"SELECT * FROM zakat_transactions WHERE payer_id = '{payerId}'") // WRONG
    .ToListAsync(cancellationToken);
```

## HTTPS Enforcement

**MUST** enforce HTTPS in production. **MUST** redirect HTTP to HTTPS.

```csharp
// Program.cs
app.UseHttpsRedirection();
app.UseHsts(); // HTTP Strict Transport Security

// In production, configure HSTS max age
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365);
    options.IncludeSubDomains = true;
    options.Preload = true;
});
```

## SameSite Cookies

**MUST** configure SameSite policy for session and anti-forgery cookies.

```csharp
// Program.cs - cookie policy
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.HttpOnly = true;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;
});

// Anti-forgery for form-based endpoints
builder.Services.AddAntiforgery(options =>
{
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});
```

## Enforcement

- **Roslyn analyzers** - Detect hardcoded credentials (CA2100, SonarAnalyzer S2068)
- **FluentValidation** - Input validation before business logic
- **HTTPS middleware** - Enforced in production pipeline
- **Code reviews** - Verify no string concatenation in SQL, no `AllowAnyOrigin()`

**Pre-commit checklist**:

- [ ] No hardcoded secrets or credentials in source code
- [ ] All SQL operations use EF Core parameterized queries
- [ ] JWT validation configured with explicit `TokenValidationParameters`
- [ ] CORS policy does not use `AllowAnyOrigin()` in production
- [ ] Sensitive data encrypted with Data Protection API
- [ ] SameSite and HttpOnly set on all cookies
- [ ] FluentValidation used for all input validation

## Related Standards

- [API Standards](api-standards.md) - Authentication middleware placement
- [Error Handling Standards](error-handling-standards.md) - Validation error responses
- [Framework Integration](framework-integration.md) - Middleware pipeline order

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
