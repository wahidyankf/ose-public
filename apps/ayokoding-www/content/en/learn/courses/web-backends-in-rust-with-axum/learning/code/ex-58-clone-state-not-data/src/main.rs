// Example 58: Clone State, Not Data.
// one Arc holds the heavy catalog; handlers clone the pointer per call.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks one cheap pointer per handler call
use serde_json::{Value, json}; // => json! builds the summary reply inline
use std::sync::Arc; // => Arc is the whole sharing story: one allocation, many pointers
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => HEAVY_ROWS stands in for the catalog no handler should ever copy
const HEAVY_ROWS: usize = 10_000; // => ten thousand rows: cloning this per call would hurt

// => AppState carries the heavy catalog behind one Arc
#[derive(Clone)] // => Clone copies the pointer in nanoseconds, never the rows
struct AppState {
    // => the catalog lives once in memory; every handler borrows through the Arc
    catalog: Arc<Vec<String>>, // => immutable: no lock needed, readers share freely
} // => struct ends: heavy data, weightless handles

// => summary proves the sharing: row count plus live holder count
async fn summary(State(state): State<AppState>) -> Json<Value> {
    // => len reads the heavy data without copying a single row
    let rows = state.catalog.len(); // => ten thousand, through the shared pointer
    // => strong_count proves handlers hold pointers, not copies
    let holders = Arc::strong_count(&state.catalog); // => router plus this call: a small fixed number
    // => the reply carries both proofs side by side
    Json(json!({"rows": rows, "holders": holders})) // => heavy data, light handles, one line
} // => handler ends: it touched ten thousand rows and copied zero

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the catalog builds once here: ten thousand ids in one vector
    let catalog: Vec<String> = (1..=HEAVY_ROWS).map(|n| format!("item-{n:05}")).collect(); // => item-00001 through item-10000
    // => with_state moves the Arc into the router; handlers unpack pointer clones
    Router::new()
        .route("/summary", get(summary))
        .with_state(AppState {
            catalog: Arc::new(catalog),
        }) // => one allocation, every call borrows it
} // => constructor ends: heavy once, light forever after

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the pointer for this call
    // => status names what happened; the body carries rows plus holders
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the summary is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the summary always writes a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line: method, path, status, summary
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the summary through the shared pointer
    let app = app(); // => the service under test, built by its constructor
    // => ten thousand rows behind a two-holder pointer: clone state, not data
    check(app.clone(), "GET", "/summary").await; // => Output: 200 {"rows":10000,"holders":2}
} // => main ends: every check printed, so the run is green
