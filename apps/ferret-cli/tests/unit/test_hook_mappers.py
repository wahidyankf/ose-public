"""The per-harness hook mappers: which registrations map to which lifecycle facts, and what maps to nothing."""

from dataclasses import asdict
from typing import Any

import pytest

from ferret.application.privacy import project_hook_payload
from ferret.domain.hook import CLAUDE_CODE, CODEX, OPENCODE, HookFacts, allowed_paths, map_hook
from support.hook_payloads import (
    CANARIES,
    REGISTRATIONS,
    SESSION,
    SKILL,
    WORKSPACE,
    claude_code,
    claude_tool,
    codex,
    codex_tool,
    opencode,
    opencode_session_created,
    opencode_tool,
)
from support.hook_payloads import encode as encode_payload

UNKNOWN_OUTCOME: dict[str, Any] = {
    "outcome": "unknown",
    "outcome_visibility": "unknown",
    "duration_visibility": "unknown",
}


def facts(harness: str, event: str, document: dict[str, Any]) -> HookFacts | None:
    """What the mapper makes of one payload, having seen only what its allowlist lets through."""
    return map_hook(harness, event, project_hook_payload(encode_payload(document), allowed_paths(harness)))


def expected(event_type: str, **fields: Any) -> HookFacts:
    return HookFacts(event_type=event_type, session=SESSION, directory=WORKSPACE, **fields)


def tool_facts(event_type: str, name: str, **fields: Any) -> HookFacts:
    return expected(event_type, tool_name=name, subject_visibility="observed", **fields)


CLAUDE_SUCCESS: dict[str, Any] = {"outcome": "success", "outcome_visibility": "observed"}
REGISTRATION_IDS = [f"{harness}-{event}" for harness, event, _ in REGISTRATIONS]
EXPECTED = {
    (CLAUDE_CODE, "session.started"): expected("session.started"),
    (CLAUDE_CODE, "session.ended"): expected("session.ended", **UNKNOWN_OUTCOME),
    (CLAUDE_CODE, "agent.started"): expected("agent.started", agent_name="Explore", subject_visibility="observed"),
    (CLAUDE_CODE, "agent.ended"): expected(
        "agent.ended", agent_name="Explore", subject_visibility="observed", **UNKNOWN_OUTCOME
    ),
    (CLAUDE_CODE, "tool.started"): tool_facts("tool.started", "Read"),
    (CLAUDE_CODE, "skill.invoked"): expected("skill.invoked", skill_name=SKILL, subject_visibility="observed"),
    (CLAUDE_CODE, "tool.completed"): tool_facts(
        "tool.completed", "Read", duration_ms=27, duration_visibility="observed", **CLAUDE_SUCCESS
    ),
    (CLAUDE_CODE, "tool.failed"): tool_facts(
        "tool.failed",
        "Read",
        duration_ms=12,
        duration_visibility="observed",
        outcome="failure",
        outcome_visibility="observed",
    ),
    (CODEX, "session.started"): expected("session.started"),
    (CODEX, "session.ended"): expected("session.ended", **UNKNOWN_OUTCOME),
    (CODEX, "agent.started"): expected("agent.started", agent_name="worker", subject_visibility="observed"),
    (CODEX, "agent.ended"): expected(
        "agent.ended", agent_name="worker", subject_visibility="observed", **UNKNOWN_OUTCOME
    ),
    (CODEX, "tool.started"): tool_facts("tool.started", "Bash"),
    (CODEX, "tool.completed"): tool_facts(
        "tool.completed", "Bash", outcome="success", outcome_visibility="derived", duration_visibility="unknown"
    ),
    (OPENCODE, "session.started"): expected("session.started", harness_version="1.18.7"),
    (OPENCODE, "tool.started"): tool_facts("tool.started", "read"),
    (OPENCODE, "skill.invoked"): expected("skill.invoked", skill_name=SKILL, subject_visibility="observed"),
    (OPENCODE, "tool.completed"): tool_facts(
        "tool.completed", "read", outcome="success", outcome_visibility="derived", duration_visibility="unknown"
    ),
}


@pytest.mark.parametrize(("harness", "event", "document"), REGISTRATIONS, ids=REGISTRATION_IDS)
def test_every_shipped_registration_maps_to_its_lifecycle_facts(
    harness: str, event: str, document: dict[str, Any]
) -> None:
    assert facts(harness, event, document) == EXPECTED[(harness, event)]


def test_the_table_covers_exactly_the_shipped_registrations() -> None:
    assert set(EXPECTED) == {(harness, event) for harness, event, _ in REGISTRATIONS}


@pytest.mark.parametrize(("harness", "event", "document"), REGISTRATIONS, ids=REGISTRATION_IDS)
def test_no_content_the_payload_carried_reaches_the_facts(harness: str, event: str, document: dict[str, Any]) -> None:
    mapped = facts(harness, event, document)

    assert mapped is not None
    assert not any(canary in repr(asdict(mapped)) for canary in CANARIES)


@pytest.mark.parametrize("harness", ["cursor", "", "CLAUDE_CODE"])
def test_a_harness_without_a_mapper_contributes_and_maps_nothing(harness: str) -> None:
    assert allowed_paths(harness) == ()
    assert map_hook(harness, "tool.started", {}) is None


@pytest.mark.parametrize(
    ("harness", "event", "document"),
    [
        (CODEX, "tool.failed", codex_tool("PostToolUse")),
        (CODEX, "skill.invoked", codex_tool("PreToolUse", tool="Skill")),
        (CLAUDE_CODE, "notification.sent", claude_code("Notification")),
        (CLAUDE_CODE, "session.started", claude_code("SessionEnd")),
        (CLAUDE_CODE, "tool.started", claude_tool("PostToolUse")),
        (CODEX, "tool.completed", codex_tool("PreToolUse")),
        (OPENCODE, "agent.started", opencode_tool("tool.execute.before")),
        (OPENCODE, "tool.started", opencode_tool("tool.execute.after")),
        (OPENCODE, "tool.completed", opencode_tool("tool.execute.before")),
        (OPENCODE, "session.started", opencode_tool("tool.execute.before")),
    ],
)
def test_a_payload_that_is_not_the_registered_event_maps_to_nothing(
    harness: str, event: str, document: dict[str, Any]
) -> None:
    assert facts(harness, event, document) is None


@pytest.mark.parametrize("field", ["session_id", "cwd"])
def test_a_payload_missing_what_identifies_its_session_or_workspace_maps_to_nothing(field: str) -> None:
    document = claude_tool("PreToolUse")
    del document[field]

    assert facts(CLAUDE_CODE, "tool.started", document) is None


@pytest.mark.parametrize(
    "overrides",
    [
        {"session_id": ""},
        {"session_id": 42},
        {"session_id": None},
        {"session_id": "s" * 257},
        {"session_id": "line\nbreak"},
        {"session_id": "nul\x00byte"},
        {"cwd": "relative/path"},
        {"cwd": ""},
        {"cwd": "/tab\tin/path"},
        {"cwd": "/" + "d" * 4096},
        {"cwd": ["/users/example"]},
    ],
)
def test_an_unusable_session_or_directory_maps_to_nothing(overrides: dict[str, Any]) -> None:
    assert facts(CLAUDE_CODE, "tool.started", {**claude_tool("PreToolUse"), **overrides}) is None


def test_identifiers_are_normalized_to_nfc_so_one_spelling_is_one_session() -> None:
    decomposed = "cafe\u0301"

    mapped = facts(CODEX, "session.started", {**codex("SessionStart"), "session_id": decomposed, "cwd": "/caf\u00e9"})

    assert mapped is not None
    assert (mapped.session, mapped.directory) == ("caf\u00e9", "/caf\u00e9")


@pytest.mark.parametrize(
    "tool_name",
    ["", "bad name", "semi;colon", "../escape", "/leading", "trailing/", "a//b", "C:/drive", "x" * 129, 7, None],
)
def test_a_tool_name_that_is_not_an_identifier_is_stored_as_unknown_rather_than_guessed(tool_name: Any) -> None:
    mapped = facts(CLAUDE_CODE, "tool.started", {**claude_tool("PreToolUse"), "tool_name": tool_name})

    assert mapped == expected("tool.started", tool_name=None, subject_visibility="unknown")


@pytest.mark.parametrize("tool_name", ["mcp__plugin_context7_context7__query-docs", "Bash", "server/tool.v2", "a:b"])
def test_a_tool_name_that_is_an_identifier_is_kept(tool_name: str) -> None:
    mapped = facts(CLAUDE_CODE, "tool.started", {**claude_tool("PreToolUse"), "tool_name": tool_name})

    assert mapped == tool_facts("tool.started", tool_name)


def test_an_agent_name_is_a_plain_identifier_so_a_path_like_one_is_unknown() -> None:
    document = claude_code("SubagentStart", agent_type="team/reviewer")

    assert facts(CLAUDE_CODE, "agent.started", document) == expected(
        "agent.started", agent_name=None, subject_visibility="unknown"
    )


def test_an_agent_event_with_no_agent_type_is_stored_as_unknown() -> None:
    assert facts(CODEX, "agent.ended", codex("SubagentStop")) == expected(
        "agent.ended", agent_name=None, subject_visibility="unknown", **UNKNOWN_OUTCOME
    )


@pytest.mark.parametrize(
    ("reported", "stored"),
    [(0, 0), (27, 27), (27.9, 27), (86_400_000, 86_400_000), (0.0, 0), (-0.0, 0)],
)
def test_a_claude_duration_is_kept_in_whole_milliseconds(reported: float, stored: int) -> None:
    mapped = facts(CLAUDE_CODE, "tool.completed", claude_tool("PostToolUse", duration_ms=reported))

    assert mapped is not None
    assert (mapped.duration_ms, mapped.duration_visibility) == (stored, "observed")


@pytest.mark.parametrize("reported", [-1, 86_400_001, True, False, "27", None, [27], {"ms": 27}])
def test_a_duration_that_is_absent_or_not_a_bounded_number_is_unknown_never_zero(reported: Any) -> None:
    mapped = facts(CLAUDE_CODE, "tool.completed", claude_tool("PostToolUse", duration_ms=reported))

    assert mapped is not None
    assert (mapped.duration_ms, mapped.duration_visibility) == (None, "unknown")


def test_a_claude_tool_call_without_a_duration_field_is_unknown() -> None:
    mapped = facts(CLAUDE_CODE, "tool.failed", claude_tool("PostToolUseFailure"))

    assert mapped is not None
    assert (mapped.duration_ms, mapped.duration_visibility) == (None, "unknown")


def test_codex_never_reports_a_duration_even_when_a_payload_carries_one() -> None:
    mapped = facts(CODEX, "tool.completed", codex_tool("PostToolUse", duration_ms=250))

    assert mapped is not None
    assert (mapped.duration_ms, mapped.duration_visibility) == (None, "unknown")


def test_a_claude_skill_call_is_a_skill_event_named_from_the_skill_tool_input() -> None:
    document = claude_tool("PreToolUse", tool="Skill")
    document["tool_input"] = {"skill": "commit", "args": "-m secret"}

    mapped = facts(CLAUDE_CODE, "skill.invoked", document)

    assert mapped == expected("skill.invoked", skill_name="commit", subject_visibility="observed")
    assert "secret" not in repr(mapped)


@pytest.mark.parametrize(
    "tool_input", [{}, {"skill": ""}, {"skill": "bad name"}, {"skill": 3}, {"name": "commit"}, "text"]
)
def test_a_claude_skill_call_with_no_usable_name_is_a_skill_event_with_an_unknown_subject(tool_input: Any) -> None:
    document = {**claude_tool("PreToolUse", tool="Skill"), "tool_input": tool_input}

    assert facts(CLAUDE_CODE, "skill.invoked", document) == expected(
        "skill.invoked", skill_name=None, subject_visibility="unknown"
    )


def test_only_a_call_to_the_skill_tool_is_a_claude_skill_event() -> None:
    assert facts(CLAUDE_CODE, "skill.invoked", claude_tool("PreToolUse", tool="Read")) is None


def test_an_opencode_session_carries_its_parent_and_the_version_it_reports() -> None:
    document = opencode_session_created()
    info = document["input"]["event"]["properties"]["info"]
    info["parentID"] = "parent-session-0009"

    mapped = facts(OPENCODE, "session.started", document)

    assert mapped == expected("session.started", parent_session="parent-session-0009", harness_version="1.18.7")


@pytest.mark.parametrize("version", ["", "bad version", "v" * 65, 118, None, "1.0;drop"])
def test_an_opencode_version_that_is_not_a_version_is_left_out(version: Any) -> None:
    document = opencode_session_created()
    document["input"]["event"]["properties"]["info"]["version"] = version

    assert facts(OPENCODE, "session.started", document) == expected("session.started", harness_version=None)


@pytest.mark.parametrize("event_type", ["session.updated", "session.deleted", "message.part.updated", "", None, 5])
def test_only_a_created_opencode_session_is_a_session_start(event_type: Any) -> None:
    document = opencode_session_created()
    document["input"]["event"]["type"] = event_type

    assert facts(OPENCODE, "session.started", document) is None


def test_an_opencode_session_event_without_an_id_maps_to_nothing() -> None:
    document = opencode_session_created()
    del document["input"]["event"]["properties"]["info"]["id"]

    assert facts(OPENCODE, "session.started", document) is None


def test_an_opencode_skill_call_is_a_skill_event_named_from_the_tool_arguments() -> None:
    document = opencode_tool("tool.execute.before", tool="skill")
    document["output"] = {"args": {"name": "git-release", "note": "canary-prompt-text-8f3a"}}

    mapped = facts(OPENCODE, "skill.invoked", document)

    assert mapped == expected("skill.invoked", skill_name="git-release", subject_visibility="observed")
    assert "canary" not in repr(mapped)


def test_an_opencode_skill_call_with_no_usable_name_is_a_skill_event_with_an_unknown_subject() -> None:
    document = opencode_tool("tool.execute.before", tool="skill")
    document["output"] = {"args": {"name": "not a name"}}

    assert facts(OPENCODE, "skill.invoked", document) == expected(
        "skill.invoked", skill_name=None, subject_visibility="unknown"
    )


def test_only_a_call_to_the_skill_tool_is_an_opencode_skill_event() -> None:
    assert facts(OPENCODE, "skill.invoked", opencode_tool("tool.execute.before", tool="read")) is None


@pytest.mark.parametrize("missing", ["directory", "hook"])
def test_an_opencode_document_without_its_directory_or_hook_name_maps_to_nothing(missing: str) -> None:
    document = opencode_tool("tool.execute.before")
    del document[missing]

    assert facts(OPENCODE, "tool.started", document) is None


def test_an_opencode_tool_call_without_a_session_maps_to_nothing() -> None:
    document = opencode_tool("tool.execute.after")
    del document["input"]["sessionID"]

    assert facts(OPENCODE, "tool.completed", document) is None


def test_an_opencode_document_with_no_input_at_all_maps_to_nothing() -> None:
    assert facts(OPENCODE, "tool.started", opencode("tool.execute.before")) is None


def raw_facts(harness: str, event: str, raw: bytes) -> HookFacts | None:
    return map_hook(harness, event, project_hook_payload(raw, allowed_paths(harness)))


def test_a_duration_too_large_to_be_a_finite_number_is_unknown() -> None:
    raw = b'{"session_id":"s1","cwd":"/work","hook_event_name":"PostToolUse","tool_name":"Read","duration_ms":1e999}'

    mapped = raw_facts(CLAUDE_CODE, "tool.completed", raw)

    assert mapped is not None
    assert (mapped.duration_ms, mapped.duration_visibility) == (None, "unknown")


def test_a_session_value_that_is_not_valid_text_maps_to_nothing() -> None:
    raw = b'{"session_id":"\\ud800","cwd":"/work","hook_event_name":"PreToolUse","tool_name":"Read"}'

    assert raw_facts(CLAUDE_CODE, "tool.started", raw) is None
