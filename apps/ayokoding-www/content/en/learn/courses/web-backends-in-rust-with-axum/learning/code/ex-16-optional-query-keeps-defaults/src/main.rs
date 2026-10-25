// Example 16: Optional Query Keeps Defaults.
// Option fields plus unwrap_or keep paging sane when clients omit them.
use axum::{Router, body::Body, extract::Query, http::Request, response::Json, routing::get}; // => Query deserializes the ?pairs into the page struct
use serde::Deserialize; // => Deserialize reads the query string into the struct
use serde_json::{Value, json}; // => json! builds the page snapshot inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => Page names the two paging knobs with handler-side defaults
#[derive(Deserialize)] // => axum fills this from the query string on every call
struct Page {
    // => None means the client skipped ?page: the first page answers
    page: Option<u32>, // => page 1 is the default, not page 0
    // => None means the client skipped ?per: twenty rows answer
    per: Option<u32>, // => twenty rows fit a screen without a second fetch
} // => struct ends: the paging shape is now a compile-time fact

// => orders answers one page echo: the effective values, never the raws
async fn orders(Query(page): Query<Page>) -> Json<Value> {
    // => unwrap_or applies the default exactly where the client omitted a knob
    let page_no = page.page.unwrap_or(1); // => first page when ?page is missing
    // => the same default rule keeps the second knob independent
    let per_page = page.per.unwrap_or(20); // => twenty rows when ?per is missing
    // => the echo proves the effective paging the store query would use
    Json(json!({"page": page_no, "per": per_page})) // => numbers, never nulls: defaults already applied
} // => handler ends: callers see effective values, not Option noise

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route owns the listing; paging rides along for free
    Router::new().route("/orders", get(orders)) // => GET /orders?page=&per= echoes the effective page
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
    // => status names what happened; the body carries the page echo
    let status = response.status(); // => keep the code plus reason before the body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: bodies here are plain JSON
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => paging always echoes numbers, so the marker stays unused
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
    // => build once, check bare, half, and full paging calls
    let app = app(); // => the service under test, built by its constructor
    // => no knobs: both defaults apply and the echo shows 1 and 20
    check(app.clone(), "GET", "/orders").await; // => Output: {"page":1,"per":20}
    // => one knob: page stays default while per applies
    check(app.clone(), "GET", "/orders?per=5").await; // => Output: {"page":1,"per":5}
    // => both knobs: the echo carries exactly what the client sent
    check(app.clone(), "GET", "/orders?page=3&per=5").await; // => Output: {"page":3,"per":5}
} // => main ends: every check printed, so the run is green
