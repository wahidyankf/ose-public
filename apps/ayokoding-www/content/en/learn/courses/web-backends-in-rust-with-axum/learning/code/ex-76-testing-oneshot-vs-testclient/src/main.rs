// Example 76: Testing Oneshot Versus TestClient.
// oneshot drives the router value; TestClient drives the app over transport.
use axum::{Router, body::Body, http::Request, response::Json, routing::get}; // => oneshot comes from tower: the test seam is generic
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => ServiceExt::oneshot is the entire testing technique

// => hello answers the single route both testing styles would drive
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract both styles assert
} // => handler ends: it never knows which test style called it

// => app builds the service once; the test below reuses this constructor
fn app() -> Router {
    // => the constructor is the seam: tests build the service, never dial it
    Router::new().route("/hello", get(hello)) // => GET /hello, reached in-process below
} // => constructor ends: wiring stays separate from traffic

// => check serves one request, asserts both halves, then prints the hold line
async fn check(app: Router) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/hello")
        .body(Body::empty())
        .unwrap(); // => the pinned call: no port, no transport
    // => oneshot runs routing and handlers exactly as live, inside this process
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => the status assert pins the code: a wrong code panics here, loudly
    assert_eq!(response.status().as_u16(), 200); // => 200 or red: no silent drift
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => the body assert pins the bytes: any drift panics with both sides shown
    assert_eq!(
        String::from_utf8_lossy(&bytes),
        r#"{"message":"hello, axum"}"#
    ); // => exact bytes: the contract both styles would pin
    // => holds prints only after both asserts passed: the proof, in one line
    println!("holds oneshot GET /hello -> 200 without a port, transport, or server"); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, hold the contract through the in-process stack
    let app = app(); // => the service under test, built by its constructor
    // => the holds line prints only because both asserts passed above
    check(app.clone()).await; // => Output: holds oneshot GET /hello -> 200 without a port
} // => main ends: asserts green and printed, so the run is green
