use cucumber::{given, then, when};

use crate::world::{get_req, json_req, AppWorld};

#[when("alice decodes her access token payload")]
async fn decode_alice_token(world: &mut AppWorld) {
    let bearer = world.bearer();
    let req = get_req("/api/v1/tokens/claims", Some(&bearer));
    world.send(req).await.unwrap();
}

#[then(expr = "the token should contain a non-null {string} claim")]
async fn token_claim_non_null(world: &mut AppWorld, claim: String) {
    let val = world.last_body.get(&claim);
    assert!(
        val.is_some() && !val.unwrap().is_null(),
        "Claim '{claim}' should be non-null in body: {}",
        world.last_body
    );
}

#[when("the client sends GET /.well-known/jwks.json")]
async fn get_jwks(world: &mut AppWorld) {
    let req = get_req("/.well-known/jwks.json", None);
    world.send(req).await.unwrap();
}

#[then(expr = "the response body should contain at least one key in the {string} array")]
async fn jwks_has_keys(world: &mut AppWorld, field: String) {
    let keys = world
        .last_body
        .get(&field)
        .and_then(|v| v.as_array())
        .map(|a| a.len())
        .unwrap_or(0);
    assert!(
        keys >= 1,
        "Expected at least one key in '{field}', got {keys}"
    );
}

#[then("alice's access token should be recorded as revoked")]
async fn token_is_revoked(world: &mut AppWorld) {
    // Try to use the token to access a protected endpoint
    let token = world.auth_token.clone().unwrap_or_default();
    let req = get_req("/api/v1/users/me", Some(&format!("Bearer {token}")));
    world.send(req).await.unwrap();
    assert_eq!(
        world.last_status, 401,
        "Expected 401 for revoked token, got {}",
        world.last_status
    );
}

#[given("alice has logged out and her access token is blacklisted")]
async fn alice_logged_out_blacklisted(world: &mut AppWorld) {
    let token = world.auth_token.clone().unwrap_or_default();
    let body = format!(r#"{{"access_token": "{token}"}}"#);
    let req = json_req("POST", "/api/v1/auth/logout", &body, None);
    world.send(req).await.unwrap();
}

#[given(
    regex = r#"the admin has disabled alice's account via POST /api/v1/admin/users/\{alice_id\}/disable"#
)]
async fn admin_disabled_alice(world: &mut AppWorld) {
    let admin_bearer = world.admin_bearer();
    let alice_id = world.alice_id.map(|id| id.to_string()).unwrap_or_default();
    if !alice_id.is_empty() && !admin_bearer.is_empty() {
        let req = json_req(
            "POST",
            &format!("/api/v1/admin/users/{alice_id}/disable"),
            r#"{"reason": "test"}"#,
            Some(&admin_bearer),
        );
        world.send(req).await.unwrap();
    }
}
