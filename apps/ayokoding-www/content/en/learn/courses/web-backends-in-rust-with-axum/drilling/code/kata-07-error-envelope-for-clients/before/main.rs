// Kata 07 starter: failures answer as bare strings with scattered codes. Clients
// cannot switch on prose. TODO: add an AppError enum with NoOrder and BadStatus,
// implement IntoResponse with the shared code-plus-message envelope, and return
// Result<Json, AppError> from both handlers.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::get,
}; // => IntoResponse joins these imports when the kata lands
use serde_json::{Value, json}; // => json! builds the snapshot the happy legs echo
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => read answers the hit with a snapshot and the miss with bare prose
async fn read() -> (StatusCode, String) {
    // => TODO: Err(AppError::NoOrder) replaces this prose with the envelope
    (StatusCode::NOT_FOUND, "no such order".to_owned()) // => prose today: unparseable, untestable as a contract
} // => handler ends: the code is right, the shape is the kata

// => promote answers the refusal with bare prose: TODO envelopes it too
async fn promote() -> (StatusCode, String) {
    // => TODO: Err(AppError::BadStatus) replaces this prose with the envelope
    (
        StatusCode::UNPROCESSABLE_ENTITY,
        "bad transition".to_owned(),
    ) // => prose today: the envelope unifies it
} // => handler ends: two prose shapes, one envelope after the kata

// => app builds the service once; the envelope joins it when written
fn app() -> Router {
    // => two routes demo the two prose failures the kata unifies
    Router::new()
        .route("/read", get(read))
        .route("/promote", get(promote)) // => absence and refusal live one router apart
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri(uri)
        .body(Body::empty())
        .unwrap(); // => one failure leg as a live request
    // => oneshot runs the prose failure exactly as live
    let response = app.oneshot(request).await.unwrap(); // => TODO: the envelope renders for both legs below
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: today's prose the envelope replaces
    println!("GET {uri} -> {status} {}", String::from_utf8_lossy(&bytes)); // => the kata is done when both legs print envelopes
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger both prose failures the kata unifies
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 as prose today, envelope after the kata
    check(app.clone(), "/read").await; // => the kata is done when this prints the no_order envelope
    // => refusal answers 422 as prose today, envelope after the kata
    check(app.clone(), "/promote").await; // => the kata is done when this prints the bad_status envelope
} // => main ends: the kata is done when todo is gone
