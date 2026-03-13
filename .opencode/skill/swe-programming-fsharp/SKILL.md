---
name: swe-programming-fsharp
description: F# coding standards from authoritative docs/explanation/software-engineering/programming-languages/f-sharp/ documentation
---

# F# Coding Standards

## Purpose

Progressive disclosure of F# coding standards for agents writing F# code.

**Authoritative Source**: [docs/explanation/software-engineering/programming-languages/f-sharp/README.md](../../../docs/explanation/software-engineering/programming-languages/f-sharp/README.md)

**Usage**: Auto-loaded for agents when writing F# code. Provides quick reference to idioms, best practices, and antipatterns.

## Prerequisite Knowledge

**IMPORTANT**: This skill provides **OSE Platform-specific style guides**, not educational tutorials.

**You MUST understand F# fundamentals before using these standards.** Complete the AyoKoding F# learning path first:

1. **[F# Learning Path](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/)** - Initial setup, language overview, quick start guide (0-95% language coverage)
2. **[F# By Example](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/by-example/)** - 75+ annotated code examples (beginner to advanced patterns)

**What this skill covers**: OSE Platform naming conventions, framework choices, repository-specific patterns, how to apply F# knowledge in THIS codebase.

**What this skill does NOT cover**: F# syntax, language fundamentals, generic patterns (those are in ayokoding-web).

**See**: [Programming Language Documentation Separation](../../../governance/conventions/structure/programming-language-docs-separation.md) for content separation rules.

## Quick Standards Reference

### Naming Conventions

**Modules/Types/DUs**: PascalCase - `ZakatCalculator`, `MurabahaContract`, `PaymentResult`

**Functions/Values**: camelCase - `calculateZakat`, `totalAmount`, `validateContract`

**DU Cases**: PascalCase - `Due`, `BelowNisab`, `ValidationError`

**Predicate functions**: `isValid`, `hasPayments` (boolean-returning functions prefixed with `is`/`has`)

### Discriminated Unions for Domain Modeling

```fsharp
// CORRECT: DU for domain states (exhaustive)
type ZakatResult =
    | Due of amount: decimal
    | BelowNisab
    | ValidationError of message: string

// CORRECT: Exhaustive pattern matching (compiler enforced)
let handleResult result =
    match result with
    | Due amount -> sprintf "Zakat due: %M" amount
    | BelowNisab -> "Below nisab threshold"
    | ValidationError msg -> sprintf "Error: %s" msg
```

### Railway-Oriented Programming

```fsharp
// CORRECT: Result type for error handling
let calculateZakat (wealth: decimal) (nisab: decimal) : Result<decimal, string> =
    if wealth < 0m then
        Error "Wealth cannot be negative"
    elif wealth >= nisab then
        Ok (wealth * 0.025m)
    else
        Ok 0m

// CORRECT: Computation expression for chaining
let processPayment (wealth: decimal) (nisab: decimal) =
    result {
        let! zakatAmount = calculateZakat wealth nisab
        let! validated = validateAmount zakatAmount
        return! saveZakat validated
    }
```

### Pipeline Operator

```fsharp
// CORRECT: Use |> for readable pipelines
let totalZakat =
    wealthAmounts
    |> List.filter (fun w -> w >= nisabThreshold)
    |> List.map (fun w -> w * 0.025m)
    |> List.sum

// CORRECT: Function composition with >>
let calculateAndValidate = calculateZakat >> validateZakat
```

### Records (Immutable by Default)

```fsharp
// CORRECT: Record type for value objects
type ZakatCalculation = {
    Wealth: decimal
    Nisab: decimal
    Amount: decimal
    CalculationDate: DateOnly
}

// CORRECT: Record copy expression (non-destructive update)
let updated = { calculation with Amount = newAmount }
```

### Async Workflows

```fsharp
// CORRECT: F# async computation expression
let calculateAsync wealth nisab = async {
    let! nisabValue = repository.GetNisabAsync()
    let result = calculateZakat wealth nisabValue
    return result
}

// CORRECT: Running async
let result = calculateAsync 10000m 5000m |> Async.RunSynchronously

// CORRECT: Task interop
let taskAsync = calculateAsync 10000m 5000m |> Async.StartAsTask
```

### Fantomas Formatting (MANDATORY)

```fsharp
// CORRECT: Fantomas-formatted code
let calculate (wealth: decimal) (nisab: decimal) =
    if wealth >= nisab then
        wealth * 0.025m
    else
        0m

// Run: dotnet fantomas . (formats all F# files)
// Pre-commit: fantomas --check . (fails if not formatted)
```

### Testing with Expecto

```fsharp
open Expecto

let zakatTests =
    testList "ZakatCalculator" [
        test "calculates 2.5% when above nisab" {
            let result = calculateZakat 10000m 5000m
            Expect.equal result (Ok 250m) "Should return 2.5% of wealth"
        }
        test "returns 0 when below nisab" {
            let result = calculateZakat 1000m 5000m
            Expect.equal result (Ok 0m) "Should return 0 below nisab"
        }
    ]

[<EntryPoint>]
let main args = runTestsWithCLIArgs [] args zakatTests
```

### Property-Based Testing with FsCheck

```fsharp
open FsCheck

let zakatProperties =
    testList "ZakatCalculator properties" [
        testProperty "zakat is always non-negative" <| fun (wealth: decimal) ->
            let nisab = 5000m
            match calculateZakat (abs wealth) nisab with
            | Ok amount -> amount >= 0m
            | Error _ -> true

        testProperty "zakat is exactly 2.5% when above nisab" <| fun (wealth: decimal) ->
            wealth > 5000m ==>
            (calculateZakat wealth 5000m = Ok (wealth * 0.025m))
    ]
```

## Comprehensive Documentation

**Authoritative Index**: [docs/explanation/software-engineering/programming-languages/f-sharp/README.md](../../../docs/explanation/software-engineering/programming-languages/f-sharp/README.md)

### Mandatory Standards (All F# Code MUST Follow)

1. **[Coding Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__coding-standards.md)** - F# naming conventions, module organization, pipeline idioms
2. **[Testing Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__testing-standards.md)** - Expecto, FsCheck property-based testing, AltCover coverage
3. **[Code Quality Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__code-quality-standards.md)** - Fantomas, FSharpLint, exhaustive pattern matching
4. **[Build Configuration](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__build-configuration.md)** - .fsproj file order, dotnet CLI, Nx integration

### Context-Specific Standards (Apply When Relevant)

1. **[Error Handling Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__error-handling-standards.md)** - Result type, railway-oriented programming, computation expressions
2. **[Concurrency Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__concurrency-standards.md)** - Async workflows, MailboxProcessor, Task interop
3. **[Functional Programming Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__functional-programming-standards.md)** - Computation expressions, monads, applicatives
4. **[Type Safety Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__type-safety-standards.md)** - DUs, units of measure, phantom types
5. **[Performance Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__performance-standards.md)** - Tail recursion, sequences, lazy evaluation
6. **[Security Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__security-standards.md)** - Type-driven validation, Giraffe authentication
7. **[API Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__api-standards.md)** - Giraffe HttpHandler composition, Saturn routing
8. **[DDD Standards](../../../docs/explanation/software-engineering/programming-languages/f-sharp/ex-soen-prla-fsh__ddd-standards.md)** - DU-based domain modeling, making illegal states unrepresentable

## Related Skills

- docs-applying-content-quality
- repo-practicing-trunk-based-development

## References

- [F# README](../../../docs/explanation/software-engineering/programming-languages/f-sharp/README.md)
- [Functional Programming](../../../governance/development/pattern/functional-programming.md)
