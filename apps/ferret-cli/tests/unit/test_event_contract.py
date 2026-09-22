"""The event contract: fixed byte and digest vectors, canonicalization rules, and the field-by-field hash."""

import json
import unicodedata
from datetime import UTC, datetime
from typing import Any

import pytest

from ferret.domain.errors import FerretError
from ferret.domain.event import Event, canonical_event_bytes, event_from_document, event_hash
from support.events import DOCUMENT_ORDER, HASHED_ORDER, VECTOR_BYTES, VECTOR_DOCUMENT, VECTOR_HASH, event_document

NOW = datetime(2026, 9, 18, 8, 15, 31, tzinfo=UTC)


def vector_event() -> Event:
    return event_from_document(VECTOR_DOCUMENT, now=NOW)


def test_fixed_event_vector() -> None:
    event = vector_event()

    assert canonical_event_bytes(event) == VECTOR_BYTES
    assert event_hash(event) == VECTOR_HASH
    assert event.event_hash == VECTOR_HASH


def test_the_document_form_keeps_the_normative_property_order_with_the_hash_second() -> None:
    document = vector_event().to_document()

    assert list(document) == list(DOCUMENT_ORDER)
    assert document == VECTOR_DOCUMENT


def test_the_event_expires_thirty_days_after_it_was_captured() -> None:
    assert vector_event().expires_at == "2026-10-18T08:15:30.130Z"


@pytest.mark.parametrize("field", HASHED_ORDER)
def test_altering_any_hashed_field_changes_the_digest(field: str) -> None:
    replacements: dict[str, Any] = {
        "schemaVersion": "1.1",
        "eventId": "00000000-0000-4000-8000-000000000009",
        "occurredAt": "2026-09-18T08:15:30.124Z",
        "capturedAt": "2026-09-18T08:15:30.131Z",
        "harness": "codex",
        "harnessVersion": "1.0.124",
        "installationId": "00000000-0000-4000-8000-000000000009",
        "workspaceId": "ws_00000000000000000000000000000009",
        "sessionId": "ss_00000000000000000000000000000009",
        "parentSessionId": "ss_00000000000000000000000000000008",
        "eventType": "tool.failed",
        "agentName": "reviewer",
        "skillName": "tdd",
        "toolName": "Write",
        "outcome": "failure",
        "durationMs": 28,
        "subjectVisibility": "derived",
        "outcomeVisibility": "derived",
        "durationVisibility": "derived",
    }
    altered = {**VECTOR_DOCUMENT, field: replacements[field]}

    assert canonical_event_bytes(_unchecked(altered)) != VECTOR_BYTES
    assert event_hash(_unchecked(altered)) != VECTOR_HASH


def _unchecked(document: dict[str, Any]) -> Event:
    """An Event built straight from fields, bypassing validation, to probe the hash alone."""
    return Event(
        schema_version=document["schemaVersion"],
        event_id=document["eventId"],
        event_hash=document["eventHash"],
        occurred_at=document["occurredAt"],
        captured_at=document["capturedAt"],
        harness=document["harness"],
        harness_version=document["harnessVersion"],
        installation_id=document["installationId"],
        workspace_id=document["workspaceId"],
        session_id=document["sessionId"],
        parent_session_id=document["parentSessionId"],
        event_type=document["eventType"],
        agent_name=document["agentName"],
        skill_name=document["skillName"],
        tool_name=document["toolName"],
        outcome=document["outcome"],
        duration_ms=document["durationMs"],
        subject_visibility=document["subjectVisibility"],
        outcome_visibility=document["outcomeVisibility"],
        duration_visibility=document["durationVisibility"],
    )


def test_the_hash_excludes_the_hash_field_itself() -> None:
    tampered = {**VECTOR_DOCUMENT, "eventHash": "0" * 64}

    assert canonical_event_bytes(_unchecked(tampered)) == VECTOR_BYTES
    assert event_hash(_unchecked(tampered)) == VECTOR_HASH


def test_reordered_and_pretty_printed_input_hashes_identically() -> None:
    scrambled = dict(reversed(list(VECTOR_DOCUMENT.items())))
    pretty = json.loads(json.dumps(scrambled, indent=4, sort_keys=True))

    assert event_hash(event_from_document(pretty, now=NOW)) == VECTOR_HASH


def test_nulls_are_emitted_as_json_null_and_integers_without_padding() -> None:
    event = event_from_document(event_document(durationMs=0, harnessVersion=None), now=NOW)

    assert b'"harnessVersion":null' in canonical_event_bytes(event)
    assert b'"durationMs":0,' in canonical_event_bytes(event)


def test_names_are_normalized_to_nfc_before_hashing() -> None:
    decomposed = unicodedata.normalize("NFD", "Café")
    composed = unicodedata.normalize("NFC", "Café")
    assert decomposed != composed

    sealed_over_nfc = event_document(toolName=composed)
    from_decomposed = event_from_document({**sealed_over_nfc, "toolName": decomposed}, now=NOW)
    from_composed = event_from_document(sealed_over_nfc, now=NOW)

    assert from_decomposed.tool_name == composed
    assert canonical_event_bytes(from_decomposed) == canonical_event_bytes(from_composed)
    assert "Café".encode() in canonical_event_bytes(from_decomposed)
    assert event_hash(from_decomposed) == event_hash(from_composed)


def test_other_unicode_scalars_are_emitted_directly_rather_than_escaped() -> None:
    event = event_from_document(event_document(toolName="mcp/Ünï日本語"), now=NOW)

    assert "mcp/Ünï日本語".encode() in canonical_event_bytes(event)
    assert b"\\u" not in canonical_event_bytes(event)


def test_a_declared_hash_that_does_not_match_the_fields_is_refused() -> None:
    with pytest.raises(FerretError) as caught:
        event_from_document({**VECTOR_DOCUMENT, "eventHash": "0" * 64}, now=NOW)

    assert caught.value.code == "ferret.event.invalid"
    assert caught.value.field == "eventHash"
