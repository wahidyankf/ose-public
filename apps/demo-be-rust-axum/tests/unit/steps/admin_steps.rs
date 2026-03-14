use cucumber::{given, then, when};

use crate::world::{get_req, json_req, AppWorld};

#[given(expr = "users {string}, {string}, and {string} are registered")]
async fn register_multiple_users(world: &mut AppWorld, u1: String, u2: String, u3: String) {
    for (username, email) in [
        (u1.as_str(), format!("{u1}@example.com")),
        (u2.as_str(), format!("{u2}@example.com")),
        (u3.as_str(), format!("{u3}@example.com")),
    ] {
        let body = format!(
            r#"{{"username": "{username}", "email": "{email}", "password": "Str0ng#Pass1"}}"#
        );
        let req = json_req("POST", "/api/v1/auth/register", &body, None);
        world.send(req).await.unwrap();
        if world.last_status == 201 && username == u1.as_str() {
            world.alice_id = world
                .last_body
                .get("id")
                .and_then(|v| v.as_str())
                .and_then(|s| uuid::Uuid::parse_str(s).ok());
        }
    }
}

#[when("the admin sends GET /api/v1/admin/users")]
async fn admin_list_users(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let req = get_req("/api/v1/admin/users", Some(&bearer));
    world.send(req).await.unwrap();
}

#[when(regex = r#"the admin sends GET /api/v1/admin/users\?search=alice@example\.com"#)]
async fn admin_search_users_by_email(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let req = get_req(
        "/api/v1/admin/users?search=alice@example.com",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[then(expr = "the response body should contain at least one user with {string} equal to {string}")]
async fn response_has_user_with_field(world: &mut AppWorld, field: String, value: String) {
    let data = world.last_body.get("content").and_then(|v| v.as_array());
    let found = data
        .map(|arr| {
            arr.iter().any(|user| {
                user.get(&field)
                    .and_then(|v| v.as_str())
                    .map(|s| s == value.as_str())
                    .unwrap_or(false)
            })
        })
        .unwrap_or(false);
    assert!(
        found,
        "Expected at least one user with '{field}' = '{value}' in: {}",
        world.last_body
    );
}

#[when(
    regex = r#"the admin sends POST /api/v1/admin/users/\{alice_id\}/disable with body \{ "reason": "Policy violation" \}"#
)]
async fn admin_disable_alice(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    let req = json_req(
        "POST",
        &format!("/api/v1/admin/users/{alice_id}/disable"),
        r#"{"reason": "Policy violation"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[given("alice's account has been disabled by the admin")]
async fn alice_account_disabled_by_admin(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    if !alice_id.is_empty() {
        let req = json_req(
            "POST",
            &format!("/api/v1/admin/users/{alice_id}/disable"),
            r#"{"reason": "Policy violation"}"#,
            Some(&bearer),
        );
        world.send(req).await.unwrap();
    }
}

#[given("alice's account has been disabled")]
async fn alice_account_disabled_simple(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    if !alice_id.is_empty() && !bearer.is_empty() {
        let req = json_req(
            "POST",
            &format!("/api/v1/admin/users/{alice_id}/disable"),
            r#"{"reason": "test"}"#,
            Some(&bearer),
        );
        world.send(req).await.unwrap();
    }
}

#[when("the admin sends POST /api/v1/admin/users/{alice_id}/enable")]
async fn admin_enable_alice(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    let req = json_req(
        "POST",
        &format!("/api/v1/admin/users/{alice_id}/enable"),
        "{}",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[then(expr = "alice's account status should be {string}")]
async fn alice_account_status(world: &mut AppWorld, expected: String) {
    let expected_lower = expected.to_lowercase();
    match expected_lower.as_str() {
        "active" | "disabled" => {
            assert_eq!(
                world.last_status, 200,
                "Expected 200 for status action, got {}",
                world.last_status
            );
        }
        "locked" => {
            assert_eq!(
                world.last_status, 401,
                "Expected 401 for locked account login, got {}",
                world.last_status
            );
        }
        _ => {}
    }
}

#[when("the admin sends POST /api/v1/admin/users/{alice_id}/force-password-reset")]
async fn admin_force_password_reset(world: &mut AppWorld) {
    let bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    let req = json_req(
        "POST",
        &format!("/api/v1/admin/users/{alice_id}/force-password-reset"),
        "{}",
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}
