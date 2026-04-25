---
title: "Rust Concurrency Standards"
description: Authoritative OSE Platform Rust concurrency standards (Send/Sync, async/await, Tokio, Arc/Mutex, channels)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - concurrency
  - ownership
  - async-await
  - tokio
  - send-sync
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Concurrency Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative concurrency standards** for Rust development in the OSE Platform. Rust's unique value proposition is "fearless concurrency" — the compiler prevents data races at compile time through the ownership system and `Send`/`Sync` traits.

**Target Audience**: OSE Platform Rust developers, platform architects, technical reviewers

**Scope**: Send/Sync traits, async/await with Tokio, Arc/Mutex patterns, channels, rayon for data parallelism

## Software Engineering Principles

### 1. Immutability Over Mutability (Compiler-Enforced for Concurrency)

Rust's concurrency safety is built on immutability guarantees:

- Shared references (`&T`) are always immutable — no data races possible
- Exclusive mutable references (`&mut T`) cannot be aliased — no races
- `Send` and `Sync` traits encode thread-safety contracts at the type level
- The compiler REJECTS code with data races — no runtime overhead needed

### 2. Explicit Over Implicit

Concurrency decisions MUST be explicit:

- `Arc<T>` for shared ownership (not invisible reference counting)
- `Mutex<T>` for interior mutability (not hidden locks)
- `async fn` for async code (not threads hidden behind an abstraction)
- `tokio::spawn` for task creation (not thread creation)

### 3. Automation Over Manual

Rust automates concurrency safety:

- The compiler rejects data races at compile time
- `cargo test` with thread-safety built into the type system
- No need for runtime race detectors (though available via sanitizers)

## Fearless Concurrency: Send and Sync

**Send** means a type can be transferred to another thread. **Sync** means a type can be shared between threads via shared references.

These traits are automatically derived for most types and checked by the compiler:

```rust
// The compiler verifies these automatically:

// Rc<T> is NOT Send — cannot be sent to another thread
// Arc<T> IS Send — can be sent to another thread

// Cell<T> is NOT Sync — cannot be shared between threads
// Mutex<T> IS Sync — can be shared between threads

// CORRECT: Arc enables shared ownership across threads
use std::sync::Arc;

async fn process_contracts(contracts: Arc<Vec<MurabahaContract>>) {
    let contracts_clone = Arc::clone(&contracts); // Cheap reference count increment
    tokio::spawn(async move {
        for contract in contracts_clone.iter() {
            process(contract).await;
        }
    });
}

// WRONG: Rc is not thread-safe
use std::rc::Rc;
fn process_contracts(contracts: Rc<Vec<MurabahaContract>>) {
    // COMPILE ERROR: Rc<Vec<...>> cannot be sent between threads safely
    tokio::spawn(async move { /* ... */ });
}
```

## Async/Await with Tokio

**MUST** use `#[tokio::main]` for async entry points:

```rust
// CORRECT: Tokio async runtime entry point
#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = load_config()?;
    let app = build_router(config).await?;

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

**MUST** use `tokio::spawn` for independent concurrent tasks:

```rust
// CORRECT: Spawn independent tasks
async fn process_zakat_batch(transactions: Vec<ZakatTransaction>) {
    let mut handles = Vec::new();

    for transaction in transactions {
        let handle = tokio::spawn(async move {
            process_single_transaction(transaction).await
        });
        handles.push(handle);
    }

    // Collect results
    for handle in handles {
        match handle.await {
            Ok(Ok(result)) => log_success(result),
            Ok(Err(e)) => log_error(e),
            Err(e) => log_panic(e), // Task panicked
        }
    }
}
```

**MUST** use `tokio::select!` for racing multiple async operations:

```rust
// CORRECT: Race between operation and timeout
use tokio::time::{timeout, Duration};

async fn fetch_with_timeout(id: ContractId) -> Result<MurabahaContract, AppError> {
    tokio::select! {
        result = contract_repo.find_by_id(id) => {
            result.map_err(AppError::from)
        }
        _ = tokio::time::sleep(Duration::from_secs(5)) => {
            Err(AppError::Timeout)
        }
    }
}
```

## Arc<T> for Shared Ownership Across Threads

**MUST** use `Arc<T>` (Atomic Reference Counting) for shared ownership across threads or async tasks:

```rust
// CORRECT: Shared state with Arc
#[derive(Clone)]
struct AppState {
    db_pool: Arc<sqlx::PgPool>,
    config: Arc<AppConfig>,
}

// Arc::clone is explicit and cheap (atomic increment)
let state_clone = Arc::clone(&state);
tokio::spawn(async move {
    handle_request(state_clone).await;
});

// WRONG: Rc is not thread-safe
use std::rc::Rc;
struct AppState {
    db_pool: Rc<sqlx::PgPool>, // COMPILE ERROR when used with tokio::spawn
}
```

## Mutex<T> and RwLock<T> for Interior Mutability

**MUST** use `tokio::sync::Mutex` (not `std::sync::Mutex`) for mutexes held across await points:

```rust
// CORRECT: Tokio Mutex for async contexts
use tokio::sync::Mutex;

struct CacheService {
    cache: Arc<Mutex<HashMap<ContractId, MurabahaContract>>>,
}

impl CacheService {
    async fn get_or_fetch(&self, id: ContractId) -> Result<MurabahaContract, AppError> {
        {
            let cache = self.cache.lock().await; // Tokio async lock
            if let Some(contract) = cache.get(&id) {
                return Ok(contract.clone());
            }
        } // Lock released here

        // Fetch without holding lock
        let contract = fetch_from_db(id).await?;

        {
            let mut cache = self.cache.lock().await;
            cache.insert(id, contract.clone());
        }

        Ok(contract)
    }
}

// WRONG: std::sync::Mutex held across await — deadlock risk
use std::sync::Mutex;
let guard = std::sync::Mutex::lock(&self.cache).unwrap();
let result = some_async_operation().await; // Holding std Mutex across await!
```

**MUST** use `RwLock<T>` when reads are frequent and writes are rare:

```rust
// CORRECT: RwLock for read-heavy access patterns
use tokio::sync::RwLock;

struct ContractRegistry {
    contracts: Arc<RwLock<HashMap<ContractId, MurabahaContract>>>,
}

impl ContractRegistry {
    async fn get(&self, id: ContractId) -> Option<MurabahaContract> {
        let contracts = self.contracts.read().await; // Shared read lock
        contracts.get(&id).cloned()
    }

    async fn insert(&self, contract: MurabahaContract) {
        let mut contracts = self.contracts.write().await; // Exclusive write lock
        contracts.insert(contract.id, contract);
    }
}
```

## Channels for Message Passing

**MUST** use Tokio channels for communication between tasks. Prefer message passing over shared state.

```rust
// CORRECT: mpsc channel for task-to-task communication
use tokio::sync::mpsc;

async fn run_zakat_processor() {
    let (tx, mut rx) = mpsc::channel::<ZakatTransaction>(100);

    // Producer task
    tokio::spawn(async move {
        for transaction in fetch_pending_transactions().await {
            tx.send(transaction).await.expect("receiver dropped");
        }
    });

    // Consumer loop
    while let Some(transaction) = rx.recv().await {
        process_zakat_transaction(transaction).await;
    }
}

// CORRECT: oneshot channel for single response
use tokio::sync::oneshot;

async fn request_response_pattern() -> Result<ContractId, AppError> {
    let (tx, rx) = oneshot::channel();
    create_contract_task(tx).await;
    rx.await.map_err(|_| AppError::TaskDropped)
}

// CORRECT: broadcast channel for fan-out notifications
use tokio::sync::broadcast;

struct EventBus {
    sender: broadcast::Sender<DomainEvent>,
}

impl EventBus {
    fn subscribe(&self) -> broadcast::Receiver<DomainEvent> {
        self.sender.subscribe()
    }

    fn publish(&self, event: DomainEvent) {
        let _ = self.sender.send(event); // Ignore if no receivers
    }
}
```

## Rayon for Data Parallelism

**SHOULD** use `rayon` for CPU-bound data parallelism where Tokio async is not appropriate:

```rust
// CORRECT: Rayon for CPU-bound parallel computation
use rayon::prelude::*;

fn calculate_portfolio_zakat(portfolios: &[Portfolio]) -> Vec<ZakatResult> {
    portfolios
        .par_iter() // Parallel iterator
        .map(|portfolio| calculate_zakat_for_portfolio(portfolio))
        .collect()
}

// WRONG: Tokio for CPU-bound work (blocks the async runtime)
async fn calculate_portfolio_zakat(portfolios: Vec<Portfolio>) -> Vec<ZakatResult> {
    // This blocks the Tokio thread pool — don't do this
    portfolios
        .iter()
        .map(|p| calculate_zakat_for_portfolio(p))
        .collect()
}
```

**MUST** use `tokio::task::spawn_blocking` for CPU-bound work called from async context:

```rust
// CORRECT: Off-load CPU-bound work from async runtime
async fn compute_heavy_financial_report(data: Vec<Transaction>) -> Report {
    tokio::task::spawn_blocking(move || {
        // Runs on a dedicated blocking thread pool
        generate_report_synchronously(data)
    })
    .await
    .expect("blocking task panicked")
}
```

## Avoid Async in Sync Contexts

**MUST NOT** call `block_on` or similar blocking runtime functions from within async code:

```rust
// WRONG: block_on inside async context — runtime deadlock!
async fn bad_handler() -> String {
    let result = tokio::runtime::Handle::current()
        .block_on(async { fetch_data().await }); // Deadlocks!
    result
}

// CORRECT: Await directly in async context
async fn good_handler() -> String {
    fetch_data().await
}
```

## Enforcement

- **Compiler** — Data races are compile-time errors (the primary enforcement)
- **cargo clippy** — Detects common async/sync misuse patterns
- **Code reviews** — Review `Arc`/`Mutex` usage patterns and task spawning
- **Integration tests** — Test concurrent scenarios with `tokio::test`

**Pre-commit checklist**:

- [ ] `Arc<T>` used for shared ownership (not `Rc<T>`)
- [ ] `tokio::sync::Mutex` used when held across `await` (not `std::sync::Mutex`)
- [ ] `tokio::spawn` results always joined or explicitly dropped
- [ ] CPU-bound work uses `spawn_blocking` or `rayon`
- [ ] No `block_on` inside async functions
- [ ] Channels used for task communication (prefer over shared state)

## Related Standards

- [Coding Standards](coding-standards.md) - Idiomatic Rust patterns
- [Performance Standards](performance-standards.md) - Profiling async code
- [API Standards](api-standards.md) - Axum AppState sharing

## Related Documentation

**Software Engineering Principles**:

- [Immutability Over Mutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
