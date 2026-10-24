// Example 15: Typed Path Rejects a Bad Id.
// Path<u32> turns a malformed id into a 400 before any logic runs.
use axum::{Router, body::Body, extract::Path, http::Request, response::Json, routing::get}; // => Path parses the segment into u32 before the handler runs
use serde_json::{Value, json}; // => json! builds the order snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => order answers one order read: the id arrives already parsed
async fn order(Path(id): Path<u32>) -> Json<Value> {
    // => u32 already ruled out negatives, words, and empties at the boundary
    Json(json!({"id": id, "status": "placed"})) // => the snapshot contract: id plus its fixed status
} // => handler ends: no parsing code lives inside business logic

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => :id marks the segment axum parses into the Path argument
    Router::new().route("/orders/{id}", get(order)) // => axum 0.8 spells captures with single braces
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
    // => status names what happened; the body carries snapshot or message
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: rejection bodies are framework text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
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
    // => build once, read one good id and one word
    let app = app(); // => the service under test, built by its constructor
    // => a numeric segment parses into u32 and reaches the handler
    check(app.clone(), "GET", "/orders/7").await; // => Output: GET /orders/7 -> 200 OK {"id":7,"status":"placed"}
    // => a word segment fails parsing: 400 with the deterministic message
    check(app.clone(), "GET", "/orders/abc").await; // => Output: a 400 naming the parse failure
} // => main ends: every check printed, so the run is green
