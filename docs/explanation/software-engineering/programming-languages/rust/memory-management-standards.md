---
title: "Rust Memory Management Standards"
description: Authoritative OSE Platform Rust memory management standards (ownership, borrowing, lifetimes, smart pointers)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - memory-management
  - ownership
  - borrowing
  - lifetimes
  - smart-pointers
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Memory Management Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative memory management standards** for Rust development in the OSE Platform. Rust's ownership system is its most distinctive feature — it provides memory safety without a garbage collector, with zero runtime overhead.

**Target Audience**: OSE Platform Rust developers, especially those transitioning from GC languages

**Scope**: Ownership rules, borrowing, lifetime annotations, smart pointers, RAII, Pin/Unpin

## Software Engineering Principles

### 1. Immutability Over Mutability (The Foundation of Rust Memory Safety)

Rust's ownership system enforces immutability as the default:

- Ownership: each value has exactly one owner
- Shared references (`&T`): multiple readers, zero writers
- Exclusive references (`&mut T`): one writer, zero readers
- These rules eliminate data races and use-after-free at compile time

### 2. Explicit Over Implicit

Memory management decisions MUST be explicit in Rust:

- `Box<T>` for heap allocation — explicit
- `Arc<T>` for reference-counted sharing — explicit
- `clone()` for copying data — visible in code
- Lifetime annotations when needed — explicit
- No garbage collector — deallocation is deterministic (RAII)

### 3. Automation Over Manual

The compiler automates memory management:

- Deallocation happens automatically at end of scope (Drop trait)
- The borrow checker prevents all memory errors at compile time
- No manual `free()`, no finalizers with uncertain timing

## Ownership Rules

Ownership, move semantics, and cloning are taught in AyoKoding Rust By Example: [Example 8: Ownership Basics](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner.md#example-8-ownership-basics), [Example 9: Move Semantics](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner.md#example-9-move-semantics), and [Example 10: Clone for Deep Copy](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner.md#example-10-clone-for-deep-copy).

## Borrowing Rules

**MUST** borrow data (`&T` or `&mut T`) when ownership transfer is not needed:

```rust
// CORRECT: Borrow when the function only needs to read
fn log_contract(contract: &MurabahaContract) {
    tracing::info!("Contract: {:?}", contract);
    // contract is borrowed, not moved — caller retains ownership
}

// CORRECT: Mutable borrow when the function needs to mutate
fn activate_contract(contract: &mut MurabahaContract) -> Result<(), ContractError> {
    contract.activate()
}

// WRONG: Taking ownership when borrowing suffices (forces caller to clone)
fn log_contract(contract: MurabahaContract) { // Takes ownership unnecessarily!
    tracing::info!("Contract: {:?}", contract);
    // contract is dropped here — caller lost it!
}
```

The borrow rules the compiler enforces are taught in AyoKoding Rust By Example: [Example 11: References and Borrowing](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner.md#example-11-references-and-borrowing), [Example 12: Mutable References](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner.md#example-12-mutable-references), and [Example 13: Borrowing Rules](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/beginner.md#example-13-borrowing-rules).

## Lifetime Annotations

**MUST** add lifetime annotations when the compiler cannot infer how long references live. Most functions do not need explicit lifetimes (lifetime elision handles common cases).

When annotations are required, how elision works, and how structs hold references are taught in AyoKoding Rust By Example: [Example 29: Lifetime Annotations Basics](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/intermediate.md#example-29-lifetime-annotations-basics), [Example 30: Lifetime Elision Rules](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/intermediate.md#example-30-lifetime-elision-rules), and [Example 31: Struct Lifetimes](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/intermediate.md#example-31-struct-lifetimes).

**Avoid lifetime explosion**:

```rust
// WRONG: Over-annotated — elision handles this
fn get_name<'a>(contract: &'a MurabahaContract) -> &'a str {
    &contract.customer_name
}

// CORRECT: Compiler infers the lifetime
fn get_name(contract: &MurabahaContract) -> &str {
    &contract.customer_name
}
```

## Smart Pointers

### Box<T> — Heap Allocation

**SHOULD** use `Box<T>` for:

- Recursive types (cannot be stack-allocated)
- Trait objects (`Box<dyn Trait>`)
- Large values that should not be stack-allocated

```rust
// CORRECT: Box for recursive type
enum FinancialTree {
    Leaf(Money),
    Node {
        value: Money,
        left: Box<FinancialTree>,  // Must be Box — recursive
        right: Box<FinancialTree>,
    },
}

// CORRECT: Box<dyn Trait> for dynamic dispatch
fn get_calculator(use_simple: bool) -> Box<dyn ZakatCalculator> {
    if use_simple {
        Box::new(SimpleZakatCalculator)
    } else {
        Box::new(AdvancedZakatCalculator)
    }
}
```

### Rc<T> — Single-Threaded Reference Counting

**SHOULD** use `Rc<T>` only in single-threaded contexts where multiple ownership is needed.

**MUST NOT** use `Rc<T>` in multi-threaded or async contexts (use `Arc<T>` instead).

```rust
use std::rc::Rc;

// CORRECT: Rc for single-threaded shared ownership
fn build_contract_graph(contracts: &[MurabahaContract]) -> Vec<Rc<ContractNode>> {
    let nodes: Vec<_> = contracts.iter().map(|c| Rc::new(ContractNode::new(c))).collect();
    // Multiple nodes can reference the same parent
    nodes
}
```

### Arc<T> — Multi-Threaded Reference Counting

**MUST** use `Arc<T>` (not `Rc<T>`) for shared ownership across threads or async tasks. See [Concurrency Standards](concurrency-standards.md).

```rust
use std::sync::Arc;

// CORRECT: Arc for shared ownership across async tasks
let shared_config = Arc::new(AppConfig::load()?);
let config_clone = Arc::clone(&shared_config); // Explicit clone — cheap atomic increment
tokio::spawn(async move {
    use_config(&config_clone).await;
});
```

### RefCell<T> — Interior Mutability (Single-Threaded)

**SHOULD** use `RefCell<T>` sparingly for interior mutability in single-threaded contexts. Panics at runtime if borrow rules are violated.

```rust
use std::cell::RefCell;

// ACCEPTABLE: RefCell when ownership structure prevents normal borrowing
struct ContractCache {
    contracts: RefCell<HashMap<ContractId, MurabahaContract>>,
}

impl ContractCache {
    fn get(&self, id: ContractId) -> Option<MurabahaContract> {
        self.contracts.borrow().get(&id).cloned()
    }

    fn insert(&self, contract: MurabahaContract) {
        self.contracts.borrow_mut().insert(contract.id(), contract);
    }
}
```

## RAII Pattern (Drop Trait)

Rust uses RAII (Resource Acquisition Is Initialization) — resources are freed when their owner is dropped. **MUST** implement the `Drop` trait for types that hold external resources.

```rust
// CORRECT: Drop trait for resource cleanup
struct DatabaseConnection {
    connection: Option<PgConnection>,
}

impl Drop for DatabaseConnection {
    fn drop(&mut self) {
        if let Some(conn) = self.connection.take() {
            // Ensure connection is properly closed
            let _ = conn.close();
            tracing::debug!("Database connection closed");
        }
    }
}

// Connection is automatically closed when this goes out of scope:
{
    let conn = DatabaseConnection::new()?;
    // ... use conn ...
} // conn.drop() called here automatically — no explicit close needed
```

## Pin<T> and Unpin for Async

**SHOULD** understand `Pin<T>` when working with async/await and self-referential types. Most async code does not need to use `Pin` directly — the compiler handles it.

What `Pin` and `Unpin` guarantee, and when pinning (including `Box::pin`) is required, are taught in [AyoKoding Rust By Example, Example 71: Pin and Unpin](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/rust/by-example/advanced.md#example-71-pin-and-unpin).

## Common Issues and Solutions

### Borrow Checker Conflicts

When the borrow checker rejects code, prefer restructuring over workarounds:

```rust
// WRONG: Attempting to borrow mutably while immutably borrowed
let r = &contracts[0]; // Immutable borrow
contracts.push(new_contract); // COMPILE ERROR — Vec cannot reallocate while borrowed

// CORRECT: Release immutable borrow before mutating
let id = contracts[0].id(); // Copy the needed data
contracts.push(new_contract); // Now safe to mutate
```

### Lifetime Too Long (Borrowing Entire Struct)

```rust
// WRONG: Returns reference that borrows entire AppState
fn get_db_url(state: &AppState) -> &str {
    &state.config.database_url // Borrows state for the lifetime of the returned &str
}

// CORRECT: Return owned value or restructure
fn get_db_url(state: &AppState) -> String {
    state.config.database_url.clone()
}

// OR: Accept more specific type
fn get_db_url(config: &AppConfig) -> &str {
    &config.database_url
}
```

### Self-Referential Structs

```rust
// WRONG: Self-referential struct — does not compile
struct ContractWithRef {
    data: String,
    reference: &String, // Cannot reference self.data
}

// CORRECT: Use indices or Rc instead
struct ContractWithIdx {
    data: Vec<String>,
    important_idx: usize, // Index into data instead of reference
}
```

## Enforcement

- **Compiler** — All ownership and borrowing violations are compile-time errors
- Code reviews verify smart pointer selection is appropriate (Arc vs Rc vs Box)
- Code reviews verify lifetime annotations are minimal (not over-annotated)

**Pre-commit checklist**:

- [ ] `&T` / `&mut T` used when ownership transfer not needed
- [ ] `Arc<T>` used for multi-threaded sharing (not `Rc<T>`)
- [ ] `RefCell<T>` used sparingly and only in single-threaded contexts
- [ ] `Box<T>` used for recursive types and trait objects
- [ ] Lifetime annotations minimal — no over-annotation
- [ ] `Drop` implemented for types holding external resources
- [ ] No self-referential structs without `Pin`

## Related Standards

- [Concurrency Standards](concurrency-standards.md) - Arc, Mutex in async
- [Performance Standards](performance-standards.md) - Allocation patterns
- [Type Safety Standards](type-safety-standards.md) - Smart pointers and generics

## Related Documentation

**Software Engineering Principles**:

- [Immutability Over Mutability](../../../../../repo-governance/principles/software-engineering/immutability.md)
- [Explicit Over Implicit](../../../../../repo-governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: MSRV declared via the crate's `rust-version` field in `Cargo.toml`; Edition 2024
