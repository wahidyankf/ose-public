"""BDD step definitions for token management feature."""

import base64
import json

from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient
from tests.integration.steps.security_steps import _ADMIN_PASSWORD, _register_and_promote_admin

scenarios(str(GHERKIN_ROOT / "token-management" / "tokens.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_for_tokens(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given("alice has logged out and her access token is blacklisted")
def alice_logout_blacklisted(client: ServiceClient, alice_tokens: dict) -> None:
    client.post_logout(f"Bearer {alice_tokens['access_token']}")


@given(
    parsers.parse('an admin user "{username}" is registered and logged in'),
    target_fixture="admin_tokens",
)
def admin_login_for_tokens(client: ServiceClient, username: str) -> dict:
    user_data = _register_and_promote_admin(client, username, _ADMIN_PASSWORD)
    tokens = client.login_user(username, _ADMIN_PASSWORD)
    return {**tokens, "id": user_data["id"]}


@given("the admin has disabled alice's account via POST /api/v1/admin/users/{alice_id}/disable")
def admin_disable_alice(
    client: ServiceClient, registered_user: dict, admin_tokens: dict
) -> None:
    resp = client.post_admin_disable_user(
        registered_user["id"],
        f"Bearer {admin_tokens['access_token']}",
        reason="Test",
    )
    assert resp.status_code == 200, f"Disable failed: {resp.text}"


# --- When steps ---


@when("alice decodes her access token payload", target_fixture="decoded_payload")
def alice_decode_token(alice_tokens: dict) -> dict:
    token = alice_tokens["access_token"]
    parts = token.split(".")
    assert len(parts) == 3, "Invalid JWT structure"
    payload_b64 = parts[1]
    padding = 4 - len(payload_b64) % 4
    if padding != 4:
        payload_b64 += "=" * padding
    return json.loads(base64.urlsafe_b64decode(payload_b64).decode("utf-8"))


@when("the client sends GET /.well-known/jwks.json", target_fixture="response")
def get_jwks(client: ServiceClient) -> FakeResponse:
    return client.get_jwks()


@when("alice sends POST /api/v1/auth/logout with her access token", target_fixture="response")
def alice_logout_tokens(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.post_logout(f"Bearer {alice_tokens['access_token']}")


@when(
    "the client sends GET /api/v1/users/me with alice's access token",
    target_fixture="response",
)
def get_me_with_alice_token(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.get_me(f"Bearer {alice_tokens['access_token']}")


# --- Then steps ---


@then(parsers.parse('the token should contain a non-null "{claim}" claim'))
def check_token_claim(decoded_payload: dict, claim: str) -> None:
    assert claim in decoded_payload, f"Claim '{claim}' not in token: {decoded_payload}"
    assert decoded_payload[claim] is not None, f"Claim '{claim}' is null"


@then('the response body should contain at least one key in the "keys" array')
def check_jwks_keys(response: FakeResponse) -> None:
    body = response.json()
    assert "keys" in body, f"No 'keys' field in JWKS response: {body}"
    assert len(body["keys"]) > 0, "JWKS keys array is empty"


@then("alice's access token should be recorded as revoked")
def check_alice_token_revoked(client: ServiceClient, alice_tokens: dict) -> None:
    resp = client.get_me(f"Bearer {alice_tokens['access_token']}")
    assert resp.status_code == 401, f"Expected 401 for revoked token, got {resp.status_code}"
