// Example 29: Request Id Travels End to End.
// middleware stamps every request with a counter id the handler echoes.
use axum::{
    Extension, Router,
    body::Body,
    http::Request,
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
}; // => Extension carries the stamped id from layer to handler
use serde_json::{Value, json}; // => json! builds the echo reply inline
use std::sync::{
    Arc,
    atomic::{AtomicU64, Ordering},
}; // => Arc shares the counter; AtomicU64 stamps without a lock
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => stamp hands every request the next id and shares it downstream
async fn stamp(
    state: axum::extract::State<Arc<AtomicU64>>,
    mut req: Request<Body>,
    next: Next,
) -> Response {
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
    Router::new()
        .route("/hello", get(hello))
        .layer(middleware::from_fn_with_state(counter, stamp)) // => no router state needed: the layer carries its own clone
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every call echoes its id, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
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
