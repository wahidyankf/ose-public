// Example 31: Body Limit Stops a Giant Upload.
// RequestBodyLimitLayer answers 413 before a huge body reaches the handler.
use axum::{Router, body::Body, http::Request, response::Json, routing::post}; // => post binds the upload route the limit guards
use serde_json::{Value, json}; // => json! builds the accepted reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket
use tower_http::limit::RequestBodyLimitLayer; // => the limit answers 413 past eight bytes

// => upload answers the small bodies the limit lets through
async fn upload(body: String) -> Json<Value> {
    // => String collects the whole body: reachable only below the limit
    Json(json!({"bytes": body.len()})) // => the echo proves the body arrived intact
} // => handler ends: giant bodies never reach this line

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => eight bytes is tiny on purpose: the demo trips the limit fast
    Router::new()
        .route("/upload", post(upload))
        .layer(RequestBodyLimitLayer::new(8)) // => past 8 bytes the layer answers 413
} // => constructor ends: wiring stays separate from traffic

// => post_body serves one upload in-process and prints its status line
async fn post_body(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => uploads always post in this service
        .uri("/upload") // => the single upload path, with no host or port
        .header("content-type", "text/plain") // => String accepts any body type
        .body(Body::from(body.to_owned())) // => the upload bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, the limit layer, and the handler exactly as live
    let response = app.oneshot(request).await.unwrap(); // => giant bodies stop at the layer with 413
    // => status names what happened; the body carries the echo or nothing
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: 413 bodies are empty
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the 413 leg carries no body, so the marker names that fact
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => small prints JSON, giant prints the marker
    // => one golden line per call: sent length, status, reply
    println!("POST /upload len={} -> {status} {shown}", body.len()); // => the harness compares this line with the golden file
} // => post_body ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, upload one small body and one giant one
    let app = app(); // => the service under test, built by its constructor
    // => five bytes pass the limit: the handler echoes the length
    post_body(app.clone(), "abcde").await; // => Output: POST /upload len=5 -> 200 OK {"bytes":5}
    // => one hundred bytes trip the limit: 413 with no body
    post_body(app.clone(), &"x".repeat(100)).await; // => Output: POST /upload len=100 -> 413 Payload Too Large (empty body)
} // => main ends: every check printed, so the run is green
