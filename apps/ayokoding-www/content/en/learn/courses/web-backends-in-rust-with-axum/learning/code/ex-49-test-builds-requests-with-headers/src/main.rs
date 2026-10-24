// Example 49: Test Builds Requests with Headers.
// the header-setting helper covers auth, content types, and negotiation.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the read the header matrix probes
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => whoami echoes the two headers the matrix varies: identity and format
async fn whoami(headers: axum::http::HeaderMap) -> Json<Value> {
    // => each header falls back to its default when the matrix omits it
    let caller = headers
        .get("x-user")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("guest"); // => guest means the matrix sent no identity
    // => format echoes the raw Accept value so the matrix sees what arrived
    let format = headers
        .get("accept")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("default"); // => default means the matrix sent no Accept
    // => the echo proves exactly which headers reached the handler
    Json(json!({"caller": caller, "format": format})) // => two headers in, two echoes out
} // => handler ends: no header parsing lives anywhere else

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns identity-plus-format; the matrix varies both
    Router::new().route("/whoami", get(whoami)) // => GET /whoami echoes its two headers
} // => constructor ends: wiring stays separate from traffic

// => check serves one header matrix row and prints its status line
async fn check(app: Router, user: Option<&str>, accept: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/whoami"); // => path first; the matrix headers follow when present
    // => Some carries the identity under test; None sends no identity header
    if let Some(name) = user {
        builder = builder.header("x-user", name);
    } // => the identity leg of the matrix
    // => Some carries the format under test; None sends no Accept header
    if let Some(format) = accept {
        builder = builder.header("accept", format);
    } // => the negotiation leg of the matrix
    // => an empty body keeps the call a pure header probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries the header echo
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: echoes are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every matrix row echoes something, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per matrix row: sent headers plus the echo
    println!(
        "GET /whoami x-user={} accept={} -> {status} {shown}",
        user.unwrap_or("(none)"),
        accept.unwrap_or("(none)")
    ); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, walk the header matrix row by row
    let app = app(); // => the service under test, built by its constructor
    // => both headers set: the echo carries both values
    check(app.clone(), Some("ada"), Some("application/json")).await; // => Output: both echoes named
    // => identity only: format falls back to its default
    check(app.clone(), Some("ada"), None).await; // => Output: caller ada, format default
    // => neither header: both fallbacks apply, still 200
    check(app.clone(), None, None).await; // => Output: caller guest, format default
} // => main ends: every check printed, so the run is green
