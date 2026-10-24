// Example 4: Unknown Path Falls Back to 404.
// a fallback handler answers every route nothing else claimed.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode, Uri},
    response::Json,
    routing::get,
}; // => Uri names the missed path; StatusCode names the answer
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ok answers the one real route, so the fallback is not the whole story
async fn ok() -> Json<Value> {
    // => a fixed body keeps the happy path golden
    Json(json!({"ok": true})) // => true means the route exists and ran
} // => handler ends: known paths never reach the fallback

// => missing answers every unclaimed path with one shared envelope
async fn missing(uri: Uri) -> (StatusCode, Json<Value>) {
    // => Uri arrives as an extractor: the path nobody routed
    (
        StatusCode::NOT_FOUND,
        Json(json!({"error": "no_route", "path": uri.path()})),
    ) // => 404 plus the path that missed, in the error shape
} // => handler ends: absence is a designed response, not an accident

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => fallback runs only when no route matches: the safety net, not a route
    Router::new().route("/ok", get(ok)).fallback(missing) // => one real route plus the net underneath
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
    // => fallbacks always write a body here, so the marker stays unused
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
    // => build once, check the route and the net below it
    let app = app(); // => the service under test, built by its constructor
    // => the known route answers 200 and never sees the fallback
    check(app.clone(), "GET", "/ok").await; // => Output: GET /ok -> 200 OK {"ok":true}
    // => the unknown path lands in the fallback with its own name echoed
    check(app.clone(), "GET", "/missing").await; // => Output: GET /missing -> 404 Not Found {"error":"no_route","path":"/missing"}
} // => main ends: every check printed, so the run is green
