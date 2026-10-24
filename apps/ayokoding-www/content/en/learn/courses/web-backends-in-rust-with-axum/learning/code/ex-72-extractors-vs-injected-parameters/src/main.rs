// Example 72: Extractors Versus Injected Parameters.
// axum parses at the boundary into typed values; FastAPI injects annotated params.
use axum::{
    Router,
    body::Body,
    extract::{Path, Query},
    http::Request,
    response::Json,
    routing::get,
}; // => Path and Query parse before the handler runs
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON or text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every leg writes a body here, so the marker stays unused
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
    // => build once, parse the full call and the default call
    let app = app(); // => the service under test, built by its constructor
    // => id plus limit both parse: the echo carries both values
    check(app.clone(), "GET", "/orders/7?limit=3").await; // => Output: 200 {"id":7,"limit":3}
    // => limit omitted: the handler default of ten applies
    check(app.clone(), "GET", "/orders/7").await; // => Output: 200 {"id":7,"limit":10}
} // => main ends: every check printed, so the run is green
