"""BDD step definitions for unit handling feature."""

import json

from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "expenses" / "unit-handling.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_units(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given(
    parsers.parse("alice has created an expense with body {body}"),
    target_fixture="created_expense",
)
def alice_create_unit_expense(client: ServiceClient, alice_tokens: dict, body: str) -> dict:
    data = json.loads(body)
    resp = client.post_expense(f"Bearer {alice_tokens['access_token']}", data)
    assert resp.status_code == 201, f"Create expense failed: {resp.text}"
    return resp.json()


# --- When steps ---


@when("alice sends GET /api/v1/expenses/{expenseId}", target_fixture="response")
def alice_get_unit_expense(
    client: ServiceClient, alice_tokens: dict, created_expense: dict
) -> FakeResponse:
    return client.get_expense(
        created_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
    )


@when(
    parsers.parse("alice sends POST /api/v1/expenses with body {body}"),
    target_fixture="response",
)
def alice_post_unit_expense(
    client: ServiceClient, alice_tokens: dict, body: str
) -> FakeResponse:
    data = json.loads(body)
    return client.post_expense(f"Bearer {alice_tokens['access_token']}", data)


# --- Then steps ---


@then(parsers.parse('the response body should contain "quantity" equal to {value}'))
def check_quantity(response: FakeResponse, value: str) -> None:
    body = response.json()
    assert "quantity" in body, f"'quantity' not in response: {body}"
    actual = body["quantity"]
    expected = float(value)
    assert float(actual) == expected, f"Expected quantity={expected}, got {actual}"


@then(parsers.parse('the response body should contain "unit" equal to "{value}"'))
def check_unit(response: FakeResponse, value: str) -> None:
    body = response.json()
    assert "unit" in body, f"'unit' not in response: {body}"
    assert body["unit"] == value, f"Expected unit={value!r}, got {body['unit']!r}"
