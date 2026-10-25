// Example 48: Test Drives the Error Paths.
// a table of method plus path plus wanted status proves every failure leg.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get opens the chain; the post leg chains on below
use serde_json::{Value, json}; // => json! builds the snapshot the happy leg asserts
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => order answers the one snapshot the table's happy row pins down
async fn order() -> Json<Value> {
    // => a fixed snapshot keeps the happy row golden without any store
    Json(json!({"id": "o-1"})) // => the contract the 200 row repeats
} // => handler ends: change this body and the happy assert turns red

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => GET reads, POST writes: the table below pins both plus the two misses
    Router::new().route(
        "/orders/o-1",
        get(order).post(|| async { Json(json!({"created": true})) }),
    ) // => one path, two verbs, four table rows
} // => constructor ends: wiring stays separate from traffic

// => check serves one table row, asserts its status, then prints the hold line
async fn check(app: Router, method: &str, uri: &str, want: u16) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method(method)
        .uri(uri)
        .body(Body::empty())
        .unwrap(); // => one table row as a live request
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the row: a wrong code panics with the row shown
    assert_eq!(response.status().as_u16(), want, "row {method} {uri}"); // => want or red: the message names the failing row
    // => holds prints only after the assert passed: the proof, in one line
    println!("holds {method} {uri} -> {want}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, walk the table row by row through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the table: every leg the service promises, with its wanted status
    let table = [
        ("GET", "/orders/o-1", 200),
        ("POST", "/orders/o-1", 200),
        ("PUT", "/orders/o-1", 405),
        ("GET", "/orders/o-9", 404),
    ]; // => happy legs plus method miss plus path miss
    // => each row runs the same check: the table is the test plan
    for (method, uri, want) in table {
        // => four rows, four holds lines, zero sockets
        // => clone per row: oneshot consumes the router every call
        check(app.clone(), method, uri, want).await; // => Output: holds METHOD path -> status per row
    } // => loop ends: every table row held, so the run is green
} // => main ends: asserts green and printed, so the run is green
