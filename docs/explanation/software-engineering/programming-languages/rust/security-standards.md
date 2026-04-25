---
title: "Rust Security Standards"
description: Authoritative OSE Platform Rust security standards (memory safety, cargo audit, secrecy crate, safe code)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - security
  - input-validation
  - safe-code
  - cargo-audit
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Security Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative security standards** for Rust development in the OSE Platform. Rust's memory safety model eliminates entire classes of vulnerabilities that affect C/C++ and other languages.

**Target Audience**: OSE Platform Rust developers, security reviewers

**Scope**: Memory safety, input validation, cargo audit, secrets management, safe code policy, cryptography

## Software Engineering Principles

### 1. Immutability Over Mutability (Security Through Design)

Rust's ownership system eliminates entire vulnerability classes at compile time:

- No buffer overflows (bounds-checked slices)
- No use-after-free (ownership prevents dangling references)
- No double-free (ownership system enforces single deallocation)
- No data races (Send/Sync prevent concurrent data corruption)

These are not mitigations — they are compiler-enforced guarantees.

### 2. Explicit Over Implicit

Security-sensitive operations MUST be explicit:

- `unsafe` blocks are visually prominent
- Secret values require explicit `secrecy::Secret<T>` wrapping
- Input validation MUST be explicit at domain boundaries
- Cryptographic operations use typed APIs (not raw bytes)

### 3. Automation Over Manual

Security enforcement MUST be automated:

- `cargo audit` in CI detects CVEs automatically
- `cargo deny` enforces approved dependency licenses
- Clippy lints detect common security anti-patterns
- The compiler eliminates memory safety vulnerabilities automatically

## Memory Safety by Design

Rust provides memory safety without a garbage collector:

**Eliminated vulnerability classes** (compile-time guarantees):

- Buffer overflows and buffer over-reads
- Use-after-free vulnerabilities
- Double-free errors
- Null pointer dereferences
- Data races in concurrent code

```rust
// CORRECT: Rust prevents out-of-bounds access
fn get_transaction(transactions: &[Transaction], index: usize) -> Option<&Transaction> {
    transactions.get(index) // Returns None if out of bounds — no buffer overflow
}

// The following would COMPILE ERROR in safe Rust:
// let x = transactions[usize::MAX]; // Bounds-checked, panics — never reads arbitrary memory
```

## Input Validation

**MUST** validate all external input at system boundaries (HTTP handlers, CLI args, file parsing).

**MUST** use domain types to make invalid states unrepresentable (see [Type Safety Standards](type-safety-standards.md)):

```rust
// CORRECT: Validate at the boundary, use typed values internally
#[derive(Debug)]
struct NisabAmount(Decimal);

impl NisabAmount {
    pub fn new(amount: Decimal) -> Result<Self, ValidationError> {
        if amount <= Decimal::ZERO {
            return Err(ValidationError::NegativeNisab(amount));
        }
        if amount > Decimal::new(1_000_000, 0) {
            return Err(ValidationError::NisabTooLarge(amount));
        }
        Ok(NisabAmount(amount))
    }
}

// Axum handler validates input at boundary
async fn create_zakat_obligation(
    Json(payload): Json<CreateZakatRequest>,
) -> Result<Json<ZakatResponse>, AppError> {
    let nisab = NisabAmount::new(payload.nisab_amount)?; // Validates here
    let wealth = WealthAmount::new(payload.wealth_amount)?; // Validates here
    // Internal code only receives validated types
    let zakat = calculate_zakat(wealth, nisab);
    Ok(Json(ZakatResponse { zakat_amount: zakat.0 }))
}
```

**SHOULD** use the `validator` crate for struct-level validation:

```rust
use validator::{Validate, ValidationError};

#[derive(Debug, Deserialize, Validate)]
struct CreateContractRequest {
    #[validate(range(min = 1, max = 360))]
    installments: u32,

    #[validate(range(min = 0.0, max = 100.0))]
    profit_margin_percent: f64,

    #[validate(length(min = 1, max = 100))]
    customer_name: String,
}

async fn create_contract(
    Json(payload): Json<CreateContractRequest>,
) -> Result<Json<ContractResponse>, AppError> {
    payload.validate()?; // Validates all constraints
    // ... proceed with validated data
}
```

## cargo audit for CVE Checking

**MUST** run `cargo audit` in CI to detect known security vulnerabilities in dependencies.

```bash
# Install
cargo install cargo-audit

# Run audit (fails on any unfixed advisory)
cargo audit

# Audit with specific deny level
cargo audit --deny warnings

# Generate machine-readable output
cargo audit --json
```

**MUST** review and act on RUSTSEC advisories:

```toml
# audit.toml — Document all ignored advisories with justification
[advisories]
ignore = [
    # RUSTSEC-2023-0001: vulnerability in foo crate — no patch available
    # Mitigated by: feature flag disabled, code path not reachable in our usage
    # Review due: 2026-06-01 — upgrade when patch is released
    "RUSTSEC-2023-0001",
]
```

## Secrets Management with secrecy

**MUST** use the `secrecy` crate to wrap sensitive values. The `secrecy::Secret<T>` type:

- Prevents accidental logging (does not implement `Display`)
- Zeros memory on drop (prevents memory dumps exposing secrets)
- Makes sensitive values explicit in the type system

```rust
use secrecy::{Secret, ExposeSecret};

// CORRECT: API keys and secrets wrapped in Secret<T>
struct AppConfig {
    database_url: Secret<String>,
    jwt_secret: Secret<String>,
    api_key: Secret<String>,
}

fn connect_database(url: &Secret<String>) -> Pool {
    // Must explicitly expose the secret to use it
    Pool::connect(url.expose_secret())
}

// WRONG: Raw string secret — logged accidentally, visible in memory
struct AppConfig {
    database_url: String, // Appears in Debug output, logs, memory dumps!
    jwt_secret: String,
}
```

**MUST NOT** log secrets — the `Secret<T>` type prevents this by design:

```rust
// CORRECT: Secret<T> does not implement Display or Debug — logging fails to compile
tracing::info!("Connecting to: {:?}", config.database_url); // COMPILE ERROR

// To log a non-sensitive portion:
tracing::info!("Connecting to database (url hidden)");

// WRONG: Directly logging raw secret
tracing::info!("Connecting to: {}", config.database_url); // Leaks secret to logs!
```

## SQLx Compile-Time SQL Validation

**MUST** use SQLx's compile-time query checking to prevent SQL injection and detect schema changes:

```rust
// CORRECT: Compile-time verified SQL — injection impossible
async fn find_contract(pool: &PgPool, id: Uuid) -> Result<MurabahaContract, sqlx::Error> {
    sqlx::query_as!(
        MurabahaContract,
        "SELECT id, customer_id, cost_price, profit_margin FROM murabaha_contracts WHERE id = $1",
        id
    )
    .fetch_one(pool)
    .await
}

// WRONG: String interpolation — SQL injection vulnerability
async fn find_contract_unsafe(pool: &PgPool, id: &str) -> Result<MurabahaContract, sqlx::Error> {
    let query = format!("SELECT * FROM contracts WHERE id = '{}'", id); // SQL injection!
    sqlx::query_as::<_, MurabahaContract>(&query)
        .fetch_one(pool)
        .await
}
```

## Avoid Unsafe Code

**MUST** apply `#![forbid(unsafe_code)]` to all application crates.

**MUST** document all `unsafe` blocks with `// SAFETY:` comments in infrastructure crates (see [Code Quality Standards](code-quality-standards.md)).

When working with external C libraries via FFI:

```rust
// CORRECT: FFI with documented safety
/// Wraps the `libsodium_init()` C function.
///
/// # Safety
///
/// Must be called before any other libsodium functions.
/// Safe to call multiple times — subsequent calls are no-ops.
pub fn init_crypto() -> bool {
    // SAFETY: libsodium_init is safe to call at any point and is idempotent
    let result = unsafe { libsodium_sys::sodium_init() };
    result >= 0
}
```

## Cryptography Standards

**MUST** use `ring` or `rustls` for cryptography — NOT raw OpenSSL bindings.

**MUST NOT** implement cryptographic primitives manually.

```rust
// CORRECT: Use ring for hashing
use ring::digest;

fn hash_contract_data(data: &[u8]) -> Vec<u8> {
    let digest = digest::digest(&digest::SHA256, data);
    digest.as_ref().to_vec()
}

// CORRECT: Use jsonwebtoken for JWT
use jsonwebtoken::{encode, decode, Header, Algorithm, Validation, EncodingKey, DecodingKey};

fn create_session_token(user_id: Uuid, secret: &Secret<String>) -> Result<String, JwtError> {
    let claims = SessionClaims { sub: user_id, exp: expiry_timestamp() };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.expose_secret().as_bytes()),
    ).map_err(JwtError::from)
}

// WRONG: Direct OpenSSL bindings (prefer ring or rustls)
use openssl::hash::{MessageDigest, hash}; // Avoid direct OpenSSL
```

**MUST** use `rustls` instead of OpenSSL for TLS:

```toml
# Cargo.toml — Use rustls feature flags
axum = { version = "0.8" }
tokio-rustls = "0.26"
rustls = "0.23"

# Disable OpenSSL in dependencies
[features]
default = ["rustls"]
```

## Enforcement

**Automated**:

- `#![forbid(unsafe_code)]` enforced at compile time for application crates
- `cargo audit` in CI (fails on any unfixed vulnerability)
- `cargo deny` enforces license and banned crate policies
- SQLx compile-time query checking prevents SQL injection
- Clippy detects common security anti-patterns

**Pre-commit checklist**:

- [ ] All external input validated at domain boundaries
- [ ] Secrets wrapped in `secrecy::Secret<T>`
- [ ] No direct OpenSSL usage (use ring or rustls)
- [ ] No manual cryptographic implementations
- [ ] SQLx queries use `query!` or `query_as!` macros (compile-time safe)
- [ ] `#![forbid(unsafe_code)]` in application crates
- [ ] `cargo audit` passes

## Related Standards

- [Code Quality Standards](code-quality-standards.md) - Unsafe code policy
- [Build Configuration](build-configuration.md) - cargo deny configuration
- [Error Handling Standards](error-handling-standards.md) - Handling validation errors
- [Type Safety Standards](type-safety-standards.md) - Making invalid states unrepresentable

## Related Documentation

**Software Engineering Principles**:

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
