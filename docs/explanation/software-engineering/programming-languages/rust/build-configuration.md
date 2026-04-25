---
title: "Rust Build Configuration"
description: Authoritative OSE Platform Rust build configuration standards (Cargo.toml, workspaces, profiles, cargo-nextest)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - build-configuration
  - cargo
  - cargo-toml
  - workspaces
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Build Configuration

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative build configuration standards** for Rust development in the OSE Platform. All Rust projects MUST follow these configuration rules for consistency and reproducibility.

**Target Audience**: OSE Platform Rust developers, platform engineers, CI/CD maintainers

**Scope**: Cargo.toml structure, cargo workspaces, Cargo.lock policy, edition declaration, build profiles, build scripts, cargo-nextest

## Software Engineering Principles

### 1. Reproducibility First

Rust build reproducibility requires discipline:

- `Cargo.lock` committed for binaries — exact dependency versions locked
- `rust-toolchain.toml` pins exact compiler version
- `edition = "2021"` explicit in every `Cargo.toml`
- `cargo verify-project` validates configuration in CI

### 2. Explicit Over Implicit

Build configuration MUST be explicit:

- All dependencies declare exact minimum versions
- Feature flags declared explicitly (no implicit default features)
- Release profile settings documented

### 3. Automation Over Manual

Build automation MUST use standard tools:

- Cargo for all build operations
- `cargo-nextest` for faster parallel testing
- CI/CD integration via standard `cargo` commands

## Cargo.toml Structure

### Package Section

**MUST** declare all required package fields:

```toml
[package]
name = "zakat-service"
version = "0.1.0"
edition = "2021"
rust-version = "1.82"
authors = ["OSE Platform Team"]
description = "Zakat calculation service for OSE Platform"
license = "MIT"
repository = "https://github.com/open-sharia-enterprise/ose-platform"
```

**Key fields**:

- `edition = "2021"` — MUST be declared explicitly (never omit)
- `rust-version` — SHOULD declare minimum supported Rust version (MSRV)

### Dependencies

**MUST** organize dependencies by category:

```toml
[dependencies]
# Web framework
axum = { version = "0.8", features = ["macros"] }
tokio = { version = "1", features = ["full"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["trace", "cors"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Database
sqlx = { version = "0.8", features = ["runtime-tokio", "postgres", "uuid", "chrono", "decimal"] }

# Error handling
thiserror = "2"
anyhow = "1"

# Domain
rust_decimal = { version = "1", features = ["serde-with-str"] }
uuid = { version = "1", features = ["v4", "serde"] }

# Observability
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

[dev-dependencies]
# Testing
tokio = { version = "1", features = ["full", "test-util"] }
mockall = "0.13"
proptest = "1"
rstest = "0.23"
axum-test = "15"

[build-dependencies]
# Build scripts (only if needed)
```

### Feature Flags

**SHOULD** use feature flags to make optional dependencies explicit:

```toml
[features]
default = []
postgres = ["sqlx/postgres"]
sqlite = ["sqlx/sqlite"]
metrics = ["prometheus"]
```

```rust
// Usage with feature flag
#[cfg(feature = "metrics")]
fn register_metrics() { ... }
```

## Cargo Workspaces for Monorepo

**MUST** use cargo workspaces when multiple Rust crates exist in the repository.

### Workspace Cargo.toml

```toml
# Cargo.toml at workspace root
[workspace]
members = [
    "crates/zakat-domain",
    "crates/murabaha-domain",
    "crates/api-service",
    "crates/cli",
]
resolver = "2"

# Shared dependency versions across workspace
[workspace.dependencies]
axum = "0.8"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
rust_decimal = "1"
thiserror = "2"

# Shared lint configuration
[workspace.lints.rust]
unsafe_code = "forbid"

[workspace.lints.clippy]
pedantic = "deny"
nursery = "deny"
```

### Member Crate Cargo.toml

**MUST** use `workspace = true` for shared dependencies to avoid version drift:

```toml
# crates/zakat-domain/Cargo.toml
[package]
name = "zakat-domain"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { workspace = true }
rust_decimal = { workspace = true }
thiserror = { workspace = true }

[lints]
workspace = true
```

## Cargo.lock Policy

**MUST** commit `Cargo.lock` for binary crates (applications, CLI tools).

**MUST NOT** commit `Cargo.lock` for library crates (add to `.gitignore`).

**Rationale**: Binary deployments require exact reproducibility. Library crates must work with a range of dependency versions as dictated by downstream consumers.

```gitignore
# .gitignore for library crates
Cargo.lock
```

```gitignore
# .gitignore for binary crates — do NOT ignore Cargo.lock
# (Cargo.lock is intentionally tracked)
target/
```

## rust-toolchain.toml

**MUST** use `rust-toolchain.toml` at the workspace root to pin the exact toolchain version:

```toml
# rust-toolchain.toml
[toolchain]
channel = "1.82.0"
components = ["rustfmt", "clippy", "rust-src"]
targets = ["x86_64-unknown-linux-gnu", "wasm32-unknown-unknown"]
```

## Build Profiles

**MUST** configure release profile for optimized production builds:

```toml
# Cargo.toml (workspace)
[profile.release]
opt-level = 3
lto = "thin"          # Link-Time Optimization (reduces binary size, improves performance)
codegen-units = 1     # Single codegen unit for better optimization
panic = "abort"       # Smaller binary (no unwinding tables)
strip = true          # Strip debug symbols from binary

[profile.dev]
opt-level = 0
debug = true

[profile.test]
opt-level = 1         # Slightly optimized for faster test execution

# Custom profile for CI (faster than release, more optimized than dev)
[profile.ci]
inherits = "dev"
opt-level = 1
```

## Build Scripts (build.rs)

**SHOULD** use build scripts only when necessary (code generation, linking to C libraries).

**MUST** keep build scripts minimal and document their purpose:

```rust
// build.rs — Only if required for code generation or C linking
fn main() {
    // Re-run if proto files change
    println!("cargo:rerun-if-changed=proto/");
    // Compile protobuf definitions
    prost_build::compile_protos(&["proto/zakat.proto"], &["proto/"]).unwrap();
}
```

## cargo-nextest for Faster Tests

**SHOULD** use `cargo-nextest` for significantly faster parallel test execution in CI:

```bash
# Install
cargo install cargo-nextest

# Run tests with nextest (faster than cargo test)
cargo nextest run

# Run with specific profile
cargo nextest run --profile ci
```

**Configure in `.config/nextest.toml`**:

```toml
# .config/nextest.toml
[profile.default]
fail-fast = false
retries = 0

[profile.ci]
fail-fast = true
retries = 1
```

## Enforcement

**CI Pipeline (REQUIRED)**:

```bash
# Verify Cargo.toml is valid
cargo verify-project

# Check formatting
cargo fmt --all -- --check

# Build all targets
cargo build --all-targets --all-features

# Run tests (use nextest in CI)
cargo nextest run --all-features

# Check for security vulnerabilities
cargo audit

# Enforce dependency policies
cargo deny check
```

**Pre-commit checklist**:

- [ ] `edition = "2021"` declared in all `Cargo.toml` files
- [ ] `rust-toolchain.toml` present at workspace root
- [ ] `Cargo.lock` committed for binary crates, gitignored for libraries
- [ ] Workspace dependencies use `workspace = true`
- [ ] Release profile configured with LTO
- [ ] `cargo verify-project` passes

## Related Standards

- [Code Quality Standards](code-quality-standards.md) - rustfmt, Clippy configuration
- [Security Standards](security-standards.md) - cargo audit integration
- [Testing Standards](testing-standards.md) - cargo-nextest usage

## Related Documentation

**Software Engineering Principles**:

- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
