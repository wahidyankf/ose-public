---
title: Drilling Overview
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 21
---

Twenty-four questions with answers, eight applied mini-tasks, eight hands-on katas with before/after pairs, a twenty-four-item self-check, and six adversarial claim interrogations. Work the questions to recall, the mini-tasks to apply, the katas to rebuild, the self-check to verify, and the interrogations to argue with the course.

## Questions and Answers

<details>
<summary>Q1: What does `Router::new().route("/hello", get(hello))` register?</summary>

One method plus one path mapped to one handler function: `GET /hello` runs `hello`, and nothing else is wired. Method routing extends the same path with `.post`, `.put`, and friends.

</details>

<details>
<summary>Q2: How does a tower layer observe a request without rewriting it?</summary>

It borrows what it needs from the request, calls `next.run(req)` to run the inner stack, borrows what it needs from the response, and returns the response untouched. The `next.run` line is where the handler runs.

</details>

<details>
<summary>Q3: What arrives in an axum handler as `Path<u32>`, and what happens to `/abc`?</summary>

The path segment arrives already parsed as `u32`; `/abc` never reaches the handler because the extractor answers 400 with the framework parse message first.

</details>

<details>
<summary>Q4: Why return `(StatusCode, Json)` tuples instead of bare bodies?</summary>

The status code is part of the contract: caches, balancers, and clients branch on it without parsing. Tuples make the code impossible to forget — a handler that returns a body must also return its code.

</details>

<details>
<summary>Q5: How does one error type serve many failure kinds?</summary>

An `AppError` enum names each failure, and one `IntoResponse` impl maps each variant to its status plus the shared code-plus-message envelope. Handlers return `Result<Json, AppError>` so failures leave early.

</details>

<details>
<summary>Q6: What does `with_state` move, and what does `State` unpack?</summary>

`with_state` moves one value into the router; `State` unpacks a cheap clone per handler call. `Arc` contents stay put while pointers multiply, so per-call unpacking costs nothing measurable.

</details>

<details>
<summary>Q7: Why do atomics fit counters but mutexes fit collections?</summary>

One integer bumps with a single `fetch_add` — no lock, no waiting. Collections need multi-step read-modify-write sections, so a `Mutex` serializes the critical section while clones render outside it.

</details>

<details>
<summary>Q8: What retires first at SIGTERM: new work, in-flight work, or buffered state?</summary>

New work stops first at the gate with 503, in-flight work drains by joining every handle, and buffered state flushes last before the exit. Readiness flips to 503 before all of it so the balancer reroutes.

</details>

<details>
<summary>Q9: What does `oneshot` replace, and what can it never do?</summary>

It replaces the socket, the port, and the transport: request values in, response values out, in-process. It can never prove wire serialization or server behavior — transport tests cover those.

</details>

<details>
<summary>Q10: Where do business rules live relative to extractors?</summary>

Extractors own shape errors (missing fields, wrong types) and answer 4xx before handlers run. Rule functions own business errors (zero qty, blank ids) and run first inside the handler, before any store write.

</details>

<details>
<summary>Q11: When do you `nest`, and when do you `merge`?</summary>

`nest` mounts a sub-router below a prefix for versioning (`/api/v1`); `merge` joins sibling routers into one service for file-level grouping. Nests add paths, merges join groups, and colliding merge paths panic at build time.

</details>

<details>
<summary>Q12: What three promises does content negotiation keep?</summary>

The matching shape for the `Accept` value, the matching content type beside it, and the JSON default for missing or unknown types — plus `Vary: Accept` so caches key on the negotiation.

</details>

<details>
<summary>Q13: Why must structured log lines skip timestamps?</summary>

Pipelines add time at ingest; timestamps in output make goldens wobble and add nothing machines need. Fixed fields — event, method, path, status — keep lines parseable, countable, and testable.

</details>

<details>
<summary>Q14: What separates liveness from readiness?</summary>

Liveness asks whether the process answers (restart it if not); readiness asks whether it should take traffic (drain it if not). Shutdown flips readiness to 503 first, then exits after the drain.

</details>

<details>
<summary>Q15: Why do `json!` goldens read alphabetically?</summary>

Without the `preserve_order` feature, `serde_json` sorts object keys, so `json!` literals render alphabetically regardless of struct or literal order. Struct serialization keeps declaration order instead.

</details>

<details>
<summary>Q16: How do axum routes compare to FastAPI decorators?</summary>

Both map verb plus path to handler: axum in constructor values with `get` and `post`, FastAPI above functions with `@app.get` and `@app.post`. Values compose per route; decorators register into the app object.

</details>

<details>
<summary>Q17: What does the last `.layer` call wrap?</summary>

The outermost position: the last layer added runs first on the way in and last on the way out. Add inner layers first and outer layers second for onion order.

</details>

<details>
<summary>Q18: How does `Extension` differ from `State`?</summary>

`State` carries service-scoped values shared across calls (stores, config); `Extension` carries request-scoped values minted per call (identity, trace ids). Both hand off by type, so mismatches fail compilation.

</details>

<details>
<summary>Q19: What makes a trait object-safe for stores without extra crates?</summary>

Boxed futures: `fn list(&self) -> Pin<Box<dyn Future<Output = ...> + Send + '_>>` erases each backend's tail type, so `Arc<dyn OrderStore>` holds any backend behind one seam.

</details>

<details>
<summary>Q20: Why sort listings from map-backed stores?</summary>

`HashMap` iteration order is random, so unsorted listings wobble between runs. Sorting by id turns backend randomness into a stable contract without changing what the store holds.

</details>

<details>
<summary>Q21: What does `try_acquire` refuse to do?</summary>

Wait: it takes a permit now or fails now, answering 503 instead of queueing. The bound stays visible in the status, and the client decides whether to retry.

</details>

<details>
<summary>Q22: Why does blocking work move to `spawn_blocking`?</summary>

The async runtime assumes tasks yield quickly; one blocking loop stalls every task sharing the thread. The blocking pool runs sync work where blocking is safe while the handler awaits the result.

</details>

<details>
<summary>Q23: What does the second SIGTERM change?</summary>

Everything: the first starts the deadline drain, the second skips the wait and forces the exit. Operators send it when patience runs out, and honoring it keeps the worst case bounded at two signals.

</details>

<details>
<summary>Q24: What order does the shutdown checklist run?</summary>

Unready flip, gate shut, drain, flush, exit: rotation ends first, new work stops second, in-flight finishes third, memory lands fourth. Shuffling the order drops work or hangs the exit.

</details>

## Applied mini-tasks

- Mini-task 1 (co-01): Add a `PUT /orders/o-1` leg to the Example 3 service that answers 200 with `{"updated": true}`. Steps: bind `.put` beside `.get` and `.post` in the same route, drive it with `check`, assert the golden line. Expected outcome: three verbs answer distinctly and `PATCH` still answers 405.
- Mini-task 2 (co-04): Extend the Example 18 service with a 202 leg that answers `{"queued": true}` for `POST /queue`. Steps: add the route with `StatusCode::ACCEPTED`, print its golden line, assert the code. Expected outcome: the golden shows 202 beside the 200 and 404 legs.
- Mini-task 3 (co-03): Add a `?verbose=true` flag to the Example 9 listing that echoes the flag beside the items. Steps: add `verbose: Option<bool>` to `ListParams`, echo it in the reply, drive bare and flagged calls. Expected outcome: bare calls echo null-equivalent defaults and flagged calls echo true.
- Mini-task 4 (co-10): Add a `reserved` item rule to the Example 12 guard that rejects `item == "reserved"` with `item_reserved`. Steps: add the arm to `check_rule`, post the reserved item, assert 422 with the new code. Expected outcome: three rejection codes cover zero, excess, and reserved.
- Mini-task 5 (co-02): Stack the Example 26 logger outside the Example 27 auth gate and prove both orders of legs. Steps: add both layers to one router, drive authed and anonymous calls, assert four golden lines. Expected outcome: log lines bracket the 200 and both 401s.
- Mini-task 6 (co-06): Give the Example 35 store a second route `GET /count` that answers the row count from the same state. Steps: add the handler reading `State<AppState>`, wire it beside `/orders`, assert both legs. Expected outcome: listing and count agree through one shared store.
- Mini-task 7 (co-09): Convert the Example 1 checks into asserts that pin status plus body. Steps: add `assert_eq` on the code and the bytes before each print, rename prints to `holds` lines. Expected outcome: changed bodies panic red instead of printing stale goldens.
- Mini-task 8 (co-08): Add a 100ms deadline to the Example 63 drain and prove a stuck task is abandoned. Steps: wrap the join loop in `tokio::time::timeout`, print the abandon line on `Err`, assert the golden. Expected outcome: the exit lands on time with the abandon line printed.

## Hands-on katas

### Kata 1: Add Validation Rejects Malformed Body

Creation echoes any quantity today, even zero. Add the guard so zero and excess quantities answer 422 with machine-readable codes while sane orders echo with 201.

- Starter: `drilling/code/kata-01-add-validation-rejects-malformed-body/before/main.rs`
- Solution: `drilling/code/kata-01-add-validation-rejects-malformed-body/after/src/main.rs`
- Run: `drilling/code/kata-01-add-validation-rejects-malformed-body/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-01-add-validation-rejects-malformed-body/after/src/main.rs`
- Output: `drilling/code/kata-01-add-validation-rejects-malformed-body/expected/main.stdout.txt`

**`drilling/code/kata-01-add-validation-rejects-malformed-body/before/main.rs`**:

```rust
// Kata 01 starter: creation echoes any qty, even zero. The guard is missing.
// TODO: add a guard that rejects qty 0 and qty above 100 with 422,
// then echo only validated orders with 201.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds creation; the guard belongs beside it
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the contract; the rule still needs writing
#[derive(Deserialize)] // => parsing works already: the missing piece is validation
struct CreateOrder {
    // => the client-chosen id echoes back below
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; TODO: reject 0 and anything above 100
    qty: u32, // => TODO: the guard reads this field before the echo
} // => struct ends: the shape is done, the rule is the exercise

// => create echoes without guarding: TODO moves validation in front
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => TODO: reject qty 0 and qty above 100 with 422 before this line
    (StatusCode::CREATED, Json(json!({"id": order.id, "qty": order.qty}))) // => TODO: only validated orders reach this echo
} // => handler ends: the echo works, the guard is the kata

// => app builds the service once; the kata reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; the guard joins it when written
    Router::new().route("/orders", post(create)) // => POST /orders echoes today, guards tomorrow
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post the zero-qty order the guard must stop
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("POST").uri("/orders").header("content-type", "application/json").body(Body::from(r#"{"id":"o-1","qty":0}"#)).unwrap(); // => the malformed body the kata rejects
    // => oneshot runs the unguarded stack: 201 today, 422 after the kata
    let response = app.oneshot(request).await.unwrap(); // => TODO: this becomes 422 with the envelope
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the kata changes to a rejection
    println!("POST /orders qty=0 -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when this prints 422
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-01-add-validation-rejects-malformed-body/after/src/main.rs`**:

```rust
// Kata 01 solution: the guard rejects zero and excess qty with 422.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds creation; the guard decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; the guard below bounds it to the sane range
    qty: u32, // => u32 already rejects negatives; the guard rejects zero and excess
} // => struct ends: the request shape is now a compile-time fact

// => guard enforces what no type can say: qty must be orderable
fn guard(order: &CreateOrder) -> Result<(), &'static str> {
    // => zero means nothing to ship, so it is not an order at all
    if order.qty == 0 { return Err("qty_must_be_positive"); } // => the machine-readable code clients switch on
    // => the warehouse caps one line at one hundred units
    if order.qty > 100 { return Err("qty_exceeds_stock"); } // => the second code with the same envelope
    // => both bounds hold: the business rule passes
    Ok(()) // => Ok carries nothing: the order itself is the proof
} // => guard ends: shape errors stay in the extractor, business errors live here

// => create parses, guards, then echoes: validation lives before logic
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => the guard runs first: no store write happens for a bad order
    if let Err(code) = guard(&order) { // => Err carries the machine-readable code
        // => 422 says the shape parsed but the business meaning failed
        return (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({"error": code}))); // => the shared error envelope
    } // => guard passed: fall through to the happy path below
    // => the echo proves the order survived both parsing and the guard
    (StatusCode::CREATED, Json(json!({"id": order.id, "qty": order.qty}))) // => 201 with the accepted order
} // => handler ends: invalid input never reaches the store

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation with its guard beside the extractor
    Router::new().route("/orders", post(create)) // => POST /orders guards, then echoes
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
    // => oneshot runs routing, guards, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries echo or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: sent body, status, reply
    println!("POST /orders {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post one good order and two rule-breakers
    let app = app(); // => the service under test, built by its constructor
    // => sane qty: parsing and the guard both pass, echo answers 201
    post_json(app.clone(), r#"{"id":"o-1","qty":2}"#).await; // => Output: 201 with the echoed order
    // => zero qty: shape parses, the guard answers 422 with its code
    post_json(app.clone(), r#"{"id":"o-2","qty":0}"#).await; // => Output: 422 {"error":"qty_must_be_positive"}
    // => excess qty: the second bound answers 422 with its own code
    post_json(app.clone(), r#"{"id":"o-3","qty":500}"#).await; // => Output: 422 {"error":"qty_exceeds_stock"}
} // => main ends: every check printed, so the run is green
```

**Output** (`drilling/code/kata-01-add-validation-rejects-malformed-body/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","qty":2} -> 201 Created {"id":"o-1","qty":2}
POST /orders {"id":"o-2","qty":0} -> 422 Unprocessable Entity {"error":"qty_must_be_positive"}
POST /orders {"id":"o-3","qty":500} -> 422 Unprocessable Entity {"error":"qty_exceeds_stock"}
```

### Kata 2: Blocking Call Becomes Async Idiom

The sum runs inline on the async runtime today: correct answer, wrong thread. Move `blocking_sum` into `spawn_blocking` and await its handle, preserving the total while freeing the runtime.

- Starter: `drilling/code/kata-02-blocking-call-becomes-async-idiom/before/main.rs`
- Solution: `drilling/code/kata-02-blocking-call-becomes-async-idiom/after/src/main.rs`
- Run: `drilling/code/kata-02-blocking-call-becomes-async-idiom/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-02-blocking-call-becomes-async-idiom/after/src/main.rs`
- Output: `drilling/code/kata-02-blocking-call-becomes-async-idiom/expected/main.stdout.txt`

**`drilling/code/kata-02-blocking-call-becomes-async-idiom/before/main.rs`**:

```rust
// Kata 02 starter: the sum runs inline on the async runtime. It answers, but
// blocks every other task while adding. TODO: move blocking_sum into
// tokio::task::spawn_blocking and await its handle instead.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the sum the pool must compute
use serde_json::{Value, json}; // => json! builds the sum reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => BLOCK_N sizes the busywork: big enough to matter, small enough to stay fast
const BLOCK_N: u64 = 1_000_000; // => one million additions finish in milliseconds

// => blocking_sum adds 1 through N on the calling thread: TODO moves it aside
fn blocking_sum() -> u64 {
    // => a plain loop stands in for hashing, parsing, or image work
    (1..=BLOCK_N).sum() // => 500000500000: the answer the pool hop must preserve
} // => function ends: sync code, honest name, wrong thread for now

// => sum answers the total: TODO awaits spawn_blocking instead of calling inline
async fn sum() -> Json<Value> {
    // => TODO: replace this inline call with spawn_blocking(blocking_sum).await
    let total = blocking_sum(); // => inline today: the runtime stalls for milliseconds
    // => the reply proves the total; the kata preserves it across the move
    Json(json!({"sum": total})) // => 500000500000 before and after the kata
} // => handler ends: the answer is right, the thread is wrong

// => app builds the service once; the kata reuses this constructor
fn app() -> Router {
    // => one route owns the sum; the pool hop joins it when written
    Router::new().route("/sum", get(sum)) // => GET /sum answers the total either way
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, sum once through the inline call the kata moves aside
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/sum").body(Body::empty()).unwrap(); // => the pinned call the kata preserves
    // => oneshot runs the inline sum against the live runtime
    let response = app.oneshot(request).await.unwrap(); // => TODO: the pool hop answers identically below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the kata preserves while moving threads
    println!("GET /sum -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when spawn_blocking prints this
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-02-blocking-call-becomes-async-idiom/after/src/main.rs`**:

```rust
// Kata 02 solution: the sum moves to spawn_blocking; the answer is unchanged.
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

**Output** (`drilling/code/kata-02-blocking-call-becomes-async-idiom/expected/main.stdout.txt`):

```text
GET /sum -> 200 OK {"sum":500000500000}
```

### Kata 3: In-Process Test for New Route

The `/readyz` probe exists but no test drives it. Add a `check` that calls the probe in-process, asserts 200 plus the exact body, and prints the hold line beside the covered listing leg.

- Starter: `drilling/code/kata-03-in-process-test-for-new-route/before/main.rs`
- Solution: `drilling/code/kata-03-in-process-test-for-new-route/after/src/main.rs`
- Run: `drilling/code/kata-03-in-process-test-for-new-route/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-03-in-process-test-for-new-route/after/src/main.rs`
- Output: `drilling/code/kata-03-in-process-test-for-new-route/expected/main.stdout.txt`

**`drilling/code/kata-03-in-process-test-for-new-route/before/main.rs`**:

```rust
// Kata 03 starter: the /readyz probe exists but no test drives it. The listing
// below is covered; the probe is not. TODO: add a check that calls /readyz
// in-process, asserts 200 plus the exact body, and prints the hold line.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds both routes; the probe still needs its test
use serde_json::{Value, json}; // => json! builds both replies inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers the covered route: its test already holds below
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the covered output golden
    Json(json!({"orders": ["o-1"]})) // => covered: the existing check pins this body
} // => handler ends: this route is done, the probe is the kata

// => ready answers the uncovered probe: TODO pins it with a holds line
async fn ready() -> Json<Value> {
    // => the probe body the kata must pin: exact bytes, asserted, printed
    Json(json!({"ready": true})) // => TODO: assert 200 plus these exact bytes
} // => handler ends: the route exists, its test does not yet

// => app builds the service once; the kata reuses this constructor
fn app() -> Router {
    // => two routes share one router: one covered, one waiting for its test
    Router::new().route("/orders", get(list)).route("/readyz", get(ready)) // => the probe joins the suite when written
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold the covered route while the probe waits
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/orders").body(Body::empty()).unwrap(); // => the covered call the kata keeps
    // => oneshot runs the covered route exactly as live
    let response = app.oneshot(request).await.unwrap(); // => TODO: a second oneshot must cover /readyz
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: the covered route holds while the probe still needs its test
    println!("holds GET /orders -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when /readyz holds beside it
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-03-in-process-test-for-new-route/after/src/main.rs`**:

```rust
// Kata 03 solution: the probe holds beside the listing with its own asserts.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds both routes; both hold below
use serde_json::{Value, json}; // => json! builds both replies inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers the covered route: its test already holds below
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the covered output golden
    Json(json!({"orders": ["o-1"]})) // => covered: the existing check pins this body
} // => handler ends: this route is done, the probe joins it now

// => ready answers the probe the new test pins to the wall
async fn ready() -> Json<Value> {
    // => the probe body the holds line pins: exact bytes, asserted, printed
    Json(json!({"ready": true})) // => pinned: the new check asserts these exact bytes
} // => handler ends: the route existed, now its test exists too

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => two routes share one router: both covered after this kata
    Router::new().route("/orders", get(list)).route("/readyz", get(ready)) // => the probe stands beside the listing in the suite
} // => constructor ends: wiring stays separate from traffic

// => check serves one suite leg, asserts status plus body, prints the hold line
async fn check(app: Router, uri: &str, want_body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri(uri).body(Body::empty()).unwrap(); // => one suite leg as a live request
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with the leg shown
    assert_eq!(String::from_utf8_lossy(&bytes), want_body, "leg {uri}"); // => want_body or red: the proof is exact
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET {uri} -> 200 {want_body}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold both legs through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the listing leg holds its snapshot beside the probe
    check(app.clone(), "/orders", r#"{"orders":["o-1"]}"#).await; // => Output: holds the listing leg
    // => the probe leg holds its body: the kata's new coverage
    check(app.clone(), "/readyz", r#"{"ready":true}"#).await; // => Output: holds the probe leg
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`drilling/code/kata-03-in-process-test-for-new-route/expected/main.stdout.txt`):

```text
holds GET /orders -> 200 {"orders":["o-1"]}
holds GET /readyz -> 200 {"ready":true}
```

### Kata 4: Middleware Chain Auth and Logging

The auth gate stands alone today: safe but invisible. Add a logging layer outside auth so every call prints its method, path, and status around the gate — authed calls and strangers alike.

- Starter: `drilling/code/kata-04-middleware-chain-auth-and-logging/before/main.rs`
- Solution: `drilling/code/kata-04-middleware-chain-auth-and-logging/after/src/main.rs`
- Run: `drilling/code/kata-04-middleware-chain-auth-and-logging/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-04-middleware-chain-auth-and-logging/after/src/main.rs`
- Output: `drilling/code/kata-04-middleware-chain-auth-and-logging/expected/main.stdout.txt`

**`drilling/code/kata-04-middleware-chain-auth-and-logging/before/main.rs`**:

```rust
// Kata 04 starter: the auth gate stands alone. Requests are safe but invisible:
// no line says who knocked or what answered. TODO: add a logging layer beside
// auth so every call prints its method, path, and status around the handler.
use axum::{Router, body::Body, http::{Request, StatusCode}, middleware::{self, Next}, response::{IntoResponse, Json, Response}, routing::get}; // => from_fn lifts one gate today, two layers after the kata
use serde_json::{Value, json}; // => json! builds the secret and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => THE_TOKEN is the one bearer value the demo accepts
const THE_TOKEN: &str = "s3cret"; // => a constant keeps the check golden without any store

// => auth answers 401 early or lets the request through to the handler
async fn auth(req: Request<Body>, next: Next) -> Response {
    // => the bearer token rides in the Authorization header, if at all
    let ok = req.headers().get("authorization").and_then(|v| v.to_str().ok()) == Some(&format!("Bearer {THE_TOKEN}")); // => exact match: no prefix games, no fallbacks
    // => a miss answers now: the handler never runs for strangers
    if !ok { // => anonymous or wrong token takes this leg
        // => 401 says who you are is missing or wrong, in the shared envelope
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "unauthorized"}))).into_response(); // => early answer: next never runs
    } // => token holds: fall through to the handler below
    // => next runs the handler and returns its response untouched
    next.run(req).await // => TODO: a logging layer must print around this call
} // => middleware ends: the gate works, its visibility is the kata

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the gate already ran

// => app builds the service once; the logging layer joins it when written
fn app() -> Router {
    // => TODO: wrap a second from_fn logging layer beside auth, outermost
    Router::new().route("/secret", get(secret)).layer(middleware::from_fn(auth)) // => one layer today, a chain after the kata
} // => constructor ends: the chain is the kata

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, open the gate with the right token
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/secret").header("authorization", "Bearer s3cret").body(Body::empty()).unwrap(); // => the authed call the chain must log
    // => oneshot runs the gate and the handler: silent today, printed after the kata
    let response = app.oneshot(request).await.unwrap(); // => TODO: log lines bracket this call
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: today's silent answer the chain makes visible
    println!("GET /secret -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when log lines precede this
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-04-middleware-chain-auth-and-logging/after/src/main.rs`**:

```rust
// Kata 04 solution: logging wraps auth outermost; every call prints its line.
use axum::{Router, body::Body, http::{Request, StatusCode}, middleware::{self, Next}, response::{IntoResponse, Json, Response}, routing::get}; // => two from_fn layers: logging outside, auth inside
use serde_json::{Value, json}; // => json! builds the secret and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => THE_TOKEN is the one bearer value the demo accepts
const THE_TOKEN: &str = "s3cret"; // => a constant keeps the check golden without any store

// => logger prints one line on the way in and one on the way out
async fn logger(req: Request<Body>, next: Next) -> Response {
    // => the method and path are borrowed before next consumes the request
    println!("-> {} {}", req.method(), req.uri().path()); // => golden line: the request arrived
    // => next runs auth and the handler, then returns the response
    let response = next.run(req).await; // => auth answers early or the handler answers late
    // => the status is borrowed before the response moves to the caller
    println!("<- {}", response.status()); // => golden line: the answer left
    // => the response continues to the caller untouched
    response // => logging observes; it never rewrites
} // => middleware ends: the outer layer of the chain

// => auth answers 401 early or lets the request through to the handler
async fn auth(req: Request<Body>, next: Next) -> Response {
    // => the bearer token rides in the Authorization header, if at all
    let ok = req.headers().get("authorization").and_then(|v| v.to_str().ok()) == Some(&format!("Bearer {THE_TOKEN}")); // => exact match: no prefix games, no fallbacks
    // => a miss answers now: the handler never runs for strangers
    if !ok { // => anonymous or wrong token takes this leg
        // => 401 says who you are is missing or wrong, in the shared envelope
        return (StatusCode::UNAUTHORIZED, Json(json!({"error": "unauthorized"}))).into_response(); // => early answer: next never runs
    } // => token holds: fall through to the handler below
    // => next runs the handler and returns its response untouched
    next.run(req).await // => the inner layer of the chain, hugging the handler
} // => middleware ends: the inner layer of the chain

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the chain already ran

// => app builds the service once; the chain order is the whole lesson
fn app() -> Router {
    // => auth added first hugs the handler; logging added last wraps outermost
    Router::new().route("/secret", get(secret)).layer(middleware::from_fn(auth)).layer(middleware::from_fn(logger)) // => last added runs first: logging brackets auth
} // => constructor ends: the chain order prints itself below

// => check serves one guarded call and prints its status line
async fn check(app: Router, token: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/secret"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(value) = token { builder = builder.header("authorization", format!("Bearer {value}")); } // => the credential rides as one header
    // => an empty body keeps the call a pure chain probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs the chain and the handler: log lines bracket this call
    let response = app.oneshot(request).await.unwrap(); // => logger prints around auth and the handler
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: the answer the log lines bracketed above
    println!("GET /secret token={} -> {status} {}", token.unwrap_or("(none)"), String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, drive the chain with the right token and none at all
    let app = app(); // => the service under test, built by its constructor
    // => the right token opens the gate inside the log lines
    check(app.clone(), Some("s3cret")).await; // => Output: log lines bracket 200 with the secret
    // => no token stops at the gate inside the same log lines
    check(app.clone(), None).await; // => Output: log lines bracket 401 with the envelope
} // => main ends: every check printed, so the run is green
```

**Output** (`drilling/code/kata-04-middleware-chain-auth-and-logging/expected/main.stdout.txt`):

```text
-> GET /secret
<- 200 OK
GET /secret token=s3cret -> 200 OK {"secret":"the-cake-is-documented"}
-> GET /secret
<- 401 Unauthorized
GET /secret token=(none) -> 401 Unauthorized {"error":"unauthorized"}
```

### Kata 5: Split Handler from Dependency

The handler builds its own store inline today: correct output, wrong ownership. Lift the store into `AppState`, add `build_app(seed)`, and read through `State` so tests seed worlds by construction.

- Starter: `drilling/code/kata-05-split-handler-from-dependency/before/main.rs`
- Solution: `drilling/code/kata-05-split-handler-from-dependency/after/src/main.rs`
- Run: `drilling/code/kata-05-split-handler-from-dependency/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-05-split-handler-from-dependency/after/src/main.rs`
- Output: `drilling/code/kata-05-split-handler-from-dependency/expected/main.stdout.txt`

**`drilling/code/kata-05-split-handler-from-dependency/before/main.rs`**:

```rust
// Kata 05 starter: the handler builds its own store inline. It answers, but no
// test can seed a world and no second route can share the rows. TODO: lift the
// store into AppState, add build_app(seed), and read through State instead.
use std::sync::{Arc, Mutex}; // => Arc and Mutex already imported: the state shape waits
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => State joins these imports when the kata lands
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list builds its store inline: TODO lifts this into shared state
async fn list() -> Json<Value> {
    // => TODO: replace this inline store with State<AppState> from build_app
    let store = Arc::new(Mutex::new(vec!["o-1".to_owned()])); // => inline today: untestable, unshareable
    // => lock borrows the vector for the shortest possible moment
    let orders = store.lock().unwrap().clone(); // => the rows every call rebuilds from scratch
    // => the listing echoes the rebuilt contents on every call
    Json(json!({"orders": orders})) // => TODO: the seeded world answers here instead
} // => handler ends: correct output, wrong ownership

// => app builds the service once; build_app(seed) replaces it when written
fn app() -> Router {
    // => TODO: build_app(seed: Vec<String>) takes the seed callers choose
    Router::new().route("/orders", get(list)) // => no state today: the kata adds with_state
} // => constructor ends: the seam is the kata

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the inline store the kata must lift
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/orders").body(Body::empty()).unwrap(); // => the pinned read the kata preserves
    // => oneshot runs the inline store exactly as live
    let response = app.oneshot(request).await.unwrap(); // => TODO: the seeded world answers identically below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the shared state must preserve
    println!("GET /orders -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when build_app prints this
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-05-split-handler-from-dependency/after/src/main.rs`**:

```rust
// Kata 05 solution: the store lifts into AppState; build_app seeds each world.
use std::sync::{Arc, Mutex}; // => Arc shares each world's store; Mutex guards each vector
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks each world's store per call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value each world's handlers share
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector per world, many readers, one lock
} // => struct ends: the lifted dependency the handler borrows

// => list reads its world's store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes its world's contents in store order
    Json(json!({"orders": orders})) // => seeded per world below, read on every call
} // => handler ends: no store is built here anymore

// => build_app wires one isolated world from one seed: the lifted constructor
fn build_app(seed: Vec<String>) -> Router {
    // => the seed becomes this world's store: tests choose their rows
    let state = AppState { orders: Arc::new(Mutex::new(seed)) }; // => owned seed in, shared store out
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => one store per world, zero globals
} // => constructor ends: the dependency arrives by construction

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
    // => build two worlds from the lifted constructor: seeded and empty
    let seeded = build_app(vec!["o-1".to_owned()]); // => the world with one row
    // => the empty world stands beside it with no rows at all
    let empty = build_app(vec![]); // => the world the tests grow themselves
    // => the seeded world lists its row through shared state
    check(seeded.clone(), "seeded").await; // => Output: seeded GET /orders -> 200 OK {"orders":["o-1"]}
    // => the empty world lists nothing: the dependency split holds
    check(empty.clone(), "empty").await; // => Output: empty GET /orders -> 200 OK {"orders":[]}
} // => main ends: every check printed, so the run is green
```

**Output** (`drilling/code/kata-05-split-handler-from-dependency/expected/main.stdout.txt`):

```text
seeded GET /orders -> 200 OK {"orders":["o-1"]}
empty GET /orders -> 200 OK {"orders":[]}
```

### Kata 6: Race Under Load Uses a Mutex

One task fills five ids in a loop today; the second task would race the bare vector. Wrap the book in `Arc<Mutex<Vec<String>>>`, spawn five appenders sharing it, join them, and print the sorted book with no lost write.

- Starter: `drilling/code/kata-06-race-under-load-uses-a-mutex/before/main.rs`
- Solution: `drilling/code/kata-06-race-under-load-uses-a-mutex/after/src/main.rs`
- Run: `drilling/code/kata-06-race-under-load-uses-a-mutex/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-06-race-under-load-uses-a-mutex/after/src/main.rs`
- Output: `drilling/code/kata-06-race-under-load-uses-a-mutex/expected/main.stdout.txt`

**`drilling/code/kata-06-race-under-load-uses-a-mutex/before/main.rs`**:

```rust
// Kata 06 starter: one task appends five ids in a loop. It answers, but the
// second task would race the bare vector. TODO: wrap the book in
// Arc<Mutex<Vec<String>>>, spawn five appenders sharing it, join them, and
// print the sorted book: no lost write across the race.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => State and the lock join these imports when the kata lands
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => BOOK is the bare vector one task fills today: TODO shares it safely
static BOOK: Mutex<Vec<String>> = Mutex::new(Vec::new()); // => statics need Mutex already: the kata adds Arc and tasks
use std::sync::Mutex; // => Mutex guards the static because main borrows it alone today

// => list clones the static book and renders the sorted ids
async fn list() -> Json<Value> {
    // => clone under the lock, sort outside it: the single-threaded read
    let mut ids = BOOK.lock().unwrap().clone(); // => TODO: State<AppState> replaces this static
    // => sort makes the output golden-stable on every call
    ids.sort(); // => o-1 through o-5 after the loop below fills them
    // => the listing echoes the sorted book contents
    Json(json!({"orders": ids})) // => five ids in order after the kata's race
} // => handler ends: the static works, the sharing is the kata

// => app builds the service once; shared state joins it when written
fn app() -> Router {
    // => TODO: with_state(AppState) replaces the static BOOK above
    Router::new().route("/orders", get(list)) // => no state today: the kata adds the shared book
} // => constructor ends: the sharing is the kata

#[tokio::main] // => the async runtime drives the fill and the read
async fn main() {
    // => one task fills five ids in a loop: safe alone, racy the moment it shares
    for n in 1..=5 { // => o-1 through o-5, pushed in order by one task
        // => the static takes each id under its lock, one at a time
        BOOK.lock().unwrap().push(format!("o-{n}")); // => TODO: five tasks share one Arc<Mutex> instead
    } // => fill loop ends: five rows wait in the static book
    // => build once, read the filled book through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/orders").body(Body::empty()).unwrap(); // => the proof read after the fill
    // => oneshot runs the read against the filled book
    let response = app.oneshot(request).await.unwrap(); // => TODO: the raced book answers identically below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the shared race must preserve
    println!("GET /orders -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when five tasks print this
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-06-race-under-load-uses-a-mutex/after/src/main.rs`**:

```rust
// Kata 06 solution: five appenders share one Arc<Mutex>; the sorted book holds five.
use std::sync::{Arc, Mutex}; // => Arc shares the book; Mutex serializes the appends
use axum::{Router, body::Body, extract::State, http::{Request, StatusCode}, response::Json, routing::{get, post}}; // => post appends, get lists: the two halves of the book
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex serializes appends because handlers run on many threads
    book: Arc<Mutex<Vec<String>>>, // => one book, many writers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => add appends one id under a short lock and answers 201
async fn add(State(state): State<AppState>, axum::extract::Path(id): axum::extract::Path<String>) -> (StatusCode, Json<Value>) {
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

**Output** (`drilling/code/kata-06-race-under-load-uses-a-mutex/expected/main.stdout.txt`):

```text
five concurrent appends -> {"orders":["o-1","o-2","o-3","o-4","o-5"]}
```

### Kata 7: Error Envelope for Clients

Failures answer as bare strings today with scattered codes. Add an `AppError` enum with `NoOrder` and `BadStatus`, implement `IntoResponse` with the shared code-plus-message envelope, and return `Result<Json, AppError>` from both handlers.

- Starter: `drilling/code/kata-07-error-envelope-for-clients/before/main.rs`
- Solution: `drilling/code/kata-07-error-envelope-for-clients/after/src/main.rs`
- Run: `drilling/code/kata-07-error-envelope-for-clients/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-07-error-envelope-for-clients/after/src/main.rs`
- Output: `drilling/code/kata-07-error-envelope-for-clients/expected/main.stdout.txt`

**`drilling/code/kata-07-error-envelope-for-clients/before/main.rs`**:

```rust
// Kata 07 starter: failures answer as bare strings with scattered codes. Clients
// cannot switch on prose. TODO: add an AppError enum with NoOrder and BadStatus,
// implement IntoResponse with the shared code-plus-message envelope, and return
// Result<Json, AppError> from both handlers.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::get}; // => IntoResponse joins these imports when the kata lands
use serde_json::{Value, json}; // => json! builds the snapshot the happy legs echo
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => read answers the hit with a snapshot and the miss with bare prose
async fn read() -> (StatusCode, String) {
    // => TODO: Err(AppError::NoOrder) replaces this prose with the envelope
    (StatusCode::NOT_FOUND, "no such order".to_owned()) // => prose today: unparseable, untestable as a contract
} // => handler ends: the code is right, the shape is the kata

// => promote answers the refusal with bare prose: TODO envelopes it too
async fn promote() -> (StatusCode, String) {
    // => TODO: Err(AppError::BadStatus) replaces this prose with the envelope
    (StatusCode::UNPROCESSABLE_ENTITY, "bad transition".to_owned()) // => prose today: the envelope unifies it
} // => handler ends: two prose shapes, one envelope after the kata

// => app builds the service once; the envelope joins it when written
fn app() -> Router {
    // => two routes demo the two prose failures the kata unifies
    Router::new().route("/read", get(read)).route("/promote", get(promote)) // => absence and refusal live one router apart
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri(uri).body(Body::empty()).unwrap(); // => one failure leg as a live request
    // => oneshot runs the prose failure exactly as live
    let response = app.oneshot(request).await.unwrap(); // => TODO: the envelope renders for both legs below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => one line: today's prose the envelope replaces
    println!("GET {uri} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when both legs print envelopes
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger both prose failures the kata unifies
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 as prose today, envelope after the kata
    check(app.clone(), "/read").await; // => the kata is done when this prints the no_order envelope
    // => refusal answers 422 as prose today, envelope after the kata
    check(app.clone(), "/promote").await; // => the kata is done when this prints the bad_status envelope
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-07-error-envelope-for-clients/after/src/main.rs`**:

```rust
// Kata 07 solution: one error type renders both failures as code plus message.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::{IntoResponse, Json}, routing::get}; // => IntoResponse renders each variant as status plus envelope
use serde_json::{Value, json}; // => json! builds the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppError names the two failures this service reports
enum AppError {
    // => the id names nothing in the store
    NoOrder, // => 404: absence, not a crash
    // => the transition breaks the workflow bounds
    BadStatus, // => 422: understood, but refused
} // => enum ends: every failure is one of these two variants

// => IntoResponse renders each variant as status plus the shared envelope
impl IntoResponse for AppError {
    // => self is consumed: each error answers exactly once
    fn into_response(self) -> axum::response::Response {
        // => each variant picks its code and its machine-readable code
        let (status, code) = match self { // => match keeps the mapping total: no silent variant
            AppError::NoOrder => (StatusCode::NOT_FOUND, "no_order"), // => 404 for absence
            AppError::BadStatus => (StatusCode::UNPROCESSABLE_ENTITY, "bad_status"), // => 422 for refusal
        }; // => the pair is decided: render it below
        // => every failure shares one envelope: code plus message
        (status, Json(json!({"code": code, "message": format!("request failed: {code}")}))).into_response() // => the envelope never changes shape
    } // => render ends: failures are responses with a contract
} // => impl ends: prose is gone, the envelope owns every failure

// => read fails with absence: the demo route for the 404 leg
async fn read() -> Result<Json<Value>, AppError> {
    // => Err leaves the handler early: no snapshot exists for this id
    Err(AppError::NoOrder) // => the envelope answers 404 below
} // => handler ends: Result keeps the happy path and the failure apart

// => promote fails with refusal: the demo route for the 422 leg
async fn promote() -> Result<Json<Value>, AppError> {
    // => Err leaves the handler early: the transition breaks the bounds
    Err(AppError::BadStatus) // => the envelope answers 422 below
} // => handler ends: one return type carries both outcomes

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => two routes demo the two variants through the same envelope
    Router::new().route("/read", get(read)).route("/promote", get(promote)) // => absence and refusal live one router apart
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
    // => build once, trigger absence and refusal through one envelope
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 inside the shared envelope
    check(app.clone(), "/read").await; // => Output: 404 {"code":"no_order","message":"request failed: no_order"}
    // => refusal answers 422 inside the same envelope shape
    check(app.clone(), "/promote").await; // => Output: 422 {"code":"bad_status","message":"request failed: bad_status"}
} // => main ends: every check printed, so the run is green
```

**Output** (`drilling/code/kata-07-error-envelope-for-clients/expected/main.stdout.txt`):

```text
GET /read -> 404 Not Found {"code":"no_order","message":"request failed: no_order"}
GET /promote -> 422 Unprocessable Entity {"code":"bad_status","message":"request failed: bad_status"}
```

### Kata 8: Shutdown with a Deadline

The signal waits out the stuck drain with no bound today: a wedged connection hangs retirement forever. Wrap the drain in `tokio::time::timeout` with a 50ms deadline, print whether the drain finished or the deadline abandoned it, and exit on time either way.

- Starter: `drilling/code/kata-08-shutdown-with-a-deadline/before/main.rs`
- Solution: `drilling/code/kata-08-shutdown-with-a-deadline/after/src/main.rs`
- Run: `drilling/code/kata-08-shutdown-with-a-deadline/run.yaml` (`after/`, expected goldens in `expected/`)
- After: `drilling/code/kata-08-shutdown-with-a-deadline/after/src/main.rs`
- Output: `drilling/code/kata-08-shutdown-with-a-deadline/expected/main.stdout.txt`

**`drilling/code/kata-08-shutdown-with-a-deadline/before/main.rs`**:

```rust
// Kata 08 starter: the signal waits out the stuck drain with no bound. A wedged
// connection hangs retirement forever. TODO: wrap the drain in
// tokio::time::timeout with a 50ms deadline, print whether the drain finished
// or the deadline abandoned it, and exit on time either way.
use std::time::Duration; // => Duration names the deadline the kata adds
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

// => stuck pretends to be the drain that never finishes: TODO bounds it
async fn stuck() -> &'static str {
    // => five seconds of sleep stands in for the wedged connection
    tokio::time::sleep(Duration::from_secs(5)).await; // => TODO: timeout drops this after 50ms
    // => unreachable once the deadline lands: the kata abandons this first
    "stuck finished" // => this line never prints after the kata
} // => stuck ends: the deadline owns it, not the other way around

#[tokio::main] // => the async runtime drives the deadline demo
async fn main() {
    // => build once, serve once, then retire against the unbounded drain
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
    // => the signal lands: TODO races the drain against the 50ms deadline
    println!("signal received: SIGTERM; draining (no deadline yet)"); // => TODO: this line names the 50ms deadline
    // => TODO: match timeout(50ms, stuck()).await { Ok => drained, Err => abandoned }
    let done = stuck().await; // => unbounded today: the kata bounds this await
    // => one line: today's unbounded answer the deadline replaces
    println!("drained: {done}"); // => the kata is done when the deadline prints instead
} // => main ends: the kata is done when todo is gone
```

**`drilling/code/kata-08-shutdown-with-a-deadline/after/src/main.rs`**:

```rust
// Kata 08 solution: the drain races a 50ms deadline; the exit stays on time.
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

**Output** (`drilling/code/kata-08-shutdown-with-a-deadline/expected/main.stdout.txt`):

```text
before signal -> 200 OK {"message":"hello, axum"}
signal received: SIGTERM; draining with a 50ms deadline
deadline hit: 1 task abandoned; exiting on time
```

## Knowledge self-check

- Recall: `Router::new().route` maps one method plus one path to one handler.
- Recall: `next.run(req)` is the line the inner stack runs on inside middleware.
- Recall: `Path<u32>` rejects word segments with 400 before the handler runs.
- Recall: `(StatusCode, Json)` returns code plus body in one move.
- Recall: `AppError` plus `IntoResponse` renders every failure in one envelope.
- Recall: `with_state` provides state; `State` unpacks a clone per call.
- Recall: `fetch_add` bumps atomics lock-free; the post-join read proves the count.
- Recall: the shutdown checklist runs unready, gate, drain, flush, exit.
- Read: `Router::new().route("/users/{id}", get(user))` with `async fn user(Path(id): Path<u32>)` answers 200 for `/users/42` and 400 for `/users/abc`.
- Read: `.layer(from_fn(auth)).layer(from_fn(logger))` runs logging outside auth: entries print logger first, exits unwind auth first.
- Read: `TimeoutLayer::with_status_code(REQUEST_TIMEOUT, 50ms)` answers 408 for handlers that outrun the budget.
- Read: `AllowOrigin::predicate` emits the allow header for matches and nothing for strangers; both preflights answer 200.
- Read: `Arc::strong_count` of three means router, call, and extractor hold the pointer while data stays put.
- Read: `timeout(50ms, stuck())` abandons the five-second sleep and answers the `Err` arm in 50 milliseconds.
- Read: `json!({"b": 1, "a": 2})` renders `{"a":2,"b":1}` because object keys sort alphabetically.
- Read: the E0308 `MethodRouter<()>` versus `MethodRouter<ShopConfig>` error means `with_state` is missing from the constructor.
- Do: add a `PUT` leg to one Example 3-style route and pin its 200 plus the remaining 405.
- Do: wrap one Example 27-style gate in the Example 26 logger and pin all four log-plus-answer lines.
- Do: convert one Example 35-style inline store into `build_app(seed)` with seeded and empty worlds.
- Do: table-drive one Example 48-style suite with two happy legs, one method miss, and one path miss.
- Do: race five appenders at one Example 56-style book and assert the sorted five hold.
- Do: bound one Example 63-style drain with a 50ms deadline and pin the abandon line.
- Do: negotiate JSON plus CSV on one Example 22-style route and pin all three legs.
- Do: retire one Example 70-style service through unready, gate, drain, and flush in order.

## Claim interrogation

1. "Axum's extractors make validation unnecessary because types reject everything bad." Argue against: types reject misshapen input (missing fields, wrong types), but business rules (zero qty, blank ids, workflow bounds) need rule functions that types cannot express. Which example proves the split, and what would break if the guard were deleted?
2. "In-process tests prove the service works, so transport tests add nothing." Argue against: `oneshot` proves routing, handlers, and middleware on values, but never serialization on the wire, server binding, or TLS behavior. Which failure could ship with only `oneshot` coverage, and which test would catch it?
3. "Cloning state per call is wasteful; handlers should borrow global state instead." Argue against: `Arc` clones move pointers, not data, and the holder count proves it — while globals couple tests, poison outage blast radius, and resist per-case worlds. What breaks first under globals: isolation, rotation, or review?
4. "Graceful shutdown only needs the drain; gates, deadlines, and flushes are optional polish." Argue against: without the gate new work starves the drain, without the deadline one wedged call hangs retirement, without the flush buffered rows die silently. Which leg would you drop last if forced, and what exactly would break?
5. "CORS 200s for strangers mean the layer is misconfigured; strangers must get 4xx." Argue against: CORS is a declaration the browser enforces, not a gate the server holds — the absent allow header is the refusal, and the 200 carries no data either way. What would a 403 for strangers break for non-browser clients?
6. "Alphabetical JSON keys prove nothing; key order is an implementation detail." Argue against: positional clients, signature checks, and golden tests all read key order, and `serde_json` sorts `json!` keys deterministically — which is exactly what makes byte goldens possible. What breaks if a framework upgrade reorders keys silently?
