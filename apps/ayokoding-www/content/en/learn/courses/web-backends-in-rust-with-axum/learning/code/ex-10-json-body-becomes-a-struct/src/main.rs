// Example 10: JSON Body Becomes a Struct.
// Json parses the request body into a typed value before the handler runs.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds POST; StatusCode names 201 beside the body
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys
    item: String, // => required: a missing item fails before the handler runs
    // => qty counts how many; u32 rules out negatives at parse time
    qty: u32, // => the type already rejects -1 with a 422
} // => struct ends: the request shape is now a compile-time fact

// => create echoes the parsed order back with the 201 the method promises
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: parsing finished before this line
    (
        StatusCode::CREATED,
        Json(json!({"id": order.id, "item": order.item, "qty": order.qty})),
    ) // => the echo proves every field parsed
} // => handler ends: no manual JSON handling anywhere

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; Json rides along as the extractor
    Router::new().route("/orders", post(create)) // => POST /orders with a JSON body creates one order
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call in-process and prints its status line
async fn post_json(app: Router, uri: &str, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri(uri) // => the path under test, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries what the handler wrote
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => creation always writes a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per call: path, sent body, status, reply
    println!("POST {uri} {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post one well-formed order
    let app = app(); // => the service under test, built by its constructor
    // => every field present and typed: parsing succeeds and the echo answers 201
    post_json(
        app.clone(),
        "/orders",
        r#"{"id":"o-1","item":"pen","qty":2}"#,
    )
    .await; // => Output: 201 with the echoed order
} // => main ends: every check printed, so the run is green
