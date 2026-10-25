// Example 71: Routing Axum Macros Versus Decorators.
// axum binds verb plus path with routing::get; FastAPI decorates a function.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get opens the chain; post chains beside it below
use serde_json::{Value, json}; // => json! builds each reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers reads: the GET leg of the verb-plus-path pair
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"orders": ["o-1"]})) // => the read contract both frameworks promise
} // => handler ends: reads never change state in either framework

// => create answers writes: the POST leg beside the GET leg
async fn create() -> (axum::http::StatusCode, Json<Value>) {
    // => the tuple sets the status beside the body in one return
    (
        axum::http::StatusCode::CREATED,
        Json(json!({"created": true})),
    ) // => 201 says a resource now exists
} // => handler ends: the status is part of the contract here

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => method routing: verb plus path picks the handler, in code not comments
    Router::new().route("/orders", get(list).post(create)) // => one path, two verbs, two plain functions
} // => constructor ends: no decorator, no registry, just values

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => empty payload: routing needs no body here
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries each leg's reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both legs write a body here, so the marker stays unused
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
    // => build once, drive both verbs against the one path
    let app = app(); // => the service under test, built by its constructor
    // => GET reads the collection through method routing
    check(app.clone(), "GET", "/orders").await; // => Output: GET /orders -> 200 OK {"orders":["o-1"]}
    // => POST writes through the same path with a different verb
    check(app.clone(), "POST", "/orders").await; // => Output: POST /orders -> 201 Created {"created":true}
} // => main ends: every check printed, so the run is green
