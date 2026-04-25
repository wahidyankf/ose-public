---
title: "Rust DDD Standards"
description: Authoritative OSE Platform Rust Domain-Driven Design standards (value objects, aggregates, Repository trait, domain events)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - ddd
  - domain-driven-design
  - value-objects
  - aggregates
  - traits
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust DDD Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative Domain-Driven Design (DDD) standards** for Rust development in the OSE Platform. Rust's type system is exceptionally well-suited for DDD — the newtype pattern, enums, and trait system enable rich domain models that make invalid states unrepresentable.

**Target Audience**: OSE Platform Rust developers working on domain models and business logic

**Scope**: Value objects, entities, aggregates, Repository trait, domain events, sealed traits

## Software Engineering Principles

### 1. Immutability Over Mutability (Compiler-Enforced DDD)

Rust enforces DDD immutability at the compiler level:

- Value objects are naturally immutable (no `mut`)
- Aggregate invariants are enforced by private fields + public methods
- Domain events are immutable records of past occurrences
- The ownership system prevents external mutation of aggregate internals

### 2. Explicit Over Implicit

Domain concepts MUST be explicit types:

- Money is `struct Money(Decimal)`, not a raw `Decimal`
- Contract IDs are `struct ContractId(Uuid)`, not raw `Uuid`
- Status is `enum ContractStatus { Draft, Active, Settled }`, not a `String`
- Invalid states are impossible, not just discouraged

### 3. Pure Functions Over Side Effects

Domain logic MUST be pure:

- Aggregate methods return new state or events — no hidden I/O
- Value object operations return new values — no mutation
- Repository trait separates persistence (side effect) from domain (pure)

## Value Objects with Newtype Pattern

**MUST** use the newtype pattern for value objects. A value object has no identity — it is defined entirely by its value.

```rust
use rust_decimal::Decimal;
use std::fmt;
use std::ops::{Add, Mul};
use serde::{Serialize, Deserialize};

// CORRECT: Newtype value object with enforced invariants
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct Money(Decimal);

impl Money {
    pub fn new(amount: Decimal) -> Result<Self, DomainError> {
        if amount < Decimal::ZERO {
            return Err(DomainError::NegativeMoney(amount));
        }
        Ok(Money(amount))
    }

    pub fn zero() -> Self {
        Money(Decimal::ZERO)
    }

    pub fn amount(&self) -> Decimal {
        self.0
    }
}

impl Add for Money {
    type Output = Money;
    fn add(self, rhs: Money) -> Money {
        Money(self.0 + rhs.0) // Sum of non-negative values is always valid
    }
}

impl Mul<Decimal> for Money {
    type Output = Money;
    fn mul(self, rate: Decimal) -> Money {
        Money(self.0 * rate) // Assumes rate is non-negative — validated at callsite
    }
}

impl fmt::Display for Money {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.2}", self.0)
    }
}

// WRONG: Raw Decimal — no invariant enforcement, no semantic meaning
fn calculate_profit(cost: Decimal, margin: Decimal) -> Decimal {
    cost * margin // Which is cost? Which is margin? Can they be negative?
}

// CORRECT: Typed value objects make the domain explicit
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CostPrice(Money);
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ProfitMargin(Decimal); // 0.0 to 1.0

fn calculate_profit(cost: CostPrice, margin: ProfitMargin) -> Money {
    cost.0 * margin.0
}
```

## Entities with ID Newtype

**MUST** use a newtype wrapper for entity IDs to prevent mixing IDs across entity types:

```rust
// CORRECT: Typed IDs prevent mixing
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ContractId(Uuid);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CustomerId(Uuid);

impl ContractId {
    pub fn new() -> Self {
        ContractId(Uuid::new_v4())
    }
}

// Now the compiler prevents using CustomerId where ContractId is required:
fn find_contract(id: ContractId) -> Option<MurabahaContract> { ... }
let customer_id = CustomerId::new();
find_contract(customer_id); // COMPILE ERROR — correct behavior!

// WRONG: Raw Uuid — no type safety across entity boundaries
fn find_contract(id: Uuid) -> Option<MurabahaContract> { ... }
let customer_id = Uuid::new_v4();
find_contract(customer_id); // Silently wrong — no compiler protection
```

## Aggregates

**MUST** implement aggregates as structs with private fields and public methods that enforce invariants.

```rust
// CORRECT: Aggregate with enforced invariants
#[derive(Debug)]
pub struct MurabahaContract {
    id: ContractId,
    customer_id: CustomerId,
    cost_price: CostPrice,
    profit_margin: ProfitMargin,
    installments: u32,
    status: ContractStatus,
    events: Vec<DomainEvent>, // Collected events, not yet published
}

impl MurabahaContract {
    /// Creates a new MurabahaContract, enforcing all business invariants.
    pub fn new(
        customer_id: CustomerId,
        cost_price: CostPrice,
        profit_margin: ProfitMargin,
        installments: u32,
    ) -> Result<Self, ContractError> {
        if installments == 0 || installments > 360 {
            return Err(ContractError::InvalidInstallmentCount(installments));
        }
        let profit_margin_value = profit_margin.0;
        if profit_margin_value < Decimal::ZERO || profit_margin_value > Decimal::ONE {
            return Err(ContractError::InvalidProfitMargin(profit_margin_value));
        }

        Ok(MurabahaContract {
            id: ContractId::new(),
            customer_id,
            cost_price,
            profit_margin,
            installments,
            status: ContractStatus::Draft,
            events: vec![DomainEvent::ContractCreated {
                contract_id: ContractId::new(),
                customer_id,
            }],
        })
    }

    /// Activates the contract. Only valid from Draft status.
    pub fn activate(&mut self) -> Result<(), ContractError> {
        match self.status {
            ContractStatus::Draft => {
                self.status = ContractStatus::Active;
                self.events.push(DomainEvent::ContractActivated { contract_id: self.id });
                Ok(())
            }
            _ => Err(ContractError::InvalidStatusTransition {
                from: self.status,
                to: ContractStatus::Active,
            }),
        }
    }

    /// Settles the contract. Only valid from Active status.
    pub fn settle(&mut self) -> Result<(), ContractError> {
        match self.status {
            ContractStatus::Active => {
                self.status = ContractStatus::Settled;
                self.events.push(DomainEvent::ContractSettled { contract_id: self.id });
                Ok(())
            }
            _ => Err(ContractError::InvalidStatusTransition {
                from: self.status,
                to: ContractStatus::Settled,
            }),
        }
    }

    // Read-only accessors
    pub fn id(&self) -> ContractId { self.id }
    pub fn customer_id(&self) -> CustomerId { self.customer_id }
    pub fn status(&self) -> ContractStatus { self.status }

    /// Drains collected domain events for publication
    pub fn take_events(&mut self) -> Vec<DomainEvent> {
        std::mem::take(&mut self.events)
    }
}
```

## Repository Trait

**MUST** define the Repository as a trait in the domain layer. The implementation lives in the infrastructure layer.

```rust
// CORRECT: Repository as a domain trait (Rust 1.75+ RPITIT syntax)
pub trait ContractRepository: Send + Sync {
    async fn find_by_id(&self, id: ContractId) -> Result<Option<MurabahaContract>, RepositoryError>;
    async fn save(&self, contract: &MurabahaContract) -> Result<(), RepositoryError>;
    async fn find_by_customer(&self, customer_id: CustomerId) -> Result<Vec<MurabahaContract>, RepositoryError>;
}

// For pre-1.75 compatibility, use async-trait:
use async_trait::async_trait;

#[async_trait]
pub trait ContractRepository: Send + Sync {
    async fn find_by_id(&self, id: ContractId) -> Result<Option<MurabahaContract>, RepositoryError>;
    async fn save(&self, contract: &MurabahaContract) -> Result<(), RepositoryError>;
}

// Infrastructure implementation
pub struct PostgresContractRepository {
    pool: Arc<sqlx::PgPool>,
}

#[async_trait]
impl ContractRepository for PostgresContractRepository {
    async fn find_by_id(&self, id: ContractId) -> Result<Option<MurabahaContract>, RepositoryError> {
        sqlx::query_as!(
            ContractRow,
            "SELECT * FROM murabaha_contracts WHERE id = $1",
            id.0
        )
        .fetch_optional(&*self.pool)
        .await
        .map_err(RepositoryError::from)?
        .map(|row| row.try_into())
        .transpose()
        .map_err(RepositoryError::from)
    }
}

// In-memory implementation for tests
pub struct InMemoryContractRepository {
    contracts: Mutex<HashMap<ContractId, MurabahaContract>>,
}

#[async_trait]
impl ContractRepository for InMemoryContractRepository {
    async fn find_by_id(&self, id: ContractId) -> Result<Option<MurabahaContract>, RepositoryError> {
        Ok(self.contracts.lock().await.get(&id).cloned())
    }
}
```

## Domain Events as Enum Variants

**MUST** model domain events as enum variants. Events are immutable records of things that happened.

```rust
// CORRECT: Domain events as enum
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DomainEvent {
    ContractCreated {
        contract_id: ContractId,
        customer_id: CustomerId,
        occurred_at: chrono::DateTime<chrono::Utc>,
    },
    ContractActivated {
        contract_id: ContractId,
        occurred_at: chrono::DateTime<chrono::Utc>,
    },
    ContractSettled {
        contract_id: ContractId,
        final_amount: Money,
        occurred_at: chrono::DateTime<chrono::Utc>,
    },
    ZakatPaid {
        payer_id: CustomerId,
        zakat_amount: Money,
        fiscal_year: u32,
        occurred_at: chrono::DateTime<chrono::Utc>,
    },
}
```

## Sealed Trait Pattern for Closed Type Hierarchies

**SHOULD** use the sealed trait pattern to prevent external types from implementing domain traits:

```rust
// Domain module — sealed trait
mod private {
    pub trait Sealed {}
}

pub trait ContractState: private::Sealed {
    fn is_terminal(&self) -> bool;
}

// Only these types can implement ContractState
impl private::Sealed for DraftState {}
impl private::Sealed for ActiveState {}
impl private::Sealed for SettledState {}

impl ContractState for DraftState {
    fn is_terminal(&self) -> bool { false }
}

impl ContractState for ActiveState {
    fn is_terminal(&self) -> bool { false }
}

impl ContractState for SettledState {
    fn is_terminal(&self) -> bool { true }
}
```

## Making Invalid States Unrepresentable

**MUST** use enums and the type system to eliminate invalid states:

```rust
// WRONG: Optional fields that create invalid combinations
struct MurabahaContract {
    status: ContractStatus,
    settled_at: Option<DateTime<Utc>>, // Only valid when status == Settled
    settlement_amount: Option<Money>,  // Only valid when status == Settled
    // What if status == Active but settled_at is Some? Invalid state is possible!
}

// CORRECT: State machine via enum makes invalid states impossible
enum MurabahaContractState {
    Draft {
        created_at: DateTime<Utc>,
    },
    Active {
        activated_at: DateTime<Utc>,
        payment_schedule: Vec<PaymentInstallment>,
    },
    Settled {
        activated_at: DateTime<Utc>,
        settled_at: DateTime<Utc>,
        settlement_amount: Money, // Always present in Settled state
    },
}
```

## Enforcement

- **Compiler** — Private fields prevent external invariant violations
- **Type system** — Newtype wrappers prevent ID/value mixing
- Code reviews verify DDD patterns are applied correctly

**Pre-commit checklist**:

- [ ] Value objects use newtype pattern with invariant enforcement
- [ ] Entity IDs are typed newtypes (not raw `Uuid`)
- [ ] Aggregates have private fields and public methods enforcing invariants
- [ ] Repository is a trait in the domain layer
- [ ] Domain events modeled as enum variants
- [ ] No `f32`/`f64` for financial values (use `Decimal` via newtype)
- [ ] Invalid states are unrepresentable (enum over optional fields)

## Related Standards

- [Coding Standards](coding-standards.md) - Newtype pattern
- [Type Safety Standards](type-safety-standards.md) - Phantom types, sealed traits
- [Error Handling Standards](error-handling-standards.md) - Domain error types
- [API Standards](api-standards.md) - Mapping domain types to API responses

## Related Documentation

**Software Engineering Principles**:

- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
