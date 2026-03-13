"""BDD step definitions for user account feature."""

import json

from pytest_bdd import given, parsers, scenarios, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "user-lifecycle" / "user-account.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given("alice has deactivated her own account via POST /api/v1/users/me/deactivate")
def alice_self_deactivate(client: ServiceClient, alice_tokens: dict) -> None:
    resp = client.post_me_deactivate(f"Bearer {alice_tokens['access_token']}")
    assert resp.status_code == 200


# --- When steps ---


@when("alice sends GET /api/v1/users/me", target_fixture="response")
def alice_get_me(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.get_me(f"Bearer {alice_tokens['access_token']}")


@when(
    parsers.parse("alice sends PATCH /api/v1/users/me with body {body}"),
    target_fixture="response",
)
def alice_patch_me(client: ServiceClient, alice_tokens: dict, body: str) -> FakeResponse:
    data = json.loads(body)
    return client.patch_me(
        f"Bearer {alice_tokens['access_token']}",
        data.get("display_name", ""),
    )


@when(
    parsers.parse("alice sends POST /api/v1/users/me/password with body {body}"),
    target_fixture="response",
)
def alice_change_password(client: ServiceClient, alice_tokens: dict, body: str) -> FakeResponse:
    data = json.loads(body)
    return client.post_me_password(
        f"Bearer {alice_tokens['access_token']}",
        data.get("old_password", ""),
        data.get("new_password", ""),
    )


@when("alice sends POST /api/v1/users/me/deactivate", target_fixture="response")
def alice_deactivate(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.post_me_deactivate(f"Bearer {alice_tokens['access_token']}")
