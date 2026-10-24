// Example 30: Timeout Bounds a Slow Handler.
// TimeoutLayer answers 408 when the handler outruns its budget.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => get binds two routes: one fast, one deliberately slow
use serde_json::{Value, json}; // => json! builds the fast body inline
use std::time::Duration; // => Duration names the 50ms budget without any clock read
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
    Router::new()
        .route("/fast", get(fast))
        .route("/slow", get(slow))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_millis(50),
        )) // => 50ms: fast passes, slow trips with 408
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: timeout bodies are empty
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the 408 leg carries no body, so the marker names that fact
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => fast prints JSON, slow prints the marker
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
