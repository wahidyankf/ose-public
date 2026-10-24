// Example 13: Headers Carry Request Metadata.
// HeaderMap reads raw headers the typed extractors do not own.
use axum::{
    Router,
    body::Body,
    http::{HeaderMap, Request},
    response::Json,
    routing::get,
}; // => HeaderMap is the raw multi-map behind every typed header
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => whoami echoes the caller identity the headers carried in
async fn whoami(headers: HeaderMap) -> Json<Value> {
    // => get reads one header; to_str keeps the value printable
    let caller = headers
        .get("x-user")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("anonymous"); // => missing header means an unnamed caller, not an error
    // => the echo proves which metadata the handler actually saw
    Json(json!({"caller": caller})) // => named callers echo back; strangers read anonymous
} // => handler ends: metadata travels beside the body, never inside it

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns identity; the headers ride along for free
    Router::new().route("/whoami", get(whoami)) // => GET /whoami echoes the x-user header
} // => constructor ends: wiring stays separate from traffic

// => check serves one header call in-process and prints its status line
async fn check(app: Router, uri: &str, user: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri(uri); // => path first; the header follows when present
    // => Some carries the identity under test; None sends no header at all
    if let Some(name) = user {
        builder = builder.header("x-user", name);
    } // => the header rides beside the empty GET body
    // => an empty body keeps the call a pure metadata probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the echoed caller
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => identity always echoes something, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per call: the sent identity plus the echoed reply
    println!(
        "GET {uri} x-user={} -> {status} {shown}",
        user.unwrap_or("(none)")
    ); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, probe with and without the identity header
    let app = app(); // => the service under test, built by its constructor
    // => the named caller echoes back by name
    check(app.clone(), "/whoami", Some("ada")).await; // => Output: {"caller":"ada"}
    // => no header means the anonymous fallback, still 200
    check(app.clone(), "/whoami", None).await; // => Output: {"caller":"anonymous"}
} // => main ends: every check printed, so the run is green
