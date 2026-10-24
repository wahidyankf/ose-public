// Example 47: Test Asserts Status and Body.
// assert_eq inside the binary turns prints into proof: mismatch panics red.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the read the assertions pin down
use serde_json::{Value, json}; // => json! builds the snapshot the assertions compare
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => order answers the one snapshot the assertions below pin to the wall
async fn order() -> Json<Value> {
    // => a fixed snapshot keeps the assertions golden without any store
    Json(json!({"id": "o-1", "status": "placed"})) // => the contract every assert repeats
} // => handler ends: change this body and the asserts turn red

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the snapshot; the assertions guard it below
    Router::new().route("/orders/o-1", get(order)) // => GET /orders/o-1 answers the pinned snapshot
} // => constructor ends: wiring stays separate from traffic

// => check serves one request, asserts both halves, then prints the hold line
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/orders/o-1")
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
    // => the body assert pins the bytes: any drift panics with both sides shown
    assert_eq!(
        bytes.as_ref(),
        br#"{"id":"o-1","status":"placed"}"#.as_slice()
    ); // => exact bytes: key order and spacing included
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET /orders/o-1 -> 200 {{\"id\":\"o-1\",\"status\":\"placed\"}}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, assert the pinned snapshot through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the holds line prints only because both asserts passed above
    check(app.clone()).await; // => Output: holds GET /orders/o-1 -> 200 with the pinned body
} // => main ends: asserts green and printed, so the run is green
