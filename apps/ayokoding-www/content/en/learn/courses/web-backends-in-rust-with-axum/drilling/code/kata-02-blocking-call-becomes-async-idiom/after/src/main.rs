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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the total is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the sum always writes a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
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
