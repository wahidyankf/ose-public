// Kata 01 starter: creation echoes any qty, even zero. The guard is missing.
// TODO: add a guard that rejects qty 0 and qty above 100 with 422,
// then echo only validated orders with 201.
use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => post binds creation; the guard belongs beside it
use serde::Deserialize; // => Deserialize reads the JSON body into the struct
use serde_json::{Value, json}; // => json! builds the echo reply inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => CreateOrder names the contract; the rule still needs writing
#[derive(Deserialize)] // => parsing works already: the missing piece is validation
struct CreateOrder {
    // => the client-chosen id echoes back below
    id: String, // => String keeps ids opaque: no numeric assumption
    // => qty counts how many; TODO: reject 0 and anything above 100
    qty: u32, // => TODO: the guard reads this field before the echo
} // => struct ends: the shape is done, the rule is the exercise

// => create echoes without guarding: TODO moves validation in front
async fn create(Json(order): Json<CreateOrder>) -> (StatusCode, Json<Value>) {
    // => TODO: reject qty 0 and qty above 100 with 422 before this line
    (
        StatusCode::CREATED,
        Json(json!({"id": order.id, "qty": order.qty})),
    ) // => TODO: only validated orders reach this echo
} // => handler ends: the echo works, the guard is the kata

// => app builds the service once; the kata reuses this constructor
fn app() -> Router {
    // => one POST route owns creation; the guard joins it when written
    Router::new().route("/orders", post(create)) // => POST /orders echoes today, guards tomorrow
} // => constructor ends: wiring stays separate from traffic

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post the zero-qty order the guard must stop
    let app = app(); // => the service under test, built by its constructor
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder()
        .method("POST")
        .uri("/orders")
        .header("content-type", "application/json")
        .body(Body::from(r#"{"id":"o-1","qty":0}"#))
        .unwrap(); // => the malformed body the kata rejects
    // => oneshot runs the unguarded stack: 201 today, 422 after the kata
    let response = app.oneshot(request).await.unwrap(); // => TODO: this becomes 422 with the envelope
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => one line: today's answer the kata changes to a rejection
    println!(
        "POST /orders qty=0 -> {status} {}",
        String::from_utf8_lossy(&bytes)
    ); // => the kata is done when this prints 422
} // => main ends: the kata is done when todo is gone
