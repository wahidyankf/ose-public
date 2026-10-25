// Example 73: Middleware Tower Layers Versus ASGI Stack.
// from_fn wraps axum routes; FastAPI wraps the ASGI app with BaseHTTPMiddleware.
use axum::{
    Router,
    body::Body,
    http::Request,
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
}; // => from_fn lifts the timing function into the stack
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => stamp prints one deterministic marker around the handler: no clock inside
async fn stamp(req: Request<Body>, next: Next) -> Response {
    // => the entry marker prints before the inner stack runs
    println!("enter stamp"); // => golden line one: the layer started
    // => the handler runs exactly here, wrapped by this layer
    let response = next.run(req).await; // => everything inside runs between the two prints
    // => the exit marker prints after the handler answered
    println!("exit stamp"); // => golden line three: the layer finished
    // => the response continues outward untouched
    response // => layers observe by default; rewriting is opt-in
} // => middleware ends: two markers around one run, zero timestamps

// => hello answers the single route the stamp layer wraps
async fn hello() -> Json<Value> {
    // => the handler runs between the two layer markers
    println!("handler"); // => golden line two: the middle of the stack
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the layer exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: the stamp runs around the handler on every call
    Router::new()
        .route("/hello", get(hello))
        .layer(middleware::from_fn(stamp)) // => from_fn lifts the function into the tower stack
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the markers are the whole lesson
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri("/hello") // => the single path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, the layer, and the handler exactly as live
    let _ = app.oneshot(request).await.unwrap(); // => the three markers above are the golden output
    // => the body line proves the handler ran between the two markers
    println!("served GET /hello with the stamp layer"); // => golden line four: the call the markers bracket
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call once, watch the stack print in wrap order
    let app = app(); // => the service under test, built by its constructor
    // => enter stamp, handler, exit stamp: the tower onion in three lines
    check(app.clone()).await; // => Output: the three markers plus the served line
} // => main ends: every check printed, so the run is green
