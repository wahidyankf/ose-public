// Example 40: Config Arrives as Typed State.
// limits and currency ride in State: handlers read config, never constants.
use axum::{Router, body::Body, extract::State, http::Request, response::Json, routing::get}; // => State unpacks the typed config per handler call
use serde_json::{Value, json}; // => json! builds the priced reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ShopConfig names the two knobs operators tune without touching code
#[derive(Clone)] // => Clone copies two small values: cheaper than any Arc
struct ShopConfig {
    // => the currency every price renders in
    currency: &'static str, // => static keeps the config borrow-free
    // => the most units one line may carry
    max_qty: u32, // => the bound pricing enforces below
} // => struct ends: deployment facts as a compile-time shape

// => price renders one line total inside the configured currency and bound
async fn price(State(config): State<ShopConfig>) -> Json<Value> {
    // => the unit price is fixed for the demo; config shapes how it renders
    let total = 2 * 1500; // => two units at fifteen hundred each: fixed arithmetic
    // => the reply carries the total beside the knobs that shaped it
    Json(json!({"total": total, "currency": config.currency, "max_qty": config.max_qty})) // => config out, no constant duplicated
} // => handler ends: tuning the config retunes every reply

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the config seeds IDR and a bound of one hundred: one edit retunes the service
    Router::new()
        .route("/price", get(price))
        .with_state(ShopConfig {
            currency: "IDR",
            max_qty: 100,
        }) // => typed config in, magic constants out
} // => constructor ends: wiring stays separate from traffic

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
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, read the priced reply shaped by the config
    let app = app(); // => the service under test, built by its constructor
    // => the total renders in IDR beside the bound of one hundred
    check(app.clone(), "GET", "/price").await; // => Output: 200 {"total":3000,"currency":"IDR","max_qty":100}
} // => main ends: every check printed, so the run is green
