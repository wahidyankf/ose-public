// Example 8: Handler Returns an HTML Page.
// Html renders a page with the text/html content type.
use axum::{Router, body::Body, http::Request, response::Html, routing::get}; // => Html sets text/html and writes the markup untouched
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => index answers the landing page as one fixed markup string
async fn index() -> Html<&'static str> {
    // => &'static str keeps the page in the binary: no template, no file read
    Html("<h1>Hello from axum</h1>") // => the whole page in one line of markup
} // => handler ends: Html is a responder, not a template engine

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one route serves the page at the root path
    Router::new().route("/", get(index)) // => GET / renders the markup above
} // => constructor ends: wiring stays separate from traffic

// => check serves one request in-process and prints status plus content type
async fn check(app: Router, method: &str, uri: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method(method) // => the verb under test
        .uri(uri) // => the path under test, with no host or port
        .body(Body::empty()) // => GET carries no payload, so the body stays empty
        .unwrap(); // => the method and path are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status and content type are the contract here, not just the body
    let status = response.status(); // => keep the code plus reason before the parts move
    // => content-type proves the responder set text/html for the browser
    let content_type = response.headers()["content-type"]
        .to_str()
        .unwrap()
        .to_owned(); // => own the value before the body moves
    // => to_bytes collects the whole markup with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: the page is plain markup
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => one golden line: method, path, status, content type, markup
    println!("{method} {uri} -> {status} {content_type} {text}"); // => the harness compares this line with the golden file
} // => check ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, check the page and its content type together
    let app = app(); // => the service under test, built by its constructor
    // => the root answers 200 as text/html with the markup inline
    check(app.clone(), "GET", "/").await; // => Output: GET / -> 200 OK text/html; charset=utf-8 <h1>Hello from axum</h1>
} // => main ends: every check printed, so the run is green
