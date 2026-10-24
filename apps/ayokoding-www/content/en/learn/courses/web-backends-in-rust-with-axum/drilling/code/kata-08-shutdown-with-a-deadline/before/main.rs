// Kata 08 starter: the signal waits out the stuck drain with no bound. A wedged
// connection hangs retirement forever. TODO: wrap the drain in
// tokio::time::timeout with a 50ms deadline, print whether the drain finished
// or the deadline abandoned it, and exit on time either way.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the route the deadline demo circles
use serde_json::{Value, json}; // => json! builds the hello body inline
use std::time::Duration; // => Duration names the deadline the kata adds
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers the single route the deadline demo serves before retiring
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting the deadline retires
} // => handler ends: the deadline lives outside handlers, in main

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route stands in for the whole service the deadline stops
    Router::new().route("/hello", get(hello)) // => GET /hello answers until retirement
} // => constructor ends: wiring stays separate from traffic

// => stuck pretends to be the drain that never finishes: TODO bounds it
async fn stuck() -> &'static str {
    // => five seconds of sleep stands in for the wedged connection
    tokio::time::sleep(Duration::from_secs(5)).await; // => TODO: timeout drops this after 50ms
    // => unreachable once the deadline lands: the kata abandons this first
    "stuck finished" // => this line never prints after the kata
} // => stuck ends: the deadline owns it, not the other way around

#[tokio::main] // => the async runtime drives the deadline demo
async fn main() {
    // => build once, serve once, then retire against the unbounded drain
    let app = app(); // => the service under test, built by its constructor
    // => one live call proves the service answers before the signal
    let request = Request::builder()
        .method("GET")
        .uri("/hello")
        .body(Body::empty())
        .unwrap(); // => the last call before retirement
    // => the request drives the live service in-process, without any socket
    let response = app.oneshot(request).await.unwrap(); // => 200: the service is up
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line: the service answered before the signal
    println!(
        "before signal -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ); // => 200 with the greeting: up, then retiring
    // => the signal lands: TODO races the drain against the 50ms deadline
    println!("signal received: SIGTERM; draining (no deadline yet)"); // => TODO: this line names the 50ms deadline
    // => TODO: match timeout(50ms, stuck()).await { Ok => drained, Err => abandoned }
    let done = stuck().await; // => unbounded today: the kata bounds this await
    // => one line: today's unbounded answer the deadline replaces
    println!("drained: {done}"); // => the kata is done when the deadline prints instead
} // => main ends: the kata is done when todo is gone
