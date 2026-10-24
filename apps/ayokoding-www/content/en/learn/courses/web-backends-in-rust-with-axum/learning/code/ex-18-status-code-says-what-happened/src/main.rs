// Example 18: Status Code Says What Happened.
// the tuple return sets the code beside the body in one move.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => StatusCode names each answer; the tuple carries code plus body
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
    Router::new()
        .route("/found", get(found))
        .route("/missing", get(missing)) // => hit and miss live one router apart
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both codes write a body here, so the marker stays unused
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
    // => build once, read the hit and the miss
    let app = app(); // => the service under test, built by its constructor
    // => the hit answers 200 with the snapshot
    check(app.clone(), "GET", "/found").await; // => Output: GET /found -> 200 OK {"id":"o-1"}
    // => the miss answers 404 with the shared envelope
    check(app.clone(), "GET", "/missing").await; // => Output: GET /missing -> 404 Not Found {"error":"no_order"}
} // => main ends: every check printed, so the run is green
