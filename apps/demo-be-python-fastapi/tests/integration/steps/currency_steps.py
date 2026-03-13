"""BDD step definitions for currency handling feature."""

import json

from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "expenses" / "currency-handling.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_currency(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given(
    parsers.parse("alice has created an expense with body {body}"),
    target_fixture="created_expense",
)
def alice_create_currency_expense(client: ServiceClient, alice_tokens: dict, body: str) -> dict:
    data = json.loads(body)
    resp = client.post_expense(f"Bearer {alice_tokens['access_token']}", data)
    assert resp.status_code == 201, f"Create expense failed: {resp.text}"
    return resp.json()


# --- When steps ---


@when("alice sends GET /api/v1/expenses/{expenseId}", target_fixture="response")
def alice_get_currency_expense(
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
def alice_post_currency_expense(
    client: ServiceClient, alice_tokens: dict, body: str
) -> FakeResponse:
    data = json.loads(body)
    return client.post_expense(f"Bearer {alice_tokens['access_token']}", data)


@when("alice sends GET /api/v1/expenses/summary", target_fixture="response")
def alice_get_summary(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.get_expenses_summary(f"Bearer {alice_tokens['access_token']}")


# --- Then steps ---


@then(parsers.parse('the response body should contain "{currency}" total equal to "{total}"'))
def check_currency_total(response: FakeResponse, currency: str, total: str) -> None:
    body = response.json()
    assert currency in body, f"Currency '{currency}' not found in summary: {body}"
    assert str(body[currency]) == total, (
        f"Expected {currency} total={total}, got {body[currency]}"
    )
