"""Unit test configuration: GHERKIN_ROOT path and shared step fixtures for unit BDD tests."""

import os
import pathlib
from collections.abc import Generator

import pytest
from pytest_bdd import given, parsers, then, when
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from demo_be_python_fastapi.infrastructure.models import Base
from tests.integration.service_client import FakeResponse, ServiceClient

# Path to the shared Gherkin feature files.
_gherkin_root_env = os.environ.get("GHERKIN_ROOT")
if _gherkin_root_env:
    GHERKIN_ROOT = pathlib.Path(_gherkin_root_env)
else:
    GHERKIN_ROOT = pathlib.Path(__file__).parents[4] / "specs" / "apps" / "demo" / "be" / "gherkin"

_STRONG_PASSWORD = "Str0ng#Pass1"


@pytest.fixture
def test_client() -> Generator[ServiceClient]:  # type: ignore[override]
    """Provide a ServiceClient backed by in-memory SQLite for unit tests.

    Calls service/repository functions directly against an in-memory database,
    with no HTTP dispatch.  This satisfies the three-level testing standard.
    """
    engine = create_engine(
        "sqlite:///file:unit_testdb?mode=memory&cache=shared&uri=true",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    db = testing_session_local()
    try:
        yield ServiceClient(db)
    finally:
        db.close()
    Base.metadata.drop_all(engine)
    engine.dispose()


def _register_user_helper(
    client: ServiceClient,
    username: str,
    email: str | None = None,
    password: str = _STRONG_PASSWORD,
) -> dict:
    email = email or f"{username}@example.com"
    return client.register_user(username, email=email, password=password)


# Shared step definitions available to ALL unit BDD tests via this conftest.py


@given("the API is running", target_fixture="client")
def api_is_running(test_client: ServiceClient) -> ServiceClient:
    """Provide the service client fixture."""
    return test_client


@then(parsers.parse("the response status code should be {code:d}"))
def check_status_code(response: FakeResponse, code: int) -> None:
    assert response.status_code == code, (
        f"Expected {code}, got {response.status_code}. Body: {response.text}"
    )


@then(parsers.parse('the response body should contain "{field}" equal to "{value}"'))
def check_body_field_string(response: FakeResponse, field: str, value: str) -> None:
    body = response.json()
    assert field in body, f"Field '{field}' not in response: {body}"
    assert str(body[field]) == value, f"Expected {field}={value!r}, got {body[field]!r}"


@then(parsers.parse('the response body should contain a non-null "{field}" field'))
def check_body_field_not_null(response: FakeResponse, field: str) -> None:
    body = response.json()
    assert field in body, f"Field '{field}' not in response: {body}"
    assert body[field] is not None, f"Field '{field}' is null in response: {body}"


@then("the response body should contain an error message about invalid credentials")
def check_invalid_credentials(response: FakeResponse) -> None:
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["invalid", "credentials", "wrong", "incorrect"]), (
        f"Expected invalid credentials message, got: {body['message']}"
    )


@then("the response body should contain an error message about account deactivation")
def check_account_deactivation(response: FakeResponse) -> None:
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["deactivat", "inactive", "disabled"]), (
        f"Expected deactivation message, got: {body['message']}"
    )


@then("the response body should contain an error message about token expiration")
def check_token_expiration(response: FakeResponse) -> None:
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["expir", "expired"]), (
        f"Expected expiration message, got: {body['message']}"
    )


@then("the response body should contain an error message about invalid token")
def check_invalid_token(response: FakeResponse) -> None:
    body = response.json()
    assert "message" in body
    msg = body["message"].lower()
    assert any(kw in msg for kw in ["invalid", "revoked", "token"]), (
        f"Expected invalid token message, got: {body['message']}"
    )


@then("the response body should contain an error message about file size")
def check_file_size_error(response: FakeResponse) -> None:
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
def shared_register_user_with_password(
    client: ServiceClient, username: str, password: str
) -> dict:
    return _register_user_helper(client, username, password=password)


@given(
    parsers.parse(
        'a user "{username}" is registered with email "{email}" and password "{password}"'
    ),
    target_fixture="registered_user",
)
def shared_register_user_with_email(
    client: ServiceClient, username: str, email: str, password: str
) -> dict:
    return _register_user_helper(client, username, email=email, password=password)


@when(
    parsers.parse("the client sends POST /api/v1/auth/login with body {body}"),
    target_fixture="response",
)
def shared_post_login(client: ServiceClient, body: str) -> FakeResponse:
    import json

    data = json.loads(body)
    return client.post_login(data.get("username", ""), data.get("password", ""))


@when(
    parsers.parse("the client sends POST /api/v1/auth/register with body {body}"),
    target_fixture="response",
)
def shared_post_register(client: ServiceClient, body: str) -> FakeResponse:
    import json

    data = json.loads(body)
    return client.post_register(
        data.get("username", ""),
        data.get("email", ""),
        data.get("password", ""),
    )


@then(parsers.parse('the response body should contain a validation error for "{field}"'))
def shared_check_validation_error(response: FakeResponse, field: str) -> None:
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
