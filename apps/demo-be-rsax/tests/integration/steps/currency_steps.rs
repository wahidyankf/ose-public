use cucumber::{given, then, when};

use crate::steps::expense_steps::create_expense_helper;
use crate::world::{get_req, json_req, AppWorld};

#[given(
    regex = r#"alice has created an expense with body \{ "amount": "10\.50", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_created_usd_expense_coffee(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "10.50", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-15", "type": "expense"}"#,
    )
    .await;
}

#[given(
    regex = r#"alice has created an expense with body \{ "amount": "150000", "currency": "IDR", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_created_idr_expense_taxi(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "150000", "currency": "IDR", "category": "transport", "description": "Taxi", "date": "2025-01-15", "type": "expense"}"#,
    )
    .await;
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "10\.00", "currency": "EUR", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_create_expense_eur(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/expenses",
        r#"{"amount": "10.00", "currency": "EUR", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "10\.00", "currency": "US", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_create_expense_malformed_currency(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/expenses",
        r#"{"amount": "10.00", "currency": "US", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[given(
    regex = r#"alice has created an expense with body \{ "amount": "20\.00", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_created_usd_20(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "20.00", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense"}"#,
    )
    .await;
}

#[given(
    regex = r#"alice has created an expense with body \{ "amount": "10\.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_created_usd_10(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "10.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-15", "type": "expense"}"#,
    )
    .await;
}

#[when("alice sends GET /api/v1/expenses/summary")]
async fn alice_get_summary(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req("/api/v1/expenses/summary", Some(&bearer));
    world.send(req).await.unwrap();
}

#[then(expr = "the response body should contain {string} total equal to {string}")]
async fn summary_total_equals(world: &mut AppWorld, currency: String, amount: String) {
    let actual = world
        .last_body
        .get(&currency)
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert_eq!(
        actual,
        amount.as_str(),
        "Expected {currency} total '{amount}', got '{actual}', body: {}",
        world.last_body
    );
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "-10\.00", "currency": "USD", "category": "food", "description": "Refund", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_create_negative_expense(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/expenses",
        r#"{"amount": "-10.00", "currency": "USD", "category": "food", "description": "Refund", "date": "2025-01-15", "type": "expense"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}
