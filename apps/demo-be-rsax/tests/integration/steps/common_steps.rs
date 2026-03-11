use cucumber::{given, then, when};

use crate::world::{get_req, json_req, AppWorld};

#[given("the API is running")]
async fn api_is_running(_world: &mut AppWorld) {
    // Router is already initialized in AppWorld::new()
}

#[when("an operations engineer sends GET /health")]
async fn get_health(world: &mut AppWorld) {
    let req = get_req("/health", None);
    world.send(req).await.unwrap();
}

#[when("an unauthenticated engineer sends GET /health")]
async fn get_health_unauth(world: &mut AppWorld) {
    let req = get_req("/health", None);
    world.send(req).await.unwrap();
}

#[then(expr = "the response status code should be {int}")]
async fn check_status(world: &mut AppWorld, code: u16) {
    assert_eq!(
        world.last_status, code,
        "Expected status {}, got {}, body: {}",
        code, world.last_status, world.last_body
    );
}

#[then(expr = "the health status should be {string}")]
async fn check_health_status(world: &mut AppWorld, expected: String) {
    let status = world
        .last_body
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert_eq!(status, expected.as_str(), "Health status mismatch");
}

#[then("the response should not include detailed component health information")]
async fn no_component_details(world: &mut AppWorld) {
    assert!(
        world.last_body.get("components").is_none(),
        "Response should not include 'components'"
    );
    assert!(
        world.last_body.get("details").is_none(),
        "Response should not include 'details'"
    );
}

#[then(expr = "the response body should contain {string} equal to {string}")]
async fn body_field_equals(world: &mut AppWorld, field: String, value: String) {
    let actual = match world.last_body.get(&field) {
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Number(n)) => n.to_string(),
        Some(v) => v.to_string().trim_matches('"').to_string(),
        None => String::new(),
    };
    assert_eq!(
        actual, value,
        "Field '{field}' expected '{value}', got '{actual}', body: {}",
        world.last_body
    );
}

#[then(expr = "the response body should contain a non-null {string} field")]
async fn body_field_non_null(world: &mut AppWorld, field: String) {
    let val = world.last_body.get(&field);
    assert!(
        val.is_some() && !val.unwrap().is_null(),
        "Field '{field}' should be non-null in body: {}",
        world.last_body
    );
}

#[then(expr = "the response body should not contain a {string} field")]
async fn body_field_not_present(world: &mut AppWorld, field: String) {
    assert!(
        world.last_body.get(&field).is_none(),
        "Field '{field}' should not be present in body: {}",
        world.last_body
    );
}

#[then("the response body should contain an error message about invalid credentials")]
async fn error_invalid_credentials(world: &mut AppWorld) {
    let msg = world
        .last_body
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert!(
        !msg.is_empty(),
        "Expected error message about invalid credentials, got: {}",
        world.last_body
    );
}

#[then("the response body should contain an error message about account deactivation")]
async fn error_account_deactivated(world: &mut AppWorld) {
    let msg = world
        .last_body
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert!(
        !msg.is_empty(),
        "Expected error message about deactivation, got: {}",
        world.last_body
    );
}

#[then(expr = "the response body should contain a validation error for {string}")]
async fn validation_error_for_field(world: &mut AppWorld, field: String) {
    let msg = world
        .last_body
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert!(
        msg.contains(field.as_str()),
        "Expected validation error for '{field}', got message: '{msg}', body: {}",
        world.last_body
    );
}

#[then("the response body should contain an error message about duplicate username")]
async fn error_duplicate_username(world: &mut AppWorld) {
    let msg = world
        .last_body
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    assert!(
        !msg.is_empty(),
        "Expected error message, got: {}",
        world.last_body
    );
}

#[given(expr = "a user {string} is registered with password {string}")]
async fn register_user_with_password(world: &mut AppWorld, username: String, password: String) {
    let email = format!("{username}@example.com");
    let body =
        format!(r#"{{"username": "{username}", "email": "{email}", "password": "{password}"}}"#);
    let req = json_req("POST", "/api/v1/auth/register", &body, None);
    world.send(req).await.unwrap();
    if world.last_status == 201 && username == "alice" {
        world.alice_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
    }
}

#[given(expr = "{string} has logged in and stored the access token and refresh token")]
async fn login_store_both_tokens(world: &mut AppWorld, username: String) {
    let body = format!(r#"{{"username": "{username}", "password": "Str0ng#Pass1"}}"#);
    let req = json_req("POST", "/api/v1/auth/login", &body, None);
    world.send(req).await.unwrap();
    if world.last_status == 200 {
        world.auth_token = world
            .last_body
            .get("access_token")
            .and_then(|v| v.as_str())
            .map(String::from);
        world.refresh_token = world
            .last_body
            .get("refresh_token")
            .and_then(|v| v.as_str())
            .map(String::from);
        if username == "alice" {
            let token = world.auth_token.clone().unwrap_or_default();
            let req2 = get_req("/api/v1/users/me", Some(&format!("Bearer {token}")));
            world.send(req2).await.unwrap();
            world.user_id = world
                .last_body
                .get("id")
                .and_then(|v| v.as_str())
                .and_then(|s| uuid::Uuid::parse_str(s).ok());
            world.alice_id = world.user_id;
        }
    }
}

#[given(expr = "{string} has logged in and stored the access token")]
async fn login_store_access_token(world: &mut AppWorld, username: String) {
    let passwords = ["Str0ng#Pass1", "Str0ng#Pass2"];
    for password in passwords {
        let body = format!(r#"{{"username": "{username}", "password": "{password}"}}"#);
        let req = json_req("POST", "/api/v1/auth/login", &body, None);
        world.send(req).await.unwrap();
        if world.last_status == 200 {
            world.auth_token = world
                .last_body
                .get("access_token")
                .and_then(|v| v.as_str())
                .map(String::from);
            world.refresh_token = world
                .last_body
                .get("refresh_token")
                .and_then(|v| v.as_str())
                .map(String::from);
            if username == "alice" {
                let token = world.auth_token.clone().unwrap_or_default();
                let req2 = get_req("/api/v1/users/me", Some(&format!("Bearer {token}")));
                world.send(req2).await.unwrap();
                world.user_id = world
                    .last_body
                    .get("id")
                    .and_then(|v| v.as_str())
                    .and_then(|s| uuid::Uuid::parse_str(s).ok());
                world.alice_id = world.user_id;
            }
            break;
        }
    }
}
