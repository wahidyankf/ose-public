// Kata 08 solution: the drain races a 50ms deadline; the exit stays on time.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the route the deadline demo circles
use serde_json::{Value, json}; // => json! builds the hello body inline
use std::time::Duration; // => Duration names the 50ms deadline without any clock read
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

// => stuck pretends to be the drain that never finishes: SIGTERM cannot wait forever
async fn stuck() -> &'static str {
    // => five seconds of sleep stands in for the wedged connection
    tokio::time::sleep(Duration::from_secs(5)).await; // => dropped on deadline: the sleep never finishes
    // => unreachable under the 50ms deadline: timeout abandons this first
    "stuck finished" // => this line never prints in the golden output
} // => stuck ends: the deadline owns it, not the other way around

#[tokio::main] // => the async runtime drives the deadline demo
async fn main() {
    // => build once, serve once, then retire against the deadline
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
    // => the signal lands with a 50ms deadline: the drain must finish or be abandoned
    println!("signal received: SIGTERM; draining with a 50ms deadline"); // => golden line: retirement starts against the clock
    // => timeout races the stuck drain against the deadline
    match tokio::time::timeout(Duration::from_millis(50), stuck()).await {
        // => Ok means drained in time; Err means the deadline won
        // => drained in time: unreachable here, kept for the honest shape
        Ok(done) => println!("drained in time: {done}"), // => this arm never prints in the golden output
        // => the deadline won: one task abandoned, the exit stays on time
        Err(_) => println!("deadline hit: 1 task abandoned; exiting on time"), // => golden line: bounded retirement, no hang
    } // => match ends: either way the exit is prompt and printed
} // => main ends: served once, bounded once, so the run is green
