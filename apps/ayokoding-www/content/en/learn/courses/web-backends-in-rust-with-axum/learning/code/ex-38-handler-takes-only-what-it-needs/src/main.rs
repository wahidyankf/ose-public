// Example 38: Handler Takes Only What It Needs.
// two small services carry different states: each handler unpacks its own kind.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks each service's own value
use serde_json::{Value, json}; // => json! builds each reply inline
use std::sync::{Arc, Mutex}; // => Arc shares the catalog; Mutex guards its vector
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Catalog is the read-heavy state the listing handler needs
#[derive(Clone)] // => Clone shares the Arc, never the vector
struct Catalog {
    // => the items the listing reads on every call
    items: Arc<Mutex<Vec<String>>>, // => one vector, many readers, one lock
} // => struct ends: the listing's whole world in one value

// => Limits is the config state the checkout handler needs
#[derive(Clone)] // => Clone copies two numbers: cheaper than any Arc
struct Limits {
    // => the most units one line may carry
    max_qty: u32, // => the bound the handler enforces
    // => the currency every price renders in
    currency: &'static str, // => static keeps the config borrow-free
} // => struct ends: the checkout's whole world in one value

// => items reads the catalog and nothing else: its signature proves it
async fn items(State(catalog): State<Catalog>) -> Json<Value> {
    // => lock borrows the vector for the shortest possible moment
    let items = catalog.items.lock().unwrap().clone(); // => clone under the lock, render outside it
    // => the listing echoes the catalog in store order
    Json(json!({"items": items})) // => seeded once below, read on every call
} // => handler ends: Limits is not even named here

// => checkout reads the limits and nothing else: its signature proves it
async fn checkout(State(limits): State<Limits>) -> Json<Value> {
    // => the handler renders the bound it enforces, in its currency
    Json(json!({"max_qty": limits.max_qty, "currency": limits.currency})) // => config out, no store touched
} // => handler ends: Catalog is not even named here

// => catalog_app wires the listing service with its catalog state
fn catalog_app() -> Router {
    // => the catalog seeds one item; the listing handler takes only this
    Router::new()
        .route("/items", get(items))
        .with_state(Catalog {
            items: Arc::new(Mutex::new(vec!["pen".to_owned()])),
        }) // => one state kind per service
} // => constructor ends: routes and their state leave together

// => checkout_app wires the checkout service with its limits state
fn checkout_app() -> Router {
    // => the limits seed one bound; the checkout handler takes only this
    Router::new()
        .route("/checkout", get(checkout))
        .with_state(Limits {
            max_qty: 100,
            currency: "IDR",
        }) // => a different state kind for a different concern
} // => constructor ends: each service owns exactly what its handlers need

// => check serves one request in-process and prints its status line
async fn check(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => reads always get in this service
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones this service's value for the call
    // => status names what happened; the body carries this service's reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both services write a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per request: path, status, body
    println!("GET {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the services and the checks
async fn main() {
    // => build two small services: catalog state for one, limits for the other
    let catalog = catalog_app(); // => the listing world, built by its constructor
    // => the checkout world stands beside it with its own state kind
    let checkout = checkout_app(); // => the config world, built by its constructor
    // => the listing reads its catalog and knows nothing of limits
    check(catalog.clone(), "/items").await; // => Output: GET /items -> 200 OK {"items":["pen"]}
    // => checkout reads its limits and knows nothing of the catalog
    check(checkout.clone(), "/checkout").await; // => Output: GET /checkout -> 200 OK {"max_qty":100,"currency":"IDR"}
} // => main ends: every check printed, so the run is green
