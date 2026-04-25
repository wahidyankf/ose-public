---
title: "F# DDD Standards"
description: Authoritative OSE Platform F# domain-driven design standards — discriminated unions, value objects, aggregate pattern
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - ddd
  - domain-driven-design
  - discriminated-unions
  - value-objects
  - aggregates
  - making-invalid-states-unrepresentable
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# DDD Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative domain-driven design (DDD) standards** for F# development in OSE Platform. F# is uniquely suited for DDD: discriminated unions model domain states, records model value objects, and the type system enforces invariants at compile time. "Make illegal states unrepresentable" is the core F# DDD principle.

**Target Audience**: OSE Platform F# developers modeling Sharia finance domains

**Scope**: DU-driven domain modeling, value objects as records, single-case DUs for strong typing, aggregate pattern in functional style, domain events

## Software Engineering Principles

### 1. Immutability Over Mutability

**How F# DDD Implements**:

- Record types are immutable — value objects cannot be changed after creation
- Domain events are immutable facts — they represent what happened, not what might happen
- Aggregates return new state; they do not mutate existing state

**PASS Example** (Immutable Murabaha contract):

```fsharp
// CORRECT: Record is immutable — contract state never changes after creation
type MurabahaContract = {
    ContractId: ContractId
    CustomerId: CustomerId
    CostPrice: Money
    ProfitMargin: Money
    TotalPrice: Money
    CreatedAt: System.DateTimeOffset
    Status: ContractStatus
}

// State transitions create NEW records
let activateContract (contract: MurabahaContract) : MurabahaContract =
    { contract with Status = Active }  // New record — original unchanged
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit domain state with discriminated union):

```fsharp
// CORRECT: All valid states explicitly modeled — no "magic" status codes
type ContractStatus =
    | Draft
    | PendingApproval of submittedAt: System.DateTimeOffset
    | Active of activatedAt: System.DateTimeOffset
    | Completed of completedAt: System.DateTimeOffset
    | Cancelled of reason: string * cancelledAt: System.DateTimeOffset
```

### 3. Pure Functions Over Side Effects

**PASS Example** (Pure domain transitions):

```fsharp
// CORRECT: State transition is pure — takes state, returns new state + events
let submitForApproval (contract: MurabahaContract) : Result<MurabahaContract * ContractEvent, string> =
    match contract.Status with
    | Draft ->
        let now = System.DateTimeOffset.UtcNow
        let updatedContract = { contract with Status = PendingApproval now }
        let event = ContractSubmitted { ContractId = contract.ContractId; SubmittedAt = now }
        Ok (updatedContract, event)
    | PendingApproval _ -> Error "Contract is already pending approval"
    | Active _ -> Error "Contract is already active"
    | Completed _ -> Error "Cannot resubmit a completed contract"
    | Cancelled _ -> Error "Cannot resubmit a cancelled contract"
```

### 4. Automation Over Manual

**PASS Example** (Property tests verify DU exhaustiveness):

```fsharp
// CORRECT: FsCheck verifies all domain transitions for all valid states
testProperty "completed contracts cannot be resubmitted" <| fun (completedAt: System.DateTimeOffset) ->
    let completedContract = { testContract with Status = Completed completedAt }
    submitForApproval completedContract |> Result.isError
```

### 5. Reproducibility First

**PASS Example** (Domain logic is purely functional — reproducible, deterministic):

```fsharp
// CORRECT: Same contract input always produces same validation result
let result1 = validateMurabahaContract testContract
let result2 = validateMurabahaContract testContract
// result1 = result2 always — deterministic domain logic
```

## Making Illegal States Unrepresentable

This is the primary F# DDD principle. Use the type system to prevent invalid domain states from being constructed:

```fsharp
// WRONG: Status as string allows invalid values
type ZakatRecord = {
    PayerId: string
    Status: string  // Could be "pending", "PENDING", "approved", "", anything!
    Amount: decimal
}

// CORRECT: Status as DU — only valid states exist
type ZakatRecordStatus =
    | Pending
    | Approved of approvedBy: string * approvedAt: System.DateTimeOffset
    | Rejected of reason: string
    | Paid of paidAt: System.DateTimeOffset * receipt: string

type ZakatRecord = {
    PayerId: PayerId
    Status: ZakatRecordStatus
    Amount: Money
}
```

## Value Objects as F# Records

**MUST** model domain value objects as immutable F# records with factory functions:

```fsharp
// CORRECT: Money as a value object — encapsulates currency rules
type Money = private { Amount: decimal; Currency: string }

module Money =
    let create (amount: decimal) (currency: string) : Result<Money, string> =
        if amount < 0m then Error "Money amount cannot be negative"
        elif System.String.IsNullOrWhiteSpace(currency) then Error "Currency code required"
        elif currency.Length <> 3 then Error "Currency code must be ISO 4217 (3 letters)"
        else Ok { Amount = amount; Currency = currency }

    let value (m: Money) = m.Amount
    let currency (m: Money) = m.Currency

    let add (a: Money) (b: Money) : Result<Money, string> =
        if a.Currency <> b.Currency then
            Error $"Cannot add {a.Currency} and {b.Currency}"
        else
            Ok { Amount = a.Amount + b.Amount; Currency = a.Currency }
```

## Single-Case DUs for Strong IDs

**MUST** use single-case discriminated unions for all domain identifiers — prevents ID type confusion:

```fsharp
// CORRECT: Distinct types prevent mixing up IDs
type PayerId = PayerId of string
type ZakatId = ZakatId of string
type ContractId = ContractId of string

// The compiler rejects passing the wrong ID type
let findZakatRecord (id: ZakatId) : ZakatRecord option = ...
let findPayer (id: PayerId) : Payer option = ...

// WRONG: Would silently accept wrong ID
// let findZakatRecord (id: string) : ZakatRecord option = ...
```

**SHOULD** make ID constructors private and provide a factory module:

```fsharp
// CORRECT: Private constructor forces use of factory
type ZakatId = private ZakatId of string

module ZakatId =
    let create (raw: string) : Result<ZakatId, string> =
        if System.Guid.TryParse(raw, ref System.Guid.Empty) then Ok (ZakatId raw)
        else Error $"Invalid ZakatId format: {raw}"

    let value (ZakatId id) = id
    let newId () = ZakatId (System.Guid.NewGuid().ToString())
```

## Domain Events as DU Cases

**MUST** model domain events as discriminated union cases — immutable records of what happened:

```fsharp
// CORRECT: Domain events as DU
type ZakatDomainEvent =
    | ZakatCalculated of
        payerId: PayerId *
        zakatDue: Money *
        calculatedAt: System.DateTimeOffset

    | ZakatPaid of
        zakatId: ZakatId *
        payerId: PayerId *
        amount: Money *
        paidAt: System.DateTimeOffset *
        receiptNumber: string

    | ZakatCancelled of
        zakatId: ZakatId *
        reason: string *
        cancelledAt: System.DateTimeOffset
```

## Aggregate Pattern in Functional Style

**SHOULD** implement aggregates as modules with pure state transition functions that return new state + events:

```fsharp
// ZakatAggregate.fs — functional aggregate
module ZakatAggregate

type ZakatState =
    | Uncreated
    | Pending of zakatId: ZakatId * wealth: Money
    | Approved of zakatId: ZakatId * amount: Money
    | Paid of zakatId: ZakatId * receipt: string

type ZakatCommand =
    | CreateZakat of payerId: PayerId * wealth: Money
    | ApproveZakat of zakatId: ZakatId * approvedBy: string
    | RecordPayment of zakatId: ZakatId * receiptNumber: string

// Pure state transition — takes command + state, returns new state + events
let handle (state: ZakatState) (command: ZakatCommand) : Result<ZakatState * ZakatDomainEvent list, string> =
    match state, command with
    | Uncreated, CreateZakat(payerId, wealth) ->
        let id = ZakatId.newId()
        let newState = Pending(id, wealth)
        let events = [ ZakatCalculated(payerId, wealth, System.DateTimeOffset.UtcNow) ]
        Ok (newState, events)

    | Pending(id, amount), ApproveZakat(zakatId, approvedBy) when id = zakatId ->
        let newState = Approved(id, amount)
        Ok (newState, [])

    | Approved _, RecordPayment(zakatId, receipt) ->
        let newState = Paid(zakatId, receipt)
        let events = [ ZakatPaid(zakatId, PayerId.newId(), Money.zero, System.DateTimeOffset.UtcNow, receipt) ]
        Ok (newState, events)

    | _, command -> Error $"Command {command} is not valid in state {state}"
```

## Enforcement

- **Compiler** — DU exhaustive matching enforced; new domain states require all handlers to be updated
- **Code reviews** — Verify single-case DUs for IDs, value objects use private constructors
- **FsCheck** — Property tests verify domain invariants hold for all valid states

**Pre-commit checklist**:

- [ ] Domain identifiers use single-case DUs (not raw strings)
- [ ] Domain states modeled as discriminated unions
- [ ] Value objects use private constructors with factory module
- [ ] State transitions are pure functions returning new state + events
- [ ] Pattern matches on DU states are exhaustive (no wildcards hiding new cases)

## Related Standards

- [Coding Standards](coding-standards.md) - Discriminated union modeling basics
- [Type Safety Standards](type-safety-standards.md) - Single-case DUs and type providers
- [Error Handling Standards](error-handling-standards.md) - Result type in domain transitions

## Related Documentation

- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
