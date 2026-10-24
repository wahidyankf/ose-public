// Example 11: Missing Field Rejects with 422.
// the Json extractor answers 422 before the handler sees a bad body.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds POST; the extractor decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys; the echo below returns only the id
    #[allow(dead_code)] // => parsed and required, but never read after this point
    item: String, // => required: a missing item fails before the handler runs
    // => qty counts how many; u32 rules out negatives at parse time
    #[allow(dead_code)] // => parsed and required, but never read after this point
    qty: u32, // => the type already rejects -1 with a 422
} // => struct ends: the request shape is now a compile-time fact

// => create echoes the parsed order back with the 201 the method promises
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => order is already typed here: parsing finished before this line
    (StatusCode::CREATED, Json(json!({"id": order.id}))) // => the echo proves the id parsed
} // => handler ends: the rejection path never reaches this line

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
    // => status names what happened; the body carries the framework message
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: rejection bodies are framework text
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => rejections always write a message here, so the marker stays unused
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
    // => build once, post one good body and one missing its qty
    let app = app(); // => the service under test, built by its constructor
    // => every field present: parsing succeeds and the echo answers 201
    post_json(
        app.clone(),
        "/orders",
        r#"{"id":"o-1","item":"pen","qty":2}"#,
    )
    .await; // => Output: 201 with the echoed id
    // => qty missing: the extractor answers 422 with a deterministic message
    post_json(app.clone(), "/orders", r#"{"id":"o-2","item":"pen"}"#).await; // => Output: 422 naming the missing field
} // => main ends: every check printed, so the run is green
