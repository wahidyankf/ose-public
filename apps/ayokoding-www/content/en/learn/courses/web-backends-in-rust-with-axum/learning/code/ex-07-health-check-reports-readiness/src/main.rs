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
    Router::new()
        .route("/healthz", get(health))
        .route("/readyz", get(ready)) // => two probes, two jobs, one router
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
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => probes always write a body here, so the marker stays unused
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
    // => build once, check both probes in-process
    let app = app(); // => the service under test, built by its constructor
    // => liveness answers ok while the process runs
    check(app.clone(), "GET", "/healthz").await; // => Output: GET /healthz -> 200 OK {"status":"ok"}
    // => readiness answers true while the service takes traffic
    check(app.clone(), "GET", "/readyz").await; // => Output: GET /readyz -> 200 OK {"ready":true}
} // => main ends: every check printed, so the run is green
