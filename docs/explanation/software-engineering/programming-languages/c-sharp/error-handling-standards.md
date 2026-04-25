---
title: "C# Error Handling Standards"
description: Authoritative OSE Platform C# error handling standards (exception hierarchy, ProblemDetails, Result pattern, global middleware)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - error-handling
  - exceptions
  - result-type
  - problem-details
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Error Handling Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative error handling standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers designing error flows and API responses

**Scope**: Custom exception hierarchy, ProblemDetails RFC 7807, Result<T,E> pattern, global exception middleware, cancellation handling

## Software Engineering Principles

### 1. Explicit Over Implicit

**PASS Example** (Explicit error representation):

```csharp
// CORRECT: explicit Result type - caller cannot ignore errors
public Result<ZakatTransaction, ZakatDomainError> Calculate(decimal wealth, decimal nisab)
{
    if (wealth < 0)
        return ZakatDomainError.NegativeWealth(wealth);

    if (nisab <= 0)
        return ZakatDomainError.InvalidNisab(nisab);

    decimal zakatAmount = wealth >= nisab ? wealth * 0.025m : 0m;
    return new ZakatTransaction { ZakatAmount = zakatAmount };
}

// Caller MUST handle both outcomes
var result = service.Calculate(wealth, nisab);
if (result.IsFailure)
{
    return BadRequest(result.Error.ToProblems());
}
var transaction = result.Value;
```

### 2. Pure Functions Over Side Effects

**PASS Example** (Domain errors without side effects):

```csharp
// CORRECT: pure domain error - no logging, no HttpContext dependencies
public sealed record ZakatDomainError(string Code, string Message)
{
    public static ZakatDomainError NegativeWealth(decimal wealth) =>
        new("ZAKAT_NEGATIVE_WEALTH", $"Wealth cannot be negative. Provided: {wealth}");

    public static ZakatDomainError InvalidNisab(decimal nisab) =>
        new("ZAKAT_INVALID_NISAB", $"Nisab must be positive. Provided: {nisab}");
}
```

## Custom Exception Hierarchy

**MUST** define a domain exception hierarchy with `OsePlatformException` as base class.

```csharp
// OsePlatformException.cs - base exception for all domain exceptions
namespace OsePlatform.Shared.Exceptions;

public abstract class OsePlatformException : Exception
{
    public string Code { get; }

    protected OsePlatformException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    protected OsePlatformException(string code, string message, Exception innerException)
        : base(message, innerException)
    {
        Code = code;
    }
}

// Domain exceptions
public sealed class ZakatDomainException : OsePlatformException
{
    public ZakatDomainException(string code, string message)
        : base(code, message) { }

    public static ZakatDomainException NegativeWealth(decimal wealth) =>
        new("ZAKAT_NEGATIVE_WEALTH", $"Wealth cannot be negative. Provided: {wealth}");

    public static ZakatDomainException BelowNisab(decimal wealth, decimal nisab) =>
        new("ZAKAT_BELOW_NISAB",
            $"Wealth {wealth} is below nisab threshold {nisab}. Zakat is not obligatory.");
}

// Infrastructure exceptions
public sealed class ZakatPersistenceException : OsePlatformException
{
    public ZakatPersistenceException(string message, Exception innerException)
        : base("ZAKAT_PERSISTENCE_ERROR", message, innerException) { }
}

// Validation exceptions (for input validation failures)
public sealed class ValidationException : OsePlatformException
{
    public IReadOnlyList<ValidationFailure> Failures { get; }

    public ValidationException(IReadOnlyList<ValidationFailure> failures)
        : base("VALIDATION_ERROR", "One or more validation errors occurred.")
    {
        Failures = failures;
    }
}

public sealed record ValidationFailure(string Field, string Message);
```

## ProblemDetails (RFC 7807)

**MUST** use ProblemDetails for all HTTP API error responses in ASP.NET Core.

### Global Exception Handler (ASP.NET Core 8+)

```csharp
// GlobalExceptionHandler.cs
using Microsoft.AspNetCore.Diagnostics;

namespace OsePlatform.Api.Middleware;

internal sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, problemDetails) = exception switch
        {
            ValidationException validationEx => (
                StatusCodes.Status400BadRequest,
                new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Validation Error",
                    Type = "https://ose-platform.com/errors/validation",
                    Detail = validationEx.Message,
                    Extensions = { ["errors"] = validationEx.Failures }
                }),

            ZakatDomainException domainEx => (
                StatusCodes.Status422UnprocessableEntity,
                new ProblemDetails
                {
                    Status = StatusCodes.Status422UnprocessableEntity,
                    Title = "Domain Rule Violation",
                    Type = $"https://ose-platform.com/errors/{domainEx.Code.ToLowerInvariant()}",
                    Detail = domainEx.Message
                }),

            _ => (
                StatusCodes.Status500InternalServerError,
                new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred",
                    Type = "https://ose-platform.com/errors/internal"
                })
        };

        logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);
        return true;
    }
}

// Program.cs registration
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

app.UseExceptionHandler();
```

### Manual ProblemDetails in Controllers

```csharp
// CORRECT: return ProblemDetails for expected errors
[HttpPost]
public async Task<IActionResult> CreateZakatTransaction(
    [FromBody] CreateZakatRequest request,
    CancellationToken cancellationToken)
{
    try
    {
        var transaction = await _service.ProcessAsync(
            request.PayerId, request.Wealth, cancellationToken);
        return Created($"/api/zakat/{transaction.TransactionId}", transaction);
    }
    catch (ZakatDomainException ex)
    {
        return UnprocessableEntity(new ProblemDetails
        {
            Status = StatusCodes.Status422UnprocessableEntity,
            Title = "Domain Rule Violation",
            Detail = ex.Message,
            Type = $"https://ose-platform.com/errors/{ex.Code.ToLowerInvariant()}"
        });
    }
}
```

## Result<T,E> Pattern

**SHOULD** use a Result type in domain and application layers to avoid exception-driven control flow for expected business failures.

```csharp
// Result.cs - lightweight Result type
namespace OsePlatform.Shared;

public sealed class Result<TValue, TError>
{
    private readonly TValue? _value;
    private readonly TError? _error;

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    public TValue Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access Value of a failed Result.");

    public TError Error => IsFailure
        ? _error!
        : throw new InvalidOperationException("Cannot access Error of a successful Result.");

    private Result(TValue value)
    {
        IsSuccess = true;
        _value = value;
    }

    private Result(TError error)
    {
        IsSuccess = false;
        _error = error;
    }

    public static implicit operator Result<TValue, TError>(TValue value) => new(value);
    public static implicit operator Result<TValue, TError>(TError error) => new(error);

    public TResult Match<TResult>(
        Func<TValue, TResult> onSuccess,
        Func<TError, TResult> onFailure)
        => IsSuccess ? onSuccess(_value!) : onFailure(_error!);
}

// Usage in domain service
public Result<ZakatTransaction, ZakatDomainError> Calculate(decimal wealth, decimal nisab)
{
    if (wealth < 0)
        return ZakatDomainError.NegativeWealth(wealth);

    decimal zakatAmount = wealth >= nisab ? wealth * 0.025m : 0m;
    return new ZakatTransaction
    {
        TransactionId = Guid.NewGuid(),
        Wealth = wealth,
        ZakatAmount = zakatAmount
    };
}

// Usage in ASP.NET Core controller
var result = _calculator.Calculate(request.Wealth, _nisab);
return result.Match(
    onSuccess: transaction => Created($"/api/zakat/{transaction.TransactionId}", transaction),
    onFailure: error => UnprocessableEntity(new ProblemDetails
    {
        Status = 422,
        Title = error.Code,
        Detail = error.Message
    }));
```

## Never Swallow Exceptions

**PROHIBITED**: Catching exceptions without rethrowing or logging.

```csharp
// WRONG: swallowed exception
try
{
    await _repository.AddAsync(transaction, cancellationToken);
}
catch (Exception)
{
    // silently discarded - nothing logged, nothing rethrown
}

// CORRECT: log and rethrow as domain exception
try
{
    await _repository.AddAsync(transaction, cancellationToken);
}
catch (DbUpdateException ex)
{
    _logger.LogError(ex, "Failed to persist Zakat transaction {TransactionId}",
        transaction.TransactionId);
    throw new ZakatPersistenceException(
        $"Failed to save Zakat transaction {transaction.TransactionId}.", ex);
}
```

## CancellationToken Handling

**MUST** propagate `CancellationToken` to all I/O-bound operations. **MUST** handle `OperationCanceledException` at the outermost boundary only.

```csharp
// CORRECT: propagate CancellationToken through the call chain
public async Task<ZakatTransaction> ProcessAsync(
    Guid payerId,
    decimal wealth,
    CancellationToken cancellationToken)
{
    var transaction = new ZakatTransaction { PayerId = payerId, Wealth = wealth };
    await _repository.AddAsync(transaction, cancellationToken); // propagated
    await _auditLog.RecordAsync(transaction, cancellationToken); // propagated
    return transaction;
}

// CORRECT: handle at outermost boundary (e.g., middleware or controller)
// ASP.NET Core handles OperationCanceledException from cancelled requests automatically
// DO NOT catch OperationCanceledException in domain or application layer

// WRONG: catching and suppressing cancellation
try
{
    await _repository.AddAsync(transaction, cancellationToken);
}
catch (OperationCanceledException)
{
    // swallowed! caller has no idea the operation was cancelled
}
```

## Argument Validation

**MUST** use the built-in .NET 8 `ArgumentException`, `ArgumentNullException`, `ArgumentOutOfRangeException` throw-helpers at entry points.

```csharp
// CORRECT: .NET 6+ throw helpers (no custom code needed)
public async Task<ZakatTransaction> ProcessAsync(
    Guid payerId,
    decimal wealth,
    CancellationToken cancellationToken)
{
    ArgumentNullException.ThrowIfNull(payerId);           // Guid.Empty not checked here; use below
    ArgumentOutOfRangeException.ThrowIfNegative(wealth);
    ArgumentOutOfRangeException.ThrowIfEqual(payerId, Guid.Empty);

    // ...
}

// WRONG: manual null checks (verbose)
if (payerId == Guid.Empty) throw new ArgumentException("PayerId cannot be empty.", nameof(payerId));
```

## Enforcement

- **Roslyn analyzers** - Detect empty catch blocks
- **SonarAnalyzer** - S2486 (empty catch clause), S2139 (catch re-throw) violations
- **Code reviews** - Verify ProblemDetails usage and cancellation propagation

**Pre-commit checklist**:

- [ ] All exceptions extend `OsePlatformException`
- [ ] HTTP errors returned as `ProblemDetails`
- [ ] No empty `catch` blocks
- [ ] `CancellationToken` propagated to all async I/O operations
- [ ] `OperationCanceledException` not caught in domain/application layers
- [ ] `ArgumentNullException.ThrowIfNull` used at entry points

## Related Standards

- [API Standards](api-standards.md) - ProblemDetails in REST API responses
- [Concurrency Standards](concurrency-standards.md) - CancellationToken best practices
- [Testing Standards](testing-standards.md) - FluentAssertions exception testing

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
