---
title: "F# Type Safety Standards"
description: Authoritative OSE Platform F# type safety standards — making illegal states unrepresentable, units of measure, single-case DUs, generics
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - type-safety
  - discriminated-unions
  - units-of-measure
  - generics
  - type-providers
  - phantom-types
  - single-case-du
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Type Safety Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative type safety standards** for F# development in OSE Platform. F# offers some of the strongest type-level safety in the .NET ecosystem. The guiding principle: **make illegal states unrepresentable** — encode domain invariants in the type system so the compiler prevents mistakes before tests even run.

**Target Audience**: OSE Platform F# developers working on domain modeling, financial calculation, and data integration

**Scope**: Making illegal states unrepresentable, units of measure for dimensional analysis, single-case DUs for strong IDs, phantom types, type providers, avoiding boxing

## Software Engineering Principles

### 1. Explicit Over Implicit

**How F# Type Safety Implements**:

- Type annotations on public APIs make contracts explicit
- Single-case DUs make the distinction between `PayerId` and `ZakatId` explicit at compile time
- Units of measure make the dimension of numerical values explicit (MYR vs USD vs kg)

**PASS Example** (Units of measure make currency explicit):

```fsharp
// CORRECT: Units of measure prevent currency confusion at compile time
[<Measure>] type MYR
[<Measure>] type USD
[<Measure>] type SAR

let zakatRate = 0.025m<MYR/MYR>  // Dimensionless rate
let wealth = 100_000m<MYR>
let zakatDue = wealth * 0.025m  // = 2500m<MYR>

// Compiler ERROR: Cannot add MYR and USD without conversion
// let total = zakatDue + 1000m<USD>  // Type error!
```

### 2. Immutability Over Mutability

**PASS Example** (Type-safe immutable domain values):

```fsharp
// CORRECT: Private constructor ensures the validated value cannot be constructed
// with invalid data — immutability is enforced by the type system
type ZakatId = private ZakatId of string

module ZakatId =
    let create raw =
        if System.Guid.TryParse(raw, ref System.Guid.Empty) then Ok (ZakatId raw)
        else Error "ZakatId must be a valid GUID"
```

### 3. Pure Functions Over Side Effects

**PASS Example** (Purely typed computation — no runtime type checking):

```fsharp
// CORRECT: Type system enforces correctness — no runtime type checks needed
let calculateZakatInMyr (wealth: decimal<MYR>) (nisab: decimal<MYR>) : decimal<MYR> =
    if wealth < nisab then 0m<MYR>
    else wealth * 0.025m
```

### 4. Automation Over Manual

**PASS Example** (Type providers generate types from data sources automatically):

```fsharp
// CORRECT: Type provider auto-generates types from Sharia finance JSON schema
open FSharp.Data

type NisabData = JsonProvider<"https://api.sharia-finance.example.com/nisab/schema.json">

// Fully typed access — no manual DTO definition needed
let fetchNisab () =
    async {
        let! data = NisabData.AsyncLoad("https://api.sharia-finance.example.com/nisab/current")
        return data.GoldNisabMyr  // Compiler-verified field access
    }
```

### 5. Reproducibility First

**PASS Example** (Type-safe configuration prevents environment-specific runtime errors):

```fsharp
// CORRECT: Typed configuration record — missing fields are compile errors
type ZakatServiceConfig = {
    NisabApiUrl: string
    DatabaseConnectionString: string
    JwtSecret: string
    ZakatRate: decimal
}

let loadConfig (rawConfig: IConfiguration) : Result<ZakatServiceConfig, string> =
    result {
        let! url = Option.ofObj rawConfig.["NisabApi:Url"] |> Result.ofOption "NisabApi:Url missing"
        let! conn = Option.ofObj rawConfig.["Database:ConnectionString"] |> Result.ofOption "DB connection missing"
        let! secret = Option.ofObj rawConfig.["Jwt:Secret"] |> Result.ofOption "JWT secret missing"
        return { NisabApiUrl = url; DatabaseConnectionString = conn; JwtSecret = secret; ZakatRate = 0.025m }
    }
```

## Making Illegal States Unrepresentable

This is the fundamental F# type safety principle. Encode domain constraints in the type system:

### Example: Zakat Processing Lifecycle

```fsharp
// WRONG: Status as string — any value can be in any state combination
type ZakatRecord = {
    Id: string
    Status: string           // "pending", "approved", etc.
    ApprovedBy: string       // Should only exist when approved!
    PaymentReceipt: string   // Should only exist when paid!
}

// CORRECT: DU makes each state's data requirements explicit
type ZakatRecord =
    | Pending of id: ZakatId * payerId: PayerId * wealth: Money
    | Approved of
        id: ZakatId *
        payerId: PayerId *
        zakatDue: Money *
        approvedBy: string *
        approvedAt: System.DateTimeOffset
    | Paid of
        id: ZakatId *
        payerId: PayerId *
        zakatDue: Money *
        receiptNumber: string *
        paidAt: System.DateTimeOffset

// There is NO way to have an approval timestamp on a Pending record
// There is NO way to have a receipt number on an Approved record
```

## Units of Measure

**SHOULD** use units of measure for financial domain calculations to prevent unit confusion:

```fsharp
// Define units
[<Measure>] type MYR   // Malaysian Ringgit
[<Measure>] type USD   // US Dollar
[<Measure>] type SAR   // Saudi Riyal
[<Measure>] type gram  // For gold-based Nisab
[<Measure>] type troy_oz

// CORRECT: Calculations are dimensionally verified
let goldPricePerGram = 250m<MYR/gram>
let nisabInGrams = 85m<gram>  // 85 grams of gold (one Nisab threshold)
let nisabThresholdMyr = goldPricePerGram * nisabInGrams  // = 21250m<MYR>

// Compiler error prevents mixing incompatible units
// let invalid = nisabThresholdMyr + 1000m<USD>  // TYPE ERROR
```

### Unit Conversion

**MUST** use explicit conversion functions to change units — never use raw multiplication:

```fsharp
// CORRECT: Explicit currency conversion with typed exchange rate
let convertMyrToUsd (exchangeRate: decimal<USD/MYR>) (amount: decimal<MYR>) : decimal<USD> =
    amount * exchangeRate

// Usage — type system tracks the unit transformation
let exchangeRate = 0.22m<USD/MYR>
let wealthMyr = 100_000m<MYR>
let wealthUsd = convertMyrToUsd exchangeRate wealthMyr  // = 22000m<USD>
```

## Single-Case Discriminated Unions

**MUST** use single-case DUs for all domain primitive types to prevent mixing incompatible values:

```fsharp
// CORRECT: Distinct types for each domain concept
type PayerId = PayerId of string
type ZakatId = ZakatId of string
type ContractId = ContractId of string
type EmailAddress = EmailAddress of string

// Pattern matching to extract values
let payerIdValue (PayerId id) = id
let zakatIdValue (ZakatId id) = id

// The compiler prevents passing a ZakatId where PayerId is expected
let findPayer (id: PayerId) = ...
let findZakatRecord (id: ZakatId) = ...
```

## Phantom Types

**SHOULD** use phantom types to track validation state in the type system:

```fsharp
// CORRECT: Phantom types track whether data has been validated
type Validated = Validated
type Unvalidated = Unvalidated

type ZakatInput<'State> = private { Wealth: decimal; Nisab: decimal }

module ZakatInput =
    // Returns Unvalidated — compiler knows this is raw input
    let create wealth nisab : ZakatInput<Unvalidated> =
        { Wealth = wealth; Nisab = nisab }

    // Returns Validated — compiler knows invariants hold
    let validate (input: ZakatInput<Unvalidated>) : Result<ZakatInput<Validated>, string> =
        if input.Wealth < 0m then Error "Negative wealth"
        elif input.Nisab <= 0m then Error "Invalid nisab"
        else Ok { Wealth = input.Wealth; Nisab = input.Nisab }

// Only accepts Validated input — unvalidated input is a compile error
let calculateZakat (input: ZakatInput<Validated>) : decimal =
    if input.Wealth < input.Nisab then 0m
    else input.Wealth * 0.025m
```

## Type Providers

**SHOULD** use type providers for safe external data integration:

```fsharp
open FSharp.Data

// CORRECT: JsonProvider generates types from schema — no manual DTO
type NisabApiResponse = JsonProvider<"""
{
  "goldNisabMyr": 21250.0,
  "silverNisabMyr": 1500.0,
  "effectiveDate": "2026-03-09"
}
""">

// Fully typed — field access verified at compile time
let parseNisab (json: string) =
    let data = NisabApiResponse.Parse(json)
    {
        GoldThreshold = data.GoldNisabMyr
        SilverThreshold = data.SilverNisabMyr
    }
```

### SQL Type Provider

**SHOULD** use `FSharp.Data.SqlClient` for type-safe database access in data pipeline projects:

```fsharp
open FSharp.Data

type ZakatQuery = SqlCommandProvider<"SELECT PayerId, Wealth, ZakatDue FROM zakat_records WHERE status = @status", connectionString>

// Type-safe — columns and parameter types are verified at design time
let getPendingRecords (conn: string) =
    use cmd = new ZakatQuery(conn)
    cmd.Execute(status = "pending") |> Seq.toList
```

## Avoiding Boxing and obj

**MUST NOT** use `obj` or untyped `System.Object` in domain code — it defeats the type system:

```fsharp
// WRONG: obj loses type safety
// let processValue (v: obj) = ...  // What type is v? Unknown.

// CORRECT: Use generic type parameters
let processValue<'T when 'T : equality> (v: 'T) = ...

// CORRECT: Use discriminated unions for heterogeneous collections
type DomainValue =
    | WealthAmount of decimal
    | PayerId of string
    | ZakatRate of decimal
```

## Enforcement

- **Compiler** — Type mismatch errors are compile-time failures — no suppressions allowed
- **Code reviews** — `obj` usage in domain code is immediately flagged
- **FsCheck** — Property tests verify type-safe functions with all valid inputs
- **Type providers** — Compiler validates schema compliance at design time

**Pre-commit checklist**:

- [ ] Financial calculations use units of measure for currency-sensitive values
- [ ] Domain IDs use single-case DUs (not raw strings)
- [ ] Domain states use discriminated unions (not status codes or strings)
- [ ] No `obj` in domain modules
- [ ] Exhaustive pattern matching on all DU cases
- [ ] Type providers used for external data integration where applicable

## Related Standards

- [Coding Standards](coding-standards.md) - Discriminated union and record basics
- [DDD Standards](ddd-standards.md) - Making illegal states unrepresentable in domain modeling
- [Security Standards](security-standards.md) - Single-case DUs for type-driven security

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
