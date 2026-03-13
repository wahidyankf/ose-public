"""BDD step definitions for security feature."""

from pytest_bdd import given, parsers, scenarios, then, when

from demo_be_python_fastapi.config import settings
from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "security" / "security.feature"))

_PASSWORD = "Str0ng#Pass1"
_ADMIN_PASSWORD = "Admin#Str0ng1"


def _register_and_promote_admin(client: ServiceClient, username: str, password: str) -> dict:
    """Register a user, immediately set their role to ADMIN, and return user data."""
    user_data = client.register_user(username, password=password)
    client.promote_to_admin(user_data["id"])
    return user_data


@given(
    parsers.parse('a user "{username}" is registered and locked after too many failed logins'),
    target_fixture="locked_user",
)
def register_and_lock_user(client: ServiceClient, username: str) -> dict:
    user_data = client.register_user(username)

    for _ in range(settings.max_failed_login_attempts):
        client.post_login(username, "WrongPass#1234")
    return user_data


@given(
    parsers.parse('an admin user "{username}" is registered and logged in'),
    target_fixture="admin_tokens",
)
def register_admin_and_login(client: ServiceClient, username: str) -> dict:
    user_data = _register_and_promote_admin(client, username, _ADMIN_PASSWORD)
    tokens = client.login_user(username, _ADMIN_PASSWORD)
    return {**tokens, "id": user_data["id"]}


@given(
    parsers.parse('"alice" has had the maximum number of failed login attempts'),
)
def alice_max_failed_attempts(client: ServiceClient, registered_user: dict) -> None:
    for _ in range(settings.max_failed_login_attempts):
        client.post_login("alice", "WrongPass#1234")


@given("an admin has unlocked alice's account")
def admin_unlocks_alice(client: ServiceClient, locked_user: dict) -> None:
    admin_data = _register_and_promote_admin(client, "tmpadmin", _ADMIN_PASSWORD)
    admin_tokens = client.login_user("tmpadmin", _ADMIN_PASSWORD)
    resp = client.post_admin_unlock_user(
        locked_user["id"],
        f"Bearer {admin_tokens['access_token']}",
    )
    assert resp.status_code == 200, f"Unlock failed: {resp.text}"


# --- When steps ---


@when(
    parsers.parse("the admin sends POST /api/v1/admin/users/{{alice_id}}/unlock"),
    target_fixture="response",
)
def admin_unlock_alice(
    client: ServiceClient, locked_user: dict, admin_tokens: dict
) -> FakeResponse:
    return client.post_admin_unlock_user(
        locked_user["id"],
        f"Bearer {admin_tokens['access_token']}",
    )


# --- Then steps ---


@then('alice\'s account status should be "locked"')
def check_alice_locked(client: ServiceClient, registered_user: dict) -> None:
    # Attempt login to verify the account is locked — locked accounts return 401
    resp = client.post_login("alice", _PASSWORD)
    assert resp.status_code == 401, (
        f"Expected 401 for locked account, got {resp.status_code}: {resp.text}"
    )
