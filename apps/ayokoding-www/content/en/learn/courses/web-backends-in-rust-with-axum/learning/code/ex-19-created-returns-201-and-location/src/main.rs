// Example 19: Created Returns 201 and Location.
// the response carries the new address beside the body.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode, header},
    response::Json,
    routing::post,
}; // => header names LOCATION; the triple carries code, headers, body
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the two fields creation needs
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct CreateOrder {
    // => the client-chosen id becomes the last segment of the address
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys; the echo below returns only the id
    #[allow(dead_code)] // => parsed and required, but never read after this point
    item: String, // => required: nameless lines ship nowhere
} // => struct ends: the request shape is now a compile-time fact

// => create answers 201 with the Location of the new resource
async fn create(
    Json(order): Json<CreateOrder>,
) -> (
    StatusCode,
    [(axum::http::HeaderName, String); 1],
    Json<Value>,
) {
    // => the address follows the collection path plus the new id
    let location = format!("/orders/{}", order.id); // => the URL the client reads next
    // => the triple sets code, headers, and body in one return
    (
        StatusCode::CREATED,
        [(header::LOCATION, location)],
        Json(json!({"id": order.id})),
    ) // => 201, the address, and the echo together
} // => handler ends: creation tells the client where to look next

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns creation with its address header
    Router::new().route("/orders", post(create)) // => POST /orders answers 201 plus Location
} // => constructor ends: wiring stays separate from traffic

// => post_json serves one JSON call and prints status, location, and body
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
    // => status, location, and body are the three promises of a 201
    let status = response.status(); // => keep the code plus reason before the parts move
    // => Location tells the client the address of the new resource
    let location = response.headers()["location"].to_str().unwrap().to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the echo is plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: sent body, status, location, echo
    println!("POST /orders {body} -> {status} location={location} {text}"); // => the harness compares this line with the golden file
} // => post_json ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, create one order and read its address
    let app = app(); // => the service under test, built by its constructor
    // => creation answers 201 with the new address and the echo
    post_json(app.clone(), r#"{"id":"o-1","item":"pen"}"#).await; // => Output: 201 location=/orders/o-1 with the echo
} // => main ends: every check printed, so the run is green
