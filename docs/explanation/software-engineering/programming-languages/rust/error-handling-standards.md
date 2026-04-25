---
title: "Rust Error Handling Standards"
description: Authoritative OSE Platform Rust error handling standards (Result, Option, thiserror, anyhow)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - error-handling
  - result
  - option
  - thiserror
  - anyhow
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Error Handling Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative error handling standards** for Rust development in the OSE Platform. Rust's error handling model — using `Result<T, E>` and `Option<T>` — is a core language feature. These standards ensure consistent, informative, and maintainable error handling across all Rust projects.

**Target Audience**: OSE Platform Rust developers, technical reviewers

**Scope**: Result and Option usage, ? operator, thiserror, anyhow, error design, anti-patterns

## Software Engineering Principles

### 1. Explicit Over Implicit

Rust makes error handling explicit at the type system level:

- Every fallible operation returns `Result<T, E>` — callers MUST handle it
- `Option<T>` replaces null — no null pointer exceptions
- No hidden exceptions, no throw/catch surprises
- The compiler enforces error handling completeness

### 2. Immutability Over Mutability

Errors MUST be immutable value types:

- Error types are data (structs/enums), not mutable objects
- Error values carry all context at creation time
- Error chains are immutable — never modified after creation

### 3. Pure Functions Over Side Effects

Domain functions MUST return errors, not panic:

- `Result<T, E>` is the pure function approach to error signaling
- Panics are side effects — unpredictable, hard to handle
- Pure error handling enables deterministic testing

## Result<T, E> for Fallible Operations

**MUST** use `Result<T, E>` for all fallible operations. Never use panic for expected errors.

```rust
// CORRECT: Explicit error return
fn parse_zakat_amount(input: &str) -> Result<ZakatAmount, ParseError> {
    let value: Decimal = input.parse().map_err(|_| ParseError::InvalidDecimal)?;
    if value < Decimal::ZERO {
        return Err(ParseError::NegativeAmount(value));
    }
    Ok(ZakatAmount(value))
}

// WRONG: Panic for expected failure
fn parse_zakat_amount(input: &str) -> ZakatAmount {
    let value: Decimal = input.parse().expect("invalid decimal"); // Panics on bad input!
    ZakatAmount(value)
}
```

## Option<T> Instead of Null

**MUST** use `Option<T>` for values that may or may not be present. Rust has no null — `Option<T>` is the replacement.

**MUST NOT** use `unwrap()` on `Option` without documented justification:

```rust
// CORRECT: Handle absence explicitly
fn find_contract(id: ContractId) -> Option<MurabahaContract> {
    contracts.get(&id).cloned()
}

// Usage — explicitly handle both cases
match find_contract(id) {
    Some(contract) => process(contract),
    None => return Err(AppError::ContractNotFound(id)),
}

// Or with ? after converting to Result
let contract = find_contract(id).ok_or(AppError::ContractNotFound(id))?;

// WRONG: Treat Option like nullable reference
let contract = find_contract(id).unwrap(); // Panics if None!
```

## ? Operator for Error Propagation

**MUST** use the `?` operator for propagating errors up the call stack. The `?` operator:

1. Returns `Err(e)` from the current function if the value is `Err(e)`
2. Returns the inner value if the value is `Ok(v)`
3. Automatically converts error types via `From` trait

```rust
// CORRECT: Clean error propagation with ?
async fn create_murabaha_contract(
    cmd: CreateMurabahaCommand,
) -> Result<ContractId, AppError> {
    let customer = customer_repo.find_by_id(cmd.customer_id).await?; // Propagates RepositoryError
    let contract = MurabahaContract::new(customer, cmd.cost_price, cmd.profit_margin)?; // Propagates DomainError
    contract_repo.save(&contract).await?; // Propagates RepositoryError
    Ok(contract.id)
}

// WRONG: Verbose and error-prone without ?
async fn create_murabaha_contract(
    cmd: CreateMurabahaCommand,
) -> Result<ContractId, AppError> {
    let customer = match customer_repo.find_by_id(cmd.customer_id).await {
        Ok(c) => c,
        Err(e) => return Err(AppError::from(e)),
    };
    // ... repeated for every fallible operation
}
```

## thiserror for Library and Domain Errors

**MUST** use `thiserror` for error types in libraries and domain layers. `thiserror` generates `Display` and `Error` implementations from derive macros.

```rust
// CORRECT: Domain errors with thiserror
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ContractError {
    #[error("cost price must be positive, got {0}")]
    InvalidCostPrice(Decimal),

    #[error("profit margin must be between 0% and 100%, got {0}%")]
    InvalidProfitMargin(Decimal),

    #[error("installment count must be between 1 and 360, got {0}")]
    InvalidInstallmentCount(u32),

    #[error("contract {0} has already been settled")]
    AlreadySettled(ContractId),
}

#[derive(Debug, Error)]
pub enum RepositoryError {
    #[error("record not found: {0}")]
    NotFound(String),

    #[error("database error: {source}")]
    Database {
        #[from]
        source: sqlx::Error,
    },
}
```

**Error enum design guidelines**:

- One error enum per domain or service boundary
- Variants describe the specific failure mode
- `#[error("...")]` messages are human-readable, lowercase, no trailing period
- Use `#[from]` for automatic conversion from underlying errors

## anyhow for Application-Level Errors

**SHOULD** use `anyhow` for application-level error propagation where the specific error type is not important to the caller (e.g., main functions, CLI entry points, top-level handlers).

```rust
// CORRECT: anyhow for application entry point
use anyhow::{Context, Result};

#[tokio::main]
async fn main() -> Result<()> {
    let config = load_config()
        .context("failed to load application configuration")?;

    let db_pool = connect_database(&config.database_url)
        .await
        .context("failed to connect to database")?;

    run_server(config, db_pool)
        .await
        .context("server exited with error")?;

    Ok(())
}

// CORRECT: anyhow::Context adds human-readable context to errors
fn load_config() -> Result<AppConfig> {
    let content = std::fs::read_to_string("config.toml")
        .context("could not read config.toml")?;
    let config: AppConfig = toml::from_str(&content)
        .context("config.toml has invalid format")?;
    Ok(config)
}
```

**When to use thiserror vs anyhow**:

| Context           | Use                                                          |
| ----------------- | ------------------------------------------------------------ |
| Library crate     | `thiserror` — callers need to match specific variants        |
| Domain layer      | `thiserror` — domain errors need specific handling           |
| Application layer | `anyhow` — errors propagate to logs/user, no matching needed |
| CLI main()        | `anyhow` — errors displayed to user                          |
| HTTP handler      | `thiserror` — errors map to HTTP status codes                |

## Custom Error Enums Per Domain

**MUST** define one error enum per domain boundary. Do not use a single catch-all error type across the entire application.

```rust
// CORRECT: Separate error types per domain
pub mod zakat {
    #[derive(Debug, thiserror::Error)]
    pub enum ZakatError {
        #[error("wealth {0} is below nisab threshold {1}")]
        BelowNisab(Decimal, Decimal),
        #[error("invalid zakat rate: {0}")]
        InvalidRate(Decimal),
    }
}

pub mod murabaha {
    #[derive(Debug, thiserror::Error)]
    pub enum MurabahaError {
        #[error("cost price must be positive")]
        InvalidCostPrice,
        #[error("contract not found: {0}")]
        NotFound(ContractId),
    }
}

// WRONG: Single catch-all error type
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("zakat error: {0}")]
    Zakat(String), // Loses type information
    #[error("murabaha error: {0}")]
    Murabaha(String), // Loses type information
}
```

## map_err for Error Conversion

**SHOULD** use `map_err` to convert between error types when `From` is not implemented:

```rust
// CORRECT: map_err for explicit conversion
let amount = input
    .parse::<Decimal>()
    .map_err(|e| ContractError::InvalidAmount(input.to_string(), e.to_string()))?;

// Alternative: From trait for automatic ? conversion
impl From<std::num::ParseIntError> for ContractError {
    fn from(e: std::num::ParseIntError) -> Self {
        ContractError::ParseError(e.to_string())
    }
}
```

## expect() with Descriptive Messages

**SHOULD** use `expect()` with a descriptive message when `unwrap()` is logically justified — but only when the invariant is documented:

```rust
// CORRECT: expect() with documented invariant
// The regex is a compile-time constant and always valid.
static CONTRACT_ID_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^CTR-[0-9]{6}$").expect("CONTRACT_ID_REGEX is a valid pattern"));

// WRONG: expect() as a lazy unwrap()
let value = config.get("key").expect("should be there"); // No invariant stated
```

## Anti-Patterns to Avoid

### Swallowing Errors

**PROHIBITED**: Ignoring errors with `let _ =` or empty catch blocks.

```rust
// WRONG: Error silently ignored
let _ = audit_log.record(event); // What if logging fails?

// CORRECT: Handle or explicitly acknowledge
if let Err(e) = audit_log.record(event) {
    tracing::warn!("Failed to record audit event: {}", e);
    // Decide: should this be fatal?
}
```

### Using Box<dyn Error>

**SHOULD NOT** use `Box<dyn Error>` in domain code — it erases error type information that callers need.

```rust
// WRONG: Erases error type
fn process(input: &str) -> Result<Decimal, Box<dyn std::error::Error>> { ... }

// CORRECT: Typed error
fn process(input: &str) -> Result<Decimal, ParseError> { ... }
```

### Panic in Library Code

**PROHIBITED**: Panics in library functions. Libraries MUST return `Result` for all fallible operations.

```rust
// WRONG: Library panics on unexpected input
pub fn calculate_zakat(wealth: Decimal) -> Decimal {
    if wealth < Decimal::ZERO {
        panic!("wealth cannot be negative"); // Library code must not panic!
    }
    wealth * Decimal::new(25, 3)
}

// CORRECT: Library returns Result
pub fn calculate_zakat(wealth: Decimal) -> Result<Decimal, ZakatError> {
    if wealth < Decimal::ZERO {
        return Err(ZakatError::NegativeWealth(wealth));
    }
    Ok(wealth * Decimal::new(25, 3))
}
```

## Enforcement

- **cargo clippy** with `clippy::unwrap_used` lint catches `unwrap()` usage
- **cargo clippy** with `clippy::expect_used` warns on `expect()` usage
- Code reviews verify error types are appropriately scoped
- Integration tests verify error cases are handled correctly

**Pre-commit checklist**:

- [ ] All fallible functions return `Result<T, E>`
- [ ] No `unwrap()` without documented justification
- [ ] `?` operator used for error propagation
- [ ] `thiserror` used for domain/library errors
- [ ] `anyhow` used for application-level errors
- [ ] Error messages are lowercase, descriptive, no trailing period
- [ ] No `panic!()` in library code

## Related Standards

- [Coding Standards](coding-standards.md) - Idiomatic Rust patterns
- [Type Safety Standards](type-safety-standards.md) - Algebraic types for error modeling
- [API Standards](api-standards.md) - HTTP error response mapping

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
