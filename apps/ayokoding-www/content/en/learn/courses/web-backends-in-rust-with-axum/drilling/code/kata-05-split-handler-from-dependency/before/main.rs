// Kata 05 starter: the handler builds its own store inline. It answers, but no
// test can seed a world and no second route can share the rows. TODO: lift the
// store into AppState, add build_app(seed), and read through State instead.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => State joins these imports when the kata lands
use serde_json::{Value, json}; // => json! builds the listing reply inline
use std::sync::{Arc, Mutex}; // => Arc and Mutex already imported: the state shape waits
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => list builds its store inline: TODO lifts this into shared state
async fn list() -> Json<Value> {
    // => TODO: replace this inline store with State<AppState> from build_app
    let store = Arc::new(Mutex::new(vec!["o-1".to_owned()])); // => inline today: untestable, unshareable
    // => lock borrows the vector for the shortest possible moment
    let orders = store.lock().unwrap().clone(); // => the rows every call rebuilds from scratch
    // => the listing echoes the rebuilt contents on every call
    Json(json!({"orders": orders})) // => TODO: the seeded world answers here instead
} // => handler ends: correct output, wrong ownership

// => app builds the service once; build_app(seed) replaces it when written
fn app() -> Router {
    // => TODO: build_app(seed: Vec<String>) takes the seed callers choose
    Router::new().route("/orders", get(list)) // => no state today: the kata adds with_state
} // => constructor ends: the seam is the kata

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the inline store the kata must lift
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/orders")
        .body(Body::empty())
        .unwrap(); // => the pinned read the kata preserves
    // => oneshot runs the inline store exactly as live
    let response = app.oneshot(request).await.unwrap(); // => TODO: the seeded world answers identically below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the shared state must preserve
    println!(
        "GET /orders -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ); // => the kata is done when build_app prints this
} // => main ends: the kata is done when todo is gone
