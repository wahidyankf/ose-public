---
title: "F# Performance Standards"
description: Authoritative OSE Platform F# performance standards — tail recursion, struct DUs, BenchmarkDotNet, AltCover profiling
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - performance
  - profiling
  - benchmarks
  - tail-recursion
  - struct-discriminated-unions
  - benchmarkdotnet
  - altcover
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Performance Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative performance standards** for F# development in OSE Platform. Performance optimization follows the principle: make it work → make it right → make it fast. Premature optimization is prohibited. Measure first, optimize second.

**Target Audience**: OSE Platform F# developers working on performance-sensitive components

**Scope**: Tail recursion, struct discriminated unions, sequence vs list vs array, BenchmarkDotNet, AltCover, closure costs

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (BenchmarkDotNet automated benchmarks):

```fsharp
open BenchmarkDotNet.Attributes
open BenchmarkDotNet.Running

[<MemoryDiagnoser>]
type ZakatBenchmarks() =

    [<Benchmark(Baseline = true)>]
    member _.CalculateZakatBaseline() =
        calculateZakat 100_000m 5_000m

    [<Benchmark>]
    member _.CalculateZakatOptimized() =
        calculateZakatOptimized 100_000m 5_000m

[<EntryPoint>]
let main _ =
    BenchmarkRunner.Run<ZakatBenchmarks>() |> ignore
    0
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit `[<TailCall>]` attribute enforces tail recursion at compile time):

```fsharp
// CORRECT: F# 8+ compiler verifies tail call with attribute
[<TailCall>]
let rec sumWealth (remaining: decimal list) (accumulator: decimal) : decimal =
    match remaining with
    | [] -> accumulator
    | head :: tail -> sumWealth tail (accumulator + head)  // Tail call
```

### 3. Pure Functions Over Side Effects

**PASS Example** (Pure computation benchmarked — no I/O interference):

```fsharp
// CORRECT: Benchmark pure domain function without I/O noise
[<Benchmark>]
member _.ProcessZakatClaims() =
    zakatClaims |> List.map calculateZakatForClaim  // Pure — consistent benchmark
```

### 4. Immutability Over Mutability

**PASS Example** (Performance via structural sharing — not mutable state):

```fsharp
// CORRECT: F# lists use structural sharing (cons) — O(1) prepend
let addClaim (claims: ZakatClaim list) (newClaim: ZakatClaim) =
    newClaim :: claims  // O(1) — no copy, structural sharing

// WRONG: Array mutation for "performance" — loses immutability guarantees
// claims.[0] <- newClaim  // PROHIBITED for domain state
```

### 5. Reproducibility First

**PASS Example** (Reproducible benchmarks with warmup iterations):

```fsharp
[<SimpleJob(warmupCount = 3, iterationCount = 10)>]
type ZakatBenchmarks() = // ...
```

## Tail Recursion

### Why Tail Recursion Matters

F# runs on .NET which has a limited call stack (~1MB by default). Non-tail-recursive functions over large lists will throw `StackOverflowException`. Use tail recursion instead of standard recursion for any function that may process large collections.

### Tail Recursion Pattern

**MUST** use the accumulator pattern for tail-recursive loops:

```fsharp
// WRONG: Not tail-recursive — stack grows with list size
let rec sumWealth (claims: decimal list) : decimal =
    match claims with
    | [] -> 0m
    | head :: tail -> head + sumWealth tail  // WRONG: addition after recursion = not tail call

// CORRECT: Tail-recursive with accumulator
let sumWealth (claims: decimal list) : decimal =
    let rec loop remaining acc =
        match remaining with
        | [] -> acc
        | head :: tail -> loop tail (acc + head)  // Tail call — stack is constant
    loop claims 0m
```

### TailCall Attribute (F# 8+)

**SHOULD** annotate tail-recursive functions with `[<TailCall>]` in F# 8+ for compiler verification:

```fsharp
// CORRECT: Compiler verifies this is tail-recursive (F# 8+)
[<TailCall>]
let rec processPayments (payments: Payment list) (acc: decimal) : decimal =
    match payments with
    | [] -> acc
    | payment :: rest ->
        let amount = calculatePaymentZakat payment
        processPayments rest (acc + amount)
```

## Sequence vs List vs Array

Choose the right collection type for the workload:

| Collection | Prepend | Append | Random Access | Lazy | Memory            |
| ---------- | ------- | ------ | ------------- | ---- | ----------------- |
| `list`     | O(1)    | O(n)   | O(n)          | No   | Per-node overhead |
| `array`    | O(n)    | O(n)   | O(1)          | No   | Compact           |
| `seq`      | N/A     | N/A    | O(n)          | Yes  | Minimal (lazy)    |

**MUST** use the right collection for the operation:

```fsharp
// CORRECT: Array for random access in tight loops
let zakatAmounts : decimal[] = Array.init 1000 (fun i -> calculateZakat (decimal i * 1000m) 5_000m)
let fiftiethAmount = zakatAmounts.[49]  // O(1)

// CORRECT: List for recursive domain modeling (structural sharing)
let addZakatRecord (records: ZakatRecord list) (record: ZakatRecord) = record :: records

// CORRECT: Seq for lazy evaluation over large datasets
let totalZakatDue (payerIds: string seq) =
    payerIds
    |> Seq.map fetchWealth        // Lazy — does not evaluate all at once
    |> Seq.filter isAboveNisab
    |> Seq.map calculateZakat
    |> Seq.sum
```

**SHOULD** prefer `Array` over `List` for hot loops where performance is critical:

```fsharp
// CORRECT: Array.map is faster than List.map for large collections
let processLargeBatch (claims: ZakatClaim[]) =
    claims |> Array.Parallel.map processZakatClaim  // Parallel array processing
```

## Struct Discriminated Unions

**SHOULD** use `[<Struct>]` for discriminated unions used in hot paths to avoid heap allocation:

```fsharp
// CORRECT: Struct DU avoids heap allocation in tight loops
[<Struct>]
type ZakatStatus =
    | Obligatory
    | NotObligatory
    | Exempt

// Struct DU is allocated on the stack — no GC pressure
let classifyWealth (wealth: decimal) (nisab: decimal) : ZakatStatus =
    if wealth >= nisab then Obligatory
    elif isExemptCategory wealth then Exempt
    else NotObligatory
```

**MUST NOT** use `[<Struct>]` on DUs with many cases or large data payloads — struct size would exceed register size:

```fsharp
// WRONG: Struct with large data in cases — wastes memory (all cases same size)
// [<Struct>]
// type ZakatRecord =   // Each value takes space equal to largest case
//     | Full of PayerId: string * Wealth: decimal * ZakatDue: decimal * AuditLog: string list
//     | Partial of PayerId: string
```

## Inline Functions

**SHOULD** use `inline` for higher-order functions in hot paths to eliminate closure allocation:

```fsharp
// CORRECT: Inline eliminates the closure overhead
let inline mapZakatAmount (f: decimal -> decimal) (amount: decimal) = f amount

// Called like a regular function — compiler inlines the body at call site
let doubled = mapZakatAmount (fun x -> x * 2m) 1000m
```

## Avoiding Closure Over Mutable State

**PROHIBITED**: Closures that capture mutable references — causes unpredictable behavior in parallel contexts:

```fsharp
// WRONG: Closure captures mutable state — undefined behavior when parallelized
let mutable total = 0m
let processItem item = total <- total + calculateZakat item  // Mutable capture!

// CORRECT: Use accumulator pattern or Array.Parallel.map
let results = claims |> Array.Parallel.map (fun item -> calculateZakat item)
let total = Array.sum results
```

## BenchmarkDotNet

**MUST** use BenchmarkDotNet for any performance claim — never eyeball performance:

```xml
<PackageReference Include="BenchmarkDotNet" Version="0.14.0" />
```

```fsharp
// Minimal benchmark project — separate from production code
module ZakatBenchmarks

open BenchmarkDotNet.Attributes
open BenchmarkDotNet.Running

[<MemoryDiagnoser; RankColumn>]
type ZakatCalculationBenchmarks() =

    [<Params(100, 1_000, 10_000)>]
    member val ClaimCount = 0 with get, set

    member val Claims : ZakatClaim[] = [||] with get, set

    [<GlobalSetup>]
    member this.Setup() =
        this.Claims <- Array.init this.ClaimCount (fun i ->
            { PayerId = $"PAYER-{i}"; Wealth = decimal i * 1000m })

    [<Benchmark(Baseline = true)>]
    member this.ProcessWithList() =
        this.Claims |> Array.toList |> List.map calculateZakatForClaim

    [<Benchmark>]
    member this.ProcessWithArray() =
        this.Claims |> Array.map calculateZakatForClaim

    [<Benchmark>]
    member this.ProcessWithArrayParallel() =
        this.Claims |> Array.Parallel.map calculateZakatForClaim

[<EntryPoint>]
let main _ =
    BenchmarkRunner.Run<ZakatCalculationBenchmarks>() |> ignore
    0
```

## Enforcement

- **Code reviews** — Performance claims require BenchmarkDotNet output
- **No premature optimization** — Standard code reviewed for correctness first, performance second
- **Compiler** — `[<TailCall>]` attribute fails build if recursion is not tail-recursive

**Pre-commit checklist**:

- [ ] Recursive functions over large collections use accumulator pattern (tail-recursive)
- [ ] `[<TailCall>]` added on F# 8+ recursive functions
- [ ] Hot path collections use `Array` not `List` where justified by benchmarks
- [ ] Performance changes accompanied by BenchmarkDotNet results
- [ ] No closures capturing mutable state

## Related Standards

- [Concurrency Standards](concurrency-standards.md) - `Array.Parallel.map` for parallel performance
- [Functional Programming Standards](functional-programming-standards.md) - Seq composition for lazy evaluation

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
