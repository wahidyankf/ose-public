// Example 3: Method and Path Pick the Handler.
// the same path can answer three verbs with three handlers.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get starts the chain; post and delete extend the method router
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers reads with the current collection snapshot
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"items": ["pen", "paper"]})) // => two items, always in this order
} // => handler ends: reads never change state

// => create answers writes with the 201 the method promises
async fn create() -> (axum::http::StatusCode, Json<Value>) {
    // => the tuple sets the status beside the body in one return
    (
        axum::http::StatusCode::CREATED,
        Json(json!({"created": true})),
    ) // => 201 says a resource now exists
} // => handler ends: the status is part of the contract

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => three verbs on one path, each bound to its own handler
    Router::new().route("/items", get(list).post(create).delete(|| async { "gone" })) // => method routing: verb plus path picks the handler
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => empty payload: routing needs no body here
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON or text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => an empty body still needs a visible marker, or the line ends mid-air
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => 405s carry no body, so name that fact
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check three verbs against the same path
    let app = app(); // => the service under test, built by its constructor
    // => GET reads the collection snapshot
    check(app.clone(), "GET", "/items").await; // => Output: GET /items -> 200 OK {"items":["pen","paper"]}
    // => POST writes and answers 201 beside its body
    check(app.clone(), "POST", "/items").await; // => Output: POST /items -> 201 Created {"created":true}
    // => PUT is bound to no handler, so routing answers 405 with no body
    check(app.clone(), "PUT", "/items").await; // => Output: PUT /items -> 405 Method Not Allowed (empty body)
} // => main ends: every check printed, so the run is green
