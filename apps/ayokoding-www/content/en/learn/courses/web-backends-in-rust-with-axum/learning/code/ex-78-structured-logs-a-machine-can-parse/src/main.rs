// Example 78: Structured Logs a Machine Can Parse.
// one JSON line per request: the log a pipeline can filter, count, and alert on.
use axum::{
    Router,
    body::Body,
    http::Request,
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
}; // => from_fn lifts the JSON logger into the stack
use serde_json::{Value, json}; // => json! renders each log line as parseable JSON
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => json_log prints one machine-readable line around every request
async fn json_log(req: Request<Body>, next: Next) -> Response {
    // => method and path are borrowed before next consumes the request
    let method = req.method().to_string(); // => owned text: the request moves below
    // => the path is borrowed beside the method for the same reason
    let path = req.uri().path().to_owned(); // => owned text: into the log line below
    // => the handler runs exactly here, wrapped by this logger
    let response = next.run(req).await; // => everything inside runs between borrow and print
    // => the status is borrowed before the response moves to the caller
    let status = response.status().as_u16(); // => the number pipelines filter on
    // => one JSON object per request: no timestamps, no thread names, no drift
    println!(
        "{}",
        json!({"event": "request", "method": method, "path": path, "status": status})
    ); // => the machine-readable line: parseable, countable, golden
    // => the response continues to the caller untouched
    response // => logging observes; it never rewrites
} // => middleware ends: JSON out, prose nowhere, pipelines happy

// => hello answers the single route the JSON logger wraps
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the logger exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: the logger prints around the handler on every call
    Router::new()
        .route("/hello", get(hello))
        .layer(middleware::from_fn(json_log)) // => structured logging in one layer
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process; the log line is the whole lesson
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri("/hello") // => the single path, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, the logger, and the handler exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the logger prints its JSON line around this call
    // => to_bytes drains the body so the response is fully consumed
    let _ = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => drained, not printed: the log line is the output
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, call twice, watch two parseable lines land in order
    let app = app(); // => the service under test, built by its constructor
    // => the first call logs its JSON line with status 200
    check(app.clone()).await; // => Output: {"event":"request","method":"GET","path":"/hello","status":200}
    // => the second call logs the identical shape: pipelines count these
    check(app.clone()).await; // => Output: the same JSON shape, counted twice
} // => main ends: two parseable lines, so the run is green
