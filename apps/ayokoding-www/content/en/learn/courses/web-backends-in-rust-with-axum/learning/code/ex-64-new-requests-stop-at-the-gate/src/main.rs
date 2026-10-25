// Example 64: New Requests Stop at the Gate.
// an AtomicBool gate refuses late calls with 503 while the drain finishes.
use axum::{
    Router,
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => the gate handler answers 200 open or 503 shutting
use serde_json::{Value, json}; // => json! builds the open and shutting replies inline
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
}; // => Arc shares the gate; the bool flips once at SIGTERM
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one gate every call reads
#[derive(Clone)] // => Clone shares the Arc, never the bool: cheap by design
struct AppState {
    // => true means retiring: late calls stop here instead of reaching handlers
    shutting_down: Arc<AtomicBool>, // => false while serving, true after the signal
} // => struct ends: the gate as a single shared bit

// => gated answers through the gate: open serves, shutting refuses
async fn gated(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // => the gate is read per call: no lock, no race, just one atomic load
    if state.shutting_down.load(Ordering::SeqCst) {
        // => true means the signal already landed
        // => 503 tells late callers to retry elsewhere, with the shared envelope
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "shutting_down"})),
        ); // => refused at the gate: handlers never run
    } // => gate open: fall through to the served reply below
    // => 200 serves the call that arrived before the signal
    (StatusCode::OK, Json(json!({"served": true}))) // => served means the gate was open
} // => handler ends: the gate decides, the handler obeys

// => build_app wires the service around the shared gate
fn build_app(gate: Arc<AtomicBool>) -> Router {
    // => the gate arrives from outside: main flips it like SIGTERM would
    Router::new()
        .route("/gated", get(gated))
        .with_state(AppState {
            shutting_down: gate,
        }) // => one gate, every call reads it
} // => constructor ends: the gate is shared, not copied

// => call serves one gated probe and prints its status line
async fn call(app: Router, label: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/gated")
        .body(Body::empty())
        .unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the gate, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => 200 open, 503 shutting
    // => status names what happened; the body carries served or the envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: leg name, status, reply
    println!("{label} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the gate demo
async fn main() {
    // => the gate lives outside: main and the service share it
    let gate = Arc::new(AtomicBool::new(false)); // => open: calls serve before the signal
    // => the service wraps the shared gate; main keeps its own handle to it
    let app = build_app(gate.clone()); // => one gate, two holders of the Arc
    // => leg one: gate open, the call serves with 200
    call(app.clone(), "gate open").await; // => Output: 200 {"served":true}
    // => SIGTERM lands: the gate flips once and never flips back
    gate.store(true, Ordering::SeqCst); // => the signal in one atomic store
    // => one golden line: the flip itself, printed as the retirement marker
    println!("signal received: SIGTERM; gate closed, draining"); // => retirement starts: late calls stop here
    // => leg two: gate shut, the late call meets 503 at the gate
    call(app.clone(), "gate shut").await; // => Output: 503 {"error":"shutting_down"}
} // => main ends: served once, refused once, so the run is green
