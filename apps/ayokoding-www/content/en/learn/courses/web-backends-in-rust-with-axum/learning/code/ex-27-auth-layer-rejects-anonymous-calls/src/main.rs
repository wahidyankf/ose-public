// Example 27: Auth Layer Rejects Anonymous Calls.
// middleware can answer early: no token, no handler, one 401 envelope.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Json, Response},
    routing::get,
}; // => from_fn lifts auth into the stack beside the route
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
    next.run(req).await // => auth observes the pass leg and rewrites nothing
} // => middleware ends: one gate, two outcomes, zero handler knowledge

// => secret answers the guarded route only authed callers ever reach
async fn secret() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"secret": "the-cake-is-documented"})) // => proof the gate opened
} // => handler ends: it trusts the gate already ran

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: auth runs before the handler on every call
    Router::new()
        .route("/secret", get(secret))
        .layer(middleware::from_fn(auth)) // => the gate stands in front of the secret
} // => constructor ends: wiring stays separate from traffic

// => check serves one guarded call and prints its status line
async fn check(app: Router, token: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/secret"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(value) = token {
        builder = builder.header("authorization", format!("Bearer {value}"));
    } // => the credential rides as one header
    // => an empty body keeps the call a pure gate probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, middleware, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => auth answers early or the handler answers late
    // => status names what happened; the body carries secret or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => both legs write a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line: sent token, status, reply
    println!(
        "GET /secret token={} -> {status} {shown}",
        token.unwrap_or("(none)")
    ); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, probe the gate with three credentials
    let app = app(); // => the service under test, built by its constructor
    // => the right token opens the gate to the secret
    check(app.clone(), Some("s3cret")).await; // => Output: 200 {"secret":"the-cake-is-documented"}
    // => the wrong token stops at the gate with the envelope
    check(app.clone(), Some("nope")).await; // => Output: 401 {"error":"unauthorized"}
    // => no token stops at the same gate with the same envelope
    check(app.clone(), None).await; // => Output: 401 {"error":"unauthorized"}
} // => main ends: every check printed, so the run is green
