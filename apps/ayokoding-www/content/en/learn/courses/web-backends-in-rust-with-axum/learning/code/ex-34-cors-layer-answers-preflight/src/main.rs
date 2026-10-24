// Example 34: CORS Layer Answers Preflight.
// CorsLayer permits the listed origin before any handler runs.
use axum::{
    Router,
    body::Body,
    http::{HeaderValue, Method, Request},
    response::Json,
    routing::get,
}; // => Method names OPTIONS for the preflight probe
use serde_json::{Value, json}; // => json! builds the hello body inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket
use tower_http::cors::{AllowOrigin, Any, CorsLayer}; // => CorsLayer declares the allowed origin; the browser enforces the match

// => hello answers the single route the CORS layer guards
async fn hello() -> Json<Value> {
    // => a fixed body keeps the output golden without any store
    Json(json!({"message": "hello, axum"})) // => the greeting contract
} // => handler ends: it never knows the CORS layer exists

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => the predicate permits one origin: matches emit the header, strangers get none
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(|origin: &HeaderValue, _| {
            origin.as_bytes() == b"https://app.example"
        }))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any); // => one origin, two verbs, any header
    // => layer wraps the route: preflights stop here, real calls pass through
    Router::new().route("/hello", get(hello)).layer(cors) // => CORS runs before the handler on every call
} // => constructor ends: wiring stays separate from traffic

// => preflight serves one OPTIONS probe and prints status plus the allow header
async fn preflight(app: Router, origin: &str) {
    // => Request::builder shapes a server-side preflight without a client
    let request = Request::builder() // => start from an empty request builder
        .method("OPTIONS") // => preflights always probe with OPTIONS
        .uri("/hello") // => the route under probe, with no host or port
        .header("origin", origin) // => the calling origin the layer judges
        .header("access-control-request-method", "GET") // => the verb the browser wants to use
        .body(Body::empty()) // => preflights carry no payload
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing and the CORS layer exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the layer answers: the handler never runs
    // => status plus the allow-origin echo are the two preflight promises
    let status = response.status(); // => keep the code plus reason before the parts move
    // => allow-origin echoes the permitted origin or stays absent for strangers
    let allowed = response
        .headers()
        .get("access-control-allow-origin")
        .map(|v| v.to_str().unwrap().to_owned())
        .unwrap_or("(none)".to_owned()); // => owned text keeps the print total
    // => one golden line: sent origin, status, allowed origin
    println!("OPTIONS /hello origin={origin} -> {status} allow_origin={allowed}"); // => the harness compares this line with the golden file
} // => preflight ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, probe with the listed origin and one stranger
    let app = app(); // => the service under test, built by its constructor
    // => the listed origin passes: 200 with the allow header naming it
    preflight(app.clone(), "https://app.example").await; // => Output: 200 allow_origin=https://app.example
    // => the stranger gets 200 with no allow header: the browser blocks that call
    preflight(app.clone(), "https://evil.example").await; // => Output: 200 allow_origin=(none): declared, not permitted
} // => main ends: every check printed, so the run is green
