// Example 1: Hello Route Returns JSON.
// one method plus one path maps to one handler.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; Body carries bytes; Request builds calls
// => Json renders the reply; get binds the GET method to one handler
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => hello answers the one route this service promises
async fn hello() -> Json<Value> {
    // => Json sets the content type and renders the body in one move
    Json(json!({"message": "hello, axum"})) // => the greeting contract every check asserts
} // => handler ends: a pure function from request to response

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => Router::new starts empty; route adds one method plus one path
    Router::new().route("/hello", get(hello)) // => GET /hello runs hello; nothing else is wired
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
// => oneshot keeps the whole exchange inside this process: no socket, no port
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test: GET, POST, and friends
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => an empty body still needs a visible marker, or the line ends mid-air
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => 404s carry no body, so name that fact
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check twice: wiring stays separate from traffic
    let app = app(); // => the service under test, built by its constructor
    // => the known route answers 200 with the greeting contract
    check(app.clone(), "GET", "/hello").await; // => Output: GET /hello -> 200 OK {"message":"hello, axum"}
    // => unknown paths fall through to the 404 fallback with an empty body
    check(app.clone(), "GET", "/goodbye").await; // => Output: GET /goodbye -> 404 Not Found (empty body)
} // => main ends: every check printed, so the run is green
