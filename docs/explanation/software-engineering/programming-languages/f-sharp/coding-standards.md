---
title: "F# Coding Standards"
description: Authoritative OSE Platform F# coding standards — naming, module organization, pipeline idioms, discriminated unions
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - coding-standards
  - idioms
  - discriminated-unions
  - pipeline
  - naming-conventions
  - module-organization
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial. We define HOW to apply F# in THIS codebase, not WHAT F# is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for F# development in OSE Platform. These are prescriptive rules that MUST be followed across all F# projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform F# developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform naming conventions, module organization, pipeline idioms, discriminated union modeling, and anti-patterns to avoid

## Software Engineering Principles

### 1. Automation Over Manual

**How F# Implements**:

- Fantomas formats all F# code automatically — no manual formatting decisions
- `dotnet test` with Coverlet collects coverage automatically
- FSharpLint flags naming violations in CI
- Nx targets automate build, test, and lint per project

**PASS Example** (Automated Zakat validation pipeline):

```fsharp
// CORRECT: Automated validation via pure functions — testable without mocks
let validateZakatInput (wealth: decimal) (nisabThreshold: decimal) : Result<decimal, string> =
    if wealth < 0m then Error "Wealth cannot be negative"
    elif nisabThreshold <= 0m then Error "Nisab threshold must be positive"
    else Ok wealth

let calculateZakat (wealth: decimal) : decimal =
    wealth * 0.025m

// Pipeline composes validation and calculation automatically
let processZakat wealth nisab =
    validateZakatInput wealth nisab
    |> Result.map calculateZakat
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**How F# Implements**:

- Explicit type annotations on all public module functions
- `Result<'T, 'TError>` makes error paths explicit (no hidden exceptions)
- Module qualification (`ZakatDomain.calculate`) over wildcard opens
- Explicit `.fsproj` file ordering — compiler processes files top-to-bottom

**PASS Example** (Explicit Murabaha contract type):

```fsharp
// CORRECT: Explicit type annotations on public API
type MurabahaContract = {
    ContractId: string
    CustomerId: string
    CostPrice: decimal
    ProfitMargin: decimal
    TotalPrice: decimal
    InstallmentCount: int
}

// Explicit return type — callers know what to expect
let createMurabahaContract
    (customerId: string)
    (costPrice: decimal)
    (profitMargin: decimal)
    (installmentCount: int)
    : Result<MurabahaContract, string> =
    if costPrice <= 0m then Error "Cost price must be positive"
    else
        Ok {
            ContractId = System.Guid.NewGuid().ToString()
            CustomerId = customerId
            CostPrice = costPrice
            ProfitMargin = profitMargin
            TotalPrice = costPrice + profitMargin
            InstallmentCount = installmentCount
        }
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**How F# Implements**:

- All `let` bindings are immutable by default — the compiler enforces this
- Record types are immutable — updates produce new records
- Discriminated unions represent immutable domain states
- `mutable` keyword requires explicit opt-in and documented justification

**PASS Example** (Immutable Zakat transaction record):

```fsharp
// CORRECT: Record is immutable by default
type ZakatTransaction = {
    TransactionId: string
    PayerId: string
    Wealth: decimal
    ZakatAmount: decimal
    PaidAt: System.DateTimeOffset
}

// Record update syntax creates a NEW record — original unchanged
let correctZakatAmount (original: ZakatTransaction) (correctedAmount: decimal) : ZakatTransaction =
    { original with ZakatAmount = correctedAmount }

// WRONG: Never use mutable for domain state
// let mutable currentWealth = 100000m  // PROHIBITED for domain state
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**How F# Implements**:

- Domain logic functions take inputs and return outputs — no side effects
- `Async<'T>` and `Task<'T>` types make side-effectful operations explicit
- `Result<'T, 'TError>` keeps error handling in the pure layer
- I/O (database, HTTP) lives at the application shell, not in domain modules

**PASS Example** (Pure Zakat calculation):

```fsharp
// CORRECT: Pure function — same inputs always produce same output
let calculateZakat (wealth: decimal) (nisabThreshold: decimal) : decimal =
    if wealth < nisabThreshold then 0m
    else wealth * 0.025m

// Pure function is trivially testable
let zakatTests =
    testList "ZakatCalculation" [
        testCase "wealth above nisab returns 2.5 percent" <| fun () ->
            let result = calculateZakat 100000m 5000m
            Expect.equal result 2500m "Should return 2.5% of wealth"

        testCase "wealth below nisab returns zero" <| fun () ->
            let result = calculateZakat 3000m 5000m
            Expect.equal result 0m "Should return zero below nisab"
    ]
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**How F# Implements**:

- `global.json` pins the exact .NET SDK version across all machines
- `.fsproj` with explicit NuGet version constraints
- `packages.lock.json` with `RestoreLockedMode=true` for hermetic builds
- `Directory.Build.props` for shared settings preventing configuration drift

**PASS Example** (Reproducible build configuration):

```json
// global.json — pins SDK version
{
  "sdk": {
    "version": "8.0.400",
    "rollForward": "latestPatch"
  }
}
```

```xml
<!-- Directory.Build.props — shared across all F# projects -->
<Project>
  <PropertyGroup>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <RestoreLockedMode>true</RestoreLockedMode>
    <Nullable>enable</Nullable>
    <LangVersion>preview</LangVersion>
  </PropertyGroup>
</Project>
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Naming Conventions

### Functions and Values

**MUST** use `camelCase` for functions, values, and parameters:

```fsharp
// CORRECT: camelCase for functions and values
let calculateZakat wealth nisab = wealth * 0.025m
let zakatRate = 0.025m
let nisabThreshold = 5000m

// WRONG: PascalCase for functions
// let CalculateZakat wealth nisab = ...  // Reserved for types/modules
```

### Types, Modules, and Discriminated Unions

**MUST** use `PascalCase` for types, modules, discriminated union names, and union cases:

```fsharp
// CORRECT: PascalCase for types, modules, DU cases
type ZakatResult =
    | ZakatDue of amount: decimal
    | BelowNisab
    | InvalidWealth of reason: string

module ZakatCalculation =
    let calculate wealth nisab =
        if wealth < 0m then InvalidWealth "Negative wealth"
        elif wealth < nisab then BelowNisab
        else ZakatDue(wealth * 0.025m)
```

### Constants

**MUST** use `camelCase` for module-level constants in F#. Do not use `ALL_CAPS` — it is not idiomatic F#:

```fsharp
// CORRECT: camelCase for constants (idiomatic F#)
let zakatRate = 0.025m
let defaultNisab = 5000m
let maxInstallments = 60

// WRONG: ALL_CAPS (not idiomatic in F#)
// let ZAKAT_RATE = 0.025m
// let DEFAULT_NISAB = 5000m
```

### Record Fields

**MUST** use `PascalCase` for record field names:

```fsharp
// CORRECT: PascalCase fields
type MusharakahPartnership = {
    PartnershipId: string
    ProfitSharingRatio: decimal
    TotalCapital: decimal
    IsActive: bool
}
```

## Module Organization

### File Order in .fsproj

**CRITICAL**: F# compiles files in the order they appear in `.fsproj`. A module cannot reference types or functions defined in a later file.

**MUST** order files from most foundational (types, domain) to most dependent (application, infrastructure):

```xml
<!-- CORRECT: Foundational types before dependent logic -->
<ItemGroup>
    <Compile Include="Domain/Types.fs" />        <!-- Pure types first -->
    <Compile Include="Domain/Validation.fs" />   <!-- Uses types -->
    <Compile Include="Domain/Calculation.fs" />  <!-- Uses types + validation -->
    <Compile Include="Application/Handlers.fs" /> <!-- Uses all domain -->
    <Compile Include="Infrastructure/Db.fs" />    <!-- Uses application -->
    <Compile Include="Program.fs" />              <!-- Entry point last -->
</ItemGroup>

<!-- WRONG: Dependent file before its dependency -->
<!-- <Compile Include="Domain/Calculation.fs" />  -->
<!-- <Compile Include="Domain/Types.fs" />        -->
```

### Module Structure

**MUST** use explicit module declarations. Prefer `module` keyword over namespace for F# libraries:

```fsharp
// CORRECT: Explicit module with domain-focused naming
module ZakatDomain

open System

type NisabThreshold = NisabThreshold of decimal
type Wealth = Wealth of decimal

let calculateZakat (Wealth wealth) (NisabThreshold nisab) =
    if wealth < nisab then 0m
    else wealth * 0.025m
```

**SHOULD** use `[<AutoOpen>]` sparingly — only for operator modules or essential DSL functions that would create excessive noise if qualified:

```fsharp
// ACCEPTABLE: AutoOpen for operator-heavy DSL
[<AutoOpen>]
module ZakatOperators =
    let (>=>) = Result.bind
```

## Pipeline Operator Usage

**MUST** use `|>` (pipe forward) for readable sequential transformations:

```fsharp
// CORRECT: Pipeline makes data flow obvious
let processZakatClaim (claim: ZakatClaim) =
    claim
    |> validateClaim
    |> Result.bind calculateZakat
    |> Result.map applyRounding
    |> Result.map formatResult

// WRONG: Nested function calls obscure data flow
// let processZakatClaim claim =
//     formatResult (applyRounding (calculateZakat (validateClaim claim)))
```

**MUST** use `>>` (function composition) when composing functions without data:

```fsharp
// CORRECT: Function composition for reusable pipelines
let processZakat =
    validateClaim
    >> Result.bind calculateZakat
    >> Result.map applyRounding
```

## Discriminated Union Modeling

**MUST** use discriminated unions to model domain states — make invalid states unrepresentable:

```fsharp
// CORRECT: All valid Zakat outcomes modeled as DU cases
type ZakatOutcome =
    | ZakatDue of amount: decimal * dueDate: System.DateOnly
    | BelowNisab of currentWealth: decimal * threshold: decimal
    | ExemptCategory of reason: string

// CORRECT: Pattern match is exhaustive — compiler enforces handling all cases
let describeOutcome (outcome: ZakatOutcome) =
    match outcome with
    | ZakatDue(amount, dueDate) -> $"Zakat of {amount} due by {dueDate}"
    | BelowNisab(wealth, nisab) -> $"Wealth {wealth} is below nisab {nisab}"
    | ExemptCategory reason -> $"Exempt: {reason}"
```

**MUST** use named fields in DU cases when a case carries multiple pieces of data:

```fsharp
// CORRECT: Named fields for clarity
type TransactionError =
    | InsufficientFunds of available: decimal * required: decimal
    | InvalidRecipient of recipientId: string
    | ComplianceViolation of rule: string * details: string

// WRONG: Unnamed positional fields are hard to understand
// type TransactionError =
//     | InsufficientFunds of decimal * decimal  // Which is which?
```

## Active Patterns

**SHOULD** use active patterns to extend pattern matching with named, reusable predicates:

```fsharp
// CORRECT: Active pattern gives semantic names to conditions
let (|AboveNisab|BelowNisab|) (wealth: decimal) (nisab: decimal) =
    if wealth >= nisab then AboveNisab else BelowNisab

let classifyWealth wealth nisab =
    match wealth with
    | AboveNisab nisab -> "Zakat is obligatory"
    | BelowNisab -> "Below nisab threshold"
```

## Partial Application

**SHOULD** use partial application to create specialized functions from general ones:

```fsharp
// CORRECT: Partial application for domain-specific specializations
let calculateZakat (rate: decimal) (wealth: decimal) = wealth * rate

let calculateObligatoryZakat = calculateZakat 0.025m   // Standard 2.5%
let calculateFitrZakat = calculateZakat 0.028m         // Simplified Zakat al-Fitr approximation
```

## Enforcement

These standards are enforced through:

- **Fantomas** - Auto-formats all F# code (MANDATORY; fails CI if code is not formatted)
- **FSharpLint** - Flags naming convention violations
- **F# compiler** - Exhaustive pattern match warnings (treated as errors)
- **Code reviews** - Human verification of module organization and pipeline usage

**Pre-commit checklist**:

- [ ] Code formatted with Fantomas (`dotnet fantomas .`)
- [ ] No incomplete pattern matches (compiler warning = error)
- [ ] No use of `mutable` in domain modules without documented justification
- [ ] .fsproj file order is dependency-correct (foundational types first)
- [ ] Named fields on multi-data DU cases
- [ ] Pipeline operator used for sequential data transformations

## Related Standards

- [Testing Standards](testing-standards.md) - Expecto test organization mirroring module structure
- [Code Quality Standards](code-quality-standards.md) - Fantomas and FSharpLint configuration
- [DDD Standards](ddd-standards.md) - Domain modeling with discriminated unions
- [Type Safety Standards](type-safety-standards.md) - Single-case DUs and units of measure

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS (covers F# 6 - F# 9)
