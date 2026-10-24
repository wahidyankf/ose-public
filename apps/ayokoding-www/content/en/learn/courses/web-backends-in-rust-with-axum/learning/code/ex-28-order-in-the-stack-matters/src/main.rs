// Example 28: Order in the Stack Matters.
// layers wrap outside-in: the last layer added runs first on the way in.
use axum::{
    Router,
    body::Body,
    http::Request,
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
}; // => two from_fn layers bracket the handler in stack order
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => outer prints its entry first and its exit last: it wraps everything
async fn outer(req: Request<Body>, next: Next) -> Response {
    // => entry prints before the inner stack runs
    println!("enter outer"); // => golden line one: the outside layer started
    // => inner layers and the handler run exactly here
    let response = next.run(req).await; // => everything inside runs between the two prints
    // => exit prints after the inner stack answered
    println!("exit outer"); // => golden line four: the outside layer finished
    // => the response continues outward untouched
    response // => layers observe by default; rewriting is opt-in
} // => outer ends: first in, last out

// => inner prints its entry second and its exit third: it hugs the handler
async fn inner(req: Request<Body>, next: Next) -> Response {
    // => entry prints after outer but before the handler
    println!("enter inner"); // => golden line two: the inside layer started
    // => the handler runs exactly here, wrapped by both layers
    let response = next.run(req).await; // => the handler runs between the two prints
    // => exit prints after the handler but before outer
    println!("exit inner"); // => golden line three: the inside layer finished
    // => the response continues outward untouched
    response // => layers observe by default; rewriting is opt-in
} // => inner ends: last in, first out

// => hello answers the single route both layers wrap
async fn hello() -> Json<Value> {
    // => the handler runs between the four layer prints
    println!("handler"); // => golden line: the middle of the onion
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the layers exist

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the last layer added wraps outermost: add inner first, outer second
    Router::new()
        .route("/hello", get(hello))
        .layer(middleware::from_fn(inner))
        .layer(middleware::from_fn(outer)) // => outer runs first in, last out: onion order
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the prints are the whole lesson
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri("/hello") // => the single path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, both layers, and the handler exactly as live
    let _ = app.oneshot(request).await.unwrap(); // => the five prints above are the golden output
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call once, watch the onion print in stack order
    let app = app(); // => the service under test, built by its constructor
    // => enter outer, enter inner, handler, exit inner, exit outer
    check(app.clone()).await; // => Output: the five lines in onion order
} // => main ends: every check printed, so the run is green
