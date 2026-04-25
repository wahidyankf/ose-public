---
title: "F# Concurrency Standards"
description: Authoritative OSE Platform F# concurrency standards — async workflows, MailboxProcessor actor model, Task interop
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - concurrency
  - async-workflows
  - mailboxprocessor
  - task
  - cancellation
  - actor-model
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Concurrency Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative concurrency standards** for F# development in OSE Platform. F# async workflows, MailboxProcessor actors, and Task computation expressions provide composable, safe concurrency without shared mutable state.

**Target Audience**: OSE Platform F# developers working on concurrent systems

**Scope**: F# `async {}` workflows, `task {}` CE, MailboxProcessor, `Async.Parallel`, cancellation tokens, C# interop

## Software Engineering Principles

### 1. Immutability Over Mutability

**How F# Implements Concurrency Safety**:

- Immutable data by default — most concurrency hazards simply do not exist
- MailboxProcessor serializes access to mutable state without locks
- Async workflows are values — composed, not mutated

**PASS Example** (MailboxProcessor for safe state isolation):

```fsharp
// CORRECT: MailboxProcessor owns state — no shared mutable access
type ZakatLedger() =
    let agent = MailboxProcessor.Start(fun inbox ->
        let rec loop (totalCollected: decimal) =
            async {
                let! msg = inbox.Receive()
                match msg with
                | AddPayment amount ->
                    return! loop (totalCollected + amount)
                | GetTotal reply ->
                    reply.Reply totalCollected
                    return! loop totalCollected
            }
        loop 0m
    )

    member _.AddPayment amount = agent.Post (AddPayment amount)
    member _.GetTotal () = agent.PostAndReply GetTotal
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit cancellation token — no implicit global cancellation):

```fsharp
// CORRECT: Cancellation token passed explicitly
let fetchZakatDataWithCancellation (ct: System.Threading.CancellationToken) =
    async {
        use client = new System.Net.Http.HttpClient()
        let! response = client.GetStringAsync("https://api.example.com/zakat", ct) |> Async.AwaitTask
        return response
    }
```

### 3. Pure Functions Over Side Effects

**PASS Example** (Pure calculations separated from async I/O):

```fsharp
// CORRECT: Pure calculation is synchronous and side-effect free
let calculateZakat wealth nisab = wealth * 0.025m  // Pure

// Async I/O at the shell only
let fetchAndCalculate customerId =
    async {
        let! wealth = WealthRepository.getWealth customerId   // Async I/O
        let! nisab = NisabService.getCurrentNisab ()          // Async I/O
        return calculateZakat wealth nisab                    // Pure, synchronous
    }
```

### 4. Automation Over Manual

**PASS Example** (Parallel processing with Async.Parallel):

```fsharp
// CORRECT: Automatic parallel execution of independent async operations
let fetchAllZakatRecords (payerIds: string list) =
    payerIds
    |> List.map ZakatRepository.getRecord
    |> Async.Parallel
    |> Async.map Array.toList
```

### 5. Reproducibility First

**PASS Example** (Deterministic async test setup):

```fsharp
// CORRECT: Async tests with explicit cancellation for reproducible timeouts
let testWithTimeout timeoutMs test =
    let cts = new System.Threading.CancellationTokenSource(timeoutMs)
    Async.StartAsTask(test, cancellationToken = cts.Token)
```

## F# Async Workflows

### Basic Async Computation

**MUST** use `async { }` computation expression for F#-native async operations:

```fsharp
// CORRECT: async CE for F# async workflows
let fetchZakatRecord (recordId: string) : Async<ZakatRecord option> =
    async {
        let! connection = Database.openConnection ()
        let! record = Database.query connection $"SELECT * WHERE id = '{recordId}'"
        return record
    }
```

### Async Sequential Composition

**MUST** use `let!` to await async results within the CE:

```fsharp
// CORRECT: Sequential async steps
let processZakatClaim (claimId: string) : Async<Result<ZakatReceipt, string>> =
    async {
        let! claim = ClaimRepository.findById claimId
        match claim with
        | None -> return Error "Claim not found"
        | Some c ->
            let! wealth = WealthService.getWealth c.PayerId
            let zakatDue = calculateZakat wealth 5_000m
            let! receipt = ReceiptService.create c.PayerId zakatDue
            return Ok receipt
    }
```

### Async Parallel Composition

**MUST** use `Async.Parallel` for independent concurrent operations:

```fsharp
// CORRECT: Independent fetches run in parallel
let fetchZakatSummary (payerId: string) : Async<ZakatSummary> =
    async {
        let! wealth, nisab, history =
            Async.Parallel [|
                WealthService.getCurrentWealth payerId
                NisabService.getCurrentNisab ()
                HistoryService.getPaymentHistory payerId
            |]
            |> Async.map (fun [| w; n; h |] -> w, n, h)

        return buildSummary wealth nisab history
    }
```

### Cancellation

**MUST** thread `CancellationToken` through async operations that may be long-running:

```fsharp
// CORRECT: Respect cancellation in long-running async workflows
let processLargeZakatBatch (payerIds: string list) (ct: System.Threading.CancellationToken) =
    async {
        for payerId in payerIds do
            ct.ThrowIfCancellationRequested()
            let! _ = processZakatForPayer payerId
            ()
    }
    |> Async.WithCancellation ct
```

## Task Computation Expression (F# 6+)

**SHOULD** use `task { }` CE for interoperability with .NET Task-based APIs (Giraffe, Entity Framework, etc.):

```fsharp
// CORRECT: task CE for .NET Task interop
open System.Threading.Tasks

let fetchZakatDataFromDb (id: string) : Task<ZakatRecord option> =
    task {
        use ctx = new ZakatDbContext()
        let! record = ctx.ZakatRecords.FindAsync(id)
        return Option.ofObj record
    }
```

### Async / Task Interop

**MUST** use `Async.AwaitTask` to bridge Task into async workflows:

```fsharp
// CORRECT: Bridging Task into async
let fetchFromCSharpService (id: string) : Async<ZakatData> =
    async {
        let! result = CSharpZakatService.GetDataAsync(id) |> Async.AwaitTask
        return result
    }
```

**MUST** use `Async.StartAsTask` to expose async workflows as Tasks for C# consumers:

```fsharp
// CORRECT: Expose F# async as Task for C# callers
let getZakatAmountTask (payerId: string) : System.Threading.Tasks.Task<decimal> =
    calculateZakatForPayer payerId |> Async.StartAsTask
```

## MailboxProcessor (Actor Model)

**SHOULD** use `MailboxProcessor<'Msg>` for state that requires serialized, concurrent access:

```fsharp
// CORRECT: MailboxProcessor isolates mutable state safely
type LedgerMessage =
    | Credit of amount: decimal
    | Debit of amount: decimal
    | GetBalance of AsyncReplyChannel<decimal>

let createLedger (initialBalance: decimal) =
    MailboxProcessor.Start(fun inbox ->
        let rec loop balance =
            async {
                let! msg = inbox.Receive()
                match msg with
                | Credit amount -> return! loop (balance + amount)
                | Debit amount ->
                    let newBalance = balance - amount
                    if newBalance < 0m then
                        return! loop balance  // Reject — insufficient funds
                    else
                        return! loop newBalance
                | GetBalance reply ->
                    reply.Reply balance
                    return! loop balance
            }
        loop initialBalance
    )
```

**Use MailboxProcessor when**:

- Multiple async operations need to read/update shared state
- You need serialized message processing (like an actor)
- Avoiding locks while maintaining thread safety

## Avoiding Shared Mutable State

**PROHIBITED**: Shared mutable variables accessed from multiple async workflows:

```fsharp
// WRONG: Shared mutable state — race condition risk
let mutable totalZakatCollected = 0m

let recordPayment amount =
    async {
        // WRONG: Multiple async workflows could interleave here
        totalZakatCollected <- totalZakatCollected + amount
    }

// CORRECT: Use MailboxProcessor or immutable accumulator
let ledger = createLedger 0m

let recordPayment amount =
    async {
        ledger.Post (Credit amount)
    }
```

## Enforcement

- **Code reviews** — Verify MailboxProcessor used for shared state, no mutable globals
- **Compiler** — `TreatWarningsAsErrors=true` catches many concurrency mistakes
- **Testing** — Concurrency tests use Expecto's `testAsync` and explicit timeouts

**Pre-commit checklist**:

- [ ] No shared mutable state accessed from multiple async workflows
- [ ] `CancellationToken` threaded through long-running operations
- [ ] `Async.AwaitTask` used (not `.Result`) when bridging Task to async
- [ ] MailboxProcessor used for state that requires serialized access
- [ ] `task {}` CE used for direct .NET Task interop

## Related Standards

- [Error Handling Standards](error-handling-standards.md) - asyncResult CE for async + Result
- [Performance Standards](performance-standards.md) - Tail recursion in MailboxProcessor loops
- [API Standards](api-standards.md) - Async Giraffe handlers

## Related Documentation

- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS (task CE from F# 6+)
