---
title: "C# Type Safety Standards"
description: Authoritative OSE Platform C# type safety standards (nullable reference types, generics, discriminated unions, pattern matching)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - type-safety
  - nullable-reference-types
  - generics
  - records
  - pattern-matching
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Type Safety Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative type safety standards** for C# in the OSE Platform.

**Target Audience**: OSE Platform C# developers building type-safe domain models and APIs

**Scope**: Nullable reference types, records for immutable value types, discriminated unions, generic constraints, pattern matching, generic math, avoiding `object`/`dynamic`

## Software Engineering Principles

### 1. Explicit Over Implicit

**PASS Example** (Explicit nullability and type constraints):

```csharp
// CORRECT: explicit nullable annotation - compiler enforces null handling
public ZakatTransaction? FindByPayerId(Guid payerId)  // ? = may be null
    => _transactions.FirstOrDefault(t => t.PayerId == payerId);

// Caller MUST handle null
var tx = FindByPayerId(payerId);
if (tx is null) return NotFound();
ProcessTransaction(tx); // compiler knows non-null here
```

### 2. Immutability Over Mutability

**PASS Example** (Records for immutable domain types):

```csharp
// CORRECT: record provides immutability + structural equality
public sealed record ZakatTransactionId(Guid Value)
{
    public static ZakatTransactionId New() => new(Guid.NewGuid());
}

// Creating "modified" version returns new instance
var originalId = ZakatTransactionId.New();
var correctedId = originalId with { Value = Guid.NewGuid() }; // new record, original unchanged
```

## Nullable Reference Types

**MUST** enable nullable reference types for all projects (see [Code Quality Standards](code-quality-standards.md)).

### Nullable Annotations

```csharp
// CORRECT: annotate reference types that may be null
public string? MiddleName { get; init; }              // optional, may be null
public string FirstName { get; init; } = default!;   // required, non-null

// CORRECT: guard with null checks
public string GetFullName(string? middleName)
{
    return middleName is null
        ? $"{FirstName} {LastName}"
        : $"{FirstName} {middleName} {LastName}";
}
```

### Null-Forgiving Operator

**MUST** use null-forgiving operator `!` only with documented justification. **PROHIBITED**: using `!` to silence warnings without understanding why the value cannot be null.

```csharp
// CORRECT: justified use of null-forgiving operator
// The EF Core model ensures PayerId is always set for persisted entities
var payerId = transaction.PayerId!; // non-null guaranteed by DB schema

// WRONG: silencing without justification
var name = customer.Name!; // why is this non-null? no documentation
```

### Null Guards

**MUST** use .NET 8 throw-helpers for null guards at method boundaries.

```csharp
// CORRECT: .NET 6+ throw helpers
ArgumentNullException.ThrowIfNull(transaction);
ArgumentNullException.ThrowIfNullOrEmpty(payerId);
ArgumentNullException.ThrowIfNullOrWhiteSpace(currency);

// WRONG: manual null checks (verbose)
if (transaction == null) throw new ArgumentNullException(nameof(transaction));
```

## Records for Immutable Value Types

**MUST** use `record` for:

- Value Objects in domain model (structural equality required)
- DTOs and API request/response models (immutable, init-only)
- Domain Events (immutable facts)

**MUST** use `record struct` or `readonly record struct` for small stack-friendly value types.

```csharp
// CORRECT: record for Value Object with structural equality
public sealed record Money(decimal Amount, string Currency)
{
    public bool Equals(Money? other) => other is not null
        && Amount == other.Amount
        && string.Equals(Currency, other.Currency, StringComparison.OrdinalIgnoreCase);

    public override int GetHashCode() =>
        HashCode.Combine(Amount, Currency.ToUpperInvariant());
}

// CORRECT: readonly record struct for small stack-allocated types
public readonly record struct ZakatRate(decimal Value)
{
    public static readonly ZakatRate Standard = new(0.025m);
    public static readonly ZakatRate Agricultural = new(0.10m);

    public decimal Calculate(decimal wealth) => wealth * Value;
}

// CORRECT: record for immutable DTO
public sealed record CreateZakatRequest(
    Guid PayerId,
    decimal Wealth,
    string Currency = "MYR");
```

## Discriminated Unions with Sealed Record Hierarchies

C# does not have native discriminated unions, but **SHOULD** use sealed class/record hierarchies to model sum types.

```csharp
// ZakatCalculationResult.cs - discriminated union for Zakat outcome
public abstract record ZakatResult;

public sealed record ZakatObligatory(decimal ZakatAmount) : ZakatResult;
public sealed record ZakatNotObligatory(string Reason) : ZakatResult;
public sealed record ZakatCalculationError(string Code, string Message) : ZakatResult;

// Usage: exhaustive switch expression
public IActionResult HandleZakatResult(ZakatResult result) =>
    result switch
    {
        ZakatObligatory obligatory =>
            Ok(new { ZakatAmount = obligatory.ZakatAmount }),

        ZakatNotObligatory notObligatory =>
            Ok(new { ZakatRequired = false, Reason = notObligatory.Reason }),

        ZakatCalculationError error =>
            UnprocessableEntity(new ProblemDetails
            {
                Title = error.Code,
                Detail = error.Message
            }),

        _ => throw new UnreachableException($"Unexpected ZakatResult type: {result.GetType()}")
    };
```

## Generic Constraints

**MUST** use generic constraints to enforce type safety at the call site.

```csharp
// CORRECT: constrain to reference types
public sealed class Repository<TEntity, TId>
    where TEntity : Entity<TId>
    where TId : notnull
{
    public async Task<TEntity?> GetByIdAsync(TId id, CancellationToken ct) => ...;
}

// CORRECT: constrain to value types (for numeric domain types)
public static TResult CalculateZakat<TResult>(TResult wealth, TResult nisab)
    where TResult : INumber<TResult>
{
    if (wealth < nisab) return TResult.Zero;
    return wealth * TResult.CreateChecked(0.025);
}

// CORRECT: new() constraint for factory methods
public static T Create<T>() where T : new() => new T();

// CORRECT: class constraint for nullable reference handling
public static T? FindOrDefault<T>(IEnumerable<T> items, Func<T, bool> predicate)
    where T : class
    => items.FirstOrDefault(predicate);

// CORRECT: notnull constraint prevents null type arguments
public static void Process<T>(T value) where T : notnull
{
    ArgumentNullException.ThrowIfNull(value);
}
```

## Pattern Matching

**MUST** use pattern matching for type-safe conditional logic. **MUST** use `_` discard in switch expressions for exhaustiveness.

### Switch Expressions

```csharp
// CORRECT: switch expression for domain classification
public static string ClassifyZakatAsset(ZakatAssetType assetType) =>
    assetType switch
    {
        ZakatAssetType.Gold or ZakatAssetType.Silver => "Precious Metals",
        ZakatAssetType.Cash => "Monetary Assets",
        ZakatAssetType.TradeGoods => "Commercial Assets",
        ZakatAssetType.LivestockCattle => "Agricultural Assets",
        _ => throw new ArgumentOutOfRangeException(nameof(assetType), assetType, null)
    };
```

### Positional Patterns

```csharp
// CORRECT: positional pattern matching with records
public static decimal CalculateZakat(Money wealth, Money nisab) =>
    (wealth, nisab) switch
    {
        (var w, var n) when w.Currency != n.Currency =>
            throw new InvalidOperationException("Currency mismatch"),
        (var w, var n) when w.Amount >= n.Amount =>
            w.Amount * 0.025m,
        _ => 0m
    };
```

### List Patterns (C# 11+)

```csharp
// CORRECT: list pattern for validating installment schedule
public static bool IsValidInstallmentSchedule(decimal[] schedule) =>
    schedule switch
    {
        [] => false,                        // empty - invalid
        [var single] => single > 0,         // single payment
        [var first, .., var last]           // multiple payments
            when first > 0 && last > 0 => true,
        _ => false
    };
```

### `is` Patterns

```csharp
// CORRECT: is pattern with type test and property binding
if (exception is ZakatDomainException { Code: var code } domainEx
    && code.StartsWith("ZAKAT_"))
{
    logger.LogWarning("Zakat domain violation: {Code} - {Message}", code, domainEx.Message);
    return UnprocessableEntity(domainEx.Message);
}
```

## Generic Math (INumber<T>, C# 11+)

**SHOULD** use generic math interfaces for type-safe numeric domain calculations that work across `decimal`, `double`, and custom numeric types.

```csharp
// CORRECT: generic math for Zakat calculation (works with decimal, double, etc.)
using System.Numerics;

public static class ZakatMath
{
    // Works with any INumber<T> - decimal, double, float, int
    public static T CalculateZakat<T>(T wealth, T nisab)
        where T : INumber<T>
    {
        if (wealth < nisab) return T.Zero;

        // 2.5% = 25/1000
        var rate = T.CreateChecked(25) / T.CreateChecked(1000);
        return wealth * rate;
    }
}

// Usage
decimal zakatDecimal = ZakatMath.CalculateZakat(100_000m, 5_000m);  // 2500.00
double zakatDouble = ZakatMath.CalculateZakat(100_000.0, 5_000.0);   // 2500.0
```

## Avoid `object` and `dynamic`

**PROHIBITED**: Using `object` or `dynamic` in domain and application code where type is known.

```csharp
// WRONG: object loses type safety
public object CalculateZakat(object wealth) => (decimal)wealth * 0.025m; // runtime error if wrong type

// WRONG: dynamic bypasses compile-time type checking
public dynamic GetZakatResult(dynamic input) => input.ZakatAmount; // runtime error if field missing

// CORRECT: use concrete types or generics
public decimal CalculateZakat(decimal wealth, decimal nisab)
    => wealth >= nisab ? wealth * 0.025m : 0m;

// CORRECT: use discriminated union records for flexible return types
public ZakatResult CalculateZakat(Money wealth, Money nisab) =>
    wealth.Amount >= nisab.Amount
        ? new ZakatObligatory(wealth.Amount * 0.025m)
        : new ZakatNotObligatory("Wealth is below nisab threshold.");
```

## Enforcement

- **Nullable reference types** - `CS8600-CS8618` compiler warnings treated as errors
- **Roslyn analyzers** - `CA1000+` type safety rules
- **Code reviews** - Verify no `object`/`dynamic` in domain code, no unjustified `!` operator

**Pre-commit checklist**:

- [ ] `#nullable enable` active (or `<Nullable>enable</Nullable>` in project file)
- [ ] All nullable reference type warnings resolved
- [ ] Null-forgiving operator `!` used only with documented justification
- [ ] No `object` or `dynamic` in domain or application code
- [ ] Generic constraints enforce intended type invariants
- [ ] Switch expressions include `_` discard for exhaustiveness
- [ ] Records used for all Value Objects and DTOs

## Related Standards

- [Coding Standards](coding-standards.md) - Record types, pattern matching idioms
- [Code Quality Standards](code-quality-standards.md) - Nullable reference type enforcement
- [DDD Standards](ddd-standards.md) - Value Objects and strongly-typed IDs

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12), Generic Math (C# 11+)
