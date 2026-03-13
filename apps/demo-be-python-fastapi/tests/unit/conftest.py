"""Unit test configuration: GHERKIN_ROOT path and shared step fixtures for unit BDD tests."""

import os
import pathlib

import pytest
from fastapi.testclient import TestClient
from pytest_bdd import given, parsers, then, when

# Path to the shared Gherkin feature files.
# GHERKIN_ROOT_ENV allows Docker containers to override the path directly
# (e.g. GHERKIN_ROOT=/specs/apps/demo/be/gherkin) since the relative parent
# traversal may exceed path depth in non-monorepo contexts.
_gherkin_root_env = os.environ.get("GHERKIN_ROOT")
if _gherkin_root_env:
    GHERKIN_ROOT = pathlib.Path(_gherkin_root_env)
else:
    GHERKIN_ROOT = pathlib.Path(__file__).parents[4] / "specs" / "apps" / "demo" / "be" / "gherkin"

_STRONG_PASSWORD = "Str0ng#Pass1"


def _register_user_helper(
    client: TestClient,
    username: str,
    email: str | None = None,
    password: str = _STRONG_PASSWORD,
) -> dict:
    email = email or f"{username}@example.com"
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    return resp.json()


# Shared step definitions available to ALL unit BDD tests via this conftest.py


@given("the API is running", target_fixture="client")
def api_is_running(test_client: TestClient) -> TestClient:
    """Provide the test client fixture."""
    return test_client


@then(parsers.parse("the response status code should be {code:d}"))
def check_status_code(response, code: int) -> None:  # type: ignore[no-untyped-def]
    assert response.status_code == code, (
        f"Expected {code}, got {response.status_code}. Body: {response.text}"
    )


@then(parsers.parse('the response body should contain "{field}" equal to "{value}"'))
def check_body_field_string(response, field: str, value: str) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert field in body, f"Field '{field}' not in response: {body}"
    assert str(body[field]) == value, f"Expected {field}={value!r}, got {body[field]!r}"


@then(parsers.parse('the response body should contain a non-null "{field}" field'))
def check_body_field_not_null(response, field: str) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert field in body, f"Field '{field}' not in response: {body}"
    assert body[field] is not None, f"Field '{field}' is null in response: {body}"


@then("the response body should contain an error message about invalid credentials")
def check_invalid_credentials(response) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["invalid", "credentials", "wrong", "incorrect"]), (
        f"Expected invalid credentials message, got: {body['message']}"
    )


@then("the response body should contain an error message about account deactivation")
def check_account_deactivation(response) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["deactivat", "inactive", "disabled"]), (
        f"Expected deactivation message, got: {body['message']}"
    )


@then("the response body should contain an error message about token expiration")
def check_token_expiration(response) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["expir", "expired"]), (
        f"Expected expiration message, got: {body['message']}"
    )


@then("the response body should contain an error message about invalid token")
def check_invalid_token(response) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["invalid", "revoked", "token"]), (
        f"Expected invalid token message, got: {body['message']}"
    )


@then("the response body should contain an error message about file size")
def check_file_size_error(response) -> None:  # type: ignore[no-untyped-def]
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["size", "large", "limit", "exceed"]), (
        f"Expected file size message, got: {body['message']}"
    )


# --- Shared background registration steps (used across multiple step files) ---


@given(
    parsers.parse('a user "{username}" is registered with password "{password}"'),
    target_fixture="registered_user",
)
def shared_register_user_with_password(client: TestClient, username: str, password: str) -> dict:
    return _register_user_helper(client, username, password=password)


@given(
    parsers.parse(
        'a user "{username}" is registered with email "{email}" and password "{password}"'
    ),
    target_fixture="registered_user",
)
def shared_register_user_with_email(
    client: TestClient, username: str, email: str, password: str
) -> dict:
    return _register_user_helper(client, username, email=email, password=password)


@when(
    parsers.parse("the client sends POST /api/v1/auth/login with body {body}"),
    target_fixture="response",
)
def shared_post_login(client: TestClient, body: str):  # type: ignore[no-untyped-def]
    import json

    data = json.loads(body)
    return client.post("/api/v1/auth/login", json=data)


@when(
    parsers.parse("the client sends POST /api/v1/auth/register with body {body}"),
    target_fixture="response",
)
def shared_post_register(client: TestClient, body: str):  # type: ignore[no-untyped-def]
    import json

    data = json.loads(body)
    return client.post("/api/v1/auth/register", json=data)


@then(parsers.parse('the response body should contain a validation error for "{field}"'))
def shared_check_validation_error(response, field: str) -> None:  # type: ignore[no-untyped-def]
    import json

    assert response.status_code in (400, 422), f"Expected 400 or 422, got {response.status_code}"
    body = response.json()
    body_str = json.dumps(body).lower()
    assert field.lower() in body_str, f"Expected validation error for '{field}', got: {body}"


# Apply unit marker to all tests in this package
def pytest_collection_modifyitems(items: list) -> None:  # type: ignore[override]
    """Apply unit marker to all BDD tests collected from unit/steps/ package."""
    for item in items:
        if "unit/steps" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
