"""Vendor fixtures for the three harness adapters: what each forwards, what FERRET stores, and how each fails open.

Every row runs the real adapter (the shared POSIX wrapper for Claude Code and Codex, the OpenCode plugin under Node)
against the built artifact and a private HOME. Every row also holds the same contract: exit zero, both streams empty,
no child left alive, and no canary from the payload anywhere on disk.
"""

import sqlite3
from collections.abc import Callable
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from adapter_cases import HARNESSES, VALID, assert_quiet, expected_row, send_invalid, send_valid, stored_rows
from hook_bench import Bench, derived
from hook_wrapper import (
    HUNG_SECONDS,
    KILL_SECONDS,
    TERM_SECONDS,
    Behaviour,
    HookRun,
    alive,
    recorded_pid,
    stand_in,
    within_deadline,
)
from synthetic_store import insert_events, synthetic_rows
from vendor_payloads import (
    CLAUDE_CODE,
    CODEX,
    IMAGE_CANARY,
    OPENCODE,
    SESSION,
    WORKSPACE,
    claude_tool,
    codex_view_image,
    image_data_url,
    opencode_call,
)

NOW = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)
BACKLOG = 250
PRUNE_ROW_LIMIT = 100
DAMAGED = b"this is not a SQLite database" * 64


def raw_forwarding(bench: Bench, harness: str) -> None:
    ran = send_valid(bench, harness)
    assert_quiet(ran)
    # The adapter returned, so the commit already happened: the row is readable the moment it exits.
    assert stored_rows(bench) == [expected_row(bench, harness)]
    assert within_deadline(ran)


def content_discard(bench: Bench, harness: str) -> None:
    assert_quiet(send_valid(bench, harness))
    assert bench.stored() == 1
    assert bench.leaks() == []


def missing_cli(bench: Bench, harness: str) -> None:
    fixture = VALID[harness]
    ran = bench.forward(harness, fixture.event, fixture.document, binary=None)
    assert_quiet(ran)
    assert bench.stored() == 0
    assert within_deadline(ran)


def invalid_json(bench: Bench, harness: str) -> None:
    assert_quiet(send_invalid(bench, harness))
    assert bench.stored() == 0


def lock_held(bench: Bench, harness: str) -> None:
    with closing(sqlite3.connect(bench.database, autocommit=True)) as writer:
        writer.execute("BEGIN IMMEDIATE")
        ran = send_valid(bench, harness)
        writer.execute("ROLLBACK")
    assert_quiet(ran)
    assert bench.stored() == 0
    assert within_deadline(ran)


def disk_error(bench: Bench, harness: str) -> None:
    bench.database.write_bytes(DAMAGED)
    ran = send_valid(bench, harness)
    assert_quiet(ran)
    assert bench.database.read_bytes() == DAMAGED
    assert within_deadline(ran)


def hung_child(bench: Bench, harness: str, behaviour: Behaviour) -> HookRun:
    fixture = VALID[harness]
    binary = stand_in(bench.directory, behaviour)
    ran = bench.forward(harness, fixture.event, fixture.document, binary=binary)
    pid = recorded_pid(bench.directory)
    assert pid is not None
    assert not alive(pid)
    assert_quiet(ran)
    return ran


def term_at_900(bench: Bench, harness: str) -> None:
    ran = hung_child(bench, harness, "hang")
    assert TERM_SECONDS - 0.05 <= ran.elapsed_seconds < HUNG_SECONDS


def kill_at_1000(bench: Bench, harness: str) -> None:
    ran = hung_child(bench, harness, "stubborn")
    assert KILL_SECONDS - 0.05 <= ran.elapsed_seconds < HUNG_SECONDS


def seed_backlog(bench: Bench) -> None:
    rows = synthetic_rows(20260918, BACKLOG, now=NOW, expired=BACKLOG)
    with closing(sqlite3.connect(bench.database, autocommit=True)) as connection:
        insert_events(connection, rows, now=NOW)


def marker(bench: Bench) -> object:
    return bench.sql("SELECT last_completed_at FROM maintenance_state")[0][0]


def prune_is_bounded(bench: Bench, harness: str) -> None:
    seed_backlog(bench)
    ran = send_valid(bench, harness)
    assert_quiet(ran)
    # One capture prunes at most its row limit, stores its own event, and leaves the marker for the next operation.
    assert bench.stored() == BACKLOG - PRUNE_ROW_LIMIT + 1
    assert bench.sql("SELECT value FROM operational_counter WHERE name = 'expired_local_total'") == [(PRUNE_ROW_LIMIT,)]
    assert marker(bench) is None
    assert within_deadline(ran)


def prune_lock_skips(bench: Bench, harness: str) -> None:
    seed_backlog(bench)
    with closing(sqlite3.connect(bench.database, autocommit=True)) as writer:
        writer.execute("BEGIN IMMEDIATE")
        ran = send_valid(bench, harness)
        writer.execute("ROLLBACK")
    assert_quiet(ran)
    # Neither the prune nor the capture could take the lock: every expired row, the counter, and the marker are as
    # they were.
    assert bench.stored() == BACKLOG
    assert bench.sql("SELECT value FROM operational_counter WHERE name = 'expired_local_total'") == [(0,)]
    assert marker(bench) is None
    assert within_deadline(ran)


CASES: dict[str, Callable[[Bench, str], None]] = {
    "raw forwarding and synchronous commit": raw_forwarding,
    "content discard": content_discard,
    "missing cli": missing_cli,
    "invalid json": invalid_json,
    "lock": lock_held,
    "disk error": disk_error,
    "term at 900 ms": term_at_900,
    "kill at 1000 ms": kill_at_1000,
    "prune row limit": prune_is_bounded,
    "prune lock": prune_lock_skips,
}
MALFORMED_PLUGIN_CALLS: dict[str, dict[str, Any]] = {
    "no arguments": {"hook": "tool.execute.before", "args": []},
    "null arguments": {"hook": "tool.execute.after", "args": [None, None]},
    "wrong types": {"hook": "tool.execute.before", "args": [{"tool": 5, "sessionID": {}, "callID": []}, "text"]},
    "an empty event": {"hook": "event", "args": [{}]},
    "an event with no properties": {"hook": "event", "args": [{"event": {"type": "session.created"}}]},
}


def opencode_image_completion() -> dict[str, Any]:
    call = opencode_call("tool.execute.after")
    call["args"][1]["output"] = image_data_url()
    return call


# A completion whose result is an image, as each harness sends it: the image itself, base64-encoded, so the payload
# runs to a megabyte and more. Each maps to the same metadata a small result would.
LARGE_RESULTS: dict[str, tuple[dict[str, Any], dict[str, Any]]] = {
    CLAUDE_CODE: (
        claude_tool(
            "PostToolUse",
            duration_ms=27,
            tool_response={"type": "image", "file": {"base64": image_data_url(), "type": "image/png"}},
        ),
        {"tool_name": "Read", "outcome_visibility": "observed", "duration_ms": 27, "duration_visibility": "observed"},
    ),
    CODEX: (
        codex_view_image(),
        {
            "tool_name": "view_image",
            "outcome_visibility": "derived",
            "duration_ms": None,
            "duration_visibility": "unknown",
        },
    ),
    OPENCODE: (
        opencode_image_completion(),
        {"tool_name": "read", "outcome_visibility": "derived", "duration_ms": None, "duration_visibility": "unknown"},
    ),
}


@pytest.mark.parametrize("harness", HARNESSES)
def test_a_completion_whose_result_is_a_large_image_is_stored_within_the_deadline(
    artifact: Path, home: Path, harness: str
) -> None:
    """Regression: a result over 256 KiB lost its completion, so no Codex ``view_image`` completion was recorded."""
    bench = Bench.create(artifact, home, home.parent)
    document, row = LARGE_RESULTS[harness]

    ran = bench.forward(harness, "tool.completed", document)

    assert_quiet(ran)
    assert stored_rows(bench) == [
        {
            "event_type": "tool.completed",
            "outcome": "success",
            "subject_visibility": "observed",
            **row,
            "harness": harness,
            "workspace_id": derived(bench.key(), "ws", WORKSPACE),
            "session_id": derived(bench.key(), "ss", harness, SESSION),
        }
    ]
    assert IMAGE_CANARY.encode() not in bench.written()
    assert bench.leaks() == []
    assert within_deadline(ran)


@pytest.mark.parametrize("harness", HARNESSES)
@pytest.mark.parametrize("case", list(CASES))
def test_fail_open_matrix(artifact: Path, home: Path, harness: str, case: str) -> None:
    CASES[case](Bench.create(artifact, home, home.parent), harness)


@pytest.mark.parametrize("call", list(MALFORMED_PLUGIN_CALLS))
def test_plugin_survives_malformed_hook_calls(artifact: Path, home: Path, call: str) -> None:
    bench = Bench.create(artifact, home, home.parent)
    ran = bench.forward(OPENCODE, "tool.started", MALFORMED_PLUGIN_CALLS[call])
    assert_quiet(ran)
    assert bench.stored() == 0


def test_the_three_adapters_share_one_workspace_identifier(artifact: Path, home: Path) -> None:
    bench = Bench.create(artifact, home, home.parent)
    for harness in (CLAUDE_CODE, CODEX, OPENCODE):
        assert_quiet(send_valid(bench, harness))
    assert {row["workspace_id"] for row in stored_rows(bench)} == {expected_row(bench, CLAUDE_CODE)["workspace_id"]}
    assert {row["harness"] for row in stored_rows(bench)} == {CLAUDE_CODE, CODEX, OPENCODE}
