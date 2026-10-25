// Example 6: Group Related Routes Together.
// merge joins two small routers into one service.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => Router wires paths; merge joins two routers into one
use serde_json::json; // => json! builds each snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => user_routes owns every user path in one small router
fn user_routes() -> Router {
    // => one route today; the group grows without touching the orders file
    Router::new().route("/users", get(|| async { Json(json!({"users": ["ada"]})) })) // => a closure handler keeps the group to one line
} // => group ends: user paths live here and nowhere else

// => order_routes owns every order path in one small router
fn order_routes() -> Router {
    // => one route today; the group grows without touching the users file
    Router::new().route(
        "/orders",
        get(|| async { Json(json!({"orders": ["o-1"]})) }),
    ) // => a closure handler keeps the group to one line
} // => group ends: order paths live here and nowhere else

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => merge joins the groups: paths must not collide, or the build panics
    Router::new().merge(user_routes()).merge(order_routes()) // => two groups, one service, zero prefixes
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
    // => merged routes always write a body here, so the marker stays unused
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
    // => build once, check one route from each group
    let app = app(); // => the service under test, built by its constructor
    // => the users group answers its own path after the merge
    check(app.clone(), "GET", "/users").await; // => Output: GET /users -> 200 OK {"users":["ada"]}
    // => the orders group answers its own path through the same service
    check(app.clone(), "GET", "/orders").await; // => Output: GET /orders -> 200 OK {"orders":["o-1"]}
} // => main ends: every check printed, so the run is green
