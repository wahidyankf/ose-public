---
title: Beginner Examples
date: 2026-10-24T00:00:00+07:00
draft: false
weight: 10
---

Examples 1–25 build the request path from nothing: routes and handlers that map verbs plus paths (Examples 1–8), request parsing and validation at the boundary (Examples 9–17), and response shaping with honest status codes (Examples 18–25). Every example is a complete, runnable Rust program under `learning/code/` driving its service in-process through `tower::ServiceExt::oneshot`; run each with the command in its own `run.yaml`.

---

### Example 1: Hello Route Returns JSON

A route maps one method plus one path to one handler function. This example registers `GET /hello`, calls it in-process with no socket and no port, and prints the status code with the JSON body the handler wrote.

The handler is a pure function from request to response: it takes nothing and returns `Json`. The `check` helper builds a server-side request, drives the router with `oneshot`, and prints one golden line per call. Unknown paths fall through to the default 404 with an empty body.

(Concepts: co-01, co-04.)

```mermaid
flowchart TD
    accTitle: Hello route, example 1
    accDescr: One method plus one path reaches one handler.
    Client -->|GET /hello| router
    router --> hello
    hello -->|200 JSON| Client
    router[\"router\"]:::blue
    hello[\"hello\"]:::orange
    Client[\"check\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-01-hello-route-returns-json/src/main.rs`**:

```rust
// Example 1: Hello Route Returns JSON.
// one method plus one path maps to one handler.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; Body carries bytes; Request builds calls
// => Json renders the reply; get binds the GET method to one handler
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers the one route this service promises
async fn hello() -> Json<Value> {
    // => Json sets the content type and renders the body in one move
    Json(json!({"message": "hello, axum"})) // => the greeting contract every check asserts
} // => handler ends: a pure function from request to response

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => Router::new starts empty; route adds one method plus one path
    Router::new().route("/hello", get(hello)) // => GET /hello runs hello; nothing else is wired
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
// => oneshot keeps the whole exchange inside this process: no socket, no port
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test: GET, POST, and friends
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => an empty body still needs a visible marker, or the line ends mid-air
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => 404s carry no body, so name that fact
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check twice: wiring stays separate from traffic
    let app = app(); // => the service under test, built by its constructor
    // => the known route answers 200 with the greeting contract
    check(app.clone(), "GET", "/hello").await; // => Output: GET /hello -> 200 OK {"message":"hello, axum"}
    // => unknown paths fall through to the 404 fallback with an empty body
    check(app.clone(), "GET", "/goodbye").await; // => Output: GET /goodbye -> 404 Not Found (empty body)
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-01-hello-route-returns-json/expected/main.stdout.txt`):

```text
GET /hello -> 200 OK {"message":"hello, axum"}
GET /goodbye -> 404 Not Found (empty body)
```

**Key takeaway**: `Router::new().route("/hello", get(hello))` maps one verb plus one path to one handler; `oneshot` drives it with no socket.

**Why it matters**: Every backend in this course is a variation on this shape: a router value, handler functions, and in-process calls that prove them. Learning the smallest possible service first means every later example adds exactly one idea — parsing, state, middleware — onto a foundation that already runs. The constructor-plus-check split is the testing seam the whole course reuses: build the service once, drive it many times, assert every line.

---

### Example 2: Path Parameter Names a Resource

One segment of the path becomes a typed handler argument. This example reads `/users/42` into a `u32`, renders the resource contract, and shows the framework rejecting `/users/abc` before the handler runs.

Axum 0.8 spells captures with single braces (`/users/{id}`), and `Path<u32>` parses the segment before the first handler line. A non-numeric segment never reaches the handler: the extractor answers with its rejection instead.

(Concepts: co-01, co-03.)

```mermaid
flowchart TD
    accTitle: Path parse, example 2
    accDescr: The segment parses to u32 or the extractor rejects.
    Path -->|u32| handler
    Path -->|abc| reject
    handler -->|200| out
    reject -->|400| out
    Path[\"/users/{id}\"]:::orange
    handler[\"handler\"]:::blue
    reject[\"reject\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-02-path-parameter-names-a-resource/src/main.rs`**:

```rust
// Example 2: Path Parameter Names a Resource.
// one segment of the path becomes a typed handler argument.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; Body carries bytes; Request builds calls
// => Json renders the reply; get binds the GET method to one handler
use axum::extract::Path; // => Path pulls typed segments out of the request path
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => user answers one resource read: the id arrives already parsed
async fn user(Path(id): Path<u32>) -> Json<Value> {
    // => u32 says ids are numbers; anything else never reaches this line
    Json(json!({"id": id, "name": format!("user-{id}")})) // => the resource contract: id plus its derived name
} // => handler ends: parsing happened before the first line ran

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => :id marks the segment axum parses into the Path argument
    Router::new().route("/users/{id}", get(user)) // => axum 0.8 spells captures with single braces
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => an empty body still needs a visible marker, or the line ends mid-air
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => rejections may carry framework text instead
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check twice: wiring stays separate from traffic
    let app = app(); // => the service under test, built by its constructor
    // => a numeric segment parses into u32 and reaches the handler
    check(app.clone(), "GET", "/users/42").await; // => Output: GET /users/42 -> 200 OK {"id":42,"name":"user-42"}
    // => a non-numeric segment fails parsing before the handler ever runs
    check(app.clone(), "GET", "/users/abc").await; // => Output: a 400 with the framework parse message
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-02-path-parameter-names-a-resource/expected/main.stdout.txt`):

```text
GET /users/42 -> 200 OK {"id":42,"name":"user-42"}
GET /users/abc -> 400 Bad Request Invalid URL: Cannot parse `abc` to a `u32`
```

**Key takeaway**: `Path<u32>` parses the segment before the handler runs; a bad segment answers 400 with the framework message.

**Why it matters**: Typed path segments move a whole class of bugs from runtime to the boundary: handlers never see a malformed id because malformed ids never reach handlers. The rejection message is deterministic framework text, so tests can pin the failure leg exactly like the happy leg. This is the static-typing-at-the-boundary idea in its smallest form, and it repeats for queries, bodies, and headers through the whole beginner level.

---

### Example 3: Method and Path Pick the Handler

The same path answers three verbs with three handlers. This example binds `GET`, `POST`, and an unbound `PUT` on `/items`, showing method routing: verb plus path picks the handler, and unbound verbs answer 405.

Method routing keeps one path coherent across verbs instead of scattering sibling paths. The 405 for `PUT` carries no body: method-not-allowed is a routing fact, not an application error.

(Concepts: co-01.)

**`learning/code/ex-03-method-and-path-pick-the-handler/src/main.rs`**:

```rust
// Example 3: Method and Path Pick the Handler.
// the same path can answer three verbs with three handlers.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get starts the chain; post and delete extend the method router
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers reads with the current collection snapshot
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"items": ["pen", "paper"]})) // => two items, always in this order
} // => handler ends: reads never change state

// => create answers writes with the 201 the method promises
async fn create() -> (axum::http::StatusCode, Json<Value>) {
    // => the tuple sets the status beside the body in one return
    (axum::http::StatusCode::CREATED, Json(json!({"created": true}))) // => 201 says a resource now exists
} // => handler ends: the status is part of the contract

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => three verbs on one path, each bound to its own handler
    Router::new().route("/items", get(list).post(create).delete(|| async { "gone" })) // => method routing: verb plus path picks the handler
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => empty payload: routing needs no body here
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON or text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => an empty body still needs a visible marker, or the line ends mid-air
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => 405s carry no body, so name that fact
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check three verbs against the same path
    let app = app(); // => the service under test, built by its constructor
    // => GET reads the collection snapshot
    check(app.clone(), "GET", "/items").await; // => Output: GET /items -> 200 OK {"items":["pen","paper"]}
    // => POST writes and answers 201 beside its body
    check(app.clone(), "POST", "/items").await; // => Output: POST /items -> 201 Created {"created":true}
    // => PUT is bound to no handler, so routing answers 405 with no body
    check(app.clone(), "PUT", "/items").await; // => Output: PUT /items -> 405 Method Not Allowed (empty body)
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-03-method-and-path-pick-the-handler/expected/main.stdout.txt`):

```text
GET /items -> 200 OK {"items":["pen","paper"]}
POST /items -> 201 Created {"created":true}
PUT /items -> 405 Method Not Allowed (empty body)
```

**Key takeaway**: `get(list).post(create)` binds two verbs on one path; unbound verbs answer 405 with no body.

**Why it matters**: REST resources live at one path with many verbs, and method routing is how axum says that in code. Binding per verb also gives precise 405s for free: clients learn the allowed verbs from the status instead of guessing. Tests should always probe one unbound verb, because the 405 leg is part of the route contract.

---

### Example 4: Unknown Path Falls Back to 404

A fallback handler answers every route nothing else claimed. This example serves one real route and a fallback that echoes the missed path inside the shared error shape.

The default axum 404 carries an empty body. A custom fallback turns absence into a designed response with evidence: clients see which path missed, and operators can count misses by path.

(Concepts: co-01, co-05.)

```mermaid
flowchart TD
    accTitle: Fallback net, example 4
    accDescr: Known paths serve; misses land in fallback.
    known -->|/ok| ok
    miss -->|other| fallback
    ok -->|200| out
    fallback -->|404| out
    known[\"known\"]:::blue
    miss[\"miss\"]:::orange
    ok[\"ok\"]:::blue
    fallback[\"fallback\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-04-unknown-path-falls-back-to-404/src/main.rs`**:

```rust
// Example 4: Unknown Path Falls Back to 404.
// a fallback handler answers every route nothing else claimed.
use axum::{Router, body::Body, http::{Request, StatusCode, Uri}, response::Json, routing::get}; // => Uri names the missed path; StatusCode names the answer
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ok answers the one real route, so the fallback is not the whole story
async fn ok() -> Json<Value> {
    // => a fixed body keeps the happy path golden
    Json(json!({"ok": true})) // => true means the route exists and ran
} // => handler ends: known paths never reach the fallback

// => missing answers every unclaimed path with one shared envelope
async fn missing(uri: Uri) -> (StatusCode, Json<Value>) {
    // => Uri arrives as an extractor: the path nobody routed
    (StatusCode::NOT_FOUND, Json(json!({"error": "no_route", "path": uri.path()}))) // => 404 plus the path that missed, in the error shape
} // => handler ends: absence is a designed response, not an accident

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
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => fallbacks always write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check the route and the net below it
    let app = app(); // => the service under test, built by its constructor
    // => the known route answers 200 and never sees the fallback
    check(app.clone(), "GET", "/ok").await; // => Output: GET /ok -> 200 OK {"ok":true}
    // => the unknown path lands in the fallback with its own name echoed
    check(app.clone(), "GET", "/missing").await; // => Output: GET /missing -> 404 Not Found {"error":"no_route","path":"/missing"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-04-unknown-path-falls-back-to-404/expected/main.stdout.txt`):

```text
GET /ok -> 200 OK {"ok":true}
GET /missing -> 404 Not Found {"error":"no_route","path":"/missing"}
```

**Key takeaway**: `.fallback(missing)` answers every unclaimed path; the `Uri` extractor names the miss.

**Why it matters**: Clients mistype paths, and a fallback with the missed path turns a mystery into a diagnosable event. Echoing the path also makes 404s testable: the test asserts the exact absence contract instead of hoping the default stays empty. Absence is a designed response with evidence, not an accident the framework hides.

---

### Example 5: Nest Routes Under One Prefix

`nest` mounts a whole sub-service below a versioned path. This example builds a versioned API router with root-relative paths, mounts it below `/api/v1`, and proves the bare paths stay unmounted.

Nesting separates versioning from handler code: handlers never spell the prefix, so the next version mounts a second sub-router without touching the first. The unprefixed miss proves `nest` adds paths instead of copying them.

(Concepts: co-11, co-01.)

```mermaid
flowchart TD
    accTitle: Nested prefix, example 5
    accDescr: One sub-router mounts below /api/v1.
    root -->|nest| api
    api --> users
    api --> orders
    root[\"/ router\"]:::blue
    api[\"/api/v1\"]:::orange
    users[\"/users\"]:::teal
    orders[\"/orders\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-05-nest-routes-under-one-prefix/src/main.rs`**:

```rust
// Example 5: Nest Routes Under One Prefix.
// nest mounts a whole sub-service below a versioned path.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; nest mounts a sub-router below a prefix
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => users answers the versioned user listing below the prefix
async fn users() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"users": ["ada"]})) // => one user, always in this order
} // => handler ends: the prefix never appears inside the sub-router

// => orders answers the versioned order listing beside the users route
async fn orders() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"orders": ["o-1"]})) // => one order, always in this order
} // => handler ends: siblings share the prefix without knowing each other

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the versioned API lives in its own router with root-relative paths
    let api = Router::new().route("/users", get(users)).route("/orders", get(orders)); // => siblings compose side by side at the sub-root
    // => nest mounts the whole API below /api/v1 in one move
    Router::new().nest("/api/v1", api) // => paths become /api/v1/users and /api/v1/orders
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => an empty body still needs a visible marker, or the line ends mid-air
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => unprefixed paths miss everything here
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check both nested routes plus the bare miss
    let app = app(); // => the service under test, built by its constructor
    // => the prefixed users route answers through the nest
    check(app.clone(), "GET", "/api/v1/users").await; // => Output: GET /api/v1/users -> 200 OK {"users":["ada"]}
    // => the prefixed orders route answers through the same nest
    check(app.clone(), "GET", "/api/v1/orders").await; // => Output: GET /api/v1/orders -> 200 OK {"orders":["o-1"]}
    // => the unprefixed path matches nothing: nest adds, never copies
    check(app.clone(), "GET", "/users").await; // => Output: GET /users -> 404 Not Found (empty body)
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-05-nest-routes-under-one-prefix/expected/main.stdout.txt`):

```text
GET /api/v1/users -> 200 OK {"users":["ada"]}
GET /api/v1/orders -> 200 OK {"orders":["o-1"]}
GET /users -> 404 Not Found (empty body)
```

**Key takeaway**: `.nest("/api/v1", api)` mounts a sub-router below a prefix; handlers keep root-relative paths.

**Why it matters**: Versioned APIs multiply paths, and nesting keeps the multiplier in one line instead of every handler. Sub-routers stay independently testable too: the same `api` value drives in-process checks with and without its prefix. When v2 arrives, it mounts beside v1 while v1 keeps serving unchanged. That coexistence is the migration story: old clients keep working while new clients adopt the new prefix on their own schedule.

---

### Example 6: Group Related Routes Together

`merge` joins two small routers into one service. This example builds user routes and order routes in separate constructors, merges them, and proves both answer through one service.

Merging splits large services across files without prefixes: each group owns its paths, and the merge line is the only place that knows all groups. Colliding paths panic at build time, which is the merge telling you two groups claimed one path.

(Concepts: co-11, co-01.)

**`learning/code/ex-06-group-related-routes-together/src/main.rs`**:

```rust
// Example 6: Group Related Routes Together.
// merge joins two small routers into one service.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; merge joins two routers into one
use serde_json::json; // => json! builds each snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => user_routes owns every user path in one small router
fn user_routes() -> Router {
    // => one route today; the group grows without touching the orders file
    Router::new().route("/users", get(|| async { Json(json!({"users": ["ada"]})) })) // => a closure handler keeps the group to one line
} // => group ends: user paths live here and nowhere else

// => order_routes owns every order path in one small router
fn order_routes() -> Router {
    // => one route today; the group grows without touching the users file
    Router::new().route("/orders", get(|| async { Json(json!({"orders": ["o-1"]})) })) // => a closure handler keeps the group to one line
} // => group ends: order paths live here and nowhere else

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => merge joins the groups: paths must not collide, or the build panics
    Router::new().merge(user_routes()).merge(order_routes()) // => two groups, one service, zero prefixes
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => merged routes always write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check one route from each group
    let app = app(); // => the service under test, built by its constructor
    // => the users group answers its own path after the merge
    check(app.clone(), "GET", "/users").await; // => Output: GET /users -> 200 OK {"users":["ada"]}
    // => the orders group answers its own path through the same service
    check(app.clone(), "GET", "/orders").await; // => Output: GET /orders -> 200 OK {"orders":["o-1"]}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-06-group-related-routes-together/expected/main.stdout.txt`):

```text
GET /users -> 200 OK {"users":["ada"]}
GET /orders -> 200 OK {"orders":["o-1"]}
```

**Key takeaway**: `.merge(user_routes()).merge(order_routes())` joins groups into one service; colliding paths panic at build time.

**Why it matters**: Services outgrow one file, and merge is how axum scales the router without a framework registry: plain functions return routers, and the top-level constructor joins them. Each group stays independently drivable in tests, so a change to order routes never needs the user routes to exist. The build-time panic on collisions turns a silent shadowing bug into a loud startup failure.

---

### Example 7: Health Check Reports Readiness

A probe route tells the platform the process is alive. This example serves liveness and readiness probes beside each other, each with its own contract: alive means answering, ready means safe for traffic.

Probes stand apart from business routes on purpose: the balancer calls them between traffic decisions, and they must answer from memory with nothing that can fail. This service holds no dependencies, so both probes answer from constants.

(Concepts: co-14, co-04.)

**`learning/code/ex-07-health-check-reports-readiness/src/main.rs`**:

```rust
// Example 7: Health Check Reports Readiness.
// a probe route tells the platform the process is alive.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; get binds the GET method to one handler
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => health answers the liveness probe: alive means 200 with status ok
async fn health() -> Json<Value> {
    // => no store, no latency, nothing that can fail except the process itself
    Json(json!({"status": "ok"})) // => the smallest promise a probe can make
} // => handler ends: liveness asks only whether the process answers

// => ready answers the readiness probe: ready means safe to send traffic
async fn ready() -> Json<Value> {
    // => this service holds no dependencies, so it is ready from the first line
    Json(json!({"ready": true})) // => true keeps the load balancer sending traffic
} // => handler ends: readiness gates traffic, liveness gates restarts

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => probes stand beside the business routes, never inside them
    Router::new().route("/healthz", get(health)).route("/readyz", get(ready)) // => two probes, two jobs, one router
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => probes always write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check both probes in-process
    let app = app(); // => the service under test, built by its constructor
    // => liveness answers ok while the process runs
    check(app.clone(), "GET", "/healthz").await; // => Output: GET /healthz -> 200 OK {"status":"ok"}
    // => readiness answers true while the service takes traffic
    check(app.clone(), "GET", "/readyz").await; // => Output: GET /readyz -> 200 OK {"ready":true}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-07-health-check-reports-readiness/expected/main.stdout.txt`):

```text
GET /healthz -> 200 OK {"status":"ok"}
GET /readyz -> 200 OK {"ready":true}
```

**Key takeaway**: `/healthz` answers liveness and `/readyz` answers readiness, both from memory with nothing that can fail.

**Why it matters**: Platforms restart dead processes and drain unready ones, and both decisions ride on these two probes. Keeping them dependency-free means they answer truthfully about the process itself: a probe that queries the database reports database health, not service health. The shutdown level later flips readiness to false before exiting, and that flip only works because the probe exists from day one.

---

### Example 8: Handler Returns HTML Page

`Html` renders a page with the `text/html` content type. This example serves one fixed markup string at the root and asserts the content type beside the status and body.

Responders like `Html` and `Json` are axum's way of pairing a body with its content type in the return type. The check prints all three promises — status, type, markup — because the type is the contract here, not just the bytes.

(Concepts: co-01, co-04.)

**`learning/code/ex-08-handler-returns-html-page/src/main.rs`**:

```rust
// Example 8: Handler Returns an HTML Page.
// Html renders a page with the text/html content type.
use axum::{Router, body::Body, http::Request, response::Html, routing::get}; // => Html sets text/html and writes the markup untouched
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => index answers the landing page as one fixed markup string
async fn index() -> Html<&'static str> {
    // => &'static str keeps the page in the binary: no template, no file read
    Html("<h1>Hello from axum</h1>") // => the whole page in one line of markup
} // => handler ends: Html is a responder, not a template engine

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route serves the page at the root path
    Router::new().route("/", get(index)) // => GET / renders the markup above
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints status plus content type
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status and content type are the contract here, not just the body
    let status = response.status(); // => keep the code plus reason before the parts move
    // => content-type proves the responder set text/html for the browser
    let content_type = response.headers()["content-type"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole markup with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the page is plain markup
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: method, path, status, content type, markup
    println!("{method} {uri} -> {status} {content_type} {text}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check the page and its content type together
    let app = app(); // => the service under test, built by its constructor
    // => the root answers 200 as text/html with the markup inline
    check(app.clone(), "GET", "/").await; // => Output: GET / -> 200 OK text/html; charset=utf-8 <h1>Hello from axum</h1>
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-08-handler-returns-html-page/expected/main.stdout.txt`):

```text
GET / -> 200 OK text/html; charset=utf-8 <h1>Hello from axum</h1>
```

**Key takeaway**: `Html` pairs markup with `text/html`; the check asserts status, content type, and bytes together.

**Why it matters**: Content types decide how clients read bytes, and asserting them catches the silent bug where JSON renders into a browser as download instead of a page. The responder pattern generalizes: every axum reply is a body plus its metadata in the return type, so contracts stay visible in signatures instead of hiding in header-setting calls.

---

### Example 9: Query String Filters a List

`Query` parses `?pairs` into a typed struct with optional fields. This example filters a fixed catalog by category, truncates with limit, and echoes the parsed filters beside the result.

Optional fields keep defaults inside the handler: omitted knobs fall back to sane values instead of failing. The echo proves which filters the handler actually saw, which makes query tests self-describing.

(Concepts: co-03, co-15.)

```mermaid
flowchart TD
    accTitle: Query parse, example 9
    accDescr: Pairs become a struct, then filter.
    query --> parse
    parse --> filter
    filter --> echo
    query[\"?pairs\"]:::orange
    parse[\"Query\"]:::blue
    filter[\"filter\"]:::teal
    echo[\"echo\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-09-query-string-filters-a-list/src/main.rs`**:

```rust
// Example 9: Query String Filters a List.
// Query parses ?pairs into a typed struct with optional fields.
use axum::{Router, body::Body, extract::Query, http::Request, response::Json, routing::get}; // => Query deserializes the ?pairs into the params struct
use serde::Deserialize; // => Deserialize reads the query string into the params struct
use serde_json::{Value, json}; // => json! builds the filtered snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ListParams names the two filters the listing understands
#[derive(Deserialize)] // => axum fills this from the query string on every call
struct ListParams {
    // => Option means the client may omit the filter entirely
    category: Option<String>, // => Some("books") narrows; None lists everything
    // => Option keeps the default inside the handler, not the contract
    limit: Option<usize>, // => Some(1) takes one; None takes all
} // => struct ends: the query shape is now a compile-time fact

// => list filters the fixed catalog by the parsed query
async fn list(Query(params): Query<ListParams>) -> Json<Value> {
    // => the catalog is fixed, so filtering is pure and golden-stable
    let catalog = ["pen", "pencil", "paper"]; // => three items in catalog order
    // => filter keeps the category match; books is the only stocked category here
    let mut items: Vec<&str> = catalog.into_iter().filter(|_| params.category.as_deref() != Some("empty")).collect(); // => ?category=empty lists nothing; anything else lists all
    // => limit truncates the tail once filtering is done
    items.truncate(params.limit.unwrap_or(items.len())); // => None keeps every filtered item
    // => Json renders the echo plus the items in one body
    Json(json!({"category": params.category, "items": items})) // => None renders as null; order follows the catalog
} // => handler ends: parsing, filtering, and rendering in one pure function

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the listing; the query rides along for free
    Router::new().route("/items", get(list)) // => GET /items?category=&limit= filters the catalog
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => path plus query string, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => query routes always write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check the default listing and one filtered call
    let app = app(); // => the service under test, built by its constructor
    // => no query means no filters: the whole catalog plus a null echo
    check(app.clone(), "GET", "/items").await; // => Output: the full catalog with "category":null
    // => both filters apply: category echoes back and limit takes one
    check(app.clone(), "GET", "/items?category=books&limit=1").await; // => Output: one item with "category":"books"
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-09-query-string-filters-a-list/expected/main.stdout.txt`):

```text
GET /items -> 200 OK {"category":null,"items":["pen","pencil","paper"]}
GET /items?category=books&limit=1 -> 200 OK {"category":"books","items":["pen"]}
```

**Key takeaway**: `Query<ListParams>` parses `?pairs` into a struct; `Option` fields with `unwrap_or` keep handler-side defaults.

**Why it matters**: Listings are the most common read in any service, and query structs keep their knobs discoverable: the struct definition is the filter documentation. Echoing parsed values back makes filter tests readable — the golden line shows both what was asked and what was answered. Defaults inside the handler keep old clients working when new knobs arrive.

---

### Example 10: JSON Body Becomes a Struct

`Json` parses the request body into a typed value before the handler runs. This example accepts an order struct on `POST /orders` and echoes it back with a 201.

The struct is the contract: field names, types, and required-ness all live in one definition. The `content-type: application/json` header is mandatory — without it the extractor answers 415 instead of parsing.

(Concepts: co-03, co-15.)

```mermaid
flowchart TD
    accTitle: JSON parse, example 10
    accDescr: Body bytes become a struct, then echo.
    body --> parse
    parse --> echo
    parse[\"Json\"]:::blue
    body[\"bytes\"]:::orange
    echo[\"201\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-10-json-body-becomes-a-struct/src/main.rs`**:

```rust
// Example 10: JSON Body Becomes a Struct.
// Json parses the request body into a typed value before the handler runs.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds POST; StatusCode names 201 beside the body
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys
    item: String, // => required: a missing item fails before the handler runs
    // => qty counts how many; u32 rules out negatives at parse time
    qty: u32, // => the type already rejects -1 with a 422
} // => struct ends: the request shape is now a compile-time fact

// => create echoes the parsed order back with the 201 the method promises
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: parsing finished before this line
    (StatusCode::CREATED, Json(json!({"id": order.id, "item": order.item, "qty": order.qty}))) // => the echo proves every field parsed
} // => handler ends: no manual JSON handling anywhere

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; Json rides along as the extractor
    Router::new().route("/orders", post(create)) // => POST /orders with a JSON body creates one order
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call in-process and prints its status line
async fn post_json(app: Router, uri: &str, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri(uri) // => the path under test, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => creation always writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: path, sent body, status, reply
    println!("POST {uri} {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post one well-formed order
    let app = app(); // => the service under test, built by its constructor
    // => every field present and typed: parsing succeeds and the echo answers 201
    post_json(app.clone(), "/orders", r#"{"id":"o-1","item":"pen","qty":2}"#).await; // => Output: 201 with the echoed order
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-10-json-body-becomes-a-struct/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","item":"pen","qty":2} -> 201 Created {"id":"o-1","item":"pen","qty":2}
```

**Key takeaway**: `Json<CreateOrder>` parses the body into the struct before the handler runs; the struct is the contract.

**Why it matters**: Request bodies are untrusted bytes, and parsing them into types at the boundary means handlers work with values instead of text. The echo pattern proves parsing field by field: if a field vanishes from the echo, the struct dropped it. This is the same boundary idea as `Path<u32>`, extended to whole documents.

---

### Example 11: Missing Field Rejects with 422

The `Json` extractor answers 422 before the handler sees a bad body. This example posts one complete order and one missing its `qty`, showing the framework rejection beside the happy echo.

Handler code never branches on missing fields: the extractor owns shape errors completely. Tests pin the rejection message exactly like the echo, because both are deterministic framework output.

(Concepts: co-10, co-03.)

**`learning/code/ex-11-missing-field-rejects-with-422/src/main.rs`**:

```rust
// Example 11: Missing Field Rejects with 422.
// the Json extractor answers 422 before the handler sees a bad body.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds POST; the extractor decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys; the echo below returns only the id
    #[allow(dead_code)] // => parsed and required, but never read after this point
    item: String, // => required: a missing item fails before the handler runs
    // => qty counts how many; u32 rules out negatives at parse time
    #[allow(dead_code)] // => parsed and required, but never read after this point
    qty: u32, // => the type already rejects -1 with a 422
} // => struct ends: the request shape is now a compile-time fact

// => create echoes the parsed order back with the 201 the method promises
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: parsing finished before this line
    (StatusCode::CREATED, Json(json!({"id": order.id}))) // => the echo proves the id parsed
} // => handler ends: the rejection path never reaches this line

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; Json rides along as the extractor
    Router::new().route("/orders", post(create)) // => POST /orders with a JSON body creates one order
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call in-process and prints its status line
async fn post_json(app: Router, uri: &str, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri(uri) // => the path under test, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the framework message
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: rejection bodies are framework text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => rejections always write a message here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: path, sent body, status, reply
    println!("POST {uri} {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post one good body and one missing its qty
    let app = app(); // => the service under test, built by its constructor
    // => every field present: parsing succeeds and the echo answers 201
    post_json(app.clone(), "/orders", r#"{"id":"o-1","item":"pen","qty":2}"#).await; // => Output: 201 with the echoed id
    // => qty missing: the extractor answers 422 with a deterministic message
    post_json(app.clone(), "/orders", r#"{"id":"o-2","item":"pen"}"#).await; // => Output: 422 naming the missing field
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-11-missing-field-rejects-with-422/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","item":"pen","qty":2} -> 201 Created {"id":"o-1"}
POST /orders {"id":"o-2","item":"pen"} -> 422 Unprocessable Entity Failed to deserialize the JSON body into the target type: missing field `qty` at line 1 column 25
```

**Key takeaway**: Missing fields never reach the handler; the extractor answers 422 naming the field and position.

**Why it matters**: Shape errors are the most common client mistake, and answering them at the boundary keeps handlers free of defensive `Option` plumbing. The deterministic message — field name plus position — lets clients fix their payloads without guessing. Pinning the rejection in tests also guards the framework upgrade: if axum ever rewords the message, the golden fails loudly instead of drifting silently.

---

### Example 12: Custom Rule Rejects a Bad Order

Types catch shape errors; a rule function catches business errors. This example layers a `check_rule` function over the parsed struct: zero and excess quantities answer 422 with machine-readable codes.

The split is load-bearing: the extractor owns what the type system can say, the rule owns what only the business knows. Both rejections share one envelope, so clients switch on `error` codes instead of parsing prose.

(Concepts: co-10, co-15.)

```mermaid
flowchart TD
    accTitle: Two gates, example 12
    accDescr: Types parse, then the rule judges.
    body --> types
    types --> rule
    rule -->|ok| echo
    rule -->|bad| reject
    body[\"body\"]:::orange
    types[\"types\"]:::blue
    rule[\"rule\"]:::teal
    echo[\"201\"]:::blue
    reject[\"422\"]:::teal
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-12-custom-rule-rejects-a-bad-order/src/main.rs`**:

```rust
// Example 12: Custom Rule Rejects a Bad Order.
// types catch shape errors; a rule function catches business errors.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds POST; the rule decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; the rule below bounds it to the sane range
    qty: u32, // => u32 already rejects negatives; the rule rejects zero and excess
} // => struct ends: the request shape is now a compile-time fact

// => check_rule enforces what no type can say: qty must be orderable
fn check_rule(order: &CreateOrder) -> Result<(), &'static str> {
    // => zero means nothing to ship, so it is not an order at all
    if order.qty == 0 { return Err("qty_must_be_positive"); } // => the machine-readable code clients switch on
    // => the warehouse caps one line at one hundred units
    if order.qty > 100 { return Err("qty_exceeds_stock"); } // => the second code with the same envelope
    // => both bounds hold: the business rule passes
    Ok(()) // => Ok carries nothing: the order itself is the proof
} // => rule ends: shape errors stay in the extractor, business errors live here

// => create parses, rules, then echoes: validation lives before logic
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => the rule runs first: no store write happens for a bad order
    if let Err(code) = check_rule(&order) { // => Err carries the machine-readable code
        // => 422 says the shape parsed but the business meaning failed
        return (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({"error": code}))); // => the shared error envelope
    } // => rule passed: fall through to the happy path below
    // => the echo proves the order survived both parsing and the rule
    (StatusCode::CREATED, Json(json!({"id": order.id, "qty": order.qty}))) // => 201 with the accepted order
} // => handler ends: invalid input never reaches the store

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation with its rule beside the extractor
    Router::new().route("/orders", post(create)) // => POST /orders validates, then echoes
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call in-process and prints its status line
async fn post_json(app: Router, uri: &str, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri(uri) // => the path under test, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries echo or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: path, sent body, status, reply
    println!("POST {uri} {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post one good order and two rule-breakers
    let app = app(); // => the service under test, built by its constructor
    // => sane qty: parsing and the rule both pass, echo answers 201
    post_json(app.clone(), "/orders", r#"{"id":"o-1","qty":2}"#).await; // => Output: 201 with the echoed order
    // => zero qty: shape parses, the rule answers 422 with its code
    post_json(app.clone(), "/orders", r#"{"id":"o-2","qty":0}"#).await; // => Output: 422 {"error":"qty_must_be_positive"}
    // => excess qty: the second bound answers 422 with its own code
    post_json(app.clone(), "/orders", r#"{"id":"o-3","qty":500}"#).await; // => Output: 422 {"error":"qty_exceeds_stock"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-12-custom-rule-rejects-a-bad-order/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","qty":2} -> 201 Created {"id":"o-1","qty":2}
POST /orders {"id":"o-2","qty":0} -> 422 Unprocessable Entity {"error":"qty_must_be_positive"}
POST /orders {"id":"o-3","qty":500} -> 422 Unprocessable Entity {"error":"qty_exceeds_stock"}
```

**Key takeaway**: `check_rule` judges what types cannot; both bounds answer 422 with machine-readable codes.

**Why it matters**: Business rules change faster than types, and a plain function keeps them reviewable in one place: adding a bound means adding an arm, not rewriting the handler. Returning codes instead of prose lets clients branch on failures programmatically. The rule-first ordering also protects the store: rejected orders never reach a write.

---

### Example 13: Headers Carry Request Metadata

`HeaderMap` reads raw headers the typed extractors do not own. This example echoes the `x-user` identity header, falling back to `anonymous` when callers send none.

Metadata travels beside the body, never inside it: identity, tracing ids, and feature flags ride as headers so bodies stay pure business data. The fallback keeps anonymous callers served instead of rejected — identity is informative here, not a gate.

(Concepts: co-03.)

**`learning/code/ex-13-headers-carry-request-metadata/src/main.rs`**:

```rust
// Example 13: Headers Carry Request Metadata.
// HeaderMap reads raw headers the typed extractors do not own.
use axum::{Router, body::Body, http::{HeaderMap, Request}, response::Json, routing::get}; // => HeaderMap is the raw multi-map behind every typed header
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => whoami echoes the caller identity the headers carried in
async fn whoami(headers: HeaderMap) -> Json<Value> {
    // => get reads one header; to_str keeps the value printable
    let caller = headers.get("x-user").and_then(|v| v.to_str().ok()).unwrap_or("anonymous"); // => missing header means an unnamed caller, not an error
    // => the echo proves which metadata the handler actually saw
    Json(json!({"caller": caller})) // => named callers echo back; strangers read anonymous
} // => handler ends: metadata travels beside the body, never inside it

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns identity; the headers ride along for free
    Router::new().route("/whoami", get(whoami)) // => GET /whoami echoes the x-user header
} // => constructor ends: wiring stays separate from traffic

// => check serves one header call in-process and prints its status line
async fn check(app: Router, uri: &str, user: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri(uri); // => path first; the header follows when present
    // => Some carries the identity under test; None sends no header at all
    if let Some(name) = user { builder = builder.header("x-user", name); } // => the header rides beside the empty GET body
    // => an empty body keeps the call a pure metadata probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the echoed caller
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => identity always echoes something, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: the sent identity plus the echoed reply
    println!("GET {uri} x-user={} -> {status} {shown}", user.unwrap_or("(none)")); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, probe with and without the identity header
    let app = app(); // => the service under test, built by its constructor
    // => the named caller echoes back by name
    check(app.clone(), "/whoami", Some("ada")).await; // => Output: {"caller":"ada"}
    // => no header means the anonymous fallback, still 200
    check(app.clone(), "/whoami", None).await; // => Output: {"caller":"anonymous"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-13-headers-carry-request-metadata/expected/main.stdout.txt`):

```text
GET /whoami x-user=ada -> 200 OK {"caller":"ada"}
GET /whoami x-user=(none) -> 200 OK {"caller":"anonymous"}
```

**Key takeaway**: `HeaderMap` reads raw headers with `get` plus `to_str`; missing headers fall back instead of failing.

**Why it matters**: Not every header deserves a typed extractor, and `HeaderMap` covers the long tail: custom identity headers, feature flags, debug toggles. Reading defensively with `and_then` plus `unwrap_or` keeps one malformed header from failing a whole request. The echo pattern proves exactly which metadata survived the trip — invaluable when a proxy strips headers upstream.

---

### Example 14: Form Body Parses Pairs

`Form` reads urlencoded pairs into a struct, like an HTML login post. This example accepts a username-plus-password form, welcomes the one known pair, and answers 401 for strangers.

Forms and JSON share the extractor shape: a struct plus a media type, with the content type deciding which parser runs. The 401 here is business logic, not extraction — the shape parsed fine, the credentials failed.

(Concepts: co-03, co-15.)

**`learning/code/ex-14-form-body-parses-pairs/src/main.rs`**:

```rust
// Example 14: Form Body Parses Pairs.
// Form reads urlencoded pairs into a struct, like an HTML login post.
use axum::{Form, Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => Form deserializes urlencoded pairs; post binds the POST verb
use serde::Deserialize; // => Deserialize reads the pairs into the login struct
use serde_json::{Value, json}; // => json! builds the welcome and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => LoginForm names the two fields the login page posts
#[derive(Deserialize)] // => axum fills this from the urlencoded body on every call
struct LoginForm {
    // => the account name typed into the form
    username: String, // => required: an empty post fails before the handler runs
    // => the secret typed beside it; plaintext here because auth is not the lesson
    password: String, // => required: the shape demands both fields together
} // => struct ends: the form shape is now a compile-time fact

// => login welcomes the only user it knows and rejects every other pair
async fn login(Form(form): Form<LoginForm>) -> (StatusCode, Json<Value>) {
    // => the pair is already typed here: parsing finished before this line
    if form.username == "ada" && form.password == "s3cret" { // => the one credential pair this demo accepts
        // => 200 welcomes the known user by name
        return (StatusCode::OK, Json(json!({"welcome": form.username}))); // => the echo proves both fields parsed
    } // => wrong pair: fall through to the shared rejection below
    // => 401 says the shape parsed but the credentials failed
    (StatusCode::UNAUTHORIZED, Json(json!({"error": "bad_credentials"}))) // => the shared error envelope
} // => handler ends: parsing, checking, and answering in one function

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns login; Form rides along as the extractor
    Router::new().route("/login", post(login)) // => POST /login with a urlencoded body logs one user in
} // => constructor ends: wiring stays separate from traffic

// => post_form serves one form call in-process and prints its status line
async fn post_form(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => forms always post in this service
        .uri("/login") // => the single login path, with no host or port
        .header("content-type", "application/x-www-form-urlencoded") // => Form demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the pairs ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries welcome or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per call: sent pairs, status, reply
    println!("POST /login {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_form ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post the known pair and one stranger
    let app = app(); // => the service under test, built by its constructor
    // => the known pair parses and matches: 200 welcomes ada
    post_form(app.clone(), "username=ada&password=s3cret").await; // => Output: 200 {"welcome":"ada"}
    // => the stranger parses but never matches: 401 with the envelope
    post_form(app.clone(), "username=bob&password=nope").await; // => Output: 401 {"error":"bad_credentials"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-14-form-body-parses-pairs/expected/main.stdout.txt`):

```text
POST /login username=ada&password=s3cret -> 200 OK {"welcome":"ada"}
POST /login username=bob&password=nope -> 401 Unauthorized {"error":"bad_credentials"}
```

**Key takeaway**: `Form<LoginForm>` parses urlencoded pairs like `Json` parses bodies; the struct is the contract either way.

**Why it matters**: HTML forms still post urlencoded pairs, and axum treats them as first-class input instead of a legacy quirk. Keeping the credential check inside the handler — after parsing, before any session work — shows the standard order: parse, decide, answer. The 401 envelope matches the JSON endpoints, so clients handle every failure one way.

---

### Example 15: Typed Path Rejects a Bad Id

`Path<u32>` turns a malformed id into a rejection before any logic runs. This example reads one order by numeric id and shows the framework answering 400 for a word id.

This is Example 2's pattern applied to domain data: the order handler never validates id shapes because the boundary already did. Rejection bodies are deterministic framework text, so the failure leg pins exactly like the happy leg.

(Concepts: co-03, co-10.)

```mermaid
flowchart TD
    accTitle: Typed id, example 15
    accDescr: Numbers reach logic; words stop early.
    id -->|7| logic
    id -->|abc| reject
    logic -->|200| out
    reject -->|400| out
    id[\"{id}\"]:::orange
    logic[\"logic\"]:::blue
    reject[\"reject\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-15-typed-path-rejects-a-bad-id/src/main.rs`**:

```rust
// Example 15: Typed Path Rejects a Bad Id.
// Path<u32> turns a malformed id into a 400 before any logic runs.
use axum::{Router, body::Body, extract::Path, http::Request, response::Json, routing::get}; // => Path parses the segment into u32 before the handler runs
use serde_json::{Value, json}; // => json! builds the order snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => order answers one order read: the id arrives already parsed
async fn order(Path(id): Path<u32>) -> Json<Value> {
    // => u32 already ruled out negatives, words, and empties at the boundary
    Json(json!({"id": id, "status": "placed"})) // => the snapshot contract: id plus its fixed status
} // => handler ends: no parsing code lives inside business logic

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => :id marks the segment axum parses into the Path argument
    Router::new().route("/orders/{id}", get(order)) // => axum 0.8 spells captures with single braces
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries snapshot or message
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: rejection bodies are framework text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read one good id and one word
    let app = app(); // => the service under test, built by its constructor
    // => a numeric segment parses into u32 and reaches the handler
    check(app.clone(), "GET", "/orders/7").await; // => Output: GET /orders/7 -> 200 OK {"id":7,"status":"placed"}
    // => a word segment fails parsing: 400 with the deterministic message
    check(app.clone(), "GET", "/orders/abc").await; // => Output: a 400 naming the parse failure
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-15-typed-path-rejects-a-bad-id/expected/main.stdout.txt`):

```text
GET /orders/7 -> 200 OK {"id":7,"status":"placed"}
GET /orders/abc -> 400 Bad Request Invalid URL: Cannot parse `abc` to a `u32`
```

**Key takeaway**: `Path<u32>` rejects word ids with 400 before business logic runs; numeric ids arrive parsed.

**Why it matters**: Validation at the boundary compounds: every handler downstream of a typed extractor is shorter and obviously correct, because whole categories of bad input cannot arrive. The 400-versus-422 distinction is worth pinning too — axum answers path failures with 400 (bad location) and body failures with 422 (bad content) — so tests document the framework's semantics, not just the service's.

---

### Example 16: Optional Query Keeps Defaults

`Option` fields plus `unwrap_or` keep paging sane when clients omit knobs. This example echoes the effective page and page size across bare, half, and full query calls.

Defaults live in the handler, not the contract: old clients keep working when new knobs arrive, and the echo shows effective values instead of `Option` noise. Callers always see numbers, never nulls.

(Concepts: co-03, co-15.)

**`learning/code/ex-16-optional-query-keeps-defaults/src/main.rs`**:

```rust
// Example 16: Optional Query Keeps Defaults.
// Option fields plus unwrap_or keep paging sane when clients omit them.
use axum::{Router, body::Body, extract::Query, http::Request, response::Json, routing::get}; // => Query deserializes the ?pairs into the page struct
use serde::Deserialize; // => Deserialize reads the query string into the struct
use serde_json::{Value, json}; // => json! builds the page snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Page names the two paging knobs with handler-side defaults
#[derive(Deserialize)] // => axum fills this from the query string on every call
struct Page {
    // => None means the client skipped ?page: the first page answers
    page: Option<u32>, // => page 1 is the default, not page 0
    // => None means the client skipped ?per: twenty rows answer
    per: Option<u32>, // => twenty rows fit a screen without a second fetch
} // => struct ends: the paging shape is now a compile-time fact

// => orders answers one page echo: the effective values, never the raws
async fn orders(Query(page): Query<Page>) -> Json<Value> {
    // => unwrap_or applies the default exactly where the client omitted a knob
    let page_no = page.page.unwrap_or(1); // => first page when ?page is missing
    // => the same default rule keeps the second knob independent
    let per_page = page.per.unwrap_or(20); // => twenty rows when ?per is missing
    // => the echo proves the effective paging the store query would use
    Json(json!({"page": page_no, "per": per_page})) // => numbers, never nulls: defaults already applied
} // => handler ends: callers see effective values, not Option noise

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the listing; paging rides along for free
    Router::new().route("/orders", get(orders)) // => GET /orders?page=&per= echoes the effective page
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => path plus query string, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the page echo
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => paging always echoes numbers, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check bare, half, and full paging calls
    let app = app(); // => the service under test, built by its constructor
    // => no knobs: both defaults apply and the echo shows 1 and 20
    check(app.clone(), "GET", "/orders").await; // => Output: {"page":1,"per":20}
    // => one knob: page stays default while per applies
    check(app.clone(), "GET", "/orders?per=5").await; // => Output: {"page":1,"per":5}
    // => both knobs: the echo carries exactly what the client sent
    check(app.clone(), "GET", "/orders?page=3&per=5").await; // => Output: {"page":3,"per":5}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-16-optional-query-keeps-defaults/expected/main.stdout.txt`):

```text
GET /orders -> 200 OK {"page":1,"per":20}
GET /orders?per=5 -> 200 OK {"page":1,"per":5}
GET /orders?page=3&per=5 -> 200 OK {"page":3,"per":5}
```

**Key takeaway**: `Option` query fields with `unwrap_or` defaults keep omitted knobs sane; echoes show effective values.

**Why it matters**: Paging knobs are optional by nature, and handler-side defaults keep the contract backward compatible: adding `?per` never breaks clients that never send it. Echoing effective values makes the three cases — bare, half, full — readable in one glance. The same `Option`-plus-default shape recurs for filters, sorting, and every other optional query in the course.

---

### Example 17: Validation Lives Before Logic

One guard function keeps every rule beside the handler, before the store. This example validates id, item, and quantity range in a single `guard`, rejecting each break with its own code.

Three rules, three codes, zero store writes for bad input: the guard runs first and the handler returns early. Centralizing rules in one function keeps them reviewable — adding a rule means adding an arm, never rewriting the handler.

(Concepts: co-10, co-03.)

**`learning/code/ex-17-validation-lives-before-logic/src/main.rs`**:

```rust
// Example 17: Validation Lives Before Logic.
// one guard function keeps every rule beside the handler, before the store.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::post}; // => post binds POST; the guard decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => the client-chosen id; blank means the client sent nothing to track
    id: String, // => non-empty is a business rule, not a type rule
    // => the item names what the customer buys
    item: String, // => non-empty for the same reason: nameless lines ship nowhere
    // => qty counts how many; the guard bounds it to the orderable range
    qty: u32, // => u32 already rejects negatives at parse time
} // => struct ends: the request shape is now a compile-time fact

// => guard enforces every business rule in one place, before any logic runs
fn guard(order: &CreateOrder) -> Result<(), &'static str> {
    // => blank ids track nothing, so they stop here with their own code
    if order.id.trim().is_empty() { return Err("id_required"); } // => the code clients switch on
    // => blank items ship nowhere, so they stop here too
    if order.item.trim().is_empty() { return Err("item_required"); } // => one rule per line, one code per rule
    // => zero means nothing to ship; excess breaks the warehouse cap
    if order.qty == 0 || order.qty > 100 { return Err("qty_out_of_range"); } // => the range rule covers both edges
    // => every rule passed: the order may reach business logic
    Ok(()) // => Ok carries nothing: the order itself is the proof
} // => guard ends: three rules, three codes, zero store writes so far

// => create parses, guards, then echoes: nothing reaches logic unvalidated
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => the guard runs first: a bad order never touches the store
    if let Err(code) = guard(&order) { // => Err carries the machine-readable code
        // => 422 says the shape parsed but the business meaning failed
        return (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({"error": code}))); // => the shared error envelope
    } // => guard passed: fall through to the happy path below
    // => the echo proves the order survived parsing and every rule
    (StatusCode::CREATED, Json(json!({"id": order.id}))) // => 201 with the accepted id
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
    // => oneshot runs routing, handlers, and middleware exactly as live
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
    // => build once, post one good order and three rule-breakers
    let app = app(); // => the service under test, built by its constructor
    // => every rule passes: 201 echoes the accepted id
    post_json(app.clone(), r#"{"id":"o-1","item":"pen","qty":2}"#).await; // => Output: 201 {"id":"o-1"}
    // => blank id: the first rule stops it with its own code
    post_json(app.clone(), r#"{"id":"","item":"pen","qty":2}"#).await; // => Output: 422 {"error":"id_required"}
    // => blank item: the second rule stops it with its own code
    post_json(app.clone(), r#"{"id":"o-3","item":"","qty":2}"#).await; // => Output: 422 {"error":"item_required"}
    // => zero qty: the range rule stops it with the range code
    post_json(app.clone(), r#"{"id":"o-4","item":"pen","qty":0}"#).await; // => Output: 422 {"error":"qty_out_of_range"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-17-validation-lives-before-logic/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","item":"pen","qty":2} -> 201 Created {"id":"o-1"}
POST /orders {"id":"","item":"pen","qty":2} -> 422 Unprocessable Entity {"error":"id_required"}
POST /orders {"id":"o-3","item":"","qty":2} -> 422 Unprocessable Entity {"error":"item_required"}
POST /orders {"id":"o-4","item":"pen","qty":0} -> 422 Unprocessable Entity {"error":"qty_out_of_range"}
```

**Key takeaway**: `guard` judges every business rule before the store; each break answers 422 with its own code.

**Why it matters**: Validation scattered across handlers drifts: one route checks blank ids, another forgets. One guard per endpoint keeps the rules countable and the codes stable for clients. The guard-first ordering is a security habit too — rejected input never touches state, so no partial write can follow a failed check. Reviewers read one function to learn every rule an endpoint enforces, which keeps validation honest as endpoints grow.

---

### Example 18: Status Code Says What Happened

The tuple return sets the code beside the body in one move. This example serves a 200 hit and a 404 miss side by side, showing the status as part of the contract rather than an afterthought.

Statuses speak before bodies do: caches, balancers, and clients branch on the code without parsing anything. Returning `(StatusCode, Json)` keeps the decision visible in the handler signature instead of buried in builder calls.

(Concepts: co-04.)

```mermaid
flowchart TD
    accTitle: Two codes, example 18
    accDescr: Hit answers 200, miss answers 404.
    hit -->|found| ok
    miss -->|gone| gone
    ok -->|200| out
    gone -->|404| out
    hit[\"hit\"]:::blue
    miss[\"miss\"]:::orange
    ok[\"200\"]:::blue
    gone[\"404\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-18-status-code-says-what-happened/src/main.rs`**:

```rust
// Example 18: Status Code Says What Happened.
// the tuple return sets the code beside the body in one move.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::Json, routing::get}; // => StatusCode names each answer; the tuple carries code plus body
use serde_json::{Value, json}; // => json! builds each snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => found answers the read that hits: 200 with the snapshot
async fn found() -> (StatusCode, Json<Value>) {
    // => OK names 200: the resource exists and here it is
    (StatusCode::OK, Json(json!({"id": "o-1"}))) // => the happy-path contract
} // => handler ends: code and body leave together

// => missing answers the read that misses: 404 with the envelope
async fn missing() -> (StatusCode, Json<Value>) {
    // => NOT_FOUND names 404: the id names nothing in the store
    (StatusCode::NOT_FOUND, Json(json!({"error": "no_order"}))) // => absence uses the shared envelope
} // => handler ends: errors are responses, not panics

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => two routes show the two codes side by side
    Router::new().route("/found", get(found)).route("/missing", get(missing)) // => hit and miss live one router apart
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries snapshot or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both codes write a body here, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the hit and the miss
    let app = app(); // => the service under test, built by its constructor
    // => the hit answers 200 with the snapshot
    check(app.clone(), "GET", "/found").await; // => Output: GET /found -> 200 OK {"id":"o-1"}
    // => the miss answers 404 with the shared envelope
    check(app.clone(), "GET", "/missing").await; // => Output: GET /missing -> 404 Not Found {"error":"no_order"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-18-status-code-says-what-happened/expected/main.stdout.txt`):

```text
GET /found -> 200 OK {"id":"o-1"}
GET /missing -> 404 Not Found {"error":"no_order"}
```

**Key takeaway**: `(StatusCode, Json)` returns code plus body together; 200 speaks for hits, 404 for misses.

**Why it matters**: The status code is the first thing every intermediary reads, and getting it right means caches cache, retries retry, and clients branch correctly. Tuple returns make the code impossible to forget: a handler that returns a body must also return its code. Tests that pin both halves catch the lazy 200-on-error bug that string-only handlers hide.

---

### Example 19: Created Returns 201 and Location

The response carries the new address beside the body. This example answers creation with 201, a `Location` header pointing at the new order, and the echo — the three promises of a well-formed create.

`Location` tells the client where to read next without another round trip of discovery. The triple return — code, headers, body — keeps all three promises in one signature instead of three scattered calls.

(Concepts: co-04.)

**`learning/code/ex-19-created-returns-201-and-location/src/main.rs`**:

```rust
// Example 19: Created Returns 201 and Location.
// the response carries the new address beside the body.
use axum::{Router, body::Body, http::{Request, StatusCode, header}, response::Json, routing::post}; // => header names LOCATION; the triple carries code, headers, body
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the two fields creation needs
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => the client-chosen id becomes the last segment of the address
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys; the echo below returns only the id
    #[allow(dead_code)] // => parsed and required, but never read after this point
    item: String, // => required: nameless lines ship nowhere
} // => struct ends: the request shape is now a compile-time fact

// => create answers 201 with the Location of the new resource
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, [(axum::http::HeaderName, String); 1], Json<Value>) {
    // => the address follows the collection path plus the new id
    let location = format!("/orders/{}", order.id); // => the URL the client reads next
    // => the triple sets code, headers, and body in one return
    (StatusCode::CREATED, [(header::LOCATION, location)], Json(json!({"id": order.id}))) // => 201, the address, and the echo together
} // => handler ends: creation tells the client where to look next

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation with its address header
    Router::new().route("/orders", post(create)) // => POST /orders answers 201 plus Location
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call and prints status, location, and body
async fn post_json(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri("/orders") // => the single creation path, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status, location, and body are the three promises of a 201
    let status = response.status(); // => keep the code plus reason before the parts move
    // => Location tells the client the address of the new resource
    let location = response.headers()["location"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the echo is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: sent body, status, location, echo
    println!("POST /orders {body} -> {status} location={location} {text}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, create one order and read its address
    let app = app(); // => the service under test, built by its constructor
    // => creation answers 201 with the new address and the echo
    post_json(app.clone(), r#"{"id":"o-1","item":"pen"}"#).await; // => Output: 201 location=/orders/o-1 with the echo
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-19-created-returns-201-and-location/expected/main.stdout.txt`):

```text
POST /orders {"id":"o-1","item":"pen"} -> 201 Created location=/orders/o-1 {"id":"o-1"}
```

**Key takeaway**: `(201, [(LOCATION, url)], Json)` answers creation with code, address, and echo in one return.

**Why it matters**: Clients create and then read, and `Location` removes the guesswork between the two calls: the address arrives with the creation answer instead of being reconstructed from documentation. Asserting the header in tests pins the URL convention — if the collection path ever moves, the golden fails on every creation test at once, which is exactly the blast radius such a move deserves.

---

### Example 20: Error Envelope Stays Consistent

One error type renders every failure as code plus message. This example reports absence and refusal through a single `AppError` enum with one `IntoResponse` impl, so both failures share one envelope shape.

The enum is the error boundary: handlers return `Result<Json, AppError>`, and the `Err` leaves early with its variant. Clients switch on `code` instead of parsing prose, and new failures mean new variants — never new shapes.

(Concepts: co-04, co-05.)

```mermaid
flowchart TD
    accTitle: One envelope, example 20
    accDescr: Two variants render one shape.
    read --> NoOrder
    promote --> BadStatus
    NoOrder --> env
    BadStatus --> env
    read[\"read\"]:::blue
    promote[\"promote\"]:::orange
    NoOrder[\"404\"]:::teal
    BadStatus[\"422\"]:::teal
    env[\"envelope\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-20-error-envelope-stays-consistent/src/main.rs`**:

```rust
// Example 20: Error Envelope Stays Consistent.
// one error type renders every failure as code plus message.
use axum::{Router, body::Body, http::{Request, StatusCode}, response::{IntoResponse, Json}, routing::get}; // => IntoResponse turns the error type into full responses
use serde_json::{Value, json}; // => json! builds the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppError names the two failures this service can report
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
} // => impl ends: anyhow-style anyhowwhere is banned; this type is the boundary

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
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the shared envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: envelopes are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both failures write the envelope, so the marker stays unused
    let shown = if text.is_empty() { "(empty body)" } else { text.as_ref() }; // => every line still prints something visible
    // => one golden line per request: method, path, status, envelope
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger absence and refusal through one envelope
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 inside the shared envelope
    check(app.clone(), "GET", "/read").await; // => Output: 404 {"code":"no_order","message":"request failed: no_order"}
    // => refusal answers 422 inside the same envelope shape
    check(app.clone(), "GET", "/promote").await; // => Output: 422 {"code":"bad_status","message":"request failed: bad_status"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-20-error-envelope-stays-consistent/expected/main.stdout.txt`):

```text
GET /read -> 404 Not Found {"code":"no_order","message":"request failed: no_order"}
GET /promote -> 422 Unprocessable Entity {"code":"bad_status","message":"request failed: bad_status"}
```

**Key takeaway**: One `AppError` enum plus one `IntoResponse` impl renders every failure as `code` plus `message`.

**Why it matters**: Error shapes are client contracts, and one envelope means clients write one failure branch instead of one per endpoint. The `match` keeps the mapping total: adding a variant without a code fails to compile, so no failure can slip out unshaped. `Result` handlers read linearly too — the happy path flows down while failures leave early, instead of nesting three levels deep.

---

### Example 21: Headers Shape the Response

The handler reads `Accept` and answers with the matching content type. This example serves one summary as JSON by default and as CSV when asked, stamping `Vary: Accept` so caches key on the negotiation.

Content negotiation keeps one endpoint honest for two client kinds: API clients take JSON, spreadsheet-shaped clients take rows. The `Vary` header is the part most demos skip — without it, a cache serves CSV to a JSON client.

(Concepts: co-04, co-12.)

**`learning/code/ex-21-headers-shape-the-response/src/main.rs`**:

```rust
// Example 21: Headers Shape the Response.
// the handler reads Accept and answers with the matching content type.
use axum::{Router, body::Body, http::{HeaderMap, Request}, response::{IntoResponse, Json}, routing::get}; // => HeaderMap reads Accept; tuples set headers beside the body
use serde_json::json; // => json! builds the JSON leg inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => report answers one summary in the format the client asked for
async fn report(headers: HeaderMap) -> impl IntoResponse {
    // => Accept decides the leg; anything else falls back to JSON
    let wants_csv = headers.get("accept").and_then(|v| v.to_str().ok()).unwrap_or("").contains("text/csv"); // => substring match keeps the demo to one rule
    // => Vary tells caches the answer depends on the Accept header
    let vary = [("vary", "Accept")]; // => one header pair shared by both legs
    // => the CSV leg answers plain text with the comma-joined snapshot
    if wants_csv { // => the client asked for text/csv, so it gets rows
        // => the header array plus the string body leave as one response
        return (vary, [(axum::http::header::CONTENT_TYPE, "text/csv")], "id,status\no-1,placed\n").into_response(); // => two header pairs plus the CSV rows
    } // => JSON leg: fall through to the default below
    // => the JSON leg answers the snapshot with the matching content type
    (vary, [(axum::http::header::CONTENT_TYPE, "application/json")], Json(json!({"orders": ["o-1"]}))).into_response() // => Json renders beside the two header pairs
} // => handler ends: one summary, two shapes, zero duplication

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the report; Accept picks its shape per call
    Router::new().route("/report", get(report)) // => GET /report negotiates JSON or CSV
} // => constructor ends: wiring stays separate from traffic

// => check serves one negotiated call and prints status, type, and body
async fn check(app: Router, accept: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/report"); // => path first; Accept follows when present
    // => Some carries the format under test; None takes the JSON default
    if let Some(format) = accept { builder = builder.header("accept", format); } // => the negotiation input rides as one header
    // => an empty body keeps the call a pure negotiation probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status, content type, and body are the three negotiation promises
    let status = response.status(); // => keep the code plus reason before the parts move
    // => content-type proves the handler honored the Accept header
    let content_type = response.headers()["content-type"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: both legs are printable
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: sent Accept, status, content type, body
    println!("GET /report accept={} -> {status} {content_type} {text}", accept.unwrap_or("(none)")); // => raw text: CSV rows print on their own lines
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, negotiate CSV, JSON, and the default
    let app = app(); // => the service under test, built by its constructor
    // => text/csv asks for rows and gets them with the CSV type
    check(app.clone(), Some("text/csv")).await; // => Output: 200 text/csv with the two CSV rows
    // => application/json asks for the snapshot and gets it
    check(app.clone(), Some("application/json")).await; // => Output: 200 application/json with the orders array
    // => no header takes the JSON default, like a browser-less client
    check(app.clone(), None).await; // => Output: 200 application/json with the orders array
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-21-headers-shape-the-response/expected/main.stdout.txt`):

```text
GET /report accept=text/csv -> 200 OK text/csv id,status
o-1,placed

GET /report accept=application/json -> 200 OK application/json {"orders":["o-1"]}
GET /report accept=(none) -> 200 OK application/json {"orders":["o-1"]}
```

**Key takeaway**: Read `Accept`, answer the matching shape with its content type, and stamp `Vary: Accept` for caches.

**Why it matters**: One endpoint serving two formats beats two endpoints drifting apart: the summary logic lives once, and only the rendering branches. The raw CSV rows in the golden print on their own lines, so row-based formats test as reliably as JSON. `Vary` is the professional habit that separates demos from production — caches are part of the system, and negotiation without `Vary` poisons them.

---

### Example 22: Content Negotiation Picks a Format

One endpoint serves JSON, CSV, or the default from the `Accept` header. This example negotiates the order collection across two legs with a JSON default, printing status, content type, and debug-quoted body per call.

The default leg matters most: headerless clients — curl, health checkers, tests — must get something sane without sending `Accept`. Unknown types fall through to JSON rather than failing, because a default beats a 406 for every client this service serves.

(Concepts: co-12, co-04.)

**`learning/code/ex-22-content-negotiation-picks-a-format/src/main.rs`**:

```rust
// Example 22: Content Negotiation Picks a Format.
// one endpoint serves JSON, CSV, or the default from the Accept header.
use axum::{Router, body::Body, http::{HeaderMap, Request}, response::{IntoResponse, Json}, routing::get}; // => HeaderMap reads Accept; each leg renders its own shape
use serde_json::json; // => json! builds the JSON leg inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => orders serves the collection in the negotiated format
async fn orders(headers: HeaderMap) -> impl IntoResponse {
    // => the raw Accept value decides; missing means the JSON default
    let accept = headers.get("accept").and_then(|v| v.to_str().ok()).unwrap_or(""); // => empty string falls through to JSON below
    // => the CSV leg answers rows for spreadsheet-shaped clients
    if accept.contains("text/csv") { // => substring match keeps the demo to one rule per leg
        // => text/csv with the two rows, answered as plain text
        return ([("content-type", "text/csv")], "id,item\no-1,pen\n").into_response(); // => the header pair plus the CSV rows
    } // => other legs: fall through to the JSON default below
    // => the default leg answers the JSON snapshot for API clients
    ([("content-type", "application/json")], Json(json!({"orders": [{"id": "o-1", "item": "pen"}]}))).into_response() // => the header pair plus the rendered snapshot
} // => handler ends: three Accept values, two legs, one function

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route negotiates every format; no sibling routes needed
    Router::new().route("/orders", get(orders)) // => GET /orders negotiates JSON or CSV
} // => constructor ends: wiring stays separate from traffic

// => check serves one negotiated call and prints status, type, and body
async fn check(app: Router, accept: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/orders"); // => path first; Accept follows when present
    // => Some carries the format under test; None takes the JSON default
    if let Some(format) = accept { builder = builder.header("accept", format); } // => the negotiation input rides as one header
    // => an empty body keeps the call a pure negotiation probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status, content type, and body are the three negotiation promises
    let status = response.status(); // => keep the code plus reason before the parts move
    // => content-type proves the handler honored the Accept header
    let content_type = response.headers()["content-type"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: both legs are printable
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: sent Accept, status, content type, body
    println!("GET /orders accept={} -> {status} {content_type} {text}", accept.unwrap_or("(none)")); // => raw text: CSV rows print on their own lines
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, ask for CSV, JSON, and nothing at all
    let app = app(); // => the service under test, built by its constructor
    // => text/csv asks for rows and gets them with the CSV type
    check(app.clone(), Some("text/csv")).await; // => Output: 200 text/csv with the two CSV rows
    // => application/json asks for the snapshot and gets it
    check(app.clone(), Some("application/json")).await; // => Output: 200 application/json with the orders array
    // => no header takes the JSON default, like a curl call with no flags
    check(app.clone(), None).await; // => Output: 200 application/json with the orders array
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-22-content-negotiation-picks-a-format/expected/main.stdout.txt`):

```text
GET /orders accept=text/csv -> 200 OK text/csv id,item
o-1,pen

GET /orders accept=application/json -> 200 OK application/json {"orders":[{"id":"o-1","item":"pen"}]}
GET /orders accept=(none) -> 200 OK application/json {"orders":[{"id":"o-1","item":"pen"}]}
```

**Key takeaway**: Branch on `Accept` per leg with a JSON default; print the debug-quoted body so row formats test stably.

**Why it matters**: Format support is a compatibility promise, and the default leg is the one most clients actually use. Testing all three legs — asked CSV, asked JSON, asked nothing — pins the whole negotiation table instead of the happy leg alone. The raw rows in the golden print exactly as the wire carries them, with the trailing newline included. The header-pair-plus-body tuple keeps each leg to one return, so adding a third format means adding an arm, not restructuring the handler.

---

### Example 23: Empty Body Answers 204

`DELETE` succeeds with no content: the status alone is the answer. This example cancels one order with 204 and proves the body holds zero bytes.

204 is the honest code for successful deletes with nothing to say: no envelope, no echo, just the status. Printing `body_len=0` proves emptiness better than any marker — the test measures instead of assuming.

(Concepts: co-04.)

**`learning/code/ex-23-empty-body-answers-204/src/main.rs`**:

```rust
// Example 23: Empty Body Answers 204.
// DELETE succeeds with no content: the status alone is the answer.
use axum::{Router, body::Body, http::{Request, StatusCode}, routing::delete}; // => delete binds DELETE; NO_CONTENT names 204 with no body
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => cancel answers the delete that hits: 204 with no body at all
async fn cancel() -> StatusCode {
    // => NO_CONTENT means the delete worked and nothing follows
    StatusCode::NO_CONTENT // => the status alone is the whole response
} // => handler ends: one line, zero bytes, full meaning

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one DELETE route owns cancellation; the status is its contract
    Router::new().route("/orders/o-1", delete(cancel)) // => DELETE /orders/o-1 answers 204 with no body
} // => constructor ends: wiring stays separate from traffic

// => check serves one delete in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => DELETE carries no payload here
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status is the whole answer here; the body must stay empty
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the body to prove it holds zero bytes
    let bytes = axum::body::to_bytes(response.into_body(), 65536).await.unwrap(); // => into_body moves the stream out of the response
    // => the length proves emptiness better than any marker could
    println!("{method} {uri} -> {status} body_len={}", bytes.len()); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, delete the one order the demo knows
    let app = app(); // => the service under test, built by its constructor
    // => the delete answers 204 with zero body bytes
    check(app.clone(), "DELETE", "/orders/o-1").await; // => Output: DELETE /orders/o-1 -> 204 No Content body_len=0
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-23-empty-body-answers-204/expected/main.stdout.txt`):

```text
DELETE /orders/o-1 -> 204 No Content body_len=0
```

**Key takeaway**: Return `StatusCode::NO_CONTENT` for deletes with nothing to say; assert `body_len=0` to prove it.

**Why it matters**: Empty-body contracts break silently when a well-meaning handler adds a confirmation message: clients that parse every body start failing on success. Measuring the length pins the contract at zero bytes, so any future body fails loudly. The 204-versus-200-with-echo choice is a design decision worth making deliberately — this example makes it, and the capstone repeats it for cancellation.

---

### Example 24: Redirect Points at the New Path

`Redirect::permanent` answers 308 with the `Location` of the moved resource. This example retires `/v1/orders` with a pointer at `/v2/orders`, keeping the old path alive as a signpost.

Redirects version APIs without breaking old clients: the old path keeps answering, just with directions instead of data. Permanent (308) lets clients cache the move; temporary (307) suits maintenance windows — the constructor names the intent.

(Concepts: co-04.)

**`learning/code/ex-24-redirect-points-at-the-new-path/src/main.rs`**:

```rust
// Example 24: Redirect Points at the New Path.
// Redirect::permanent answers 308 with the Location of the moved resource.
use axum::{Router, body::Body, http::Request, response::Redirect, routing::get}; // => Redirect builds the 308 plus Location in one move
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => old_orders answers the retired path with a permanent redirect
async fn old_orders() -> Redirect {
    // => permanent says clients may cache this move and update bookmarks
    Redirect::permanent("/v2/orders") // => 308 plus Location: /v2/orders
} // => handler ends: the old path keeps no logic, only the pointer

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one retired route points at the new address
    Router::new().route("/v1/orders", get(old_orders)) // => GET /v1/orders moves permanently to /v2/orders
} // => constructor ends: wiring stays separate from traffic

// => check serves one redirect in-process and prints status plus location
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status and location are the two promises of a redirect
    let status = response.status(); // => keep the code plus reason before the parts move
    // => Location tells the client where the resource moved to
    let location = response.headers()["location"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => one golden line: method, old path, status, new address
    println!("{method} {uri} -> {status} location={location}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, follow the retired path to its pointer
    let app = app(); // => the service under test, built by its constructor
    // => the old path answers 308 with the new address in Location
    check(app.clone(), "GET", "/v1/orders").await; // => Output: GET /v1/orders -> 308 Permanent Redirect location=/v2/orders
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-24-redirect-points-at-the-new-path/expected/main.stdout.txt`):

```text
GET /v1/orders -> 308 Permanent Redirect location=/v2/orders
```

**Key takeaway**: `Redirect::permanent` answers 308 plus `Location`; the old path keeps the pointer, not the logic.

**Why it matters**: API versions turn over, and redirects let old clients migrate on their schedule instead of breaking on yours. Keeping the retired route as a one-line pointer — no logic, no store — makes the migration visible in code review: every remaining redirect is a version still supported. Asserting `Location` pins the target, so a typo in the new address fails in tests instead of stranding clients.

---

### Example 25: Beginner Review Routes to Responses

One order read walks the whole beginner arc: route, parse, respond. This example serves a known-id hit and an unknown-id miss through a single handler that routes the path, parses nothing beyond a string, and shapes both answers.

The review compresses the level into twelve handler lines: method routing picked the handler, `Path` delivered the id, and the tuple shaped the code plus body. The constant store stands in for the shared state the intermediate level adds next.

(Concepts: co-01, co-03, co-04.)

```mermaid
flowchart TD
    accTitle: Review arc, example 25
    accDescr: Route, parse, and respond in one handler.
    route --> parse
    parse --> hit
    parse --> miss
    hit -->|200| out
    miss -->|404| out
    route[\"route\"]:::blue
    parse[\"parse\"]:::orange
    hit[\"hit\"]:::blue
    miss[\"miss\"]:::teal
    out[\"reply\"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-25-beginner-review-routes-to-responses/src/main.rs`**:

```rust
// Example 25: Beginner Review Routes to Responses.
// one order read walks the whole beginner arc: route, parse, respond.
use axum::{Router, body::Body, extract::Path, http::{Request, StatusCode}, response::Json, routing::get}; // => Path parses the id; the tuple sets code plus body
use serde_json::{Value, json}; // => json! builds the snapshot and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => KNOWN_IDS stands in for the store the intermediate level adds
const KNOWN_IDS: [&str; 2] = ["o-1", "o-2"]; // => two ids exist; every other id misses

// => order routes the read, parses the id, and shapes the answer in one handler
async fn order(Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    // => the store lookup is a membership check while the store is still a constant
    if KNOWN_IDS.contains(&id.as_str()) { // => the two known ids hit; everything else misses
        // => the hit answers 200 with the snapshot contract
        return (StatusCode::OK, Json(json!({"id": id, "status": "placed"}))); // => the full beginner arc in one happy path
    } // => miss: fall through to the shared envelope below
    // => the miss answers 404 inside the error envelope
    (StatusCode::NOT_FOUND, Json(json!({"error": "no_order", "id": id}))) // => absence names the id that missed
} // => handler ends: routing, parsing, and shaping in twelve lines

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route carries the whole review on its back
    Router::new().route("/orders/{id}", get(order)) // => GET /orders/{id} routes, parses, and responds
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
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
    // => build once, read the hit and the miss through the full arc
    let app = app(); // => the service under test, built by its constructor
    // => the known id routes, parses, and answers 200 with its snapshot
    check(app.clone(), "GET", "/orders/o-1").await; // => Output: 200 {"id":"o-1","status":"placed"}
    // => the unknown id routes and parses, then answers 404 with the envelope
    check(app.clone(), "GET", "/orders/o-9").await; // => Output: 404 {"error":"no_order","id":"o-9"}
} // => main ends: every check printed, so the run is green
```

**Output** (`learning/code/ex-25-beginner-review-routes-to-responses/expected/main.stdout.txt`):

```text
GET /orders/o-1 -> 200 OK {"id":"o-1","status":"placed"}
GET /orders/o-9 -> 404 Not Found {"error":"no_order","id":"o-9"}
```

**Key takeaway**: One handler walks the whole arc — route, parse, shape — with the constant store standing in for shared state.

**Why it matters**: Reviews compress a level into one example that stays useful as a reference: when a later handler surprises you, this is the shape to compare against. The constant store also draws the boundary of the beginner level precisely — everything so far needed no shared state, and everything next assumes it. That seam is where the intermediate level begins.
