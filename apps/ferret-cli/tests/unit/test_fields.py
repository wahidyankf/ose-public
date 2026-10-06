"""The shared field validators: each returns its checked value, or the one refusal that names the field and no value."""

import unicodedata
from datetime import UTC, datetime

import pytest
from typekit import Err, Ok

from ferret.domain import fields
from ferret.domain.errors import FerretResult

NOW = datetime(2026, 9, 18, 8, 15, 30, 123000, tzinfo=UTC)
CANONICAL = "2026-09-18T08:15:30.123Z"
NOT_TEXT: list[object] = [1, 1.5, True, None, b"text", ["text"], {"text": "text"}]


def refusal(result: FerretResult[object]) -> tuple[str, str | None, bool]:
    """The code, field, and retryable flag of the ``FerretError`` an ``Err`` carries; an ``Ok`` fails the test."""
    assert isinstance(result, Err)
    error = result.error
    return error.code, error.field, error.retryable


def invalid(field: str) -> tuple[str, str | None, bool]:
    """The refusal every validator gives: the one event-invalid code, the field's name, and no retry."""
    return "ferret.event.invalid", field, False


def test_text_is_normalized_to_nfc() -> None:
    decomposed = "é"

    assert unicodedata.normalize("NFC", decomposed) != decomposed
    assert fields.text(decomposed, "name") == Ok("é")


@pytest.mark.parametrize("value", NOT_TEXT, ids=lambda value: type(value).__name__)
def test_any_other_json_type_is_refused_as_text(value: object) -> None:
    assert refusal(fields.text(value, "name")) == invalid("name")


def test_a_value_matching_its_pattern_is_kept() -> None:
    assert fields.matching("a" * 64, "eventHash", fields.HASH) == Ok("a" * 64)


def test_a_value_outside_its_pattern_is_refused_naming_only_the_field() -> None:
    result = fields.matching("SECRET-VALUE", "eventHash", fields.HASH)

    assert refusal(result) == invalid("eventHash")
    assert isinstance(result, Err)
    assert "SECRET-VALUE" not in f"{result.error.message} {result.error.field}"


def test_a_pattern_is_not_matched_against_a_value_that_is_not_text() -> None:
    assert refusal(fields.matching(1, "eventHash", fields.HASH)) == invalid("eventHash")


def test_an_optional_field_may_be_null_and_otherwise_matches_its_pattern() -> None:
    workspace = "ws_" + "0" * 32

    assert fields.optional(None, "workspaceId", fields.WORKSPACE_ID) == Ok(None)
    assert fields.optional(workspace, "workspaceId", fields.WORKSPACE_ID) == Ok(workspace)
    assert refusal(fields.optional("ws_nope", "workspaceId", fields.WORKSPACE_ID)) == invalid("workspaceId")


def test_a_member_of_the_closed_set_is_kept_and_any_other_value_is_refused() -> None:
    allowed = frozenset({"alpha", "beta"})

    assert fields.member("alpha", "kind", allowed) == Ok("alpha")
    assert refusal(fields.member("gamma", "kind", allowed)) == invalid("kind")
    assert refusal(fields.member(1, "kind", allowed)) == invalid("kind")


def test_membership_is_decided_after_nfc_normalization() -> None:
    assert fields.member("é", "kind", frozenset({"é"})) == Ok("é")


def test_a_canonical_timestamp_up_to_a_day_ahead_of_now_is_kept() -> None:
    assert fields.timestamp(CANONICAL, "capturedAt", NOW) == Ok(CANONICAL)
    assert fields.timestamp("2026-09-19T08:15:30.123Z", "capturedAt", NOW) == Ok("2026-09-19T08:15:30.123Z")


def test_a_timestamp_more_than_a_day_ahead_of_now_is_refused() -> None:
    assert refusal(fields.timestamp("2026-09-19T08:15:30.124Z", "capturedAt", NOW)) == invalid("capturedAt")


@pytest.mark.parametrize(
    "value",
    ["", "yesterday", "2026-09-18T08:15:30Z", "2026-09-18T08:15:30.123+00:00", "2026-02-30T08:15:30.123Z", *NOT_TEXT],
    ids=lambda value: (value or "empty") if isinstance(value, str) else type(value).__name__,
)
def test_a_timestamp_that_is_not_canonical_or_not_a_real_moment_is_refused(value: object) -> None:
    assert refusal(fields.timestamp(value, "capturedAt", NOW)) == invalid("capturedAt")
