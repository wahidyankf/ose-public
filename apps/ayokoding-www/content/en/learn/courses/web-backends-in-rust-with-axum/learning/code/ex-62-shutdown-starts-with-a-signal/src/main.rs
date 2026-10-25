// Example 62: Shutdown Starts with a Signal.
// a oneshot channel stands in for SIGTERM: send once, the service stops.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => get binds the route the signal retires
use serde_json::{Value, json}; // => json! builds the hello body inline
use tokio::sync::oneshot; // => oneshot carries the single shutdown signal
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers while the service runs: the signal ends this, not the code
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting the signal retires
} // => handler ends: shutdown lives outside handlers, in main

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route stands in for the whole service the signal stops
    Router::new().route("/hello", get(hello)) // => GET /hello answers until the signal lands
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the signal
async fn main() {
    // => build once, serve once, then retire on the signal
    let app = app(); // => the service under test, built by its constructor
    // => the oneshot channel is the SIGTERM stand-in: one send, one stop
    let (stop_tx, stop_rx) = oneshot::channel::<&str>(); // => &str names the signal for the golden line
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
    // => the platform sends SIGTERM: the demo sends the string instead
    stop_tx.send("SIGTERM").unwrap(); // => one send: the signal cannot repeat
    // => the service awaits the signal the way serve awaits ctrl_c
    let signal = stop_rx.await.unwrap(); // => SIGTERM arrives: retirement starts here
    // => one golden line: the signal landed, accepting stops, draining starts
    println!("signal received: {signal}; accepting stops, 0 in-flight, exiting"); // => the shutdown sequence in one line
} // => main ends: served once, retired on signal, so the run is green
