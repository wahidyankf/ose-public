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

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

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

Every Rust value has exactly one owner. When the owner goes out of scope, the value is dropped (memory freed).

```rust
// CORRECT: Ownership transfer (move semantics)
fn process_contract(contract: MurabahaContract) {
    // contract is moved here — caller no longer owns it
    let id = contract.id; // Access fields before contract is dropped
    // contract is dropped at end of function
}

let contract = MurabahaContract::new(...);
process_contract(contract);
// contract cannot be used here — it was moved!

// CORRECT: Clone when both caller and callee need the value
let contract = MurabahaContract::new(...);
process_contract(contract.clone()); // Clone — both retain a copy
println!("{:?}", contract); // Still valid — we kept a copy
```

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

**The borrow rules**:

1. At any time, you can have EITHER one mutable reference OR any number of immutable references
2. References must always be valid (no dangling references)

```rust
// The compiler enforces these rules:
let mut contract = MurabahaContract::new(...);

let r1 = &contract;       // Shared borrow
let r2 = &contract;       // Another shared borrow — OK
// let rm = &mut contract; // COMPILE ERROR — cannot borrow mutably while shared borrows exist

println!("{:?} {:?}", r1, r2); // r1 and r2 used here

// After r1 and r2 are no longer used:
let rm = &mut contract;   // Mutable borrow — now valid
rm.activate().unwrap();
```

## Lifetime Annotations

**MUST** add lifetime annotations when the compiler cannot infer how long references live. Most functions do not need explicit lifetimes (lifetime elision handles common cases).

**Add lifetimes when**:

- A function returns a reference whose lifetime depends on input references
- A struct holds a reference

```rust
// CORRECT: Lifetime needed — return value borrows from parameter
fn longest_contract_id<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// No lifetime needed — single reference parameter (lifetime elision)
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

// CORRECT: Struct holding a reference requires lifetime
struct ContractReference<'a> {
    contract: &'a MurabahaContract,
    description: &'a str,
}

impl<'a> ContractReference<'a> {
    fn id(&self) -> ContractId {
        self.contract.id()
    }
}
```

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

```rust
// Pin is needed when implementing Future manually:
use std::pin::Pin;
use std::future::Future;

// Most async code: use async fn — no Pin needed
async fn process_contract(id: ContractId) -> Result<Contract, AppError> {
    let contract = fetch(id).await?;
    Ok(contract)
}

// Pinning is needed when boxing async futures:
fn dynamic_future(id: ContractId) -> Pin<Box<dyn Future<Output = Result<Contract, AppError>>>> {
    Box::pin(process_contract(id))
}
```

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

- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
