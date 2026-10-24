// Example 41: Store Trait Keeps Handlers Testable.
// handlers depend on Arc<dyn OrderStore>: fakes swap in without touching routes.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the trait object per handler call
use serde_json::{Value, json}; // => json! builds the listing reply inline
use std::future::Future; // => Future names the boxed tail the trait returns
use std::pin::Pin; // => Pin keeps the boxed future movable across awaits
use std::sync::{Arc, Mutex}; // => Arc shares the store; Mutex guards the vector inside
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => OrderStore names the one seam handlers program against, not any backend
trait OrderStore: Send + Sync {
    // => boxed futures keep the trait object-safe without any extra crate
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>>; // => Send keeps the future runnable on the multithread runtime
} // => trait ends: one method, every backend honors it

// => MemoryStore is the fake every test seeds: a locked vector, nothing else
struct MemoryStore {
    // => Mutex guards the vector because handlers run on many threads
    orders: Mutex<Vec<String>>, // => seeded per world below, read on every call
} // => struct ends: the test double with zero infrastructure

// => the fake honors the seam by cloning under the lock
impl OrderStore for MemoryStore {
    // => &self borrows the fake; the boxed tail owns the cloned rows
    fn list(&self) -> Pin<Box<dyn Future<Output = Vec<String>> + Send + '_>> {
        // => clone under the lock, move the rows into the async tail
        let rows = self.orders.lock().unwrap().clone(); // => the lock drops before the first await
        // => Box::pin erases the tail type so callers see only the trait
        Box::pin(async move { rows }) // => the rows arrive without any I/O at all
    } // => list ends: the fake answers from memory, deterministically
} // => impl ends: MemoryStore is now swappable behind the trait

// => AppState carries the seam, not the backend: handlers never name MemoryStore
#[derive(Clone)] // => Clone shares the Arc, never the store behind it
struct AppState {
    // => dyn keeps the backend open: Postgres swaps in without touching a route
    store: Arc<dyn OrderStore>, // => the seam in state position
} // => struct ends: routes depend on the trait, tests supply the fake

// => list reads through the seam: the handler cannot tell fake from Postgres
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => one await across the seam: the backend answers, whatever it is
    let orders = state.store.list().await; // => the trait answers; the handler renders
    // => the listing echoes the backend contents in backend order
    Json(json!({"orders": orders})) // => seeded per world below, read on every call
} // => handler ends: MemoryStore appears nowhere in this function

// => build_app wires the whole service from one seed behind the seam
fn build_app(seed: Vec<String>) -> Router {
    // => the fake seeds here; production would build its Postgres pool here instead
    let state = AppState {
        store: Arc::new(MemoryStore {
            orders: Mutex::new(seed),
        }),
    }; // => fake in, seam out
    // => with_state moves the seam into the router; handlers unpack clones
    Router::new().route("/orders", get(list)).with_state(state) // => routes name the trait, never the fake
} // => constructor ends: swapping backends means changing one line above

// => check serves one request in-process and prints its status line
async fn check(app: Router, world: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri("/orders") // => the single listing path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, seam unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the fake answers across the seam
    // => status names what happened; the body carries this world's listing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the listing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per world: world name, status, listing
    println!("{world} GET /orders -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the routers and the checks
async fn main() {
    // => build two worlds from one constructor: seeded fake and empty fake
    let seeded = build_app(vec!["o-1".to_owned()]); // => the world with one row
    // => the empty world starts from no rows at all
    let empty = build_app(vec![]); // => the world the tests grow themselves
    // => the seeded fake lists its row across the seam
    check(seeded.clone(), "seeded").await; // => Output: seeded GET /orders -> 200 OK {"orders":["o-1"]}
    // => the empty fake lists nothing: same seam, different backend contents
    check(empty.clone(), "empty").await; // => Output: empty GET /orders -> 200 OK {"orders":[]}
} // => main ends: every check printed, so the run is green
