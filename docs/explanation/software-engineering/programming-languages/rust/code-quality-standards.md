---
title: "Rust Code Quality Standards"
description: Authoritative OSE Platform Rust code quality standards (rustfmt, Clippy, cargo audit, unsafe policy)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - code-quality
  - clippy
  - rustfmt
  - cargo-audit
  - unsafe
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Code Quality Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative code quality standards** for Rust development in the OSE Platform. All Rust projects MUST meet these quality requirements before code review approval.

**Target Audience**: OSE Platform Rust developers, CI/CD pipeline maintainers, technical reviewers

**Scope**: rustfmt configuration, Clippy lint set, cargo audit, cargo deny, unsafe code policy

## Software Engineering Principles

### 1. Automation Over Manual

Quality enforcement MUST be automated:

- rustfmt runs on pre-commit (never manual formatting decisions)
- Clippy runs in CI with `--deny warnings` (zero tolerance for lint warnings)
- cargo audit runs in CI on every push (automated CVE detection)
- cargo deny runs in CI (automated license and policy enforcement)

### 2. Explicit Over Implicit

Quality standards are explicit:

- `.rustfmt.toml` documents all formatting decisions
- `deny.toml` documents all dependency policies
- `unsafe` blocks document SAFETY invariants inline

### 3. Immutability Over Mutability

Clippy's `clippy::pedantic` lint group catches unnecessary mutation:

- `clippy::needless_pass_by_value` — suggests borrowing where ownership not needed
- `clippy::redundant_closure` — detects closures that wrap functions

## rustfmt Configuration

**MUST** use rustfmt for all Rust code. rustfmt is non-negotiable — all formatting disputes are resolved by the formatter.

**MUST** configure rustfmt via `.rustfmt.toml` at the workspace root:

```toml
# .rustfmt.toml
edition = "2021"
max_width = 100
use_small_heuristics = "Default"
reorder_imports = true
reorder_modules = true
imports_granularity = "Module"
group_imports = "StdExternalCrate"
```

**Enforce on pre-commit**:

```bash
# Check formatting (used in CI)
cargo fmt --all -- --check

# Apply formatting (used in pre-commit hook)
cargo fmt --all
```

**MUST NOT** use `#[rustfmt::skip]` except for macro invocations or alignment-critical code with a documented justification.

## Clippy Configuration

**MUST** run Clippy with at minimum the `clippy::pedantic` lint group. All warnings are treated as errors in CI.

### Minimum Clippy Invocation

```bash
# CI invocation — denies all warnings
cargo clippy --all-targets --all-features -- \
  -D warnings \
  -D clippy::pedantic \
  -D clippy::nursery \
  -A clippy::module_name_repetitions \
  -A clippy::must_use_candidate
```

### Workspace-Level Clippy Configuration

**SHOULD** configure Clippy in `Cargo.toml` at the workspace level:

```toml
# Cargo.toml (workspace)
[workspace.lints.clippy]
pedantic = "deny"
nursery = "deny"
# Commonly relaxed pedantic lints
module_name_repetitions = "allow"
must_use_candidate = "allow"
missing_errors_doc = "warn"
missing_panics_doc = "warn"
```

### Key Clippy Lints (MUST address)

| Lint                         | Severity | Description                                |
| ---------------------------- | -------- | ------------------------------------------ |
| `clippy::unwrap_used`        | DENY     | Forbid `unwrap()` in production code       |
| `clippy::expect_used`        | WARN     | Warn on `expect()` — document invariant    |
| `clippy::panic`              | DENY     | Forbid panic in library code               |
| `clippy::indexing_slicing`   | WARN     | Prefer `get()` over direct indexing        |
| `clippy::integer_arithmetic` | WARN     | Prefer checked arithmetic in domain logic  |
| `clippy::float_arithmetic`   | DENY     | Forbid float in financial calculations     |
| `clippy::clone_on_ref_ptr`   | DENY     | Explicit `Arc::clone(&x)` over `x.clone()` |

### Suppressing Lints (Requires Justification)

**MUST** document the reason when suppressing a lint:

```rust
// CORRECT: Documented suppression
// The complexity here is inherent to the validation algorithm.
// Extracting sub-functions would obscure the logical flow.
#[allow(clippy::cognitive_complexity)]
fn validate_murabaha_contract(contract: &MurabahaContract) -> Result<(), Vec<ValidationError>> {
    ...
}

// WRONG: Silent suppression without reason
#[allow(clippy::too_many_arguments)]
fn process_contract(...) { ... }
```

## deny(warnings) in CI

**MUST** compile with `-D warnings` in CI environments.

```bash
# CI build command
RUSTFLAGS="-D warnings" cargo build --all-targets --all-features
```

**MUST** configure in workspace `Cargo.toml` for local development:

```toml
# Cargo.toml
[profile.dev]
# Warnings become errors in development too
# (can be relaxed during active prototyping)
```

## cargo audit for Security Vulnerabilities

**MUST** run `cargo audit` in CI to detect known CVEs in dependencies.

```bash
# Install
cargo install cargo-audit

# Run audit
cargo audit

# Fail CI on any vulnerability
cargo audit --deny warnings
```

**MUST** configure `audit.toml` to manage known/accepted advisories:

```toml
# audit.toml
[advisories]
# Example: ignore a specific advisory with justification
ignore = [
    # RUSTSEC-2021-0001: vulnerability in foo crate
    # Status: No fix available; mitigated by [describe mitigation]
    # Review due: 2026-06-01
    "RUSTSEC-2021-0001",
]
```

## cargo deny for Dependency Policy

**MUST** configure `cargo deny` with a `deny.toml` file at the workspace root to enforce:

- License allowlist (only approved licenses)
- Banned crates
- Duplicate version limits

```toml
# deny.toml
[licenses]
allow = [
    "MIT",
    "Apache-2.0",
    "Apache-2.0 WITH LLVM-exception",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "Unicode-DFS-2016",
]
deny = [
    "GPL-2.0",
    "GPL-3.0",
    "LGPL-2.0",
    "LGPL-2.1",
]

[bans]
multiple-versions = "warn"
deny = [
    # Use rustls instead
    { name = "openssl" },
    { name = "openssl-sys" },
]

[advisories]
db-path = "~/.cargo/advisory-db"
db-urls = ["https://github.com/rustsec/advisory-db"]
```

## Unsafe Code Policy

**MUST** apply `#![forbid(unsafe_code)]` to all application crates. Unsafe code is only permitted in infrastructure crates with documented justification.

```rust
// CORRECT: Application code forbids unsafe
#![forbid(unsafe_code)]

// lib.rs for application crate
pub mod domain;
pub mod application;
pub mod infrastructure;
```

**MUST** include a `// SAFETY:` comment on every `unsafe` block in infrastructure crates:

```rust
// CORRECT: Documented unsafe block
// SAFETY: The pointer is non-null and aligned because it was returned
// by Box::into_raw() on line 42, and has not been aliased since.
let value = unsafe { Box::from_raw(ptr) };

// WRONG: Undocumented unsafe block
let value = unsafe { Box::from_raw(ptr) }; // No SAFETY comment
```

**MUST** use `unsafe` in the narrowest possible scope:

```rust
// CORRECT: Minimal unsafe scope
let result = {
    // SAFETY: ptr is guaranteed valid for the lifetime of this block
    let ptr_value = unsafe { *ptr };
    ptr_value * 2 // Safe arithmetic outside unsafe block
};

// WRONG: Unnecessary expansion of unsafe scope
let result = unsafe {
    let ptr_value = *ptr;
    ptr_value * 2 // Arithmetic does not need to be unsafe
};
```

## Enforcement

**CI Pipeline (REQUIRED)**:

```yaml
# Required CI steps for all Rust projects
- cargo fmt --all -- --check
- RUSTFLAGS="-D warnings" cargo build --all-targets
- cargo clippy --all-targets -- -D warnings -D clippy::pedantic
- cargo test --all-targets
- cargo audit
- cargo deny check
```

**Pre-commit checklist**:

- [ ] `cargo fmt` applied (no formatting changes)
- [ ] `cargo clippy` passes with zero warnings
- [ ] No `unsafe` blocks without `// SAFETY:` comments
- [ ] No `#[allow(...)]` without documented reason
- [ ] `cargo audit` passes (no known vulnerabilities)
- [ ] No banned licenses or crates (cargo deny)

## Related Standards

- [Security Standards](security-standards.md) - cargo audit, secrets management
- [Build Configuration](build-configuration.md) - Cargo.toml, CI integration
- [Coding Standards](coding-standards.md) - Naming and idioms

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
