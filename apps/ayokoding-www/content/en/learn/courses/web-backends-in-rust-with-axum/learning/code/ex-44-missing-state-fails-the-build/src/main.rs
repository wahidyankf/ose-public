// Example 44: Missing State Fails the Build.
// axum 0.8 types the router by its state: forgetting with_state fails compilation.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the config with_state provides below
use serde_json::{Value, json}; // => json! builds the priced reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ShopConfig names the config the handler demands and the router provides
#[derive(Clone)] // => Clone shares the config cheaply on every call
struct ShopConfig {
    // => the currency every price renders in
    currency: &'static str, // => static keeps the config borrow-free
} // => struct ends: demanded by the handler, provided by the router

// => price demands the config the router provides through with_state
async fn price(State(config): State<ShopConfig>) -> Json<Value> {
    // => the config arrives unwrapped: with_state satisfied the type below
    Json(json!({"currency": config.currency})) // => the reply the unwired build never reaches
} // => handler ends: correct code, wired service

// => app builds the service once, wiring the state the handler demands
fn app() -> Router {
    // => with_state provides ShopConfig: the types line up, so this compiles
    Router::new()
        .route("/price", get(price))
        .with_state(ShopConfig { currency: "IDR" }) // => drop with_state and the build fails, not the request
} // => constructor ends: the wiring the compiler checks

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, state unpacking, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => State clones the config for this call
    // => status names what happened; the body carries the priced reply
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => pricing always writes a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the priced reply the wired state provides
    let app = app(); // => the wired service under test
    // => with_state satisfied the compiler: the reply answers 200
    check(app.clone(), "GET", "/price").await; // => Output: GET /price -> 200 OK {"currency":"IDR"}
    // => the lesson: dropping with_state fails the build with E0308, never a request
    println!("unwired: Router::new().route(\"/price\", get(price)) fails E0308, not a request"); // => the takeaway, printed as the last line
} // => main ends: wired once, proven once, so the run is green
