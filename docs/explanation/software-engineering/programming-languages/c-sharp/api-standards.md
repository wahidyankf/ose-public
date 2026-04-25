---
title: "C# API Standards"
description: Authoritative OSE Platform C# API standards (ASP.NET Core REST, Minimal API, versioning, OpenAPI, CQRS with MediatR)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - api-standards
  - aspnet-core
  - rest
  - minimal-api
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# API Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative API standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers building HTTP APIs

**Scope**: Controller-based vs Minimal API, route naming, HTTP method conventions, ProblemDetails, API versioning, OpenAPI/Swagger, pagination, CQRS with MediatR

## Software Engineering Principles

### 1. Explicit Over Implicit

**PASS Example** (Explicit route and response types):

```csharp
// CORRECT: explicit route template, HTTP method, response type, authorization
[HttpPost("api/v{version:apiVersion}/zakat")]
[MapToApiVersion("1.0")]
[Authorize(Policy = "ZakatAdministrator")]
[ProducesResponseType<ZakatTransactionDto>(StatusCodes.Status201Created)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
[ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
public async Task<IActionResult> CreateZakatTransaction(
    [FromBody] CreateZakatCommand command,
    CancellationToken cancellationToken)
{
    var result = await _mediator.Send(command, cancellationToken);
    return CreatedAtAction(nameof(GetZakatTransaction),
        new { id = result.TransactionId }, result);
}
```

### 2. Pure Functions Over Side Effects

**PASS Example** (CQRS command/query separation):

```csharp
// CORRECT: pure query - no side effects, returns data
public sealed record GetZakatTransactionQuery(Guid TransactionId)
    : IRequest<ZakatTransactionDto?>;

// CORRECT: command with side effects isolated to handler
public sealed record CreateZakatCommand(Guid PayerId, decimal Wealth)
    : IRequest<ZakatTransactionDto>;
```

## Controller-Based API vs Minimal API

**MUST** use this decision framework:

| Scenario                                           | Use              |
| -------------------------------------------------- | ---------------- |
| Complex domain with many endpoints (>10 per group) | Controller-based |
| Middleware/filters shared across endpoints         | Controller-based |
| Simple CRUD or microservice (<10 endpoints)        | Minimal API      |
| Performance-critical endpoints                     | Minimal API      |
| Prototype or internal tooling API                  | Minimal API      |

### Controller-Based API

```csharp
// ZakatController.cs
[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiVersion("1.0")]
public sealed class ZakatController(IMediator mediator) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [ProducesResponseType<ZakatTransactionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetZakatTransaction(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetZakatTransactionQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType<ZakatTransactionDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateZakatTransaction(
        [FromBody] CreateZakatCommand command,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetZakatTransaction), new { id = result.TransactionId }, result);
    }
}
```

### Minimal API

```csharp
// ZakatEndpoints.cs - Minimal API with endpoint groups
public static class ZakatEndpoints
{
    public static RouteGroupBuilder MapZakatEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("/{id:guid}", GetZakatTransaction)
            .WithName("GetZakatTransaction")
            .Produces<ZakatTransactionDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateZakatTransaction)
            .WithName("CreateZakatTransaction")
            .Produces<ZakatTransactionDto>(StatusCodes.Status201Created)
            .ProducesValidationProblem();

        return group;
    }

    private static async Task<IResult> GetZakatTransaction(
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetZakatTransactionQuery(id), cancellationToken);
        return result is null ? Results.NotFound() : Results.Ok(result);
    }

    private static async Task<IResult> CreateZakatTransaction(
        CreateZakatCommand command,
        IValidator<CreateZakatCommand> validator,
        IMediator mediator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(command, cancellationToken);
        if (!validation.IsValid)
            return Results.ValidationProblem(validation.ToDictionary());

        var result = await mediator.Send(command, cancellationToken);
        return Results.CreatedAtRoute("GetZakatTransaction", new { id = result.TransactionId }, result);
    }
}

// Program.cs registration
app.MapGroup("api/v1/zakat")
    .MapZakatEndpoints()
    .RequireAuthorization("ZakatAdministrator");
```

## Route Naming Conventions

**MUST** follow these route naming rules:

- Routes MUST be lowercase: `/api/v1/zakat-transactions` (not `/api/v1/ZakatTransactions`)
- Use kebab-case for multi-word resources: `/api/v1/murabaha-contracts`
- Use plural nouns for resource collections: `/api/v1/zakat-transactions`
- Nest sub-resources: `/api/v1/zakat-payers/{payerId}/transactions`

```csharp
// CORRECT: lowercase, plural, kebab-case
[Route("api/v{version:apiVersion}/zakat-transactions")]

// WRONG: PascalCase, singular
[Route("api/v{version:apiVersion}/ZakatTransaction")]
```

## HTTP Method Conventions

**MUST** use HTTP methods with correct semantics:

| Method   | Use                      | Idempotent | Safe |
| -------- | ------------------------ | ---------- | ---- |
| `GET`    | Retrieve resource(s)     | Yes        | Yes  |
| `POST`   | Create new resource      | No         | No   |
| `PUT`    | Full replace of resource | Yes        | No   |
| `PATCH`  | Partial update           | No         | No   |
| `DELETE` | Remove resource          | Yes        | No   |

```csharp
// CORRECT: HTTP method semantics
[HttpGet("{id:guid}")]   // retrieve specific transaction
[HttpGet]                // retrieve collection (with query filters)
[HttpPost]               // create new transaction
[HttpPut("{id:guid}")]   // full update (all fields required)
[HttpPatch("{id:guid}")] // partial update (only changed fields)
[HttpDelete("{id:guid}")] // delete transaction
```

## ProblemDetails Error Responses

**MUST** return ProblemDetails for all error responses. See [Error Handling Standards](error-handling-standards.md) for global exception handler setup.

```csharp
// CORRECT: use built-in Results helpers for standard errors
return Results.NotFound(new ProblemDetails
{
    Status = 404,
    Title = "Transaction Not Found",
    Detail = $"Zakat transaction {id} was not found.",
    Type = "https://ose-platform.com/errors/not-found"
});

return Results.UnprocessableEntity(new ProblemDetails
{
    Status = 422,
    Title = "Domain Rule Violation",
    Detail = "Wealth is below nisab threshold.",
    Type = "https://ose-platform.com/errors/zakat-below-nisab"
});
```

## API Versioning

**MUST** use `Asp.Versioning` for API versioning. **MUST** version all APIs from the start.

```csharp
// Program.cs
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version"));
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
```

## OpenAPI / Swagger Documentation

**MUST** provide OpenAPI documentation for all public APIs.

```csharp
// Program.cs - OpenAPI/Swagger setup
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "OSE Platform Zakat API",
        Version = "v1",
        Description = "Sharia-compliant Zakat calculation and management API.",
        Contact = new OpenApiContact { Name = "OSE Platform Team" }
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        }] = []
    });

    // Include XML documentation comments
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFile));
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
```

## Cursor-Based Pagination

**MUST** use cursor-based pagination for large result sets. **SHOULD NOT** use offset-based pagination for datasets expected to grow beyond 10,000 records.

```csharp
// PaginatedResult.cs
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    string? NextCursor,
    bool HasNextPage);

// Query with cursor
public sealed record GetZakatTransactionsQuery(
    Guid PayerId,
    string? AfterCursor = null,
    int PageSize = 20) : IRequest<PagedResult<ZakatTransactionDto>>;

// Handler
public async Task<PagedResult<ZakatTransactionDto>> Handle(
    GetZakatTransactionsQuery query,
    CancellationToken cancellationToken)
{
    var cursorDate = query.AfterCursor is not null
        ? DecodeCursor(query.AfterCursor)
        : DateTimeOffset.MaxValue;

    var transactions = await _dbContext.ZakatTransactions
        .Where(t => t.PayerId == query.PayerId && t.PaidAt < cursorDate)
        .OrderByDescending(t => t.PaidAt)
        .Take(query.PageSize + 1) // fetch one extra to detect next page
        .ToListAsync(cancellationToken);

    var hasNextPage = transactions.Count > query.PageSize;
    var items = transactions.Take(query.PageSize).Select(t => t.ToDto()).ToList();
    var nextCursor = hasNextPage ? EncodeCursor(items.Last().PaidAt) : null;

    return new PagedResult<ZakatTransactionDto>(items, nextCursor, hasNextPage);
}

private static string EncodeCursor(DateTimeOffset date) =>
    Convert.ToBase64String(Encoding.UTF8.GetBytes(date.ToString("O")));

private static DateTimeOffset DecodeCursor(string cursor) =>
    DateTimeOffset.Parse(Encoding.UTF8.GetString(Convert.FromBase64String(cursor)));
```

## CQRS with MediatR

**SHOULD** use CQRS with MediatR for complex domains. Commands and queries MUST be separate.

```csharp
// Commands (write side - have side effects)
public sealed record CreateZakatCommand(Guid PayerId, decimal Wealth)
    : IRequest<ZakatTransactionDto>;

public sealed class CreateZakatCommandHandler(
    IZakatService service,
    IMapper mapper) : IRequestHandler<CreateZakatCommand, ZakatTransactionDto>
{
    public async Task<ZakatTransactionDto> Handle(
        CreateZakatCommand command,
        CancellationToken cancellationToken)
    {
        var transaction = await service.ProcessAsync(
            command.PayerId, command.Wealth, cancellationToken);
        return mapper.Map<ZakatTransactionDto>(transaction);
    }
}

// Queries (read side - no side effects)
public sealed record GetZakatTransactionQuery(Guid TransactionId)
    : IRequest<ZakatTransactionDto?>;

public sealed class GetZakatTransactionQueryHandler(
    IZakatReadRepository readRepository)
    : IRequestHandler<GetZakatTransactionQuery, ZakatTransactionDto?>
{
    public async Task<ZakatTransactionDto?> Handle(
        GetZakatTransactionQuery query,
        CancellationToken cancellationToken)
    {
        return await readRepository.GetByIdAsync(query.TransactionId, cancellationToken);
    }
}
```

## Enforcement

- **Roslyn analyzers** - Route attribute validation
- **OpenAPI schema** - Validates response type declarations
- **Code reviews** - Verify HTTP method semantics, ProblemDetails, versioning

**Pre-commit checklist**:

- [ ] All routes lowercase and kebab-case
- [ ] HTTP methods match semantics (GET for read, POST for create, etc.)
- [ ] All error responses use ProblemDetails
- [ ] API versioning configured from first endpoint
- [ ] OpenAPI documentation includes all endpoints
- [ ] Pagination uses cursor-based approach for large collections
- [ ] CQRS commands and queries separated

## Related Standards

- [Error Handling Standards](error-handling-standards.md) - ProblemDetails exception handler
- [Security Standards](security-standards.md) - Authentication, authorization, input validation
- [Framework Integration](framework-integration.md) - Middleware pipeline, DI registration

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
