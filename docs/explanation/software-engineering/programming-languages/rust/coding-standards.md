---
title: "Rust Coding Standards"
description: Authoritative OSE Platform Rust coding standards (naming, modules, idioms, anti-patterns)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - coding-standards
  - idioms
  - ownership
  - traits
  - anti-patterns
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial. We define HOW to apply Rust in THIS codebase, not WHAT Rust is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Rust development in the OSE Platform. These are prescriptive rules that MUST be followed across all Rust projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Rust developers, technical reviewers, automated code quality tools

**Scope**: Naming conventions, module organization, idiomatic Rust patterns, and anti-patterns to avoid

## Software Engineering Principles

### 1. Automation Over Manual

Rust's tooling automates correctness and consistency:

- `rustfmt` for automated formatting (zero configuration decisions)
- `cargo clippy` for automated lint detection
- `cargo test` for automated testing
- `cargo audit` for automated security scanning
- The compiler itself as the ultimate automated verifier

```rust
// CORRECT: Rustfmt enforces consistent formatting automatically
fn calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal {
    if wealth < nisab {
        return Decimal::ZERO;
    }
    wealth * Decimal::new(25, 3) // 0.025 = 2.5%
}

// WRONG: Irregular formatting — rustfmt will correct this on commit
fn calculate_zakat(wealth:Decimal,nisab:Decimal)->Decimal{
    if wealth<nisab{return Decimal::ZERO;}
    wealth*Decimal::new(25,3)
}
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

Rust is designed for explicitness:

- Mutability MUST be declared with `mut`
- Unsafe operations MUST be inside `unsafe` blocks
- Trait implementations MUST be written explicitly (no implicit conversions)
- Error handling MUST use `Result<T, E>` (no exceptions, no null)

```rust
// CORRECT: Explicit mutability and error propagation
fn update_murabaha_price(
    contract: &mut MurabahaContract,
    new_cost: Decimal,
) -> Result<(), PricingError> {
    if new_cost <= Decimal::ZERO {
        return Err(PricingError::InvalidCost(new_cost));
    }
    contract.cost_price = new_cost;
    contract.total_price = new_cost + contract.profit_margin;
    Ok(())
}

// WRONG: Using unwrap() hides error handling
fn update_murabaha_price(contract: &mut MurabahaContract, new_cost: Decimal) {
    contract.cost_price = new_cost; // No validation, silently wrong
}
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability (Compiler-Enforced)

Rust ENFORCES immutability at the compiler level — not by convention:

- All bindings are immutable by default
- `mut` must be explicitly opted into
- Shared references (`&T`) prevent any mutation
- The borrow checker prevents aliased mutable references

```rust
// CORRECT: Immutable by default; create new values instead of mutating
struct ZakatTransaction {
    payer_id: String,
    wealth: Decimal,
    zakat_amount: Decimal,
}

impl ZakatTransaction {
    // Returns a new transaction with corrected amount — does not mutate
    fn with_corrected_amount(&self, corrected: Decimal) -> Self {
        ZakatTransaction {
            payer_id: self.payer_id.clone(),
            wealth: self.wealth,
            zakat_amount: corrected,
        }
    }
}

// WRONG: Unnecessary mutation when a new value suffices
let mut transaction = ZakatTransaction { ... };
transaction.zakat_amount = corrected; // Mutation not needed; create new value
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

Rust's ownership system encourages pure functions naturally:

- Functions that take `&T` and return new values are pure by construction
- Iterator combinators produce pure functional pipelines
- Domain logic MUST be pure — separate from I/O

```rust
// CORRECT: Pure function — deterministic, no side effects
fn calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal {
    if wealth < nisab {
        return Decimal::ZERO;
    }
    wealth * Decimal::new(25, 3)
}

// WRONG: Side effects mixed into calculation
fn calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal {
    println!("Calculating zakat for wealth: {}", wealth); // Side effect in pure fn
    if wealth < nisab {
        return Decimal::ZERO;
    }
    wealth * Decimal::new(25, 3)
}
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

Rust builds are reproducible by design with proper tooling:

- `Cargo.lock` committed for binaries ensures exact dependency versions
- `rust-toolchain.toml` pins exact compiler version
- `cargo vendor` for offline/air-gapped builds

```toml
# rust-toolchain.toml — Pins exact toolchain for reproducibility
[toolchain]
channel = "1.82.0"
components = ["rustfmt", "clippy"]
targets = ["x86_64-unknown-linux-gnu"]
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Naming Conventions

### Functions and Variables

**MUST** use `snake_case` for functions, methods, variables, and module names.

```rust
// CORRECT
fn calculate_zakat_amount(wealth: Decimal) -> Decimal { ... }
let profit_margin = Decimal::new(5, 2);
mod murabaha_contract;

// WRONG
fn CalculateZakatAmount(wealth: Decimal) -> Decimal { ... } // PascalCase
fn calculateZakatAmount(wealth: Decimal) -> Decimal { ... } // camelCase
let ProfitMargin = Decimal::new(5, 2); // PascalCase
```

### Types, Traits, and Enum Variants

**MUST** use `PascalCase` for structs, enums, traits, type aliases, and enum variants.

```rust
// CORRECT
struct MurabahaContract { ... }
enum ContractStatus { Active, Completed, Cancelled }
trait ZakatCalculator { ... }
type ContractId = Uuid;

// WRONG
struct murabaha_contract { ... } // snake_case
enum contract_status { active, completed } // snake_case
```

### Constants and Statics

**MUST** use `UPPER_SNAKE_CASE` for constants and statics.

```rust
// CORRECT
const ZAKAT_RATE: Decimal = Decimal::new(25, 3); // 0.025
const MAX_INSTALLMENTS: u32 = 120;
static NISAB_GOLD_GRAMS: f64 = 85.0;

// WRONG
const zakatRate: f64 = 0.025; // camelCase
const Zakat_Rate: f64 = 0.025; // Mixed case
```

### Lifetimes

**MUST** use short lowercase names for lifetimes. Use `'a`, `'b`, `'c` for simple cases. Use descriptive names (`'contract`, `'req`) when multiple lifetimes interact.

```rust
// CORRECT: Short lifetime in simple case
fn longest_contract<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// CORRECT: Descriptive lifetime when helpful
struct ContractRef<'contract> {
    contract: &'contract MurabahaContract,
}
```

## Module Organization

### lib.rs and main.rs Structure

**MUST** declare public modules in `lib.rs` or `main.rs` using `pub mod` and `mod` declarations. Use `pub use` re-exports to create a clean public API.

```rust
// lib.rs — Module declarations and public API surface
pub mod domain;
pub mod application;
pub mod infrastructure;

// Re-export key types for consumer convenience
pub use domain::zakat::{ZakatCalculator, ZakatTransaction};
pub use domain::murabaha::MurabahaContract;
pub use application::errors::AppError;
```

### Module Hierarchy

**MUST** organize modules by domain, not by layer.

```
src/
├── lib.rs
├── domain/
│   ├── mod.rs
│   ├── zakat.rs
│   ├── murabaha.rs
│   └── common/
│       ├── mod.rs
│       └── money.rs
├── application/
│   ├── mod.rs
│   ├── commands.rs
│   └── errors.rs
└── infrastructure/
    ├── mod.rs
    ├── db.rs
    └── http.rs
```

```rust
// WRONG: Layer-based organization
mod models;      // All models
mod services;    // All services
mod repositories; // All repositories

// CORRECT: Domain-based organization
mod zakat;       // Zakat domain
mod murabaha;    // Murabaha domain
mod waqf;        // Waqf domain
```

## Idiomatic Rust

### Use Iterators Over Loops

**SHOULD** prefer iterator combinators over imperative loops for collection transformations.

```rust
// CORRECT: Iterator pipeline — readable and zero-cost
let total_zakat: Decimal = transactions
    .iter()
    .filter(|t| t.is_eligible())
    .map(|t| t.zakat_amount)
    .sum();

// WRONG: Imperative loop for the same result
let mut total_zakat = Decimal::ZERO;
for t in &transactions {
    if t.is_eligible() {
        total_zakat += t.zakat_amount;
    }
}
```

### Prefer ? Over unwrap

**MUST** use the `?` operator for error propagation. **MUST NOT** use `unwrap()` in production code without a documented reason.

```rust
// CORRECT: ? propagates errors cleanly
async fn fetch_contract(id: Uuid) -> Result<MurabahaContract, AppError> {
    let contract = db.find_contract(id).await?;
    let validated = validate_contract(&contract)?;
    Ok(validated)
}

// WRONG: unwrap() panics on error in production
async fn fetch_contract(id: Uuid) -> MurabahaContract {
    db.find_contract(id).await.unwrap() // Panics if not found!
}
```

### Implement Display and Debug for Types

**MUST** derive `Debug` for all types. **SHOULD** implement `Display` for user-facing types.

```rust
// CORRECT: Debug derived, Display implemented for domain types
#[derive(Debug, Clone, PartialEq)]
struct ZakatAmount(Decimal);

impl fmt::Display for ZakatAmount {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (zakat)", self.0)
    }
}
```

### Builder Pattern for Complex Constructors

**SHOULD** use the builder pattern when a type has many optional fields.

```rust
// CORRECT: Builder pattern for complex construction
#[derive(Default)]
struct MurabahaContractBuilder {
    customer_id: Option<Uuid>,
    cost_price: Option<Decimal>,
    profit_margin: Option<Decimal>,
    installments: Option<u32>,
}

impl MurabahaContractBuilder {
    pub fn customer_id(mut self, id: Uuid) -> Self {
        self.customer_id = Some(id);
        self
    }

    pub fn cost_price(mut self, price: Decimal) -> Self {
        self.cost_price = Some(price);
        self
    }

    pub fn build(self) -> Result<MurabahaContract, ContractError> {
        Ok(MurabahaContract {
            customer_id: self.customer_id.ok_or(ContractError::MissingCustomerId)?,
            cost_price: self.cost_price.ok_or(ContractError::MissingCostPrice)?,
            profit_margin: self.profit_margin.unwrap_or(Decimal::new(5, 2)),
            installments: self.installments.unwrap_or(12),
        })
    }
}
```

### Newtype Pattern for Strong Typing

**SHOULD** use the newtype pattern to prevent mixing of semantically different values.

```rust
// CORRECT: Distinct types prevent mixing Zakat and Murabaha amounts
struct ZakatAmount(Decimal);
struct MurabahaProfit(Decimal);
struct ContractId(Uuid);

// Now the compiler prevents passing the wrong amount:
fn pay_zakat(amount: ZakatAmount) { ... }
let profit = MurabahaProfit(Decimal::new(1000, 0));
pay_zakat(profit); // COMPILE ERROR — correct behavior!

// WRONG: Raw primitives allow mixing without error
fn pay_zakat(amount: Decimal) { ... }
let profit = Decimal::new(1000, 0);
pay_zakat(profit); // Silently wrong — no compiler protection
```

### Derive Macros

**MUST** use derive macros for standard trait implementations rather than hand-rolling them.

```rust
// CORRECT: Derive standard traits
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default, Serialize, Deserialize)]
struct ContractId(Uuid);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
struct MurabahaContract {
    id: ContractId,
    customer_id: Uuid,
    cost_price: Decimal,
    profit_margin: Decimal,
}
```

### Avoid clone() in Hot Paths

**MUST NOT** use `clone()` in performance-critical paths when borrowing is sufficient.

```rust
// CORRECT: Borrow instead of clone
fn log_contract(contract: &MurabahaContract) {
    tracing::info!("Processing contract: {:?}", contract);
}

// WRONG: Unnecessary clone in hot path
fn log_contract(contract: MurabahaContract) { // Takes ownership unnecessarily
    tracing::info!("Processing contract: {:?}", contract);
}
```

## Anti-Patterns to Avoid

### Using unwrap() Without Justification

**PROHIBITED**: `unwrap()` in production code without a `// SAFETY:` or `// INVARIANT:` comment explaining why it cannot fail.

```rust
// WRONG: Silent panic potential
let contract = contracts.get(&id).unwrap();

// CORRECT: Explicit error handling
let contract = contracts
    .get(&id)
    .ok_or(ContractError::NotFound(id))?;

// ACCEPTABLE: Only when invariant is documented
// INVARIANT: Config is always loaded before this code path executes
let db_url = config.database_url.as_ref().expect("database_url must be set");
```

### String-Typed APIs

**PROHIBITED**: Using `String` or `&str` where a structured type is more appropriate.

```rust
// WRONG: Stringly-typed API
fn create_contract(status: String) -> Result<Contract, Error> { ... }

// CORRECT: Type-safe enum
enum ContractStatus { Draft, Active, Completed, Cancelled }
fn create_contract(status: ContractStatus) -> Result<Contract, Error> { ... }
```

### Ignoring Clippy Warnings Without Reason

**PROHIBITED**: Suppressing Clippy lints with `#[allow(...)]` without a documented reason.

```rust
// WRONG: Silent suppression
#[allow(clippy::too_many_arguments)]
fn complex_function(...) { ... }

// CORRECT: Document the reason or refactor
// This function processes a complete contract lifecycle event.
// The arguments are a data class pattern; extracting a struct would add noise.
#[allow(clippy::too_many_arguments)]
fn process_contract_event(...) { ... }
```

### Using f32/f64 for Financial Values

**PROHIBITED**: Floating-point arithmetic for any monetary or financial calculation.

```rust
// WRONG: Float precision loss in financial calculation
fn calculate_zakat(wealth: f64, nisab: f64) -> f64 {
    if wealth < nisab { return 0.0; }
    wealth * 0.025 // Floating-point imprecision!
}

// CORRECT: Decimal arithmetic for financial values
use rust_decimal::Decimal;

fn calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal {
    if wealth < nisab { return Decimal::ZERO; }
    wealth * Decimal::new(25, 3) // Exact: 0.025
}
```

## Enforcement

These standards are enforced through:

- **rustfmt** - Auto-formats code on pre-commit
- **cargo clippy -- -D warnings** - Fails CI on any lint warning
- **Code reviews** - Human verification of naming and structural standards

**Pre-commit checklist**:

- [ ] All names follow Rust naming conventions (snake_case/PascalCase/UPPER_SNAKE_CASE)
- [ ] No `unwrap()` without justification comment
- [ ] No `f32`/`f64` for financial values
- [ ] Iterator combinators used for collection transformations
- [ ] `?` operator used for error propagation
- [ ] `Debug` derived for all types
- [ ] Newtype wrappers used for domain-distinct values

## Related Standards

- [Error Handling Standards](error-handling-standards.md) - Result/Option patterns
- [Type Safety Standards](type-safety-standards.md) - Generics, traits, phantom types
- [Testing Standards](testing-standards.md) - cargo test, coverage

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
