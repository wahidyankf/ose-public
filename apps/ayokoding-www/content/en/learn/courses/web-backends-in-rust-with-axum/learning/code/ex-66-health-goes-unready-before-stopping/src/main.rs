// Example 66: Health Goes Unready Before Stopping.
// the probe flips to 503 first: the balancer drains traffic, then the exit lands.
use axum::{
    Router,
    body::Body,
    extract::State,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => the probe answers 200 ready or 503 unready
use serde_json::{Value, json}; // => json! builds the ready and unready replies inline
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
}; // => Arc shares the readiness flag; the bool flips once at SIGTERM
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one readiness flag the probe reads
#[derive(Clone)] // => Clone shares the Arc, never the bool: cheap by design
struct AppState {
    // => true means serving: the balancer keeps sending traffic while set
    ready: Arc<AtomicBool>, // => true at boot, false the moment retirement starts
} // => struct ends: readiness as a single shared bit

// => health answers the probe the balancer calls between traffic decisions
async fn health(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    // => the flag is read per probe: no lock, no race, just one atomic load
    if state.ready.load(Ordering::SeqCst) {
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

// => build_app wires the probe around the shared readiness flag
fn build_app(ready: Arc<AtomicBool>) -> Router {
    // => the flag arrives from outside: main flips it like SIGTERM would
    Router::new()
        .route("/healthz", get(health))
        .with_state(AppState { ready }) // => one flag, every probe reads it
} // => constructor ends: the flag is shared, not copied

// => probe serves one probe call and prints its status line
async fn probe(app: Router, label: &str) {
    // => Request::builder shapes a server-side probe without a client
    let request = Request::builder()
        .method("GET")
        .uri("/healthz")
        .body(Body::empty())
        .unwrap(); // => the same probe every leg repeats
    // => oneshot runs routing, the flag read, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => 200 ready, 503 retiring
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one golden line per leg: leg name, status, readiness reply
    println!("{label} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the harness compares this line with the golden file
} // => probe ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the readiness demo
async fn main() {
    // => the flag lives outside: main and the service share it
    let ready = Arc::new(AtomicBool::new(true)); // => ready at boot: traffic flows from the first probe
    // => the service wraps the shared flag; main keeps its own handle to it
    let app = build_app(ready.clone()); // => one flag, two holders of the Arc
    // => leg one: flag up, the probe keeps the process in rotation
    probe(app.clone(), "serving").await; // => Output: 200 {"ready":true}
    // => SIGTERM lands: readiness flips first, the exit comes after the drain
    ready.store(false, Ordering::SeqCst); // => the unready flip in one atomic store
    // => one golden line: the flip itself, printed as the retirement marker
    println!("signal received: SIGTERM; probe flips to unready, balancer drains"); // => rotation ends before the exit lands
    // => leg two: flag down, the probe pulls the process out of rotation
    probe(app.clone(), "retiring").await; // => Output: 503 {"ready":false}
} // => main ends: ready once, unready once, so the run is green
