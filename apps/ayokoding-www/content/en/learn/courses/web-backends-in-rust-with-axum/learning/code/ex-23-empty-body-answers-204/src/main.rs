// Example 23: Empty Body Answers 204.
// DELETE succeeds with no content: the status alone is the answer.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    routing::delete,
}; // => delete binds DELETE; NO_CONTENT names 204 with no body
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => cancel answers the delete that hits: 204 with no body at all
async fn cancel() -> StatusCode {
    // => NO_CONTENT means the delete worked and nothing follows
    StatusCode::NO_CONTENT // => the status alone is the whole response
} // => handler ends: one line, zero bytes, full meaning

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one DELETE route owns cancellation; the status is its contract
    Router::new().route("/orders/o-1", delete(cancel)) // => DELETE /orders/o-1 answers 204 with no body
} // => constructor ends: wiring stays separate from traffic

// => check serves one delete in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => DELETE carries no payload here
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status is the whole answer here; the body must stay empty
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the body to prove it holds zero bytes
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the length proves emptiness better than any marker could
    println!("{method} {uri} -> {status} body_len={}", bytes.len()); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, delete the one order the demo knows
    let app = app(); // => the service under test, built by its constructor
    // => the delete answers 204 with zero body bytes
    check(app.clone(), "DELETE", "/orders/o-1").await; // => Output: DELETE /orders/o-1 -> 204 No Content body_len=0
} // => main ends: every check printed, so the run is green
