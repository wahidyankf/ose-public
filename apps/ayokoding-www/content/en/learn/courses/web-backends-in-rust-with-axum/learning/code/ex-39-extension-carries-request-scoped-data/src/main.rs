// Example 39: Extension Carries Request-Scoped Data.
// middleware inserts one User per request; the handler reads it back out.
use axum::{
    Extension, Router,
    body::Body,
    http::Request,
    middleware::{self, Next},
    response::{Json, Response},
    routing::get,
}; // => Extension moves per-request values from layer to handler
use serde_json::{Value, json}; // => json! builds the greeting reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => User is the request-scoped identity one middleware mints per call
#[derive(Clone)] // => Extension requires Clone to hand the value to the handler
struct User {
    // => the caller name the gate resolved from the token
    name: String, // => owned: each request carries its own copy
} // => struct ends: per-request data, never shared state

// => identify resolves the token into a User and inserts it for the handler
async fn identify(mut req: Request<Body>, next: Next) -> Response {
    // => the token rides in x-user for this demo; a real gate would verify more
    let name = req
        .headers()
        .get("x-user")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("guest")
        .to_owned(); // => missing header means the guest identity
    // => insert moves the User into the request extensions beside the body
    req.extensions_mut().insert(User { name }); // => the handler reads this back by type below
    // => the handler runs with the identity waiting in its extensions
    next.run(req).await // => identifying observes the pass leg and rewrites nothing else
} // => middleware ends: one identity minted per request, zero globals

// => hello greets the identity the middleware resolved for this request
async fn hello(Extension(user): Extension<User>) -> Json<Value> {
    // => the User arrives by type: no header parsing lives in the handler
    Json(json!({"hello": user.name})) // => ada hears ada, guests hear guest
} // => handler ends: identity in, greeting out, no gate code

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => layer wraps the route: identify runs before the handler on every call
    Router::new()
        .route("/hello", get(hello))
        .layer(middleware::from_fn(identify)) // => the identity hop stands in front of the greeting
} // => constructor ends: wiring stays separate from traffic

// => check serves one identified call and prints its status line
async fn check(app: Router, user: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/hello"); // => path first; the token follows when present
    // => Some carries the token under test; None sends no header at all
    if let Some(name) = user {
        builder = builder.header("x-user", name);
    } // => the credential rides as one header
    // => an empty body keeps the call a pure identity probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, the identity layer, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => identify mints the User for this call
    // => status names what happened; the body carries the personal greeting
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every call greets somebody, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line: sent token, status, greeting
    println!(
        "GET /hello x-user={} -> {status} {shown}",
        user.unwrap_or("(none)")
    ); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, greet the named caller and the guest
    let app = app(); // => the service under test, built by its constructor
    // => the named token resolves to ada and the greeting says so
    check(app.clone(), Some("ada")).await; // => Output: 200 {"hello":"ada"}
    // => no token resolves to guest: the handler still answers 200
    check(app.clone(), None).await; // => Output: 200 {"hello":"guest"}
} // => main ends: every check printed, so the run is green
