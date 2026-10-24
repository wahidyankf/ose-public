// Example 53: Test Suite Runs the Whole Service.
// one pass walks every route plus the probe: the service proof in six lines.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the suite store; get binds both routes
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{Arc, Mutex}; // => Arc shares the suite's store; Mutex guards its vector
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState is the one value the whole suite shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => Mutex guards the vector because handlers run on many threads
    orders: Arc<Mutex<Vec<String>>>, // => seeded once below, read by the suite
} // => struct ends: one store for the whole pass

// => list reads the suite store through the State extractor
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let orders = state.orders.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the suite contents in store order
    Json(json!({"orders": orders})) // => seeded once below, read on every call
} // => handler ends: it borrows shared state but owns nothing

// => health answers the liveness probe beside the business routes
async fn health() -> Json<Value> {
    // => no store, no latency, nothing that can fail except the process itself
    Json(json!({"status": "ok"})) // => the probe the suite asserts last
} // => handler ends: liveness asks only whether the process answers

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the suite store seeds two rows; routes and probe share one router
    let state = AppState {
        orders: Arc::new(Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()])),
    }; // => two rows, always in this order
    // => with_state moves the value into the router; the probe needs none
    Router::new()
        .route("/orders", get(list))
        .route("/healthz", get(health))
        .with_state(state) // => business plus probe: the whole service in one pass
} // => constructor ends: wiring stays separate from traffic

// => check serves one suite leg, asserts its status, then prints the hold line
async fn check(app: Router, uri: &str, want: u16, want_body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri(uri)
        .body(Body::empty())
        .unwrap(); // => one suite leg as a live request
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the leg: a wrong code panics with the path shown
    assert_eq!(response.status().as_u16(), want, "leg {uri}"); // => want or red: the message names the failing leg
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with the leg shown
    assert_eq!(String::from_utf8_lossy(&bytes), want_body, "leg {uri}"); // => want_body or red: the proof is exact
    // => tail adds the body only when the leg has one: no trailing space
    let tail = if want_body.is_empty() {
        String::new()
    } else {
        format!(" {want_body}")
    }; // => empty legs print clean
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds GET {uri} -> {want}{tail}"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, walk the whole service leg by leg through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the listing leg holds both seeded rows in store order
    check(app.clone(), "/orders", 200, r#"{"orders":["o-1","o-2"]}"#).await; // => Output: holds the listing leg
    // => the probe leg holds liveness beside the business routes
    check(app.clone(), "/healthz", 200, r#"{"status":"ok"}"#).await; // => Output: holds the probe leg
    // => the unknown leg holds the 404 the default fallback answers
    check(app.clone(), "/nope", 404, "").await; // => Output: holds the absence leg with no body
} // => main ends: asserts green and printed, so the run is green
