// Kata 06 starter: one task appends five ids in a loop. It answers, but the
// second task would race the bare vector. TODO: wrap the book in
// Arc<Mutex<Vec<String>>>, spawn five appenders sharing it, join them, and
// print the sorted book: no lost write across the race.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => State and the lock join these imports when the kata lands
use serde_json::{Value, json}; // => json! builds the listing reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => BOOK is the bare vector one task fills today: TODO shares it safely
static BOOK: Mutex<Vec<String>> = Mutex::new(Vec::new()); // => statics need Mutex already: the kata adds Arc and tasks
use std::sync::Mutex; // => Mutex guards the static because main borrows it alone today

// => list clones the static book and renders the sorted ids
async fn list() -> Json<Value> {
    // => clone under the lock, sort outside it: the single-threaded read
    let mut ids = BOOK.lock().unwrap().clone(); // => TODO: State<AppState> replaces this static
    // => sort makes the output golden-stable on every call
    ids.sort(); // => o-1 through o-5 after the loop below fills them
    // => the listing echoes the sorted book contents
    Json(json!({"orders": ids})) // => five ids in order after the kata's race
} // => handler ends: the static works, the sharing is the kata

// => app builds the service once; shared state joins it when written
fn app() -> Router {
    // => TODO: with_state(AppState) replaces the static BOOK above
    Router::new().route("/orders", get(list)) // => no state today: the kata adds the shared book
} // => constructor ends: the sharing is the kata

#[tokio::main] // => the async runtime drives the fill and the read
async fn main() {
    // => one task fills five ids in a loop: safe alone, racy the moment it shares
    for n in 1..=5 {
        // => o-1 through o-5, pushed in order by one task
        // => the static takes each id under its lock, one at a time
        BOOK.lock().unwrap().push(format!("o-{n}")); // => TODO: five tasks share one Arc<Mutex> instead
    } // => fill loop ends: five rows wait in the static book
    // => build once, read the filled book through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/orders")
        .body(Body::empty())
        .unwrap(); // => the proof read after the fill
    // => oneshot runs the read against the filled book
    let response = app.oneshot(request).await.unwrap(); // => TODO: the raced book answers identically below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the shared race must preserve
    println!(
        "GET /orders -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ); // => the kata is done when five tasks print this
} // => main ends: the kata is done when todo is gone
