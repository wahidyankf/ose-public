// Example 52: Test Reads the Golden Contract.
// the test pins exact bytes: any drift in key order or spacing turns red.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the read the golden pins down
use serde_json::json; // => json! builds the snapshot with pinned key order
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => GOLDEN is the exact body the contract promises, byte for byte
const GOLDEN: &str = r#"{"healthy":true,"service":"orders","version":2}"#; // => key order and spacing are part of the promise

// => contract answers the snapshot the golden pins to the wall
async fn contract() -> Json<serde_json::Value> {
    // => serde_json sorts keys by default, so the golden pins sorted order
    Json(json!({"healthy": true, "service": "orders", "version": 2})) // => change any key and the assert below turns red
} // => handler ends: the golden owns this body's shape

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the contract; the golden guards it below
    Router::new().route("/contract", get(contract)) // => GET /contract answers the pinned snapshot
} // => constructor ends: wiring stays separate from traffic

// => check serves the contract call, asserts exact bytes, prints the hold line
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/contract")
        .body(Body::empty())
        .unwrap(); // => the pinned call: method, path, empty body
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the golden assert pins the bytes: spacing and order included
    assert_eq!(bytes.as_ref(), GOLDEN.as_bytes(), "golden drift"); // => drift or red: the message says the contract moved
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET /contract -> 200 {GOLDEN}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold the golden contract through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the holds line prints only because the bytes matched exactly
    check(app.clone()).await; // => Output: holds GET /contract -> 200 with the golden bytes
} // => main ends: asserts green and printed, so the run is green
