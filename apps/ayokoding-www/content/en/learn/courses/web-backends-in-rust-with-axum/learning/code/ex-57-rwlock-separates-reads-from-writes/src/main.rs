// Example 57: RwLock Separates Reads from Writes.
// many readers proceed together; writers still take the book alone.
use axum::{
    Router,
    body::Body,
    extract::{Path, State},
    http::{Request, StatusCode},
    response::Json,
    routing::{get, post},
}; // => post writes, get reads: the two lock kinds side by side
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{Arc, RwLock}; // => RwLock admits concurrent readers, one writer at a time
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppState carries the one book every handler and task shares
#[derive(Clone)] // => Clone shares the Arc, never the vector: cheap by design
struct AppState {
    // => RwLock lets readers share the book while writers take it alone
    book: Arc<RwLock<Vec<String>>>, // => one book, many readers or one writer
} // => struct ends: read-mostly sharing with write safety

// => add takes the write lock, appends one id, and answers 201
async fn add(State(state): State<AppState>, Path(id): Path<String>) -> (StatusCode, Json<Value>) {
    // => write borrows the book alone: readers wait out this short section
    let size = {
        let mut book = state.book.write().unwrap();
        book.push(id);
        book.len()
    }; // => the write lock drops at the closing brace
    // => 201 with the size the book reached after this append
    (StatusCode::CREATED, Json(json!({"size": size}))) // => sizes grow as writers land
} // => handler ends: the write lock never crosses an await

// => list takes the read lock, clones, and renders the sorted ids
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => read borrows the book beside fellow readers: no writer is inside now
    let mut ids = state.book.read().unwrap().clone(); // => the read lock drops before sorting
    // => sort makes concurrent writes golden-stable: same ids, every run
    ids.sort(); // => o-1 through o-3, regardless of writer order
    // => the listing echoes the sorted book contents
    Json(json!({"orders": ids})) // => three ids in order, whatever the race said
} // => handler ends: readers share, writers queue, output stays stable

// => app builds the service once; every task reuses this constructor
fn app() -> Router {
    // => the book starts empty: three writes fill it below
    let state = AppState {
        book: Arc::new(RwLock::new(Vec::new())),
    }; // => empty book before the first post
    // => with_state moves the book into the router; handlers unpack clones
    Router::new()
        .route("/orders/{id}", post(add))
        .route("/orders", get(list))
        .with_state(state) // => write and read live one router apart
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the multithread runtime runs writers and readers at once
async fn main() {
    // => build once, share the router across three spawned writers
    let app = app(); // => the service under test, built by its constructor
    // => spawn three writers; each appends one id and drops its reply
    let mut tasks = Vec::new(); // => the join handles gather here
    // => three tasks stand in for three concurrent clients
    for n in 1..=3 {
        // => ids o-1 through o-3, one per task
        // => clone per task: oneshot consumes the router every call
        let router = app.clone(); // => cheap clone: routes and state are shared
        // => spawn runs one POST on the shared runtime beside its siblings
        tasks.push(tokio::spawn(async move {
            // => the writer owns its router clone
            // => one append per task: the id rides in the path
            let uri = format!("/orders/o-{n}"); // => o-1 through o-3, built per task
            // => Request::builder shapes a server-side request without a client
            let request = Request::builder()
                .method("POST")
                .uri(&uri)
                .body(Body::empty())
                .unwrap(); // => posts carry no payload here
            // => the reply is drained, not printed: sizes arrive jumbled anyway
            let response = router.oneshot(request).await.unwrap(); // => the write lands or the task panics
            // => drain the body so the response is fully consumed
            let _ = axum::body::to_bytes(response.into_body(), 65536)
                .await
                .unwrap(); // => sizes print once below, not three times
        })); // => writer ends: one append per task, exactly three appends
    } // => spawn loop ends: all three writers are racing now
    // => join every writer before the readers arrive
    for task in tasks {
        task.await.unwrap();
    } // => unwrap: a panicked writer fails the run loudly
    // => two sequential reads prove readers share the settled book
    for n in 1..=2 {
        // => read one and read two see the same three rows
        // => Request::builder shapes a server-side request without a client
        let request = Request::builder()
            .method("GET")
            .uri("/orders")
            .body(Body::empty())
            .unwrap(); // => the proof read after the join
        // => oneshot runs the read against the same shared book
        let response = app.clone().oneshot(request).await.unwrap(); // => the book holds three rows by now
        // => to_bytes collects the whole body with a generous in-memory cap
        let bytes = axum::body::to_bytes(response.into_body(), 65536)
            .await
            .unwrap(); // => into_body moves the stream out of the response
        // => one golden line per read: both reads agree on three rows
        println!("read-{n} -> {}", String::from_utf8_lossy(&bytes)); // => {"orders":["o-1","o-2","o-3"]}: readers share, writers queued
    } // => read loop ends: two reads, one stable book
} // => main ends: reads shared and writes queued, so the run is green
