// Example 59: Backpressure Bounds the Queue.
// two permits admit two overlapping calls; the third meets a 503, not a queue.
use axum::{
    Router,
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => the handler answers 200 inside or 503 outside the bound
use serde_json::{Value, json}; // => json! builds the admitted and busy replies inline
use std::sync::Arc; // => Arc shares the semaphore between main and the service
use tokio::sync::Semaphore; // => Semaphore bounds concurrent entries without any queue
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one semaphore every call shares
#[derive(Clone)] // => Clone shares the Arc, never the permits: cheap by design
struct AppState {
    // => two permits stand in for two database connections
    slots: Arc<Semaphore>, // => the bound the demo proves, one acquire at a time
} // => struct ends: backpressure as a single shared value

// => enter takes a permit now or answers busy now: never waits, never lies
async fn enter(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // => try_acquire takes a permit now or fails now: the bound is visible, not hidden
    match state.slots.try_acquire() {
        // => Ok holds a permit for this call; Err means both are out
        // => a permit was free: answer inside the bound with the permit held
        Ok(_permit) => (StatusCode::OK, Json(json!({"inside": true}))), // => true means a slot was held for this call
        // => both permits are out: 503 says retry later, with the shared envelope
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "busy"})),
        ), // => busy, not queued: the client decides, not a hidden line
    } // => match ends: the permit drops with the reply, freeing the slot
} // => handler ends: two outcomes, zero waiting room

// => build_app wires the service around the shared semaphore
fn build_app(slots: Arc<Semaphore>) -> Router {
    // => the semaphore arrives from outside: main holds permits against it below
    Router::new()
        .route("/enter", get(enter))
        .with_state(AppState { slots }) // => two slots, no queue, no waiting room
} // => constructor ends: the bound is shared, not copied

// => call serves one entry probe and prints its status line
async fn call(app: Router, label: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/enter")
        .body(Body::empty())
        .unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the bound check, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => 200 inside the bound, 503 outside it
    // => status names what happened; the body carries admitted or busy
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: leg name, status, reply
    println!("{label} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the bound demo
async fn main() {
    // => the semaphore lives outside: main and the service share it
    let slots = Arc::new(Semaphore::new(2)); // => two permits: the bound the demo circles around
    // => the service wraps the shared bound; main keeps its own handle to it
    let app = build_app(slots.clone()); // => one bound, two holders of the Arc
    // => leg one: both permits free, the call runs inside the bound
    call(app.clone(), "both free").await; // => Output: 200 {"inside":true}
    // => main takes both permits: the service is now full from the outside
    let _first = slots.acquire().await.unwrap(); // => permit one held by main, not the service
    // => the second permit joins it: zero slots remain for the next call
    let _second = slots.acquire().await.unwrap(); // => the service is full; the next call must meet 503
    // => leg two: no permit free, the bound answers busy instead of queueing
    call(app.clone(), "both held").await; // => Output: 503 {"error":"busy"}
    // => the takeaway: the bound is visible in the status, never hidden in latency
    println!("bound: 2 permits admit overlap; the third call meets 503, not a queue"); // => backpressure in one line, no timing involved
} // => main ends: inside once, busy once, so the run is green
