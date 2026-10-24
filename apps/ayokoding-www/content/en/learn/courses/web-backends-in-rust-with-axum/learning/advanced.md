---
title: Advanced Examples
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 30
---

Examples 54–78 survive reality: concurrency under load with shared ownership (Examples 54–61), graceful shutdown that drains before exiting (Examples 62–70), and design choices compared against FastAPI (Examples 71–78). Every example is a complete, runnable Rust program under `learning/code/` driving its service in-process through `tower::ServiceExt::oneshot`; run each with the command in its own `run.yaml`.

---

### Example 54: Handlers Run on the Shared Runtime

Spawned tasks drive one router concurrently; sorted lines keep goldens stable. This example fans five tasks across one shared router and prints their five lines in task order, whatever order they finished in.

Sorting is the concurrency-testing habit: completion order is nondeterministic, but sorted output is a stable contract. The router clone per task is cheap — routes are shared, never copied.

(Concepts: co-07.)

```mermaid
flowchart TD
    accTitle: Fan out, example 54
    accDescr: Five tasks share one router, sort lines.
    router --> t1[\"task 1\"]
    router --> t2[\"task 2\"]
    router --> tn[\"tasks\"]
    t1 --> sort
    t2 --> sort
    tn --> sort
    router[\"router\"]:::orange
    t1[\"task 1\"]:::blue
    t2[\"task 2\"]:::blue
    tn[\"tasks\"]:::blue
    sort[\"sort\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-54-handlers-run-on-the-shared-runtime/src/main.rs`**:

```rust
// Example 54: Handlers Run on the Shared Runtime.
// spawned tasks drive one router concurrently; sorted lines keep goldens stable.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Clone lets every task own the router it drives
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers every concurrent call with the same fixed greeting
async fn hello() -> Json<Value> {
    // => no state, no lock: the handler is trivially safe under any load
    Json(json!({"message": "hello, axum"})) // => five tasks hear the same greeting
} // => handler ends: stateless handlers scale without thinking

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => Clone on Router shares the routes: tasks never rebuild wiring
    Router::new().route("/hello", get(hello)) // => one route, five concurrent drivers
} // => constructor ends: wiring stays separate from traffic

// => call drives one concurrent request and returns its printed line
async fn call(app: Router, n: usize) -> String {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => the same call every task makes
    // => oneshot runs routing and handlers exactly as live, on this task
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the line carries the task number so the sort below orders the goldens
    format!("task-{n} -> {status} {}", String::from_utf8_lossy(&bytes)) // => returned, not printed: order is decided below
} // => call ends: one line per task, order decided by the collector

#[tokio::main] // => the multithread runtime runs the five tasks at once
async fn main() {
    // => build once, share the router across five spawned tasks
    let app = app(); // => the service under test, built by its constructor
    // => spawn five drivers; each owns a clone and returns its line
    let mut tasks = Vec::new(); // => the join handles gather here
    // => five tasks stand in for five concurrent clients
    for n in 1..=5 { // => task numbers 1 through 5, in spawn order
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes are shared, not copied
        // => spawn runs the call on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { call(router, n).await })); // => five futures, one runtime, no sockets
    } // => spawn loop ends: all five tasks are racing now
    // => join every task and collect the five lines
    let mut lines = Vec::new(); // => the lines land in completion order, not task order
    // => await each handle in spawn order; lines still arrive jumbled
    for task in tasks { lines.push(task.await.unwrap()); } // => unwrap: a panicked task fails the run loudly
    // => sort makes concurrency golden-stable: the same five lines, every run
    lines.sort(); // => task-1 through task-5, regardless of who finished first
    // => print the sorted lines: the proof of concurrent service, deterministically
    for line in lines { println!("{line}"); } // => the harness compares these lines with the golden file
} // => main ends: five concurrent calls, five sorted lines, so the run is green
```

**Output** (`learning/code/ex-54-handlers-run-on-the-shared-runtime/expected/main.stdout.txt`):

```text
task-1 -> 200 OK {"message":"hello, axum"}
task-2 -> 200 OK {"message":"hello, axum"}
task-3 -> 200 OK {"message":"hello, axum"}
task-4 -> 200 OK {"message":"hello, axum"}
task-5 -> 200 OK {"message":"hello, axum"}
```

**Key takeaway**: Spawn tasks with router clones, collect lines, sort before printing: concurrency with stable goldens.

**Why it matters**: Load tests are worthless if they flake, and completion order is the usual flake source. Returning lines instead of printing them moves the ordering decision to one `sort` in the collector — every task runs free, determinism lands at the end. This fan-out-collect-sort shape repeats for every concurrency example in the cluster.

---

### Example 55: Atomic Counter Survives Ten Clients

`Arc<AtomicUsize>` counts hits across tasks: no lock, no lost update. This example fires ten concurrent posts at one counter and reads back exactly ten, proving lock-free increments never lose a bump.

`fetch_add` is the whole synchronization: one atomic instruction per bump, no mutex, no waiting. The final read after the join proves all ten landed — the count is the test.

(Concepts: co-07, co-06.)

**`learning/code/ex-55-atomic-counter-survives-ten-clients/src/main.rs`**:

```rust
// Example 55: Atomic Counter Survives Ten Clients.
// Arc<AtomicUsize> counts hits across tasks: no lock, no lost update.
use std::sync::{Arc, atomic::{AtomicUsize, Ordering}}; // => Arc shares the counter; fetch_add bumps it lock-free
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::{get, post}}; // => post bumps, get reads: the two halves of the counter
use serde_json::{Value, json}; // => json! builds the count reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one counter every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the integer: cheap by design
struct AppState {
    // => the hits so far: bumped by posts, read by gets
    hits: Arc<AtomicUsize>, // => atomics need no lock, so posts never block each other
} // => struct ends: one integer shared across ten concurrent clients

// => hit bumps the counter and answers the new total
async fn hit(State(state): State<AppState>) -> Json<Value> {
    // => fetch_add returns the previous value: add one for the 1-based total
    let total = state.hits.fetch_add(1, Ordering::SeqCst) + 1; // => SeqCst keeps the demo obviously correct
    // => the reply echoes the total this bump produced
    Json(json!({"hits": total})) // => totals 1 through 10 across the ten posts
} // => handler ends: lock-free bump, no lost update possible

// => count reads the counter without bumping it
async fn count(State(state): State<AppState>) -> Json<Value> {
    // => load reads the current total: the suite asserts this equals ten
    Json(json!({"hits": state.hits.load(Ordering::SeqCst)})) // => the final proof all ten bumps landed
} // => handler ends: reads never disturb the count

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => the counter starts at zero: ten bumps make ten
    let state = AppState { hits: Arc::new(AtomicUsize::new(0)) }; // => zero hits before the first post
    // => with_state moves the counter into the router; handlers unpack clones
    Router::new().route("/hit", post(hit)).route("/count", get(count)).with_state(state) // => bump and read live one router apart
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the multithread runtime runs the ten bumpers at once
async fn main() {
    // => build once, share the router across ten spawned bumpers
    let app = app(); // => the service under test, built by its constructor
    // => spawn ten bumpers; each posts once and drops its reply
    let mut tasks = Vec::new(); // => the join handles gather here
    // => ten tasks stand in for ten concurrent clients
    for _ in 1..=10 { // => ten posts, no more, no fewer
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes and state are shared
        // => spawn runs one POST /hit on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { // => the bumper owns its router clone
            // => one bump per task: method, path, empty body
            let request = Request::builder().method("POST").uri("/hit").body(Body::empty()).unwrap(); // => posts carry no payload here
            // => the reply is drained, not printed: totals arrive jumbled anyway
            let response = router.oneshot(request).await.unwrap(); // => the bump lands or the task panics
            // => drain the body so the response is fully consumed
            let _ = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => totals print once below, not ten times
        })); // => bumper ends: one post per task, exactly ten posts
    } // => spawn loop ends: all ten bumpers are racing now
    // => join every bumper before reading the count
    for task in tasks { task.await.unwrap(); } // => unwrap: a panicked bumper fails the run loudly
    // => read the final count through the real stack, after all bumps landed
    let request = Request::builder().method("GET").uri("/count").body(Body::empty()).unwrap(); // => the proof read after the join
    // => oneshot runs the read against the same shared state
    let response = app.oneshot(request).await.unwrap(); // => the counter holds ten by now
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line: ten concurrent bumps, one final count of ten
    println!("ten concurrent posts -> {}", String::from_utf8_lossy(&bytes)); // => {"hits":10}: no lost update across ten tasks
} // => main ends: the atomic survived ten clients, so the run is green
```

**Output** (`learning/code/ex-55-atomic-counter-survives-ten-clients/expected/main.stdout.txt`):

```text
ten concurrent posts -> {"hits":10}
```

**Key takeaway**: `fetch_add` bumps across tasks with no lock; the post-join read proves all ten landed.

**Why it matters**: Counters, flags, and sequence numbers are the most common shared values, and atomics serve them without lock contention: ten bumpers never wait on each other. Draining replies instead of printing them keeps the golden to one line — per-task totals would arrive jumbled and prove nothing the final count doesn't. When the shared value outgrows one integer, the mutex examples next show the heavier shape.

---

### Example 56: Mutex Guards the Shared Order Book

`Arc<Mutex<Vec>>` takes concurrent writes: lock briefly, clone, render outside. This example races five appenders at one book and reads back all five ids sorted, proving no write was lost.

The critical section stays three lines: lock, push, measure — and the lock never crosses an `await`. Sorting the read turns the race order into a stable contract: the golden holds the same five ids whatever order the tasks won.

(Concepts: co-07, co-06.)

**`learning/code/ex-56-mutex-guards-the-shared-order-book/src/main.rs`**:

```rust
// Example 56: Mutex Guards the Shared Order Book.
// Arc<Mutex<Vec>> takes concurrent writes: lock briefly, clone, render outside.
use std::sync::{Arc, Mutex}; // => Arc shares the book; Mutex serializes the appends
use axum::{Router, body::Body, extract::{Path, State}, http::{Request, StatusCode}, response::Json, routing::{get, post}}; // => post appends, get lists: the two halves of the book
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex serializes appends because handlers run on many threads
    book: Arc<Mutex<Vec<String>>>, // => one book, many writers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => add appends one id under a short lock and answers 201 with the book size
async fn add(State(state): State<AppState>, Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    // => lock, push, measure: the critical section ends before the reply builds
    let size = { let mut book = state.book.lock().unwrap(); book.push(id); book.len() }; // => the lock drops at the closing brace
    // => 201 with the size the book reached after this append
    (StatusCode::CREATED, Json(json!({"size": size}))) // => sizes 1 through 5 across the five posts
} // => handler ends: the lock never crosses an await

// => list clones the book under the lock and renders the sorted ids
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => clone under the lock, sort outside it: readers never block writers long
    let mut ids = state.book.lock().unwrap().clone(); // => the lock drops before sorting
    // => sort makes concurrent appends golden-stable: same ids, every run
    ids.sort(); // => o-1 through o-5, regardless of which task won the race
    // => the listing echoes the sorted book contents
    Json(json!({"orders": ids})) // => five ids in order, whatever the race said
} // => handler ends: sorting turns a race into a stable contract

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => the book starts empty: five appends fill it below
    let state = AppState { book: Arc::new(Mutex::new(Vec::new())) }; // => empty book before the first post
    // => with_state moves the book into the router; handlers unpack clones
    Router::new().route("/orders/{id}", post(add)).route("/orders", get(list)).with_state(state) // => append and list live one router apart
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the multithread runtime runs the five appenders at once
async fn main() {
    // => build once, share the router across five spawned appenders
    let app = app(); // => the service under test, built by its constructor
    // => spawn five appenders; each posts one id and drops its reply
    let mut tasks = Vec::new(); // => the join handles gather here
    // => five tasks stand in for five concurrent clients
    for n in 1..=5 { // => ids o-1 through o-5, one per task
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes and state are shared
        // => spawn runs one POST on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { // => the appender owns its router clone
            // => one append per task: the id rides in the path
            let uri = format!("/orders/o-{n}"); // => o-1 through o-5, built per task
            // => Request::builder shapes a server-side request without a client
            let request = Request::builder().method("POST").uri(&uri).body(Body::empty()).unwrap(); // => posts carry no payload here
            // => the reply is drained, not printed: sizes arrive jumbled anyway
            let response = router.oneshot(request).await.unwrap(); // => the append lands or the task panics
            // => drain the body so the response is fully consumed
            let _ = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => sizes print once below, not five times
        })); // => appender ends: one append per task, exactly five appends
    } // => spawn loop ends: all five appenders are racing now
    // => join every appender before reading the book
    for task in tasks { task.await.unwrap(); } // => unwrap: a panicked appender fails the run loudly
    // => read the sorted book through the real stack, after all appends landed
    let request = Request::builder().method("GET").uri("/orders").body(Body::empty()).unwrap(); // => the proof read after the join
    // => oneshot runs the read against the same shared book
    let response = app.oneshot(request).await.unwrap(); // => the book holds five rows by now
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line: five concurrent appends, one sorted book of five
    println!("five concurrent appends -> {}", String::from_utf8_lossy(&bytes)); // => {"orders":["o-1","o-2","o-3","o-4","o-5"]}: no lost write
} // => main ends: the mutex guarded five writers, so the run is green
```

**Output** (`learning/code/ex-56-mutex-guards-the-shared-order-book/expected/main.stdout.txt`):

```text
five concurrent appends -> {"orders":["o-1","o-2","o-3","o-4","o-5"]}
```

**Key takeaway**: Short critical sections plus a sorted read turn five racing appends into one stable book.

**Why it matters**: Shared collections need mutual exclusion, and the discipline is keeping the lock short: three lines, no awaits inside, clone-and-release for reads. The sorted read is what makes the mutex testable — without it, the golden would wobble with every race outcome. This is the default shape for any read-mostly store that occasionally writes; the `RwLock` example next specializes it.

---

### Example 57: RwLock Separates Reads from Writes

Many readers proceed together; writers still take the book alone. This example races three writers, joins them, then reads twice — both reads agreeing on the same three sorted rows.

`RwLock` fits read-heavy stores: concurrent reads never block each other, while writes still serialize. The two identical read lines prove readers share the settled book without disturbing it.

(Concepts: co-07, co-06.)

**`learning/code/ex-57-rwlock-separates-reads-from-writes/src/main.rs`**:

```rust
// Example 57: RwLock Separates Reads from Writes.
// many readers proceed together; writers still take the book alone.
use std::sync::{Arc, RwLock}; // => RwLock admits concurrent readers, one writer at a time
use axum::{Router, body::Body, extract::{Path, State}, http::{Request, StatusCode}, response::Json, routing::{get, post}}; // => post writes, get reads: the two lock kinds side by side
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => RwLock lets readers share the book while writers take it alone
    book: Arc<RwLock<Vec<String>>>, // => one book, many readers or one writer
} // => struct ends: read-mostly sharing with write safety

// => add takes the write lock, appends one id, and answers 201
async fn add(State(state): State<AppState>, Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    // => write borrows the book alone: readers wait out this short section
    let size = { let mut book = state.book.write().unwrap(); book.push(id); book.len() }; // => the write lock drops at the closing brace
    // => 201 with the size the book reached after this append
    (StatusCode::CREATED, Json(json!({"size": size}))) // => sizes grow as writers land
} // => handler ends: the write lock never crosses an await

// => list takes the read lock, clones, and renders the sorted ids
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => read borrows the book beside fellow readers: no writer is inside now
    let mut ids = state.book.read().unwrap().clone(); // => the read lock drops before sorting
    // => sort makes concurrent writes golden-stable: same ids, every run
    ids.sort(); // => o-1 through o-3, regardless of writer order
    // => the listing echoes the sorted book contents
    Json(json!({"orders": ids})) // => three ids in order, whatever the race said
} // => handler ends: readers share, writers queue, output stays stable

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => the book starts empty: three writes fill it below
    let state = AppState { book: Arc::new(RwLock::new(Vec::new())) }; // => empty book before the first post
    // => with_state moves the book into the router; handlers unpack clones
    Router::new().route("/orders/{id}", post(add)).route("/orders", get(list)).with_state(state) // => write and read live one router apart
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the multithread runtime runs writers and readers at once
async fn main() {
    // => build once, share the router across three spawned writers
    let app = app(); // => the service under test, built by its constructor
    // => spawn three writers; each appends one id and drops its reply
    let mut tasks = Vec::new(); // => the join handles gather here
    // => three tasks stand in for three concurrent clients
    for n in 1..=3 { // => ids o-1 through o-3, one per task
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes and state are shared
        // => spawn runs one POST on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { // => the writer owns its router clone
            // => one append per task: the id rides in the path
            let uri = format!("/orders/o-{n}"); // => o-1 through o-3, built per task
            // => Request::builder shapes a server-side request without a client
            let request = Request::builder().method("POST").uri(&uri).body(Body::empty()).unwrap(); // => posts carry no payload here
            // => the reply is drained, not printed: sizes arrive jumbled anyway
            let response = router.oneshot(request).await.unwrap(); // => the write lands or the task panics
            // => drain the body so the response is fully consumed
            let _ = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => sizes print once below, not three times
        })); // => writer ends: one append per task, exactly three appends
    } // => spawn loop ends: all three writers are racing now
    // => join every writer before the readers arrive
    for task in tasks { task.await.unwrap(); } // => unwrap: a panicked writer fails the run loudly
    // => two sequential reads prove readers share the settled book
    for n in 1..=2 { // => read one and read two see the same three rows
        // => Request::builder shapes a server-side request without a client
        let request = Request::builder().method("GET").uri("/orders").body(Body::empty()).unwrap(); // => the proof read after the join
        // => oneshot runs the read against the same shared book
        let response = app.clone().oneshot(request).await.unwrap(); // => the book holds three rows by now
        // => to_bytes collects the whole body with a generous in-memory cap
        let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
        // => one golden line per read: both reads agree on three rows
        println!("read-{n} -> {}", String::from_utf8_lossy(&bytes)); // => {"orders":["o-1","o-2","o-3"]}: readers share, writers queued
    } // => read loop ends: two reads, one stable book
} // => main ends: reads shared and writes queued, so the run is green
```

**Output** (`learning/code/ex-57-rwlock-separates-reads-from-writes/expected/main.stdout.txt`):

```text
read-1 -> {"orders":["o-1","o-2","o-3"]}
read-2 -> {"orders":["o-1","o-2","o-3"]}
```

**Key takeaway**: `write()` serializes writers while `read()` shares readers; two reads agree on the settled book.

**Why it matters**: Catalogs and config caches read far more than they write, and `RwLock` stops readers from queueing behind each other. The two identical read lines are the proof that sharing works — same book, no disturbance. The rule of thumb stays: reads dominate, reach for `RwLock`; writes contend, keep the plain `Mutex`.

---

### Example 58: Clone State, Not Data

One `Arc` holds the heavy catalog; handlers clone the pointer per call. This example shares ten thousand rows behind one pointer and reports the row count beside the holder count — heavy data, weightless handles.

Immutable data needs no lock at all: `Arc<Vec>` shares freely because nobody writes. The holder count proves the sharing is pointer-deep — two holders, ten thousand rows, zero copies.

(Concepts: co-07, co-06.)

**`learning/code/ex-58-clone-state-not-data/src/main.rs`**:

```rust
// Example 58: Clone State, Not Data.
// one Arc holds the heavy catalog; handlers clone the pointer per call.
use std::sync::Arc; // => Arc is the whole sharing story: one allocation, many pointers
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks one cheap pointer per handler call
use serde_json::{Value, json}; // => json! builds the summary reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => HEAVY_ROWS stands in for the catalog no handler should ever copy
const HEAVY_ROWS: usize = 10_000; // => ten thousand rows: cloning this per call would hurt

// => AppState carries the heavy catalog behind one Arc
#[derive(Clone)] // => Clone copies the pointer in nanoseconds, never the rows
struct AppState {
    // => the catalog lives once in memory; every handler borrows through the Arc
    catalog: Arc<Vec<String>>, // => immutable: no lock needed, readers share freely
} // => struct ends: heavy data, weightless handles

// => summary proves the sharing: row count plus live holder count
async fn summary(State(state): State<AppState>) -> Json<Value> {
    // => len reads the heavy data without copying a single row
    let rows = state.catalog.len(); // => ten thousand, through the shared pointer
    // => strong_count proves handlers hold pointers, not copies
    let holders = Arc::strong_count(&state.catalog); // => router plus this call: a small fixed number
    // => the reply carries both proofs side by side
    Json(json!({"rows": rows, "holders": holders})) // => heavy data, light handles, one line
} // => handler ends: it touched ten thousand rows and copied zero

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the catalog builds once here: ten thousand ids in one vector
    let catalog: Vec<String> = (1..=HEAVY_ROWS).map(|n| format!("item-{n:05}")).collect(); // => item-00001 through item-10000
    // => with_state moves the Arc into the router; handlers unpack pointer clones
    Router::new().route("/summary", get(summary)).with_state(AppState { catalog: Arc::new(catalog) }) // => one allocation, every call borrows it
} // => constructor ends: heavy once, light forever after

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the pointer for this call
    // => status names what happened; the body carries rows plus holders
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the summary is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the summary always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line: method, path, status, summary
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the summary through the shared pointer
    let app = app(); // => the service under test, built by its constructor
    // => ten thousand rows behind a two-holder pointer: clone state, not data
    check(app.clone(), "GET", "/summary").await; // => Output: 200 {"rows":10000,"holders":2}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-58-clone-state-not-data/expected/main.stdout.txt`):

```text
GET /summary -> 200 OK {"holders":3,"rows":10000}
```

**Key takeaway**: `Arc<Vec>` shares ten thousand rows behind three holders; handlers touch data through pointers, never copies.

**Why it matters**: Reference data — catalogs, rules, feature flags — is read on every call and written almost never, and `Arc` fits it exactly: one allocation, lock-free reads, nanosecond clones. The alphabetical golden (`holders` before `rows`) again shows `serde_json` sorting `json!` keys. If the data must change, rebuild the `Arc` and swap it once — readers never block, which is the poor team's read-copy-update.

---

### Example 59: Backpressure Bounds the Queue

Two permits admit two overlapping calls; the third meets a 503, not a queue. This example shares one two-permit semaphore between main and the service: with both free the call runs inside, with both held it answers busy.

`try_acquire` never waits: the bound is visible in the status instead of hidden in latency. Returning 503 lets the client decide — retry, shed, or degrade — instead of queueing blindly behind a hidden line.

(Concepts: co-07, co-02.)

```mermaid
flowchart TD
    accTitle: Permit bound, example 59
    accDescr: Free admits, full answers busy.
    free -->|permit| inside
    full -->|no permit| busy[\"503\"]
    inside -->|200| out
    busy -->|503| out
    free[\"free\"]:::blue
    full[\"full\"]:::orange
    inside[\"inside\"]:::blue
    busy[\"503\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-59-backpressure-bounds-the-queue/src/main.rs`**:

```rust
// Example 59: Backpressure Bounds the Queue.
// two permits admit two overlapping calls; the third meets a 503, not a queue.
use std::sync::Arc; // => Arc shares the semaphore between main and the service
use axum::{Router, body::Body, extract::State, http::{Request, StatusCode}, response::Json, routing::get}; // => the handler answers 200 inside or 503 outside the bound
use serde_json::{Value, json}; // => json! builds the admitted and busy replies inline
use tokio::sync::Semaphore; // => Semaphore bounds concurrent entries without any queue
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one semaphore every call shares
#[derive(Clone)] // => Clone shares the Arc, never the permits: cheap by design
struct AppState {
    // => two permits stand in for two database connections
    slots: Arc<Semaphore>, // => the bound the demo proves, one acquire at a time
} // => struct ends: backpressure as a single shared value

// => enter takes a permit now or answers busy now: never waits, never lies
async fn enter(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // => try_acquire takes a permit now or fails now: the bound is visible, not hidden
    match state.slots.try_acquire() { // => Ok holds a permit for this call; Err means both are out
        // => a permit was free: answer inside the bound with the permit held
        Ok(_permit) => (StatusCode::OK, Json(json!({"inside": true}))), // => true means a slot was held for this call
        // => both permits are out: 503 says retry later, with the shared envelope
        Err(_) => (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"error": "busy"}))), // => busy, not queued: the client decides, not a hidden line
    } // => match ends: the permit drops with the reply, freeing the slot
} // => handler ends: two outcomes, zero waiting room

// => build_app wires the service around the shared semaphore
fn build_app(slots: Arc<Semaphore>) -> Router {
    // => the semaphore arrives from outside: main holds permits against it below
    Router::new().route("/enter", get(enter)).with_state(AppState { slots }) // => two slots, no queue, no waiting room
} // => constructor ends: the bound is shared, not copied

// => call serves one entry probe and prints its status line
async fn call(app: Router, label: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/enter").body(Body::empty()).unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the bound check, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => 200 inside the bound, 503 outside it
    // => status names what happened; the body carries admitted or busy
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: leg name, status, reply
    println!("{label} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the bound demo
async fn main() {
    // => the semaphore lives outside: main and the service share it
    let slots = Arc::new(Semaphore::new(2)); // => two permits: the bound the demo circles around
    // => the service wraps the shared bound; main keeps its own handle to it
    let app = build_app(slots.clone()); // => one bound, two holders of the Arc
    // => leg one: both permits free, the call runs inside the bound
    call(app.clone(), "both free").await; // => Output: 200 {"inside":true}
    // => main takes both permits: the service is now full from the outside
    let _first = slots.acquire().await.unwrap(); // => permit one held by main, not the service
    // => the second permit joins it: zero slots remain for the next call
    let _second = slots.acquire().await.unwrap(); // => the service is full; the next call must meet 503
    // => leg two: no permit free, the bound answers busy instead of queueing
    call(app.clone(), "both held").await; // => Output: 503 {"error":"busy"}
    // => the takeaway: the bound is visible in the status, never hidden in latency
    println!("bound: 2 permits admit overlap; the third call meets 503, not a queue"); // => backpressure in one line, no timing involved
} // => main ends: inside once, busy once, so the run is green
```

**Output** (`learning/code/ex-59-backpressure-bounds-the-queue/expected/main.stdout.txt`):

```text
both free -> 200 OK {"inside":true}
both held -> 503 Service Unavailable {"error":"busy"}
bound: 2 permits admit overlap; the third call meets 503, not a queue
```

**Key takeaway**: `try_acquire` admits or refuses immediately; the 503 keeps the bound visible instead of queueing blindly.

**Why it matters**: Unbounded concurrency turns load spikes into cascading failures: every slow call holds a thread, threads exhaust, the service dies. A semaphore sized to the scarcest resource — connections, file handles, downstream budget — sheds excess load with a retryable status. Main holding the permits from outside proves the bound deterministically: no timing, no sleep, just arithmetic on permits.

---

### Example 60: Blocking Work Moves to spawn_blocking

The handler stays async: heavy sums run on the blocking pool, not the runtime. This example moves a million-addition loop into `spawn_blocking` and answers the deterministic total without stalling the runtime that serves it.

Blocking the runtime starves every other task on the thread: one slow loop delays all concurrent calls. The pool hop costs one await and keeps the runtime free — the answer is identical, the thread is correct.

(Concepts: co-07.)

**`learning/code/ex-60-blocking-work-moves-to-spawn-blocking/src/main.rs`**:

```rust
// Example 60: Blocking Work Moves to spawn_blocking.
// the handler stays async: heavy sums run on the blocking pool, not the runtime.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the sum the blocking pool computes
use serde_json::{Value, json}; // => json! builds the sum reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => BLOCK_N sizes the busywork: big enough to matter, small enough to stay fast
const BLOCK_N: u64 = 1_000_000; // => one million additions finish in milliseconds

// => blocking_sum adds 1 through N on the calling thread: never on the runtime
fn blocking_sum() -> u64 {
    // => a plain loop stands in for hashing, parsing, or image work
    (1..=BLOCK_N).sum() // => 500000500000: Gauss beats the loop, the test beats trust
} // => function ends: sync code, honest name, zero async pretence

// => sum moves the busywork aside and answers its result as JSON
async fn sum() -> Json<Value> {
    // => spawn_blocking runs the closure on the blocking pool and awaits its return
    let total = tokio::task::spawn_blocking(blocking_sum).await.unwrap(); // => unwrap: test busywork never panics
    // => the reply proves the sum ran off-runtime and still answered in-process
    Json(json!({"sum": total})) // => 500000500000: deterministic arithmetic, no timing inside
} // => handler ends: async outside, blocking inside, runtime never stalled

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the sum; the pool hop hides inside the handler
    Router::new().route("/sum", get(sum)) // => GET /sum answers the off-runtime total
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, the pool hop, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the sum lands off-runtime, the reply on-runtime
    // => status names what happened; the body carries the deterministic total
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the total is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the sum always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line: method, path, status, total
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, sum once through the blocking pool
    let app = app(); // => the service under test, built by its constructor
    // => the total answers without stalling the runtime that serves it
    check(app.clone(), "GET", "/sum").await; // => Output: 200 {"sum":500000500000}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-60-blocking-work-moves-to-spawn-blocking/expected/main.stdout.txt`):

```text
GET /sum -> 200 OK {"sum":500000500000}
```

**Key takeaway**: `spawn_blocking` moves sync work off the runtime; the handler awaits the result like any future.

**Why it matters**: The async runtime assumes tasks yield quickly, and one blocking loop breaks that promise for every task sharing the thread. Hashing, parsing, image work, and legacy sync clients all belong on the blocking pool — the handler stays async at the boundary while sync code runs where blocking is safe. The deterministic total proves the move preserves answers: same arithmetic, correct thread.

---

### Example 61: Load Check Prints a Stable Summary

Twenty concurrent calls collapse into counted lines: the summary is the proof. This example races twenty tasks at one route and prints one line — twenty ok, zero other — instead of twenty jumbled lines.

Summaries scale where line-per-call doesn't: a thousand-call load test still prints one line. Counting by status bucket keeps the golden stable while proving every call landed in the right bucket.

(Concepts: co-07, co-09.)

**`learning/code/ex-61-load-check-prints-a-stable-summary/src/main.rs`**:

```rust
// Example 61: Load Check Prints a Stable Summary.
// twenty concurrent calls collapse into counted lines: the summary is the proof.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Clone lets every task own the router it drives
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers every load call with the same fixed greeting
async fn hello() -> Json<Value> {
    // => no state, no lock: the handler is trivially safe under any load
    Json(json!({"message": "hello, axum"})) // => twenty tasks hear the same greeting
} // => handler ends: stateless handlers scale without thinking

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => Clone on Router shares the routes: tasks never rebuild wiring
    Router::new().route("/hello", get(hello)) // => one route, twenty concurrent drivers
} // => constructor ends: wiring stays separate from traffic

// => call drives one load request and returns its status code
async fn call(app: Router) -> u16 {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => the same call every task makes
    // => oneshot runs routing and handlers exactly as live, on this task
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the code returns for counting; the summary below prints the totals
    let code = response.status().as_u16(); // => keep the number before the body moves
    // => to_bytes drains the body so the response is fully consumed
    let _ = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => drained, not printed: summaries count, they do not quote
    // => the code travels back to the collector for the summary
    code // => 200 every time, counted twenty times below
} // => call ends: one number per task, order decided by the collector

#[tokio::main] // => the multithread runtime runs the twenty tasks at once
async fn main() {
    // => build once, share the router across twenty spawned tasks
    let app = app(); // => the service under test, built by its constructor
    // => spawn twenty drivers; each returns its status code
    let mut tasks = Vec::new(); // => the join handles gather here
    // => twenty tasks stand in for twenty concurrent clients
    for _ in 1..=20 { // => twenty calls, no more, no fewer
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes are shared, not copied
        // => spawn runs the call on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { call(router).await })); // => twenty futures, one runtime, no sockets
    } // => spawn loop ends: all twenty tasks are racing now
    // => join every task and count the codes into the summary
    let mut ok = 0; // => 200s land here
    // => every other code would land here; none ever does
    let mut other = 0; // => stays zero: the summary proves it
    // => await each handle and sort its code into the right bucket
    for task in tasks { if task.await.unwrap() == 200 { ok += 1; } else { other += 1; } } // => unwrap: a panicked task fails the run loudly
    // => one golden line: twenty concurrent calls, twenty 200s, zero others
    println!("load: 20 concurrent calls -> ok={ok} other={other}"); // => ok=20 other=0: the stable summary of the race
} // => main ends: twenty calls counted, so the run is green
```

**Output** (`learning/code/ex-61-load-check-prints-a-stable-summary/expected/main.stdout.txt`):

```text
load: 20 concurrent calls -> ok=20 other=0
```

**Key takeaway**: Return codes from tasks, count them into buckets, print one summary line: load proof without jumble.

**Why it matters**: Load tests that print per call either flake on order or drown in lines — a thousand calls print a thousand lines nobody reads. One summary line states the verdict: how many ran, how many held, how many strayed. The `other` bucket is the honest part: it stays zero here, but its presence means the test would report strays instead of hiding them. This closes the concurrency cluster: fan out, share safely, bound the queue, move blocking work aside, then summarize the race.

---

### Example 62: Shutdown Starts with a Signal

A `oneshot` channel stands in for SIGTERM: send once, the service stops. This example serves one live call, sends the signal string, awaits it the way `serve` awaits `ctrl_c`, and prints the retirement line.

Signals live outside handlers in `main`: the service answers until the signal lands, then retirement starts. Naming the signal in the golden keeps the sequence explicit — serve, signal, stop — instead of implying it.

(Concepts: co-08.)

```mermaid
flowchart TD
    accTitle: Signal start, example 62
    accDescr: Serve once, signal once, retire.
    serve --> signal
    signal --> retire
    serve[\"serve\"]:::blue
    signal[\"SIGTERM\"]:::orange
    retire[\"retire\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-62-shutdown-starts-with-a-signal/src/main.rs`**:

```rust
// Example 62: Shutdown Starts with a Signal.
// a oneshot channel stands in for SIGTERM: send once, the service stops.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the route the signal retires
use serde_json::{Value, json}; // => json! builds the hello body inline
use tokio::sync::oneshot; // => oneshot carries the single shutdown signal
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers while the service runs: the signal ends this, not the code
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting the signal retires
} // => handler ends: shutdown lives outside handlers, in main

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route stands in for the whole service the signal stops
    Router::new().route("/hello", get(hello)) // => GET /hello answers until the signal lands
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the signal
async fn main() {
    // => build once, serve once, then retire on the signal
    let app = app(); // => the service under test, built by its constructor
    // => the oneshot channel is the SIGTERM stand-in: one send, one stop
    let (stop_tx, stop_rx) = oneshot::channel::<&str>(); // => &str names the signal for the golden line
    // => one live call proves the service answers before the signal
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => the last call before retirement
    // => the request drives the live service in-process, without any socket
    let response = app.oneshot(request).await.unwrap(); // => 200: the service is up
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line: the service answered before the signal
    println!("before signal -> {status} {}", String::from_utf8_lossy(&bytes)); // => 200 with the greeting: up, then retiring
    // => the platform sends SIGTERM: the demo sends the string instead
    stop_tx.send("SIGTERM").unwrap(); // => one send: the signal cannot repeat
    // => the service awaits the signal the way serve awaits ctrl_c
    let signal = stop_rx.await.unwrap(); // => SIGTERM arrives: retirement starts here
    // => one golden line: the signal landed, accepting stops, draining starts
    println!("signal received: {signal}; accepting stops, 0 in-flight, exiting"); // => the shutdown sequence in one line
} // => main ends: served once, retired on signal, so the run is green
```

**Output** (`learning/code/ex-62-shutdown-starts-with-a-signal/expected/main.stdout.txt`):

```text
before signal -> 200 OK {"message":"hello, axum"}
signal received: SIGTERM; accepting stops, 0 in-flight, exiting
```

**Key takeaway**: A `oneshot` channel stands in for SIGTERM; the service serves until the send, then retires.

**Why it matters**: Shutdown starts with a signal, and modeling the signal as a channel value makes it testable: send the string, watch retirement start, assert the sequence. Keeping shutdown in `main` — never in handlers — means business logic stays unaware of lifecycle: handlers serve, `main` retires. Every example in this cluster reuses this signal shape and adds one retirement step.

---

### Example 63: In-Flight Requests Drain First

Three spawned calls finish before retirement: shutdown waits, never drops. This example launches three in-flight calls, lands the signal mid-flight, joins all three, and prints the sorted finish lines before the clean-exit line.

Draining is the difference between graceful and abrupt: in-flight work completes instead of dying mid-write. The join is the drain — awaiting every handle before exiting — and the sorted lines prove nothing dropped.

(Concepts: co-08, co-07.)

**`learning/code/ex-63-in-flight-requests-drain-first/src/main.rs`**:

```rust
// Example 63: In-Flight Requests Drain First.
// three spawned calls finish before retirement: shutdown waits, never drops.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Clone lets every in-flight call own the router it drives
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers every in-flight call with the same fixed greeting
async fn hello() -> Json<Value> {
    // => no state, no lock: the handler is trivially safe under shutdown load
    Json(json!({"message": "hello, axum"})) // => three in-flight calls hear the same greeting
} // => handler ends: draining means letting these finish, not killing them

// => app builds the service once; every in-flight call reuses this constructor
fn app() -> Router {
    // => Clone on Router shares the routes: in-flight calls never rebuild wiring
    Router::new().route("/hello", get(hello)) // => one route, three in-flight drivers
} // => constructor ends: wiring stays separate from traffic

// => call drives one in-flight request and returns its greeting line
async fn call(app: Router, n: usize) -> String {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => the same call every in-flight task makes
    // => oneshot runs routing and handlers exactly as live, on this task
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the line carries the task number so the sort below orders the goldens
    format!("in-flight-{n} finished -> {status} {}", String::from_utf8_lossy(&bytes)) // => returned, not printed: the drain prints below
} // => call ends: one line per in-flight task, order decided by the collector

#[tokio::main] // => the multithread runtime runs the in-flight calls at once
async fn main() {
    // => build once, launch three in-flight calls, then retire around them
    let app = app(); // => the service under test, built by its constructor
    // => spawn three in-flight calls before the signal lands
    let mut tasks = Vec::new(); // => the drain handles gather here
    // => three tasks stand in for three requests mid-flight at SIGTERM
    for n in 1..=3 { // => in-flight 1 through 3, in spawn order
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes are shared, not copied
        // => spawn runs the call on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { call(router, n).await })); // => three futures racing the signal
    } // => spawn loop ends: three calls are in flight now
    // => the signal lands mid-flight: retirement starts, but the drain waits
    println!("signal received: SIGTERM; draining 3 in-flight, accepting stopped"); // => golden line one: retirement starts, nothing drops
    // => join every in-flight call before exiting: the drain in one loop
    let mut lines = Vec::new(); // => the lines land in completion order, not task order
    // => await each handle; every in-flight call finishes, none is dropped
    for task in tasks { lines.push(task.await.unwrap()); } // => unwrap: a dropped call would fail the run loudly
    // => sort makes the drain golden-stable: the same three lines, every run
    lines.sort(); // => in-flight-1 through in-flight-3, regardless of finish order
    // => print the drained lines: the proof nothing dropped mid-flight
    for line in lines { println!("{line}"); } // => three finished lines after the signal line
    // => one golden line: the drain completed, retirement may exit
    println!("drained 3 in-flight; exiting clean"); // => shutdown waited, so the run is green
} // => main ends: three calls drained, zero dropped, so the run is green
```

**Output** (`learning/code/ex-63-in-flight-requests-drain-first/expected/main.stdout.txt`):

```text
signal received: SIGTERM; draining 3 in-flight, accepting stopped
in-flight-1 finished -> 200 OK {"message":"hello, axum"}
in-flight-2 finished -> 200 OK {"message":"hello, axum"}
in-flight-3 finished -> 200 OK {"message":"hello, axum"}
drained 3 in-flight; exiting clean
```

**Key takeaway**: Spawn in-flight work, land the signal, join every handle before exiting: the drain is one loop.

**Why it matters**: Dropped in-flight requests are lost writes and confused clients: a payment that charged but never confirmed. Joining every handle before exiting guarantees each started call finishes — the drain is the promise graceful shutdown makes. Printing the signal line first proves the order: retirement starts, work completes, exit lands. Without the drain, shutdown is just a fast crash.

---

### Example 64: New Requests Stop at the Gate

An `AtomicBool` gate refuses late calls with 503 while the drain finishes. This example serves one call through the open gate, flips the bit like SIGTERM would, then refuses the late call at the gate with the shared envelope.

The gate separates new work from in-flight work: the drain finishes what started, the gate stops what hasn't. Late callers get a retryable 503 — not a hang, not a drop — so balancers can reroute them to a live process.

(Concepts: co-08.)

**`learning/code/ex-64-new-requests-stop-at-the-gate/src/main.rs`**:

```rust
// Example 64: New Requests Stop at the Gate.
// an AtomicBool gate refuses late calls with 503 while the drain finishes.
use std::sync::{Arc, atomic::{AtomicBool, Ordering}}; // => Arc shares the gate; the bool flips once at SIGTERM
use axum::{Router, body::Body, extract::State, http::{Request, StatusCode}, response::Json, routing::get}; // => the gate handler answers 200 open or 503 shutting
use serde_json::{Value, json}; // => json! builds the open and shutting replies inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one gate every call reads
#[derive(Clone)] // => Clone shares the Arc, never the bool: cheap by design
struct AppState {
    // => true means retiring: late calls stop here instead of reaching handlers
    shutting_down: Arc<AtomicBool>, // => false while serving, true after the signal
} // => struct ends: the gate as a single shared bit

// => gated answers through the gate: open serves, shutting refuses
async fn gated(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // => the gate is read per call: no lock, no race, just one atomic load
    if state.shutting_down.load(Ordering::SeqCst) { // => true means the signal already landed
        // => 503 tells late callers to retry elsewhere, with the shared envelope
        return (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"error": "shutting_down"}))); // => refused at the gate: handlers never run
    } // => gate open: fall through to the served reply below
    // => 200 serves the call that arrived before the signal
    (StatusCode::OK, Json(json!({"served": true}))) // => served means the gate was open
} // => handler ends: the gate decides, the handler obeys

// => build_app wires the service around the shared gate
fn build_app(gate: Arc<AtomicBool>) -> Router {
    // => the gate arrives from outside: main flips it like SIGTERM would
    Router::new().route("/gated", get(gated)).with_state(AppState { shutting_down: gate }) // => one gate, every call reads it
} // => constructor ends: the gate is shared, not copied

// => call serves one gated probe and prints its status line
async fn call(app: Router, label: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/gated").body(Body::empty()).unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the gate, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => 200 open, 503 shutting
    // => status names what happened; the body carries served or the envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: leg name, status, reply
    println!("{label} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the gate demo
async fn main() {
    // => the gate lives outside: main and the service share it
    let gate = Arc::new(AtomicBool::new(false)); // => open: calls serve before the signal
    // => the service wraps the shared gate; main keeps its own handle to it
    let app = build_app(gate.clone()); // => one gate, two holders of the Arc
    // => leg one: gate open, the call serves with 200
    call(app.clone(), "gate open").await; // => Output: 200 {"served":true}
    // => SIGTERM lands: the gate flips once and never flips back
    gate.store(true, Ordering::SeqCst); // => the signal in one atomic store
    // => one golden line: the flip itself, printed as the retirement marker
    println!("signal received: SIGTERM; gate closed, draining"); // => retirement starts: late calls stop here
    // => leg two: gate shut, the late call meets 503 at the gate
    call(app.clone(), "gate shut").await; // => Output: 503 {"error":"shutting_down"}
} // => main ends: served once, refused once, so the run is green
```

**Output** (`learning/code/ex-64-new-requests-stop-at-the-gate/expected/main.stdout.txt`):

```text
gate open -> 200 OK {"served":true}
signal received: SIGTERM; gate closed, draining
gate shut -> 503 Service Unavailable {"error":"shutting_down"}
```

**Key takeaway**: One atomic bit gates new work after the signal; late calls meet 503 while in-flight work drains.

**Why it matters**: Shutdown has two populations — started calls that must finish and new calls that must not start — and the gate tells them apart with one load per call. Without the gate, the drain never ends: new work keeps arriving while old work finishes. The 503 is the kind refusal: retryable, immediate, and honest about the process going away.

---

### Example 65: Shutdown Has a Deadline

`timeout` bounds the drain: stuck tasks are abandoned, the exit is on time. This example serves one live call, lands the signal, then races a wedged drain against 50 milliseconds — the deadline wins, one task is abandoned, the exit stays prompt.

Deadlines bound the worst case: without one, a single wedged connection hangs retirement forever and the orchestrator kills the process mid-write. Abandoning is a deliberate trade — one stuck task for a prompt exit — and the golden states it plainly.

(Concepts: co-08, co-05.)

**`learning/code/ex-65-shutdown-has-a-deadline/src/main.rs`**:

```rust
// Example 65: Shutdown Has a Deadline.
// timeout bounds the drain: stuck tasks are abandoned, the exit is on time.
use std::time::Duration; // => Duration names the 50ms deadline without any clock read
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the route the deadline demo circles
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers the single route the deadline demo serves before retiring
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting the deadline retires
} // => handler ends: the deadline lives outside handlers, in main

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route stands in for the whole service the deadline stops
    Router::new().route("/hello", get(hello)) // => GET /hello answers until retirement
} // => constructor ends: wiring stays separate from traffic

// => stuck pretends to be the drain that never finishes: SIGTERM cannot wait forever
async fn stuck() -> &'static str {
    // => five seconds of sleep stands in for the wedged connection
    tokio::time::sleep(Duration::from_secs(5)).await; // => dropped on deadline: the sleep never finishes
    // => unreachable under the 50ms deadline: timeout abandons this first
    "stuck finished" // => this line never prints in the golden output
} // => stuck ends: the deadline owns it, not the other way around

#[tokio::main] // => the async runtime drives the deadline demo
async fn main() {
    // => build once, serve once, then retire against the deadline
    let app = app(); // => the service under test, built by its constructor
    // => one live call proves the service answers before the signal
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => the last call before retirement
    // => the request drives the live service in-process, without any socket
    let response = app.oneshot(request).await.unwrap(); // => 200: the service is up
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line: the service answered before the signal
    println!("before signal -> {status} {}", String::from_utf8_lossy(&bytes)); // => 200 with the greeting: up, then retiring
    // => the signal lands with a 50ms deadline: the drain must finish or be abandoned
    println!("signal received: SIGTERM; draining with a 50ms deadline"); // => golden line: retirement starts against the clock
    // => timeout races the stuck drain against the deadline
    match tokio::time::timeout(Duration::from_millis(50), stuck()).await { // => Ok means drained in time; Err means the deadline won
        // => drained in time: unreachable here, kept for the honest shape
        Ok(done) => println!("drained in time: {done}"), // => this arm never prints in the golden output
        // => the deadline won: one task abandoned, the exit stays on time
        Err(_) => println!("deadline hit: 1 task abandoned; exiting on time"), // => golden line: bounded retirement, no hang
    } // => match ends: either way the exit is prompt and printed
} // => main ends: served once, bounded once, so the run is green
```

**Output** (`learning/code/ex-65-shutdown-has-a-deadline/expected/main.stdout.txt`):

```text
before signal -> 200 OK {"message":"hello, axum"}
signal received: SIGTERM; draining with a 50ms deadline
deadline hit: 1 task abandoned; exiting on time
```

**Key takeaway**: `timeout(50ms, drain)` bounds retirement; the wedged task is abandoned and the exit stays prompt.

**Why it matters**: Drains without deadlines hang on the first wedged connection, and orchestrators answer hangs with kills — mid-write, mid-flush, mid-everything. A deadline converts the unbounded wait into a bounded choice: finish in time or be abandoned, either way the exit lands on schedule. Testing the deadline costs 50 milliseconds because `timeout` drops the sleep — the five-second wedge never actually waits.

---

### Example 66: Health Goes Unready Before Stopping

The probe flips to 503 first: the balancer drains traffic, then the exit lands. This example serves ready, flips the readiness bit like SIGTERM would, then serves unready — the rotation change before the retirement.

Unready-before-exit is the polite shutdown: the balancer stops sending new work while in-flight work drains. Flipping readiness first and exiting last keeps every started call served and every new call routed elsewhere.

(Concepts: co-08, co-14.)

**`learning/code/ex-66-health-goes-unready-before-stopping/src/main.rs`**:

```rust
// Example 66: Health Goes Unready Before Stopping.
// the probe flips to 503 first: the balancer drains traffic, then the exit lands.
use std::sync::{Arc, atomic::{AtomicBool, Ordering}}; // => Arc shares the readiness flag; the bool flips once at SIGTERM
use axum::{Router, body::Body, extract::State, http::{Request, StatusCode}, response::Json, routing::get}; // => the probe answers 200 ready or 503 unready
use serde_json::{Value, json}; // => json! builds the ready and unready replies inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one readiness flag the probe reads
#[derive(Clone)] // => Clone shares the Arc, never the bool: cheap by design
struct AppState {
    // => true means serving: the balancer keeps sending traffic while set
    ready: Arc<AtomicBool>, // => true at boot, false the moment retirement starts
} // => struct ends: readiness as a single shared bit

// => health answers the probe the balancer calls between traffic decisions
async fn health(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // => the flag is read per probe: no lock, no race, just one atomic load
    if state.ready.load(Ordering::SeqCst) { // => true means traffic may keep flowing
        // => 200 keeps the balancer sending traffic to this process
        return (StatusCode::OK, Json(json!({"ready": true}))); // => ready: the serving reply
    } // => flag down: fall through to the unready leg below
    // => 503 pulls the process out of rotation before the exit lands
    (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"ready": false}))) // => unready: drain me, then I exit
} // => handler ends: the probe decides rotation, nothing else

// => build_app wires the probe around the shared readiness flag
fn build_app(ready: Arc<AtomicBool>) -> Router {
    // => the flag arrives from outside: main flips it like SIGTERM would
    Router::new().route("/healthz", get(health)).with_state(AppState { ready }) // => one flag, every probe reads it
} // => constructor ends: the flag is shared, not copied

// => probe serves one probe call and prints its status line
async fn probe(app: Router, label: &str) {
    // => Request::builder shapes a server-side probe without a client
    let request = Request::builder().method("GET").uri("/healthz").body(Body::empty()).unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the flag read, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => 200 ready, 503 retiring
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: leg name, status, readiness reply
    println!("{label} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => probe ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the readiness demo
async fn main() {
    // => the flag lives outside: main and the service share it
    let ready = Arc::new(AtomicBool::new(true)); // => ready at boot: traffic flows from the first probe
    // => the service wraps the shared flag; main keeps its own handle to it
    let app = build_app(ready.clone()); // => one flag, two holders of the Arc
    // => leg one: flag up, the probe keeps the process in rotation
    probe(app.clone(), "serving").await; // => Output: 200 {"ready":true}
    // => SIGTERM lands: readiness flips first, the exit comes after the drain
    ready.store(false, Ordering::SeqCst); // => the unready flip in one atomic store
    // => one golden line: the flip itself, printed as the retirement marker
    println!("signal received: SIGTERM; probe flips to unready, balancer drains"); // => rotation ends before the exit lands
    // => leg two: flag down, the probe pulls the process out of rotation
    probe(app.clone(), "retiring").await; // => Output: 503 {"ready":false}
} // => main ends: ready once, unready once, so the run is green
```

**Output** (`learning/code/ex-66-health-goes-unready-before-stopping/expected/main.stdout.txt`):

```text
serving -> 200 OK {"ready":true}
signal received: SIGTERM; probe flips to unready, balancer drains
retiring -> 503 Service Unavailable {"ready":false}
```

**Key takeaway**: Flip readiness to 503 first, drain after: the balancer reroutes while in-flight work finishes.

**Why it matters**: Exiting while in rotation drops the calls the balancer already sent: they arrive at a dying process and die with it. Unready-first gives the balancer one probe interval to reroute — new work flows elsewhere while this process drains what it holds. The probe from Example 7 earns its keep here: the same route that reported readiness now reports retirement.

---

### Example 67: State Flushes Before Exit

Retirement writes the book out: three buffered rows print as flushed proof. This example buffers three rows through the real stack, lands the signal, then flushes the shared book instead of dropping it.

Flushes save what the drain cannot: completed work sitting in memory that no client has collected yet. Reading the shared book after the signal proves every buffered row survives retirement — three in, three out.

(Concepts: co-08, co-06.)

**`learning/code/ex-67-state-flushes-before-exit/src/main.rs`**:

```rust
// Example 67: State Flushes Before Exit.
// retirement writes the book out: three buffered rows print as flushed proof.
use std::sync::{Arc, Mutex}; // => Arc shares the book; Mutex guards its vector
use axum::{Router, body::Body, extract::{Path, State}, http::{Request, StatusCode}, response::Json, routing::{get, post}}; // => post buffers, flush reads: the two halves of retirement
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book retirement flushes
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    book: Arc<Mutex<Vec<String>>>, // => buffered rows wait here for the flush
} // => struct ends: the buffer retirement must not lose

// => buffer appends one id under a short lock and answers 201
async fn buffer(State(state): State<AppState>, Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    // => lock, push, measure: the critical section ends before the reply builds
    let size = { let mut book = state.book.lock().unwrap(); book.push(id); book.len() }; // => the lock drops at the closing brace
    // => 201 with the buffered count after this append
    (StatusCode::CREATED, Json(json!({"buffered": size}))) // => buffered 1 through 3 across the three posts
} // => handler ends: the lock never crosses an await

// => build_app wires the service around the shared book
fn build_app(book: Arc<Mutex<Vec<String>>>) -> Router {
    // => the book arrives from outside: main flushes it like retirement would
    Router::new().route("/buffer/{id}", post(buffer)).route("/orders", get(list)).with_state(AppState { book }) // => buffer and list live one router apart
} // => constructor ends: the book is shared, not copied

// => list clones the book under the lock and renders it in order
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => clone under the lock, render outside it: readers never block writers long
    let ids = state.book.lock().unwrap().clone(); // => the lock drops before rendering
    // => the listing echoes the buffered contents in buffer order
    Json(json!({"orders": ids})) // => three ids in order after the three posts
} // => handler ends: it borrows shared state but owns nothing

#[tokio::main] // => the async runtime drives the flush demo
async fn main() {
    // => the book lives outside: main and the service share it
    let book = Arc::new(Mutex::new(Vec::new())); // => empty buffer before the first post
    // => the service wraps the shared book; main keeps its own handle to it
    let app = build_app(book.clone()); // => one book, two holders of the Arc
    // => buffer three rows through the real stack before the signal
    for n in 1..=3 { // => o-1 through o-3, one post per row
        // => one append per row: the id rides in the path
        let uri = format!("/buffer/o-{n}"); // => o-1 through o-3, built per row
        // => Request::builder shapes a server-side request without a client
        let request = Request::builder().method("POST").uri(&uri).body(Body::empty()).unwrap(); // => posts carry no payload here
        // => the reply is drained, not printed: counts arrive in order anyway
        let response = app.clone().oneshot(request).await.unwrap(); // => the row buffers or the run panics
        // => drain the body so the response is fully consumed
        let _ = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => counts print once below, not three times
    } // => buffer loop ends: three rows wait in the book
    // => the signal lands: retirement flushes the book instead of dropping it
    println!("signal received: SIGTERM; flushing 3 buffered rows"); // => golden line: retirement starts with the flush
    // => the flush reads the shared book directly: the retirement write-out
    let flushed = book.lock().unwrap().clone(); // => the lock drops before printing
    // => one golden line: every buffered row survived to the flush
    println!("flushed {} rows: {}", flushed.len(), flushed.join(",")); // => flushed 3 rows: o-1,o-2,o-3
} // => main ends: buffered three, flushed three, so the run is green
```

**Output** (`learning/code/ex-67-state-flushes-before-exit/expected/main.stdout.txt`):

```text
signal received: SIGTERM; flushing 3 buffered rows
flushed 3 rows: o-1,o-2,o-3
```

**Key takeaway**: Buffer through the stack, then flush the shared book after the signal: three rows in, three rows out.

**Why it matters**: Draining finishes started calls, but buffered state — batches, queues, counters — outlives any single call and dies with the process unless retirement writes it out. Flushing is the step most shutdown checklists skip, and the one operators notice first: missing rows after a deploy mean the flush never ran. Three in, three out is the smallest proof the write-out works.

---

### Example 68: Shutdown Token Fans Out to Tasks

One `watch` sender retires three workers: every receiver sees the same flip. This example parks three workers on a watch channel, broadcasts one retirement flip, and prints the three sorted stop lines.

Fan-out beats one-channel-per-worker: a single broadcast retires the whole fleet without knowing how many workers exist. `watch` fits shutdown exactly — one current value, many receivers, last-write-wins semantics.

(Concepts: co-08, co-07.)

```mermaid
flowchart TD
    accTitle: Fan out, example 68
    accDescr: One flip retires three workers.
    tx --> w1[\"worker 1\"]
    tx --> w2[\"worker 2\"]
    tx --> w3[\"worker 3\"]
    w1 --> stop1[\"stopped\"]
    w2 --> stop2[\"stopped\"]
    w3 --> stop3[\"stopped\"]
    tx[\"broadcast\"]:::orange
    w1[\"worker 1\"]:::blue
    w2[\"worker 2\"]:::blue
    w3[\"worker 3\"]:::blue
    stop1[\"stopped\"]:::teal
    stop2[\"stopped\"]:::teal
    stop3[\"stopped\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-68-shutdown-token-fans-out-to-tasks/src/main.rs`**:

```rust
// Example 68: Shutdown Token Fans Out to Tasks.
// one watch sender retires three workers: every receiver sees the same flip.
use tokio::sync::watch; // => watch broadcasts the single retirement flip to every worker

// => worker waits for the flip, then prints its own stop line
async fn worker(n: usize, mut stop: watch::Receiver<bool>) -> String {
    // => changed waits for the next flip: the retirement broadcast
    let _ = stop.changed().await; // => Err would mean the sender dropped: still a stop
    // => the line carries the worker number so the sort below orders the goldens
    format!("worker-{n} stopped") // => returned, not printed: the collector prints below
} // => worker ends: one flip in, one stop line out

#[tokio::main] // => the async runtime drives the fan-out demo
async fn main() {
    // => the channel starts unretired: false means serve, true means stop
    let (stop_tx, stop_rx) = watch::channel(false); // => one sender, three receivers below
    // => spawn three workers; each watches the same retirement flip
    let mut tasks = Vec::new(); // => the stop lines gather here
    // => three workers stand in for three background loops at SIGTERM
    for n in 1..=3 { // => worker 1 through 3, in spawn order
        // => each worker subscribes to the same broadcast
        let rx = stop_rx.clone(); // => cheap clone: receivers share the channel
        // => spawn runs the worker on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { worker(n, rx).await })); // => three waiters, one flip coming
    } // => spawn loop ends: all three workers are waiting now
    // => the original receiver stays unused: drop it so only workers remain
    drop(stop_rx); // => the sender outlives this handle; workers hold the rest
    // => SIGTERM lands: one send retires every worker at once
    stop_tx.send(true).unwrap(); // => the fan-out in one broadcast
    // => one golden line: the flip itself, printed as the retirement marker
    println!("signal received: SIGTERM; broadcast stop to 3 workers"); // => retirement fans out from here
    // => join every worker and collect the three stop lines
    let mut lines = Vec::new(); // => the lines land in wake order, not worker order
    // => await each handle; every worker stopped, none is dropped
    for task in tasks { lines.push(task.await.unwrap()); } // => unwrap: a stuck worker fails the run loudly
    // => sort makes the fan-out golden-stable: the same three lines, every run
    lines.sort(); // => worker-1 through worker-3, regardless of wake order
    // => print the stop lines: the proof every worker saw the flip
    for line in lines { println!("{line}"); } // => three stopped lines after the signal line
} // => main ends: one flip, three stops, so the run is green
```

**Output** (`learning/code/ex-68-shutdown-token-fans-out-to-tasks/expected/main.stdout.txt`):

```text
signal received: SIGTERM; broadcast stop to 3 workers
worker-1 stopped
worker-2 stopped
worker-3 stopped
```

**Key takeaway**: One `watch` broadcast retires every worker; sorted stop lines prove all three saw the flip.

**Why it matters**: Background loops — pollers, flushers, reconcilers — outlive requests and must retire with the process, or they hold resources past the exit. Fan-out retires them together without the shutdown code counting heads: workers subscribe, one flip stops all. The sorted stop lines prove the whole fleet retired — a missing line would mean a worker is still running past shutdown.

---

### Example 69: Double Signal Forces the Exit

The first SIGTERM drains gracefully; the second SIGTERM skips the wait. This example delivers two signals through a channel and answers each in order: the first starts the deadline drain, the second forces the exit.

Operators send the second signal when patience runs out: deploys stall, rollbacks wait, and graceful becomes wedged. Honoring the double signal keeps the operator in control — the service hurries instead of hanging.

(Concepts: co-08.)

**`learning/code/ex-69-double-signal-forces-the-exit/src/main.rs`**:

```rust
// Example 69: Double Signal Forces the Exit.
// the first SIGTERM drains gracefully; the second SIGTERM skips the wait.
use tokio::sync::mpsc; // => mpsc carries the two signals in arrival order

#[tokio::main] // => the async runtime drives the double-signal demo
async fn main() {
    // => the channel carries both signals: graceful first, forced second
    let (sig_tx, mut sig_rx) = mpsc::channel::<&str>(2); // => room for two: no send ever waits
    // => the platform delivers SIGTERM twice: patience, then insistence
    sig_tx.send("SIGTERM").await.unwrap(); // => first signal: drain gracefully
    // => the operator loses patience and sends SIGTERM again
    sig_tx.send("SIGTERM").await.unwrap(); // => second signal: stop waiting, exit now
    // => the sender drops: the loop below ends after the second signal
    drop(sig_tx); // => closing the channel bounds the signal loop
    // => the service reads its signals in order and answers each one
    let mut seen = 0; // => counts the signals: one means drain, two means force
    // => recv returns each signal in arrival order until the channel closes
    while let Some(signal) = sig_rx.recv().await { // => two iterations, then None ends the loop
        // => count first: the arm below branches on first versus second
        seen += 1; // => 1 for graceful, 2 for forced
        // => the first signal starts the graceful drain with its deadline
        if seen == 1 { println!("{signal} #1: draining with a deadline"); continue; } // => golden line one: patience starts
        // => the second signal skips the wait: the exit is immediate
        println!("{signal} #2: deadline skipped; forcing the exit"); // => golden line two: patience ends
    } // => loop ends: the channel closed after two signals
    // => one golden line: the forced exit after two signals, printed last
    println!("exited after {seen} signals: graceful first, forced second"); // => the double-signal contract in one line
} // => main ends: drained once, forced once, so the run is green
```

**Output** (`learning/code/ex-69-double-signal-forces-the-exit/expected/main.stdout.txt`):

```text
SIGTERM #1: draining with a deadline
SIGTERM #2: deadline skipped; forcing the exit
exited after 2 signals: graceful first, forced second
```

**Key takeaway**: Count signals: the first starts the deadline drain, the second skips it and forces the exit.

**Why it matters**: Graceful shutdown assumes the drain finishes, and wedged drains break that assumption — the deploy queue backs up behind one stuck process. The second signal is the operator's override: stop being graceful, exit now. Handling it keeps the worst case bounded at two signals instead of a kill -9: the process still prints its last line and flushes what it can on the way out.

---

### Example 70: Shutdown Checklist in One Service

Unready flip, gate shut, drain, flush: the full retirement in order. This example retires one service through all four steps — probe to 503, gate to 503, zero in-flight drained, two rows flushed — and prints the completion line.

Order is the checklist: unready before gate (rotation first), gate before drain (no new work), drain before flush (calls finish writing), flush before exit (memory lands). Skipping or shuffling steps drops work or hangs the exit.

(Concepts: co-08, co-14.)

```mermaid
flowchart TD
    accTitle: Checklist, example 70
    accDescr: Unready, gate, drain, flush, exit.
    sig --> unready
    unready --> gate
    gate --> drain
    drain --> flush
    flush --> exit
    sig[\"SIGTERM\"]:::orange
    unready[\"unready\"]:::blue
    gate[\"gate\"]:::blue
    drain[\"drain\"]:::teal
    flush[\"flush\"]:::teal
    exit[\"exit\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-70-shutdown-checklist-in-one-service/src/main.rs`**:

```rust
// Example 70: Shutdown Checklist in One Service.
// unready flip, gate shut, drain, flush: the full retirement in order.
use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}}; // => Arc shares book and flags; atomics flip once at SIGTERM
use axum::{Router, body::Body, extract::State, http::{Request, StatusCode}, response::Json, routing::get}; // => State unpacks the checklist world per call
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => World is the whole retirement story in one shared value
#[derive(Clone)] // => Clone shares the Arcs, never the rows: cheap by design
struct World {
    // => buffered rows wait here for the retirement flush
    book: Arc<Mutex<Vec<String>>>, // => seeded below, flushed at the end
    // => true means serving: the probe answers 200 while set
    ready: Arc<AtomicBool>, // => flipped down first at SIGTERM
    // => true means retiring: late calls meet 503 at the gate
    shutting_down: Arc<AtomicBool>, // => flipped up second at SIGTERM
} // => struct ends: buffer, readiness, and gate in one value

// => status answers the probe through the readiness flag
async fn status(State(world): State<World>) -> (StatusCode, Json<Value>) {
    // => the flag is read per probe: one atomic load, no lock
    if world.ready.load(Ordering::SeqCst) { // => true means traffic may keep flowing
        // => 200 keeps the balancer sending traffic to this process
        return (StatusCode::OK, Json(json!({"ready": true}))); // => ready: the serving reply
    } // => flag down: fall through to the unready leg below
    // => 503 pulls the process out of rotation before the exit lands
    (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"ready": false}))) // => unready: drain me, then I exit
} // => handler ends: the probe decides rotation, nothing else

// => work answers through the gate: open serves, shutting refuses
async fn work(State(world): State<World>) -> (StatusCode, Json<Value>) {
    // => the gate is read per call: late calls stop here after the flip
    if world.shutting_down.load(Ordering::SeqCst) { // => true means the signal already landed
        // => 503 tells late callers to retry elsewhere, with the shared envelope
        return (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"error": "shutting_down"}))); // => refused at the gate
    } // => gate open: fall through to the served reply below
    // => 200 serves the call that arrived before the signal
    (StatusCode::OK, Json(json!({"served": true}))) // => served means the gate was open
} // => handler ends: the gate decides, the handler obeys

// => build_app wires the checklist service around the shared world
fn build_app(world: World) -> Router {
    // => probe and work share one world: flags and book travel together
    Router::new().route("/healthz", get(status)).route("/work", get(work)).with_state(world) // => rotation plus gate in one router
} // => constructor ends: the world is shared, not copied

// => call serves one checklist probe and prints its status line
async fn call(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri(uri).body(Body::empty()).unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the flags, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => flags decide each leg's answer
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: path, status, reply
    println!("GET {uri} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the checklist demo
async fn main() {
    // => the world lives outside: main and the service share it
    let world = World { book: Arc::new(Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()])), ready: Arc::new(AtomicBool::new(true)), shutting_down: Arc::new(AtomicBool::new(false)) }; // => two rows buffered, ready up, gate open
    // => the service wraps the shared world; main keeps its own handle to it
    let app = build_app(world.clone()); // => one world, two holders of the Arcs
    // => step zero: the serving world answers ready and serves work
    call(app.clone(), "/healthz").await; // => Output: 200 {"ready":true}
    // => the same serving world serves work through the open gate
    call(app.clone(), "/work").await; // => Output: 200 {"served":true}
    // => SIGTERM lands: the checklist runs in order from here
    println!("signal received: SIGTERM; running the retirement checklist"); // => golden line: retirement starts
    // => step one: the probe flips to unready, pulling rotation first
    world.ready.store(false, Ordering::SeqCst); // => the unready flip in one atomic store
    // => the retiring probe answers 503 with the unready body
    call(app.clone(), "/healthz").await; // => Output: 503 {"ready":false}
    // => step two: the gate shuts, refusing late work with 503
    world.shutting_down.store(true, Ordering::SeqCst); // => the gate flip in one atomic store
    // => late work stops at the gate with the shared envelope
    call(app.clone(), "/work").await; // => Output: 503 {"error":"shutting_down"}
    // => step three: the drain finds no in-flight calls, so it completes at once
    println!("drained 0 in-flight; nothing to wait for"); // => golden line: the drain in one step
    // => step four: the flush writes the buffered rows out instead of dropping them
    let flushed = world.book.lock().unwrap().clone(); // => the lock drops before printing
    // => one golden line: every buffered row survived to the flush
    println!("flushed {} rows: {}", flushed.len(), flushed.join(",")); // => flushed 2 rows: o-1,o-2
    // => the checklist ends: retirement completed in order, exit is clean
    println!("shutdown complete: unready, gated, drained, flushed"); // => the four steps in one line
} // => main ends: the checklist ran in order, so the run is green
```

**Output** (`learning/code/ex-70-shutdown-checklist-in-one-service/expected/main.stdout.txt`):

```text
GET /healthz -> 200 OK {"ready":true}
GET /work -> 200 OK {"served":true}
signal received: SIGTERM; running the retirement checklist
GET /healthz -> 503 Service Unavailable {"ready":false}
GET /work -> 503 Service Unavailable {"error":"shutting_down"}
drained 0 in-flight; nothing to wait for
flushed 2 rows: o-1,o-2
shutdown complete: unready, gated, drained, flushed
```

**Key takeaway**: Retire in order — unready, gate, drain, flush — and print the completion line last.

**Why it matters**: Shutdown checklists fail in ordering, not in steps: every team remembers the drain and forgets that rotation must end first. This example is the order reference — eight golden lines that read as the procedure. New services copy the checklist and adapt the flush; operators read the completion line in logs to confirm retirement instead of assuming it. This closes the shutdown cluster: signal, drain, gate, deadline, unready, flush, fan-out, force, checklist.

---

### Example 71: Routing Axum Macros Versus Decorators

Axum binds verb plus path with method routers; FastAPI decorates a function with the verb plus path. This example drives both verbs of one path through method routing, showing the axum side as values while the lesson carries the FastAPI mirror as an illustration.

Both frameworks map verb plus path to handler: axum says it in constructor code with `get` and `post`, FastAPI says it above the function with `@app.get` and `@app.post`. The observable contract — two verbs, one path, distinct handlers — is identical.

(Concepts: co-16, co-01.)

```mermaid
flowchart TD
    accTitle: Two styles, example 71
    accDescr: Values versus decorators, same map.
    axum --> map
    fastapi --> map
    map --> verbs
    axum[\"axum\"]:::blue
    fastapi[\"fastapi\"]:::orange
    map[\"verb+path\"]:::teal
    verbs[\"handlers\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/orders")
def list_orders():
    return {"orders": ["o-1"]}


@app.post("/orders", status_code=201)
def create_order():
    return {"created": True}
```

**`learning/code/ex-71-routing-axum-macros-vs-decorators/src/main.rs`**:

```rust
// Example 71: Routing Axum Macros Versus Decorators.
// axum binds verb plus path with routing::get; FastAPI decorates a function.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get opens the chain; post chains beside it below
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers reads: the GET leg of the verb-plus-path pair
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"orders": ["o-1"]})) // => the read contract both frameworks promise
} // => handler ends: reads never change state in either framework

// => create answers writes: the POST leg beside the GET leg
async fn create() -> (axum::http::StatusCode, Json<Value>) {
    // => the tuple sets the status beside the body in one return
    (axum::http::StatusCode::CREATED, Json(json!({"created": true}))) // => 201 says a resource now exists
} // => handler ends: the status is part of the contract here

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => method routing: verb plus path picks the handler, in code not comments
    Router::new().route("/orders", get(list).post(create)) // => one path, two verbs, two plain functions
} // => constructor ends: no decorator, no registry, just values

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => empty payload: routing needs no body here
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries each leg's reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both legs write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, drive both verbs against the one path
    let app = app(); // => the service under test, built by its constructor
    // => GET reads the collection through method routing
    check(app.clone(), "GET", "/orders").await; // => Output: GET /orders -> 200 OK {"orders":["o-1"]}
    // => POST writes through the same path with a different verb
    check(app.clone(), "POST", "/orders").await; // => Output: POST /orders -> 201 Created {"created":true}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-71-routing-axum-macros-vs-decorators/expected/main.stdout.txt`):

```text
GET /orders -> 200 OK {"orders":["o-1"]}
POST /orders -> 201 Created {"created":true}
```

**Key takeaway**: Axum maps verb plus path in constructor values; FastAPI maps it in decorators; the contract is identical.

**Why it matters**: Teams choosing between frameworks compare routing first, and the comparison favors honesty over advocacy: same map, different spelling. Values compose — routers merge, nest, and layer as data — while decorators register into a global app, which is why axum tests build routers per case and FastAPI tests override dependencies per case. Knowing both spellings lets you read either codebase on day one.

---

### Example 72: Extractors Versus Injected Parameters

Axum parses at the boundary into typed values; FastAPI injects annotated parameters with `Depends`. This example parses a path id plus a query limit through two extractors, showing the axum side as handler arguments while the lesson carries the FastAPI mirror as an illustration.

Both frameworks keep parsing out of handlers: axum delivers parsed values positionally, FastAPI delivers them by annotation. The observable contract — typed id, defaulted limit, rejection before logic — is identical.

(Concepts: co-16, co-03.)

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/orders/{id}")
def read_order(id: int, limit: int = 10):
    return {"id": id, "limit": limit}
```

**`learning/code/ex-72-extractors-vs-injected-parameters/src/main.rs`**:

```rust
// Example 72: Extractors Versus Injected Parameters.
// axum parses at the boundary into typed values; FastAPI injects annotated params.
use axum::{Router, body::Body, extract::{Path, Query}, http::Request, response::Json, routing::get}; // => Path and Query parse before the handler runs
use serde::Deserialize; // => Deserialize reads the query string into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Search names the query shape: one optional knob with a handler default
#[derive(Deserialize)] // => axum fills this from the query string on every call
struct Search {
    // => None means the client skipped ?limit: ten rows answer
    limit: Option<usize>, // => ten is the default, not the contract
} // => struct ends: the query shape is now a compile-time fact

// => order parses its id from the path and its limit from the query, together
async fn order(Path(id): Path<u32>, Query(search): Query<Search>) -> Json<Value> {
    // => both values arrive already typed: parsing finished before this line
    Json(json!({"id": id, "limit": search.limit.unwrap_or(10)})) // => the echo proves both extractors ran
} // => handler ends: two extractors, zero manual parsing

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the read; both extractors ride along for free
    Router::new().route("/orders/{id}", get(order)) // => GET /orders/{id}?limit= parses twice per call
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => path plus query string, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, both extractors, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => parsing happens before the handler, or 4xx answers
    // => status names what happened; the body carries the extractor echo
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON or text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every leg writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, parse the full call and the default call
    let app = app(); // => the service under test, built by its constructor
    // => id plus limit both parse: the echo carries both values
    check(app.clone(), "GET", "/orders/7?limit=3").await; // => Output: 200 {"id":7,"limit":3}
    // => limit omitted: the handler default of ten applies
    check(app.clone(), "GET", "/orders/7").await; // => Output: 200 {"id":7,"limit":10}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-72-extractors-vs-injected-parameters/expected/main.stdout.txt`):

```text
GET /orders/7?limit=3 -> 200 OK {"id":7,"limit":3}
GET /orders/7 -> 200 OK {"id":7,"limit":10}
```

**Key takeaway**: Axum extractors arrive positionally and parsed; FastAPI parameters arrive by annotation; both keep parsing out of handlers.

**Why it matters**: Boundary parsing is where framework ergonomics differ most visibly, and seeing both spellings side by side teaches the shared principle: handlers receive values, never text. The default handling differs in spelling only — `unwrap_or(10)` versus `= 10` — while the contract matches exactly. Porting endpoints between frameworks becomes mechanical once the parsing shapes line up like this.

---

### Example 73: Middleware Tower Layers Versus ASGI Stack

`from_fn` wraps axum routes; FastAPI wraps the ASGI app with `BaseHTTPMiddleware`. This example stamps one deterministic marker around the handler through a tower layer, showing the axum stack while the lesson carries the FastAPI mirror as an illustration.

Both frameworks run middleware outside-in around handlers: axum layers compose as values on the router, FastAPI middleware wraps the application object. The observable contract — entry marker, handler, exit marker — is identical.

(Concepts: co-16, co-02.)

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import FastAPI, Request

app = FastAPI()


@app.middleware("http")
async def stamp(request: Request, call_next):
    print("enter stamp")
    response = await call_next(request)
    print("exit stamp")
    return response


@app.get("/hello")
def hello():
    print("handler")
    return {"message": "hello, axum"}
```

**`learning/code/ex-73-middleware-tower-layers-vs-asgi-stack/src/main.rs`**:

```rust
// Example 73: Middleware Tower Layers Versus ASGI Stack.
// from_fn wraps axum routes; FastAPI wraps the ASGI app with BaseHTTPMiddleware.
use axum::{Router, body::Body, http::Request, middleware::{self, Next}, response::{Json, Response}, routing::get}; // => from_fn lifts the timing function into the stack
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => stamp prints one deterministic marker around the handler: no clock inside
async fn stamp(req: Request<Body>, next: Next) -> Response {
    // => the entry marker prints before the inner stack runs
    println!("enter stamp"); // => golden line one: the layer started
    // => the handler runs exactly here, wrapped by this layer
    let response = next.run(req).await; // => everything inside runs between the two prints
    // => the exit marker prints after the handler answered
    println!("exit stamp"); // => golden line three: the layer finished
    // => the response continues outward untouched
    response // => layers observe by default; rewriting is opt-in
} // => middleware ends: two markers around one run, zero timestamps

// => hello answers the single route the stamp layer wraps
async fn hello() -> Json<Value> {
    // => the handler runs between the two layer markers
    println!("handler"); // => golden line two: the middle of the stack
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the layer exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: the stamp runs around the handler on every call
    Router::new().route("/hello", get(hello)).layer(middleware::from_fn(stamp)) // => from_fn lifts the function into the tower stack
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the markers are the whole lesson
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri("/hello") // => the single path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, the layer, and the handler exactly as live
    let _ = app.oneshot(request).await.unwrap(); // => the three markers above are the golden output
    // => the body line proves the handler ran between the two markers
    println!("served GET /hello with the stamp layer"); // => golden line four: the call the markers bracket
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call once, watch the stack print in wrap order
    let app = app(); // => the service under test, built by its constructor
    // => enter stamp, handler, exit stamp: the tower onion in three lines
    check(app.clone()).await; // => Output: the three markers plus the served line
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-73-middleware-tower-layers-vs-asgi-stack/expected/main.stdout.txt`):

```text
enter stamp
handler
exit stamp
served GET /hello with the stamp layer
```

**Key takeaway**: Tower layers wrap routes as values; ASGI middleware wraps the app object; both print entry, handler, exit.

**Why it matters**: Middleware composition is where framework designs diverge hardest: values compose per route, app wrappers apply globally. Axum's per-route layers mean different routes carry different stacks — auth on some, logging on all — while FastAPI's app middleware sees everything. The marker golden proves the axum order; the illustration shows the same three lines land in FastAPI too. Same onion, different peeling.

---

### Example 74: Errors IntoResponse Versus Exception Handlers

Axum returns `Result` with a responding error; FastAPI registers exception handlers on the app. This example reports absence and outage through one `AppError` enum, showing the axum error type while the lesson carries the FastAPI mirror as an illustration.

Both frameworks centralize failure rendering: axum in the error type's `IntoResponse` impl, FastAPI in `@app.exception_handler` functions. The observable contract — status plus shared envelope per failure — is identical.

(Concepts: co-16, co-05.)

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()


class NoOrder(Exception):
    pass


@app.exception_handler(NoOrder)
async def no_order_handler(request: Request, exc: NoOrder):
    return JSONResponse(status_code=404, content={"code": "no_order"})


@app.get("/read")
def read():
    raise NoOrder()
```

**`learning/code/ex-74-errors-into-response-vs-exception-handlers/src/main.rs`**:

```rust
// Example 74: Errors IntoResponse Versus Exception Handlers.
// axum returns Result with a responding error; FastAPI registers exception handlers.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::{IntoResponse, Json}, routing::get}; // => IntoResponse renders the error where Result leaves it
use serde_json::{Value, json}; // => json! builds the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppError names the two failures this service reports
enum AppError {
    // => the id names nothing in the store
    NoOrder, // => 404: absence, not a crash
    // => the store behind the handler gave up
    StoreDown, // => 503: retry later, not now
} // => enum ends: every failure is one of these two variants

// => IntoResponse renders each variant as status plus the shared envelope
impl IntoResponse for AppError {
    // => self is consumed: each error answers exactly once
    fn into_response(self) -> axum::response::Response {
        // => each variant picks its code and its machine-readable code
        let (status, code) = match self { // => match keeps the mapping total: no silent variant
            AppError::NoOrder => (StatusCode::NOT_FOUND, "no_order"), // => 404 for absence
            AppError::StoreDown => (StatusCode::SERVICE_UNAVAILABLE, "store_down"), // => 503 for outage
        }; // => the pair is decided: render it below
        // => every failure shares one envelope: code plus message
        (status, Json(json!({"code": code, "message": format!("request failed: {code}")}))).into_response() // => the envelope never changes shape
    } // => render ends: failures are responses with a contract
} // => impl ends: the error type is its own handler, registered by the return type

// => read fails with absence: the demo route for the 404 leg
async fn read() -> Result<Json<Value>, AppError> {
    // => Err leaves the handler early: no snapshot exists for this id
    Err(AppError::NoOrder) // => the envelope answers 404 below
} // => handler ends: Result keeps the happy path and the failure apart

// => report fails with outage: the demo route for the 503 leg
async fn report() -> Result<Json<Value>, AppError> {
    // => Err leaves the handler early: the store gave up behind this route
    Err(AppError::StoreDown) // => the envelope answers 503 below
} // => handler ends: one return type carries both outcomes

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => two routes demo the two variants through the same envelope
    Router::new().route("/read", get(read)).route("/report", get(report)) // => absence and outage live one router apart
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing and the error type exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the envelope renders for every variant
    // => status names what happened; the body carries the shared envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: envelopes are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both failures write the envelope, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: path, status, envelope
    println!("GET {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger absence and outage through one envelope
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 inside the shared envelope
    check(app.clone(), "/read").await; // => Output: 404 {"code":"no_order","message":"request failed: no_order"}
    // => outage answers 503 inside the same envelope shape
    check(app.clone(), "/report").await; // => Output: 503 {"code":"store_down","message":"request failed: store_down"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-74-errors-into-response-vs-exception-handlers/expected/main.stdout.txt`):

```text
GET /read -> 404 Not Found {"code":"no_order","message":"request failed: no_order"}
GET /report -> 503 Service Unavailable {"code":"store_down","message":"request failed: store_down"}
```

**Key takeaway**: Axum renders errors in the error type; FastAPI renders them in registered handlers; both centralize the envelope.

**Why it matters**: Centralized errors keep failure shapes stable as services grow: new failures join the existing type or registry instead of inventing prose. The axum version travels with the handler — `Result<Json, AppError>` shows the failure contract in the signature — while the FastAPI version registers apart from routes. Either way, the lesson is one envelope per service, enforced in one place.

---

### Example 75: State Versus Dependency Overrides

Axum shares `State` by construction; FastAPI overrides `Depends` per test. This example builds production and test worlds from one constructor with different seeds, showing construction-time dependencies while the lesson carries the FastAPI override mirror as an illustration.

Both frameworks isolate tests from production data: axum builds another world, FastAPI swaps the dependency function. The observable contract — same code, different rows per world — is identical.

(Concepts: co-16, co-06.)

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


def get_store():
    return ["o-1", "o-2"]


@app.get("/orders")
def list_orders(store=Depends(get_store)):
    return {"orders": store}


app.dependency_overrides[get_store] = lambda: ["t-1"]
client = TestClient(app)
assert client.get("/orders").json() == {"orders": ["t-1"]}
```

**`learning/code/ex-75-state-vs-dependency-overrides/src/main.rs`**:

```rust
// Example 75: State Versus Dependency Overrides.
// axum shares State by construction; FastAPI overrides Depends per test.
use std::sync::{Arc, Mutex}; // => Arc shares each world's store; Mutex guards each vector
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks each world's store per call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value each world's handlers share
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector per world, many readers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => list reads its world's store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes its world's contents in store order
    Json(json!({"orders": orders})) // => seeded per world below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => build_app wires one isolated world from one seed: no override registry
fn build_app(seed: Vec<String>) -> Router {
    // => the seed becomes this world's store: worlds never share rows
    let state = AppState { orders: Arc::new(Mutex::new(seed)) }; // => owned seed in, shared store out
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => the dependency arrives by construction, not by override
} // => constructor ends: swapping dependencies means building another world

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => this world's store answers
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both worlds write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per world: world name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the worlds and the checks
async fn main() {
    // => build two worlds from one constructor: production seed and test seed
    let prod = build_app(vec!["o-1".to_owned(), "o-2".to_owned()]); // => the production world with two rows
    // => the test world stands beside it with its own single row
    let test = build_app(vec!["t-1".to_owned()]); // => the test double world: no override map, just another build
    // => the production world lists its two rows
    check(prod.clone(), "prod").await; // => Output: prod GET /orders -> 200 OK {"orders":["o-1","o-2"]}
    // => the test world lists its one row: same code, different construction
    check(test.clone(), "test").await; // => Output: test GET /orders -> 200 OK {"orders":["t-1"]}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-75-state-vs-dependency-overrides/expected/main.stdout.txt`):

```text
prod GET /orders -> 200 OK {"orders":["o-1","o-2"]}
test GET /orders -> 200 OK {"orders":["t-1"]}
```

**Key takeaway**: Axum swaps dependencies by building another world; FastAPI swaps them in an override map; both isolate tests.

**Why it matters**: Test isolation is non-negotiable, and the two frameworks buy it differently: construction versus registry. Construction keeps dependencies visible — the seed is right there in the `build_app` call — while overrides keep production code untouched at the cost of a global map tests must remember to clear. The illustration shows the override shape honestly, including the map write, so readers feel the trade instead of taking sides.

---

### Example 76: Testing Oneshot Versus TestClient

`oneshot` drives the router value; `TestClient` drives the app over transport. This example holds the contract through `oneshot` with no port, showing the axum test while the lesson carries the FastAPI mirror as an illustration.

Both frameworks assert the same contract — status plus exact body — but the transport differs: `oneshot` runs values in-process, `TestClient` runs HTTP through a live server. In-process cannot flake on ports; transport tests prove the wire too.

(Concepts: co-16, co-09.)

```mermaid
flowchart TD
    accTitle: Test styles, example 76
    accDescr: In-process versus transport tests.
    oneshot --> values
    testclient --> wire[\"wire\"]
    values --> same[\"same asserts\"]
    wire --> same
    oneshot[\"oneshot\"]:::blue
    testclient[\"TestClient\"]:::orange
    values[\"values\"]:::teal
    wire[\"wire\"]:::teal
    same[\"same asserts\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


@app.get("/hello")
def hello():
    return {"message": "hello, axum"}


client = TestClient(app)
response = client.get("/hello")
assert response.status_code == 200
assert response.json() == {"message": "hello, axum"}
```

**`learning/code/ex-76-testing-oneshot-vs-testclient/src/main.rs`**:

```rust
// Example 76: Testing Oneshot Versus TestClient.
// oneshot drives the router value; TestClient drives the app over transport.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => oneshot comes from tower: the test seam is generic
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => ServiceExt::oneshot is the entire testing technique

// => hello answers the single route both testing styles would drive
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract both styles assert
} // => handler ends: it never knows which test style called it

// => app builds the service once; the test below reuses this constructor
fn app() -> Router {
    // => the constructor is the seam: tests build the service, never dial it
    Router::new().route("/hello", get(hello)) // => GET /hello, reached in-process below
} // => constructor ends: wiring stays separate from traffic

// => check serves one request, asserts both halves, then prints the hold line
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => the pinned call: no port, no transport
    // => oneshot runs routing and handlers exactly as live, inside this process
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with both sides shown
    assert_eq!(String::from_utf8_lossy(&bytes), r#"{"message":"hello, axum"}"#); // => exact bytes: the contract both styles would pin
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds oneshot GET /hello -> 200 without a port, transport, or server"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold the contract through the in-process stack
    let app = app(); // => the service under test, built by its constructor
    // => the holds line prints only because both asserts passed above
    check(app.clone()).await; // => Output: holds oneshot GET /hello -> 200 without a port
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-76-testing-oneshot-vs-testclient/expected/main.stdout.txt`):

```text
holds oneshot GET /hello -> 200 without a port, transport, or server
```

**Key takeaway**: `oneshot` asserts values in-process; `TestClient` asserts HTTP over transport; both pin status plus body.

**Why it matters**: Test style is a trade: in-process runs anywhere with zero flake, transport proves serialization plus routing plus server together. Axum leans in-process because routers are plain values — no server exists to dial in a unit test. FastAPI leans `TestClient` because the app object expects serving. Knowing both means choosing per case: in-process for speed and determinism, transport for wire proof — and this course's harness is itself a transport-free proof that in-process suffices.

---

### Example 77: Static Types at the Boundary

Serde structs reject bad shapes at parse time in both frameworks. This example round-trips one `Order` struct — deserialize in, serialize out — rejecting the mistyped body while echoing the good one, with the FastAPI mirror as an illustration.

Pydantic models and serde structs play the same role: the boundary shape in one definition, enforced before logic. The observable contract — 201 round-trip versus framework rejection — is identical.

(Concepts: co-15, co-16.)

The FastAPI mirror of the unit above (illustration — the harness never executes it); the unit holds the axum shape that runs green:

<!-- harness: illustration -->

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class Order(BaseModel):
    id: str
    item: str
    qty: int


@app.post("/orders", status_code=201)
def create_order(order: Order):
    return {"order": order.model_dump()}
```

**`learning/code/ex-77-static-types-at-the-boundary/src/main.rs`**:

```rust
// Example 77: Static Types at the Boundary.
// serde structs reject bad shapes at parse time in both frameworks.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds creation; Json parses the boundary struct
use serde::{Deserialize, Serialize}; // => Deserialize reads the boundary; Serialize writes it back
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Order is the boundary shape: the same struct parses requests and renders replies
#[derive(Deserialize, Serialize)] // => one struct, both directions: the boundary in one definition
struct Order {
    // => every order carries its client-chosen id across the boundary
    id: String, // => String keeps ids opaque on both sides of the wire
    // => the item names what the customer buys, spelled the same in and out
    item: String, // => required both ways: the struct is the contract
    // => qty counts how many; u32 rules out negatives before any logic runs
    qty: u32, // => the type rejects -1 with the framework's rejection, not ours
} // => struct ends: the HTTP boundary as a compile-time fact

// => create parses the boundary struct, then echoes it back with a 201
async fn create(Json(order): Json<Order>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: the boundary held before this line
    let echo = serde_json::to_value(&order).unwrap(); // => Serialize renders the same struct back out
    // => the echo proves the boundary round-trips without loss
    (StatusCode::CREATED, Json(json!({"order": echo}))) // => 201 with the round-tripped struct
} // => handler ends: Deserialize in, Serialize out, one struct both ways

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns the boundary; the struct rides both directions
    Router::new().route("/orders", post(create)) // => POST /orders round-trips the Order struct
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call in-process and prints its status line
async fn post_json(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri("/orders") // => the single creation path, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, boundary parsing, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the struct parses or the framework rejects
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON or text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: sent body, status, reply
    println!("POST /orders {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, round-trip one good struct and one mistyped body
    let app = app(); // => the service under test, built by its constructor
    // => every field present and typed: the boundary holds and echoes with 201
    post_json(app.clone(), r#"{"id":"o-1","item":"pen","qty":2}"#).await; // => Output: 201 with the round-tripped order
    // => qty as a word breaks the u32 contract: the boundary rejects it
    post_json(app.clone(), r#"{"id":"o-2","item":"pen","qty":"many"}"#).await; // => Output: the framework rejection with its status
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-77-static-types-at-the-boundary/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","item":"pen","qty":2} -> 201 Created {"order":{"id":"o-1","item":"pen","qty":2}}
POST /orders {"id":"o-2","item":"pen","qty":"many"} -> 422 Unprocessable Entity Failed to deserialize the JSON body into the target type: qty: invalid type: string "many", expected u32 at line 1 column 37
```

**Key takeaway**: One struct parses requests and renders replies; mistyped bodies fail at the boundary in both frameworks.

**Why it matters**: Boundary types are the highest-leverage lines in a service: one struct definition replaces pages of manual validation in any language. Serde and Pydantic differ in spelling — derives versus base classes — but agree on semantics: parse before logic, reject with position, echo what parsed. Round-trip tests prove no field is lost in either direction, which is the whole point of a typed boundary.

---

### Example 78: Structured Logs a Machine Can Parse

One JSON line per request: the log a pipeline can filter, count, and alert on. This example wraps the route in a JSON-logging layer that prints `event`, `method`, `path`, and `status` per call — no timestamps, no prose, just parseable facts.

Structured logs turn exhaust into data: pipelines filter by status, count by path, and alert on error rates without regex. Deterministic fields keep the lines golden-testable — the same call always prints the same line.

(Concepts: co-13, co-16.)

**`learning/code/ex-78-structured-logs-a-machine-can-parse/src/main.rs`**:

```rust
// Example 78: Structured Logs a Machine Can Parse.
// one JSON line per request: the log a pipeline can filter, count, and alert on.
use axum::{Router, body::Body, http::Request, middleware::{self, Next}, response::{Json, Response}, routing::get}; // => from_fn lifts the JSON logger into the stack
use serde_json::{Value, json}; // => json! renders each log line as parseable JSON
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => json_log prints one machine-readable line around every request
async fn json_log(req: Request<Body>, next: Next) -> Response {
    // => method and path are borrowed before next consumes the request
    let method = req.method().to_string(); // => owned text: the request moves below
    // => the path is borrowed beside the method for the same reason
    let path = req.uri().path().to_owned(); // => owned text: into the log line below
    // => the handler runs exactly here, wrapped by this logger
    let response = next.run(req).await; // => everything inside runs between borrow and print
    // => the status is borrowed before the response moves to the caller
    let status = response.status().as_u16(); // => the number pipelines filter on
    // => one JSON object per request: no timestamps, no thread names, no drift
    println!("{}", json!({"event": "request", "method": method, "path": path, "status": status})); // => the machine-readable line: parseable, countable, golden
    // => the response continues to the caller untouched
    response // => logging observes; it never rewrites
} // => middleware ends: JSON out, prose nowhere, pipelines happy

// => hello answers the single route the JSON logger wraps
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the logger exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: the logger prints around the handler on every call
    Router::new().route("/hello", get(hello)).layer(middleware::from_fn(json_log)) // => structured logging in one layer
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the log line is the whole lesson
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri("/hello") // => the single path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, the logger, and the handler exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the logger prints its JSON line around this call
    // => to_bytes drains the body so the response is fully consumed
    let _ = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => drained, not printed: the log line is the output
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call twice, watch two parseable lines land in order
    let app = app(); // => the service under test, built by its constructor
    // => the first call logs its JSON line with status 200
    check(app.clone()).await; // => Output: {"event":"request","method":"GET","path":"/hello","status":200}
    // => the second call logs the identical shape: pipelines count these
    check(app.clone()).await; // => Output: the same JSON shape, counted twice
} // => main ends: two parseable lines, so the run is green
```

**Output** (`learning/code/ex-78-structured-logs-a-machine-can-parse/expected/main.stdout.txt`):

```text
{"event":"request","method":"GET","path":"/hello","status":200}
{"event":"request","method":"GET","path":"/hello","status":200}
```

**Key takeaway**: Log one JSON object per request with fixed fields; pipelines parse what prose cannot.

**Why it matters**: Prose logs need regex; JSON logs need a parser — and every pipeline already has one. Fixed fields without timestamps keep the lines testable: the golden proves the shape while the pipeline adds time at ingest. This closes the course where production concerns live: route honestly, validate at the boundary, share state safely, test without sockets, survive load, retire gracefully, log for machines. The service is done when its logs are data.
