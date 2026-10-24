// Example 55: Atomic Counter Survives Ten Clients.
// Arc<AtomicUsize> counts hits across tasks: no lock, no lost update.
use axum::{
    Router,
    body::Body,
    extract::State,
    http::Request,
    response::Json,
    routing::{get, post},
}; // => post bumps, get reads: the two halves of the counter
use serde_json::{Value, json}; // => json! builds the count reply inline
use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
}; // => Arc shares the counter; fetch_add bumps it lock-free
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one counter every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the integer: cheap by design
struct AppState {
    // => the hits so far: bumped by posts, read by gets
    hits: Arc<AtomicUsize>, // => atomics need no lock, so posts never block each other
} // => struct ends: one integer shared across ten concurrent clients

// => hit bumps the counter and answers the new total
async fn hit(State(state): State<AppState>) -> Json<Value> {
    // => fetch_add returns the previous value: add one for the 1-based total
    let total = state.hits.fetch_add(1, Ordering::SeqCst) + 1; // => SeqCst keeps the demo obviously correct
    // => the reply echoes the total this bump produced
    Json(json!({"hits": total})) // => totals 1 through 10 across the ten posts
} // => handler ends: lock-free bump, no lost update possible

// => count reads the counter without bumping it
async fn count(State(state): State<AppState>) -> Json<Value> {
    // => load reads the current total: the suite asserts this equals ten
    Json(json!({"hits": state.hits.load(Ordering::SeqCst)})) // => the final proof all ten bumps landed
} // => handler ends: reads never disturb the count

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => the counter starts at zero: ten bumps make ten
    let state = AppState {
        hits: Arc::new(AtomicUsize::new(0)),
    }; // => zero hits before the first post
    // => with_state moves the counter into the router; handlers unpack clones
    Router::new()
        .route("/hit", post(hit))
        .route("/count", get(count))
        .with_state(state) // => bump and read live one router apart
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the multithread runtime runs the ten bumpers at once
async fn main() {
    // => build once, share the router across ten spawned bumpers
    let app = app(); // => the service under test, built by its constructor
    // => spawn ten bumpers; each posts once and drops its reply
    let mut tasks = Vec::new(); // => the join handles gather here
    // => ten tasks stand in for ten concurrent clients
    for _ in 1..=10 {
        // => ten posts, no more, no fewer
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes and state are shared
        // => spawn runs one POST /hit on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move {
            // => the bumper owns its router clone
            // => one bump per task: method, path, empty body
            let request = Request::builder()
                .method("POST")
                .uri("/hit")
                .body(Body::empty())
                .unwrap(); // => posts carry no payload here
            // => the reply is drained, not printed: totals arrive jumbled anyway
            let response = router.oneshot(request).await.unwrap(); // => the bump lands or the task panics
            // => drain the body so the response is fully consumed
            let _ = axum::body::to_bytes(response.into_body(), 65536)
                .await
                .unwrap(); // => totals print once below, not ten times
        })); // => bumper ends: one post per task, exactly ten posts
    } // => spawn loop ends: all ten bumpers are racing now
    // => join every bumper before reading the count
    for task in tasks {
        task.await.unwrap();
    } // => unwrap: a panicked bumper fails the run loudly
    // => read the final count through the real stack, after all bumps landed
    let request = Request::builder()
        .method("GET")
        .uri("/count")
        .body(Body::empty())
        .unwrap(); // => the proof read after the join
    // => oneshot runs the read against the same shared state
    let response = app.oneshot(request).await.unwrap(); // => the counter holds ten by now
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line: ten concurrent bumps, one final count of ten
    println!(
        "ten concurrent posts -> {}",
        String::from_utf8_lossy(&bytes)
    ); // => {"hits":10}: no lost update across ten tasks
} // => main ends: the atomic survived ten clients, so the run is green
