"""BDD step definitions for expense management feature."""

import json

from pytest_bdd import given, parsers, scenarios, when

from tests.integration.service_client import FakeResponse, ServiceClient
from tests.unit.conftest import GHERKIN_ROOT

scenarios(str(GHERKIN_ROOT / "expenses" / "expense-management.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_expense(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given(
    parsers.parse("alice has created an entry with body {body}"),
    target_fixture="created_expense",
)
def alice_create_entry(client: ServiceClient, alice_tokens: dict, body: str) -> dict:
    data = json.loads(body)
    resp = client.post_expense(f"Bearer {alice_tokens['accessToken']}", data)
    assert resp.status_code == 201, f"Create expense failed: {resp.text}"
    return resp.json()


@given("alice has created 3 entries", target_fixture="created_expenses")
def alice_create_3_entries(client: ServiceClient, alice_tokens: dict) -> list:
    expenses = []
    for i in range(3):
        resp = client.post_expense(
            f"Bearer {alice_tokens['accessToken']}",
            {
                "amount": f"{10 + i}.00",
                "currency": "USD",
                "category": "food",
                "description": f"Entry {i}",
                "date": f"2025-01-{10 + i:02d}",
                "type": "expense",
            },
        )
        assert resp.status_code == 201
        expenses.append(resp.json())
    return expenses


# --- When steps ---


@when(
    parsers.parse("alice sends POST /api/v1/expenses with body {body}"),
    target_fixture="response",
)
def alice_post_expense(client: ServiceClient, alice_tokens: dict, body: str) -> FakeResponse:
    data = json.loads(body)
    return client.post_expense(f"Bearer {alice_tokens['accessToken']}", data)


@when(
    'the client sends POST /api/v1/expenses with body { "amount": "10.00", "currency": "USD", "category": "food", "description": "Coffee", "date": "2025-01-01", "type": "expense" }',  # noqa: E501
    target_fixture="response",
)
def unauth_post_expense(client: ServiceClient) -> FakeResponse:
    return client.post_expense(
        None,
        {
            "amount": "10.00",
            "currency": "USD",
            "category": "food",
            "description": "Coffee",
            "date": "2025-01-01",
            "type": "expense",
        },
    )


@when("alice sends GET /api/v1/expenses/{expenseId}", target_fixture="response")
def alice_get_expense(
    client: ServiceClient, alice_tokens: dict, created_expense: dict
) -> FakeResponse:
    return client.get_expense(
        created_expense["id"],
        f"Bearer {alice_tokens['accessToken']}",
    )


@when("alice sends GET /api/v1/expenses", target_fixture="response")
def alice_list_expenses(client: ServiceClient, alice_tokens: dict) -> FakeResponse:
    return client.get_expenses(f"Bearer {alice_tokens['accessToken']}")


@when(
    parsers.parse("alice sends PUT /api/v1/expenses/{{expenseId}} with body {body}"),
    target_fixture="response",
)
def alice_update_expense(
    client: ServiceClient, alice_tokens: dict, created_expense: dict, body: str
) -> FakeResponse:
    data = json.loads(body)
    return client.put_expense(
        created_expense["id"],
        f"Bearer {alice_tokens['accessToken']}",
        data,
    )


@when("alice sends DELETE /api/v1/expenses/{expenseId}", target_fixture="response")
def alice_delete_expense(
    client: ServiceClient, alice_tokens: dict, created_expense: dict
) -> FakeResponse:
    return client.delete_expense(
        created_expense["id"],
        f"Bearer {alice_tokens['accessToken']}",
    )
