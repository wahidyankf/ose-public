---
title: "C# Coding Standards"
description: Authoritative OSE Platform C# coding standards (naming conventions, idioms, best practices, anti-patterns)
category: explanation
subcategory: prog-lang
tags:
  - csharp
  - coding-standards
  - idioms
  - best-practices
  - anti-patterns
  - dotnet
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# C# Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand C# fundamentals from [AyoKoding C# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/c-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a C# tutorial. We define HOW to apply C# in THIS codebase, not WHAT C# is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for C# development in the OSE Platform. These are prescriptive rules that MUST be followed across all C# projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform C# developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform naming conventions, namespace organization, C# 12 idioms, best practices, and anti-patterns to avoid

## Software Engineering Principles

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error.

**How C# Implements**:

- `dotnet format` for automated formatting (enforced pre-commit)
- Roslyn analyzers for compile-time code style enforcement
- `dotnet test` with Coverlet for automated coverage measurement
- Source Generators for boilerplate code generation
- `TreatWarningsAsErrors` to catch style violations at build time

**PASS Example** (Automated Zakat Calculation Validation):

```csharp
// ZakatCalculatorTests.cs - Automated validation with xUnit
public class ZakatCalculatorTests
{
    [Theory]
    [InlineData(100_000, 5_000, 2_500)]
    [InlineData(4_000, 5_000, 0)]
    public void Calculate_WealthAboveNisab_Returns2Point5Percent(
        decimal wealth,
        decimal nisab,
        decimal expectedZakat)
    {
        var calculator = new ZakatCalculator();

        decimal actualZakat = calculator.Calculate(wealth, nisab);

        actualZakat.Should().Be(expectedZakat);
    }
}
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit configuration and types over magic, convention, and hidden behavior.

**How C# Implements**:

- `#nullable enable` (or project-wide `<Nullable>enable</Nullable>`) to make nullability explicit
- Explicit DI lifetime registration (never rely on convention-based scanning without review)
- File-scoped namespaces matching folder structure exactly
- Explicit `async/await` keywords (no `.Result` or `.Wait()` in application code)
- Explicit `CancellationToken` parameters in all I/O-bound methods

**PASS Example** (Explicit Murabaha Contract):

```csharp
// MurabahaContract.cs - explicit record with required properties
namespace OsePlatform.Finance.Murabaha;

public sealed record MurabahaContract
{
    public required Guid ContractId { get; init; }
    public required Guid CustomerId { get; init; }
    public required decimal CostPrice { get; init; }
    public required decimal ProfitMargin { get; init; }
    public required int InstallmentCount { get; init; }

    public decimal TotalPrice => CostPrice + ProfitMargin;
}

// MurabahaService.cs - explicit async + CancellationToken
public sealed class MurabahaService(IMurabahaRepository repository)
{
    public async Task<MurabahaContract> CreateContractAsync(
        Guid customerId,
        decimal costPrice,
        decimal profitMargin,
        int installmentCount,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(costPrice);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(profitMargin);

        var contract = new MurabahaContract
        {
            ContractId = Guid.NewGuid(),
            CustomerId = customerId,
            CostPrice = costPrice,
            ProfitMargin = profitMargin,
            InstallmentCount = installmentCount
        };

        await repository.AddAsync(contract, cancellationToken);
        return contract;
    }
}
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures to prevent unintended state changes.

**How C# Implements**:

- `record` and `record struct` for immutable value types with structural equality
- `init`-only properties to allow object initializer syntax while preventing later mutation
- `IReadOnlyList<T>`, `IReadOnlyCollection<T>` for exposed collection properties
- `with` expressions for non-destructive mutation of records

**PASS Example** (Immutable Zakat Transaction):

```csharp
// ZakatTransaction.cs - immutable record
namespace OsePlatform.Zakat;

public sealed record ZakatTransaction
{
    public required Guid TransactionId { get; init; }
    public required Guid PayerId { get; init; }
    public required decimal Wealth { get; init; }
    public required decimal ZakatAmount { get; init; }
    public required DateTimeOffset PaidAt { get; init; }

    // Correction creates a NEW record, never mutating the original
    public ZakatTransaction WithCorrectedAmount(decimal correctedAmount) =>
        this with { ZakatAmount = correctedAmount, TransactionId = Guid.NewGuid() };
}
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free.

**How C# Implements**:

- `static` methods for pure domain calculations (no instance state dependency)
- Domain logic classes that take only domain types as arguments (no `ILogger`, `DbContext`)
- LINQ pipelines for functional collection transformations
- `static readonly` for compile-time constant domain values

**PASS Example** (Pure Zakat Calculation):

```csharp
// ZakatCalculator.cs - pure static domain logic
namespace OsePlatform.Zakat;

public static class ZakatCalculator
{
    private const decimal ZakatRate = 0.025m; // 2.5%

    // Pure function: same inputs always return same output, no side effects
    public static decimal Calculate(decimal wealth, decimal nisab)
    {
        if (wealth < nisab)
            return 0m;

        return wealth * ZakatRate;
    }
}

// ZakatCalculatorTests.cs - pure functions are trivial to test
public class ZakatCalculatorTests
{
    [Theory]
    [InlineData(100_000, 5_000, 2_500)]
    [InlineData(4_000, 5_000, 0)]
    [InlineData(5_000, 5_000, 125)] // exactly at nisab threshold
    public void Calculate_ReturnsCorrectZakat(decimal wealth, decimal nisab, decimal expected)
    {
        decimal result = ZakatCalculator.Calculate(wealth, nisab);

        result.Should().Be(expected);
    }
}
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments.

**How C# Implements**:

- `global.json` pins the exact .NET SDK version at solution root
- `Directory.Packages.props` centralizes all NuGet versions in one file
- `packages.lock.json` committed to git for lockfile-based reproducible restores
- `.editorconfig` committed to git for deterministic formatting rules

**PASS Example** (Reproducible Environment):

```json
// global.json - pins exact SDK version
{
  "sdk": {
    "version": "8.0.404",
    "rollForward": "disable"
  }
}
```

```xml
<!-- Directory.Packages.props - centralized NuGet versions -->
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
    <RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="xunit" Version="2.9.3" />
    <PackageVersion Include="FluentAssertions" Version="6.12.2" />
    <PackageVersion Include="Moq" Version="4.20.72" />
    <PackageVersion Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
  </ItemGroup>
</Project>
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Part 1: Naming Conventions

### Classes, Structs, Records

**MUST** use PascalCase for all type declarations.

```csharp
// CORRECT
public class ZakatCalculator { }
public struct Money { }
public record MurabahaContract { }
public record struct ZakatRate { }

// WRONG
public class zakatCalculator { }  // lowercase start
public class zakat_calculator { } // underscores
```

### Interfaces

**MUST** prefix interface names with `I`.

```csharp
// CORRECT
public interface IZakatRepository { }
public interface IContractValidator { }

// WRONG
public interface ZakatRepository { }  // missing I prefix
public interface ZakatRepositoryInterface { } // verbose suffix instead of I prefix
```

### Methods and Properties

**MUST** use PascalCase for all public members. **MUST** use PascalCase for all methods regardless of visibility.

```csharp
// CORRECT
public decimal TotalPrice => CostPrice + ProfitMargin;
public async Task<ZakatTransaction> CalculateAsync(decimal wealth) { }
private void ValidateNisabThreshold() { }

// WRONG
public decimal totalPrice { } // camelCase property
public async Task<ZakatTransaction> calculate_async() { } // snake_case
```

### Fields

**MUST** use camelCase with underscore prefix for private instance fields.

```csharp
// CORRECT
private readonly IZakatRepository _repository;
private readonly ILogger<ZakatService> _logger;
private static readonly decimal _defaultNisab = 5_000m;

// WRONG
private IZakatRepository Repository;    // PascalCase private field
private IZakatRepository zakatRepo;    // no underscore prefix
private IZakatRepository m_repository; // Hungarian notation
```

### Parameters and Local Variables

**MUST** use camelCase for parameters and local variables.

```csharp
// CORRECT
public decimal Calculate(decimal wealthAmount, decimal nisabThreshold)
{
    decimal zakatRate = 0.025m;
    return wealthAmount * zakatRate;
}

// WRONG
public decimal Calculate(decimal WealthAmount, decimal NisabThreshold) // PascalCase params
{
    decimal ZakatRate = 0.025m; // PascalCase local
    return WealthAmount * ZakatRate;
}
```

### Constants

**MUST** use PascalCase for public constants and `static readonly` fields. Private constants MAY use PascalCase or camelCase with underscore prefix — choose one and be consistent.

```csharp
// CORRECT
public const decimal ZakatRatePercent = 2.5m;
public static readonly decimal DefaultNisab = 5_000m;

private const decimal _minimumWealthThreshold = 1_000m;
```

### Enumerations

**MUST** use PascalCase for enum type names and all enum member names.

```csharp
// CORRECT
public enum ZakatAssetType
{
    Gold,
    Silver,
    Cash,
    TradeGoods,
    LivestockCattle
}

// WRONG
public enum ZakatAssetType
{
    GOLD,             // ALL_CAPS
    silver,           // lowercase
    trade_goods       // underscore
}
```

## Part 2: Namespace Organization

### File-Scoped Namespaces

**MUST** use file-scoped namespace declarations (C# 10+). One namespace per file.

```csharp
// CORRECT: file-scoped namespace (C# 10+)
namespace OsePlatform.Zakat;

public sealed class ZakatCalculator { }

// WRONG: block-scoped namespace (adds unnecessary nesting)
namespace OsePlatform.Zakat
{
    public sealed class ZakatCalculator { }
}
```

### Namespace Matches Folder Structure

**MUST** match namespace to folder path relative to the project root.

```
OsePlatform.Zakat/
├── Domain/
│   ├── ZakatTransaction.cs     → namespace OsePlatform.Zakat.Domain
│   └── ZakatCalculator.cs      → namespace OsePlatform.Zakat.Domain
├── Infrastructure/
│   └── ZakatRepository.cs      → namespace OsePlatform.Zakat.Infrastructure
└── Application/
    └── ZakatService.cs         → namespace OsePlatform.Zakat.Application
```

### Global Usings

**MUST** define project-wide `global using` directives in a dedicated `GlobalUsings.cs` file at project root.

```csharp
// GlobalUsings.cs
global using System;
global using System.Collections.Generic;
global using System.Threading;
global using System.Threading.Tasks;
global using FluentAssertions;   // test projects only
global using Xunit;              // test projects only
```

## Part 3: C# 12 Idioms

### Primary Constructors

**SHOULD** use primary constructors for classes and structs with simple dependency injection.

```csharp
// CORRECT: Primary constructor (C# 12)
public sealed class ZakatService(
    IZakatRepository repository,
    ILogger<ZakatService> logger)
{
    public async Task<ZakatTransaction> ProcessAsync(
        Guid payerId,
        decimal wealth,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Processing zakat for payer {PayerId}", payerId);
        // repository and logger are captured automatically
    }
}

// Still valid for complex initialization needing additional setup
public sealed class ComplexService
{
    private readonly IRepository _repository;
    private readonly string _connectionString;

    public ComplexService(IRepository repository, IConfiguration config)
    {
        _repository = repository;
        _connectionString = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string not configured.");
    }
}
```

### Target-Typed `new`

**SHOULD** use target-typed `new` when the type is clear from context.

```csharp
// CORRECT: target-typed new when type is clear
ZakatTransaction transaction = new()
{
    TransactionId = Guid.NewGuid(),
    PayerId = payerId,
    Wealth = wealth,
    ZakatAmount = zakatAmount,
    PaidAt = DateTimeOffset.UtcNow
};

// CORRECT: in method returns
return new()
{
    TransactionId = Guid.NewGuid(),
    PayerId = payerId
};

// WRONG: target-typed new when type is ambiguous
var ambiguous = new() { }; // cannot infer type without explicit declaration
```

### Collection Expressions (C# 12)

**SHOULD** use collection expressions for collection initialization.

```csharp
// CORRECT: collection expressions (C# 12)
string[] assetTypes = ["Gold", "Silver", "Cash"];
List<decimal> zakatRates = [0.025m, 0.025m, 0.025m];

// Spread operator
string[] allAssets = [..goldAssets, ..cashAssets];

// WRONG: old-style initialization when collection expressions apply
string[] assetTypes = new string[] { "Gold", "Silver", "Cash" };
```

### Pattern Matching

**SHOULD** use switch expressions and pattern matching for conditional logic.

```csharp
// CORRECT: switch expression for Zakat asset classification
public static decimal GetZakatRate(ZakatAssetType assetType) =>
    assetType switch
    {
        ZakatAssetType.Gold or ZakatAssetType.Silver => 0.025m,
        ZakatAssetType.Cash => 0.025m,
        ZakatAssetType.TradeGoods => 0.025m,
        ZakatAssetType.LivestockCattle => 0.01m,
        _ => throw new ArgumentOutOfRangeException(nameof(assetType), assetType, null)
    };

// CORRECT: is pattern with type check
if (exception is InvalidOperationException { Message: var msg } && msg.Contains("Zakat"))
{
    logger.LogWarning("Zakat validation failed: {Message}", msg);
}
```

### Using Declarations

**MUST** use `using` declarations (C# 8+) instead of `using` blocks for resource cleanup.

```csharp
// CORRECT: using declaration (disposes at end of scope)
using var connection = new SqlConnection(connectionString);
await connection.OpenAsync(cancellationToken);
// connection disposed when method exits

// WRONG: nested using block (unnecessary indentation)
using (var connection = new SqlConnection(connectionString))
{
    await connection.OpenAsync(cancellationToken);
}
```

### LINQ Idioms

**MUST** use LINQ for collection transformations. **MUST NOT** use LINQ for side effects.

```csharp
// CORRECT: LINQ for transformation
var zakatAmounts = zakatableAssets
    .Where(asset => asset.Value >= nisabThreshold)
    .Select(asset => new ZakatCalculation
    {
        AssetId = asset.Id,
        Amount = ZakatCalculator.Calculate(asset.Value, nisabThreshold)
    })
    .ToList();

// CORRECT: First/FirstOrDefault with null check
var contract = contracts.FirstOrDefault(c => c.CustomerId == customerId);
if (contract is null) return null;

// WRONG: LINQ for side effects
zakatableAssets.ToList().ForEach(a => repository.Update(a)); // WRONG: side effect in LINQ
```

## Part 4: Anti-Patterns to Avoid

### Blocking Async Code

**PROHIBITED**: Blocking async code with `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()` in application code.

```csharp
// WRONG: blocking async call (potential deadlock in ASP.NET Core)
public ZakatTransaction GetTransaction(Guid id)
{
    return _repository.GetByIdAsync(id).Result; // WRONG
}

// WRONG: equivalent blocking patterns
_repository.GetByIdAsync(id).Wait();
_repository.GetByIdAsync(id).GetAwaiter().GetResult();

// CORRECT: propagate async throughout call chain
public async Task<ZakatTransaction?> GetTransactionAsync(
    Guid id,
    CancellationToken cancellationToken = default)
{
    return await _repository.GetByIdAsync(id, cancellationToken);
}
```

### Mutable Value Objects

**PROHIBITED**: Value objects with public setters that allow external mutation.

```csharp
// WRONG: mutable "value object"
public class Money
{
    public decimal Amount { get; set; } // mutable!
    public string Currency { get; set; } = "MYR";
}

// CORRECT: immutable record value object
public sealed record Money(decimal Amount, string Currency = "MYR")
{
    public Money Add(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException($"Cannot add {Currency} and {other.Currency}.");
        return this with { Amount = Amount + other.Amount };
    }
}
```

### Using `float` or `double` for Money

**PROHIBITED**: Using `float` or `double` for monetary calculations.

```csharp
// WRONG: floating-point precision loss
public float CalculateZakat(float wealth) => wealth * 0.025f;

// CORRECT: decimal arithmetic for money
public decimal CalculateZakat(decimal wealth, decimal nisab)
{
    if (wealth < nisab) return 0m;
    return wealth * 0.025m;
}
```

### Ignoring Nullability Warnings

**PROHIBITED**: Using the null-forgiving operator `!` to suppress legitimate nullability warnings.

```csharp
// WRONG: suppressing legitimate null warning
var contract = contracts.FirstOrDefault(); // might be null
ProcessContract(contract!); // !! silences compiler but hides bug

// CORRECT: handle null explicitly
var contract = contracts.FirstOrDefault();
if (contract is null) return;
ProcessContract(contract);
```

### Overusing `var`

**SHOULD** use explicit types when the type is not obvious from the right-hand side.

```csharp
// CORRECT: var when type is obvious
var calculator = new ZakatCalculator();
var transactions = new List<ZakatTransaction>();

// WRONG: var when type is unclear
var result = repository.GetAll(); // what is result? IQueryable? List? IEnumerable?

// CORRECT: explicit when type is not obvious from context
IReadOnlyList<ZakatTransaction> transactions = await repository.GetAllAsync(cancellationToken);
```

## Enforcement

These standards are enforced through:

- **dotnet format** - Auto-formats code (runs pre-commit)
- **Roslyn analyzers** - Detects style and quality violations at compile time
- **TreatWarningsAsErrors** - Analyzer violations fail CI builds
- **Code reviews** - Human verification of standards compliance

**Pre-commit checklist**:

- [ ] Code formatted with `dotnet format`
- [ ] All Roslyn analyzer warnings resolved
- [ ] No nullable reference type warnings suppressed with `!`
- [ ] All async methods propagate `CancellationToken`
- [ ] No `.Result` or `.Wait()` in application code
- [ ] `decimal` used for all monetary calculations
- [ ] File-scoped namespaces match folder structure

## Related Standards

- [Testing Standards](testing-standards.md) - xUnit, FluentAssertions, Moq patterns
- [Code Quality Standards](code-quality-standards.md) - Roslyn, dotnet format, editorconfig
- [Type Safety Standards](type-safety-standards.md) - Nullable reference types, generics, pattern matching
- [DDD Standards](ddd-standards.md) - Value Objects with records, Aggregate roots

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**.NET Version**: .NET 8 LTS (C# 12)
