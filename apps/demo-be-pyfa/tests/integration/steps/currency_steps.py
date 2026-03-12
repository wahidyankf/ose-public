"""BDD step definitions for currency handling feature."""

import json

from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT

scenarios(str(GHERKIN_ROOT / "expenses" / "currency-handling.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_currency(client: TestClient, registered_user: dict) -> dict:
    resp = client.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": _PASSWORD},
    )
    assert resp.status_code == 200
    return resp.json()


@given(
    parsers.parse("alice has created an expense with body {body}"),
    target_fixture="created_expense",
)
def alice_create_currency_expense(client: TestClient, alice_tokens: dict, body: str) -> dict:
    data = json.loads(body)
    resp = client.post(
        "/api/v1/expenses",
        json=data,
        headers={"Authorization": f"Bearer {alice_tokens['access_token']}"},
    )
    assert resp.status_code == 201, f"Create expense failed: {resp.text}"
    return resp.json()


# --- When steps ---


@when("alice sends GET /api/v1/expenses/{expenseId}", target_fixture="response")
def alice_get_currency_expense(client: TestClient, alice_tokens: dict, created_expense: dict):  # type: ignore[no-untyped-def]
    return client.get(
        f"/api/v1/expenses/{created_expense['id']}",
        headers={"Authorization": f"Bearer {alice_tokens['access_token']}"},
    )


@when(
    parsers.parse("alice sends POST /api/v1/expenses with body {body}"),
    target_fixture="response",
)
def alice_post_currency_expense(client: TestClient, alice_tokens: dict, body: str):  # type: ignore[no-untyped-def]
    data = json.loads(body)
    return client.post(
        "/api/v1/expenses",
        json=data,
        headers={"Authorization": f"Bearer {alice_tokens['access_token']}"},
    )


@when("alice sends GET /api/v1/expenses/summary", target_fixture="response")
def alice_get_summary(client: TestClient, alice_tokens: dict):  # type: ignore[no-untyped-def]
    return client.get(
        "/api/v1/expenses/summary",
        headers={"Authorization": f"Bearer {alice_tokens['access_token']}"},
    )


# --- Then steps ---


@then(parsers.parse('the response body should contain "{currency}" total equal to "{total}"'))
def check_currency_total(response, currency: str, total: str) -> None:
    body = response.json()
    # Response is a flat dict: {"USD": "30.00", "IDR": "150000"}
    assert currency in body, f"Currency '{currency}' not found in summary: {body}"
    assert str(body[currency]) == total, f"Expected {currency} total={total}, got {body[currency]}"
