use cucumber::{given, then, when};

use crate::world::{json_req, AppWorld};

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "alice@example\.com", "password": "Short1!Ab" \}"#
)]
async fn register_short_password(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "alice@example.com", "password": "Short1!Ab"}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"the client sends POST /api/v1/auth/register with body \{ "username": "alice", "email": "alice@example\.com", "password": "AllUpperCase1234" \}"#
)]
async fn register_no_special_char(world: &mut AppWorld) {
    let req = json_req(
        "POST",
        "/api/v1/auth/register",
        r#"{"username": "alice", "email": "alice@example.com", "password": "AllUpperCase1234"}"#,
        None,
    );
    world.send(req).await.unwrap();
}

#[given(expr = "{string} has had the maximum number of failed login attempts")]
async fn max_failed_attempts(world: &mut AppWorld, username: String) {
    for _ in 0..5 {
        let body = format!(r#"{{"username": "{username}", "password": "WrongPass!123"}}"#);
        let req = json_req("POST", "/api/v1/auth/login", &body, None);
        world.send(req).await.unwrap();
    }
}

#[given(expr = "a user {string} is registered and locked after too many failed logins")]
async fn register_and_lock(world: &mut AppWorld, username: String) {
    let email = format!("{username}@example.com");
    let reg_body =
        format!(r#"{{"username": "{username}", "email": "{email}", "password": "Str0ng#Pass1"}}"#);
    let req = json_req("POST", "/api/v1/auth/register", &reg_body, None);
    world.send(req).await.unwrap();
    if world.last_status == 201 && username == "alice" {
        world.alice_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());
    }

    for _ in 0..5 {
        let body = format!(r#"{{"username": "{username}", "password": "WrongPass!123"}}"#);
        let req = json_req("POST", "/api/v1/auth/login", &body, None);
        world.send(req).await.unwrap();
    }
}

#[given(expr = "an admin user {string} is registered and logged in")]
async fn register_admin_and_login(world: &mut AppWorld, username: String) {
    let email = format!("{username}@example.com");
    let reg_body =
        format!(r#"{{"username": "{username}", "email": "{email}", "password": "Str0ng#Pass1"}}"#);
    let req = json_req("POST", "/api/v1/auth/register", &reg_body, None);
    world.send(req).await.unwrap();

    if world.last_status == 201 {
        let admin_id = world
            .last_body
            .get("id")
            .and_then(|v| v.as_str())
            .and_then(|s| uuid::Uuid::parse_str(s).ok());

        if let Some(admin_uuid) = admin_id {
            world.promote_to_admin(admin_uuid).await.unwrap();
        }

        let login_body = format!(r#"{{"username": "{username}", "password": "Str0ng#Pass1"}}"#);
        let req = json_req("POST", "/api/v1/auth/login", &login_body, None);
        world.send(req).await.unwrap();
        if world.last_status == 200 {
            world.admin_token = world
                .last_body
                .get("access_token")
                .and_then(|v| v.as_str())
                .map(String::from);
        }
    }
}

#[given("an admin has unlocked alice's account")]
async fn admin_unlocked_alice(world: &mut AppWorld) {
    // Register an admin if we don't have one yet
    if world.admin_token.is_none() {
        let reg_body = r#"{"username": "sysadmin", "email": "sysadmin@example.com", "password": "Str0ng#Pass1"}"#;
        let req = crate::world::json_req("POST", "/api/v1/auth/register", reg_body, None);
        world.send(req).await.unwrap();
        if world.last_status == 201 {
            let admin_id = world
                .last_body
                .get("id")
                .and_then(|v| v.as_str())
                .and_then(|s| uuid::Uuid::parse_str(s).ok());
            if let Some(admin_uuid) = admin_id {
                world.promote_to_admin(admin_uuid).await.unwrap();
            }
            let login_body = r#"{"username": "sysadmin", "password": "Str0ng#Pass1"}"#;
            let req = crate::world::json_req("POST", "/api/v1/auth/login", login_body, None);
            world.send(req).await.unwrap();
            if world.last_status == 200 {
                world.admin_token = world
                    .last_body
                    .get("access_token")
                    .and_then(|v| v.as_str())
                    .map(String::from);
            }
        }
    }
    let admin_bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    if !alice_id.is_empty() && !admin_bearer.is_empty() {
        let req = crate::world::json_req(
            "POST",
            &format!("/api/v1/admin/users/{alice_id}/unlock"),
            "{}",
            Some(&admin_bearer),
        );
        world.send(req).await.unwrap();
    }
}

#[when("the admin sends POST /api/v1/admin/users/{alice_id}/unlock")]
async fn admin_unlock_alice(world: &mut AppWorld) {
    let admin_bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    let req = json_req(
        "POST",
        &format!("/api/v1/admin/users/{alice_id}/unlock"),
        "{}",
        Some(&admin_bearer),
    );
    world.send(req).await.unwrap();
}
