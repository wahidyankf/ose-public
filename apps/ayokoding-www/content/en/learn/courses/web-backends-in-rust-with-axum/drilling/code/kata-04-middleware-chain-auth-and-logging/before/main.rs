// Kata 04 starter: the auth gate stands alone. Requests are safe but invisible:
// no line says who knocked or what answered. TODO: add a logging layer beside
// auth so every call prints its method, path, and status around the handler.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Json, Response},
    routing::get,
}; // => from_fn lifts one gate today, two layers after the kata
use serde_json::{Value, json}; // => json! builds the secret and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => THE_TOKEN is the one bearer value the demo accepts
const THE_TOKEN: &str = "s3cret"; // => a constant keeps the check golden without any store

// => auth answers 401 early or lets the request through to the handler
async fn auth(req: Request<Body>, next: Next) -> Response {
    // => the bearer token rides in the Authorization header, if at all
    let ok = req
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        == Some(&format!("Bearer {THE_TOKEN}")); // => exact match: no prefix games, no fallbacks
    // => a miss answers now: the handler never runs for strangers
    if !ok {
        // => anonymous or wrong token takes this leg
        // => 401 says who you are is missing or wrong, in the shared envelope
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "unauthorized"})),
        )
            .into_response(); // => early answer: next never runs
    } // => token holds: fall through to the handler below
    // => next runs the handler and returns its response untouched
    next.run(req).await // => TODO: a logging layer must print around this call
} // => middleware ends: the gate works, its visibility is the kata

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the gate already ran

// => app builds the service once; the logging layer joins it when written
fn app() -> Router {
    // => TODO: wrap a second from_fn logging layer beside auth, outermost
    Router::new()
        .route("/secret", get(secret))
        .layer(middleware::from_fn(auth)) // => one layer today, a chain after the kata
} // => constructor ends: the chain is the kata

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, open the gate with the right token
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("GET")
        .uri("/secret")
        .header("authorization", "Bearer s3cret")
        .body(Body::empty())
        .unwrap(); // => the authed call the chain must log
    // => oneshot runs the gate and the handler: silent today, printed after the kata
    let response = app.oneshot(request).await.unwrap(); // => TODO: log lines bracket this call
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: today's silent answer the chain makes visible
    println!(
        "GET /secret -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ); // => the kata is done when log lines precede this
} // => main ends: the kata is done when todo is gone
