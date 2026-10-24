// Example 32: Errors Become JSON with One Type.
// four failures share one envelope through a single IntoResponse impl.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::{IntoResponse, Json},
    routing::get,
}; // => IntoResponse renders every variant as status plus envelope
use serde_json::{Value, json}; // => json! builds the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => AppError names the four failures this service reports
enum AppError {
    // => the id names nothing in the store
    NoOrder, // => 404: absence, not a crash
    // => the body parsed but the qty breaks the bounds
    BadQty, // => 422: understood, but refused
    // => the caller knocked without credentials
    Unauthorized, // => 401: identity missing or wrong
    // => the store behind the handler gave up
    StoreDown, // => 503: retry later, not now
} // => enum ends: every failure is one of these four variants

// => IntoResponse renders each variant as status plus the shared envelope
impl IntoResponse for AppError {
    // => self is consumed: each error answers exactly once
    fn into_response(self) -> axum::response::Response {
        // => each variant picks its code and its machine-readable code
        let (status, code) = match self {
            // => match keeps the mapping total: no silent variant
            AppError::NoOrder => (StatusCode::NOT_FOUND, "no_order"), // => 404 for absence
            AppError::BadQty => (StatusCode::UNPROCESSABLE_ENTITY, "bad_qty"), // => 422 for refusal
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized"), // => 401 for strangers
            AppError::StoreDown => (StatusCode::SERVICE_UNAVAILABLE, "store_down"), // => 503 for outage
        }; // => the pair is decided: render it below
        // => every failure shares one envelope: code plus message
        (
            status,
            Json(json!({"code": code, "message": format!("request failed: {code}")})),
        )
            .into_response() // => the envelope never changes shape
    } // => render ends: failures are responses with a contract
} // => impl ends: this type is the whole error boundary

// => fail answers with whichever variant its path names
async fn fail(
    axum::extract::Path(which): axum::extract::Path<String>,
) -> Result<Json<Value>, AppError> {
    // => the path picks the variant: one route demos all four failures
    match which.as_str() {
        // => &str keeps the four arms readable
        "missing" => Err(AppError::NoOrder), // => absence answers 404 below
        "qty" => Err(AppError::BadQty),      // => refusal answers 422 below
        "anon" => Err(AppError::Unauthorized), // => strangers answer 401 below
        _ => Err(AppError::StoreDown),       // => everything else is an outage: 503 below
    } // => match ends: every arm leaves through the envelope
} // => handler ends: one return type carries all five outcomes

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route demos the whole error type through its path segment
    Router::new().route("/fail/{which}", get(fail)) // => GET /fail/missing answers 404, and so on
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("GET") // => the single verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing and the error type exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the envelope renders for every variant
    // => status names what happened; the body carries the shared envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: envelopes are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every variant writes the envelope, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per request: path, status, envelope
    println!("GET {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, trigger all four variants through one envelope
    let app = app(); // => the service under test, built by its constructor
    // => absence answers 404 inside the shared envelope
    check(app.clone(), "/fail/missing").await; // => Output: 404 {"code":"no_order","message":"request failed: no_order"}
    // => refusal answers 422 inside the same envelope shape
    check(app.clone(), "/fail/qty").await; // => Output: 422 {"code":"bad_qty","message":"request failed: bad_qty"}
    // => strangers answer 401 inside the same envelope shape
    check(app.clone(), "/fail/anon").await; // => Output: 401 {"code":"unauthorized","message":"request failed: unauthorized"}
    // => outage answers 503 inside the same envelope shape
    check(app.clone(), "/fail/boom").await; // => Output: 503 {"code":"store_down","message":"request failed: store_down"}
} // => main ends: every check printed, so the run is green
