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
    let request = Request::builder()
        .method("GET")
        .uri("/hello")
        .body(Body::empty())
        .unwrap(); // => oneshot needs a request, not a connection
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the service answered at all
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the greeting is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: the technique and its proof together
    println!("oneshot GET /hello -> {status} {text}"); // => no port was bound, chosen, or printed anywhere
} // => main ends: the socketless test printed, so the run is green
