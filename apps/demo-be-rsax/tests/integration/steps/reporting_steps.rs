use cucumber::{given, then, when};

use crate::world::{get_req, json_req, AppWorld};

async fn alice_create(world: &mut AppWorld, body: &str) {
    let bearer = world.bearer();
    let req = json_req("POST", "/api/v1/expenses", body, Some(&bearer));
    world.send(req).await.unwrap();
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "5000\.00", "currency": "USD", "category": "salary", "description": "Monthly salary", "date": "2025-01-15", "type": "income" \}"#
)]
async fn alice_income_5000(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "5000.00", "currency": "USD", "category": "salary", "description": "Monthly salary", "date": "2025-01-15", "type": "income"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "150\.00", "currency": "USD", "category": "food", "description": "Groceries", "date": "2025-01-20", "type": "expense" \}"#
)]
async fn alice_expense_150(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "150.00", "currency": "USD", "category": "food", "description": "Groceries", "date": "2025-01-20", "type": "expense"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "3000\.00", "currency": "USD", "category": "salary", "description": "Salary", "date": "2025-02-10", "type": "income" \}"#
)]
async fn alice_income_3000(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "3000.00", "currency": "USD", "category": "salary", "description": "Salary", "date": "2025-02-10", "type": "income"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "500\.00", "currency": "USD", "category": "freelance", "description": "Freelance project", "date": "2025-02-15", "type": "income" \}"#
)]
async fn alice_income_500(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "500.00", "currency": "USD", "category": "freelance", "description": "Freelance project", "date": "2025-02-15", "type": "income"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "200\.00", "currency": "USD", "category": "transport", "description": "Monthly pass", "date": "2025-02-05", "type": "expense" \}"#
)]
async fn alice_expense_200(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "200.00", "currency": "USD", "category": "transport", "description": "Monthly pass", "date": "2025-02-05", "type": "expense"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "1000\.00", "currency": "USD", "category": "salary", "description": "Bonus", "date": "2025-03-05", "type": "income" \}"#
)]
async fn alice_income_1000_bonus(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "1000.00", "currency": "USD", "category": "salary", "description": "Bonus", "date": "2025-03-05", "type": "income"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "75\.00", "currency": "USD", "category": "utilities", "description": "Internet bill", "date": "2025-04-10", "type": "expense" \}"#
)]
async fn alice_expense_75(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "75.00", "currency": "USD", "category": "utilities", "description": "Internet bill", "date": "2025-04-10", "type": "expense"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "1000\.00", "currency": "USD", "category": "freelance", "description": "USD project", "date": "2025-05-01", "type": "income" \}"#
)]
async fn alice_income_usd_1000(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "1000.00", "currency": "USD", "category": "freelance", "description": "USD project", "date": "2025-05-01", "type": "income"}"#).await;
}

#[given(
    regex = r#"alice has created an entry with body \{ "amount": "5000000", "currency": "IDR", "category": "freelance", "description": "IDR project", "date": "2025-05-01", "type": "income" \}"#
)]
async fn alice_income_idr_5m(world: &mut AppWorld) {
    alice_create(world, r#"{"amount": "5000000", "currency": "IDR", "category": "freelance", "description": "IDR project", "date": "2025-05-01", "type": "income"}"#).await;
}

#[when(regex = r#"alice sends GET /api/v1/reports/pl\?from=2025-01-01&to=2025-01-31&currency=USD"#)]
async fn alice_pl_jan(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req(
        "/api/v1/reports/pl?from=2025-01-01&to=2025-01-31&currency=USD",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(regex = r#"alice sends GET /api/v1/reports/pl\?from=2025-02-01&to=2025-02-28&currency=USD"#)]
async fn alice_pl_feb(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req(
        "/api/v1/reports/pl?from=2025-02-01&to=2025-02-28&currency=USD",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(regex = r#"alice sends GET /api/v1/reports/pl\?from=2025-03-01&to=2025-03-31&currency=USD"#)]
async fn alice_pl_mar(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req(
        "/api/v1/reports/pl?from=2025-03-01&to=2025-03-31&currency=USD",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(regex = r#"alice sends GET /api/v1/reports/pl\?from=2025-04-01&to=2025-04-30&currency=USD"#)]
async fn alice_pl_apr(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req(
        "/api/v1/reports/pl?from=2025-04-01&to=2025-04-30&currency=USD",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(regex = r#"alice sends GET /api/v1/reports/pl\?from=2025-05-01&to=2025-05-31&currency=USD"#)]
async fn alice_pl_may(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req(
        "/api/v1/reports/pl?from=2025-05-01&to=2025-05-31&currency=USD",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(regex = r#"alice sends GET /api/v1/reports/pl\?from=2099-01-01&to=2099-01-31&currency=USD"#)]
async fn alice_pl_future(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req(
        "/api/v1/reports/pl?from=2099-01-01&to=2099-01-31&currency=USD",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[then(expr = "the income breakdown should contain {string} with amount {string}")]
async fn income_breakdown_contains(world: &mut AppWorld, category: String, amount: String) {
    let actual = world
        .last_body
        .get("income_breakdown")
        .and_then(|v| v.get(&category))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert_eq!(
        actual,
        amount.as_str(),
        "Income breakdown '{category}' expected '{amount}', got '{actual}', body: {}",
        world.last_body
    );
}

#[then(expr = "the expense breakdown should contain {string} with amount {string}")]
async fn expense_breakdown_contains(world: &mut AppWorld, category: String, amount: String) {
    let actual = world
        .last_body
        .get("expense_breakdown")
        .and_then(|v| v.get(&category))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert_eq!(
        actual,
        amount.as_str(),
        "Expense breakdown '{category}' expected '{amount}', got '{actual}', body: {}",
        world.last_body
    );
}
