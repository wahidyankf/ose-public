// Example 2: Path Parameter Names a Resource.
// one segment of the path becomes a typed handler argument.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; Body carries bytes; Request builds calls
// => Json renders the reply; get binds the GET method to one handler
use axum::extract::Path; // => Path pulls typed segments out of the request path
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => user answers one resource read: the id arrives already parsed
async fn user(Path(id): Path<u32>) -> Json<Value> {
    // => u32 says ids are numbers; anything else never reaches this line
    Json(json!({"id": id, "name": format!("user-{id}")})) // => the resource contract: id plus its derived name
} // => handler ends: parsing happened before the first line ran

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => :id marks the segment axum parses into the Path argument
    Router::new().route("/users/{id}", get(user)) // => axum 0.8 spells captures with single braces
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
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
    }; // => rejections may carry framework text instead
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check twice: wiring stays separate from traffic
    let app = app(); // => the service under test, built by its constructor
    // => a numeric segment parses into u32 and reaches the handler
    check(app.clone(), "GET", "/users/42").await; // => Output: GET /users/42 -> 200 OK {"id":42,"name":"user-42"}
    // => a non-numeric segment fails parsing before the handler ever runs
    check(app.clone(), "GET", "/users/abc").await; // => Output: a 400 with the framework parse message
} // => main ends: every check printed, so the run is green
