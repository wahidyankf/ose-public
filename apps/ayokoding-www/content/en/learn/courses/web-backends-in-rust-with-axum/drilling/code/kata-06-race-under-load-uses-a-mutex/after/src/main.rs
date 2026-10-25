// Kata 06 solution: five appenders share one Arc<Mutex>; the sorted book holds five.
use axum::{
    Router,
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    response::Json,
    routing::{get, post},
}; // => post appends, get lists: the two halves of the book
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{Arc, Mutex}; // => Arc shares the book; Mutex serializes the appends
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex serializes appends because handlers run on many threads
    book: Arc<Mutex<Vec<String>>>, // => one book, many writers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => add appends one id under a short lock and answers 201
async fn add(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> (StatusCode, Json<Value>) {
    // => lock, push, measure: the critical section ends before the reply builds
    let size = {
        let mut book = state.book.lock().unwrap();
        book.push(id);
        book.len()
    }; // => the lock drops at the closing brace
    // => 201 with the size the book reached after this append
    (StatusCode::CREATED, Json(json!({"size": size}))) // => sizes 1 through 5 across the five posts
} // => handler ends: the lock never crosses an await

// => list clones the book under the lock and renders the sorted ids
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => clone under the lock, sort outside it: readers never block writers long
    let mut ids = state.book.lock().unwrap().clone(); // => the lock drops before sorting
    // => sort makes concurrent appends golden-stable: same ids, every run
    ids.sort(); // => o-1 through o-5, regardless of which task won the race
    // => the listing echoes the sorted book contents
    Json(json!({"orders": ids})) // => five ids in order, whatever the race said
} // => handler ends: sorting turns a race into a stable contract

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => the book starts empty: five appends fill it below
    let state = AppState {
        book: Arc::new(Mutex::new(Vec::new())),
    }; // => empty book before the first post
    // => with_state moves the book into the router; handlers unpack clones
    Router::new()
        .route("/orders/{id}", post(add))
        .route("/orders", get(list))
        .with_state(state) // => append and list live one router apart
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the multithread runtime runs the five appenders at once
async fn main() {
    // => build once, share the router across five spawned appenders
    let app = app(); // => the service under test, built by its constructor
    // => spawn five appenders; each posts one id and drops its reply
    let mut tasks = Vec::new(); // => the join handles gather here
    // => five tasks stand in for five concurrent clients
    for n in 1..=5 {
        // => ids o-1 through o-5, one per task
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes and state are shared
        // => spawn runs one POST on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move {
            // => the appender owns its router clone
            // => one append per task: the id rides in the path
            let uri = format!("/orders/o-{n}"); // => o-1 through o-5, built per task
            // => Request::builder shapes a server-side request without a client
            let request = Request::builder()
                .method("POST")
                .uri(&uri)
                .body(Body::empty())
                .unwrap(); // => posts carry no payload here
            // => the reply is drained, not printed: sizes arrive jumbled anyway
            let response = router.oneshot(request).await.unwrap(); // => the append lands or the task panics
            // => drain the body so the response is fully consumed
            let _ = axum::body::to_bytes(response.into_body(), 65536)
                .await
                .unwrap(); // => sizes print once below, not five times
        })); // => appender ends: one append per task, exactly five appends
    } // => spawn loop ends: all five appenders are racing now
    // => join every appender before reading the book
    for task in tasks {
        task.await.unwrap();
    } // => unwrap: a panicked appender fails the run loudly
    // => read the sorted book through the real stack, after all appends landed
    let request = Request::builder()
        .method("GET")
        .uri("/orders")
        .body(Body::empty())
        .unwrap(); // => the proof read after the join
    // => oneshot runs the read against the same shared book
    let response = app.oneshot(request).await.unwrap(); // => the book holds five rows by now
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line: five concurrent appends, one sorted book of five
    println!(
        "five concurrent appends -> {}",
        String::from_utf8_lossy(&bytes)
    ); // => {"orders":["o-1","o-2","o-3","o-4","o-5"]}: no lost write
} // => main ends: the mutex guarded five writers, so the run is green
