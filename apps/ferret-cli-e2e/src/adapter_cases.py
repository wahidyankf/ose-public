"""The vendor calls each harness adapter is driven with, and the one row FERRET must keep for each valid call.

The adapter tests and the feature bindings share these, so a scenario and the fixture matrix cannot disagree about
what "a lifecycle event" or "invalid metadata" means for a harness.
"""

from dataclasses import dataclass
from typing import Any

from hook_bench import Bench, derived
from hook_wrapper import HookRun
from vendor_payloads import (
    CLAUDE_CODE,
    CODEX,
    OPENCODE,
    RESULT_CANARY,
    SESSION,
    WORKSPACE,
    claude_tool,
    codex_tool,
    opencode_call,
)

HARNESSES = (CLAUDE_CODE, CODEX, OPENCODE)
COLUMNS = (
    "event_type",
    "tool_name",
    "outcome",
    "duration_ms",
    "subject_visibility",
    "outcome_visibility",
    "duration_visibility",
    "harness",
    "workspace_id",
    "session_id",
)
TRUNCATED = b'{"session_id":"native-session-0001","hook_event_name":'


@dataclass(frozen=True, slots=True)
class Fixture:
    """One valid vendor call: the event it is registered under, the raw document, and the metadata FERRET keeps."""

    event: str
    document: dict[str, Any]
    row: dict[str, Any]


VALID: dict[str, Fixture] = {
    CLAUDE_CODE: Fixture(
        "tool.completed",
        claude_tool("PostToolUse", duration_ms=27, tool_response={"content": RESULT_CANARY}),
        {
            "event_type": "tool.completed",
            "tool_name": "Read",
            "outcome": "success",
            "duration_ms": 27,
            "subject_visibility": "observed",
            "outcome_visibility": "observed",
            "duration_visibility": "observed",
        },
    ),
    CODEX: Fixture(
        "tool.completed",
        codex_tool("PostToolUse", tool_response={"output": RESULT_CANARY}),
        {
            "event_type": "tool.completed",
            "tool_name": "Bash",
            "outcome": "success",
            "duration_ms": None,
            "subject_visibility": "observed",
            "outcome_visibility": "derived",
            "duration_visibility": "unknown",
        },
    ),
    OPENCODE: Fixture(
        "tool.started",
        opencode_call("tool.execute.before"),
        {
            "event_type": "tool.started",
            "tool_name": "read",
            "outcome": "not_applicable",
            "duration_ms": None,
            "subject_visibility": "observed",
            "outcome_visibility": "not_applicable",
            "duration_visibility": "not_applicable",
        },
    ),
}
# What each harness's adapter is given when the metadata is unusable: not JSON, truncated JSON, or a call with no data.
INVALID: dict[str, bytes | dict[str, Any]] = {
    CLAUDE_CODE: b"{not json",
    CODEX: TRUNCATED,
    OPENCODE: {"hook": "tool.execute.before", "args": [{}, {}]},
}


def assert_quiet(ran: HookRun) -> None:
    """The contract every adapter call holds, whatever happened inside: exit zero and nothing on either stream."""
    assert (ran.code, ran.stdout, ran.stderr) == (0, b"", b"")


def send_valid(bench: Bench, harness: str) -> HookRun:
    fixture = VALID[harness]
    return bench.forward(harness, fixture.event, fixture.document)


def send_invalid(bench: Bench, harness: str) -> HookRun:
    return bench.forward(harness, VALID[harness].event, INVALID[harness])


def expected_row(bench: Bench, harness: str) -> dict[str, Any]:
    """The whole row a valid call must leave, including the identifiers the contract derives from the key."""
    return {
        **VALID[harness].row,
        "harness": harness,
        "workspace_id": derived(bench.key(), "ws", WORKSPACE),
        "session_id": derived(bench.key(), "ss", harness, SESSION),
    }


def stored_rows(bench: Bench) -> list[dict[str, Any]]:
    """Every stored event, reduced to the columns the contract fixes, as one dictionary per row."""
    return [dict(zip(COLUMNS, row, strict=True)) for row in bench.sql(f"SELECT {', '.join(COLUMNS)} FROM event")]
