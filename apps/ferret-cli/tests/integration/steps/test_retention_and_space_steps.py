"""Integration bindings for the retention feature, against a real temporary home and SQLite database."""

import json
import sqlite3
from collections.abc import Iterator
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from support.fakes import FIXED_NOW, FakeMonotonic, FixedClock
from support.invoke import Ran
from support.machine import Machine, make_machine
from support.populate import stamp
from support.retention import cutoff_stamp, edge_events, expired_events, fresh_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature"
BEYOND_CUTOFF = 200
NEWER = 5
LIST_ALL = ["events", "list", "--all-time", "--limit", "200", "--json"]
# The second operation's monotonic clock advances this much at every reading, so its prune runs out of time first.
SLOW_READING_MS = 10
MEASURED_EXPIRED = 130


@dataclass(frozen=True, slots=True)
class Footprint:
    """The sizes of the database file and its write-ahead log, read from the filesystem."""

    database_bytes: int
    wal_bytes: int

    @property
    def total_bytes(self) -> int:
        return self.database_bytes + self.wal_bytes


@dataclass(slots=True)
class Session:
    """A private temporary machine with a fixed clock, and what the read, the operations, and status wrote."""

    machine: Machine
    at_the_cutoff: str = ""
    newer: set[str] = field(default_factory=lambda: set[str]())
    read: Ran | None = None
    operations: list[Ran] = field(default_factory=lambda: list[Ran]())
    removed: list[int] = field(default_factory=lambda: list[int]())
    still_expired: int = 0
    holder: sqlite3.Connection | None = None
    populated: Footprint | None = None
    status_before: dict[str, Any] | None = None
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None


def event_ids(ran: Ran | None) -> list[str]:
    assert ran is not None
    assert (ran.code, ran.stderr) == (0, "")
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


def expired_held(machine: Machine) -> int:
    """How many rows the database still holds whose retention has ended at the fixed moment, read with plain SQL."""
    return machine.sql("SELECT count(*) FROM event WHERE expires_at <= ?", (stamp(FIXED_NOW),))[0][0]


def json_result(machine: Machine, arguments: list[str]) -> dict[str, Any]:
    ran = machine.run([*arguments, "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    result: dict[str, Any] = json.loads(ran.stdout)
    return result


def size_of(path: Path) -> int:
    return path.stat().st_size if path.exists() else 0


def footprint_of(database: Path) -> Footprint:
    return Footprint(size_of(database), size_of(Path(f"{database}-wal")))


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
    newer = [just_inside, *fresh_events(NEWER, now=FIXED_NOW)]
    session.machine.fill([*expired_events(BEYOND_CUTOFF, now=FIXED_NOW), exactly_at_the_cutoff, *newer])
    session.at_the_cutoff = exactly_at_the_cutoff.event_id
    session.newer = {event.event_id for event in newer}
    # Maintenance completed a moment ago, so the read below is not the operation that prunes.
    session.machine.set_marker(stamp(FIXED_NOW))
    session.status_before = json_result(session.machine, ["status"])
    assert expired_held(session.machine) == BEYOND_CUTOFF + 1


@when("a read runs before physical pruning and then the next two FERRET operations run")
def when_a_read_then_the_next_operations_run(session: Session) -> None:
    machine = session.machine
    session.read = machine.run(LIST_ALL)
    before = expired_held(machine)
    machine.set_marker(None)
    # The first operation's clock stands still, so only the row limit can stop its prune; the second one's clock runs.
    for operating in (machine, replace(machine, monotonic=FakeMonotonic(step_ms=SLOW_READING_MS))):
        session.operations.append(operating.run(LIST_ALL))
        after = expired_held(machine)
        session.removed.append(before - after)
        before = after
    session.still_expired = before


@then("no row at or beyond the cutoff is returned by the read")
def then_no_expired_row_is_returned(session: Session) -> None:
    listed = event_ids(session.read)
    assert session.at_the_cutoff not in listed
    assert set(listed) == session.newer
    assert session.read is not None
    assert all(item["capturedAt"] > cutoff_stamp(FIXED_NOW) for item in json.loads(session.read.stdout)["items"])


@then("each of those operations stops physical pruning at the first of 100 rows or 100 monotonic milliseconds")
def then_each_prune_stops_at_its_first_limit(session: Session) -> None:
    # The first stops at 100 rows. The second reads its clock once to start its budget, once to size the wait for the
    # write lock, and once before each row; at 10 ms a reading the eighth row is the last started inside 100 ms.
    assert session.removed == [100, 8]
    assert session.still_expired == BEYOND_CUTOFF + 1 - 108 > 0


@then("every newer row remains queryable")
def then_every_newer_row_remains_queryable(session: Session) -> None:
    for operation in session.operations:
        assert set(event_ids(operation)) == session.newer
    rows = session.machine.sql("SELECT event_id FROM event WHERE expires_at > ?", (stamp(FIXED_NOW),))
    assert {row[0] for row in rows} == session.newer


@then("status increments expiredLocalTotal for locally expired rows")
def then_the_local_counter_grows_by_what_was_pruned(session: Session) -> None:
    assert session.status_before is not None
    session.status = json_result(session.machine, ["status"])
    assert session.status_before["expiredLocalTotal"] == 0
    assert session.status["expiredLocalTotal"] == sum(session.removed) == 108


@then("expiredBeforeAckTotal remains zero")
def then_the_before_ack_counter_stays_zero(session: Session) -> None:
    assert session.status_before is not None
    assert session.status is not None
    assert session.status_before["expiredBeforeAckTotal"] == session.status["expiredBeforeAckTotal"] == 0


@scenario(FEATURE, "Measure storage before and after retention")
def test_measure_storage_before_and_after_retention() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a representative event fixture has populated the database and WAL")
def given_a_populated_database_and_log(session: Session) -> None:
    # Another connection stays open, as a concurrent harness process would, so the log outlives the writers.
    session.holder = sqlite3.connect(session.machine.database, autocommit=True)
    session.holder.execute("SELECT count(*) FROM event").fetchone()
    session.machine.fill([*expired_events(MEASURED_EXPIRED, now=FIXED_NOW), *fresh_events(NEWER, now=FIXED_NOW)])
    session.populated = footprint_of(session.machine.database)
    assert session.populated.wal_bytes > 0


@when("maintenance checkpoints, prunes expired rows, and performs the planned compaction policy")
def when_maintenance_reclaims_space(session: Session) -> None:
    session.maintenance = json_result(session.machine, ["maintenance"])
    session.status = json_result(session.machine, ["status"])


@then("maintenance reports the database bytes before and after it and the largest footprint it measured")
def then_maintenance_reports_its_before_after_and_peak(session: Session) -> None:
    assert session.maintenance is not None
    assert session.populated is not None
    report, on_disk = session.maintenance, footprint_of(session.machine.database)
    assert report["expiredEventCount"] == MEASURED_EXPIRED
    assert expired_held(session.machine) == 0
    assert report["databaseBytesBefore"] == session.populated.database_bytes
    assert (report["databaseBytesAfter"], report["walBytesAfter"]) == (on_disk.database_bytes, on_disk.wal_bytes)
    assert on_disk.wal_bytes == 0
    # So few rows free too little of the file for the policy to rewrite it: the freed pages stay on the free list.
    assert report["databaseBytesAfter"] >= report["databaseBytesBefore"]
    assert report["freelistBytesAfter"] > 0
    assert report["highWaterBytes"] >= max(session.populated.total_bytes, on_disk.total_bytes)


@then("status reports the database, WAL, and free-list bytes on disk separately with their current total")
def then_status_reports_the_files_as_they_stand(session: Session) -> None:
    assert session.status is not None
    status, on_disk = session.status, footprint_of(session.machine.database)
    [(free_pages,)] = session.machine.sql("PRAGMA freelist_count")
    [(page_size,)] = session.machine.sql("PRAGMA page_size")
    assert (status["databaseBytes"], status["walBytes"]) == (on_disk.database_bytes, on_disk.wal_bytes)
    assert status["freelistBytes"] == free_pages * page_size > 0
    assert status["highWaterBytes"] == on_disk.total_bytes
    assert status["eventCount"] == NEWER
