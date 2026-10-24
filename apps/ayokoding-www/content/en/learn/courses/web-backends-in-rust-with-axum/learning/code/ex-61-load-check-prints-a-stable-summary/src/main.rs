// Example 61: Load Check Prints a Stable Summary.
// twenty concurrent calls collapse into counted lines: the summary is the proof.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Clone lets every task own the router it drives
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers every load call with the same fixed greeting
async fn hello() -> Json<Value> {
    // => no state, no lock: the handler is trivially safe under any load
    Json(json!({"message": "hello, axum"})) // => twenty tasks hear the same greeting
} // => handler ends: stateless handlers scale without thinking

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => Clone on Router shares the routes: tasks never rebuild wiring
    Router::new().route("/hello", get(hello)) // => one route, twenty concurrent drivers
} // => constructor ends: wiring stays separate from traffic

// => call drives one load request and returns its status code
async fn call(app: Router) -> u16 {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/hello")
        .body(Body::empty())
        .unwrap(); // => the same call every task makes
    // => oneshot runs routing and handlers exactly as live, on this task
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the code returns for counting; the summary below prints the totals
    let code = response.status().as_u16(); // => keep the number before the body moves
    // => to_bytes drains the body so the response is fully consumed
    let _ = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => drained, not printed: summaries count, they do not quote
    // => the code travels back to the collector for the summary
    code // => 200 every time, counted twenty times below
} // => call ends: one number per task, order decided by the collector

#[tokio::main] // => the multithread runtime runs the twenty tasks at once
async fn main() {
    // => build once, share the router across twenty spawned tasks
    let app = app(); // => the service under test, built by its constructor
    // => spawn twenty drivers; each returns its status code
    let mut tasks = Vec::new(); // => the join handles gather here
    // => twenty tasks stand in for twenty concurrent clients
    for _ in 1..=20 {
        // => twenty calls, no more, no fewer
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes are shared, not copied
        // => spawn runs the call on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move { call(router).await })); // => twenty futures, one runtime, no sockets
    } // => spawn loop ends: all twenty tasks are racing now
    // => join every task and count the codes into the summary
    let mut ok = 0; // => 200s land here
    // => every other code would land here; none ever does
    let mut other = 0; // => stays zero: the summary proves it
    // => await each handle and sort its code into the right bucket
    for task in tasks {
        if task.await.unwrap() == 200 {
            ok += 1;
        } else {
            other += 1;
        }
    } // => unwrap: a panicked task fails the run loudly
    // => one golden line: twenty concurrent calls, twenty 200s, zero others
    println!("load: 20 concurrent calls -> ok={ok} other={other}"); // => ok=20 other=0: the stable summary of the race
} // => main ends: twenty calls counted, so the run is green
