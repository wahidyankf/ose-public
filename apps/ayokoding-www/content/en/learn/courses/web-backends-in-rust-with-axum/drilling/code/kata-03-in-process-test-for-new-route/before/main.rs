// Kata 03 starter: the /readyz probe exists but no test drives it. The listing
// below is covered; the probe is not. TODO: add a check that calls /readyz
// in-process, asserts 200 plus the exact body, and prints the hold line.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds both routes; the probe still needs its test
use serde_json::{Value, json}; // => json! builds both replies inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list answers the covered route: its test already holds below
async fn list() -> Json<Value> {
    // => a fixed snapshot keeps the covered output golden
    Json(json!({"orders": ["o-1"]})) // => covered: the existing check pins this body
} // => handler ends: this route is done, the probe is the kata

// => ready answers the uncovered probe: TODO pins it with a holds line
async fn ready() -> Json<Value> {
    // => the probe body the kata must pin: exact bytes, asserted, printed
    Json(json!({"ready": true})) // => TODO: assert 200 plus these exact bytes
} // => handler ends: the route exists, its test does not yet

// => app builds the service once; the kata reuses this constructor
fn app() -> Router {
    // => two routes share one router: one covered, one waiting for its test
    Router::new()
        .route("/orders", get(list))
        .route("/readyz", get(ready)) // => the probe joins the suite when written
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold the covered route while the probe waits
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/orders")
        .body(Body::empty())
        .unwrap(); // => the covered call the kata keeps
    // => oneshot runs the covered route exactly as live
    let response = app.oneshot(request).await.unwrap(); // => TODO: a second oneshot must cover /readyz
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: the covered route holds while the probe still needs its test
    println!(
        "holds GET /orders -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ); // => the kata is done when /readyz holds beside it
} // => main ends: the kata is done when todo is gone
