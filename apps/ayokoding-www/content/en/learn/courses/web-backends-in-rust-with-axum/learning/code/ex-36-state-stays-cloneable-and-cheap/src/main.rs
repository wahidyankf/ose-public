// Example 36: State Stays Cloneable and Cheap.
// cloning state clones the Arc pointer, never the data behind it.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks one cheap clone per handler call
use serde_json::{Value, json}; // => json! builds the count reply inline
use std::sync::{Arc, Mutex}; // => Arc shares the store; strong_count proves the sharing
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
    let state = AppState {
        orders: Arc::new(Mutex::new(vec!["o-1".to_owned()])),
    }; // => one order; the count is about holders, not rows
    // => with_state moves the value into the router; handlers unpack clones
    Router::new()
        .route("/holders", get(holders))
        .with_state(state) // => one store, every call, zero globals
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the count always writes a body here, so the marker stays unused
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
    // => build once, read the holder count through the shared state
    let app = app(); // => the service under test, built by its constructor
    // => router plus per-call clone: a small fixed holder count, never the data size
    check(app.clone(), "GET", "/holders").await; // => Output: 200 with the fixed holder count
} // => main ends: every check printed, so the run is green
