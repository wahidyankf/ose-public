// Kata 05 solution: the store lifts into AppState; build_app seeds each world.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks each world's store per call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use std::sync::{Arc, Mutex}; // => Arc shares each world's store; Mutex guards each vector
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value each world's handlers share
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector per world, many readers, one lock
} // => struct ends: the lifted dependency the handler borrows

// => list reads its world's store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes its world's contents in store order
    Json(json!({"orders": orders})) // => seeded per world below, read on every call
} // => handler ends: no store is built here anymore

// => build_app wires one isolated world from one seed: the lifted constructor
fn build_app(seed: Vec<String>) -> Router {
    // => the seed becomes this world's store: tests choose their rows
    let state = AppState {
        orders: Arc::new(Mutex::new(seed)),
    }; // => owned seed in, shared store out
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => one store per world, zero globals
} // => constructor ends: the dependency arrives by construction

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => this world's store answers
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both worlds write a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per world: world name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the worlds and the checks
async fn main() {
    // => build two worlds from the lifted constructor: seeded and empty
    let seeded = build_app(vec!["o-1".to_owned()]); // => the world with one row
    // => the empty world stands beside it with no rows at all
    let empty = build_app(vec![]); // => the world the tests grow themselves
    // => the seeded world lists its row through shared state
    check(seeded.clone(), "seeded").await; // => Output: seeded GET /orders -> 200 OK {"orders":["o-1"]}
    // => the empty world lists nothing: the dependency split holds
    check(empty.clone(), "empty").await; // => Output: empty GET /orders -> 200 OK {"orders":[]}
} // => main ends: every check printed, so the run is green
