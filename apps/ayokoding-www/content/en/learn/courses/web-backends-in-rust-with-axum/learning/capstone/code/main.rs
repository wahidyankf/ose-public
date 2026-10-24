// Capstone: Order Tracking Service.
// five routes, validation, error envelope, health probe, in-process lifecycle demo.
use axum::{
    Router,
    body::Body,
    extract::{Path, State},
    http::{Request, StatusCode},
    response::{IntoResponse, Json},
    routing::{delete, get, patch, post},
}; // => five routes, one envelope, one probe
use serde::{Deserialize, Serialize}; // => Deserialize reads the boundary; Serialize renders it back
use serde_json::{Value, json}; // => json! builds echoes and the envelope inline
use std::collections::HashMap; // => HashMap indexes orders by id; keys sort before listing
use std::sync::{Arc, Mutex}; // => Arc shares the store; Mutex guards the map
use tower::ServiceExt; // => oneshot drives the router in-process with no socket

// => STATUSES names the workflow bounds: placed starts, shipped and cancelled end
const STATUSES: [&str; 4] = ["placed", "paid", "shipped", "cancelled"]; // => four states, no other string may pass

// => Order is the boundary shape: the same struct parses, stores, and renders
#[derive(Clone, Deserialize, Serialize)] // => Clone stores copies; Deserialize reads; Serialize renders
struct Order {
    // => the client-chosen id becomes the map key and the read path
    id: String, // => String keeps ids opaque: no numeric assumption
    // => the item names what the customer buys
    item: String, // => required: nameless lines ship nowhere
    // => qty counts how many; the guard bounds it to the orderable range
    qty: u32, // => u32 already rejects negatives at parse time
    // => status moves through the workflow bounds above
    status: String, // => placed at creation; moved by the status route only
} // => struct ends: the order in one definition, everywhere

// => AppError names the three failures the capstone reports
enum AppError {
    // => the body parsed but a rule failed: blank field or bad qty
    BadOrder, // => 422: understood, but refused
    // => the id names nothing in the store
    NoOrder, // => 404: absence, not a crash
    // => the transition breaks the workflow bounds
    BadStatus, // => 422: understood, but refused
} // => enum ends: every failure is one of these three variants

// => IntoResponse renders each variant as status plus the shared envelope
impl IntoResponse for AppError {
    // => self is consumed: each error answers exactly once
    fn into_response(self) -> axum::response::Response {
        // => each variant picks its code and its machine-readable code
        let (status, code) = match self {
            // => match keeps the mapping total: no silent variant
            AppError::BadOrder => (StatusCode::UNPROCESSABLE_ENTITY, "bad_order"), // => 422 for refusal
            AppError::NoOrder => (StatusCode::NOT_FOUND, "no_order"), // => 404 for absence
            AppError::BadStatus => (StatusCode::UNPROCESSABLE_ENTITY, "bad_status"), // => 422 for refusal
        }; // => the pair is decided: render it below
        // => every failure shares one envelope: code plus message
        (
            status,
            Json(json!({"code": code, "message": format!("request failed: {code}")})),
        )
            .into_response() // => the envelope never changes shape
    } // => render ends: failures are responses with a contract
} // => impl ends: the error type is the whole error boundary

// => AppState carries the one store every handler shares
#[derive(Clone)] // => Clone shares the Arc, never the map: cheap by design
struct AppState {
    // => Mutex guards the map because handlers run on many threads
    orders: Arc<Mutex<HashMap<String, Order>>>, // => id to order, guarded as one unit
} // => struct ends: the service memory in one value

// => guard enforces creation rules before any store write happens
fn guard(order: &Order) -> Result<(), AppError> {
    // => blank ids track nothing, so they stop here
    if order.id.trim().is_empty() {
        return Err(AppError::BadOrder);
    } // => blank id: refused
    // => blank items ship nowhere, so they stop here too
    if order.item.trim().is_empty() {
        return Err(AppError::BadOrder);
    } // => blank item: refused
    // => zero means nothing to ship; excess breaks the warehouse cap
    if order.qty == 0 || order.qty > 100 {
        return Err(AppError::BadOrder);
    } // => range rule covers both edges
    // => every rule passed: the order may reach the store
    Ok(()) // => Ok carries nothing: the order itself is the proof
} // => guard ends: validation lives before logic, always

// => allowed moves the workflow: only forward steps leave this function as Ok
fn allowed(from: &str, to: &str) -> bool {
    // => the workflow graph in one match: forward steps pass, everything else stops
    match (from, to) {
        // => (current, wanted): the whole workflow in four arms
        ("placed", "paid") => true, // => payment moves the order forward
        ("placed", "cancelled") => true, // => cancellation ends a placed order
        ("paid", "shipped") => true, // => shipment moves a paid order forward
        ("paid", "cancelled") => true, // => cancellation ends a paid order
        _ => false, // => shipped and cancelled are terminal; backward steps stop here
    } // => match ends: the workflow bounds as data, not prose
} // => allowed ends: true moves, false answers 422 below

// => create validates, defaults to placed, stores, and answers 201
async fn create(
    State(state): State<AppState>,
    Json(mut order): Json<Order>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    // => the guard runs first: a bad order never touches the store
    guard(&order)?; // => ? leaves early with BadOrder inside the envelope
    // => creation always starts placed: clients never choose the first status
    order.status = "placed".to_owned(); // => the default the workflow demands
    // => lock, insert, drop: the critical section ends before the reply builds
    state
        .orders
        .lock()
        .unwrap()
        .insert(order.id.clone(), order.clone()); // => the map owns a copy; the echo owns the original
    // => 201 with the stored order rendered back
    Ok((StatusCode::CREATED, Json(json!({"order": order})))) // => the echo proves validation, default, and store
} // => handler ends: guard, default, store, answer, in that order

// => list renders every order sorted by id for golden-stable output
async fn list(State(state): State<AppState>) -> Json<Value> {
    // => clone under the lock, sort outside it: readers never block writers long
    let mut rows: Vec<Order> = state.orders.lock().unwrap().values().cloned().collect(); // => HashMap order is random, so sort it away
    // => sort by id makes the listing deterministic on every call
    rows.sort_by(|a, b| a.id.cmp(&b.id)); // => o-1 before o-2, whatever insertion said
    // => the listing echoes the sorted store contents
    Json(json!({"orders": rows})) // => insertion order never leaks into output
} // => handler ends: sorted, stable, golden

// => read answers one order or 404s through the shared envelope
async fn read(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    // => the map lookup decides hit versus miss in one borrow
    let found = state.orders.lock().unwrap().get(&id).cloned(); // => cloned out from under the lock
    // => Some renders the snapshot; None leaves through the envelope
    match found {
        // => the hit-or-miss in two arms
        Some(order) => Ok(Json(json!({"order": order}))), // => the hit answers 200 with the snapshot
        None => Err(AppError::NoOrder),                   // => the miss answers 404 with no_order
    } // => match ends: every id either renders or refuses
} // => handler ends: absence is a response, not a panic

// => StatusInput names the one field the status route accepts
#[derive(Deserialize)] // => axum rejects any body that cannot fill this shape
struct StatusInput {
    // => the wanted status: must name one of the four workflow states
    status: String, // => checked against STATUSES below, not just moved blindly
} // => struct ends: the transition request in one field

// => set_status moves one order through the workflow bounds or refuses
async fn set_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<StatusInput>,
) -> Result<Json<Value>, AppError> {
    // => unknown words stop here: only workflow states may pass
    if !STATUSES.contains(&input.status.as_str()) {
        return Err(AppError::BadStatus);
    } // => flying is not a status: refused
    // => lock once: read the current status, write the move, drop the lock
    let mut store = state.orders.lock().unwrap(); // => one lock for the read-modify-write
    // => the order must exist before it can move anywhere
    let order = store.get_mut(&id).ok_or(AppError::NoOrder)?; // => missing id leaves with no_order
    // => the workflow bounds decide the move: forward passes, the rest refuse
    if !allowed(&order.status, &input.status) {
        return Err(AppError::BadStatus);
    } // => shipped cannot return to placed: refused
    // => the move lands: the stored status becomes the wanted one
    order.status = input.status.clone(); // => the workflow step, recorded
    // => the reply echoes the moved order beside the applied status
    Ok(Json(json!({"order": order.clone()}))) // => the proof the move landed
} // => handler ends: bounds first, move second, echo last

// => cancel deletes one order and answers 204, or 404s the second delete
async fn cancel(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    // => remove reports whether anything was there to delete
    let removed = state.orders.lock().unwrap().remove(&id).is_some(); // => Some means deleted; None means already gone
    // => deleted answers 204 with no body; gone answers 404 with the envelope
    if removed {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err(AppError::NoOrder)
    } // => the second delete 404s: deletion is not idempotent here
} // => handler ends: 204 once, 404 ever after

// => health answers the liveness probe beside the five business routes
async fn health() -> Json<Value> {
    // => no store, no latency, nothing that can fail except the process itself
    Json(json!({"ok": true})) // => the probe the demo asserts last
} // => handler ends: liveness asks only whether the process answers

// => build_app wires the whole capstone: five routes plus the probe, one store
fn build_app() -> Router {
    // => the store starts empty: the demo fills it leg by leg below
    let state = AppState {
        orders: Arc::new(Mutex::new(HashMap::new())),
    }; // => empty map before the first creation
    // => five business routes plus the probe share one store and one envelope
    Router::new()
        .route("/orders", post(create).get(list))
        .route("/orders/{id}", get(read))
        .route("/orders/{id}", delete(cancel))
        .route("/orders/{id}/status", patch(set_status))
        .route("/healthz", get(health))
        .with_state(state) // => the whole lifecycle in one router
} // => constructor ends: the service in one value, ready for the demo

// => call serves one lifecycle leg and prints its golden line
async fn call(app: Router, method: &str, uri: &str, body: Option<&str>) {
    // => Request::builder shapes a server-side request without a client
    let mut builder = Request::builder().method(method).uri(uri); // => verb and path first; the body follows when present
    // => Some carries the JSON leg; None sends the bare call
    if let Some(text) = body {
        builder = builder
            .header("content-type", "application/json")
            .header("content-length", text.len().to_string());
    } // => JSON legs declare their type
    // => the body rides when present, empty when the leg needs none
    let payload = body
        .map(|text| Body::from(text.to_owned()))
        .unwrap_or_else(Body::empty); // => owned bytes or nothing
    // => the request is sealed: verb, path, headers, payload together
    let request = builder.body(payload).unwrap(); // => the parts are constants, so this never fails
    // => oneshot runs routing, guards, workflow, and handlers exactly as live
    let response = app.oneshot(request).await.unwrap(); // => the full axum pipeline, minus the socket
    // => status cardio first: the code is borrowed before the body moves
    let status = response.status(); // => keep the code plus reason before into_body moves
    // => to_bytes collects the whole body with a generous in-memory cap
    let bytes = axum::body::to_bytes(response.into_body(), 65536)
        .await
        .unwrap(); // => into_body moves the stream out of the response
    // => lossy text keeps the print total: 204 legs print the marker
    let text = String::from_utf8_lossy(&bytes); // => borrow the bytes as printable text
    // => the 204 leg carries no body, so the marker names that fact
    let shown = if text.is_empty() {
        "(no body)"
    } else {
        text.as_ref()
    }; // => every other leg prints its JSON
    // => one golden line per leg: method, path, status, reply
    println!("{method} {uri} -> {status} {shown}"); // => the harness compares this line with the golden file
} // => call ends: the router is consumed, so callers pass a clone

#[tokio::main] // => the async runtime drives the lifecycle demo
async fn main() {
    // => build once, walk the whole order lifecycle leg by leg
    let app = build_app(); // => the capstone service, built by its constructor
    // => leg one: creation validates and answers 201 with status placed
    call(
        app.clone(),
        "POST",
        "/orders",
        Some(r#"{"id":"o-1","item":"pen","qty":2,"status":"shipped"}"#),
    )
    .await; // => Output: 201 with placed, not shipped: creation defaults
    // => leg two: the zero-qty sibling fails validation with bad_order
    call(
        app.clone(),
        "POST",
        "/orders",
        Some(r#"{"id":"o-2","item":"pen","qty":0,"status":"placed"}"#),
    )
    .await; // => Output: 422 bad_order
    // => leg three: the listing shows the one accepted order
    call(app.clone(), "GET", "/orders", None).await; // => Output: 200 with one order
    // => leg four: the read echoes the stored order back
    call(app.clone(), "GET", "/orders/o-1", None).await; // => Output: 200 with o-1 placed
    // => leg five: the paid move answers 200 with the moved order
    call(
        app.clone(),
        "PATCH",
        "/orders/o-1/status",
        Some(r#"{"status":"paid"}"#),
    )
    .await; // => Output: 200 with o-1 paid
    // => leg six: flying is not a workflow state, so it answers 422
    call(
        app.clone(),
        "PATCH",
        "/orders/o-1/status",
        Some(r#"{"status":"flying"}"#),
    )
    .await; // => Output: 422 bad_status
    // => leg seven: deletion answers 204 with no body
    call(app.clone(), "DELETE", "/orders/o-1", None).await; // => Output: 204 (no body)
    // => leg eight: the second deletion answers 404 with no_order
    call(app.clone(), "DELETE", "/orders/o-1", None).await; // => Output: 404 no_order
    // => leg nine: health answers 200 beside the whole lifecycle
    call(app.clone(), "GET", "/healthz", None).await; // => Output: 200 {"ok":true}
} // => main ends: nine legs walked, so the run is green
