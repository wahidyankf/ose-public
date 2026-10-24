// Example 67: State Flushes Before Exit.
// retirement writes the book out: three buffered rows print as flushed proof.
use axum::{
    Router,
    body::Body,
    extract::{Path, State},
    http::{Request, StatusCode},
    response::Json,
    routing::{get, post},
}; // => post buffers, flush reads: the two halves of retirement
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{Arc, Mutex}; // => Arc shares the book; Mutex guards its vector
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book retirement flushes
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    book: Arc<Mutex<Vec<String>>>, // => buffered rows wait here for the flush
} // => struct ends: the buffer retirement must not lose

// => buffer appends one id under a short lock and answers 201
async fn buffer(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> (StatusCode, Json<Value>) {
    // => lock, push, measure: the critical section ends before the reply builds
    let size = {
        let mut book = state.book.lock().unwrap();
        book.push(id);
        book.len()
    }; // => the lock drops at the closing brace
    // => 201 with the buffered count after this append
    (StatusCode::CREATED, Json(json!({"buffered": size}))) // => buffered 1 through 3 across the three posts
} // => handler ends: the lock never crosses an await

// => build_app wires the service around the shared book
fn build_app(book: Arc<Mutex<Vec<String>>>) -> Router {
    // => the book arrives from outside: main flushes it like retirement would
    Router::new()
        .route("/buffer/{id}", post(buffer))
        .route("/orders", get(list))
        .with_state(AppState { book }) // => buffer and list live one router apart
} // => constructor ends: the book is shared, not copied

// => list clones the book under the lock and renders it in order
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => clone under the lock, render outside it: readers never block writers long
    let ids = state.book.lock().unwrap().clone(); // => the lock drops before rendering
    // => the listing echoes the buffered contents in buffer order
    Json(json!({"orders": ids})) // => three ids in order after the three posts
} // => handler ends: it borrows shared state but owns nothing

#[tokio::main] // => the async runtime drives the flush demo
async fn main() {
    // => the book lives outside: main and the service share it
    let book = Arc::new(Mutex::new(Vec::new())); // => empty buffer before the first post
    // => the service wraps the shared book; main keeps its own handle to it
    let app = build_app(book.clone()); // => one book, two holders of the Arc
    // => buffer three rows through the real stack before the signal
    for n in 1..=3 {
        // => o-1 through o-3, one post per row
        // => one append per row: the id rides in the path
        let uri = format!("/buffer/o-{n}"); // => o-1 through o-3, built per row
        // => Request::builder shapes a server-side request without a client
        let request = Request::builder()
            .method("POST")
            .uri(&uri)
            .body(Body::empty())
            .unwrap(); // => posts carry no payload here
        // => the reply is drained, not printed: counts arrive in order anyway
        let response = app.clone().oneshot(request).await.unwrap(); // => the row buffers or the run panics
        // => drain the body so the response is fully consumed
        let _ = axum::body::to_bytes(response.into_body(), 65536)
            .await
            .unwrap(); // => counts print once below, not three times
    } // => buffer loop ends: three rows wait in the book
    // => the signal lands: retirement flushes the book instead of dropping it
    println!("signal received: SIGTERM; flushing 3 buffered rows"); // => golden line: retirement starts with the flush
    // => the flush reads the shared book directly: the retirement write-out
    let flushed = book.lock().unwrap().clone(); // => the lock drops before printing
    // => one golden line: every buffered row survived to the flush
    println!("flushed {} rows: {}", flushed.len(), flushed.join(",")); // => flushed 3 rows: o-1,o-2,o-3
} // => main ends: buffered three, flushed three, so the run is green
