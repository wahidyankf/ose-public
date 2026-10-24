---
title: Intermediate Examples
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 20
---

Examples 26–53 run the service like production: middleware and error handling around every call (Examples 26–34), dependency injection through shared state (Examples 35–44), and testing without a real network call (Examples 45–53). Every example is a complete, runnable Rust program under `learning/code/` driving its service in-process through `tower::ServiceExt::oneshot`; run each with the command in its own `run.yaml`.

---

### Example 26: Middleware Logs Every Request

`from_fn` wraps one handler: log the way in, run it, log the way out. This example prints the method plus path before the handler and the status after, with no timestamps and no thread names — deterministic logs that test like any other output.

Middleware observes by default: `next.run(req)` marks the exact line where the inner stack runs. Logging changes nothing about the request or response; it only witnesses them.

(Concepts: co-02, co-13.)

```mermaid
flowchart TD
    accTitle: Log wrap, example 26
    accDescr: Two prints bracket one handler run.
    req --> login[\"log in\"]
    login --> handler
    handler --> logout[\"log out\"]
    logout --> reply
    req[\"request\"]:::orange
    handler[\"handler\"]:::blue
    login[\"-> line\"]:::teal
    logout[\"<- line\"]:::teal
    reply[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-26-middleware-logs-every-request/src/main.rs`**:

```rust
// Example 26: Middleware Logs Every Request.
// from_fn wraps one handler: log the way in, run it, log the way out.
use axum::{Router, body::Body, http::Request, middleware::{self, Next}, response::{Json, Response}, routing::get}; // => middleware::from_fn lifts a function into a layer
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => logger prints one line on the way in and one on the way out
async fn logger(req: Request<Body>, next: Next) -> Response {
    // => the method and path are borrowed before next consumes the request
    let line_in = format!("-> {} {}", req.method(), req.uri().path()); // => the way in, without any timestamp
    // => println keeps the log deterministic: no clock, no thread name
    println!("{line_in}"); // => golden line one: the request arrived
    // => next runs the handler and every inner layer, then returns the response
    let response = next.run(req).await; // => the handler runs exactly here
    // => the status is borrowed before the response moves to the caller
    println!("<- {}", response.status()); // => golden line two: the answer left
    // => the response continues to the caller untouched
    response // => logging observes; it never rewrites
} // => middleware ends: two prints around one run

// => hello answers the single route the logging wraps
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the logger exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: every call passes the logger first
    Router::new().route("/hello", get(hello)).layer(middleware::from_fn(logger)) // => from_fn lifts the function into the stack
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the logger prints the interesting lines
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the logger prints around this call
    // => to_bytes drains the body so the response is fully consumed
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the body line proves the handler ran between the two log lines
    println!("body {}", String::from_utf8_lossy(&bytes)); // => golden line three: what the handler wrote
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call once, watch the three lines land in order
    let app = app(); // => the service under test, built by its constructor
    // => the log lines bracket the handler body in call order
    check(app.clone(), "GET", "/hello").await; // => Output: -> GET /hello, <- 200 OK, body {"message":"hello, axum"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-26-middleware-logs-every-request/expected/main.stdout.txt`):

```text
-> GET /hello
<- 200 OK
body {"message":"hello, axum"}
```

**Key takeaway**: `from_fn(logger)` brackets every call with two prints; `next.run(req)` is the line the handler runs on.

**Why it matters**: Observability starts with knowing what arrived and what left, and middleware is where that knowledge lives without touching handlers. Deterministic log lines — no clocks, no thread names — test exactly like responses: the golden proves the logger ran, in order, around the handler. This observe-don't-rewrite shape is the template for every layer in the cluster.

---

### Example 27: Auth Layer Rejects Anonymous Calls

Middleware can answer early: no token, no handler, one 401 envelope. This example gates a secret route with a bearer check, proving all three credential legs: right token serves, wrong token stops, missing token stops identically.

Early answers skip `next` entirely — the handler never runs for strangers. The 401 uses the shared error envelope, so auth failures read like every other failure to clients.

(Concepts: co-02, co-05.)

**`learning/code/ex-27-auth-layer-rejects-anonymous-calls/src/main.rs`**:

```rust
// Example 27: Auth Layer Rejects Anonymous Calls.
// middleware can answer early: no token, no handler, one 401 envelope.
use axum::{Router, body::Body, http::{Request, StatusCode}, middleware::{self, Next}, response::{IntoResponse, Json, Response}, routing::get}; // => from_fn lifts auth into the stack beside the route
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
    next.run(req).await // => auth observes the pass leg and rewrites nothing
} // => middleware ends: one gate, two outcomes, zero handler knowledge

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the gate already ran

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: auth runs before the handler on every call
    Router::new().route("/secret", get(secret)).layer(middleware::from_fn(auth)) // => the gate stands in front of the secret
} // => constructor ends: wiring stays separate from traffic

// => check serves one guarded call and prints its status line
async fn check(app: Router, token: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/secret"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(value) = token { builder = builder.header("authorization", format!("Bearer {value}")); } // => the credential rides as one header
    // => an empty body keeps the call a pure gate probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => auth answers early or the handler answers late
    // => status names what happened; the body carries secret or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both legs write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line: sent token, status, reply
    println!("GET /secret token={} -> {status} {shown}", token.unwrap_or("(none)")); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, probe the gate with three credentials
    let app = app(); // => the service under test, built by its constructor
    // => the right token opens the gate to the secret
    check(app.clone(), Some("s3cret")).await; // => Output: 200 {"secret":"the-cake-is-documented"}
    // => the wrong token stops at the gate with the envelope
    check(app.clone(), Some("nope")).await; // => Output: 401 {"error":"unauthorized"}
    // => no token stops at the same gate with the same envelope
    check(app.clone(), None).await; // => Output: 401 {"error":"unauthorized"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-27-auth-layer-rejects-anonymous-calls/expected/main.stdout.txt`):

```text
GET /secret token=s3cret -> 200 OK {"secret":"the-cake-is-documented"}
GET /secret token=nope -> 401 Unauthorized {"error":"unauthorized"}
GET /secret token=(none) -> 401 Unauthorized {"error":"unauthorized"}
```

**Key takeaway**: A gate answers 401 early without calling `next`; the handler only runs for the right token.

**Why it matters**: Authorization belongs in front of handlers, not inside them: handlers stay focused on business logic while the gate owns identity. Testing all three legs — right, wrong, missing — pins the gate completely, including the easy-to-forget equivalence of wrong and missing. The envelope keeps auth failures indistinguishable in shape from business failures, which is kinder to clients and safer against probing.

---

### Example 28: Order in the Stack Matters

Layers wrap outside-in: the last layer added runs first on the way in. This example stacks two named layers around one handler and prints the onion order: outer entry, inner entry, handler, inner exit, outer exit.

Layer order is a correctness property, not a style choice: logging wants the outside to time everything inside, while auth wants the inside so rejected calls still log. The golden proves the order instead of describing it.

(Concepts: co-02.)

```mermaid
flowchart TD
    accTitle: Onion order, example 28
    accDescr: Last added wraps outermost.
    req --> outer
    outer --> inner
    inner --> handler
    handler --> inner2[\"inner exit\"]
    inner2 --> outer2[\"outer exit\"]
    req[\"request\"]:::orange
    outer[\"outer\"]:::blue
    inner[\"inner\"]:::teal
    handler[\"handler\"]:::blue
    inner2[\"inner exit\"]:::teal
    outer2[\"outer exit\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-28-order-in-the-stack-matters/src/main.rs`**:

```rust
// Example 28: Order in the Stack Matters.
// layers wrap outside-in: the last layer added runs first on the way in.
use axum::{Router, body::Body, http::Request, middleware::{self, Next}, response::{Json, Response}, routing::get}; // => two from_fn layers bracket the handler in stack order
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => outer prints its entry first and its exit last: it wraps everything
async fn outer(req: Request<Body>, next: Next) -> Response {
    // => entry prints before the inner stack runs
    println!("enter outer"); // => golden line one: the outside layer started
    // => inner layers and the handler run exactly here
    let response = next.run(req).await; // => everything inside runs between the two prints
    // => exit prints after the inner stack answered
    println!("exit outer"); // => golden line four: the outside layer finished
    // => the response continues outward untouched
    response // => layers observe by default; rewriting is opt-in
} // => outer ends: first in, last out

// => inner prints its entry second and its exit third: it hugs the handler
async fn inner(req: Request<Body>, next: Next) -> Response {
    // => entry prints after outer but before the handler
    println!("enter inner"); // => golden line two: the inside layer started
    // => the handler runs exactly here, wrapped by both layers
    let response = next.run(req).await; // => the handler runs between the two prints
    // => exit prints after the handler but before outer
    println!("exit inner"); // => golden line three: the inside layer finished
    // => the response continues outward untouched
    response // => layers observe by default; rewriting is opt-in
} // => inner ends: last in, first out

// => hello answers the single route both layers wrap
async fn hello() -> Json<Value> {
    // => the handler runs between the four layer prints
    println!("handler"); // => golden line: the middle of the onion
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the layers exist

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the last layer added wraps outermost: add inner first, outer second
    Router::new().route("/hello", get(hello)).layer(middleware::from_fn(inner)).layer(middleware::from_fn(outer)) // => outer runs first in, last out: onion order
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the prints are the whole lesson
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri("/hello") // => the single path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, both layers, and the handler exactly as live
    let _ = app.oneshot(request).await.unwrap(); // => the five prints above are the golden output
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call once, watch the onion print in stack order
    let app = app(); // => the service under test, built by its constructor
    // => enter outer, enter inner, handler, exit inner, exit outer
    check(app.clone()).await; // => Output: the five lines in onion order
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-28-order-in-the-stack-matters/expected/main.stdout.txt`):

```text
enter outer
enter inner
handler
exit inner
exit outer
```

**Key takeaway**: The last `.layer` added wraps outermost; entries nest outside-in and exits unwind inside-out.

**Why it matters**: Every multi-layer stack depends on this order, and getting it backwards produces mysteries: auth inside logging means rejected calls never log, timeouts outside retries multiply the budget. The five-line golden is the cheapest possible proof of a correct stack — one call shows the whole onion. When a new layer misbehaves, this example is the reference for where it sits.

---

### Example 29: Request Id Travels End to End

Middleware stamps every request with a counter id the handler echoes. This example numbers two calls `req-1` and `req-2` through a lock-free atomic counter shared with the layer, proving the id travels from layer to handler via `Extension`.

Request ids turn scattered log lines into one traceable story: every service in the path stamps and forwards the same id. The counter keeps the demo deterministic — no randomness, no clocks — while showing the real handoff shape.

(Concepts: co-02, co-13.)

```mermaid
flowchart TD
    accTitle: Stamp flow, example 29
    accDescr: Layer stamps, handler echoes.
    req --> stamp
    stamp --> handler
    handler --> echo
    req[\"request\"]:::orange
    stamp[\"stamp\"]:::teal
    handler[\"handler\"]:::blue
    echo[\"req-N\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-29-request-id-travels-end-to-end/src/main.rs`**:

```rust
// Example 29: Request Id Travels End to End.
// middleware stamps every request with a counter id the handler echoes.
use std::sync::{Arc, atomic::{AtomicU64, Ordering}}; // => Arc shares the counter; AtomicU64 stamps without a lock
use axum::{Extension, Router, body::Body, http::Request, middleware::{self, Next}, response::{Json, Response}, routing::get}; // => Extension carries the stamped id from layer to handler
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => stamp hands every request the next id and shares it downstream
async fn stamp(state: axum::extract::State<Arc<AtomicU64>>, mut req: Request<Body>, next: Next) -> Response {
    // => from_fn with State: the counter arrives as the first argument
    let id = state.fetch_add(1, Ordering::SeqCst) + 1; // => fetch_add returns the previous value, so add one for 1-based ids
    // => Extension carries the id to the handler without touching the path
    req.extensions_mut().insert(RequestId(id)); // => insert the typed id beside the request
    // => the handler runs with the id waiting in its extensions
    next.run(req).await // => stamping observes the pass leg and rewrites nothing else
} // => middleware ends: one counter, one id per request, zero locks

// => RequestId is the typed stamp handlers read back out
#[derive(Clone)] // => Extension requires Clone to hand the id to the handler
struct RequestId(u64); // => a newtype keeps raw numbers out of handler signatures

// => hello echoes the stamped id beside the greeting
async fn hello(Extension(RequestId(id)): Extension<RequestId>) -> Json<Value> {
    // => the id arrives unwrapped: the layer already stamped this request
    Json(json!({"message": "hello, axum", "request_id": format!("req-{id}")})) // => req-1, req-2: one id per request, in order
} // => handler ends: it reads the stamp but never mints one

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the counter lives in state so the layer function can stamp from it
    let counter = Arc::new(AtomicU64::new(0)); // => starts at zero: the first request becomes req-1
    // => layer wraps the route; from_fn_with_state bakes the counter into the layer
    Router::new().route("/hello", get(hello)).layer(middleware::from_fn_with_state(counter, stamp)) // => no router state needed: the layer carries its own clone
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the stamper numbers this call in order
    // => status names what happened; the body carries greeting plus id
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every call echoes its id, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, stamped body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call twice, watch the counter stamp in order
    let app = app(); // => the service under test, built by its constructor
    // => the first request becomes req-1 beside the greeting
    check(app.clone(), "GET", "/hello").await; // => Output: 200 {"message":"hello, axum","request_id":"req-1"}
    // => the second request becomes req-2: the counter survives across calls
    check(app.clone(), "GET", "/hello").await; // => Output: 200 {"message":"hello, axum","request_id":"req-2"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-29-request-id-travels-end-to-end/expected/main.stdout.txt`):

```text
GET /hello -> 200 OK {"message":"hello, axum","request_id":"req-1"}
GET /hello -> 200 OK {"message":"hello, axum","request_id":"req-2"}
```

**Key takeaway**: `from_fn_with_state` feeds the stamper; `Extension` carries the id to the handler; atomics mint without locks.

**Why it matters**: Distributed traces start with one id per request, and this is the smallest possible version of that machinery: stamp at the edge, carry by type, echo in the reply. `Extension` keeps request-scoped data out of the path and the state — the handler signature shows exactly what the request carried. The atomic counter also previews the concurrency level: lock-free sharing across tasks with no lost update.

---

### Example 30: Timeout Bounds a Slow Handler

`TimeoutLayer` answers 408 when the handler outruns its budget. This example races a fast route and a deliberately slow one against 50 milliseconds: the fast leg answers 200, the slow leg trips the timeout in 50 milliseconds instead of five seconds.

Timeouts turn stuck dependencies into prompt failures: the layer drops the handler future, so the five-second sleep never finishes. `with_status_code` names the 408 explicitly instead of relying on the default.

(Concepts: co-02, co-05.)

```mermaid
flowchart TD
    accTitle: Timeout race, example 30
    accDescr: Fast passes, slow trips at 50ms.
    fast -->|at once| ok
    slow -->|5s| trip
    ok -->|200| out
    trip -->|408| out
    fast[\"fast\"]:::blue
    slow[\"slow\"]:::orange
    ok[\"200\"]:::blue
    trip[\"408\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-30-timeout-bounds-a-slow-handler/src/main.rs`**:

```rust
// Example 30: Timeout Bounds a Slow Handler.
// TimeoutLayer answers 408 when the handler outruns its budget.
use std::time::Duration; // => Duration names the 50ms budget without any clock read
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::get}; // => get binds two routes: one fast, one deliberately slow
use serde_json::{Value, json}; // => json! builds the fast body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket
use tower_http::timeout::TimeoutLayer; // => with_status_code answers 408 past the budget

// => fast answers at once: well inside any sane budget
async fn fast() -> Json<Value> {
    // => no sleep, no work: the answer is ready before the question lands
    Json(json!({"speed": "fast"})) // => proof the fast leg never trips the timeout
} // => handler ends: fast responses never notice the layer

// => slow sleeps past the budget: the layer answers before it wakes
async fn slow() -> Json<Value> {
    // => five seconds of sleep stands in for a stuck dependency
    tokio::time::sleep(Duration::from_secs(5)).await; // => dropped on timeout: the sleep never finishes
    // => unreachable under the 50ms budget: the layer answers 408 first
    Json(json!({"speed": "slow"})) // => this line never prints in the golden output
} // => handler ends: the timeout owns the slow leg, not this code

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the layer wraps both routes with one 50ms budget and its 408 answer
    Router::new().route("/fast", get(fast)).route("/slow", get(slow)).layer(TimeoutLayer::with_status_code(StatusCode::REQUEST_TIMEOUT, Duration::from_millis(50))) // => 50ms: fast passes, slow trips with 408
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, the timeout layer, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => slow trips at 50ms; the 5s sleep is dropped
    // => status names what happened; the body carries the fast reply or nothing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: timeout bodies are empty
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the 408 leg carries no body, so the marker names that fact
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => fast prints JSON, slow prints the marker
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, race the fast leg and the slow leg against 50ms
    let app = app(); // => the service under test, built by its constructor
    // => fast answers inside the budget with its body
    check(app.clone(), "GET", "/fast").await; // => Output: GET /fast -> 200 OK {"speed":"fast"}
    // => slow outruns the budget: 408 with no body, in 50ms not five seconds
    check(app.clone(), "GET", "/slow").await; // => Output: GET /slow -> 408 Request Timeout (empty body)
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-30-timeout-bounds-a-slow-handler/expected/main.stdout.txt`):

```text
GET /fast -> 200 OK {"speed":"fast"}
GET /slow -> 408 Request Timeout (empty body)
```

**Key takeaway**: `TimeoutLayer::with_status_code(408, 50ms)` drops handlers that outrun the budget; the slow leg answers in 50ms, not five seconds.

**Why it matters**: Every external call can wedge, and an unbounded handler turns one stuck dependency into a stuck service. Timeouts bound the damage per call, which is what lets graceful shutdown keep its deadline promises later. Testing the slow leg proves the bound holds without waiting five seconds — the layer drops the future, so the test costs 50 milliseconds.

---

### Example 31: Body Limit Stops a Giant Upload

`RequestBodyLimitLayer` answers 413 before a huge body reaches the handler. This example guards uploads with an eight-byte limit: five bytes pass to the echo, one hundred bytes stop at the layer with the framework message.

Limits protect memory before parsing starts: the handler never allocates for a body the layer already refused. The 413 body is deterministic framework text naming the exceeded limit, so the refusal leg pins exactly.

(Concepts: co-02, co-10.)

```mermaid
flowchart TD
    accTitle: Body limit, example 31
    accDescr: Small passes, giant stops at 413.
    small -->|5 bytes| echo
    giant -->|100 bytes| reject
    echo -->|200| out
    reject -->|413| out
    small[\"small\"]:::blue
    giant[\"giant\"]:::orange
    echo[\"echo\"]:::blue
    reject[\"413\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-31-body-limit-stops-a-giant-upload/src/main.rs`**:

```rust
// Example 31: Body Limit Stops a Giant Upload.
// RequestBodyLimitLayer answers 413 before a huge body reaches the handler.
use axum::{Router, body::Body, http::Request, response::Json, routing::post}; // => post binds the upload route the limit guards
use serde_json::{Value, json}; // => json! builds the accepted reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket
use tower_http::limit::RequestBodyLimitLayer; // => the limit answers 413 past eight bytes

// => upload answers the small bodies the limit lets through
async fn upload(body: String) -> Json<Value> {
    // => String collects the whole body: reachable only below the limit
    Json(json!({"bytes": body.len()})) // => the echo proves the body arrived intact
} // => handler ends: giant bodies never reach this line

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => eight bytes is tiny on purpose: the demo trips the limit fast
    Router::new().route("/upload", post(upload)).layer(RequestBodyLimitLayer::new(8)) // => past 8 bytes the layer answers 413
} // => constructor ends: wiring stays separate from traffic

// => post_body serves one upload in-process and prints its status line
async fn post_body(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => uploads always post in this service
        .uri("/upload") // => the single upload path, with no host or port
        .header("content-type", "text/plain") // => String accepts any body type
        .body(Body::from(body.to_owned())) // => the upload bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, the limit layer, and the handler exactly as live
    let response = app.oneshot(request).await.unwrap(); // => giant bodies stop at the layer with 413
    // => status names what happened; the body carries the echo or nothing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: 413 bodies are empty
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the 413 leg carries no body, so the marker names that fact
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => small prints JSON, giant prints the marker
    // => one golden line per call: sent length, status, reply
    println!("POST /upload len={} -> {status} {shown}", body.len()); // => the harness compares this line with the golden file
} // => post_body ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, upload one small body and one giant one
    let app = app(); // => the service under test, built by its constructor
    // => five bytes pass the limit: the handler echoes the length
    post_body(app.clone(), "abcde").await; // => Output: POST /upload len=5 -> 200 OK {"bytes":5}
    // => one hundred bytes trip the limit: 413 with no body
    post_body(app.clone(), &"x".repeat(100)).await; // => Output: POST /upload len=100 -> 413 Payload Too Large (empty body)
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-31-body-limit-stops-a-giant-upload/expected/main.stdout.txt`):

```text
POST /upload len=5 -> 200 OK {"bytes":5}
POST /upload len=100 -> 413 Payload Too Large Failed to buffer the request body: length limit exceeded
```

**Key takeaway**: `RequestBodyLimitLayer::new(8)` refuses oversized bodies with 413 before the handler allocates.

**Why it matters**: Unbounded bodies are a denial-of-service vector: one giant upload can eat the memory meant for every other request. A layer-level limit applies before any handler code runs, so no route can forget it. Pinning the framework message documents the exact client experience — a clear limit error, not a hung connection or a mysterious reset.

---

### Example 32: Errors Become JSON with One Type

Four failures share one envelope through a single `IntoResponse` impl. This example reports absence, refusal, stranger, and outage through one `AppError` type, with each variant picking its code and machine-readable name.

The `match` keeps the mapping total: adding a variant without a code fails to compile, so no failure slips out unshaped. One route demos all four through its path segment, proving the envelope never changes shape across codes.

(Concepts: co-05, co-04.)

**`learning/code/ex-32-errors-become-json-with-one-type/src/main.rs`**:

```rust
// Example 32: Errors Become JSON with One Type.
// four failures share one envelope through a single IntoResponse impl.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::{IntoResponse, Json}, routing::get}; // => IntoResponse renders every variant as status plus envelope
use serde_json::{Value, json}; // => json! builds the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppError names the four failures this service reports
enum AppError {
    // => the id names nothing in the store
    NoOrder, // => 404: absence, not a crash
    // => the body parsed but the qty breaks the bounds
    BadQty, // => 422: understood, but refused
    // => the caller knocked without credentials
    Unauthorized, // => 401: identity missing or wrong
    // => the store behind the handler gave up
    StoreDown, // => 503: retry later, not now
} // => enum ends: every failure is one of these four variants

// => IntoResponse renders each variant as status plus the shared envelope
impl IntoResponse for AppError {
    // => self is consumed: each error answers exactly once
    fn into_response(self) -> axum::response::Response {
        // => each variant picks its code and its machine-readable code
        let (status, code) = match self { // => match keeps the mapping total: no silent variant
            AppError::NoOrder => (StatusCode::NOT_FOUND, "no_order"), // => 404 for absence
            AppError::BadQty => (StatusCode::UNPROCESSABLE_ENTITY, "bad_qty"), // => 422 for refusal
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized"), // => 401 for strangers
            AppError::StoreDown => (StatusCode::SERVICE_UNAVAILABLE, "store_down"), // => 503 for outage
        }; // => the pair is decided: render it below
        // => every failure shares one envelope: code plus message
        (status, Json(json!({"code": code, "message": format!("request failed: {code}")}))).into_response() // => the envelope never changes shape
    } // => render ends: failures are responses with a contract
} // => impl ends: this type is the whole error boundary

// => fail answers with whichever variant its path names
async fn fail(axum::extract::Path(which): axum::extract::Path<String>) -> Result<Json<Value>, AppError> {
    // => the path picks the variant: one route demos all four failures
    match which.as_str() { // => &str keeps the four arms readable
        "missing" => Err(AppError::NoOrder), // => absence answers 404 below
        "qty" => Err(AppError::BadQty), // => refusal answers 422 below
        "anon" => Err(AppError::Unauthorized), // => strangers answer 401 below
        _ => Err(AppError::StoreDown), // => everything else is an outage: 503 below
    } // => match ends: every arm leaves through the envelope
} // => handler ends: one return type carries all five outcomes

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route demos the whole error type through its path segment
    Router::new().route("/fail/{which}", get(fail)) // => GET /fail/missing answers 404, and so on
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
    // => every variant writes the envelope, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: path, status, envelope
    println!("GET {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger all four variants through one envelope
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 inside the shared envelope
    check(app.clone(), "/fail/missing").await; // => Output: 404 {"code":"no_order","message":"request failed: no_order"}
    // => refusal answers 422 inside the same envelope shape
    check(app.clone(), "/fail/qty").await; // => Output: 422 {"code":"bad_qty","message":"request failed: bad_qty"}
    // => strangers answer 401 inside the same envelope shape
    check(app.clone(), "/fail/anon").await; // => Output: 401 {"code":"unauthorized","message":"request failed: unauthorized"}
    // => outage answers 503 inside the same envelope shape
    check(app.clone(), "/fail/boom").await; // => Output: 503 {"code":"store_down","message":"request failed: store_down"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-32-errors-become-json-with-one-type/expected/main.stdout.txt`):

```text
GET /fail/missing -> 404 Not Found {"code":"no_order","message":"request failed: no_order"}
GET /fail/qty -> 422 Unprocessable Entity {"code":"bad_qty","message":"request failed: bad_qty"}
GET /fail/anon -> 401 Unauthorized {"code":"unauthorized","message":"request failed: unauthorized"}
GET /fail/boom -> 503 Service Unavailable {"code":"store_down","message":"request failed: store_down"}
```

**Key takeaway**: One enum with four variants plus one `IntoResponse` impl covers absence, refusal, stranger, and outage in one envelope.

**Why it matters**: Real services fail in more ways than two, and the envelope scales by adding variants instead of inventing shapes. The 5xx leg matters operationally: `store_down` tells the client to retry later, while 4xx legs say retrying is pointless. Pinning all four golden lines means the error contract grows deliberately — a new failure mode arrives with its code, its message, and its test.

---

### Example 33: Fallback Handles Unknown Routes

Fallback with a `Uri` extractor names the missed path in the envelope. This example serves one real route and names two misses — shallow and nested — inside the shared 404 shape.

The nested miss proves `Uri` carries the full path, not just the first segment: deep typos diagnose as precisely as shallow ones. Known paths never touch the fallback, so the safety net costs nothing on the happy path.

(Concepts: co-05, co-01.)

**`learning/code/ex-33-fallback-handles-unknown-routes/src/main.rs`**:

```rust
// Example 33: Fallback Handles Unknown Routes.
// fallback with a Uri extractor names the missed path in the envelope.
use axum::{Router, body::Body, http::{Request, StatusCode, Uri}, response::Json, routing::get}; // => Uri names the missed path inside the fallback
use serde_json::{Value, json}; // => json! builds the snapshot and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ok answers the one real route, so the fallback is not the whole story
async fn ok() -> Json<Value> {
    // => a fixed body keeps the happy path golden
    Json(json!({"ok": true})) // => true means the route exists and ran
} // => handler ends: known paths never reach the fallback

// => missing names the unclaimed path inside the shared envelope
async fn missing(uri: Uri) -> (StatusCode, Json<Value>) {
    // => Uri arrives as an extractor: the exact path nobody routed
    (StatusCode::NOT_FOUND, Json(json!({"error": "no_route", "path": uri.path()}))) // => 404 plus the path that missed
} // => handler ends: absence is a designed response with the evidence attached

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => fallback runs only when no route matches: the safety net, not a route
    Router::new().route("/ok", get(ok)).fallback(missing) // => one real route plus the net underneath
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing and the fallback exactly as live
    let response = app.oneshot(request).await.unwrap(); // => misses land in the fallback with their path
    // => status names what happened; the body carries snapshot or envelope
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
    // => build once, hit the route and two misses through the fallback
    let app = app(); // => the service under test, built by its constructor
    // => the known route answers 200 and never sees the fallback
    check(app.clone(), "GET", "/ok").await; // => Output: GET /ok -> 200 OK {"ok":true}
    // => the first miss lands in the fallback with its path echoed
    check(app.clone(), "GET", "/nope").await; // => Output: 404 {"error":"no_route","path":"/nope"}
    // => a nested miss echoes its full path, proving Uri carries everything
    check(app.clone(), "GET", "/orders/o-9/lines").await; // => Output: 404 {"error":"no_route","path":"/orders/o-9/lines"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-33-fallback-handles-unknown-routes/expected/main.stdout.txt`):

```text
GET /ok -> 200 OK {"ok":true}
GET /nope -> 404 Not Found {"error":"no_route","path":"/nope"}
GET /orders/o-9/lines -> 404 Not Found {"error":"no_route","path":"/orders/o-9/lines"}
```

**Key takeaway**: `.fallback(missing)` with a `Uri` extractor names every miss — shallow or nested — inside the 404 envelope.

**Why it matters**: Misses are support tickets waiting to happen, and the echoed path resolves most of them without logs: the client sees exactly which path nobody claimed. The nested miss proves the evidence survives depth, which is where hand-rolled 404s usually go vague. A fallback that names paths also feeds miss-counting dashboards, turning typos into measurable API-design feedback.

---

### Example 34: CORS Layer Answers Preflight

`CorsLayer` declares the allowed origin; the browser enforces the match. This example permits one origin through a predicate: its preflight answers 200 with the allow header, while a stranger's preflight answers 200 with no allow header — and no allow header means the browser blocks the call.

The server never rejects strangers itself: CORS is a declaration the browser reads, not a gate the server holds. The observable contract is the header's presence, so the test asserts exactly that.

(Concepts: co-02, co-04.)

```mermaid
flowchart TD
    accTitle: CORS declare, example 34
    accDescr: Header present passes; absent blocks.
    listed -->|match| header
    stranger -->|no match| noheader[\"no header\"]
    header -->|200| out
    noheader -->|200| out
    listed[\"listed\"]:::blue
    stranger[\"stranger\"]:::orange
    header[\"allow\"]:::teal
    noheader[\"no header\"]:::teal
    out[\"browser\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-34-cors-layer-answers-preflight/src/main.rs`**:

```rust
// Example 34: CORS Layer Answers Preflight.
// CorsLayer permits the listed origin before any handler runs.
use axum::{Router, body::Body, http::{HeaderValue, Method, Request}, response::Json, routing::get}; // => Method names OPTIONS for the preflight probe
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket
use tower_http::cors::{AllowOrigin, Any, CorsLayer}; // => CorsLayer declares the allowed origin; the browser enforces the match

// => hello answers the single route the CORS layer guards
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the CORS layer exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the predicate permits one origin: matches emit the header, strangers get none
    let cors = CorsLayer::new().allow_origin(AllowOrigin::predicate(|origin: &HeaderValue, _| origin.as_bytes() == b"https://app.example")).allow_methods([Method::GET, Method::POST]).allow_headers(Any); // => one origin, two verbs, any header
    // => layer wraps the route: preflights stop here, real calls pass through
    Router::new().route("/hello", get(hello)).layer(cors) // => CORS runs before the handler on every call
} // => constructor ends: wiring stays separate from traffic

// => preflight serves one OPTIONS probe and prints status plus the allow header
async fn preflight(app: Router, origin: &str) {
    // => Request::builder shapes a server-side preflight without a client
    let request = Request::builder() // => start from an empty request builder
        .method("OPTIONS") // => preflights always probe with OPTIONS
        .uri("/hello") // => the route under probe, with no host or port
        .header("origin", origin) // => the calling origin the layer judges
        .header("access-control-request-method", "GET") // => the verb the browser wants to use
        .body(Body::empty()) // => preflights carry no payload
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing and the CORS layer exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the layer answers: the handler never runs
    // => status plus the allow-origin echo are the two preflight promises
    let status = response.status(); // => keep the code plus reason before the parts move
    // => allow-origin echoes the permitted origin or stays absent for strangers
    let allowed = response.headers().get("access-control-allow-origin").map(|v| v.to_str().unwrap().to_owned()).unwrap_or("(none)".to_owned()); // => owned text keeps the print total
    // => one golden line: sent origin, status, allowed origin
    println!("OPTIONS /hello origin={origin} -> {status} allow_origin={allowed}"); // => the harness compares this line with the golden file
} // => preflight ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, probe with the listed origin and one stranger
    let app = app(); // => the service under test, built by its constructor
    // => the listed origin passes: 200 with the allow header naming it
    preflight(app.clone(), "https://app.example").await; // => Output: 200 allow_origin=https://app.example
    // => the stranger gets 200 with no allow header: the browser blocks that call
    preflight(app.clone(), "https://evil.example").await; // => Output: 200 allow_origin=(none): declared, not permitted
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-34-cors-layer-answers-preflight/expected/main.stdout.txt`):

```text
OPTIONS /hello origin=https://app.example -> 200 OK allow_origin=https://app.example
OPTIONS /hello origin=https://evil.example -> 200 OK allow_origin=(none)
```

**Key takeaway**: The predicate emits `allow-origin` for the listed origin and nothing for strangers; both preflights answer 200.

**Why it matters**: CORS confuses because the server never says no — the browser does, by reading the header the server sent. Testing the header's presence instead of the status asserts the real contract: permitted means declared, stranger means silent. The predicate keeps the rule in code review instead of configuration, so the allowed origin stays visible beside the routes it guards.

---

### Example 35: State Shares One Store

`with_state` hands every handler the same `Arc`; `State` unpacks it per call. This example seeds one order store and reads it twice through the shared state, proving both reads see the same rows.

Shared state replaces globals: the store arrives by construction, and handlers borrow it per call instead of reaching for statics. Cloning the `Arc` per call is cheap — the vector stays put while pointers multiply.

(Concepts: co-06.)

```mermaid
flowchart TD
    accTitle: Shared store, example 35
    accDescr: One Arc serves every handler call.
    store --> call1[\"call 1\"]
    store --> call2[\"call 2\"]
    call1 --> list1[\"list\"]
    call2 --> list2[\"list\"]
    store[\"Arc store\"]:::orange
    call1[\"call 1\"]:::blue
    call2[\"call 2\"]:::blue
    list1[\"rows\"]:::teal
    list2[\"rows\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-35-state-shares-one-store/src/main.rs`**:

```rust
// Example 35: State Shares One Store.
// with_state hands every handler the same Arc; State unpacks it per call.
use std::sync::{Arc, Mutex}; // => Arc shares the store; Mutex guards the vector inside
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the shared value per handler call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value every handler shares: the store behind an Arc
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector, many readers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => list reads the shared store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the shared contents in store order
    Json(json!({"orders": orders})) // => seeded once below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the store is seeded once here, then shared by every handler call
    let state = AppState { orders: Arc::new(Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()])) }; // => two orders, always in this order
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => one store, every call, zero globals
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the Arc for this call
    // => status names what happened; the body carries the shared listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the listing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the shared store twice through one state
    let app = app(); // => the service under test, built by its constructor
    // => the first read lists both seeded orders in store order
    check(app.clone(), "GET", "/orders").await; // => Output: 200 {"orders":["o-1","o-2"]}
    // => the second read lists the same store: sharing means same contents
    check(app.clone(), "GET", "/orders").await; // => Output: 200 {"orders":["o-1","o-2"]}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-35-state-shares-one-store/expected/main.stdout.txt`):

```text
GET /orders -> 200 OK {"orders":["o-1","o-2"]}
GET /orders -> 200 OK {"orders":["o-1","o-2"]}
```

**Key takeaway**: `with_state` moves one value into the router; `State` unpacks a cheap `Arc` clone per call.

**Why it matters**: State is how axum services share without globals: the constructor owns the store, the router carries it, handlers borrow it. Seeding once and reading twice proves the sharing is real — both lines show the same rows because both calls read the same vector. This constructor-plus-state shape is the foundation for stores, config, and test worlds through the rest of the course.

---

### Example 36: State Stays Cloneable and Cheap

Cloning state clones the `Arc` pointer, never the data behind it. This example reports the live holder count beside the row count, proving handlers hold pointers while the data stays put.

The count is deterministic inside one run: the router holds one, the in-flight call holds one, and the extractor holds one. Cheap clones are what make per-call unpacking free — no serialization, no copy, just a pointer bump.

(Concepts: co-06.)

**`learning/code/ex-36-state-stays-cloneable-and-cheap/src/main.rs`**:

```rust
// Example 36: State Stays Cloneable and Cheap.
// cloning state clones the Arc pointer, never the data behind it.
use std::sync::{Arc, Mutex}; // => Arc shares the store; strong_count proves the sharing
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks one cheap clone per handler call
use serde_json::{Value, json}; // => json! builds the count reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value every handler shares: the store behind an Arc
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector, many holders, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => holders reports how many Arc owners exist: proof clones are cheap
async fn holders(State(state): State<AppState>) -> Json<Value> {
    // => strong_count reads the live holder count without locking the data
    Json(json!({"holders": Arc::strong_count(&state.orders)})) // => router plus this call: a small fixed number
} // => handler ends: the count is deterministic inside one run

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the store is seeded once here, then shared by every handler call
    let state = AppState { orders: Arc::new(Mutex::new(vec!["o-1".to_owned()])) }; // => one order; the count is about holders, not rows
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/holders", get(holders)).with_state(state) // => one store, every call, zero globals
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the Arc for this call
    // => status names what happened; the body carries the holder count
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the count always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the holder count through the shared state
    let app = app(); // => the service under test, built by its constructor
    // => router plus per-call clone: a small fixed holder count, never the data size
    check(app.clone(), "GET", "/holders").await; // => Output: 200 with the fixed holder count
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-36-state-stays-cloneable-and-cheap/expected/main.stdout.txt`):

```text
GET /holders -> 200 OK {"holders":3}
```

**Key takeaway**: `Arc::strong_count` proves three holders — router, call, extractor — while the data stays in one place.

**Why it matters**: "Cloneable state" sounds expensive until you count the holders: three pointers, one vector. That count is why per-call `State` unpacking costs nothing measurable — the alternative, rebuilding or locking global state per call, costs far more. Tests can also assert the count to catch accidental data clones: if a refactor copies the vector, the count stays three but memory tells the story elsewhere.

---

### Example 37: Constructor Keeps Wiring in One Place

`build_app` takes a seed and returns a full router: tests build two worlds. This example wires a seeded world and an empty world from one constructor, proving the same code serves different data by construction.

Constructors are the dependency-injection seam: swapping dependencies means building another world, not reaching into the running one. The empty world is the test double — tests grow it themselves instead of scrubbing production rows.

(Concepts: co-06.)

```mermaid
flowchart TD
    accTitle: Two worlds, example 37
    accDescr: One constructor builds seeded and empty.
    ctor --> seeded
    ctor --> empty
    seeded --> rows
    empty --> none[\"none\"]
    ctor[\"build_app\"]:::orange
    seeded[\"seeded\"]:::blue
    empty[\"empty\"]:::blue
    rows[\"1 row\"]:::teal
    none[\"0 rows\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-37-constructor-keeps-wiring-in-one-place/src/main.rs`**:

```rust
// Example 37: Constructor Keeps Wiring in One Place.
// build_app takes a seed and returns a full router: tests build two worlds.
use std::sync::{Arc, Mutex}; // => Arc shares the store; Mutex guards the vector inside
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the shared value per handler call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value every handler shares: the store behind an Arc
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector per world, many readers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => list reads the shared store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the shared contents in store order
    Json(json!({"orders": orders})) // => seeded per world below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => build_app wires the whole service from one seed: the constructor under test
fn build_app(seed: Vec<String>) -> Router {
    // => the seed becomes the store: each world starts from its own rows
    let state = AppState { orders: Arc::new(Mutex::new(seed)) }; // => owned seed in, shared store out
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => one store per world, zero globals
} // => constructor ends: every route and its state leave together

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the Arc for this call
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the listing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per world: world name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the routers and the checks
async fn main() {
    // => build two worlds from one constructor: seeded and empty
    let seeded = build_app(vec!["o-1".to_owned()]); // => the world with one row
    // => the empty world starts from no rows at all
    let empty = build_app(vec![]); // => the world the tests grow themselves
    // => the seeded world lists its row
    check(seeded.clone(), "seeded").await; // => Output: seeded GET /orders -> 200 OK {"orders":["o-1"]}
    // => the empty world lists nothing: same code, different seed
    check(empty.clone(), "empty").await; // => Output: empty GET /orders -> 200 OK {"orders":[]}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-37-constructor-keeps-wiring-in-one-place/expected/main.stdout.txt`):

```text
seeded GET /orders -> 200 OK {"orders":["o-1"]}
empty GET /orders -> 200 OK {"orders":[]}
```

**Key takeaway**: `build_app(seed)` returns a full router per world; tests choose their rows by construction.

**Why it matters**: Test isolation lives or dies on construction: worlds built per case cannot leak rows between cases. The constructor is also the whole wiring surface — routes, state, and layers leave together — so reviewing one function reviews the service's dependencies. Production calls it with the real seed; tests call it with fakes; the code under test never knows which.

---

### Example 38: Handler Takes Only What It Needs

Two small services carry different states: each handler unpacks its own kind. This example wires a catalog service and a limits service separately, proving each handler names only its own concern.

Minimal signatures are documentation: the listing handler cannot touch limits because it never receives them. Splitting by concern also splits blast radius — a catalog outage never takes the checkout config with it.

(Concepts: co-06, co-15.)

**`learning/code/ex-38-handler-takes-only-what-it-needs/src/main.rs`**:

```rust
// Example 38: Handler Takes Only What It Needs.
// two small services carry different states: each handler unpacks its own kind.
use std::sync::{Arc, Mutex}; // => Arc shares the catalog; Mutex guards its vector
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks each service's own value
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Catalog is the read-heavy state the listing handler needs
#[derive(Clone)] // => Clone shares the Arc, never the vector
struct Catalog {
    // => the items the listing reads on every call
    items: Arc<Mutex<Vec<String>>>, // => one vector, many readers, one lock
} // => struct ends: the listing's whole world in one value

// => Limits is the config state the checkout handler needs
#[derive(Clone)] // => Clone copies two numbers: cheaper than any Arc
struct Limits {
    // => the most units one line may carry
    max_qty: u32, // => the bound the handler enforces
    // => the currency every price renders in
    currency: &'static str, // => static keeps the config borrow-free
} // => struct ends: the checkout's whole world in one value

// => items reads the catalog and nothing else: its signature proves it
async fn items(State(catalog): State<Catalog>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let items = catalog.items.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the catalog in store order
    Json(json!({"items": items})) // => seeded once below, read on every call
} // => handler ends: Limits is not even named here

// => checkout reads the limits and nothing else: its signature proves it
async fn checkout(State(limits): State<Limits>) -> Json<Value> {
    // => the handler renders the bound it enforces, in its currency
    Json(json!({"max_qty": limits.max_qty, "currency": limits.currency})) // => config out, no store touched
} // => handler ends: Catalog is not even named here

// => catalog_app wires the listing service with its catalog state
fn catalog_app() -> Router {
    // => the catalog seeds one item; the listing handler takes only this
    Router::new().route("/items", get(items)).with_state(Catalog { items: Arc::new(Mutex::new(vec!["pen".to_owned()])) }) // => one state kind per service
} // => constructor ends: routes and their state leave together

// => checkout_app wires the checkout service with its limits state
fn checkout_app() -> Router {
    // => the limits seed one bound; the checkout handler takes only this
    Router::new().route("/checkout", get(checkout)).with_state(Limits { max_qty: 100, currency: "IDR" }) // => a different state kind for a different concern
} // => constructor ends: each service owns exactly what its handlers need

// => check serves one request in-process and prints its status line
async fn check(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones this service's value for the call
    // => status names what happened; the body carries this service's reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both services write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: path, status, body
    println!("GET {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the services and the checks
async fn main() {
    // => build two small services: catalog state for one, limits for the other
    let catalog = catalog_app(); // => the listing world, built by its constructor
    // => the checkout world stands beside it with its own state kind
    let checkout = checkout_app(); // => the config world, built by its constructor
    // => the listing reads its catalog and knows nothing of limits
    check(catalog.clone(), "/items").await; // => Output: GET /items -> 200 OK {"items":["pen"]}
    // => checkout reads its limits and knows nothing of the catalog
    check(checkout.clone(), "/checkout").await; // => Output: GET /checkout -> 200 OK {"max_qty":100,"currency":"IDR"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-38-handler-takes-only-what-it-needs/expected/main.stdout.txt`):

```text
GET /items -> 200 OK {"items":["pen"]}
GET /checkout -> 200 OK {"currency":"IDR","max_qty":100}
```

**Key takeaway**: Each service carries its own state kind; each handler unpacks only the concern it serves.

**Why it matters**: Over-shared state couples outages: one poisoned value takes every handler that touches it. Minimal handler signatures prove the split at a glance — if `Limits` never appears in the listing handler, no limits bug can break the listing. Note the alphabetical key order in the golden: `serde_json` sorts keys without the `preserve_order` feature, so goldens always read alphabetically regardless of struct order.

---

### Example 39: Extension Carries Request-Scoped Data

Middleware inserts one `User` per request; the handler reads it back out. This example resolves the identity header into a typed `User` in the layer and greets it in the handler, with guests greeted as guests.

`Extension` carries per-request values that are neither path, query, nor state: identity, trace ids, tenant markers. Typing the value keeps the handoff compile-checked — inserting a `User` and reading a `User` must agree, or the build fails.

(Concepts: co-06, co-02.)

**`learning/code/ex-39-extension-carries-request-scoped-data/src/main.rs`**:

```rust
// Example 39: Extension Carries Request-Scoped Data.
// middleware inserts one User per request; the handler reads it back out.
use axum::{Extension, Router, body::Body, http::Request, middleware::{self, Next}, response::{Json, Response}, routing::get}; // => Extension moves per-request values from layer to handler
use serde_json::{Value, json}; // => json! builds the greeting reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => User is the request-scoped identity one middleware mints per call
#[derive(Clone)] // => Extension requires Clone to hand the value to the handler
struct User {
    // => the caller name the gate resolved from the token
    name: String, // => owned: each request carries its own copy
} // => struct ends: per-request data, never shared state

// => identify resolves the token into a User and inserts it for the handler
async fn identify(mut req: Request<Body>, next: Next) -> Response {
    // => the token rides in x-user for this demo; a real gate would verify more
    let name = req.headers().get("x-user").and_then(|v| v.to_str().ok()).unwrap_or("guest").to_owned(); // => missing header means the guest identity
    // => insert moves the User into the request extensions beside the body
    req.extensions_mut().insert(User { name }); // => the handler reads this back by type below
    // => the handler runs with the identity waiting in its extensions
    next.run(req).await // => identifying observes the pass leg and rewrites nothing else
} // => middleware ends: one identity minted per request, zero globals

// => hello greets the identity the middleware resolved for this request
async fn hello(Extension(user): Extension<User>) -> Json<Value> {
    // => the User arrives by type: no header parsing lives in the handler
    Json(json!({"hello": user.name})) // => ada hears ada, guests hear guest
} // => handler ends: identity in, greeting out, no gate code

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: identify runs before the handler on every call
    Router::new().route("/hello", get(hello)).layer(middleware::from_fn(identify)) // => the identity hop stands in front of the greeting
} // => constructor ends: wiring stays separate from traffic

// => check serves one identified call and prints its status line
async fn check(app: Router, user: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/hello"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(name) = user { builder = builder.header("x-user", name); } // => the credential rides as one header
    // => an empty body keeps the call a pure identity probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, the identity layer, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => identify mints the User for this call
    // => status names what happened; the body carries the personal greeting
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every call greets somebody, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line: sent token, status, greeting
    println!("GET /hello x-user={} -> {status} {shown}", user.unwrap_or("(none)")); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, greet the named caller and the guest
    let app = app(); // => the service under test, built by its constructor
    // => the named token resolves to ada and the greeting says so
    check(app.clone(), Some("ada")).await; // => Output: 200 {"hello":"ada"}
    // => no token resolves to guest: the handler still answers 200
    check(app.clone(), None).await; // => Output: 200 {"hello":"guest"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-39-extension-carries-request-scoped-data/expected/main.stdout.txt`):

```text
GET /hello x-user=ada -> 200 OK {"hello":"ada"}
GET /hello x-user=(none) -> 200 OK {"hello":"guest"}
```

**Key takeaway**: The layer inserts `User` into extensions; the handler reads it back by type with `Extension<User>`.

**Why it matters**: Request-scoped data sits between extractors and state: too per-request for state, too computed for extractors. `Extension` types the handoff so mismatches fail compilation, not requests — inserting `User` while reading `Admin` is a build error, not a 500. Resolving identity once in the layer also keeps every downstream handler free of header parsing: identity in, business out.

---

### Example 40: Config Arrives as Typed State

Limits and currency ride in `State`: handlers read config, never constants. This example prices one line total inside the configured currency and bound, proving tuning the config retunes every reply.

Typed config beats environment reads scattered across handlers: every knob is visible in one struct, and changing a default means editing the constructor — not hunting stringly-typed lookups. The reply echoes the knobs beside the total, so config and computation stay jointly testable.

(Concepts: co-06, co-15.)

**`learning/code/ex-40-config-arrives-as-typed-state/src/main.rs`**:

```rust
// Example 40: Config Arrives as Typed State.
// limits and currency ride in State: handlers read config, never constants.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the typed config per handler call
use serde_json::{Value, json}; // => json! builds the priced reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ShopConfig names the two knobs operators tune without touching code
#[derive(Clone)] // => Clone copies two small values: cheaper than any Arc
struct ShopConfig {
    // => the currency every price renders in
    currency: &'static str, // => static keeps the config borrow-free
    // => the most units one line may carry
    max_qty: u32, // => the bound pricing enforces below
} // => struct ends: deployment facts as a compile-time shape

// => price renders one line total inside the configured currency and bound
async fn price(State(config): State<ShopConfig>) -> Json<Value> {
    // => the unit price is fixed for the demo; config shapes how it renders
    let total = 2 * 1500; // => two units at fifteen hundred each: fixed arithmetic
    // => the reply carries the total beside the knobs that shaped it
    Json(json!({"total": total, "currency": config.currency, "max_qty": config.max_qty})) // => config out, no constant duplicated
} // => handler ends: tuning the config retunes every reply

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the config seeds IDR and a bound of one hundred: one edit retunes the service
    Router::new().route("/price", get(price)).with_state(ShopConfig { currency: "IDR", max_qty: 100 }) // => typed config in, magic constants out
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the config for this call
    // => status names what happened; the body carries the priced reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => pricing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the priced reply shaped by the config
    let app = app(); // => the service under test, built by its constructor
    // => the total renders in IDR beside the bound of one hundred
    check(app.clone(), "GET", "/price").await; // => Output: 200 {"total":3000,"currency":"IDR","max_qty":100}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-40-config-arrives-as-typed-state/expected/main.stdout.txt`):

```text
GET /price -> 200 OK {"currency":"IDR","max_qty":100,"total":3000}
```

**Key takeaway**: `State<ShopConfig>` delivers deployment knobs as typed values; handlers never read constants or environment.

**Why it matters**: Magic constants rot: the same bound spelled in three handlers drifts to three values. One config struct keeps every knob in one reviewable place, and the constructor call shows the production values beside the code that consumes them. Tests build alternate configs the same way — a different currency per case, no environment juggling — which is dependency injection at its most boring and most useful.

---

### Example 41: Store Trait Keeps Handlers Testable

Handlers depend on `Arc<dyn OrderStore>`: fakes swap in without touching routes. This example reads through a one-method trait with a boxed future, serving a seeded fake and an empty fake through the same seam.

The boxed-future method keeps the trait object-safe with no extra crate: `Pin<Box<dyn Future>>` erases each backend's tail type. Handlers name the trait, constructors supply backends — and the Postgres pool of the future swaps into the same `Arc<dyn>` slot.

(Concepts: co-06, co-09.)

```mermaid
flowchart TD
    accTitle: Trait seam, example 41
    accDescr: Handlers use the trait; fakes supply it.
    handler --> seam
    seam --> fake1[\"seeded\"]
    seam --> fake2[\"empty\"]
    handler[\"handler\"]:::blue
    seam[\"dyn trait\"]:::orange
    fake1[\"seeded\"]:::teal
    fake2[\"empty\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-41-store-trait-keeps-handlers-testable/src/main.rs`**:

```rust
// Example 41: Store Trait Keeps Handlers Testable.
// handlers depend on Arc<dyn OrderStore>: fakes swap in without touching routes.
use std::future::Future; // => Future names the boxed tail the trait returns
use std::pin::Pin; // => Pin keeps the boxed future movable across awaits
use std::sync::{Arc, Mutex}; // => Arc shares the store; Mutex guards the vector inside
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the trait object per handler call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => OrderStore names the one seam handlers program against, not any backend
trait OrderStore: Send + Sync {
    // => boxed futures keep the trait object-safe without any extra crate
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>>; // => Send keeps the future runnable on the multithread runtime
} // => trait ends: one method, every backend honors it

// => MemoryStore is the fake every test seeds: a locked vector, nothing else
struct MemoryStore {
    // => Mutex guards the vector because handlers run on many threads
    orders: Mutex<Vec<String>>, // => seeded per world below, read on every call
} // => struct ends: the test double with zero infrastructure

// => the fake honors the seam by cloning under the lock
impl OrderStore for MemoryStore {
    // => &self borrows the fake; the boxed tail owns the cloned rows
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>> {
        // => clone under the lock, move the rows into the async tail
        let rows = self.orders.lock().unwrap().clone(); // => the lock drops before the first await
        // => Box::pin erases the tail type so callers see only the trait
        Box::pin(async move { rows }) // => the rows arrive without any I/O at all
    } // => list ends: the fake answers from memory, deterministically
} // => impl ends: MemoryStore is now swappable behind the trait

// => AppState carries the seam, not the backend: handlers never name MemoryStore
#[derive(Clone)] // => Clone shares the Arc, never the store behind it
struct AppState {
    // => dyn keeps the backend open: Postgres swaps in without touching a route
    store: Arc<dyn OrderStore>, // => the seam in state position
} // => struct ends: routes depend on the trait, tests supply the fake

// => list reads through the seam: the handler cannot tell fake from Postgres
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => one await across the seam: the backend answers, whatever it is
    let orders = state.store.list().await; // => the trait answers; the handler renders
    // => the listing echoes the backend contents in backend order
    Json(json!({"orders": orders})) // => seeded per world below, read on every call
} // => handler ends: MemoryStore appears nowhere in this function

// => build_app wires the whole service from one seed behind the seam
fn build_app(seed: Vec<String>) -> Router {
    // => the fake seeds here; production would build its Postgres pool here instead
    let state = AppState { store: Arc::new(MemoryStore { orders: Mutex::new(seed) }) }; // => fake in, seam out
    // => with_state moves the seam into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => routes name the trait, never the fake
} // => constructor ends: swapping backends means changing one line above

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, seam unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the fake answers across the seam
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the listing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per world: world name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the routers and the checks
async fn main() {
    // => build two worlds from one constructor: seeded fake and empty fake
    let seeded = build_app(vec!["o-1".to_owned()]); // => the world with one row
    // => the empty world starts from no rows at all
    let empty = build_app(vec![]); // => the world the tests grow themselves
    // => the seeded fake lists its row across the seam
    check(seeded.clone(), "seeded").await; // => Output: seeded GET /orders -> 200 OK {"orders":["o-1"]}
    // => the empty fake lists nothing: same seam, different backend contents
    check(empty.clone(), "empty").await; // => Output: empty GET /orders -> 200 OK {"orders":[]}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-41-store-trait-keeps-handlers-testable/expected/main.stdout.txt`):

```text
seeded GET /orders -> 200 OK {"orders":["o-1"]}
empty GET /orders -> 200 OK {"orders":[]}
```

**Key takeaway**: `Arc<dyn OrderStore>` with a boxed-future method lets fakes and Postgres share one handler seam with no extra crate.

**Why it matters**: Handlers that name concrete stores cannot be tested without those stores: every unit test becomes an integration test. The trait draws the line handlers program against, and the fake proves the line holds — the same listing code serves seeded rows, empty rows, and eventually Postgres rows. The boxed future is the price of object safety on stable Rust, paid once in the trait instead of once per backend.

---

### Example 42: In-Memory Store Stands In for Postgres

Two backends honor one seam: the constructor picks, routes never change. This example serves identical listings from a vector store and a map store, sorting the map's keys so both goldens agree.

Backend differences must not leak into output: the map sorts because `HashMap` order is random, while the vector preserves insertion. The constructor flag is the only line a Postgres swap touches — the seam absorbs everything else.

(Concepts: co-06, co-09.)

**`learning/code/ex-42-in-memory-store-stands-in-for-postgres/src/main.rs`**:

```rust
// Example 42: In-Memory Store Stands In for Postgres.
// two backends honor one seam: the constructor picks, routes never change.
use std::collections::HashMap; // => HashMap backs the second backend; keys sort before printing
use std::future::Future; // => Future names the boxed tail the trait returns
use std::pin::Pin; // => Pin keeps the boxed future movable across awaits
use std::sync::{Arc, Mutex}; // => Arc shares each backend; Mutex guards each map
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the trait object per handler call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => OrderStore names the one seam handlers program against, not any backend
trait OrderStore: Send + Sync {
    // => boxed futures keep the trait object-safe without any extra crate
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>>; // => Send keeps the future runnable on the multithread runtime
} // => trait ends: one method, every backend honors it

// => VecStore keeps insertion order: the first backend behind the seam
struct VecStore {
    // => Mutex guards the vector because handlers run on many threads
    orders: Mutex<Vec<String>>, // => seeded per world, read on every call
} // => struct ends: order-preserving, like a fresh table scan

// => the first backend honors the seam by cloning under the lock
impl OrderStore for VecStore {
    // => &self borrows the backend; the boxed tail owns the cloned rows
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>> {
        // => clone under the lock, move the rows into the async tail
        let rows = self.orders.lock().unwrap().clone(); // => the lock drops before the first await
        // => Box::pin erases the tail type so callers see only the trait
        Box::pin(async move { rows }) // => insertion order survives the trip
    } // => list ends: the backend answers from memory, deterministically
} // => impl ends: VecStore is now swappable behind the trait

// => MapStore indexes by id: the second backend behind the same seam
struct MapStore {
    // => Mutex guards the map because handlers run on many threads
    orders: Mutex<HashMap<String, String>>, // => id to status, seeded per world
} // => struct ends: keyed access, like an indexed table

// => the second backend honors the seam by sorting before answering
impl OrderStore for MapStore {
    // => &self borrows the backend; the boxed tail owns the sorted rows
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>> {
        // => collect the ids under the lock, then sort for golden-stable output
        let mut rows: Vec<String> = self.orders.lock().unwrap().keys().cloned().collect(); // => HashMap order is random, so sort it away
        // => sort makes the map backend print exactly like the vec backend
        rows.sort(); // => deterministic order: the golden line never wobbles
        // => Box::pin erases the tail type so callers see only the trait
        Box::pin(async move { rows }) // => sorted ids arrive without any I/O at all
    } // => list ends: the backend answers from memory, deterministically
} // => impl ends: MapStore honors the same seam with different guts

// => AppState carries the seam, not any backend: handlers never name one
#[derive(Clone)] // => Clone shares the Arc, never the store behind it
struct AppState {
    // => dyn keeps the backend open: Postgres swaps in without touching a route
    store: Arc<dyn OrderStore>, // => the seam in state position
} // => struct ends: routes depend on the trait, constructors supply backends

// => list reads through the seam: the handler cannot tell vec from map
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => one await across the seam: the backend answers, whatever it is
    let orders = state.store.list().await; // => the trait answers; the handler renders
    // => the listing echoes the backend contents in backend order
    Json(json!({"orders": orders})) // => identical output from different backends
} // => handler ends: no backend type appears anywhere in this function

// => build_app wires the whole service around whichever backend the flag picks
fn build_app(use_map: bool) -> Router {
    // => the flag picks the backend: one line swaps the whole persistence story
    let store: Arc<dyn OrderStore> = if use_map { // => true takes the map backend below
        // => the map seeds two ids; sorting makes them print in order
        let mut seed = HashMap::new(); // => empty map first, rows next
        // => insert both rows before the backend moves into state
        seed.insert("o-1".to_owned(), "placed".to_owned()); // => first row: id to status
        // => the second row lands beside the first
        seed.insert("o-2".to_owned(), "paid".to_owned()); // => second row: id to status
        // => Arc::new erases the backend behind the shared seam
        Arc::new(MapStore { orders: Mutex::new(seed) }) // => map backend in, seam out
    } else { // => false takes the vec backend below
        // => the vec seeds the same two ids in insertion order
        Arc::new(VecStore { orders: Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()]) }) // => vec backend in, seam out
    }; // => store ends: one seam, two possible backends
    // => with_state moves the seam into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(AppState { store }) // => routes name the trait, never a backend
} // => constructor ends: the flag is the only line a Postgres swap touches

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, seam unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the picked backend answers across the seam
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both backends write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per world: backend name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the routers and the checks
async fn main() {
    // => build two worlds from one constructor: vec backend and map backend
    let vec_world = build_app(false); // => the insertion-order backend
    // => the keyed backend stands beside it behind the same seam
    let map_world = build_app(true); // => the indexed backend with sorted reads
    // => the vec backend lists both rows in insertion order
    check(vec_world.clone(), "vec").await; // => Output: vec GET /orders -> 200 OK {"orders":["o-1","o-2"]}
    // => the map backend lists the same rows in sorted order
    check(map_world.clone(), "map").await; // => Output: map GET /orders -> 200 OK {"orders":["o-1","o-2"]}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-42-in-memory-store-stands-in-for-postgres/expected/main.stdout.txt`):

```text
vec GET /orders -> 200 OK {"orders":["o-1","o-2"]}
map GET /orders -> 200 OK {"orders":["o-1","o-2"]}
```

**Key takeaway**: Two backends behind `Arc<dyn OrderStore>` print identical listings; the map sorts because `HashMap` order is random.

**Why it matters**: Swappable persistence is the point of the seam, and identical goldens prove the swap is behavior-preserving: no handler, route, or test changes when the backend does. The sort is the professional habit that makes map-backed stores testable at all — randomness in, determinism out. When the Postgres backend lands in production, it joins the same seam with its pool behind the same `Arc<dyn>`.

---

### Example 43: Two States Serve Two Concerns

`nest` with state: each sub-router keeps its own state kind past the join. This example nests a business router with order state and a probe router with metrics state below separate prefixes, proving each nest unpacks its own kind.

Concern-split state keeps operations data out of business handlers and vice versa: probes read counters, routes read stores, and neither names the other's type. Prefixes plus states compose — versioning and ownership in the same join.

(Concepts: co-06.)

**`learning/code/ex-43-two-states-serve-two-concerns/src/main.rs`**:

```rust
// Example 43: Two States Serve Two Concerns.
// nest with_state: each sub-router keeps its own state kind past the join.
use std::sync::{Arc, Mutex}; // => Arc shares the orders; Mutex guards the vector
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => nest joins two state-carrying routers below one root
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Orders is the business state the order routes need
#[derive(Clone)] // => Clone shares the Arc, never the vector
struct Orders {
    // => the ids the order routes read on every call
    ids: Arc<Mutex<Vec<String>>>, // => one vector, many readers, one lock
} // => struct ends: the business concern in one value

// => Metrics is the operations state the probe routes need
#[derive(Clone)] // => Clone copies one number: the probe owns its counter
struct Metrics {
    // => how many probe calls this service has answered so far
    probe_calls: u64, // => seeded at zero, moved per build, never shared
} // => struct ends: the operations concern in one value

// => orders reads the business state and nothing else
async fn orders(State(state): State<Orders>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let ids = state.ids.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the business store in store order
    Json(json!({"orders": ids})) // => seeded once below, read on every call
} // => handler ends: Metrics is not even named here

// => probe reads the operations state and nothing else
async fn probe(State(metrics): State<Metrics>) -> Json<Value> {
    // => the probe echoes its own call count seed beside liveness
    Json(json!({"ok": true, "probe_calls": metrics.probe_calls})) // => zero at build: the seed, not a live count
} // => handler ends: Orders is not even named here

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the business router carries the business state past the join
    let order_routes = Router::new().route("/orders", get(orders)).with_state(Orders { ids: Arc::new(Mutex::new(vec!["o-1".to_owned()])) }); // => business paths with business state
    // => the probe router carries the operations state past the join
    let probe_routes = Router::new().route("/healthz", get(probe)).with_state(Metrics { probe_calls: 0 }); // => probe paths with operations state
    // => nest joins each router below its own prefix with its own state intact
    Router::new().nest("/api", order_routes).nest("/ops", probe_routes) // => /api/orders and /ops/healthz, two states, one service
} // => constructor ends: concerns stay apart past the join

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => each nest unpacks its own state kind
    // => status names what happened; the body carries each concern's reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both concerns write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the business path and the probe path
    let app = app(); // => the service under test, built by its constructor
    // => the business nest answers from the business state
    check(app.clone(), "GET", "/api/orders").await; // => Output: 200 {"orders":["o-1"]}
    // => the operations nest answers from the operations state
    check(app.clone(), "GET", "/ops/healthz").await; // => Output: 200 {"ok":true,"probe_calls":0}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-43-two-states-serve-two-concerns/expected/main.stdout.txt`):

```text
GET /api/orders -> 200 OK {"orders":["o-1"]}
GET /ops/healthz -> 200 OK {"ok":true,"probe_calls":0}
```

**Key takeaway**: `nest` joins state-carrying sub-routers below prefixes; each nest unpacks its own state kind.

**Why it matters**: Big services split by team as well as by path, and per-nest state lets each team own its dependencies: the orders team seeds stores, the platform team seeds counters, and the join needs neither. The alphabetical golden (`ok` before `probe_calls`) reminds that `serde_json` sorts keys — struct order never leaks into output. Concern-split state also bounds incidents: a metrics bug cannot starve the business store because they never share a value.

---

### Example 44: Missing State Fails the Build

Axum 0.8 types the router by its state: forgetting `with_state` fails compilation. This example wires the config the handler demands and answers 200 — then shows the exact compiler error the unwired version produces.

`MethodRouter<ShopConfig>` against `MethodRouter<()>` is a type error, not a runtime surprise: E0308 names the expected and found state types at the route line. The compiler is the first test of every constructor — unwired services never reach a request.

(Concepts: co-06, co-05.)

```mermaid
flowchart TD
    accTitle: Typed state, example 44
    accDescr: Wired compiles; unwired fails E0308.
    wired -->|with_state| ok
    unwired -->|no state| err[\"E0308\"]
    ok -->|200| out
    wired[\"wired\"]:::blue
    unwired[\"unwired\"]:::orange
    ok[\"200\"]:::blue
    err[\"E0308\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-44-missing-state-fails-the-build/src/main.rs`**:

```rust
// Example 44: Missing State Fails the Build.
// axum 0.8 types the router by its state: forgetting with_state fails compilation.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the config with_state provides below
use serde_json::{Value, json}; // => json! builds the priced reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ShopConfig names the config the handler demands and the router provides
#[derive(Clone)] // => Clone shares the config cheaply on every call
struct ShopConfig {
    // => the currency every price renders in
    currency: &'static str, // => static keeps the config borrow-free
} // => struct ends: demanded by the handler, provided by the router

// => price demands the config the router provides through with_state
async fn price(State(config): State<ShopConfig>) -> Json<Value> {
    // => the config arrives unwrapped: with_state satisfied the type below
    Json(json!({"currency": config.currency})) // => the reply the unwired build never reaches
} // => handler ends: correct code, wired service

// => app builds the service once, wiring the state the handler demands
fn app() -> Router {
    // => with_state provides ShopConfig: the types line up, so this compiles
    Router::new().route("/price", get(price)).with_state(ShopConfig { currency: "IDR" }) // => drop with_state and the build fails, not the request
} // => constructor ends: the wiring the compiler checks

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the config for this call
    // => status names what happened; the body carries the priced reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => pricing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the priced reply the wired state provides
    let app = app(); // => the wired service under test
    // => with_state satisfied the compiler: the reply answers 200
    check(app.clone(), "GET", "/price").await; // => Output: GET /price -> 200 OK {"currency":"IDR"}
    // => the lesson: dropping with_state fails the build with E0308, never a request
    println!("unwired: Router::new().route(\"/price\", get(price)) fails E0308, not a request"); // => the takeaway, printed as the last line
} // => main ends: wired once, proven once, so the run is green
```

Dropping `with_state` fails the build with the error below (illustration — the harness never compiles it); the unit above holds the wired shape that compiles:

<!-- harness: illustration -->

```text
error[E0308]: mismatched types
  --> src/main.rs:23:35
   |
23 |     Router::new().route("/price", get(price))
   |                   -----           ^^^^^^^^^^ expected `MethodRouter`, found `MethodRouter<ShopConfig>`
   |
   = note: expected struct `MethodRouter<()>`
              found struct `MethodRouter<ShopConfig>`
```

**Output** (`learning/code/ex-44-missing-state-fails-the-build/expected/main.stdout.txt`):

```text
GET /price -> 200 OK {"currency":"IDR"}
unwired: Router::new().route("/price", get(price)) fails E0308, not a request
```

**Key takeaway**: The router's state type is checked at compile time; unwired handlers fail with E0308 before any request exists.

**Why it matters**: The best failure is the one that never deploys: axum 0.8 moved missing-state detection from request time to build time, so the constructor is checked by every `cargo build` in CI. Testing the constructor in-process then proves the wired shape serves — two gates, zero gaps. When a new handler demands new state, the compiler lists every constructor that must grow, which is dependency review for free.

---

### Example 45: Oneshot Replaces the Socket

Tower's `oneshot` runs the whole stack in-process: no port, no TCP, no flake. This example drives one route through `ServiceExt::oneshot` and prints the status plus body — the entire testing technique in twenty lines.

Routers are tower services, so tests drive them like any service: build a request value, run it through, read the response value. Nothing binds, nothing dials, nothing can flake on a busy CI machine.

(Concepts: co-09, co-01.)

```mermaid
flowchart TD
    accTitle: Oneshot path, example 45
    accDescr: Request value in, response value out.
    build --> run
    run --> read
    build[\"request\"]:::orange
    run[\"oneshot\"]:::blue
    read[\"reply\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-45-oneshot-replaces-the-socket/src/main.rs`**:

```rust
// Example 45: Oneshot Replaces the Socket.
// tower's oneshot runs the whole stack in-process: no port, no TCP, no flake.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => oneshot comes from tower, not axum: the test seam is generic
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => ServiceExt::oneshot is the entire testing technique
// => the import above is the lesson: routers are tower services, so tests
// => drive them like any service, without binding a socket or picking a port.

// => hello answers the single route the socketless test drives
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows whether TCP or oneshot called it

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the constructor is the seam: tests build the service, never dial it
    Router::new().route("/hello", get(hello)) // => GET /hello, reached in-process below
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build the service like production builds it: no test-only wiring
    let app = app(); // => the service under test, built by its constructor
    // => shape a server-side request: method, path, empty body, no socket
    let request = Request::builder().method("GET").uri("/hello").body(Body::empty()).unwrap(); // => oneshot needs a request, not a connection
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the service answered at all
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the greeting is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: the technique and its proof together
    println!("oneshot GET /hello -> {status} {text}"); // => no port was bound, chosen, or printed anywhere
} // => main ends: the socketless test printed, so the run is green
```

**Output** (`learning/code/ex-45-oneshot-replaces-the-socket/expected/main.stdout.txt`):

```text
oneshot GET /hello -> 200 OK {"message":"hello, axum"}
```

**Key takeaway**: `ServiceExt::oneshot` drives the router value with a request value; no socket, port, or transport exists.

**Why it matters**: Socket tests flake: ports collide, firewalls interfere, CI machines get busy. In-process tests cannot flake on any of those — the only moving parts are the code under test. The technique also runs anywhere Rust runs, including sandboxes with no network at all. Every testing example from here on is a variation on this one import.

---

### Example 46: Test Posts JSON Without a Port

The JSON post helper is the workhorse: every creation test uses it. This example posts one well-formed order and one with a mistyped quantity, showing the echo beside the extractor rejection.

The helper sets the content type, attaches the bytes, drives `oneshot`, and prints one line — the whole creation-test shape in one function. The rejection leg proves malformed bodies fail in the extractor, never in the handler.

(Concepts: co-09, co-03.)

**`learning/code/ex-46-test-posts-json-without-a-port/src/main.rs`**:

```rust
// Example 46: Test Posts JSON Without a Port.
// the JSON post helper is the workhorse: every creation test uses it.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds creation; the helper sets the JSON content type
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; u32 rules out negatives at parse time
    qty: u32, // => the type already rejects -1 before the handler runs
} // => struct ends: the request shape is now a compile-time fact

// => create echoes the parsed order back with the 201 the method promises
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: parsing finished before this line
    (StatusCode::CREATED, Json(json!({"id": order.id, "qty": order.qty}))) // => the echo proves every field parsed
} // => handler ends: no manual JSON handling anywhere

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; Json rides along as the extractor
    Router::new().route("/orders", post(create)) // => POST /orders with a JSON body creates one order
} // => constructor ends: wiring stays separate from traffic

// => post_json is the workhorse every creation test copies: body in, line out
async fn post_json(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri("/orders") // => the single creation path, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, parsing, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries echo or message
    let status = response.status(); // => keep the code plus reason before the body moves
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
    // => build once, post one good body and one with the wrong type
    let app = app(); // => the service under test, built by its constructor
    // => well-formed JSON parses and echoes with a 201
    post_json(app.clone(), r#"{"id":"o-1","qty":2}"#).await; // => Output: 201 {"id":"o-1","qty":2}
    // => a string qty breaks the u32 contract: the extractor answers its rejection
    post_json(app.clone(), r#"{"id":"o-2","qty":"many"}"#).await; // => Output: the extractor rejection with its status
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-46-test-posts-json-without-a-port/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","qty":2} -> 201 Created {"id":"o-1","qty":2}
POST /orders {"id":"o-2","qty":"many"} -> 422 Unprocessable Entity Failed to deserialize the JSON body into the target type: qty: invalid type: string "many", expected u32 at line 1 column 24
```

**Key takeaway**: One `post_json` helper covers every creation test: content type, bytes, `oneshot`, one golden line.

**Why it matters**: Creation tests multiply fast, and a shared helper keeps them one line each: body in, golden line out. The mistyped-quantity leg proves the helper covers failures too — the extractor's deterministic message names the exact type break with its position. Copying this helper into a new service is how most axum test suites start, and this example is the copy source.

---

### Example 47: Test Asserts Status and Body

`assert_eq` inside the binary turns prints into proof: mismatch panics red. This example pins the status code and the exact body bytes of one read, printing the `holds` line only after both asserts pass.

Asserts run before prints on purpose: a failing test prints nothing golden, so the harness sees red instead of a stale line. Pinning exact bytes — key order and spacing included — catches serialization drift that status-only tests miss.

(Concepts: co-09, co-04.)

**`learning/code/ex-47-test-asserts-status-and-body/src/main.rs`**:

```rust
// Example 47: Test Asserts Status and Body.
// assert_eq inside the binary turns prints into proof: mismatch panics red.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the read the assertions pin down
use serde_json::{Value, json}; // => json! builds the snapshot the assertions compare
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => order answers the one snapshot the assertions below pin to the wall
async fn order() -> Json<Value> {
    // => a fixed snapshot keeps the assertions golden without any store
    Json(json!({"id": "o-1", "status": "placed"})) // => the contract every assert repeats
} // => handler ends: change this body and the asserts turn red

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the snapshot; the assertions guard it below
    Router::new().route("/orders/o-1", get(order)) // => GET /orders/o-1 answers the pinned snapshot
} // => constructor ends: wiring stays separate from traffic

// => check serves one request, asserts both halves, then prints the hold line
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/orders/o-1").body(Body::empty()).unwrap(); // => the pinned call: method, path, empty body
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with both sides shown
    assert_eq!(bytes.as_ref(), br#"{"id":"o-1","status":"placed"}"#.as_slice()); // => exact bytes: key order and spacing included
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET /orders/o-1 -> 200 {{\"id\":\"o-1\",\"status\":\"placed\"}}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, assert the pinned snapshot through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the holds line prints only because both asserts passed above
    check(app.clone()).await; // => Output: holds GET /orders/o-1 -> 200 with the pinned body
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-47-test-asserts-status-and-body/expected/main.stdout.txt`):

```text
holds GET /orders/o-1 -> 200 {"id":"o-1","status":"placed"}
```

**Key takeaway**: Assert status and exact body bytes before printing; the `holds` line prints only on green.

**Why it matters**: Print-only tests prove the code ran, not that it answered correctly — a 500 with any body still prints a line. Asserts turn the binary into a test: wrong answers panic with both sides shown, and the harness reads the exit code. The `holds` prefix marks proven lines in goldens, so readers know which lines survived assertions and which merely printed.

---

### Example 48: Test Drives the Error Paths

A table of method plus path plus wanted status proves every failure leg. This example walks four rows — two happy legs, a method miss, a path miss — asserting each status through the real stack.

Tables scale coverage linearly: adding a leg means adding a row, never a new function. The assert message names the failing row, so a red run points at the exact leg instead of dumping the whole suite.

(Concepts: co-09, co-05.)

**`learning/code/ex-48-test-drives-the-error-paths/src/main.rs`**:

```rust
// Example 48: Test Drives the Error Paths.
// a table of method plus path plus wanted status proves every failure leg.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get opens the chain; the post leg chains on below
use serde_json::{Value, json}; // => json! builds the snapshot the happy leg asserts
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => order answers the one snapshot the table's happy row pins down
async fn order() -> Json<Value> {
    // => a fixed snapshot keeps the happy row golden without any store
    Json(json!({"id": "o-1"})) // => the contract the 200 row repeats
} // => handler ends: change this body and the happy assert turns red

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => GET reads, POST writes: the table below pins both plus the two misses
    Router::new().route("/orders/o-1", get(order).post(|| async { Json(json!({"created": true})) })) // => one path, two verbs, four table rows
} // => constructor ends: wiring stays separate from traffic

// => check serves one table row, asserts its status, then prints the hold line
async fn check(app: Router, method: &str, uri: &str, want: u16) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method(method).uri(uri).body(Body::empty()).unwrap(); // => one table row as a live request
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the row: a wrong code panics with the row shown
    assert_eq!(response.status().as_u16(), want, "row {method} {uri}"); // => want or red: the message names the failing row
    // => holds prints only after the assert passed: the proof, in one line
    println!("holds {method} {uri} -> {want}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, walk the table row by row through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the table: every leg the service promises, with its wanted status
    let table = [("GET", "/orders/o-1", 200), ("POST", "/orders/o-1", 200), ("PUT", "/orders/o-1", 405), ("GET", "/orders/o-9", 404)]; // => happy legs plus method miss plus path miss
    // => each row runs the same check: the table is the test plan
    for (method, uri, want) in table { // => four rows, four holds lines, zero sockets
        // => clone per row: oneshot consumes the router every call
        check(app.clone(), method, uri, want).await; // => Output: holds METHOD path -> status per row
    } // => loop ends: every table row held, so the run is green
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-48-test-drives-the-error-paths/expected/main.stdout.txt`):

```text
holds GET /orders/o-1 -> 200
holds POST /orders/o-1 -> 200
holds PUT /orders/o-1 -> 405
holds GET /orders/o-9 -> 404
```

**Key takeaway**: A `(method, path, status)` table plus one `check` proves every leg; the assert names the failing row.

**Why it matters**: Error legs outnumber happy legs in any real service, and tables keep them all visible in one place: the test plan reads as data, not as twenty near-identical functions. The 405 and 404 rows prove the router's own contract — method and path misses — which handler tests never touch. When a new route lands, its rows join the table in one line each.

---

### Example 49: Test Builds Requests with Headers

The header-setting helper covers auth, content types, and negotiation. This example walks a three-row matrix of identity-plus-format headers, echoing exactly which headers reached the handler per row.

Matrices compose dimensions: two identities times two formats is four rows from one helper, and the `Option` args keep omitted headers explicit. The golden reads as a truth table — sent headers on the left, echoed headers on the right.

(Concepts: co-09, co-03.)

**`learning/code/ex-49-test-builds-requests-with-headers/src/main.rs`**:

```rust
// Example 49: Test Builds Requests with Headers.
// the header-setting helper covers auth, content types, and negotiation.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the read the header matrix probes
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => whoami echoes the two headers the matrix varies: identity and format
async fn whoami(headers: axum::http::HeaderMap) -> Json<Value> {
    // => each header falls back to its default when the matrix omits it
    let caller = headers.get("x-user").and_then(|v| v.to_str().ok()).unwrap_or("guest"); // => guest means the matrix sent no identity
    // => format echoes the raw Accept value so the matrix sees what arrived
    let format = headers.get("accept").and_then(|v| v.to_str().ok()).unwrap_or("default"); // => default means the matrix sent no Accept
    // => the echo proves exactly which headers reached the handler
    Json(json!({"caller": caller, "format": format})) // => two headers in, two echoes out
} // => handler ends: no header parsing lives anywhere else

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns identity-plus-format; the matrix varies both
    Router::new().route("/whoami", get(whoami)) // => GET /whoami echoes its two headers
} // => constructor ends: wiring stays separate from traffic

// => check serves one header matrix row and prints its status line
async fn check(app: Router, user: Option<&str>, accept: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/whoami"); // => path first; the matrix headers follow when present
    // => Some carries the identity under test; None sends no identity header
    if let Some(name) = user { builder = builder.header("x-user", name); } // => the identity leg of the matrix
    // => Some carries the format under test; None sends no Accept header
    if let Some(format) = accept { builder = builder.header("accept", format); } // => the negotiation leg of the matrix
    // => an empty body keeps the call a pure header probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the header echo
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: echoes are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every matrix row echoes something, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per matrix row: sent headers plus the echo
    println!("GET /whoami x-user={} accept={} -> {status} {shown}", user.unwrap_or("(none)"), accept.unwrap_or("(none)")); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, walk the header matrix row by row
    let app = app(); // => the service under test, built by its constructor
    // => both headers set: the echo carries both values
    check(app.clone(), Some("ada"), Some("application/json")).await; // => Output: both echoes named
    // => identity only: format falls back to its default
    check(app.clone(), Some("ada"), None).await; // => Output: caller ada, format default
    // => neither header: both fallbacks apply, still 200
    check(app.clone(), None, None).await; // => Output: caller guest, format default
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-49-test-builds-requests-with-headers/expected/main.stdout.txt`):

```text
GET /whoami x-user=ada accept=application/json -> 200 OK {"caller":"ada","format":"application/json"}
GET /whoami x-user=ada accept=(none) -> 200 OK {"caller":"ada","format":"default"}
GET /whoami x-user=(none) accept=(none) -> 200 OK {"caller":"guest","format":"default"}
```

**Key takeaway**: `Option` header args build a truth-table matrix; the echo proves which headers arrived per row.

**Why it matters**: Headers interact — auth plus negotiation plus content type arrive together on real calls — and matrices test the combinations instead of hoping. The fallback legs matter most: omitted headers must degrade to defaults, never to 500s. Reading the golden as sent-versus-echoed makes header-stripping proxies visible too: if a row echoes `default` for a sent header, something upstream ate it.

---

### Example 50: Test Covers Middleware In-Process

The auth gate proves both legs through `oneshot`: no socket, no test server. This example asserts the 200 and both 401s of the gate from Example 27, printing `holds` lines only where asserts passed.

Middleware tests drive the real stack — the same wiring production serves — instead of unit-testing the gate function with a fake `Next`. That choice catches wiring bugs: a gate that works alone but never runs because the layer order is wrong still fails here.

(Concepts: co-09, co-02.)

```mermaid
flowchart TD
    accTitle: Gate proof, example 50
    accDescr: Both gate legs hold in-process.
    pass -->|token| secret
    stop -->|none| deny[\"401\"]
    secret -->|200| out
    deny -->|401| out
    pass[\"pass\"]:::blue
    stop[\"stop\"]:::orange
    secret[\"200\"]:::blue
    deny[\"401\"]:::teal
    out[\"holds\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-50-test-covers-middleware-in-process/src/main.rs`**:

```rust
// Example 50: Test Covers Middleware In-Process.
// the auth gate proves both legs through oneshot: no socket, no test server.
use axum::{Router, body::Body, http::{Request, StatusCode}, middleware::{self, Next}, response::{IntoResponse, Json, Response}, routing::get}; // => from_fn lifts the gate into the stack under test
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
    next.run(req).await // => auth observes the pass leg and rewrites nothing
} // => middleware ends: one gate, two outcomes, zero handler knowledge

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the gate already ran

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: the gate under test stands in front
    Router::new().route("/secret", get(secret)).layer(middleware::from_fn(auth)) // => the same wiring production serves
} // => constructor ends: tests drive the real stack, not a double

// => check serves one guarded call, asserts its status, then prints the hold line
async fn check(app: Router, token: Option<&str>, want: u16) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/secret"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(value) = token { builder = builder.header("authorization", format!("Bearer {value}")); } // => the credential rides as one header
    // => an empty body keeps the call a pure gate probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, the gate, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the gate answers early or the handler answers late
    // => the status assert pins the leg: a wrong code panics with the token shown
    assert_eq!(response.status().as_u16(), want, "token {:?}", token); // => want or red: the message names the failing leg
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => holds prints only after the assert passed: the proof, in one line
    println!("holds GET /secret token={} -> {want} {text}", token.unwrap_or("(none)")); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, prove both gate legs through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the right token opens the gate: 200 holds with the secret
    check(app.clone(), Some("s3cret"), 200).await; // => Output: holds with 200 and the secret
    // => the wrong token stops at the gate: 401 holds with the envelope
    check(app.clone(), Some("nope"), 401).await; // => Output: holds with 401 and the envelope
    // => no token stops at the same gate: 401 holds with the envelope
    check(app.clone(), None, 401).await; // => Output: holds with 401 and the envelope
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-50-test-covers-middleware-in-process/expected/main.stdout.txt`):

```text
holds GET /secret token=s3cret -> 200 {"secret":"the-cake-is-documented"}
holds GET /secret token=nope -> 401 {"error":"unauthorized"}
holds GET /secret token=(none) -> 401 {"error":"unauthorized"}
```

**Key takeaway**: Drive the wired stack with `oneshot` and assert each gate leg; `holds` lines prove the middleware ran in place.

**Why it matters**: Gates fail in wiring more often than in logic: the function is correct but the layer never wraps the route, or wraps it in the wrong order. Stack-level tests catch both — the 401 must come from the layer's position, not just its code. Reusing the production constructor means the test and the service cannot drift apart: one wiring change updates both.

---

### Example 51: Test Seeds State Per Case

Each case builds its own world: fresh store in, isolated proof out. This example runs three seeded cases — one row, none, two rows — through one `case` function that builds, reads, asserts, and prints per world.

Per-case worlds eliminate cross-test leakage by construction: no case can see another's rows because no store outlives its case. The `want` string pins each world's exact listing, so a leaking row fails the assert instead of hiding in a shared store.

(Concepts: co-09, co-06.)

**`learning/code/ex-51-test-seeds-state-per-case/src/main.rs`**:

```rust
// Example 51: Test Seeds State Per Case.
// each case builds its own world: fresh store in, isolated proof out.
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
    Json(json!({"orders": orders})) // => seeded per case below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => build_app wires one isolated world from one seed: the case constructor
fn build_app(seed: Vec<String>) -> Router {
    // => the seed becomes this world's store: cases never share rows
    let state = AppState { orders: Arc::new(Mutex::new(seed)) }; // => owned seed in, shared store out
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => one store per case, zero globals
} // => constructor ends: every case starts from a world it names

// => case builds its world, reads it, asserts the listing, prints the hold line
async fn case(name: &str, seed: Vec<String>, want: &str) {
    // => the world exists only inside this case: nothing leaks between cases
    let app = build_app(seed); // => fresh store in, isolated proof out
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/orders").body(Body::empty()).unwrap(); // => the pinned read for every case
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => this world's store answers
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the listing: a wrong world panics with its name
    assert_eq!(String::from_utf8_lossy(&bytes), want, "case {name}"); // => want or red: the message names the failing case
    // => holds prints only after the assert passed: the proof, in one line
    println!("holds case {name} -> {want}"); // => the harness compares this line with the golden file
} // => case ends: the world drops here, so cases stay isolated

#[tokio::main] // => the async runtime drives the cases and the checks
async fn main() {
    // => three cases, three worlds, zero shared rows between them
    case("seeded", vec!["o-1".to_owned()], r#"{"orders":["o-1"]}"#).await; // => Output: holds case seeded with one row
    // => the empty world lists nothing: isolation means no leakage from seeded
    case("empty", vec![], r#"{"orders":[]}"#).await; // => Output: holds case empty with no rows
    // => the two-row world lists both in seed order
    case("pair", vec!["o-1".to_owned(), "o-2".to_owned()], r#"{"orders":["o-1","o-2"]}"#).await; // => Output: holds case pair with two rows
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-51-test-seeds-state-per-case/expected/main.stdout.txt`):

```text
holds case seeded -> {"orders":["o-1"]}
holds case empty -> {"orders":[]}
holds case pair -> {"orders":["o-1","o-2"]}
```

**Key takeaway**: `case(name, seed, want)` builds a fresh world per case; worlds drop at the case boundary, so rows never leak.

**Why it matters**: Shared test stores produce order-dependent suites: case B passes alone and fails after case A, and nobody knows why until the leak is found. Per-case construction makes isolation structural — leakage is impossible, not just avoided. Naming the case in the assert message keeps red runs actionable: the failing world is printed, not guessed.

---

### Example 52: Test Reads the Golden Contract

The test pins exact bytes: any drift in key order or spacing turns red. This example asserts the full contract body byte-for-byte against a `GOLDEN` constant, printing the `holds` line only on an exact match.

Byte-level pins catch what semantic asserts miss: reordered keys break clients that parse positionally, and spacing changes break signature checks. The `GOLDEN` constant is the contract in one place — change it deliberately, and every assert follows.

(Concepts: co-09.)

**`learning/code/ex-52-test-reads-the-golden-contract/src/main.rs`**:

```rust
// Example 52: Test Reads the Golden Contract.
// the test pins exact bytes: any drift in key order or spacing turns red.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the read the golden pins down
use serde_json::json; // => json! builds the snapshot with pinned key order
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => GOLDEN is the exact body the contract promises, byte for byte
const GOLDEN: &str = r#"{"healthy":true,"service":"orders","version":2}"#; // => key order and spacing are part of the promise

// => contract answers the snapshot the golden pins to the wall
async fn contract() -> Json<serde_json::Value> {
    // => serde_json sorts keys by default, so the golden pins sorted order
    Json(json!({"healthy": true, "service": "orders", "version": 2})) // => change any key and the assert below turns red
} // => handler ends: the golden owns this body's shape

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the contract; the golden guards it below
    Router::new().route("/contract", get(contract)) // => GET /contract answers the pinned snapshot
} // => constructor ends: wiring stays separate from traffic

// => check serves the contract call, asserts exact bytes, prints the hold line
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri("/contract").body(Body::empty()).unwrap(); // => the pinned call: method, path, empty body
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the golden assert pins the bytes: spacing and order included
    assert_eq!(bytes.as_ref(), GOLDEN.as_bytes(), "golden drift"); // => drift or red: the message says the contract moved
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET /contract -> 200 {GOLDEN}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold the golden contract through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the holds line prints only because the bytes matched exactly
    check(app.clone()).await; // => Output: holds GET /contract -> 200 with the golden bytes
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-52-test-reads-the-golden-contract/expected/main.stdout.txt`):

```text
holds GET /contract -> 200 {"healthy":true,"service":"orders","version":2}
```

**Key takeaway**: A `GOLDEN` constant plus a byte assert pins the contract body; drift panics with both sides shown.

**Why it matters**: Contracts break in bytes, not in meanings: a reordered key is still "correct" JSON and still breaks a positional client. Byte pins catch the reordering that semantic asserts forgive. The golden constant also documents the contract where reviewers look — one line at the top, not scattered across twenty asserts. This is the same technique the harness itself uses: goldens hold program lines byte for byte.

---

### Example 53: Test Suite Runs the Whole Service

One pass walks every route plus the probe: the service proof in six lines. This example holds the listing leg, the probe leg, and the absence leg through one shared `check`, asserting status and body on each.

Whole-service passes catch what unit legs miss: routes that work alone but break together through shared state, and probes that drift from the business routes they guard. The absence leg proves the default fallback still answers 404 with no body after every change.

(Concepts: co-09, co-14.)

```mermaid
flowchart TD
    accTitle: Suite pass, example 53
    accDescr: Three legs hold through one check.
    suite --> leg1[\"listing\"]
    suite --> leg2[\"probe\"]
    suite --> leg3[\"absence\"]
    leg1 --> holds
    leg2 --> holds
    leg3 --> holds
    suite[\"suite\"]:::orange
    leg1[\"listing\"]:::blue
    leg2[\"probe\"]:::blue
    leg3[\"absence\"]:::teal
    holds[\"holds\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-53-test-suite-runs-the-whole-service/src/main.rs`**:

```rust
// Example 53: Test Suite Runs the Whole Service.
// one pass walks every route plus the probe: the service proof in six lines.
use std::sync::{Arc, Mutex}; // => Arc shares the suite's store; Mutex guards its vector
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the suite store; get binds both routes
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value the whole suite shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => seeded once below, read by the suite
} // => struct ends: one store for the whole pass

// => list reads the suite store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the suite contents in store order
    Json(json!({"orders": orders})) // => seeded once below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => health answers the liveness probe beside the business routes
async fn health() -> Json<Value> {
    // => no store, no latency, nothing that can fail except the process itself
    Json(json!({"status": "ok"})) // => the probe the suite asserts last
} // => handler ends: liveness asks only whether the process answers

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the suite store seeds two rows; routes and probe share one router
    let state = AppState { orders: Arc::new(Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()])) }; // => two rows, always in this order
    // => with_state moves the value into the router; the probe needs none
    Router::new().route("/orders", get(list)).route("/healthz", get(health)).with_state(state) // => business plus probe: the whole service in one pass
} // => constructor ends: wiring stays separate from traffic

// => check serves one suite leg, asserts its status, then prints the hold line
async fn check(app: Router, uri: &str, want: u16, want_body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder().method("GET").uri(uri).body(Body::empty()).unwrap(); // => one suite leg as a live request
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the leg: a wrong code panics with the path shown
    assert_eq!(response.status().as_u16(), want, "leg {uri}"); // => want or red: the message names the failing leg
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with the leg shown
    assert_eq!(String::from_utf8_lossy(&bytes), want_body, "leg {uri}"); // => want_body or red: the proof is exact
    // => tail adds the body only when the leg has one: no trailing space
    let tail = if want_body.is_empty() { String::new() } else { format!(" {want_body}") }; // => empty legs print clean
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET {uri} -> {want}{tail}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, walk the whole service leg by leg through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the listing leg holds both seeded rows in store order
    check(app.clone(), "/orders", 200, r#"{"orders":["o-1","o-2"]}"#).await; // => Output: holds the listing leg
    // => the probe leg holds liveness beside the business routes
    check(app.clone(), "/healthz", 200, r#"{"status":"ok"}"#).await; // => Output: holds the probe leg
    // => the unknown leg holds the 404 the default fallback answers
    check(app.clone(), "/nope", 404, "").await; // => Output: holds the absence leg with no body
} // => main ends: asserts green and printed, so the run is green
```

**Output** (`learning/code/ex-53-test-suite-runs-the-whole-service/expected/main.stdout.txt`):

```text
holds GET /orders -> 200 {"orders":["o-1","o-2"]}
holds GET /healthz -> 200 {"status":"ok"}
holds GET /nope -> 404
```

**Key takeaway**: One `check` with `(uri, status, body)` walks every leg — business, probe, and absence — asserting all three.

**Why it matters**: Services break at the joints: the listing works, the probe works, but a shared-state change breaks one silently while the other still passes. Whole-service passes hold the joints together in one run, and the absence leg guards the fallback most suites forget. Three `holds` lines are the smallest credible proof that a service — not just its routes — is green.
