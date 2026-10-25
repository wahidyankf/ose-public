// Example 21: Headers Shape the Response.
// the handler reads Accept and answers with the matching content type.
use axum::{
    Router,
    body::Body,
    http::{HeaderMap, Request},
    response::{IntoResponse, Json},
    routing::get,
}; // => HeaderMap reads Accept; tuples set headers beside the body
use serde_json::json; // => json! builds the JSON leg inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => report answers one summary in the format the client asked for
async fn report(headers: HeaderMap) -> impl IntoResponse {
    // => Accept decides the leg; anything else falls back to JSON
    let wants_csv = headers
        .get("accept")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .contains("text/csv"); // => substring match keeps the demo to one rule
    // => Vary tells caches the answer depends on the Accept header
    let vary = [("vary", "Accept")]; // => one header pair shared by both legs
    // => the CSV leg answers plain text with the comma-joined snapshot
    if wants_csv {
        // => the client asked for text/csv, so it gets rows
        // => the header array plus the string body leave as one response
        return (
            vary,
            [(axum::http::header::CONTENT_TYPE, "text/csv")],
            "id,status\no-1,placed\n",
        )
            .into_response(); // => two header pairs plus the CSV rows
    } // => JSON leg: fall through to the default below
    // => the JSON leg answers the snapshot with the matching content type
    (
        vary,
        [(axum::http::header::CONTENT_TYPE, "application/json")],
        Json(json!({"orders": ["o-1"]})),
    )
        .into_response() // => Json renders beside the two header pairs
} // => handler ends: one summary, two shapes, zero duplication

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the report; Accept picks its shape per call
    Router::new().route("/report", get(report)) // => GET /report negotiates JSON or CSV
} // => constructor ends: wiring stays separate from traffic

// => check serves one negotiated call and prints status, type, and body
async fn check(app: Router, accept: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method("GET").uri("/report"); // => path first; Accept follows when present
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
        "GET /report accept={} -> {status} {content_type} {text}",
        accept.unwrap_or("(none)")
    ); // => raw text: CSV rows print on their own lines
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, negotiate CSV, JSON, and the default
    let app = app(); // => the service under test, built by its constructor
    // => text/csv asks for rows and gets them with the CSV type
    check(app.clone(), Some("text/csv")).await; // => Output: 200 text/csv with the two CSV rows
    // => application/json asks for the snapshot and gets it
    check(app.clone(), Some("application/json")).await; // => Output: 200 application/json with the orders array
    // => no header takes the JSON default, like a browser-less client
    check(app.clone(), None).await; // => Output: 200 application/json with the orders array
} // => main ends: every check printed, so the run is green
