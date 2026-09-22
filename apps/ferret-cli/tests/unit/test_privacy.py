"""The privacy boundary: what a capture may contain, what it must reject, and that no rejection echoes a value."""

import json
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from ferret.application.privacy import CANONICAL_LIMIT_BYTES, RAW_LIMIT_BYTES, project_hook_payload, validate_capture
from ferret.domain.errors import FerretError
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, encode, event_document

NOW = datetime(2026, 9, 18, 8, 15, 31, tzinfo=UTC)
CANARY = "canary-value-that-must-never-be-echoed"


def rejected(raw: bytes) -> FerretError:
    with pytest.raises(FerretError) as caught:
        validate_capture(raw, now=NOW)
    error = caught.value
    assert error.code == "ferret.event.invalid"
    assert error.exit_code == 2
    assert CANARY not in str(error)
    assert CANARY not in repr(error)
    return error


def test_a_valid_event_is_accepted_with_its_recomputed_hash() -> None:
    event = validate_capture(encode(VECTOR_DOCUMENT), now=NOW)

    assert event.event_hash == VECTOR_HASH
    assert event.to_document() == VECTOR_DOCUMENT


@pytest.mark.parametrize(
    ("key", "category"),
    [
        ("prompt", "prompt"),
        ("response", "response"),
        ("tool_arguments", "tool_arguments"),
        ("transcript_path", "transcript_path"),
        ("environment", "environment"),
        ("user_prompt", "prompt"),
        ("tool_response", "response"),
        ("tool_input", "tool_arguments"),
        ("toolArguments", "tool_arguments"),
        ("transcriptPath", "transcript_path"),
        ("env", "environment"),
        ("an unexpected arbitrary field", None),
        ("/private/path/as/a/key", None),
    ],
)
def test_forbidden_field_matrix(key: str, category: str | None) -> None:
    document = {**VECTOR_DOCUMENT, key: CANARY}

    error = rejected(encode(document))

    assert error.field == category


def test_a_forbidden_field_is_rejected_whatever_its_value_type() -> None:
    for value in (CANARY, 7, None, True, [CANARY], {"nested": CANARY}):
        error = rejected(encode({**VECTOR_DOCUMENT, "prompt": value}))

        assert error.field == "prompt"


def test_an_event_missing_a_property_names_the_missing_schema_field() -> None:
    document = {name: value for name, value in VECTOR_DOCUMENT.items() if name != "toolName"}

    assert rejected(encode(document)).field == "toolName"


@pytest.mark.parametrize(
    ("label", "raw"),
    [
        (
            "a JSON object with duplicate keys",
            b'{"schemaVersion":"1.0","schemaVersion":"1.0","eventId":"00000000-0000-4000-8000-000000000001"}',
        ),
        ("invalid UTF-8 bytes", b'{"schemaVersion":"\xff\xfe"}'),
        ("a UTF-8 byte order mark", b"\xef\xbb\xbf" + encode(VECTOR_DOCUMENT)),
        ("an empty input", b""),
        ("truncated JSON", encode(VECTOR_DOCUMENT)[:-5]),
        ("trailing data after the object", encode(VECTOR_DOCUMENT) + b" {}"),
        ("a JSON root that is an array", b"[]"),
        ("a JSON root that is a string", b'"text"'),
        ("a JSON root that is null", b"null"),
        ("a non-finite number", b'{"durationMs":NaN}'),
        ("very deep nesting", b"[" * 100_000),
        ("a canonical event larger than 16 KiB", encode({**VECTOR_DOCUMENT, "toolName": "x" * CANONICAL_LIMIT_BYTES})),
    ],
)
def test_a_malformed_or_oversized_input_is_rejected_without_echoing_it(label: str, raw: bytes) -> None:
    error = rejected(raw)

    assert error.field is None, label


def test_the_canonical_size_limit_is_exact() -> None:
    body = encode(VECTOR_DOCUMENT)
    at_limit = body + b" " * (CANONICAL_LIMIT_BYTES - len(body))
    assert len(at_limit) == CANONICAL_LIMIT_BYTES

    assert validate_capture(at_limit, now=NOW).event_hash == VECTOR_HASH
    assert rejected(at_limit + b" ").field is None


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"schemaVersion": "1.1"}, "schemaVersion"),
        ({"schemaVersion": "2.0"}, "schemaVersion"),
        ({"schemaVersion": 1.0}, "schemaVersion"),
        ({"eventId": "not-a-uuid"}, "eventId"),
        ({"eventId": "00000000-0000-1000-8000-000000000001"}, "eventId"),
        ({"eventId": "00000000-0000-4000-8000-00000000000A"}, "eventId"),
        ({"occurredAt": "2026-09-18 08:15:30"}, "occurredAt"),
        ({"occurredAt": "2026-09-18T08:15:30Z"}, "occurredAt"),
        ({"capturedAt": "yesterday"}, "capturedAt"),
        ({"occurredAt": "2026-09-19T08:15:31.001Z"}, "occurredAt"),
        ({"capturedAt": "2026-09-19T08:15:31.001Z"}, "capturedAt"),
        ({"harness": "Claude-Code"}, "harness"),
        ({"harness": "1claude"}, "harness"),
        ({"harness": "a" * 33}, "harness"),
        ({"harness": ""}, "harness"),
        ({"harnessVersion": ""}, "harnessVersion"),
        ({"harnessVersion": "v" * 65}, "harnessVersion"),
        ({"harnessVersion": "1.0 beta"}, "harnessVersion"),
        ({"installationId": "00000000-0000-4000-8000-00000000000g"}, "installationId"),
        ({"workspaceId": "/users/example/work/repo-a"}, "workspaceId"),
        ({"workspaceId": "ws_327B250D010590DA40F0F76D18DA910A"}, "workspaceId"),
        ({"workspaceId": "ws_327b250d010590da40f0f76d18da910"}, "workspaceId"),
        ({"sessionId": "session-123"}, "sessionId"),
        ({"sessionId": "ws_d0de260ca18a8379984031556b2d43ac"}, "sessionId"),
        ({"parentSessionId": "raw-parent"}, "parentSessionId"),
        ({"eventType": "tool.exploded"}, "eventType"),
        ({"outcome": "great"}, "outcome"),
        ({"subjectVisibility": "seen"}, "subjectVisibility"),
        ({"outcomeVisibility": None}, "outcomeVisibility"),
        ({"durationVisibility": "OBSERVED"}, "durationVisibility"),
        ({"durationMs": -1}, "durationMs"),
        ({"durationMs": 86_400_001}, "durationMs"),
        ({"durationMs": 27.5}, "durationMs"),
        ({"durationMs": "27"}, "durationMs"),
        ({"durationMs": True}, "durationMs"),
        ({"toolName": ""}, "toolName"),
        ({"toolName": "x" * 129}, "toolName"),
        ({"toolName": "/etc/passwd"}, "toolName"),
        ({"toolName": "../secret"}, "toolName"),
        ({"toolName": "mcp/../secret"}, "toolName"),
        ({"toolName": "C:/Users/example"}, "toolName"),
        ({"toolName": "https://example.invalid/tool"}, "toolName"),
        ({"toolName": "user:pass@host"}, "toolName"),
        ({"toolName": "Read\nWrite"}, "toolName"),
        ({"toolName": "Read\u0007"}, "toolName"),
        ({"toolName": "Read; rm -rf"}, "toolName"),
        ({"toolName": "$(id)"}, "toolName"),
        ({"toolName": "~/secret"}, "toolName"),
        ({"toolName": ["Read"]}, "toolName"),
        ({"toolName": {"name": "Read"}}, "toolName"),
    ],
)
def test_a_field_that_breaks_its_contract_names_only_that_field(overrides: dict[str, Any], field: str) -> None:
    document = {**VECTOR_DOCUMENT, **overrides}

    error = rejected(encode(document))

    assert error.field == field


@pytest.mark.parametrize(
    "tool_name", ["Read", "mcp/server/tool", "mcp__github__create_issue", "Bash", "a.b:c-d_e", "Écrire"]
)
def test_a_logical_tool_identifier_may_carry_a_slash_and_unicode_letters(tool_name: str) -> None:
    document = event_document(toolName=tool_name)

    assert validate_capture(encode(document), now=NOW).tool_name == tool_name


@pytest.mark.parametrize("field", ["agentName", "skillName"])
def test_an_agent_or_skill_name_may_not_contain_a_slash(field: str) -> None:
    subject = "agent.ended" if field == "agentName" else "skill.invoked"
    outcome = "success" if subject == "agent.ended" else "not_applicable"
    document = event_document(
        eventType=subject,
        toolName=None,
        outcome=outcome,
        outcomeVisibility="observed" if outcome == "success" else "not_applicable",
        durationMs=None,
        durationVisibility="unknown" if subject == "agent.ended" else "not_applicable",
        **{field: "team/reviewer"},
    )

    assert rejected(encode(document)).field == field


def test_a_forward_skew_of_just_under_a_day_is_tolerated() -> None:
    within = (NOW + timedelta(hours=23, minutes=59)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    assert validate_capture(encode(event_document(occurredAt=within)), now=NOW).occurred_at == within


@pytest.mark.parametrize(
    ("event_type", "subject", "outcome", "outcome_visibility", "duration", "duration_visibility", "ok"),
    [
        ("session.started", {}, "not_applicable", "not_applicable", None, "not_applicable", True),
        ("session.started", {"toolName": "Read"}, "not_applicable", "not_applicable", None, "not_applicable", False),
        ("session.started", {}, "success", "observed", None, "not_applicable", False),
        ("session.ended", {}, "success", "observed", 10, "observed", True),
        ("session.ended", {}, "unknown", "unknown", None, "unknown", True),
        ("session.ended", {}, "unknown", "observed", None, "unknown", False),
        ("session.ended", {}, "success", "unknown", None, "unknown", False),
        ("session.ended", {}, "not_applicable", "not_applicable", None, "unknown", False),
        ("agent.started", {"agentName": "reviewer"}, "not_applicable", "not_applicable", None, "not_applicable", True),
        ("agent.started", {"skillName": "tdd"}, "not_applicable", "not_applicable", None, "not_applicable", False),
        (
            "agent.started",
            {"agentName": "a", "toolName": "Read"},
            "not_applicable",
            "not_applicable",
            None,
            "not_applicable",
            False,
        ),
        ("agent.ended", {"agentName": "reviewer"}, "cancelled", "derived", 5, "derived", True),
        ("agent.ended", {"toolName": "Read"}, "cancelled", "derived", 5, "derived", False),
        ("skill.invoked", {"skillName": "tdd"}, "not_applicable", "not_applicable", None, "not_applicable", True),
        ("skill.invoked", {"agentName": "tdd"}, "not_applicable", "not_applicable", None, "not_applicable", False),
        ("skill.invoked", {"skillName": "tdd"}, "not_applicable", "not_applicable", 3, "observed", False),
        ("tool.started", {"toolName": "Read"}, "not_applicable", "not_applicable", None, "not_applicable", True),
        ("tool.started", {"toolName": "Read"}, "success", "observed", None, "not_applicable", False),
        ("tool.completed", {"toolName": "Read"}, "success", "observed", 27, "observed", True),
        ("tool.completed", {"toolName": "Read"}, "failure", "observed", 27, "observed", False),
        ("tool.completed", {"toolName": "Read"}, "success", "observed", None, "unknown", True),
        ("tool.completed", {"toolName": "Read"}, "success", "observed", 27, "unknown", False),
        ("tool.completed", {"toolName": "Read"}, "success", "observed", None, "observed", False),
        ("tool.failed", {"toolName": "Read"}, "failure", "derived", 27, "derived", True),
        ("tool.failed", {"toolName": "Read"}, "success", "derived", 27, "derived", False),
    ],
)
def test_event_type_invariants(
    event_type: str,
    subject: dict[str, str],
    outcome: str,
    outcome_visibility: str,
    duration: int | None,
    duration_visibility: str,
    ok: bool,
) -> None:
    names = {"agentName": None, "skillName": None, "toolName": None, **subject}
    subject_visibility = "not_applicable" if event_type.startswith("session") else "observed"
    document = event_document(
        eventType=event_type,
        outcome=outcome,
        outcomeVisibility=outcome_visibility,
        durationMs=duration,
        durationVisibility=duration_visibility,
        subjectVisibility=subject_visibility,
        **names,
    )

    if ok:
        assert validate_capture(encode(document), now=NOW).event_type == event_type
    else:
        rejected(encode(document))


NOTHING_APPLIES = {
    "outcome": "not_applicable",
    "outcomeVisibility": "not_applicable",
    "durationMs": None,
    "durationVisibility": "not_applicable",
}


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"eventType": "session.started", "subjectVisibility": "not_applicable", **NOTHING_APPLIES}, "toolName"),
        (
            {"eventType": "session.started", "toolName": None, "subjectVisibility": "observed", **NOTHING_APPLIES},
            "subjectVisibility",
        ),
        ({"eventType": "tool.started", **{**NOTHING_APPLIES, "outcomeVisibility": "observed"}}, "outcomeVisibility"),
        ({"eventType": "tool.started", **{**NOTHING_APPLIES, "outcome": "success"}}, "outcome"),
        ({"eventType": "tool.started", **{**NOTHING_APPLIES, "durationVisibility": "unknown"}}, "durationVisibility"),
        ({"eventType": "tool.started", **{**NOTHING_APPLIES, "durationMs": 3}}, "durationMs"),
        ({"toolName": None}, "subjectVisibility"),
        ({"outcome": "failure"}, "outcome"),
        ({"outcomeVisibility": "unknown"}, "outcomeVisibility"),
        ({"durationMs": None}, "durationMs"),
        ({"durationVisibility": "unknown"}, "durationMs"),
        ({"durationVisibility": "not_applicable"}, "durationVisibility"),
    ],
)
def test_an_invariant_violation_names_the_offending_field(overrides: dict[str, Any], field: str) -> None:
    error = rejected(encode(event_document(**overrides)))

    assert error.field == field


@pytest.mark.parametrize(
    ("visibility", "names", "ok"),
    [
        ("observed", {"toolName": "Read"}, True),
        ("derived", {"toolName": "Read"}, True),
        ("observed", {"toolName": None}, False),
        ("derived", {"toolName": None}, False),
        ("unknown", {"toolName": None}, True),
        ("unknown", {"toolName": "Read"}, False),
        ("not_applicable", {"toolName": None}, False),
    ],
)
def test_subject_visibility_and_names_stay_consistent(visibility: str, names: dict[str, Any], ok: bool) -> None:
    document = event_document(subjectVisibility=visibility, **names)

    if ok:
        assert validate_capture(encode(document), now=NOW).subject_visibility == visibility
    else:
        rejected(encode(document))


def test_a_nested_or_extra_property_at_any_level_is_rejected() -> None:
    assert rejected(encode({**VECTOR_DOCUMENT, "harnessVersion": {"prompt": CANARY}})).field == "harnessVersion"


def test_hook_projection_keeps_only_allowlisted_scalars_by_path() -> None:
    raw = json.dumps(
        {
            "session_id": "raw-session",
            "hook_event_name": "PostToolUse",
            "cwd": "/users/example/work/repo-a",
            "prompt": CANARY,
            "tool_name": "Read",
            "tool_input": {"file_path": "/etc/passwd", "content": CANARY},
            "tool_response": {"is_error": False, "output": CANARY, "duration_ms": 27},
            "transcript_path": "/users/example/.claude/x.jsonl",
        }
    ).encode()

    projected = project_hook_payload(
        raw,
        [
            ("session_id",),
            ("hook_event_name",),
            ("cwd",),
            ("tool_name",),
            ("tool_response", "is_error"),
            ("tool_response", "duration_ms"),
            ("tool_input",),
            ("missing",),
        ],
    )

    assert projected == {
        "session_id": "raw-session",
        "hook_event_name": "PostToolUse",
        "cwd": "/users/example/work/repo-a",
        "tool_name": "Read",
        "tool_response.is_error": False,
        "tool_response.duration_ms": 27,
    }
    assert CANARY not in json.dumps(projected)


def test_hook_projection_ignores_a_path_through_a_non_object() -> None:
    assert project_hook_payload(b'{"tool_name":"Read","a":[1,2]}', [("tool_name", "x"), ("a", "b"), ("a",)]) == {}


@pytest.mark.parametrize(
    "raw",
    [
        b'{"a":1,"a":2}',
        b"\xff\xfe\xfd",
        b"[]",
        b"7",
        b"",
        b'{"a":',
        b'{"a":NaN}',
        b"[" * 100_000,
        b'{"a":"' + b"x" * RAW_LIMIT_BYTES + b'"}',
    ],
)
def test_hook_projection_rejects_malformed_or_oversized_raw_input(raw: bytes) -> None:
    with pytest.raises(FerretError) as caught:
        project_hook_payload(raw, [("a",)])

    assert caught.value.code == "ferret.event.invalid"
    assert caught.value.field is None


def test_the_raw_hook_limit_is_larger_than_the_canonical_limit() -> None:
    assert CANONICAL_LIMIT_BYTES == 16 * 1024
    assert RAW_LIMIT_BYTES == 256 * 1024
