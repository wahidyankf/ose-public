"""BDD step definitions for attachment feature."""

import json
import uuid

from pytest_bdd import given, parsers, scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "expenses" / "attachments.feature"))

_PASSWORD = "Str0ng#Pass1"
_PASSWORD2 = "Str0ng#Pass2"


@given(
    '"alice" has logged in and stored the access token',
    target_fixture="alice_tokens",
)
def alice_login_attach(client: ServiceClient, registered_user: dict) -> dict:
    return client.login_user("alice", _PASSWORD)


@given(
    parsers.parse("alice has created an entry with body {body}"),
    target_fixture="created_expense",
)
def alice_create_attachment_entry(client: ServiceClient, alice_tokens: dict, body: str) -> dict:
    data = json.loads(body)
    resp = client.post_expense(f"Bearer {alice_tokens['access_token']}", data)
    assert resp.status_code == 201, f"Create entry failed: {resp.text}"
    return resp.json()


@given(
    parsers.parse("bob has created an entry with body {body}"),
    target_fixture="bob_expense",
)
def bob_create_entry(client: ServiceClient, registered_user: dict, body: str) -> dict:
    # registered_user is bob (last registration in the scenario)
    bob_tokens = client.login_user("bob", _PASSWORD2)
    data = json.loads(body)
    resp = client.post_expense(f"Bearer {bob_tokens['access_token']}", data)
    assert resp.status_code == 201
    return resp.json()


@given(
    parsers.parse(
        'alice has uploaded file "{filename}" with content type "{content_type}" to the entry'
    ),
    target_fixture="uploaded_attachment",
)
def alice_upload_attachment_given(
    client: ServiceClient,
    alice_tokens: dict,
    created_expense: dict,
    filename: str,
    content_type: str,
) -> dict:
    file_content = b"dummy file content"
    resp = client.post_attachment(
        created_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
        filename,
        content_type,
        file_content,
    )
    assert resp.status_code == 201, f"Upload failed: {resp.text}"
    return resp.json()


# --- When steps ---


@when(
    parsers.parse(
        'alice uploads file "{filename}" with content type "{content_type}" to POST /api/v1/expenses/{{expenseId}}/attachments'  # noqa: E501
    ),
    target_fixture="response",
)
def alice_upload_file(
    client: ServiceClient,
    alice_tokens: dict,
    created_expense: dict,
    filename: str,
    content_type: str,
) -> FakeResponse:
    file_content = b"dummy file content"
    return client.post_attachment(
        created_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
        filename,
        content_type,
        file_content,
    )


@when(
    parsers.parse(
        'alice uploads file "{filename}" with content type "{content_type}" to POST /api/v1/expenses/{{bobExpenseId}}/attachments'  # noqa: E501
    ),
    target_fixture="response",
)
def alice_upload_to_bob_expense(
    client: ServiceClient,
    alice_tokens: dict,
    bob_expense: dict,
    filename: str,
    content_type: str,
) -> FakeResponse:
    file_content = b"dummy file content"
    return client.post_attachment(
        bob_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
        filename,
        content_type,
        file_content,
    )


@when(
    "alice uploads an oversized file to POST /api/v1/expenses/{expenseId}/attachments",
    target_fixture="response",
)
def alice_upload_oversized(
    client: ServiceClient, alice_tokens: dict, created_expense: dict
) -> FakeResponse:
    big_content = b"x" * (11 * 1024 * 1024)
    return client.post_attachment(
        created_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
        "large.pdf",
        "application/pdf",
        big_content,
    )


@when("alice sends GET /api/v1/expenses/{expenseId}/attachments", target_fixture="response")
def alice_list_attachments(
    client: ServiceClient, alice_tokens: dict, created_expense: dict
) -> FakeResponse:
    return client.get_attachments(
        created_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
    )


@when("alice sends GET /api/v1/expenses/{bobExpenseId}/attachments", target_fixture="response")
def alice_list_bob_attachments(
    client: ServiceClient, alice_tokens: dict, bob_expense: dict
) -> FakeResponse:
    return client.get_attachments(
        bob_expense["id"],
        f"Bearer {alice_tokens['access_token']}",
    )


@when(
    "alice sends DELETE /api/v1/expenses/{expenseId}/attachments/{attachmentId}",
    target_fixture="response",
)
def alice_delete_attachment(
    client: ServiceClient,
    alice_tokens: dict,
    created_expense: dict,
    uploaded_attachment: dict,
) -> FakeResponse:
    return client.delete_attachment(
        created_expense["id"],
        uploaded_attachment["id"],
        f"Bearer {alice_tokens['access_token']}",
    )


@when(
    "alice sends DELETE /api/v1/expenses/{bobExpenseId}/attachments/{attachmentId}",
    target_fixture="response",
)
def alice_delete_bob_attachment(
    client: ServiceClient,
    alice_tokens: dict,
    bob_expense: dict,
    uploaded_attachment: dict,
) -> FakeResponse:
    return client.delete_attachment(
        bob_expense["id"],
        uploaded_attachment["id"],
        f"Bearer {alice_tokens['access_token']}",
    )


@when(
    "alice sends DELETE /api/v1/expenses/{expenseId}/attachments/{randomAttachmentId}",
    target_fixture="response",
)
def alice_delete_nonexistent_attachment(
    client: ServiceClient, alice_tokens: dict, created_expense: dict
) -> FakeResponse:
    random_id = str(uuid.uuid4())
    return client.delete_attachment(
        created_expense["id"],
        random_id,
        f"Bearer {alice_tokens['access_token']}",
    )


# --- Then steps ---


@then(parsers.parse('the response body should contain 2 items in the "attachments" array'))
def check_two_attachments(response: FakeResponse) -> None:
    body = response.json()
    attachments = body.get("attachments", [])
    assert len(attachments) == 2, f"Expected 2 attachments, got {len(attachments)}: {body}"


@then(
    parsers.parse(
        'the response body should contain an attachment with "filename" equal to "{filename}"'
    )
)
def check_attachment_filename(response: FakeResponse, filename: str) -> None:
    body = response.json()
    attachments = body.get("attachments", [])
    assert any(a.get("filename") == filename for a in attachments), (
        f"Attachment '{filename}' not found in: {attachments}"
    )


@then(parsers.parse('the response body should contain "content_type" equal to "{content_type}"'))
def check_attachment_content_type(response: FakeResponse, content_type: str) -> None:
    body = response.json()
    assert "content_type" in body, f"'content_type' not in response: {body}"
    assert body["content_type"] == content_type, (
        f"Expected content_type={content_type!r}, got {body['content_type']!r}"
    )


@then(parsers.parse('the response body should contain "filename" equal to "{filename}"'))
def check_filename(response: FakeResponse, filename: str) -> None:
    body = response.json()
    assert "filename" in body, f"'filename' not in response: {body}"
    assert body["filename"] == filename, (
        f"Expected filename={filename!r}, got {body['filename']!r}"
    )


@then('the response body should contain a validation error for "file"')
def check_file_validation_error(response: FakeResponse) -> None:
    body = response.json()
    body_str = json.dumps(body).lower()
    assert any(kw in body_str for kw in ["file", "media", "type", "unsupported"]), (
        f"Expected file validation error, got: {body}"
    )
