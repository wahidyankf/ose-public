use cucumber::{given, then, when};

use crate::world::{get_req, json_req, AppWorld};

pub async fn create_expense_helper(world: &mut AppWorld, body: &str) {
    let bearer = world.bearer();
    let req = json_req("POST", "/api/v1/expenses", body, Some(&bearer));
    world.send(req).await.unwrap();
    if world.last_status == 201 {
        world.last_expense_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
    }
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "10\.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_create_expense_lunch(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "10.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense"}"#,
    )
    .await;
}

#[when(
    regex = r#"alice sends POST /api/v1/expenses with body \{ "amount": "3000\.00", "currency": "USD", "category": "salary", "description": "Monthly salary", "date": "2025-01-31", "type": "income" \}"#
)]
async fn alice_create_income_salary(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "3000.00", "currency": "USD", "category": "salary", "description": "Monthly salary", "date": "2025-01-31", "type": "income"}"#,
    )
    .await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "10\.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense" \}"#
)]
async fn alice_created_entry_lunch(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "10.50", "currency": "USD", "category": "food", "description": "Lunch", "date": "2025-01-15", "type": "expense"}"#,
    )
    .await;
}

#[given(regex = r#"alice has created 3 entries"#)]
async fn alice_created_3_entries(world: &mut AppWorld) {
    let bearer = world.bearer();
    let entries = [
        r#"{"amount": "10.00", "currency": "USD", "category": "food", "description": "Entry 1", "date": "2025-01-01", "type": "expense"}"#,
        r#"{"amount": "20.00", "currency": "USD", "category": "food", "description": "Entry 2", "date": "2025-01-02", "type": "expense"}"#,
        r#"{"amount": "30.00", "currency": "USD", "category": "food", "description": "Entry 3", "date": "2025-01-03", "type": "expense"}"#,
    ];
    for body in entries {
        let req = json_req("POST", "/api/v1/expenses", body, Some(&bearer));
        world.send(req).await.unwrap();
    }
}

#[when("alice sends GET /api/v1/expenses")]
async fn alice_list_expenses(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req("/api/v1/expenses", Some(&bearer));
    world.send(req).await.unwrap();
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "10\.00", "currency": "USD", "category": "food", "description": "Breakfast", "date": "2025-01-10", "type": "expense" \}"#
)]
async fn alice_created_entry_breakfast(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "10.00", "currency": "USD", "category": "food", "description": "Breakfast", "date": "2025-01-10", "type": "expense"}"#,
    )
    .await;
}

#[when(
    regex = r#"alice sends PUT /api/v1/expenses/\{expenseId\} with body \{ "amount": "12\.00", "currency": "USD", "category": "food", "description": "Updated breakfast", "date": "2025-01-10", "type": "expense" \}"#
)]
async fn alice_update_expense(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let body = r#"{"amount": "12.00", "currency": "USD", "category": "food", "description": "Updated breakfast", "date": "2025-01-10", "type": "expense"}"#;
    let req = json_req(
        "PUT",
        &format!("/api/v1/expenses/{expense_id}"),
        body,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "10\.00", "currency": "USD", "category": "food", "description": "Snack", "date": "2025-01-05", "type": "expense" \}"#
)]
async fn alice_created_entry_snack(world: &mut AppWorld) {
    create_expense_helper(
        world,
        r#"{"amount": "10.00", "currency": "USD", "category": "food", "description": "Snack", "date": "2025-01-05", "type": "expense"}"#,
    )
    .await;
}

#[when("alice sends DELETE /api/v1/expenses/{expenseId}")]
async fn alice_delete_expense(world: &mut AppWorld) {
    let bearer = world.bearer();
    let expense_id = world
        .last_expense_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let req = http::Request::builder()
        .method("DELETE")
        .uri(&format!("/api/v1/expenses/{expense_id}"))
        .header("Authorization", &bearer)
        .body(axum::body::Body::empty())
        .unwrap();
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"the client sends POST /api/v1/expenses with body \{ "amount": "10\.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-01", "type": "expense" \}"#
)]
async fn unauthenticated_create_expense(world: &mut AppWorld) {
    let body = r#"{"amount": "10.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-01", "type": "expense"}"#;
    let req = json_req("POST", "/api/v1/expenses", body, None);
    world.send(req).await.unwrap();
}
