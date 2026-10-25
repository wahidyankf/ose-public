// Example 50: Test Covers Middleware In-Process.
// the auth gate proves both legs through oneshot: no socket, no test server.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Json, Response},
    routing::get,
}; // => from_fn lifts the gate into the stack under test
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
    // => layer wraps the route: the gate under test stands in front
    Router::new()
        .route("/secret", get(secret))
        .layer(middleware::from_fn(auth)) // => the same wiring production serves
} // => constructor ends: tests drive the real stack, not a double

// => check serves one guarded call, asserts its status, then prints the hold line
async fn check(app: Router, token: Option<&str>, want: u16) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/secret"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(value) = token {
        builder = builder.header("authorization", format!("Bearer {value}"));
    } // => the credential rides as one header
    // => an empty body keeps the call a pure gate probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, the gate, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the gate answers early or the handler answers late
    // => the status assert pins the leg: a wrong code panics with the token shown
    assert_eq!(response.status().as_u16(), want, "token {:?}", token); // => want or red: the message names the failing leg
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => holds prints only after the assert passed: the proof, in one line
    println!(
        "holds GET /secret token={} -> {want} {text}",
        token.unwrap_or("(none)")
    ); // => the harness compares this line with the golden file
} // => check ends: asserts first, prints after, red on any drift

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, prove both gate legs through the real stack
    let app = app(); // => the service under test, built by its constructor
    // => the right token opens the gate: 200 holds with the secret
    check(app.clone(), Some("s3cret"), 200).await; // => Output: holds with 200 and the secret
    // => the wrong token stops at the gate: 401 holds with the envelope
    check(app.clone(), Some("nope"), 401).await; // => Output: holds with 401 and the envelope
    // => no token stops at the same gate: 401 holds with the envelope
    check(app.clone(), None, 401).await; // => Output: holds with 401 and the envelope
} // => main ends: asserts green and printed, so the run is green
