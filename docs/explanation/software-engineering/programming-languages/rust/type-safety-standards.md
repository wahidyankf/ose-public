---
title: "Rust Type Safety Standards"
description: Authoritative OSE Platform Rust type safety standards (traits, generics, algebraic types, phantom types)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - type-safety
  - traits
  - generics
  - algebraic-types
  - phantom-types
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Type Safety Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative type safety standards** for Rust development in the OSE Platform. Rust's type system is among the most expressive in mainstream languages. Used correctly, it makes entire categories of bugs impossible at compile time.

**Target Audience**: OSE Platform Rust developers, technical reviewers

**Scope**: Algebraic types, trait bounds, generics, associated types, phantom types, From/Into conversions, sealed traits, stringly-typed API avoidance

## Software Engineering Principles

### 1. Explicit Over Implicit

The type system MUST make all domain concepts explicit:

- Domain values are typed newtypes, not raw primitives
- State machines use enum variants, not string status fields
- Fallibility is expressed via `Result<T, E>`, not panics
- Presence/absence uses `Option<T>`, not null or sentinel values

### 2. Immutability Over Mutability (Type-Level Enforcement)

Types MUST encode immutability guarantees:

- Phantom types enforce state machine transitions at compile time
- `&T` vs `&mut T` in function signatures encodes read vs write intent
- The newtype pattern prevents mutable access to internal values

### 3. Pure Functions Over Side Effects

Generic functions SHOULD be pure with respect to their type bounds:

- Trait bounds are contracts — functions only perform operations the bound permits
- Generic functions are deterministic for all types satisfying the bound

## Algebraic Data Types

### Sum Types (enum)

**MUST** use enums for values that are one of several variants. Rust enums are sum types — each variant can carry different data.

```rust
// CORRECT: Enum for mutually exclusive states
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ContractStatus {
    Draft,
    Active { activated_at: chrono::DateTime<chrono::Utc> },
    Suspended { reason: SuspensionReason },
    Settled { settled_at: chrono::DateTime<chrono::Utc>, final_amount: Money },
    Cancelled { reason: String },
}

// Pattern matching is exhaustive — compiler forces handling all variants
fn describe_status(status: &ContractStatus) -> &'static str {
    match status {
        ContractStatus::Draft => "draft",
        ContractStatus::Active { .. } => "active",
        ContractStatus::Suspended { .. } => "suspended",
        ContractStatus::Settled { .. } => "settled",
        ContractStatus::Cancelled { .. } => "cancelled",
        // Compiler error if a new variant is added and not handled here
    }
}

// WRONG: String-typed status — compiler cannot verify exhaustiveness
fn describe_status(status: &str) -> &str {
    match status {
        "draft" => "draft",
        "active" => "active",
        // Easy to forget a variant — no compiler check
        _ => "unknown", // This hides mistakes
    }
}
```

### Product Types (struct)

**MUST** use structs for values that have multiple fields simultaneously. Combine structs and enums to model complex domain state:

```rust
// CORRECT: Struct combining multiple required fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MurabahaContractTerms {
    pub cost_price: Money,
    pub profit_margin: ProfitMargin,
    pub installments: InstallmentCount,
    pub payment_schedule: PaymentSchedule,
}

// CORRECT: Enum of structs for different payment schedule types
pub enum PaymentSchedule {
    Monthly { amount_per_month: Money },
    Balloon { monthly_amount: Money, final_payment: Money },
    Custom { installments: Vec<PaymentInstallment> },
}
```

## Trait Bounds for Generic Functions

**SHOULD** use trait bounds to write generic functions that work for any type satisfying a contract:

```rust
// CORRECT: Generic function with explicit trait bounds
use std::fmt::Display;

fn format_financial_report<T>(items: &[T], label: &str) -> String
where
    T: Display + Clone,
{
    let formatted: Vec<String> = items.iter().map(|item| format!("  - {}", item)).collect();
    format!("{}:\n{}", label, formatted.join("\n"))
}

// CORRECT: Multiple bounds with + syntax
fn serialize_and_log<T>(value: &T)
where
    T: serde::Serialize + std::fmt::Debug,
{
    tracing::debug!("{:?}", value);
    let json = serde_json::to_string(value).unwrap_or_else(|_| "serialization failed".to_string());
    tracing::info!("{}", json);
}
```

### Where Clauses vs Inline Bounds

**SHOULD** use `where` clauses for complex bounds (more than one or two bounds per type parameter):

```rust
// CORRECT: where clause for complex bounds
fn process<T, U>(input: T) -> U
where
    T: Into<U> + Clone + std::fmt::Debug,
    U: Default + serde::Serialize,
{
    let converted: U = input.clone().into();
    converted
}

// ACCEPTABLE: Inline bounds for simple cases
fn display<T: Display>(value: &T) {
    println!("{}", value);
}
```

## Associated Types vs Generics

**MUST** use associated types when there is only one meaningful implementation per type. Use generic parameters when multiple implementations are valid.

```rust
// CORRECT: Associated type — a ContractRepository has exactly one Error type
pub trait ContractRepository {
    type Error;
    async fn find_by_id(&self, id: ContractId) -> Result<Option<MurabahaContract>, Self::Error>;
}

// CORRECT: Generic parameter — a function can work with many serializers
fn serialize<S: serde::Serializer>(contract: &MurabahaContract, serializer: S) -> Result<S::Ok, S::Error> {
    contract.serialize(serializer)
}
```

## PhantomData for Phantom Types

**SHOULD** use `PhantomData` for zero-cost type-level markers that carry no runtime data:

```rust
use std::marker::PhantomData;

// CORRECT: Typed ID that encodes the entity type at compile time
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct Id<T> {
    value: Uuid,
    _phantom: PhantomData<T>,
}

impl<T> Id<T> {
    pub fn new() -> Self {
        Id { value: Uuid::new_v4(), _phantom: PhantomData }
    }

    pub fn value(&self) -> Uuid {
        self.value
    }
}

// Now these are different types at compile time:
type ContractId = Id<MurabahaContract>;
type CustomerId = Id<Customer>;

// Compiler prevents mixing:
fn find_contract(id: ContractId) -> Option<MurabahaContract> { ... }
let customer_id: CustomerId = Id::new();
find_contract(customer_id); // COMPILE ERROR — correct!

// CORRECT: State machine with phantom types
struct Contract<State> {
    id: ContractId,
    _state: PhantomData<State>,
}

struct DraftState;
struct ActiveState;

impl Contract<DraftState> {
    // Only Draft contracts can be activated
    fn activate(self) -> Contract<ActiveState> {
        Contract { id: self.id, _state: PhantomData }
    }
}

impl Contract<ActiveState> {
    // Only Active contracts can be settled
    fn settle(self) -> SettledContract { ... }
}

// Cannot call activate() on an ActiveState contract — compile error!
```

## From/Into for Type Conversions

**MUST** implement `From<T>` for infallible conversions. Use `TryFrom<T>` for fallible conversions.

```rust
// CORRECT: From for infallible conversion
impl From<MurabahaContract> for ContractResponse {
    fn from(contract: MurabahaContract) -> Self {
        ContractResponse {
            id: contract.id().0,
            customer_id: contract.customer_id().0,
            cost_price: contract.cost_price().0.amount(),
            status: contract.status().to_string(),
        }
    }
}

// CORRECT: TryFrom for fallible conversion
impl TryFrom<ContractRow> for MurabahaContract {
    type Error = DomainError;

    fn try_from(row: ContractRow) -> Result<Self, Self::Error> {
        let cost_price = CostPrice(Money::new(row.cost_price)?);
        let profit_margin = ProfitMargin::new(row.profit_margin)?;
        Ok(MurabahaContract {
            id: ContractId(row.id),
            customer_id: CustomerId(row.customer_id),
            cost_price,
            profit_margin,
            installments: row.installments,
            status: row.status.parse()?,
        })
    }
}
```

**The implementing `From<T>` automatically provides `Into<U>`**:

```rust
// After implementing From<MurabahaContract> for ContractResponse:
let response: ContractResponse = contract.into(); // Auto-derived Into works
```

## Sealed Traits for Closed Type Families

**SHOULD** use the sealed trait pattern to prevent external types from implementing internal traits (see also [DDD Standards](ddd-standards.md)):

```rust
// Prevents external crates from implementing ContractState
mod private {
    pub trait Sealed {}
}

pub trait ContractState: private::Sealed + std::fmt::Debug {
    fn is_terminal(&self) -> bool;
}
```

## Avoiding Stringly-Typed APIs

**MUST NOT** use `String` or `&str` where a structured type better represents the domain.

```rust
// WRONG: Stringly-typed API — easy to pass wrong string
fn create_contract(customer_id: &str, status: &str) -> Result<Contract, Error> { ... }
create_contract("abc123", "aktif"); // Typo "aktif" — runtime error, not compile error

// CORRECT: Typed API — compiler validates
fn create_contract(customer_id: CustomerId, status: ContractStatus) -> Result<Contract, Error> { ... }
create_contract(customer_id, ContractStatus::Active { activated_at: Utc::now() });
// Cannot pass wrong type — compile error

// WRONG: Stringly-typed configuration
fn configure_service(mode: &str) -> Service {
    match mode {
        "production" => Service::production(),
        "development" => Service::development(),
        _ => panic!("unknown mode"), // Runtime error!
    }
}

// CORRECT: Typed configuration
enum ServiceMode { Production, Development }
fn configure_service(mode: ServiceMode) -> Service {
    match mode {
        ServiceMode::Production => Service::production(),
        ServiceMode::Development => Service::development(),
        // Compiler forces handling all variants
    }
}
```

## Enforcement

- **Compiler** — Type mismatches, missing trait bounds, and incomplete match arms are compile errors
- **Clippy** — Detects common type-safety anti-patterns (clippy::str_to_string, etc.)
- Code reviews verify domain concepts use typed newtypes, not raw primitives

**Pre-commit checklist**:

- [ ] Domain status fields use enums (not strings)
- [ ] Entity IDs use typed newtypes (not raw `Uuid`)
- [ ] Financial values use `Decimal` via newtype (not `f32`/`f64`)
- [ ] Infallible conversions use `From`/`Into`
- [ ] Fallible conversions use `TryFrom`/`TryInto`
- [ ] No stringly-typed API parameters
- [ ] Pattern matching is exhaustive (no `_ => "unknown"` hiding variants)

## Related Standards

- [Coding Standards](coding-standards.md) - Newtype pattern for value objects
- [DDD Standards](ddd-standards.md) - Domain type modeling
- [Error Handling Standards](error-handling-standards.md) - Error types as algebraic types
- [Memory Management Standards](memory-management-standards.md) - Smart pointers in generic code

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
