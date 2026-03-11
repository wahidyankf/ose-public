use cucumber::{given, then, when};

use crate::steps::expense_steps::create_expense_helper;
use crate::world::{get_req, json_req, AppWorld};

#[given(
    regex = r#"alice has created an expense with body \{ "amount": "75000", "currency": "IDR", "category": "fuel", "description": "Petrol", "date": "2025-01-15", "type": "expense", "quantity": 50\.5, "unit": "liter" \}"#
)]
async fn alice_created_liter_expense(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "75000", "currency": "IDR", "category": "fuel", "description": "Petrol", "date": "2025-01-15", "type": "expense", "quantity": 50.5, "unit": "liter"}"#,
    ).await;
}

#[given(
    regex = r#"alice has created an expense with body \{ "amount": "45\.00", "currency": "USD", "category": "fuel", "description": "Gas", "date": "2025-01-15", "type": "expense", "quantity": 10, "unit": "gallon" \}"#
)]
async fn alice_created_gallon_expense(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "45.00", "currency": "USD", "category": "fuel", "description": "Gas", "date": "2025-01-15", "type": "expense", "quantity": 10, "unit": "gallon"}"#,
    ).await;
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "10\.00", "currency": "USD", "category": "misc", "description": "Cargo", "date": "2025-01-15", "type": "expense", "quantity": 5, "unit": "fathom" \}"#
)]
async fn alice_create_unsupported_unit(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/expenses",
        r#"{"amount": "10.00", "currency": "USD", "category": "misc", "description": "Cargo", "date": "2025-01-15", "type": "expense", "quantity": 5, "unit": "fathom"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "25\.00", "currency": "USD", "category": "food", "description": "Dinner", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_create_no_unit(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/expenses",
        r#"{"amount": "25.00", "currency": "USD", "category": "food", "description": "Dinner", "date": "2025-01-15", "type": "expense"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
    if world.last_status == 201 {
        world.last_expense_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
    }
}

#[then(expr = "the response body should contain {string} equal to {float}")]
async fn body_field_equals_float(world: &mut AppWorld, field: String, value: f64) {
    let actual = world.last_body.get(&field).and_then(|v| v.as_f64());
    assert!(
        actual.is_some(),
        "Field '{field}' not found or not a number in body: {}",
        world.last_body
    );
    let actual_val = actual.unwrap();
    assert!(
        (actual_val - value).abs() < 0.001,
        "Field '{field}' expected {value}, got {actual_val}, body: {}",
        world.last_body
    );
}

#[when("alice sends GET /api/v1/expenses/{expenseId}")]
async fn alice_get_expense_by_id(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let req = get_req(&format!("/api/v1/expenses/{expense_id}"), Some(&bearer));
    world.send(req).await.unwrap();
}
