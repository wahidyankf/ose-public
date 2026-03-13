---
title: "F# Error Handling Standards"
description: Authoritative OSE Platform F# error handling standards — railway-oriented programming, Result type, Option, FsToolkit
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - error-handling
  - result-type
  - railway-oriented
  - option
  - fstoolkit
  - computation-expressions
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
updated: 2026-03-09
---

# F# Error Handling Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative error handling standards** for F# development in OSE Platform. F# uses railway-oriented programming (ROP) with `Result<'T, 'TError>` for domain errors and `Option<'T>` for nullable values. Bare exceptions are reserved for infrastructure failures, not domain logic.

**Target Audience**: OSE Platform F# developers, technical reviewers

**Scope**: Result type patterns, Option handling, computation expressions for error chaining, custom error DUs, exception interop

## Software Engineering Principles

### 1. Explicit Over Implicit

**How F# Implements**:

- `Result<'T, 'TError>` makes the error path explicit in the type signature
- `Option<'T>` makes the absence of a value explicit — no null reference exceptions
- Callers MUST handle both `Ok` and `Error` cases — the compiler enforces this

**PASS Example** (Explicit error path in Zakat calculation):

```fsharp
// CORRECT: Return type explicitly signals possible failure
let validateWealth (wealth: decimal) : Result<decimal, string> =
    if wealth < 0m then Error "Wealth cannot be negative"
    elif wealth > 1_000_000_000m then Error "Wealth exceeds maximum validation threshold"
    else Ok wealth

// Callers MUST handle both paths — no implicit exception propagation
let processWealth wealth =
    match validateWealth wealth with
    | Ok valid -> $"Valid wealth: {valid}"
    | Error msg -> $"Validation failed: {msg}"
```

### 2. Pure Functions Over Side Effects

**PASS Example** (Pure error handling — no thrown exceptions in domain logic):

```fsharp
// CORRECT: Domain errors as values — pure function, no side effects
type ZakatError =
    | WealthBelowZero of decimal
    | NisabNotConfigured
    | CalculationOverflow

let calculateZakat (wealth: decimal) (nisab: decimal) : Result<decimal, ZakatError> =
    if wealth < 0m then Error (WealthBelowZero wealth)
    elif nisab <= 0m then Error NisabNotConfigured
    elif wealth < nisab then Ok 0m
    else
        let zakatAmount = wealth * 0.025m
        Ok zakatAmount
```

### 3. Immutability Over Mutability

**PASS Example** (Error DU cases are immutable value types):

```fsharp
// CORRECT: Immutable error discriminated union
type MurabahaError =
    | InvalidCostPrice of costPrice: decimal
    | ProfitMarginExceedsLimit of margin: decimal * limit: decimal
    | CustomerNotEligible of customerId: string * reason: string
```

### 4. Automation Over Manual

**PASS Example** (Automated validation pipeline using Result):

```fsharp
// CORRECT: Result.bind chains validation steps automatically
let processZakatClaim wealth nisab =
    validateWealth wealth
    |> Result.bind (fun w -> validateNisab nisab |> Result.map (fun n -> w, n))
    |> Result.bind (fun (w, n) -> calculateZakat w n)
    |> Result.map applyRounding
```

### 5. Reproducibility First

**PASS Example** (Deterministic error handling — same input always produces same Result):

```fsharp
// CORRECT: Pure Result-returning functions are deterministic and reproducible
let zakatResult1 = calculateZakat 100_000m 5_000m  // Always Ok 2500m
let zakatResult2 = calculateZakat 100_000m 5_000m  // Same result — reproducible
```

## Railway-Oriented Programming

### Two-Track Model

Railway-oriented programming models computation as a two-track railway:

- **Happy track (Ok)**: Successful computation flows forward
- **Error track (Error)**: Failed computation short-circuits to the error track

```fsharp
// CORRECT: Each step either continues on the happy track or diverts to error
let processZakatApplication (application: ZakatApplication) =
    application
    |> validateApplicant         // Ok Applicant | Error ValidationError
    |> Result.bind validateWealth  // Ok Wealth | Error ValidationError
    |> Result.bind calculateZakat  // Ok ZakatAmount | Error CalculationError
    |> Result.map createReceipt    // Ok Receipt (map never fails)
```

### Result Computation Expression

**SHOULD** use `result {}` computation expression (from FsToolkit.ErrorHandling) for multi-step Result chains:

```fsharp
open FsToolkit.ErrorHandling

// CORRECT: result CE is more readable than nested Result.bind calls
let processZakat (claim: ZakatClaim) : Async<Result<ZakatReceipt, ZakatError>> =
    asyncResult {
        let! applicant = validateApplicant claim.ApplicantId
        let! wealth = validateWealth claim.DeclaredWealth
        let! nisab = getNisabThreshold ()
        let! zakatAmount = calculateZakat wealth nisab
        let! receipt = createReceipt applicant zakatAmount
        return receipt
    }
```

**MUST** use `let!` inside `result {}` to unwrap `Ok` values and short-circuit on `Error`:

```fsharp
// CORRECT: let! unwraps Ok — Error short-circuits the CE
let createContract customerId costPrice profitMargin =
    result {
        let! validCustomerId = validateCustomerId customerId
        let! validCostPrice = validateCostPrice costPrice
        let! validMargin = validateProfitMargin profitMargin
        return buildContract validCustomerId validCostPrice validMargin
    }
```

## Custom Error Discriminated Unions

**MUST** define domain-specific error types as discriminated unions — never use `string` or `Exception` for domain errors:

```fsharp
// CORRECT: Typed error DU for the Zakat domain
type ZakatValidationError =
    | NegativeWealth of amount: decimal
    | WealthExceedsMaximum of amount: decimal * maximum: decimal
    | InvalidNisabThreshold of threshold: decimal
    | UnsupportedAssetClass of assetClass: string

// WRONG: Using string for domain errors loses type safety
// type ZakatResult = Result<decimal, string>  // Avoid for domain errors
```

**SHOULD** compose error types across domain boundaries using a top-level error DU:

```fsharp
// CORRECT: Top-level error DU composes domain-specific errors
type ApplicationError =
    | ZakatError of ZakatValidationError
    | MurabahaError of MurabahaValidationError
    | DatabaseError of exn
    | NetworkError of statusCode: int * message: string
```

## Option Type

**MUST** use `Option<'T>` for values that may legitimately be absent — never return `null` in F# domain code:

```fsharp
// CORRECT: Option signals possible absence
let findZakatRecord (recordId: string) : ZakatRecord option =
    records |> List.tryFind (fun r -> r.Id = recordId)

// CORRECT: Pattern match on Option
let describeRecord recordId =
    match findZakatRecord recordId with
    | Some record -> $"Found record for {record.PayerId}"
    | None -> "No record found"

// WRONG: Returning null in F#
// let findZakatRecord recordId : ZakatRecord = null  // PROHIBITED
```

**SHOULD** use `Option.defaultValue` for safe unwrapping with a fallback:

```fsharp
// CORRECT: Safe unwrap with default
let nisabOrDefault =
    getNisabFromConfig ()
    |> Option.defaultValue 5_000m  // Use platform default if not configured
```

## Exception Interop with C# Libraries

When calling C# libraries that throw exceptions, wrap them at the boundary:

```fsharp
// CORRECT: Convert exceptions to Result at the C# boundary
let safeReadFile (path: string) : Result<string, string> =
    try
        Ok (System.IO.File.ReadAllText(path))
    with
    | :? System.IO.FileNotFoundException -> Error $"File not found: {path}"
    | :? System.UnauthorizedAccessException -> Error $"Access denied: {path}"
    | ex -> Error $"Unexpected error reading file: {ex.Message}"
```

**MUST** use `reraise()` instead of `raise ex` when re-throwing to preserve the original stack trace:

```fsharp
// CORRECT: reraise preserves the original exception stack trace
let safeOperation () =
    try
        doRiskyOperation ()
    with
    | :? System.OperationCanceledException -> reraise ()  // Let cancellation propagate
    | ex -> Error $"Operation failed: {ex.Message}"
```

## When Exceptions ARE Appropriate

**MUST** use exceptions only for:

- **Infrastructure failures** (database unavailable, network timeout) — these are exceptional, not domain errors
- **Programming errors** (null reference from external library, index out of range) — should fail fast
- **Cancellation** (`OperationCanceledException` should propagate)

**PROHIBITED**: Using exceptions for domain logic:

```fsharp
// WRONG: Exception for domain error
let calculateZakat wealth nisab =
    if wealth < 0m then
        raise (System.ArgumentException("Wealth cannot be negative"))  // PROHIBITED
    wealth * 0.025m

// CORRECT: Result for domain error
let calculateZakat wealth nisab : Result<decimal, ZakatError> =
    if wealth < 0m then Error (NegativeWealth wealth)
    else Ok (wealth * 0.025m)
```

## FsToolkit.ErrorHandling

**SHOULD** use `FsToolkit.ErrorHandling` for computation expressions and combinators:

```xml
<PackageReference Include="FsToolkit.ErrorHandling" Version="4.15.2" />
```

Key functions provided:

- `result { }` — computation expression for `Result`
- `asyncResult { }` — computation expression for `Async<Result<'T,'E>>`
- `Result.sequence` — convert `Result list` to `Result<list, error>`
- `Validation.ofResult` — accumulate multiple errors (applicative style)
- `Result.mapError` — transform the error type

## Enforcement

- **Compiler** — `TreatWarningsAsErrors=true`; incomplete match on Result DU cases causes build failure
- **Code reviews** — Verify no bare exceptions for domain errors; Result used throughout domain layer
- **FsCheck tests** — Property tests verify Result semantics (no hidden exceptions)

**Pre-commit checklist**:

- [ ] Domain functions return `Result<'T, 'TError>` or `Option<'T>` — no null returns
- [ ] Custom error DU defined for each domain module
- [ ] C# library calls wrapped with `try-with` converting exceptions to `Result`
- [ ] `reraise()` used (not `raise ex`) when re-throwing
- [ ] No exceptions for domain logic — only for infrastructure failures

## Related Standards

- [Coding Standards](ex-soen-prla-fsh__coding-standards.md) - Discriminated union modeling that error types use
- [Functional Programming Standards](ex-soen-prla-fsh__functional-programming-standards.md) - Monadic composition and Result CEs
- [API Standards](ex-soen-prla-fsh__api-standards.md) - Mapping domain Result errors to HTTP responses

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-03-09
**F# Version**: F# 8 / .NET 8 LTS
