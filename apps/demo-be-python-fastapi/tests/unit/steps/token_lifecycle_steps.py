"""BDD step definitions for token lifecycle feature."""

from pytest_bdd import given, scenarios, then, when

from demo_be_python_fastapi.auth.jwt_service import create_expired_refresh_token
from tests.integration.service_client import FakeResponse, ServiceClient
from tests.unit.conftest import GHERKIN_ROOT

scenarios(str(GHERKIN_ROOT / "authentication" / "token-lifecycle.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token and refresh token',
    target_fixture="alice_tokens",
)
def alice_login_tokens(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given("alice's refresh token has expired", target_fixture="alice_tokens")
def alice_expired_refresh_token(client: ServiceClient, registered_user: dict) -> dict:
    # Get a real access token but substitute an expired refresh token
    tokens = client.login_user("alice", _PASSWORD)
    tokens["refreshToken"] = create_expired_refresh_token(registered_user["id"])
    return tokens


@given(
    "alice has used her refresh token to get a new token pair",
    target_fixture="alice_tokens",
)
def alice_used_refresh_token(client: ServiceClient, registered_user: dict) -> dict:
    tokens = client.login_user("alice", _PASSWORD)
    original_refresh = tokens["refreshToken"]
    # Use the refresh token once so it becomes revoked
    resp = client.post_refresh(original_refresh)
    assert resp.status_code == 200
    # Return the tokens with the original (now revoked) refresh token stored separately
    return {**tokens, "_original_refresh": original_refresh}


@given('the user "alice" has been deactivated', target_fixture="deactivated_alice")
def deactivate_alice(client: ServiceClient, registered_user: dict, alice_tokens: dict) -> dict:
    resp = client.post_me_deactivate(f"Bearer {alice_tokens['accessToken']}")
    assert resp.status_code == 200
    return registered_user


@given("alice has already logged out once")
def alice_already_logged_out(
    client: ServiceClient, registered_user: dict, alice_tokens: dict
) -> None:
    client.post_logout(f"Bearer {alice_tokens['accessToken']}")


# --- When steps ---


@when("alice sends POST /api/v1/auth/refresh with her refresh token", target_fixture="response")
def alice_refresh(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.post_refresh(alice_tokens["refreshToken"])


_STEP_REFRESH_ORIGINAL = "alice sends POST /api/v1/auth/refresh with her original refresh token"


@when(_STEP_REFRESH_ORIGINAL, target_fixture="response")
def alice_refresh_with_original(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    original = alice_tokens.get("_original_refresh", alice_tokens["refreshToken"])
    return client.post_refresh(original)


@when("alice sends POST /api/v1/auth/logout with her access token", target_fixture="response")
def alice_logout(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.post_logout(f"Bearer {alice_tokens['accessToken']}")


@when("alice sends POST /api/v1/auth/logout-all with her access token", target_fixture="response")
def alice_logout_all(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.post_logout_all(f"Bearer {alice_tokens['accessToken']}")


# --- Then steps ---


@then("alice's access token should be invalidated")
def check_access_token_invalidated(client: ServiceClient, alice_tokens: dict) -> None:
    resp = client.get_me(f"Bearer {alice_tokens['accessToken']}")
    assert resp.status_code == 401, f"Expected 401 after logout, got {resp.status_code}"
