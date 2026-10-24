// Example 25: Beginner Review Routes to Responses.
// one order read walks the whole beginner arc: route, parse, respond.
use axum::{
    Router,
    body::Body,
    extract::Path,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => Path parses the id; the tuple sets code plus body
use serde_json::{Value, json}; // => json! builds the snapshot and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => KNOWN_IDS stands in for the store the intermediate level adds
const KNOWN_IDS: [&str; 2] = ["o-1", "o-2"]; // => two ids exist; every other id misses

// => order routes the read, parses the id, and shapes the answer in one handler
async fn order(Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    // => the store lookup is a membership check while the store is still a constant
    if KNOWN_IDS.contains(&id.as_str()) {
        // => the two known ids hit; everything else misses
        // => the hit answers 200 with the snapshot contract
        return (StatusCode::OK, Json(json!({"id": id, "status": "placed"}))); // => the full beginner arc in one happy path
    } // => miss: fall through to the shared envelope below
    // => the miss answers 404 inside the error envelope
    (
        StatusCode::NOT_FOUND,
        Json(json!({"error": "no_order", "id": id})),
    ) // => absence names the id that missed
} // => handler ends: routing, parsing, and shaping in twelve lines

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route carries the whole review on its back
    Router::new().route("/orders/{id}", get(order)) // => GET /orders/{id} routes, parses, and responds
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
    // => build once, read the hit and the miss through the full arc
    let app = app(); // => the service under test, built by its constructor
    // => the known id routes, parses, and answers 200 with its snapshot
    check(app.clone(), "GET", "/orders/o-1").await; // => Output: 200 {"id":"o-1","status":"placed"}
    // => the unknown id routes and parses, then answers 404 with the envelope
    check(app.clone(), "GET", "/orders/o-9").await; // => Output: 404 {"error":"no_order","id":"o-9"}
} // => main ends: every check printed, so the run is green
