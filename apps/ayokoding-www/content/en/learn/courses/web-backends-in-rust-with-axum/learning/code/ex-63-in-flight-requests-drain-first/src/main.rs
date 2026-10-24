// Example 63: In-Flight Requests Drain First.
// three spawned calls finish before retirement: shutdown waits, never drops.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Clone lets every in-flight call own the router it drives
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers every in-flight call with the same fixed greeting
async fn hello() -> Json<Value> {
    // => no state, no lock: the handler is trivially safe under shutdown load
    Json(json!({"message": "hello, axum"})) // => three in-flight calls hear the same greeting
} // => handler ends: draining means letting these finish, not killing them

// => app builds the service once; every in-flight call reuses this constructor
fn app() -> Router {
    // => Clone on Router shares the routes: in-flight calls never rebuild wiring
    Router::new().route("/hello", get(hello)) // => one route, three in-flight drivers
} // => constructor ends: wiring stays separate from traffic

// => call drives one in-flight request and returns its greeting line
async fn call(app: Router, n: usize) -> String {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/hello")
        .body(Body::empty())
        .unwrap(); // => the same call every in-flight task makes
    // => oneshot runs routing and handlers exactly as live, on this task
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the line carries the task number so the sort below orders the goldens
    format!(
        "in-flight-{n} finished -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ) // => returned, not printed: the drain prints below
} // => call ends: one line per in-flight task, order decided by the collector

#[tokio::main] // => the multithread runtime runs the in-flight calls at once
async fn main() {
    // => build once, launch three in-flight calls, then retire around them
    let app = app(); // => the service under test, built by its constructor
    // => spawn three in-flight calls before the signal lands
    let mut tasks = Vec::new(); // => the drain handles gather here
    // => three tasks stand in for three requests mid-flight at SIGTERM
    for n in 1..=3 {
        // => in-flight 1 through 3, in spawn order
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes are shared, not copied
        // => spawn runs the call on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { call(router, n).await })); // => three futures racing the signal
    } // => spawn loop ends: three calls are in flight now
    // => the signal lands mid-flight: retirement starts, but the drain waits
    println!("signal received: SIGTERM; draining 3 in-flight, accepting stopped"); // => golden line one: retirement starts, nothing drops
    // => join every in-flight call before exiting: the drain in one loop
    let mut lines = Vec::new(); // => the lines land in completion order, not task order
    // => await each handle; every in-flight call finishes, none is dropped
    for task in tasks {
        lines.push(task.await.unwrap());
    } // => unwrap: a dropped call would fail the run loudly
    // => sort makes the drain golden-stable: the same three lines, every run
    lines.sort(); // => in-flight-1 through in-flight-3, regardless of finish order
    // => print the drained lines: the proof nothing dropped mid-flight
    for line in lines {
        println!("{line}");
    } // => three finished lines after the signal line
    // => one golden line: the drain completed, retirement may exit
    println!("drained 3 in-flight; exiting clean"); // => shutdown waited, so the run is green
} // => main ends: three calls drained, zero dropped, so the run is green
