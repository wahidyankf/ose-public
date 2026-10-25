// Example 24: Redirect Points at the New Path.
// Redirect::permanent answers 308 with the Location of the moved resource.
use axum::{Router, body::Body, http::Request, response::Redirect, routing::get}; // => Redirect builds the 308 plus Location in one move
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => old_orders answers the retired path with a permanent redirect
async fn old_orders() -> Redirect {
    // => permanent says clients may cache this move and update bookmarks
    Redirect::permanent("/v2/orders") // => 308 plus Location: /v2/orders
} // => handler ends: the old path keeps no logic, only the pointer

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one retired route points at the new address
    Router::new().route("/v1/orders", get(old_orders)) // => GET /v1/orders moves permanently to /v2/orders
} // => constructor ends: wiring stays separate from traffic

// => check serves one redirect in-process and prints status plus location
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status and location are the two promises of a redirect
    let status = response.status(); // => keep the code plus reason before the parts move
    // => Location tells the client where the resource moved to
    let location = response.headers()["location"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => one golden line: method, old path, status, new address
    println!("{method} {uri} -> {status} location={location}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, follow the retired path to its pointer
    let app = app(); // => the service under test, built by its constructor
    // => the old path answers 308 with the new address in Location
    check(app.clone(), "GET", "/v1/orders").await; // => Output: GET /v1/orders -> 308 Permanent Redirect location=/v2/orders
} // => main ends: every check printed, so the run is green
