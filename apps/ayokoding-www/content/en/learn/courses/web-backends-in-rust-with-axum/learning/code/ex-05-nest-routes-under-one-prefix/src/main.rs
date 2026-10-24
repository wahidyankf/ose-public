// Example 5: Nest Routes Under One Prefix.
// nest mounts a whole sub-service below a versioned path.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; nest mounts a sub-router below a prefix
use serde_json::{Value, json}; // => Value holds any JSON shape; json! builds it inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => users answers the versioned user listing below the prefix
async fn users() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"users": ["ada"]})) // => one user, always in this order
} // => handler ends: the prefix never appears inside the sub-router

// => orders answers the versioned order listing beside the users route
async fn orders() -> Json<Value> {
    // => a fixed snapshot keeps the output golden without any store
    Json(json!({"orders": ["o-1"]})) // => one order, always in this order
} // => handler ends: siblings share the prefix without knowing each other

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the versioned API lives in its own router with root-relative paths
    let api = Router::new()
        .route("/users", get(users))
        .route("/orders", get(orders)); // => siblings compose side by side at the sub-root
    // => nest mounts the whole API below /api/v1 in one move
    Router::new().nest("/api/v1", api) // => paths become /api/v1/users and /api/v1/orders
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
    }; // => unprefixed paths miss everything here
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check both nested routes plus the bare miss
    let app = app(); // => the service under test, built by its constructor
    // => the prefixed users route answers through the nest
    check(app.clone(), "GET", "/api/v1/users").await; // => Output: GET /api/v1/users -> 200 OK {"users":["ada"]}
    // => the prefixed orders route answers through the same nest
    check(app.clone(), "GET", "/api/v1/orders").await; // => Output: GET /api/v1/orders -> 200 OK {"orders":["o-1"]}
    // => the unprefixed path matches nothing: nest adds, never copies
    check(app.clone(), "GET", "/users").await; // => Output: GET /users -> 404 Not Found (empty body)
} // => main ends: every check printed, so the run is green
