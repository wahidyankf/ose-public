"""The SQLite event repository against a real database: exact row round-trip, expiry stamp, and workspace sharing."""

import sqlite3
from contextlib import closing
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from ferret.adapters.sqlite_repository import SQLiteEventRepository
from ferret.adapters.sqlite_schema import SQLiteSchema
from ferret.adapters.system import SystemClock
from ferret.application.ports import Budget
from ferret.domain.errors import FerretError
from ferret.domain.event import Event, event_from_document
from support.burst import expected_rows, integrity_check, run_burst, stored_rows
from support.busy import PLANNED_ATTEMPT_TIMEOUT_MS, record_busy_timeouts, stepping_clock
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, event_document
from support.fakes import FakeMonotonic

NOW = datetime(2026, 9, 18, 8, 15, 31, tzinfo=UTC)
LATER = datetime(2030, 1, 1, tzinfo=UTC)
VECTOR_ROW = {
    "event_id": "00000000-0000-4000-8000-000000000001",
    "event_hash": VECTOR_HASH,
    "schema_version": "1.0",
    "occurred_at": "2026-09-18T08:15:30.123Z",
    "captured_at": "2026-09-18T08:15:30.130Z",
    "expires_at": "2026-10-18T08:15:30.130Z",
    "harness": "claude_code",
    "harness_version": "1.0.123",
    "installation_id": "00000000-0000-4000-8000-000000000002",
    "workspace_id": "ws_327b250d010590da40f0f76d18da910a",
    "session_id": "ss_d0de260ca18a8379984031556b2d43ac",
    "parent_session_id": None,
    "event_type": "tool.completed",
    "agent_name": None,
    "skill_name": None,
    "tool_name": "Read",
    "outcome": "success",
    "duration_ms": 27,
    "subject_visibility": "observed",
    "outcome_visibility": "observed",
    "duration_visibility": "observed",
}


@pytest.fixture
def database(tmp_path: Path) -> Path:
    path = tmp_path / "ferret.sqlite3"
    SQLiteSchema(path, SystemClock()).migrate()
    return path


def make_event(*, now: datetime = NOW, **overrides: Any) -> Event:
    return event_from_document(event_document(**overrides), now=now)


def rows(database: Path, table: str) -> list[dict[str, Any]]:
    with closing(sqlite3.connect(database)) as connection:
        connection.row_factory = sqlite3.Row
        return [dict(row) for row in connection.execute(f"SELECT * FROM {table} ORDER BY 1")]


def test_the_fixed_vector_round_trips_into_exactly_one_row(database: Path) -> None:
    result = SQLiteEventRepository(database).capture(make_event())

    assert result == "stored"
    assert rows(database, "event") == [VECTOR_ROW]


@pytest.mark.parametrize(
    ("captured_at", "expires_at"),
    [
        ("2026-09-18T08:15:30.130Z", "2026-10-18T08:15:30.130Z"),
        ("2026-01-31T23:59:59.999Z", "2026-03-02T23:59:59.999Z"),
        ("2028-02-01T00:00:00.000Z", "2028-03-02T00:00:00.000Z"),
        ("2026-12-15T12:00:00.500Z", "2027-01-14T12:00:00.500Z"),
    ],
)
def test_a_stored_event_expires_thirty_days_after_it_was_captured(
    database: Path, captured_at: str, expires_at: str
) -> None:
    event = make_event(now=LATER, capturedAt=captured_at, occurredAt=captured_at)

    SQLiteEventRepository(database).capture(event)

    [row] = rows(database, "event")

    assert (row["captured_at"], row["expires_at"]) == (captured_at, expires_at)


def test_events_in_one_workspace_share_one_workspace_row(database: Path) -> None:
    repository = SQLiteEventRepository(database)
    later = make_event(eventId="00000000-0000-4000-8000-000000000003", capturedAt="2026-09-18T09:00:00.000Z")
    earlier = make_event(eventId="00000000-0000-4000-8000-000000000004", capturedAt="2026-09-18T07:00:00.000Z")

    repository.capture(later)
    repository.capture(earlier)

    assert rows(database, "workspace") == [
        {
            "workspace_id": VECTOR_DOCUMENT["workspaceId"],
            "first_seen_at": "2026-09-18T07:00:00.000Z",
            "last_seen_at": "2026-09-18T09:00:00.000Z",
        }
    ]
    assert len(rows(database, "event")) == 2


def test_events_in_different_workspaces_get_their_own_workspace_rows(database: Path) -> None:
    repository = SQLiteEventRepository(database)

    repository.capture(make_event())
    repository.capture(
        make_event(eventId="00000000-0000-4000-8000-000000000005", workspaceId="ws_00000000000000000000000000000005")
    )

    assert [row["workspace_id"] for row in rows(database, "workspace")] == [
        "ws_00000000000000000000000000000005",
        "ws_327b250d010590da40f0f76d18da910a",
    ]


def test_a_failed_insert_leaves_neither_an_event_nor_a_workspace_row(database: Path) -> None:
    with closing(sqlite3.connect(database)) as connection:
        connection.execute("DROP TABLE event")

    with pytest.raises(FerretError) as caught:
        SQLiteEventRepository(database).capture(make_event())

    assert caught.value.code == "ferret.storage.unavailable"
    assert rows(database, "workspace") == []


def test_capturing_the_same_event_again_reports_a_duplicate_and_adds_nothing(database: Path) -> None:
    repository = SQLiteEventRepository(database)

    first = repository.capture(make_event())
    second = repository.capture(make_event())

    assert (first, second) == ("stored", "duplicate")
    assert rows(database, "event") == [VECTOR_ROW]
    assert len(rows(database, "workspace")) == 1


def test_the_same_id_with_different_content_conflicts_and_changes_nothing(database: Path) -> None:
    repository = SQLiteEventRepository(database)
    repository.capture(make_event())
    before = (rows(database, "event"), rows(database, "workspace"))

    with pytest.raises(FerretError) as caught:
        repository.capture(make_event(toolName="Write"))

    assert caught.value.code == "ferret.event.idempotency-conflict"
    assert (rows(database, "event"), rows(database, "workspace")) == before


def test_a_constraint_failure_after_the_workspace_upsert_rolls_the_whole_capture_back(database: Path) -> None:
    unchecked = replace(make_event(), event_type="tool.exploded")

    with pytest.raises(FerretError) as caught:
        SQLiteEventRepository(database).capture(unchecked)

    assert caught.value.code == "ferret.storage.integrity-failure"
    assert (rows(database, "event"), rows(database, "workspace")) == ([], [])


def test_a_writer_blocked_beyond_the_busy_timeout_fails_retryably_and_leaves_no_row(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    budgets = record_busy_timeouts(monkeypatch)
    blocker = sqlite3.connect(database, autocommit=True)
    blocker.execute("BEGIN IMMEDIATE")
    try:
        with pytest.raises(FerretError) as caught:
            SQLiteEventRepository(database).capture(make_event())
    finally:
        blocker.execute("ROLLBACK")
        blocker.close()

    assert (caught.value.code, caught.value.retryable) == ("ferret.storage.unavailable", True)
    # Every attempt is opened with the short attempt timeout, never with the budget: a budget handed to
    # SQLite as a busy timeout is not a bound, which is the defect this asserts against.
    assert budgets != []
    assert set(budgets) == {PLANNED_ATTEMPT_TIMEOUT_MS}
    assert rows(database, "event") == []
    assert SQLiteEventRepository(database).capture(make_event()) == "stored"


def test_three_repository_burst(database: Path) -> None:
    bursts = run_burst(database)

    captures = [capture for burst in bursts for capture in burst]
    assert {capture.result for capture in captures} == {"stored"}
    assert max(capture.elapsed for capture in captures) < 1.0
    assert stored_rows(database) == expected_rows()
    assert integrity_check(database) == [("ok",)]
    assert len(rows(database, "workspace")) == len(bursts)


def test_a_blocked_writer_stops_when_its_budget_is_spent_however_long_the_busy_timeout_runs(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The regression for the defect that let a harness call overrun its deadline.

    SQLite's busy timeout bounds each of the sequential lock waits a ``BEGIN IMMEDIATE`` makes, not the acquisition, so
    the delivered code waited five to seven times the budget it thought it had. The acquisition now reads a monotonic
    clock and stops once the budget is spent, which this asserts with an injected clock so it measures the rule and
    not the host.
    """
    budget = Budget.start(FakeMonotonic(), 250)
    clock = stepping_clock(monkeypatch, step_seconds=0.1)
    blocker = sqlite3.connect(database, autocommit=True)
    blocker.execute("BEGIN IMMEDIATE")
    try:
        with pytest.raises(FerretError) as caught:
            SQLiteEventRepository(database).capture(make_event(), budget=budget)
    finally:
        blocker.execute("ROLLBACK")
        blocker.close()

    assert (caught.value.code, caught.value.retryable) == ("ferret.storage.unavailable", True)
    # One reading fixes the deadline and each later one ends an attempt, so a 250 ms budget at 100 ms a reading gives
    # up on the third: the acquisition is bounded by the clock, never by however long SQLite chose to wait.
    assert clock.readings == 4
    assert rows(database, "event") == []
