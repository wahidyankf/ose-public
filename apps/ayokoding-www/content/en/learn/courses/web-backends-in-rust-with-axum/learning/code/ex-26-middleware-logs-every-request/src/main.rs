// Example 26: Middleware Logs Every Request.
// from_fn wraps one handler: log the way in, run it, log the way out.
use axum::{
    Router,
    body::Body,
    http::Request,
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
}; // => middleware::from_fn lifts a function into a layer
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => logger prints one line on the way in and one on the way out
async fn logger(req: Request<Body>, next: Next) -> Response {
    // => the method and path are borrowed before next consumes the request
    let line_in = format!("-> {} {}", req.method(), req.uri().path()); // => the way in, without any timestamp
    // => println keeps the log deterministic: no clock, no thread name
    println!("{line_in}"); // => golden line one: the request arrived
    // => next runs the handler and every inner layer, then returns the response
    let response = next.run(req).await; // => the handler runs exactly here
    // => the status is borrowed before the response moves to the caller
    println!("<- {}", response.status()); // => golden line two: the answer left
    // => the response continues to the caller untouched
    response // => logging observes; it never rewrites
} // => middleware ends: two prints around one run

// => hello answers the single route the logging wraps
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the logger exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: every call passes the logger first
    Router::new()
        .route("/hello", get(hello))
        .layer(middleware::from_fn(logger)) // => from_fn lifts the function into the stack
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the logger prints the interesting lines
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the logger prints around this call
    // => to_bytes drains the body so the response is fully consumed
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the body line proves the handler ran between the two log lines
    println!("body {}", String::from_utf8_lossy(&bytes)); // => golden line three: what the handler wrote
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call once, watch the three lines land in order
    let app = app(); // => the service under test, built by its constructor
    // => the log lines bracket the handler body in call order
    check(app.clone(), "GET", "/hello").await; // => Output: -> GET /hello, <- 200 OK, body {"message":"hello, axum"}
} // => main ends: every check printed, so the run is green
