// Example 42: In-Memory Store Stands In for Postgres.
// two backends honor one seam: the constructor picks, routes never change.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the trait object per handler call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use std::collections::HashMap; // => HashMap backs the second backend; keys sort before printing
use std::future::Future; // => Future names the boxed tail the trait returns
use std::pin::Pin; // => Pin keeps the boxed future movable across awaits
use std::sync::{Arc, Mutex}; // => Arc shares each backend; Mutex guards each map
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => OrderStore names the one seam handlers program against, not any backend
trait OrderStore: Send + Sync {
    // => boxed futures keep the trait object-safe without any extra crate
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>>; // => Send keeps the future runnable on the multithread runtime
} // => trait ends: one method, every backend honors it

// => VecStore keeps insertion order: the first backend behind the seam
struct VecStore {
    // => Mutex guards the vector because handlers run on many threads
    orders: Mutex<Vec<String>>, // => seeded per world, read on every call
} // => struct ends: order-preserving, like a fresh table scan

// => the first backend honors the seam by cloning under the lock
impl OrderStore for VecStore {
    // => &self borrows the backend; the boxed tail owns the cloned rows
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>> {
        // => clone under the lock, move the rows into the async tail
        let rows = self.orders.lock().unwrap().clone(); // => the lock drops before the first await
        // => Box::pin erases the tail type so callers see only the trait
        Box::pin(async move { rows }) // => insertion order survives the trip
    } // => list ends: the backend answers from memory, deterministically
} // => impl ends: VecStore is now swappable behind the trait

// => MapStore indexes by id: the second backend behind the same seam
struct MapStore {
    // => Mutex guards the map because handlers run on many threads
    orders: Mutex<HashMap<String, String>>, // => id to status, seeded per world
} // => struct ends: keyed access, like an indexed table

// => the second backend honors the seam by sorting before answering
impl OrderStore for MapStore {
    // => &self borrows the backend; the boxed tail owns the sorted rows
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>> {
        // => collect the ids under the lock, then sort for golden-stable output
        let mut rows: Vec<String> = self.orders.lock().unwrap().keys().cloned().collect(); // => HashMap order is random, so sort it away
        // => sort makes the map backend print exactly like the vec backend
        rows.sort(); // => deterministic order: the golden line never wobbles
        // => Box::pin erases the tail type so callers see only the trait
        Box::pin(async move { rows }) // => sorted ids arrive without any I/O at all
    } // => list ends: the backend answers from memory, deterministically
} // => impl ends: MapStore honors the same seam with different guts

// => AppState carries the seam, not any backend: handlers never name one
#[derive(Clone)] // => Clone shares the Arc, never the store behind it
struct AppState {
    // => dyn keeps the backend open: Postgres swaps in without touching a route
    store: Arc<dyn OrderStore>, // => the seam in state position
} // => struct ends: routes depend on the trait, constructors supply backends

// => list reads through the seam: the handler cannot tell vec from map
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => one await across the seam: the backend answers, whatever it is
    let orders = state.store.list().await; // => the trait answers; the handler renders
    // => the listing echoes the backend contents in backend order
    Json(json!({"orders": orders})) // => identical output from different backends
} // => handler ends: no backend type appears anywhere in this function

// => build_app wires the whole service around whichever backend the flag picks
fn build_app(use_map: bool) -> Router {
    // => the flag picks the backend: one line swaps the whole persistence story
    let store: Arc<dyn OrderStore> = if use_map {
        // => true takes the map backend below
        // => the map seeds two ids; sorting makes them print in order
        let mut seed = HashMap::new(); // => empty map first, rows next
        // => insert both rows before the backend moves into state
        seed.insert("o-1".to_owned(), "placed".to_owned()); // => first row: id to status
        // => the second row lands beside the first
        seed.insert("o-2".to_owned(), "paid".to_owned()); // => second row: id to status
        // => Arc::new erases the backend behind the shared seam
        Arc::new(MapStore {
            orders: Mutex::new(seed),
        }) // => map backend in, seam out
    } else {
        // => false takes the vec backend below
        // => the vec seeds the same two ids in insertion order
        Arc::new(VecStore {
            orders: Mutex::new(vec!["o-1".to_owned(), "o-2".to_owned()]),
        }) // => vec backend in, seam out
    }; // => store ends: one seam, two possible backends
    // => with_state moves the seam into the router; handlers unpack clones
    Router::new()
        .route("/orders", get(list))
        .with_state(AppState { store }) // => routes name the trait, never a backend
} // => constructor ends: the flag is the only line a Postgres swap touches

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, seam unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the picked backend answers across the seam
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both backends write a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per world: backend name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the routers and the checks
async fn main() {
    // => build two worlds from one constructor: vec backend and map backend
    let vec_world = build_app(false); // => the insertion-order backend
    // => the keyed backend stands beside it behind the same seam
    let map_world = build_app(true); // => the indexed backend with sorted reads
    // => the vec backend lists both rows in insertion order
    check(vec_world.clone(), "vec").await; // => Output: vec GET /orders -> 200 OK {"orders":["o-1","o-2"]}
    // => the map backend lists the same rows in sorted order
    check(map_world.clone(), "map").await; // => Output: map GET /orders -> 200 OK {"orders":["o-1","o-2"]}
} // => main ends: every check printed, so the run is green
