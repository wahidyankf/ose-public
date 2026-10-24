// Kata 02 starter: the sum runs inline on the async runtime. It answers, but
// blocks every other task while adding. TODO: move blocking_sum into
// tokio::task::spawn_blocking and await its handle instead.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the sum the pool must compute
use serde_json::{Value, json}; // => json! builds the sum reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => BLOCK_N sizes the busywork: big enough to matter, small enough to stay fast
const BLOCK_N: u64 = 1_000_000; // => one million additions finish in milliseconds

// => blocking_sum adds 1 through N on the calling thread: TODO moves it aside
fn blocking_sum() -> u64 {
    // => a plain loop stands in for hashing, parsing, or image work
    (1..=BLOCK_N).sum() // => 500000500000: the answer the pool hop must preserve
} // => function ends: sync code, honest name, wrong thread for now

// => sum answers the total: TODO awaits spawn_blocking instead of calling inline
async fn sum() -> Json<Value> {
    // => TODO: replace this inline call with spawn_blocking(blocking_sum).await
    let total = blocking_sum(); // => inline today: the runtime stalls for milliseconds
    // => the reply proves the total; the kata preserves it across the move
    Json(json!({"sum": total})) // => 500000500000 before and after the kata
} // => handler ends: the answer is right, the thread is wrong

// => app builds the service once; the kata reuses this constructor
fn app() -> Router {
    // => one route owns the sum; the pool hop joins it when written
    Router::new().route("/sum", get(sum)) // => GET /sum answers the total either way
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, sum once through the inline call the kata moves aside
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/sum")
        .body(Body::empty())
        .unwrap(); // => the pinned call the kata preserves
    // => oneshot runs the inline sum against the live runtime
    let response = app.oneshot(request).await.unwrap(); // => TODO: the pool hop answers identically below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the kata preserves while moving threads
    println!("GET /sum -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when spawn_blocking prints this
} // => main ends: the kata is done when todo is gone
