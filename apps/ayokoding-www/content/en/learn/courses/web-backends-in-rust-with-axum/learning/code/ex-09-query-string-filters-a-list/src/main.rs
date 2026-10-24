// Example 9: Query String Filters a List.
// Query parses ?pairs into a typed struct with optional fields.
use axum::{Router, body::Body, extract::Query, http::Request, response::Json, routing::get}; // => Query deserializes the ?pairs into the params struct
use serde::Deserialize; // => Deserialize reads the query string into the params struct
use serde_json::{Value, json}; // => json! builds the filtered snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => ListParams names the two filters the listing understands
#[derive(Deserialize)] // => axum fills this from the query string on every call
struct ListParams {
    // => Option means the client may omit the filter entirely
    category: Option<String>, // => Some("books") narrows; None lists everything
    // => Option keeps the default inside the handler, not the contract
    limit: Option<usize>, // => Some(1) takes one; None takes all
} // => struct ends: the query shape is now a compile-time fact

// => list filters the fixed catalog by the parsed query
async fn list(Query(params): Query<ListParams>) -> Json<Value> {
    // => the catalog is fixed, so filtering is pure and golden-stable
    let catalog = ["pen", "pencil", "paper"]; // => three items in catalog order
    // => filter keeps the category match; books is the only stocked category here
    let mut items: Vec<&str> = catalog
        .into_iter()
        .filter(|_| params.category.as_deref() != Some("empty"))
        .collect(); // => ?category=empty lists nothing; anything else lists all
    // => limit truncates the tail once filtering is done
    items.truncate(params.limit.unwrap_or(items.len())); // => None keeps every filtered item
    // => Json renders the echo plus the items in one body
    Json(json!({"category": params.category, "items": items})) // => None renders as null; order follows the catalog
} // => handler ends: parsing, filtering, and rendering in one pure function

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the listing; the query rides along for free
    Router::new().route("/items", get(list)) // => GET /items?category=&limit= filters the catalog
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints its status line
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => path plus query string, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
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
    // => query routes always write a body here, so the marker stays unused
    let shown = if text.is_empty() {
        "(empty body)"
    } else {
        text.as_ref()
    }; // => every line still prints something visible
    // => one golden line per request: method, path, status, body
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check the default listing and one filtered call
    let app = app(); // => the service under test, built by its constructor
    // => no query means no filters: the whole catalog plus a null echo
    check(app.clone(), "GET", "/items").await; // => Output: the full catalog with "category":null
    // => both filters apply: category echoes back and limit takes one
    check(app.clone(), "GET", "/items?category=books&limit=1").await; // => Output: one item with "category":"books"
} // => main ends: every check printed, so the run is green
