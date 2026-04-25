---
title: "F# Security Standards"
description: Authoritative OSE Platform F# security standards — type-driven validation, Giraffe auth, parameterized queries
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - security
  - input-validation
  - encryption
  - giraffe
  - authentication
  - type-driven-security
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Security Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative security standards** for F# development in OSE Platform. F# type system enables security-by-construction: invalid and dangerous inputs are rejected at the type level before reaching business logic.

**Target Audience**: OSE Platform F# developers building web services and data pipelines

**Scope**: Type-driven input validation, Giraffe/Saturn authentication, secrets management, SQL injection prevention, logging hygiene

## Software Engineering Principles

### 1. Explicit Over Implicit

**How F# Enforces Security**:

- `Result<'T, ValidationError>` makes validation failures explicit — callers cannot ignore them
- Single-case DUs prevent raw strings from being used as IDs or sensitive values
- Type system rejects validated values where unvalidated ones are expected

**PASS Example** (Type-driven validation — invalid states unrepresentable):

```fsharp
// CORRECT: Single-case DU ensures ZakatId is always a validated value
type ZakatId = private ZakatId of string

module ZakatId =
    let create (raw: string) : Result<ZakatId, string> =
        if System.String.IsNullOrWhiteSpace(raw) then
            Error "ZakatId cannot be empty"
        elif raw.Length > 50 then
            Error "ZakatId too long"
        elif raw |> Seq.forall System.Char.IsLetterOrDigit |> not then
            Error "ZakatId must be alphanumeric"
        else
            Ok (ZakatId raw)

    let value (ZakatId id) = id

// The type system prevents using an unvalidated string where ZakatId is expected
let findRecord (id: ZakatId) = ...  // Cannot be called with raw string
```

### 2. Immutability Over Mutability

**PASS Example** (Immutable validated value — cannot be modified after validation):

```fsharp
// CORRECT: Once validated, the ZakatId cannot be changed to an invalid value
type ValidatedInput = {
    ZakatId: ZakatId
    PayerId: PayerId
    Amount: ValidatedAmount
}
// Record is immutable — all fields validated at construction time
```

### 3. Pure Functions Over Side Effects

**PASS Example** (Pure validation logic — no side effects, fully testable):

```fsharp
// CORRECT: Pure validation function — no I/O, no exceptions for domain errors
let validateZakatAmount (raw: decimal) : Result<decimal, string> =
    if raw <= 0m then Error "Zakat amount must be positive"
    elif raw > 1_000_000_000m then Error "Zakat amount exceeds maximum"
    else Ok raw
```

### 4. Automation Over Manual

**PASS Example** (Authentication middleware configured once, applied automatically):

```fsharp
// CORRECT: Auth middleware applied to all protected routes automatically
let app =
    application {
        use_jwt_authentication secret audience
        use_router protectedRouter
    }
```

### 5. Reproducibility First

**PASS Example** (Secrets from environment — no hardcoded credentials):

```fsharp
// CORRECT: Secrets from configuration, not source code
let jwtSecret =
    System.Environment.GetEnvironmentVariable("JWT_SECRET")
    |> Option.ofObj
    |> Option.defaultWith (fun () -> failwith "JWT_SECRET environment variable not set")
```

## Type-Driven Security

### Making Invalid States Unrepresentable

**MUST** use single-case discriminated unions for all domain identifiers and sensitive values:

```fsharp
// CORRECT: Distinct types prevent mixing up IDs
type PayerId = private PayerId of string
type ZakatId = private ZakatId of string
type ContractId = private ContractId of string

// The compiler prevents passing a PayerId where a ZakatId is expected
let findZakatRecord (id: ZakatId) : Async<ZakatRecord option> = ...

// WRONG: Raw strings can be accidentally swapped
// let findZakatRecord (id: string) : Async<ZakatRecord option> = ...
```

### Input Validation at Boundaries

**MUST** validate all external input at the application boundary (HTTP handler, message queue consumer) before it enters the domain:

```fsharp
// CORRECT: Validate at the HTTP boundary, pass validated types to domain
let zakatHandler : HttpHandler =
    fun next ctx -> task {
        let! dto = ctx.BindJsonAsync<CreateZakatDto>()

        let result = result {
            let! payerId = PayerId.create dto.PayerId
            let! zakatId = ZakatId.create dto.ZakatId
            let! amount = ValidatedAmount.create dto.Amount
            return { PayerId = payerId; ZakatId = zakatId; Amount = amount }
        }

        match result with
        | Error msg -> return! RequestErrors.BAD_REQUEST msg next ctx
        | Ok validated ->
            let! receipt = ZakatService.process validated
            return! Successful.OK receipt next ctx
    }
```

## Giraffe Authentication and Authorization

### JWT Authentication

**MUST** configure JWT authentication via the ASP.NET Core middleware pipeline:

```fsharp
open Microsoft.AspNetCore.Authentication.JwtBearer

let configureAuth (services: IServiceCollection) =
    services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(fun options ->
            options.TokenValidationParameters <- TokenValidationParameters(
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = "ose-platform",
                ValidAudience = "zakat-service",
                IssuerSigningKey = SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET"))
                )
            )
        )
    |> ignore
```

### Route-Level Authorization

**MUST** protect routes explicitly with `requiresAuthentication` and `authorizeByPolicyName`:

```fsharp
open Giraffe

// CORRECT: Protection is explicit on each route group
let protectedRoutes : HttpHandler =
    requiresAuthentication (challenge JwtBearerDefaults.AuthenticationScheme) >=>
    choose [
        GET >=> route "/zakat/records" >=> handleGetRecords
        POST >=> route "/zakat/calculate" >=> handleCalculateZakat
    ]

// Public routes explicitly separate
let publicRoutes : HttpHandler =
    choose [
        GET >=> route "/health" >=> text "OK"
        GET >=> route "/nisab/current" >=> handleGetCurrentNisab
    ]

let allRoutes = choose [ publicRoutes; protectedRoutes ]
```

## Secrets Management

**MUST** use .NET configuration abstractions — never hardcode secrets:

```fsharp
// CORRECT: Read from configuration (environment variables, Azure Key Vault, etc.)
let getConfig (config: IConfiguration) = {
    DatabaseConnectionString = config.["ConnectionStrings:ZakatDb"]
    JwtSecret = config.["Jwt:Secret"]
    NisabApiKey = config.["NisabService:ApiKey"]
}

// WRONG: Hardcoded secret
// let jwtSecret = "my-super-secret-key"  // NEVER DO THIS
```

**MUST NOT** log secret values or sensitive personal data:

```fsharp
// WRONG: Logging sensitive data
// logger.LogInformation($"Processing payment for {payer.BankAccountNumber}")

// CORRECT: Log only identifiers, never sensitive data
logger.LogInformation($"Processing payment for payer {payer.PayerId}")
```

## SQL Injection Prevention

**MUST** use parameterized queries — never interpolate user input into SQL strings:

```fsharp
// WRONG: String interpolation in SQL — SQL injection risk
// let query = $"SELECT * FROM zakat_records WHERE payer_id = '{payerId}'"

// CORRECT: Parameterized query via Dapper or SqlClient
open Dapper

let findZakatRecords (conn: IDbConnection) (payerId: PayerId) =
    task {
        let sql = "SELECT * FROM zakat_records WHERE payer_id = @PayerId"
        let! records = conn.QueryAsync<ZakatRecord>(sql, {| PayerId = PayerId.value payerId |})
        return records |> Seq.toList
    }
```

## Enforcement

- **Code reviews** — Raw strings used as IDs flagged; unparameterized queries blocked
- **Type system** — Single-case DU types prevent passing unvalidated values to domain functions
- **Security scanning** — `dotnet security scan` or equivalent in CI
- **Pre-commit** — Secrets detection tooling (e.g., gitleaks) prevents accidental secret commits

**Pre-commit checklist**:

- [ ] No raw strings used where validated DU types are expected
- [ ] All external input validated at the boundary with `Result`
- [ ] JWT authentication middleware configured before protected routes
- [ ] No hardcoded secrets — all from environment/configuration
- [ ] No SQL string interpolation — parameterized queries only
- [ ] No sensitive data in log messages

## Related Standards

- [API Standards](api-standards.md) - Giraffe route-level auth integration
- [Error Handling Standards](error-handling-standards.md) - Validation errors as Result types
- [Type Safety Standards](type-safety-standards.md) - Single-case DUs and type-driven security

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
