// Example 54: Handlers Run on the Shared Runtime.
// spawned tasks drive one router concurrently; sorted lines keep goldens stable.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Clone lets every task own the router it drives
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers every concurrent call with the same fixed greeting
async fn hello() -> Json<Value> {
    // => no state, no lock: the handler is trivially safe under any load
    Json(json!({"message": "hello, axum"})) // => five tasks hear the same greeting
} // => handler ends: stateless handlers scale without thinking

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => Clone on Router shares the routes: tasks never rebuild wiring
    Router::new().route("/hello", get(hello)) // => one route, five concurrent drivers
} // => constructor ends: wiring stays separate from traffic

// => call drives one concurrent request and returns its printed line
async fn call(app: Router, n: usize) -> String {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/hello")
        .body(Body::empty())
        .unwrap(); // => the same call every task makes
    // => oneshot runs routing and handlers exactly as live, on this task
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the line carries the task number so the sort below orders the goldens
    format!("task-{n} -> {status} {}", String::from_utf8_lossy(&bytes)) // => returned, not printed: order is decided below
} // => call ends: one line per task, order decided by the collector

#[tokio::main] // => the multithread runtime runs the five tasks at once
async fn main() {
    // => build once, share the router across five spawned tasks
    let app = app(); // => the service under test, built by its constructor
    // => spawn five drivers; each owns a clone and returns its line
    let mut tasks = Vec::new(); // => the join handles gather here
    // => five tasks stand in for five concurrent clients
    for n in 1..=5 {
        // => task numbers 1 through 5, in spawn order
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes are shared, not copied
        // => spawn runs the call on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { call(router, n).await })); // => five futures, one runtime, no sockets
    } // => spawn loop ends: all five tasks are racing now
    // => join every task and collect the five lines
    let mut lines = Vec::new(); // => the lines land in completion order, not task order
    // => await each handle in spawn order; lines still arrive jumbled
    for task in tasks {
        lines.push(task.await.unwrap());
    } // => unwrap: a panicked task fails the run loudly
    // => sort makes concurrency golden-stable: the same five lines, every run
    lines.sort(); // => task-1 through task-5, regardless of who finished first
    // => print the sorted lines: the proof of concurrent service, deterministically
    for line in lines {
        println!("{line}");
    } // => the harness compares these lines with the golden file
} // => main ends: five concurrent calls, five sorted lines, so the run is green
