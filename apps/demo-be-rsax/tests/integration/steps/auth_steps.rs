use cucumber::{given, then, when};

use crate::world::{json_req, AppWorld};

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "alice@example\.com", "password": "Str0ng#Pass1" \}"#
)]
async fn register_alice_strong(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1"}"#,
        None,
    );
    world.send(req).await.unwrap();
    if world.last_status == 201 {
        world.alice_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
    }
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "new@example\.com", "password": "Str0ng#Pass1" \}"#
)]
async fn register_alice_new_email(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "new@example.com", "password": "Str0ng#Pass1"}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "not-an-email", "password": "Str0ng#Pass1" \}"#
)]
async fn register_alice_bad_email(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "not-an-email", "password": "Str0ng#Pass1"}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "alice@example\.com", "password": "" \}"#
)]
async fn register_alice_empty_password(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "alice@example.com", "password": ""}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "alice@example\.com", "password": "str0ng#pass1" \}"#
)]
async fn register_alice_no_uppercase(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "alice@example.com", "password": "str0ng#pass1"}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[given(expr = "a user {string} is registered and deactivated")]
async fn register_and_deactivate(world: &mut AppWorld, username: String) {
    // Register the user
    let email = format!("{username}@example.com");
    let body =
        format!(r#"{{"username": "{username}", "email": "{email}", "password": "Str0ng#Pass1"}}"#);
    let req = crate::world::json_req("POST", "/api/v1/auth/register", &body, None);
    world.send(req).await.unwrap();

    // Login to get a token
    let login_body = format!(r#"{{"username": "{username}", "password": "Str0ng#Pass1"}}"#);
    let req = crate::world::json_req("POST", "/api/v1/auth/login", &login_body, None);
    world.send(req).await.unwrap();
    let token = world
        .last_body
        .get("access_token")
        .and_then(|v| v.as_str())
        .map(String::from)
        .unwrap_or_default();

    if !token.is_empty() {
        let req = crate::world::json_req(
            "POST",
            "/api/v1/users/me/deactivate",
            "{}",
            Some(&format!("Bearer {token}")),
        );
        world.send(req).await.unwrap();
    }
}

#[given(regex = r#"a user "([^"]+)" is registered with email "([^"]+)" and password "([^"]+)""#)]
async fn register_with_email_password(
    world: &mut AppWorld,
    username: String,
    email: String,
    password: String,
) {
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

// Login steps
#[when(
    regex = r#"the client sends POST /api/v1/auth/login with body \{ "username": "alice", "password": "Str0ng#Pass1" \}"#
)]
async fn login_alice_correct(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/login",
        r#"{"username": "alice", "password": "Str0ng#Pass1"}"#,
        None,
    );
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
    }
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/login with body \{ "username": "alice", "password": "Wr0ngPass!" \}"#
)]
async fn login_alice_wrong_password(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/login",
        r#"{"username": "alice", "password": "Wr0ngPass!"}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/login with body \{ "username": "ghost", "password": "Str0ng#Pass1" \}"#
)]
async fn login_ghost(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/login",
        r#"{"username": "ghost", "password": "Str0ng#Pass1"}"#,
        None,
    );
    world.send(req).await.unwrap();
}
