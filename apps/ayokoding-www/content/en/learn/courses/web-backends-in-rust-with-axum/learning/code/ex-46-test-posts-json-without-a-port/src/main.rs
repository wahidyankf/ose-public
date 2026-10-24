// Example 46: Test Posts JSON Without a Port.
// the JSON post helper is the workhorse: every creation test uses it.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds creation; the helper sets the JSON content type
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; u32 rules out negatives at parse time
    qty: u32, // => the type already rejects -1 before the handler runs
} // => struct ends: the request shape is now a compile-time fact

// => create echoes the parsed order back with the 201 the method promises
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: parsing finished before this line
    (
        StatusCode::CREATED,
        Json(json!({"id": order.id, "qty": order.qty})),
    ) // => the echo proves every field parsed
} // => handler ends: no manual JSON handling anywhere

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; Json rides along as the extractor
    Router::new().route("/orders", post(create)) // => POST /orders with a JSON body creates one order
} // => constructor ends: wiring stays separate from traffic

// => post_json is the workhorse every creation test copies: body in, line out
async fn post_json(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => creation always posts in this service
        .uri("/orders") // => the single creation path, with no host or port
        .header("content-type", "application/json") // => Json demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the JSON bytes ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, parsing, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries echo or message
    let status = response.status(); // => keep the code plus reason before the body moves
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
    // => build once, post one good body and one with the wrong type
    let app = app(); // => the service under test, built by its constructor
    // => well-formed JSON parses and echoes with a 201
    post_json(app.clone(), r#"{"id":"o-1","qty":2}"#).await; // => Output: 201 {"id":"o-1","qty":2}
    // => a string qty breaks the u32 contract: the extractor answers its rejection
    post_json(app.clone(), r#"{"id":"o-2","qty":"many"}"#).await; // => Output: the extractor rejection with its status
} // => main ends: every check printed, so the run is green
