"""BDD step definitions for admin feature."""

from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient
from tests.integration.steps.security_steps import _ADMIN_PASSWORD, _register_and_promote_admin

scenarios(str(GHERKIN_ROOT / "admin" / "admin.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    parsers.parse('an admin user "{username}" is registered and logged in'),
    target_fixture="admin_tokens",
)
def admin_login(client: ServiceClient, username: str) -> dict:
    user_data = _register_and_promote_admin(client, username, _ADMIN_PASSWORD)
    tokens = client.login_user(username, _ADMIN_PASSWORD)
    return {**tokens, "admin_id": user_data["id"]}


@given(
    parsers.parse('users "{a}", "{b}", and "{c}" are registered'),
    target_fixture="registered_users",
)
def register_multiple_users(client: ServiceClient, a: str, b: str, c: str) -> list:
    users = []
    for username in [a, b, c]:
        users.append(client.register_user(username))
    return users


@given(
    parsers.parse('"{username}" has logged in and stored the access token'),
    target_fixture="alice_tokens",
)
def alice_login_for_admin(client: ServiceClient, username: str) -> dict:
    return client.login_user(username, _PASSWORD)


@given("alice's account has been disabled by the admin")
def disable_alice_by_admin(
    client: ServiceClient, registered_users: list, admin_tokens: dict
) -> None:
    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    resp = client.post_admin_disable_user(
        alice["id"],
        f"Bearer {admin_tokens['access_token']}",
        reason="Test disable",
    )
    assert resp.status_code == 200


@given("alice's account has been disabled")
def alice_account_disabled(
    client: ServiceClient, registered_users: list, admin_tokens: dict
) -> None:
    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    resp = client.post_admin_disable_user(
        alice["id"],
        f"Bearer {admin_tokens['access_token']}",
        reason="Initial disable",
    )
    assert resp.status_code == 200


# --- When steps ---


@when("the admin sends GET /api/v1/admin/users", target_fixture="response")
def admin_list_users(client: ServiceClient, admin_tokens: dict) -> FakeResponse:
    return client.get_admin_users(f"Bearer {admin_tokens['access_token']}")


@when(
    "the admin sends GET /api/v1/admin/users?email=alice@example.com",
    target_fixture="response",
)
def admin_search_users_by_email(client: ServiceClient, admin_tokens: dict) -> FakeResponse:
    return client.get_admin_users(
        f"Bearer {admin_tokens['access_token']}",
        email="alice@example.com",
    )


@when(
    parsers.parse("the admin sends POST /api/v1/admin/users/{{alice_id}}/disable with body {body}"),
    target_fixture="response",
)
def admin_disable_alice(
    client: ServiceClient, registered_users: list, admin_tokens: dict, body: str
) -> FakeResponse:
    import json

    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    data = json.loads(body)
    return client.post_admin_disable_user(
        alice["id"],
        f"Bearer {admin_tokens['access_token']}",
        reason=data.get("reason"),
    )


@when(
    "the client sends GET /api/v1/users/me with alice's access token",
    target_fixture="response",
)
def get_me_alice_token(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.get_me(f"Bearer {alice_tokens['access_token']}")


@when(
    parsers.parse("the admin sends POST /api/v1/admin/users/{{alice_id}}/enable"),
    target_fixture="response",
)
def admin_enable_alice(
    client: ServiceClient, registered_users: list, admin_tokens: dict
) -> FakeResponse:
    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    return client.post_admin_enable_user(
        alice["id"],
        f"Bearer {admin_tokens['access_token']}",
    )


@when(
    parsers.parse("the admin sends POST /api/v1/admin/users/{{alice_id}}/force-password-reset"),
    target_fixture="response",
)
def admin_force_password_reset(
    client: ServiceClient, registered_users: list, admin_tokens: dict
) -> FakeResponse:
    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    return client.post_admin_force_password_reset(
        alice["id"],
        f"Bearer {admin_tokens['access_token']}",
    )


# --- Then steps ---


@then(
    'the response body should contain at least one user with "email" equal to "alice@example.com"'
)
def check_alice_in_results(response: FakeResponse) -> None:
    body = response.json()
    users = body.get("data", [])
    assert any(u.get("email") == "alice@example.com" for u in users), (
        f"alice@example.com not found in users: {users}"
    )


@then('alice\'s account status should be "disabled"')
def check_alice_disabled(
    client: ServiceClient, registered_users: list, admin_tokens: dict
) -> None:
    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    resp = client.get_admin_users(
        f"Bearer {admin_tokens['access_token']}",
        email="alice@example.com",
    )
    body = resp.json()
    users = body.get("data", [])
    alice_info = next((u for u in users if u["username"] == "alice"), None)
    assert alice_info is not None
    assert alice_info["status"].upper() == "DISABLED"


@then('alice\'s account status should be "active"')
def check_alice_active(
    client: ServiceClient, registered_users: list, admin_tokens: dict
) -> None:
    alice = next((u for u in registered_users if u["username"] == "alice"), None)
    assert alice is not None
    resp = client.get_admin_users(
        f"Bearer {admin_tokens['access_token']}",
        email="alice@example.com",
    )
    body = resp.json()
    users = body.get("data", [])
    alice_info = next((u for u in users if u["username"] == "alice"), None)
    assert alice_info is not None
    assert alice_info["status"].upper() == "ACTIVE"
