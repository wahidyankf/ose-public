// Example 22: Content Negotiation Picks a Format.
// one endpoint serves JSON, CSV, or the default from the Accept header.
use axum::{
    Router,
    body::Body,
    http::{HeaderMap, Request},
    response::{IntoResponse, Json},
    routing::get,
}; // => HeaderMap reads Accept; each leg renders its own shape
use serde_json::json; // => json! builds the JSON leg inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => orders serves the collection in the negotiated format
async fn orders(headers: HeaderMap) -> impl IntoResponse {
    // => the raw Accept value decides; missing means the JSON default
    let accept = headers
        .get("accept")
        .and_then(|v| v.to_str().ok())
        .unwrap_or(""); // => empty string falls through to JSON below
    // => the CSV leg answers rows for spreadsheet-shaped clients
    if accept.contains("text/csv") {
        // => substring match keeps the demo to one rule per leg
        // => text/csv with the two rows, answered as plain text
        return ([("content-type", "text/csv")], "id,item\no-1,pen\n").into_response(); // => the header pair plus the CSV rows
    } // => other legs: fall through to the JSON default below
    // => the default leg answers the JSON snapshot for API clients
    (
        [("content-type", "application/json")],
        Json(json!({"orders": [{"id": "o-1", "item": "pen"}]})),
    )
        .into_response() // => the header pair plus the rendered snapshot
} // => handler ends: three Accept values, two legs, one function

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route negotiates every format; no sibling routes needed
    Router::new().route("/orders", get(orders)) // => GET /orders negotiates JSON or CSV
} // => constructor ends: wiring stays separate from traffic

// => check serves one negotiated call and prints status, type, and body
async fn check(app: Router, accept: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/orders"); // => path first; Accept follows when present
    // => Some carries the format under test; None takes the JSON default
    if let Some(format) = accept {
        builder = builder.header("accept", format);
    } // => the negotiation input rides as one header
    // => an empty body keeps the call a pure negotiation probe
    let request = builder.body(Body::empty()).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status, content type, and body are the three negotiation promises
    let status = response.status(); // => keep the code plus reason before the parts move
    // => content-type proves the handler honored the Accept header
    let content_type = response.headers()["content-type"]
        .to_str()
        .unwrap()
        .to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: both legs are printable
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: sent Accept, status, content type, body
    println!(
        "GET /orders accept={} -> {status} {content_type} {text}",
        accept.unwrap_or("(none)")
    ); // => raw text: CSV rows print on their own lines
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, ask for CSV, JSON, and nothing at all
    let app = app(); // => the service under test, built by its constructor
    // => text/csv asks for rows and gets them with the CSV type
    check(app.clone(), Some("text/csv")).await; // => Output: 200 text/csv with the two CSV rows
    // => application/json asks for the snapshot and gets it
    check(app.clone(), Some("application/json")).await; // => Output: 200 application/json with the orders array
    // => no header takes the JSON default, like a curl call with no flags
    check(app.clone(), None).await; // => Output: 200 application/json with the orders array
} // => main ends: every check printed, so the run is green
