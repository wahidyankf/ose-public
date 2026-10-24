// Example 77: Static Types at the Boundary.
// serde structs reject bad shapes at parse time in both frameworks.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds creation; Json parses the boundary struct
use serde::{Deserialize, Serialize}; // => Deserialize reads the boundary; Serialize writes it back
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Order is the boundary shape: the same struct parses requests and renders replies
#[derive(Deserialize, Serialize)] // => one struct, both directions: the boundary in one definition
struct Order {
    // => every order carries its client-chosen id across the boundary
    id: String, // => String keeps ids opaque on both sides of the wire
    // => the item names what the customer buys, spelled the same in and out
    item: String, // => required both ways: the struct is the contract
    // => qty counts how many; u32 rules out negatives before any logic runs
    qty: u32, // => the type rejects -1 with the framework's rejection, not ours
} // => struct ends: the HTTP boundary as a compile-time fact

// => create parses the boundary struct, then echoes it back with a 201
async fn create(Json(order): Json<Order>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: the boundary held before this line
    let echo = serde_json::to_value(&order).unwrap(); // => Serialize renders the same struct back out
    // => the echo proves the boundary round-trips without loss
    (StatusCode::CREATED, Json(json!({"order": echo}))) // => 201 with the round-tripped struct
} // => handler ends: Deserialize in, Serialize out, one struct both ways

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns the boundary; the struct rides both directions
    Router::new().route("/orders", post(create)) // => POST /orders round-trips the Order struct
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call in-process and prints its status line
async fn post_json(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri("/orders") // => the single creation path, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, boundary parsing, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the struct parses or the framework rejects
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON or text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => every path writes a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per call: sent body, status, reply
    println!("POST /orders {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, round-trip one good struct and one mistyped body
    let app = app(); // => the service under test, built by its constructor
    // => every field present and typed: the boundary holds and echoes with 201
    post_json(app.clone(), r#"{"id":"o-1","item":"pen","qty":2}"#).await; // => Output: 201 with the round-tripped order
    // => qty as a word breaks the u32 contract: the boundary rejects it
    post_json(app.clone(), r#"{"id":"o-2","item":"pen","qty":"many"}"#).await; // => Output: the framework rejection with its status
} // => main ends: every check printed, so the run is green
