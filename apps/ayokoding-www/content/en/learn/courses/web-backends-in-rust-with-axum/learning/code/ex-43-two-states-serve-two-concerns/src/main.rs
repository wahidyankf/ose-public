// Example 43: Two States Serve Two Concerns.
// nest with_state: each sub-router keeps its own state kind past the join.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => nest joins two state-carrying routers below one root
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{Arc, Mutex}; // => Arc shares the orders; Mutex guards the vector
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
    let order_routes = Router::new()
        .route("/orders", get(orders))
        .with_state(Orders {
            ids: Arc::new(Mutex::new(vec!["o-1".to_owned()])),
        }); // => business paths with business state
    // => the probe router carries the operations state past the join
    let probe_routes = Router::new()
        .route("/healthz", get(probe))
        .with_state(Metrics { probe_calls: 0 }); // => probe paths with operations state
    // => nest joins each router below its own prefix with its own state intact
    Router::new()
        .nest("/api", order_routes)
        .nest("/ops", probe_routes) // => /api/orders and /ops/healthz, two states, one service
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both concerns write a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
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
