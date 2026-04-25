---
title: "F# Functional Programming Standards"
description: Authoritative OSE Platform F# functional programming standards — computation expressions, monadic composition, applicative validation
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - functional-programming
  - computation-expressions
  - discriminated-unions
  - monads
  - applicative
  - higher-order-functions
  - currying
  - partial-application
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Functional Programming Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative functional programming standards** for F# development in OSE Platform. F# is a functional-first language — these patterns are idiomatic, not optional. OOP patterns (mutable classes, inheritance hierarchies) are explicitly avoided in domain code.

**Target Audience**: OSE Platform F# developers applying FP patterns in domain modeling and service logic

**Scope**: Computation expressions, monadic composition, applicative validation, higher-order functions, function composition, currying, avoiding OOP patterns

## Software Engineering Principles

### 1. Pure Functions Over Side Effects

**How F# FP Implements**:

- Domain logic lives in pure functions — the functional core
- I/O, async, and side effects are expressed through typed effects (`Async`, `Task`, `Result`)
- Computation expressions compose effectful operations without polluting the pure layer

**PASS Example** (Functional core / imperative shell):

```fsharp
// CORRECT: Pure functional core
module ZakatCalculation =
    let calculate (wealth: decimal) (nisab: decimal) : decimal =
        if wealth < nisab then 0m
        else wealth * 0.025m

    let applyRounding (amount: decimal) : decimal =
        System.Math.Round(amount, 2, System.MidpointRounding.AwayFromZero)

    let processZakat = calculate >> applyRounding  // Pure composition

// Imperative shell — I/O at the edge
module ZakatShell =
    let runZakatWorkflow payerId =
        async {
            let! wealth = WealthRepository.getWealth payerId    // I/O
            let! nisab = NisabService.getCurrent ()             // I/O
            let zakatDue = ZakatCalculation.processZakat wealth nisab  // Pure
            do! ZakatRepository.record payerId zakatDue         // I/O
            return zakatDue
        }
```

### 2. Immutability Over Mutability

**PASS Example** (FP pipeline — no mutation):

```fsharp
// CORRECT: Each step creates a new value — original unchanged
let zakatPipeline wealth nisab =
    wealth
    |> validateWealth
    |> Result.bind (calculateZakat nisab)
    |> Result.map applyRounding
    |> Result.map formatCurrency
```

### 3. Explicit Over Implicit

**PASS Example** (Explicit effect types in function signatures):

```fsharp
// CORRECT: Return type explicitly signals async + possible failure
let processZakatClaim (claim: ZakatClaim) : Async<Result<ZakatReceipt, ZakatError>> =
    asyncResult {
        let! validated = validateClaim claim
        let! amount = calculateZakatAmount validated
        let! receipt = persistReceipt amount
        return receipt
    }
```

### 4. Automation Over Manual

**PASS Example** (Applicative validation collects all errors automatically):

```fsharp
// CORRECT: All validation errors collected automatically — no manual aggregation
open FsToolkit.ErrorHandling

let validateZakatApplication payerId wealth nisab =
    Validation.zip3
        (validatePayerId payerId)
        (validateWealth wealth)
        (validateNisabThreshold nisab)
    |> Validation.map (fun (pid, w, n) -> { PayerId = pid; Wealth = w; Nisab = n })
```

### 5. Reproducibility First

**PASS Example** (Pure FP functions are naturally reproducible):

```fsharp
// CORRECT: Pure function — fully reproducible
let zakatResult1 = ZakatCalculation.processZakat 100_000m 5_000m
let zakatResult2 = ZakatCalculation.processZakat 100_000m 5_000m
// zakatResult1 = zakatResult2 always — deterministic
```

## Computation Expressions

### Result Computation Expression

**SHOULD** use `result { }` for multi-step Result chains:

```fsharp
open FsToolkit.ErrorHandling

// CORRECT: result CE — readable sequential validation
let createZakatRecord payerId wealth =
    result {
        let! validPayerId = PayerId.create payerId
        let! validWealth = Money.create wealth "MYR"
        let! nisab = getNisabThreshold ()
        let amount = ZakatCalculation.calculate (Money.value validWealth) (Money.value nisab)
        return { PayerId = validPayerId; Wealth = validWealth; ZakatDue = amount }
    }
```

### Async Computation Expression

**MUST** use `async { }` for F#-native async workflows:

```fsharp
// CORRECT: async CE for async I/O composition
let fetchZakatSummary payerId =
    async {
        let! wealth = WealthService.getWealth payerId
        let! payments = PaymentHistory.get payerId
        let! nisab = NisabService.getCurrent ()
        return buildSummary wealth payments nisab
    }
```

### AsyncResult Computation Expression

**SHOULD** use `asyncResult { }` (from FsToolkit.ErrorHandling) when async operations can fail:

```fsharp
open FsToolkit.ErrorHandling

// CORRECT: asyncResult CE combines async and Result elegantly
let processZakatApplication (request: ZakatApplicationRequest) : Async<Result<ZakatReceipt, ApplicationError>> =
    asyncResult {
        let! applicant = ApplicantService.find request.ApplicantId    // Async<Result<Applicant, _>>
        let! wealth = WealthService.getWealth applicant.Id            // Async<Result<Money, _>>
        let! nisab = NisabService.getCurrent ()                       // Async<Result<Money, _>>

        let zakatAmount =
            ZakatCalculation.calculate (Money.value wealth) (Money.value nisab)

        let! receipt = ReceiptService.create applicant.Id zakatAmount // Async<Result<ZakatReceipt, _>>
        return receipt
    }
```

## Monadic Composition

### bind for Sequential Composition

**MUST** use `Result.bind` (or `Option.bind`) for sequential operations where each step depends on the previous:

```fsharp
// CORRECT: bind chains operations where each may fail
let validateAndCalculate wealth nisab =
    validateWealth wealth
    |> Result.bind (validateNisab nisab >> Result.map (fun n -> wealth, n))
    |> Result.bind (fun (w, n) -> calculateZakat w n)
```

### map for Transformations That Cannot Fail

**MUST** use `Result.map` (or `Option.map`) for transformations that succeed:

```fsharp
// CORRECT: map for pure transformations on the success path
let formatZakatResult result =
    result
    |> Result.map applyRounding     // Cannot fail
    |> Result.map formatAsCurrency  // Cannot fail
```

## Applicative Validation (Error Accumulation)

**SHOULD** use applicative style with `Validation` from FsToolkit when collecting multiple independent errors:

```fsharp
open FsToolkit.ErrorHandling

// CORRECT: All fields validated independently — all errors collected
let validateZakatForm (form: ZakatFormDto) : Validation<ValidatedZakatForm, string list> =
    Validation.map3
        (fun payerId wealth nisab -> { PayerId = payerId; Wealth = wealth; Nisab = nisab })
        (PayerId.create form.PayerId |> Validation.ofResult)
        (Money.create form.Wealth "MYR" |> Validation.ofResult)
        (Money.create form.Nisab "MYR" |> Validation.ofResult)

// Result: Failure ["PayerId is invalid"; "Wealth cannot be negative"]
// (both errors reported, not just the first)
```

## Higher-Order Functions

**MUST** use standard higher-order functions on collections:

```fsharp
// CORRECT: Idiomatic F# collection operations
let zakatAmounts = payments |> List.map calculateZakatAmount
let eligiblePayers = payers |> List.filter isAboveNisab
let totalZakat = zakatAmounts |> List.fold (+) 0m
let processedClaims = claims |> List.choose processClaim  // Option-aware map + filter
```

**SHOULD** use `Seq` for lazy evaluation over large datasets:

```fsharp
// CORRECT: Lazy sequence — does not evaluate entire dataset in memory
let totalZakatDue (payerIds: string seq) =
    payerIds
    |> Seq.map fetchWealthSync       // Lazy
    |> Seq.filter (fun w -> w > 5_000m)
    |> Seq.map (fun w -> w * 0.025m)
    |> Seq.sum
```

## Function Composition Operators

**MUST** use `>>` for forward composition (left to right):

```fsharp
// CORRECT: >> reads as "then"
let processZakat = validate >> calculate >> applyRounding >> formatOutput
```

**SHOULD** use `<<` for reverse composition (right to left) when conventional mathematical notation aids clarity:

```fsharp
// ACCEPTABLE: << for right-to-left composition (rare)
let processZakat = formatOutput << applyRounding << calculate << validate
```

## Currying and Partial Application

**SHOULD** use partial application to create domain-specific specializations from general functions:

```fsharp
// CORRECT: General function curried — specialize by partial application
let calculateZakat (rate: decimal) (wealth: decimal) = wealth * rate

// Specialized by partial application
let calculateObligatoryZakat = calculateZakat 0.025m
let calculateFitrAmount = calculateZakat 0.028m  // Simplified approximation

// Usage
let zakatDue = calculateObligatoryZakat 100_000m  // 2500m
```

**SHOULD** order function parameters from most-stable to least-stable for useful partial application:

```fsharp
// CORRECT: Configuration (most stable) comes before data (less stable)
let calculateWithNisab (nisab: decimal) (wealth: decimal) =
    if wealth < nisab then 0m else wealth * 0.025m

// Partially apply the stable nisab configuration
let calculateWithDefaultNisab = calculateWithNisab 5_000m

// Apply to each payer's wealth
let results = wealthAmounts |> List.map calculateWithDefaultNisab
```

## Avoiding OOP Patterns

**MUST NOT** use inheritance for domain modeling in F#:

```fsharp
// WRONG: Inheritance hierarchy (OOP anti-pattern in F#)
// type BaseContract() = abstract member Process: unit -> unit
// type MurabahaContract() = inherit BaseContract()

// CORRECT: Discriminated union (functional modeling)
type Contract =
    | Murabaha of MurabahaDetails
    | Musharakah of MusharakahDetails
    | Ijara of IjaraDetails
```

**MUST NOT** use mutable class fields for domain state:

```fsharp
// WRONG: Mutable class — OOP style in F#
// type ZakatProcessor() =
//     let mutable status = "pending"
//     member _.Process() = status <- "processed"

// CORRECT: Immutable record + pure state transition function
type ZakatProcessor = { Status: ProcessingStatus }
let processZakat (processor: ZakatProcessor) = { processor with Status = Processed }
```

## Enforcement

- **Code reviews** — OOP patterns (mutable classes, inheritance) flagged and rejected for domain code
- **FSharpLint** — Flags some FP anti-patterns
- **Compiler** — Exhaustive pattern matches enforced; partial application type-checked

**Pre-commit checklist**:

- [ ] Domain logic is in pure functions
- [ ] `result { }` or `asyncResult { }` used for multi-step Result chains
- [ ] Applicative validation used when collecting multiple independent errors
- [ ] No mutable class fields in domain models
- [ ] No inheritance hierarchies — use DUs instead
- [ ] Partial application used for specialization where appropriate

## Related Standards

- [Coding Standards](coding-standards.md) - Discriminated unions and pipeline usage
- [Error Handling Standards](error-handling-standards.md) - Computation expressions for Result
- [DDD Standards](ddd-standards.md) - Functional aggregate pattern

## Related Documentation

- [Functional Programming](../../../../../governance/development/pattern/functional-programming.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
