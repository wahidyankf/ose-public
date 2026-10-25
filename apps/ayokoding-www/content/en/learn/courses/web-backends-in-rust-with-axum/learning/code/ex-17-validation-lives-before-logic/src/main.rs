// Example 17: Validation Lives Before Logic.
// one guard function keeps every rule beside the handler, before the store.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds POST; the guard decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => the client-chosen id; blank means the client sent nothing to track
    id: String, // => non-empty is a business rule, not a type rule
    // => the item names what the customer buys
    item: String, // => non-empty for the same reason: nameless lines ship nowhere
    // => qty counts how many; the guard bounds it to the orderable range
    qty: u32, // => u32 already rejects negatives at parse time
} // => struct ends: the request shape is now a compile-time fact

// => guard enforces every business rule in one place, before any logic runs
fn guard(order: &CreateOrder) -> Result<(), &'static str> {
    // => blank ids track nothing, so they stop here with their own code
    if order.id.trim().is_empty() {
        return Err("id_required");
    } // => the code clients switch on
    // => blank items ship nowhere, so they stop here too
    if order.item.trim().is_empty() {
        return Err("item_required");
    } // => one rule per line, one code per rule
    // => zero means nothing to ship; excess breaks the warehouse cap
    if order.qty == 0 || order.qty > 100 {
        return Err("qty_out_of_range");
    } // => the range rule covers both edges
    // => every rule passed: the order may reach business logic
    Ok(()) // => Ok carries nothing: the order itself is the proof
} // => guard ends: three rules, three codes, zero store writes so far

// => create parses, guards, then echoes: nothing reaches logic unvalidated
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => the guard runs first: a bad order never touches the store
    if let Err(code) = guard(&order) {
        // => Err carries the machine-readable code
        // => 422 says the shape parsed but the business meaning failed
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(json!({"error": code})),
        ); // => the shared error envelope
    } // => guard passed: fall through to the happy path below
    // => the echo proves the order survived parsing and every rule
    (StatusCode::CREATED, Json(json!({"id": order.id}))) // => 201 with the accepted id
} // => handler ends: invalid input never reaches the store

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation with its guard beside the extractor
    Router::new().route("/orders", post(create)) // => POST /orders guards, then echoes
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
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries echo or envelope
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
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
    // => build once, post one good order and three rule-breakers
    let app = app(); // => the service under test, built by its constructor
    // => every rule passes: 201 echoes the accepted id
    post_json(app.clone(), r#"{"id":"o-1","item":"pen","qty":2}"#).await; // => Output: 201 {"id":"o-1"}
    // => blank id: the first rule stops it with its own code
    post_json(app.clone(), r#"{"id":"","item":"pen","qty":2}"#).await; // => Output: 422 {"error":"id_required"}
    // => blank item: the second rule stops it with its own code
    post_json(app.clone(), r#"{"id":"o-3","item":"","qty":2}"#).await; // => Output: 422 {"error":"item_required"}
    // => zero qty: the range rule stops it with the range code
    post_json(app.clone(), r#"{"id":"o-4","item":"pen","qty":0}"#).await; // => Output: 422 {"error":"qty_out_of_range"}
} // => main ends: every check printed, so the run is green
