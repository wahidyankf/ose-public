"""BDD step definitions for financial reporting feature."""

import json

from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "expenses" / "reporting.feature"))

_PASSWORD = "Str0ng#Pass1"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_reporting(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given(
    parsers.parse("alice has created an entry with body {body}"),
    target_fixture="reporting_entry",
)
def alice_create_reporting_entry(client: ServiceClient, alice_tokens: dict, body: str) -> dict:
    data = json.loads(body)
    resp = client.post_expense(f"Bearer {alice_tokens['access_token']}", data)
    assert resp.status_code == 201, f"Create entry failed: {resp.text}"
    return resp.json()


# --- When steps ---


@when(
    parsers.parse("alice sends GET /api/v1/reports/pl?from={from_}&to={to}&currency={currency}"),
    target_fixture="response",
)
def alice_get_pl_report(
    client: ServiceClient, alice_tokens: dict, from_: str, to: str, currency: str
) -> FakeResponse:
    return client.get_pl_report(
        f"Bearer {alice_tokens['access_token']}",
        from_,
        to,
        currency,
    )


# --- Then steps ---


@then(parsers.parse('the response body should contain "income_total" equal to "{value}"'))
def check_income_total(response: FakeResponse, value: str) -> None:
    body = response.json()
    assert "income_total" in body, f"income_total not in: {body}"
    assert str(body["income_total"]) == value, (
        f"Expected income_total={value}, got {body['income_total']}"
    )


@then(parsers.parse('the response body should contain "expense_total" equal to "{value}"'))
def check_expense_total(response: FakeResponse, value: str) -> None:
    body = response.json()
    assert "expense_total" in body, f"expense_total not in: {body}"
    assert str(body["expense_total"]) == value, (
        f"Expected expense_total={value}, got {body['expense_total']}"
    )


@then(parsers.parse('the response body should contain "net" equal to "{value}"'))
def check_net(response: FakeResponse, value: str) -> None:
    body = response.json()
    assert "net" in body, f"net not in: {body}"
    assert str(body["net"]) == value, f"Expected net={value}, got {body['net']}"


@then(parsers.parse('the income breakdown should contain "{category}" with amount "{amount}"'))
def check_income_breakdown(response: FakeResponse, category: str, amount: str) -> None:
    body = response.json()
    breakdown = body.get("income_breakdown", {})
    assert category in breakdown, f"Category '{category}' not in income_breakdown: {breakdown}"
    assert str(breakdown[category]) == amount, (
        f"Expected income_breakdown[{category}]={amount}, got {breakdown[category]}"
    )


@then(parsers.parse('the expense breakdown should contain "{category}" with amount "{amount}"'))
def check_expense_breakdown(response: FakeResponse, category: str, amount: str) -> None:
    body = response.json()
    breakdown = body.get("expense_breakdown", {})
    assert category in breakdown, f"Category '{category}' not in expense_breakdown: {breakdown}"
    assert str(breakdown[category]) == amount, (
        f"Expected expense_breakdown[{category}]={amount}, got {breakdown[category]}"
    )
