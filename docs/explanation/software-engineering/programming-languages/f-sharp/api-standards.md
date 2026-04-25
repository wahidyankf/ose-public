---
title: "F# API Standards"
description: Authoritative OSE Platform F# API standards — Giraffe HttpHandler composition, Saturn controllers, JSON serialization
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - api-standards
  - giraffe
  - saturn
  - rest
  - http-handler
  - json-serialization
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# API Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative API standards** for F# HTTP service development in OSE Platform. Giraffe's `HttpHandler` composition model enables functional, composable HTTP pipelines. Saturn's computation expressions provide opinionated structure for larger services.

**Target Audience**: OSE Platform F# developers building REST APIs

**Scope**: Giraffe HttpHandler composition, the fish operator (`>=>`), Saturn controller pattern, routing, JSON serialization, error responses

## Software Engineering Principles

### 1. Explicit Over Implicit

**How Giraffe Implements**:

- HTTP handlers are explicit function compositions — no magic routing conventions
- Each route is explicitly declared in `choose []`
- Auth protection is explicit per route group — no implicit inheritance

**PASS Example** (Explicit Giraffe route declaration):

```fsharp
// CORRECT: Routes are explicitly declared — no implicit discovery
let router : HttpHandler =
    choose [
        GET >=> route "/zakat/nisab" >=> getCurrentNisabHandler
        POST >=> route "/zakat/calculate" >=> calculateZakatHandler
        GET >=> routef "/zakat/records/%s" getZakatRecordHandler
        RequestErrors.NOT_FOUND "Route not found"
    ]
```

### 2. Pure Functions Over Side Effects

**PASS Example** (Handler delegates to pure domain function):

```fsharp
// CORRECT: Handler is thin — domain logic is pure and separate
let calculateZakatHandler : HttpHandler =
    fun next ctx -> task {
        let! dto = ctx.BindJsonAsync<ZakatCalculationDto>()
        // Domain logic is pure — handler only bridges HTTP and domain
        let result = ZakatDomain.calculateZakat dto.Wealth dto.Nisab
        return! Successful.OK result next ctx
    }
```

### 3. Immutability Over Mutability

**PASS Example** (Request/response modeled as immutable records):

```fsharp
// CORRECT: Request and response are immutable records
type ZakatCalculationRequest = {
    PayerId: string
    DeclaredWealth: decimal
    AssetClass: string
}

type ZakatCalculationResponse = {
    ZakatDue: decimal
    CalculatedAt: System.DateTimeOffset
    NisabThreshold: decimal
}
```

### 4. Immutability Over Mutability (Handler Composition)

**PASS Example** (Handler pipeline composed, not mutated):

```fsharp
// CORRECT: Handlers composed with fish operator >=>
// Each handler is a function — composition creates a new function
let protectedZakatHandler =
    requiresAuthentication (challenge "Bearer") >=>
    validateZakatRequest >=>
    calculateZakatHandler
```

### 5. Reproducibility First

**PASS Example** (JSON serialization configured once, deterministic):

```fsharp
// CORRECT: JSON options configured at startup — consistent serialization
let configureJsonSerializer (services: IServiceCollection) =
    services.AddSingleton<Json.ISerializer>(
        SystemTextJson.Serializer(
            JsonSerializerOptions(
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            )
        )
    )
```

## Giraffe HttpHandler Composition

### HttpHandler Type

A Giraffe `HttpHandler` is a function: `HttpFunc -> HttpContext -> HttpFuncResult`

```fsharp
// HttpHandler signature (for understanding — not written by hand)
type HttpFunc = HttpContext -> Task<HttpContext option>
type HttpHandler = HttpFunc -> HttpContext -> Task<HttpContext option>
```

### Fish Operator (>=>)

**MUST** use `>=>` (Kleisli composition / fish operator) to compose handlers sequentially:

```fsharp
// CORRECT: Pipeline reads left to right — each handler can short-circuit
let zakatPipeline : HttpHandler =
    requiresAuthentication (challenge "Bearer") >=>
    validateContentType "application/json" >=>
    calculateZakatHandler

// Each handler either calls next (continue) or returns a response (short-circuit)
```

### choose for Routing

**MUST** use `choose` for route dispatch:

```fsharp
// CORRECT: choose tries each handler in order; first match wins
let zakatRouter : HttpHandler =
    choose [
        GET >=> route "/zakat/nisab" >=> getCurrentNisabHandler
        POST >=> route "/zakat/calculate" >=> calculateZakatHandler
        GET >=> routef "/zakat/records/%s" getZakatRecordHandler
        PUT >=> routef "/zakat/records/%s" updateZakatRecordHandler
        DELETE >=> routef "/zakat/records/%s" deleteZakatRecordHandler
    ]
```

### Handler Implementation Pattern

**MUST** follow this handler structure for all endpoints:

```fsharp
// CORRECT: Handler pattern — validate input, call domain, return response
let createZakatRecordHandler : HttpHandler =
    fun next ctx -> task {
        // 1. Deserialize and validate input
        let! dto = ctx.BindJsonAsync<CreateZakatRecordDto>()

        let validationResult = result {
            let! payerId = PayerId.create dto.PayerId
            let! wealth = ValidatedAmount.create dto.Wealth
            return payerId, wealth
        }

        match validationResult with
        | Error msg ->
            // 2a. Return 400 for validation errors
            return! RequestErrors.BAD_REQUEST {| error = msg |} next ctx

        | Ok (payerId, wealth) ->
            // 2b. Call domain logic (pure)
            let zakatDue = ZakatDomain.calculateZakat wealth 5_000m

            // 3. Persist result (side effect at shell)
            let! record = ZakatRepository.create payerId zakatDue

            // 4. Return response
            return! Successful.CREATED record next ctx
    }
```

## Saturn Controller Pattern

**SHOULD** use Saturn's `controller {}` CE for standard CRUD endpoints:

```fsharp
open Saturn

let zakatController =
    controller {
        index indexAction      // GET /zakat
        show showAction        // GET /zakat/:id
        create createAction    // POST /zakat
        update updateAction    // PUT /zakat/:id
        delete deleteAction    // DELETE /zakat/:id
    }

let indexAction (ctx: HttpContext) =
    task {
        let! records = ZakatRepository.getAll ()
        return! Controller.json ctx records
    }
```

**MUST** use Saturn's `application {}` CE as the composition root:

```fsharp
let app =
    application {
        url "http://0.0.0.0:5000"
        use_router zakatRouter
        use_static "wwwroot"
        use_gzip
        use_jwt_authentication jwtSecret audience
        memory_cache
        use_developer_exceptions
    }

[<EntryPoint>]
let main _ =
    run app
    0
```

## JSON Serialization

**MUST** use `System.Text.Json` with camelCase naming:

```fsharp
// CORRECT: System.Text.Json configured at startup
open Giraffe.SystemTextJson

let configureServices (services: IServiceCollection) =
    services.AddGiraffe()
    let jsonOptions = JsonSerializerOptions()
    jsonOptions.PropertyNamingPolicy <- JsonNamingPolicy.CamelCase
    jsonOptions.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
    services.AddSingleton<Json.ISerializer>(SystemTextJson.Serializer(jsonOptions))
    |> ignore
```

**SHOULD** use `Newtonsoft.Json` with F# converters only when `System.Text.Json` cannot handle the required F# type (e.g., complex discriminated union serialization):

```fsharp
// Use Newtonsoft.Json when DU serialization is complex
open Newtonsoft.Json
open Newtonsoft.Json.FSharp  // FSharp.SystemTextJson or similar converter package
```

### Record Serialization

F# records serialize to JSON objects automatically with `System.Text.Json`:

```fsharp
// F# record
type ZakatResponse = {
    ZakatDue: decimal
    CalculatedAt: System.DateTimeOffset
}

// Serializes to: {"zakatDue": 2500.00, "calculatedAt": "2026-03-09T..."}
```

## Error Response Standards

**MUST** return consistent error response structure:

```fsharp
// CORRECT: Consistent error response shape
type ApiError = {
    Error: string
    Details: string option
    TraceId: string
}

let badRequestWithError (message: string) (details: string option) : HttpHandler =
    fun next ctx -> task {
        let error = {
            Error = message
            Details = details
            TraceId = ctx.TraceIdentifier
        }
        return! RequestErrors.BAD_REQUEST error next ctx
    }
```

**MUST** map domain `Result` errors to HTTP status codes at the handler layer:

```fsharp
// CORRECT: Domain Result → HTTP response mapping at handler boundary
let handleDomainResult (result: Result<'T, ZakatError>) : HttpHandler =
    match result with
    | Ok value -> Successful.OK value
    | Error (NegativeWealth _) -> RequestErrors.BAD_REQUEST {| error = "Wealth cannot be negative" |}
    | Error NisabNotConfigured -> ServerErrors.INTERNAL_ERROR {| error = "Nisab not configured" |}
    | Error (CalculationOverflow) -> RequestErrors.UNPROCESSABLE_ENTITY {| error = "Calculation overflow" |}
```

## Enforcement

- **Code reviews** — Fish operator (`>=>`) verified for handler composition
- **Integration tests** — All routes tested with Expecto + TestServer
- **OpenAPI** — Swashbuckle or similar generates API docs from route definitions

**Pre-commit checklist**:

- [ ] All routes declared explicitly in `choose []`
- [ ] Auth middleware applied to protected route groups
- [ ] Validation at the handler boundary, domain logic pure
- [ ] JSON configured with camelCase naming
- [ ] Error responses follow consistent `ApiError` shape
- [ ] HTTP status codes match domain error semantics

## Related Standards

- [Error Handling Standards](error-handling-standards.md) - Result to HTTP mapping
- [Security Standards](security-standards.md) - Auth middleware in Giraffe pipeline
- [Testing Standards](testing-standards.md) - Integration testing Giraffe handlers

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS, Giraffe 7.x, Saturn 0.16+
