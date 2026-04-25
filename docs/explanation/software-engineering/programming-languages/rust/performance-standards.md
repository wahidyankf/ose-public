---
title: "Rust Performance Standards"
description: Authoritative OSE Platform Rust performance standards (zero-cost abstractions, benchmarks, profiling, allocations)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - performance
  - profiling
  - benchmarks
  - zero-cost-abstractions
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Performance Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative performance standards** for Rust development in the OSE Platform. Rust's defining characteristic is "zero-cost abstractions" — high-level code compiles to the same machine code as hand-written C.

**Target Audience**: OSE Platform Rust developers, performance engineers

**Scope**: Zero-cost abstractions, criterion.rs benchmarking, profiling, allocation patterns, iterator usage

## Software Engineering Principles

### 1. Pure Functions Over Side Effects

Pure functions are the foundation of Rust performance:

- Pure iterator pipelines compile to optimal loops (no overhead)
- Immutable data enables compiler optimizations (no aliasing)
- Side-effect-free code is easier to profile and optimize

### 2. Automation Over Manual

Performance validation MUST be automated:

- Criterion.rs benchmarks run in CI to detect regressions
- `cargo-flamegraph` automates profiling workflow
- LTO configured in Cargo.toml (not manual linker invocation)

### 3. Explicit Over Implicit

Performance-sensitive decisions MUST be explicit:

- Heap allocations via `Box<T>`, `Vec<T>`, `String` — explicit
- Stack allocation via values and arrays — explicit
- `clone()` calls are visible in code — explicit
- `unsafe` SIMD is always explicit

## Zero-Cost Abstractions Principle

Rust's iterator combinators compile to the same code as hand-written loops. This is the "zero-cost abstractions" guarantee.

```rust
// These two produce IDENTICAL machine code:

// High-level: iterator pipeline
let total: Decimal = transactions
    .iter()
    .filter(|t| t.is_eligible())
    .map(|t| t.zakat_amount)
    .sum();

// Low-level: manual loop
let mut total = Decimal::ZERO;
for t in &transactions {
    if t.is_eligible() {
        total += t.zakat_amount;
    }
}

// ALWAYS prefer the high-level version — same performance, more readable
```

**Prefer iterator combinators** because:

- Zero runtime overhead (compiled to same code)
- Compiler can apply additional optimizations (SIMD, loop unrolling)
- More readable and composable
- No mutation of intermediate state

## criterion.rs for Benchmarking

**SHOULD** use `criterion.rs` for all performance benchmarks. Criterion provides statistically rigorous measurements.

```toml
# Cargo.toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "zakat_calculation"
harness = false
```

```rust
// benches/zakat_calculation.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use rust_decimal_macros::dec;

fn benchmark_calculate_zakat(c: &mut Criterion) {
    let wealth = dec!(100_000);
    let nisab = dec!(5_000);

    c.bench_function("calculate_zakat", |b| {
        b.iter(|| {
            // black_box prevents compiler from optimizing away the computation
            calculate_zakat(black_box(wealth), black_box(nisab))
        })
    });
}

fn benchmark_portfolio_zakat(c: &mut Criterion) {
    let portfolios: Vec<Portfolio> = (0..1000).map(|_| generate_portfolio()).collect();

    c.bench_function("portfolio_zakat_1000", |b| {
        b.iter(|| {
            portfolios
                .iter()
                .map(|p| calculate_zakat_for_portfolio(black_box(p)))
                .collect::<Vec<_>>()
        })
    });
}

criterion_group!(benches, benchmark_calculate_zakat, benchmark_portfolio_zakat);
criterion_main!(benches);
```

**Run benchmarks**:

```bash
cargo bench
# View HTML report
open target/criterion/report/index.html
```

## Profiling with cargo-flamegraph

**SHOULD** use `cargo-flamegraph` for CPU profiling:

```bash
# Install
cargo install flamegraph

# Profile a binary
cargo flamegraph --bin zakat-service -- --bench-mode

# Profile a specific test
cargo flamegraph --test integration_tests -- zakat_batch_processing

# View result
open flamegraph.svg
```

**SHOULD** use `perf` + `cargo-perf` for Linux profiling:

```bash
cargo install cargo-perf
cargo perf record --bin zakat-service
cargo perf report
```

## Avoid Unnecessary Allocations

### Use Slices Instead of Owned Collections

**SHOULD** accept `&[T]` instead of `Vec<T>` and `&str` instead of `String` in function parameters:

```rust
// CORRECT: Borrow slices — works with Vec, arrays, and slices without allocation
fn calculate_total_zakat(amounts: &[Decimal]) -> Decimal {
    amounts.iter().sum()
}

// Callers can pass Vec, array, or slice without extra allocation
calculate_total_zakat(&my_vec);
calculate_total_zakat(&[dec!(1000), dec!(2000)]);

// WRONG: Requires Vec allocation at call site
fn calculate_total_zakat(amounts: Vec<Decimal>) -> Decimal {
    amounts.iter().sum()
}
```

### Cow<str> for Maybe-Owned Strings

**SHOULD** use `Cow<str>` when a function sometimes needs to allocate and sometimes can borrow:

```rust
use std::borrow::Cow;

// CORRECT: Zero allocation when input is already valid
fn normalize_contract_id(id: &str) -> Cow<str> {
    if id.chars().all(|c| c.is_ascii_uppercase()) {
        Cow::Borrowed(id) // No allocation
    } else {
        Cow::Owned(id.to_ascii_uppercase()) // Allocate only when needed
    }
}
```

### Pre-allocate Vectors When Size Is Known

**MUST** use `Vec::with_capacity` when the output size is known in advance:

```rust
// CORRECT: Single allocation
let mut results = Vec::with_capacity(transactions.len());
for transaction in &transactions {
    results.push(process(transaction));
}

// WRONG: Multiple re-allocations as vector grows
let mut results = Vec::new(); // Starts empty, reallocates ~log(n) times
for transaction in &transactions {
    results.push(process(transaction));
}
```

### Use String::with_capacity for String Building

**SHOULD** use `String::with_capacity` or `format!` for string construction:

```rust
// CORRECT: Pre-allocated string building
let mut report = String::with_capacity(1024);
report.push_str("Zakat Report\n");
report.push_str(&format!("Total: {}\n", total_zakat));

// Or use format! for simple cases (one allocation)
let report = format!("Zakat Report\nTotal: {}", total_zakat);

// WRONG: Multiple small allocations via concatenation
let report = "Zakat Report\n".to_string() + "Total: " + &total_zakat.to_string() + "\n";
```

## Iterator Combinators vs Collect

**SHOULD** avoid intermediate `collect()` calls when the result is consumed immediately:

```rust
// CORRECT: Chained iterators, single allocation at end
let eligible_total: Decimal = transactions
    .iter()
    .filter(|t| t.is_eligible())
    .map(|t| t.zakat_amount)
    .sum(); // Never allocates a Vec

// WRONG: Intermediate collection wastes allocation
let eligible: Vec<_> = transactions
    .iter()
    .filter(|t| t.is_eligible())
    .collect(); // Unnecessary Vec allocation

let total: Decimal = eligible
    .iter()
    .map(|t| t.zakat_amount)
    .sum();
```

## LTO for Release Builds

**MUST** enable Link-Time Optimization in release profile (see [Build Configuration Standards](build-configuration.md)):

```toml
[profile.release]
lto = "thin"          # Significant performance improvement
codegen-units = 1     # Better optimization (slower compile)
opt-level = 3
```

## Profile-Guided Optimization (PGO)

**MAY** use PGO for maximum performance on known workloads:

```bash
# Step 1: Instrument build
RUSTFLAGS="-Cprofile-generate=/tmp/pgo-data" cargo build --release

# Step 2: Run representative workload
./target/release/zakat-service --run-benchmark

# Step 3: Merge profile data
llvm-profdata merge -o /tmp/pgo-data/merged.profdata /tmp/pgo-data

# Step 4: Optimized build using profile
RUSTFLAGS="-Cprofile-use=/tmp/pgo-data/merged.profdata" cargo build --release
```

## Enforcement

**Automated**:

- Criterion benchmarks run in CI to detect performance regressions
- Release profile with LTO in `Cargo.toml` (enforced via code review)
- `cargo clippy` detects `clone()` on large types (`clippy::clone_on_ref_ptr`)

**Pre-commit checklist**:

- [ ] Iterator combinators used (not manual loops for transformations)
- [ ] No `collect()` when result is only iterated
- [ ] `Vec::with_capacity` used when size is known
- [ ] `&[T]` / `&str` accepted in function parameters (not owned types)
- [ ] `clone()` only where required by ownership rules
- [ ] Release profile has LTO configured

## Related Standards

- [Concurrency Standards](concurrency-standards.md) - Rayon for data parallelism
- [Memory Management Standards](memory-management-standards.md) - Smart pointer costs
- [Build Configuration](build-configuration.md) - Release profile settings

## Related Documentation

**Software Engineering Principles**:

- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
