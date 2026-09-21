"""Integration bindings for the retention feature, against a real temporary home and SQLite database.

The scenario names ``status`` for the counters; that command lands with the maintenance packet, so until then these
steps read the same two counters straight from the database, independently of the code under test.
"""

import json
import sqlite3
from collections.abc import Iterator
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.domain.retention import PRUNE_ROW_LIMIT
from ferret.domain.space import KIB, StorageFacts, should_compact, size_report
from support.fakes import FIXED_NOW, FakeMonotonic, FixedClock
from support.invoke import Ran
from support.machine import Machine, make_machine
from support.populate import stamp
from support.retention import cutoff_stamp, edge_events, expired_events, fresh_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature"
BEYOND_CUTOFF = 130
NEWER = 5
LIST_ALL = ["events", "list", "--all-time", "--limit", "200", "--json"]


@dataclass(slots=True)
class Session:
    """A private temporary machine with a fixed clock, and what the read and the next operation wrote."""

    machine: Machine
    read: Ran | None = None
    next_operation: Ran | None = None
    holder: sqlite3.Connection | None = None
    populated: StorageFacts | None = None
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None


def event_ids(ran: Ran | None) -> list[str]:
    assert ran is not None
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


def counter(session: Session, name: str) -> int:
    return session.machine.sql("SELECT value FROM operational_counter WHERE name = ?", (name,))[0][0]


@pytest.fixture
def session(tmp_path: Path) -> Iterator[Session]:
    opened = Session(machine=make_machine(tmp_path, clock=FixedClock(FIXED_NOW), monotonic=FakeMonotonic()))
    yield opened
    if opened.holder is not None:
        opened.holder.close()


@scenario(FEATURE, "Hide then prune every expired usage-derived record")
def test_hide_then_prune_every_expired_usage_derived_record() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains rows captured before and after the thirty-day cutoff")
def given_rows_around_the_cutoff(session: Session) -> None:
    exactly_at_the_cutoff, just_inside = edge_events(FIXED_NOW)
    session.machine.fill(
        [
            *expired_events(BEYOND_CUTOFF, now=FIXED_NOW),
            exactly_at_the_cutoff,
            just_inside,
            *fresh_events(NEWER, now=FIXED_NOW),
        ]
    )
    session.machine.set_marker(stamp(FIXED_NOW))


@when("a read runs before physical pruning and then the next FERRET operation runs with a fixed clock")
def when_a_read_then_the_next_operation_runs(session: Session) -> None:
    machine = session.machine
    session.read = machine.run(LIST_ALL)
    assert machine.sql("SELECT count(*) FROM event") == [(BEYOND_CUTOFF + 2 + NEWER,)]
    machine.set_marker(None)
    session.next_operation = machine.run(LIST_ALL)


@then("no row at or beyond the cutoff is returned by the read")
def then_no_expired_row_is_returned(session: Session) -> None:
    assert session.read is not None
    items = json.loads(session.read.stdout)["items"]
    assert items
    assert all(item["capturedAt"] > cutoff_stamp(FIXED_NOW) for item in items)


@then("the next operation stops physical pruning at the first of 100 rows or 100 monotonic milliseconds")
def then_the_prune_stops_at_its_first_limit(session: Session) -> None:
    expired = session.machine.sql("SELECT count(*) FROM event WHERE expires_at <= ?", (stamp(FIXED_NOW),))
    assert expired == [(BEYOND_CUTOFF + 1 - PRUNE_ROW_LIMIT,)]


@then("every newer row remains queryable")
def then_every_newer_row_remains_queryable(session: Session) -> None:
    rows = session.machine.sql("SELECT event_id FROM event WHERE expires_at > ?", (stamp(FIXED_NOW),))
    newer = {row[0] for row in rows}
    assert len(newer) == NEWER + 1
    assert set(event_ids(session.next_operation)) == newer
    assert set(event_ids(session.read)) == newer


@then("status increments expiredLocalTotal for locally expired rows")
def then_the_local_counter_grows_by_what_was_pruned(session: Session) -> None:
    assert counter(session, "expired_local_total") == PRUNE_ROW_LIMIT


@then("expiredBeforeAckTotal remains zero")
def then_the_before_ack_counter_stays_zero(session: Session) -> None:
    assert counter(session, "expired_before_ack_total") == 0


@scenario(FEATURE, "Measure storage before and after retention")
def test_measure_storage_before_and_after_retention() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a representative event fixture has populated the database and WAL")
def given_a_populated_database_and_log(session: Session) -> None:
    # Another connection stays open, as a concurrent harness process would, so the log outlives the writers.
    session.holder = sqlite3.connect(session.machine.database, autocommit=True)
    session.holder.execute("SELECT count(*) FROM event").fetchone()
    session.machine.fill([*expired_events(BEYOND_CUTOFF, now=FIXED_NOW), *fresh_events(NEWER, now=FIXED_NOW)])
    session.populated = session.machine.runtime().telemetry.storage_facts()
    assert session.populated.wal_bytes > 0


@when("maintenance checkpoints, prunes expired rows, and performs the planned compaction policy")
def when_maintenance_reclaims_space(session: Session) -> None:
    machine = session.machine
    ran = machine.run(["maintenance", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    session.maintenance = json.loads(ran.stdout)
    session.status = json.loads(machine.run(["status", "--json"]).stdout)


@then("status reports database, WAL, and total high-water bytes separately")
def then_status_reports_the_three_figures_separately(session: Session) -> None:
    assert session.maintenance is not None
    assert session.status is not None
    assert session.populated is not None
    report, status = session.maintenance, session.status
    machine = session.machine
    # The log is truncated, and this small a free list is below the compaction policy, so the file is left as it is.
    assert not should_compact(StorageFacts(status["databaseBytes"], status["walBytes"], status["freelistBytes"]))
    assert (status["databaseBytes"], status["walBytes"]) == (machine.database.stat().st_size, 0)
    assert status["freelistBytes"] > 0
    assert status["highWaterBytes"] == status["databaseBytes"] + status["walBytes"]
    assert report["databaseBytesBefore"] == session.populated.database_bytes
    assert report["highWaterBytes"] >= session.populated.footprint_bytes


@then("the benchmark reports bytes per event and index share")
def then_the_benchmark_reports_bytes_per_event_and_index_share(session: Session) -> None:
    assert session.status is not None
    with closing(sqlite3.connect(session.machine.database)) as connection:
        index_bytes = connection.execute(
            "SELECT sum(pgsize) FROM dbstat WHERE name IN (SELECT name FROM sqlite_schema WHERE type = 'index')"
        ).fetchone()[0]
    events, database_bytes = session.status["eventCount"], session.status["databaseBytes"]

    report = size_report(events=events, database_bytes=database_bytes, index_bytes=index_bytes)

    assert events == NEWER
    assert report.bytes_per_event == database_bytes / events
    assert 0 < report.index_share < 1
    assert report.index_share == index_bytes / database_bytes


@then("a size outside the planning envelope fails the storage acceptance gate pending explanation")
def then_an_outside_size_fails_the_gate_until_explained(session: Session) -> None:
    oversized = size_report(events=1000, database_bytes=3 * KIB * 1000, index_bytes=0)
    explained = size_report(
        events=1000, database_bytes=3 * KIB * 1000, index_bytes=0, explanation="fixed page overhead dominates"
    )

    assert (oversized.acceptance, oversized.passes) == ("unexplained", False)
    assert (explained.acceptance, explained.passes) == ("explained", True)
