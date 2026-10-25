// Kata 03 solution: the probe holds beside the listing with its own asserts.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds both routes; both hold below
use serde_json::{Value, json}; // => json! builds both replies inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers the covered route: its test already holds below
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the covered output golden
    Json(json!({"orders": ["o-1"]})) // => covered: the existing check pins this body
} // => handler ends: this route is done, the probe joins it now

// => ready answers the probe the new test pins to the wall
async fn ready() -> Json<Value> {
    // => the probe body the holds line pins: exact bytes, asserted, printed
    Json(json!({"ready": true})) // => pinned: the new check asserts these exact bytes
} // => handler ends: the route existed, now its test exists too

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => two routes share one router: both covered after this kata
    Router::new()
        .route("/orders", get(list))
        .route("/readyz", get(ready)) // => the probe stands beside the listing in the suite
} // => constructor ends: wiring stays separate from traffic

// => check serves one suite leg, asserts status plus body, prints the hold line
async fn check(app: Router, uri: &str, want_body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri(uri)
        .body(Body::empty())
        .unwrap(); // => one suite leg as a live request
    // => oneshot runs routing and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with the leg shown
    assert_eq!(String::from_utf8_lossy(&bytes), want_body, "leg {uri}"); // => want_body or red: the proof is exact
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET {uri} -> 200 {want_body}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold both legs through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the listing leg holds its snapshot beside the probe
    check(app.clone(), "/orders", r#"{"orders":["o-1"]}"#).await; // => Output: holds the listing leg
    // => the probe leg holds its body: the kata's new coverage
    check(app.clone(), "/readyz", r#"{"ready":true}"#).await; // => Output: holds the probe leg
} // => main ends: asserts green and printed, so the run is green
