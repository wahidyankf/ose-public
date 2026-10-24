// Example 20: Error Envelope Stays Consistent.
// one error type renders every failure as code plus message.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::{IntoResponse, Json},
    routing::get,
}; // => IntoResponse turns the error type into full responses
use serde_json::{Value, json}; // => json! builds the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppError names the two failures this service can report
enum AppError {
    // => the id names nothing in the store
    NoOrder, // => 404: absence, not a crash
    // => the transition breaks the workflow bounds
    BadStatus, // => 422: understood, but refused
} // => enum ends: every failure is one of these two variants

// => IntoResponse renders each variant as status plus the shared envelope
impl IntoResponse for AppError {
    // => self is consumed: each error answers exactly once
    fn into_response(self) -> axum::response::Response {
        // => each variant picks its code and its machine-readable code
        let (status, code) = match self {
            // => match keeps the mapping total: no silent variant
            AppError::NoOrder => (StatusCode::NOT_FOUND, "no_order"), // => 404 for absence
            AppError::BadStatus => (StatusCode::UNPROCESSABLE_ENTITY, "bad_status"), // => 422 for refusal
        }; // => the pair is decided: render it below
        // => every failure shares one envelope: code plus message
        (
            status,
            Json(json!({"code": code, "message": format!("request failed: {code}")})),
        )
            .into_response() // => the envelope never changes shape
    } // => render ends: failures are responses with a contract
} // => impl ends: anyhow-style anyhowwhere is banned; this type is the boundary

// => read fails with absence: the demo route for the 404 leg
async fn read() -> Result<Json<Value>, AppError> {
    // => Err leaves the handler early: no snapshot exists for this id
    Err(AppError::NoOrder) // => the envelope answers 404 below
} // => handler ends: Result keeps the happy path and the failure apart

// => promote fails with refusal: the demo route for the 422 leg
async fn promote() -> Result<Json<Value>, AppError> {
    // => Err leaves the handler early: the transition breaks the bounds
    Err(AppError::BadStatus) // => the envelope answers 422 below
} // => handler ends: one return type carries both outcomes

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => two routes demo the two variants through the same envelope
    Router::new()
        .route("/read", get(read))
        .route("/promote", get(promote)) // => absence and refusal live one router apart
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
    // => status names what happened; the body carries the shared envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: envelopes are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both failures write the envelope, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per request: method, path, status, envelope
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger absence and refusal through one envelope
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 inside the shared envelope
    check(app.clone(), "GET", "/read").await; // => Output: 404 {"code":"no_order","message":"request failed: no_order"}
    // => refusal answers 422 inside the same envelope shape
    check(app.clone(), "GET", "/promote").await; // => Output: 422 {"code":"bad_status","message":"request failed: bad_status"}
} // => main ends: every check printed, so the run is green
