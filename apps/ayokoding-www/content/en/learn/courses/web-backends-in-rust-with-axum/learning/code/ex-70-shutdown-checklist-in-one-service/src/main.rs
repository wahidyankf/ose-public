// Example 70: Shutdown Checklist in One Service.
// unready flip, gate shut, drain, flush: the full retirement in order.
use axum::{
    Router,
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => State unpacks the checklist world per call
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{
    Arc, Mutex,
    atomic::{AtomicBool, Ordering},
}; // => Arc shares book and flags; atomics flip once at SIGTERM
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => World is the whole retirement story in one shared value
#[derive(Clone)] // => Clone shares the Arcs, never the rows: cheap by design
struct World {
    // => buffered rows wait here for the retirement flush
    book: Arc<Mutex<Vec<String>>>, // => seeded below, flushed at the end
    // => true means serving: the probe answers 200 while set
    ready: Arc<AtomicBool>, // => flipped down first at SIGTERM
    // => true means retiring: late calls meet 503 at the gate
    shutting_down: Arc<AtomicBool>, // => flipped up second at SIGTERM
} // => struct ends: buffer, readiness, and gate in one value

// => status answers the probe through the readiness flag
async fn status(State(world): State<World>) -> (StatusCode, Json<Value>) {
    // => the flag is read per probe: one atomic load, no lock
    if world.ready.load(Ordering::SeqCst) {
        // => true means traffic may keep flowing
        // => 200 keeps the balancer sending traffic to this process
        return (StatusCode::OK, Json(json!({"ready": true}))); // => ready: the serving reply
    } // => flag down: fall through to the unready leg below
    // => 503 pulls the process out of rotation before the exit lands
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"ready": false})),
    ) // => unready: drain me, then I exit
} // => handler ends: the probe decides rotation, nothing else

// => work answers through the gate: open serves, shutting refuses
async fn work(State(world): State<World>) -> (StatusCode, Json<Value>) {
    // => the gate is read per call: late calls stop here after the flip
    if world.shutting_down.load(Ordering::SeqCst) {
        // => true means the signal already landed
        // => 503 tells late callers to retry elsewhere, with the shared envelope
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "shutting_down"})),
        ); // => refused at the gate
    } // => gate open: fall through to the served reply below
    // => 200 serves the call that arrived before the signal
    (StatusCode::OK, Json(json!({"served": true}))) // => served means the gate was open
} // => handler ends: the gate decides, the handler obeys

// => build_app wires the checklist service around the shared world
fn build_app(world: World) -> Router {
    // => probe and work share one world: flags and book travel together
    Router::new()
        .route("/healthz", get(status))
        .route("/work", get(work))
        .with_state(world) // => rotation plus gate in one router
} // => constructor ends: the world is shared, not copied

// => call serves one checklist probe and prints its status line
async fn call(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri(uri)
        .body(Body::empty())
        .unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the flags, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => flags decide each leg's answer
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: path, status, reply
    println!("GET {uri} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the checklist demo
async fn main() {
    // => the world lives outside: main and the service share it
    let world = World {
        book: Arc::new(Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()])),
        ready: Arc::new(AtomicBool::new(true)),
        shutting_down: Arc::new(AtomicBool::new(false)),
    }; // => two rows buffered, ready up, gate open
    // => the service wraps the shared world; main keeps its own handle to it
    let app = build_app(world.clone()); // => one world, two holders of the Arcs
    // => step zero: the serving world answers ready and serves work
    call(app.clone(), "/healthz").await; // => Output: 200 {"ready":true}
    // => the same serving world serves work through the open gate
    call(app.clone(), "/work").await; // => Output: 200 {"served":true}
    // => SIGTERM lands: the checklist runs in order from here
    println!("signal received: SIGTERM; running the retirement checklist"); // => golden line: retirement starts
    // => step one: the probe flips to unready, pulling rotation first
    world.ready.store(false, Ordering::SeqCst); // => the unready flip in one atomic store
    // => the retiring probe answers 503 with the unready body
    call(app.clone(), "/healthz").await; // => Output: 503 {"ready":false}
    // => step two: the gate shuts, refusing late work with 503
    world.shutting_down.store(true, Ordering::SeqCst); // => the gate flip in one atomic store
    // => late work stops at the gate with the shared envelope
    call(app.clone(), "/work").await; // => Output: 503 {"error":"shutting_down"}
    // => step three: the drain finds no in-flight calls, so it completes at once
    println!("drained 0 in-flight; nothing to wait for"); // => golden line: the drain in one step
    // => step four: the flush writes the buffered rows out instead of dropping them
    let flushed = world.book.lock().unwrap().clone(); // => the lock drops before printing
    // => one golden line: every buffered row survived to the flush
    println!("flushed {} rows: {}", flushed.len(), flushed.join(",")); // => flushed 2 rows: o-1,o-2
    // => the checklist ends: retirement completed in order, exit is clean
    println!("shutdown complete: unready, gated, drained, flushed"); // => the four steps in one line
} // => main ends: the checklist ran in order, so the run is green
