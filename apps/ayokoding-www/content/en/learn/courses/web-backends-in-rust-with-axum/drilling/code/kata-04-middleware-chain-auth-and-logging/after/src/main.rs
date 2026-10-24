// Kata 04 solution: logging wraps auth outermost; every call prints its line.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Json, Response},
    routing::get,
}; // => two from_fn layers: logging outside, auth inside
use serde_json::{Value, json}; // => json! builds the secret and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => THE_TOKEN is the one bearer value the demo accepts
const THE_TOKEN: &str = "s3cret"; // => a constant keeps the check golden without any store

// => logger prints one line on the way in and one on the way out
async fn logger(req: Request<Body>, next: Next) -> Response {
    // => the method and path are borrowed before next consumes the request
    println!("-> {} {}", req.method(), req.uri().path()); // => golden line: the request arrived
    // => next runs auth and the handler, then returns the response
    let response = next.run(req).await; // => auth answers early or the handler answers late
    // => the status is borrowed before the response moves to the caller
    println!("<- {}", response.status()); // => golden line: the answer left
    // => the response continues to the caller untouched
    response // => logging observes; it never rewrites
} // => middleware ends: the outer layer of the chain

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
    next.run(req).await // => the inner layer of the chain, hugging the handler
} // => middleware ends: the inner layer of the chain

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the chain already ran

// => app builds the service once; the chain order is the whole lesson
fn app() -> Router {
    // => auth added first hugs the handler; logging added last wraps outermost
    Router::new()
        .route("/secret", get(secret))
        .layer(middleware::from_fn(auth))
        .layer(middleware::from_fn(logger)) // => last added runs first: logging brackets auth
} // => constructor ends: the chain order prints itself below

// => check serves one guarded call and prints its status line
async fn check(app: Router, token: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/secret"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(value) = token {
        builder = builder.header("authorization", format!("Bearer {value}"));
    } // => the credential rides as one header
    // => an empty body keeps the call a pure chain probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs the chain and the handler: log lines bracket this call
    let response = app.oneshot(request).await.unwrap(); // => logger prints around auth and the handler
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: the answer the log lines bracketed above
    println!(
        "GET /secret token={} -> {status} {}",
        token.unwrap_or("(none)"),
        String::from_utf8_lossy(&bytes)
    ); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, drive the chain with the right token and none at all
    let app = app(); // => the service under test, built by its constructor
    // => the right token opens the gate inside the log lines
    check(app.clone(), Some("s3cret")).await; // => Output: log lines bracket 200 with the secret
    // => no token stops at the gate inside the same log lines
    check(app.clone(), None).await; // => Output: log lines bracket 401 with the envelope
} // => main ends: every check printed, so the run is green
