// Example 14: Form Body Parses Pairs.
// Form reads urlencoded pairs into a struct, like an HTML login post.
use axum::{
    Form, Router,
    body::Body,
    http::{Request, StatusCode},
    response::Json,
    routing::post,
}; // => Form deserializes urlencoded pairs; post binds the POST verb
use serde::Deserialize; // => Deserialize reads the pairs into the login struct
use serde_json::{Value, json}; // => json! builds the welcome and the envelope inline
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => LoginForm names the two fields the login page posts
#[derive(Deserialize)] // => axum fills this from the urlencoded body on every call
struct LoginForm {
    // => the account name typed into the form
    username: String, // => required: an empty post fails before the handler runs
    // => the secret typed beside it; plaintext here because auth is not the lesson
    password: String, // => required: the shape demands both fields together
} // => struct ends: the form shape is now a compile-time fact

// => login welcomes the only user it knows and rejects every other pair
async fn login(Form(form): Form<LoginForm>) -> (StatusCode, Json<Value>) {
    // => the pair is already typed here: parsing finished before this line
    if form.username == "ada" && form.password == "s3cret" {
        // => the one credential pair this demo accepts
        // => 200 welcomes the known user by name
        return (StatusCode::OK, Json(json!({"welcome": form.username}))); // => the echo proves both fields parsed
    } // => wrong pair: fall through to the shared rejection below
    // => 401 says the shape parsed but the credentials failed
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"error": "bad_credentials"})),
    ) // => the shared error envelope
} // => handler ends: parsing, checking, and answering in one function

// => app builds the service once; every check reuses this constructor
fn app() -> Router {
    // => one POST route owns login; Form rides along as the extractor
    Router::new().route("/login", post(login)) // => POST /login with a urlencoded body logs one user in
} // => constructor ends: wiring stays separate from traffic

// => post_form serves one form call in-process and prints its status line
async fn post_form(app: Router, body: &str) {
    // => Request::builder shapes a server-side request without a client
    let request = Request::builder() // => start from an empty request builder
        .method("POST") // => forms always post in this service
        .uri("/login") // => the single login path, with no host or port
        .header("content-type", "application/x-www-form-urlencoded") // => Form demands this type, or it answers 415
        .body(Body::from(body.to_owned())) // => the pairs ride as the request body
        .unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, handlers, and middleware exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status names what happened; the body carries welcome or envelope
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
    // => one golden line per call: sent pairs, status, reply
    println!("POST /login {body} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => post_form ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the router and the checks
async fn main() {
    // => build once, post the known pair and one stranger
    let app = app(); // => the service under test, built by its constructor
    // => the known pair parses and matches: 200 welcomes ada
    post_form(app.clone(), "username=ada&password=s3cret").await; // => Output: 200 {"welcome":"ada"}
    // => the stranger parses but never matches: 401 with the envelope
    post_form(app.clone(), "username=bob&password=nope").await; // => Output: 401 {"error":"bad_credentials"}
} // => main ends: every check printed, so the run is green
