// Example 12: Custom Rule Rejects a Bad Order.
// types catch shape errors; a rule function catches business errors.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds POST; the rule decides 201 versus 422
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the exact contract the endpoint accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => every order carries its client-chosen id
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; the rule below bounds it to the sane range
    qty: u32, // => u32 already rejects negatives; the rule rejects zero and excess
} // => struct ends: the request shape is now a compile-time fact

// => check_rule enforces what no type can say: qty must be orderable
fn check_rule(order: &CreateOrder) -> Result<(), &'static str> {
    // => zero means nothing to ship, so it is not an order at all
    if order.qty == 0 {
        return Err("qty_must_be_positive");
    } // => the machine-readable code clients switch on
    // => the warehouse caps one line at one hundred units
    if order.qty > 100 {
        return Err("qty_exceeds_stock");
    } // => the second code with the same envelope
    // => both bounds hold: the business rule passes
    Ok(()) // => Ok carries nothing: the order itself is the proof
} // => rule ends: shape errors stay in the extractor, business errors live here

// => create parses, rules, then echoes: validation lives before logic
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => the rule runs first: no store write happens for a bad order
    if let Err(code) = check_rule(&order) {
        // => Err carries the machine-readable code
        // => 422 says the shape parsed but the business meaning failed
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(json!({"error": code})),
        ); // => the shared error envelope
    } // => rule passed: fall through to the happy path below
    // => the echo proves the order survived both parsing and the rule
    (
        StatusCode::CREATED,
        Json(json!({"id": order.id, "qty": order.qty})),
    ) // => 201 with the accepted order
} // => handler ends: invalid input never reaches the store

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation with its rule beside the extractor
    Router::new().route("/orders", post(create)) // => POST /orders validates, then echoes
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
    // => one golden line per call: path, sent body, status, reply
    println!("POST {uri} {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post one good order and two rule-breakers
    let app = app(); // => the service under test, built by its constructor
    // => sane qty: parsing and the rule both pass, echo answers 201
    post_json(app.clone(), "/orders", r#"{"id":"o-1","qty":2}"#).await; // => Output: 201 with the echoed order
    // => zero qty: shape parses, the rule answers 422 with its code
    post_json(app.clone(), "/orders", r#"{"id":"o-2","qty":0}"#).await; // => Output: 422 {"error":"qty_must_be_positive"}
    // => excess qty: the second bound answers 422 with its own code
    post_json(app.clone(), "/orders", r#"{"id":"o-3","qty":500}"#).await; // => Output: 422 {"error":"qty_exceeds_stock"}
} // => main ends: every check printed, so the run is green
