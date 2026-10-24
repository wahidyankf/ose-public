// Example 33: Fallback Handles Unknown Routes.
// fallback with a Uri extractor names the missed path in the envelope.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode, Uri},
    response::Json,
    routing::get,
}; // => Uri names the missed path inside the fallback
use serde_json::{Value, json}; // => json! builds the snapshot and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ok answers the one real route, so the fallback is not the whole story
async fn ok() -> Json<Value> {
    // => a fixed body keeps the happy path golden
    Json(json!({"ok": true})) // => true means the route exists and ran
} // => handler ends: known paths never reach the fallback

// => missing names the unclaimed path inside the shared envelope
async fn missing(uri: Uri) -> (StatusCode, Json<Value>) {
    // => Uri arrives as an extractor: the exact path nobody routed
    (
        StatusCode::NOT_FOUND,
        Json(json!({"error": "no_route", "path": uri.path()})),
    ) // => 404 plus the path that missed
} // => handler ends: absence is a designed response with the evidence attached

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
    // => oneshot runs routing and the fallback exactly as live
    let response = app.oneshot(request).await.unwrap(); // => misses land in the fallback with their path
    // => status names what happened; the body carries snapshot or envelope
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
    // => build once, hit the route and two misses through the fallback
    let app = app(); // => the service under test, built by its constructor
    // => the known route answers 200 and never sees the fallback
    check(app.clone(), "GET", "/ok").await; // => Output: GET /ok -> 200 OK {"ok":true}
    // => the first miss lands in the fallback with its path echoed
    check(app.clone(), "GET", "/nope").await; // => Output: 404 {"error":"no_route","path":"/nope"}
    // => a nested miss echoes its full path, proving Uri carries everything
    check(app.clone(), "GET", "/orders/o-9/lines").await; // => Output: 404 {"error":"no_route","path":"/orders/o-9/lines"}
} // => main ends: every check printed, so the run is green
