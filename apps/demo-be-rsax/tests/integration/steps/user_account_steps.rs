use cucumber::{given, then, when};

use crate::world::{get_req, json_req, AppWorld};

#[when("alice sends GET /api/v1/users/me")]
async fn get_alice_profile(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req("/api/v1/users/me", Some(&bearer));
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"alice sends PATCH /api/v1/users/me with body \{ "display_name": "Alice Smith" \}"#
)]
async fn patch_display_name(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "PATCH",
        "/api/v1/users/me",
        r#"{"display_name": "Alice Smith"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"alice sends POST /api/v1/users/me/password with body \{ "old_password": "Str0ng#Pass1", "new_password": "NewPass#456" \}"#
)]
async fn change_password_correct(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/users/me/password",
        r#"{"old_password": "Str0ng#Pass1", "new_password": "NewPass#456"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when(
    regex = r#"alice sends POST /api/v1/users/me/password with body \{ "old_password": "Wr0ngOld!", "new_password": "NewPass#456" \}"#
)]
async fn change_password_wrong_old(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req(
        "POST",
        "/api/v1/users/me/password",
        r#"{"old_password": "Wr0ngOld!", "new_password": "NewPass#456"}"#,
        Some(&bearer),
    );
    world.send(req).await.unwrap();
}

#[when("alice sends POST /api/v1/users/me/deactivate")]
async fn deactivate_alice(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req("POST", "/api/v1/users/me/deactivate", "{}", Some(&bearer));
    world.send(req).await.unwrap();
}

#[given("alice has deactivated her own account via POST /api/v1/users/me/deactivate")]
async fn alice_deactivated_herself(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = json_req("POST", "/api/v1/users/me/deactivate", "{}", Some(&bearer));
    world.send(req).await.unwrap();
}

#[when("the client sends GET /api/v1/users/me with alice's access token")]
async fn get_me_with_alice_token(world: &mut AppWorld) {
    let token = world.auth_token.clone().unwrap_or_default();
    let req = get_req("/api/v1/users/me", Some(&format!("Bearer {token}")));
    world.send(req).await.unwrap();
}
