// Example 51: Test Seeds State Per Case.
// each case builds its own world: fresh store in, isolated proof out.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks each world's store per call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use std::sync::{Arc, Mutex}; // => Arc shares each world's store; Mutex guards each vector
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value each world's handlers share
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => one vector per world, many readers, one lock
} // => struct ends: shared ownership with interior mutability, the axum default

// => list reads its world's store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes its world's contents in store order
    Json(json!({"orders": orders})) // => seeded per case below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => build_app wires one isolated world from one seed: the case constructor
fn build_app(seed: Vec<String>) -> Router {
    // => the seed becomes this world's store: cases never share rows
    let state = AppState {
        orders: Arc::new(Mutex::new(seed)),
    }; // => owned seed in, shared store out
    // => with_state moves the value into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => one store per case, zero globals
} // => constructor ends: every case starts from a world it names

// => case builds its world, reads it, asserts the listing, prints the hold line
async fn case(name: &str, seed: Vec<String>, want: &str) {
    // => the world exists only inside this case: nothing leaks between cases
    let app = build_app(seed); // => fresh store in, isolated proof out
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/orders")
        .body(Body::empty())
        .unwrap(); // => the pinned read for every case
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => this world's store answers
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the listing: a wrong world panics with its name
    assert_eq!(String::from_utf8_lossy(&bytes), want, "case {name}"); // => want or red: the message names the failing case
    // => holds prints only after the assert passed: the proof, in one line
    println!("holds case {name} -> {want}"); // => the harness compares this line with the golden file
} // => case ends: the world drops here, so cases stay isolated

#[tokio::main] // => the async runtime drives the cases and the checks
async fn main() {
    // => three cases, three worlds, zero shared rows between them
    case("seeded", vec!["o-1".to_owned()], r#"{"orders":["o-1"]}"#).await; // => Output: holds case seeded with one row
    // => the empty world lists nothing: isolation means no leakage from seeded
    case("empty", vec![], r#"{"orders":[]}"#).await; // => Output: holds case empty with no rows
    // => the two-row world lists both in seed order
    case(
        "pair",
        vec!["o-1".to_owned(), "o-2".to_owned()],
        r#"{"orders":["o-1","o-2"]}"#,
    )
    .await; // => Output: holds case pair with two rows
} // => main ends: asserts green and printed, so the run is green
