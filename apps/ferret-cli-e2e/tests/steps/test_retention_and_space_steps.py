"""E2E bindings for the retention feature: the built artifact and a store seeded straight into its tables."""

import json
import sqlite3
from collections.abc import Iterator
from contextlib import closing
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from event_documents import stamp
from ferret_process import Completed, run_artifact
from storage_benchmark import Footprint, footprint_of
from synthetic_store import RETENTION, Row, insert_events, synthetic_rows

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature"
SEED = 20260918
BEYOND_CUTOFF = 130
NEWER = 5
LIST_ALL = ["events", "list", "--all-time", "--limit", "200", "--json"]
# A row whose retention ended a second before the seeding, and one whose retention ends a minute after it: the read
# runs within that minute, so the first is at or beyond the cutoff and the second is not.
JUST_EXPIRED = timedelta(seconds=-1)
EXPIRING_SOON = timedelta(seconds=60)


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, its seeding moment, and what each invocation returned."""

    artifact: Path
    home: Path
    now: datetime
    newer: set[str] = field(default_factory=lambda: set[str]())
    at_the_cutoff: str = ""
    holder: sqlite3.Connection | None = None
    populated: Footprint | None = None
    read: Completed | None = None
    operations: list[Completed] = field(default_factory=lambda: list[Completed]())
    removed: list[int] = field(default_factory=lambda: list[int]())
    still_expired: int = 0
    status_before: dict[str, Any] | None = None
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None

    def run(self, arguments: list[str]) -> Completed:
        return run_artifact(self.artifact, arguments, home=self.home)

    @property
    def database(self) -> Path:
        return self.home / ".local" / "share" / "ferret" / "ferret.sqlite3"

    def sql(self, statement: str, parameters: tuple[object, ...] = ()) -> list[tuple[Any, ...]]:
        with closing(sqlite3.connect(self.database, autocommit=True)) as connection:
            return connection.execute(statement, parameters).fetchall()

    def expired_held(self) -> int:
        """How many rows the database still holds whose retention has ended by now, read with plain SQL."""
        [(count,)] = self.sql("SELECT count(*) FROM event WHERE expires_at <= ?", (stamp(datetime.now(UTC)),))
        return count

    def seed(self, *extra: Row) -> None:
        """Rows well beyond the thirty-day cutoff, rows well inside it, and ``extra``, written into the tables."""
        rows = synthetic_rows(SEED, BEYOND_CUTOFF + NEWER, now=self.now, expired=BEYOND_CUTOFF)
        self.newer = {str(row[0]) for row in rows[BEYOND_CUTOFF:]}
        with closing(sqlite3.connect(self.database, autocommit=True)) as connection:
            insert_events(connection, [*rows, *extra], now=self.now)

    def json_result(self, arguments: list[str]) -> dict[str, Any]:
        ran = self.run([*arguments, "--json"])
        assert (ran.returncode, ran.stderr) == (0, b"")
        result: dict[str, Any] = json.loads(ran.stdout)
        return result


def expiring_at(row: Row, expires_in: timedelta, now: datetime) -> Row:
    """``row`` re-timed so that its retention ends ``expires_in`` after ``now`` (before it, when negative)."""
    captured = now + expires_in - RETENTION
    return (*row[:2], stamp(captured), stamp(captured), stamp(captured + RETENTION), *row[5:])


@pytest.fixture
def session(artifact: Path, home: Path) -> Iterator[Session]:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    opened = Session(artifact=artifact, home=home, now=datetime.now(UTC))
    yield opened
    if opened.holder is not None:
        opened.holder.close()


def listed_ids(ran: Completed | None) -> list[str]:
    assert ran is not None
    assert (ran.returncode, ran.stderr) == (0, b"")
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


def rows_around_the_cutoff(session: Session) -> None:
    """Rows captured before and after the cutoff, with the status taken before any operation runs."""
    just_expired, expiring_soon = synthetic_rows(SEED + 1, 2, now=session.now, expired=0)
    session.seed(
        expiring_at(just_expired, JUST_EXPIRED, session.now), expiring_at(expiring_soon, EXPIRING_SOON, session.now)
    )
    session.at_the_cutoff = str(just_expired[0])
    session.newer.add(str(expiring_soon[0]))
    # Maintenance ran a moment ago, so the read below is not the operation that prunes.
    session.sql("UPDATE maintenance_state SET last_completed_at = ? WHERE singleton_id = 1", (stamp(session.now),))
    session.status_before = session.json_result(["status"])
    assert session.expired_held() == BEYOND_CUTOFF + 1


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: Events older than thirty days are never returned
@scenario(FEATURE, "Events older than thirty days are never returned")
def test_events_older_than_thirty_days_are_never_returned() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains rows captured before and after the thirty-day cutoff")
def given_rows_around_the_cutoff(session: Session) -> None:
    rows_around_the_cutoff(session)


@when("a read runs before physical pruning and then the next two FERRET operations run")
def when_a_read_then_the_next_operations_run(session: Session) -> None:
    session.read = session.run(LIST_ALL)
    before = session.expired_held()
    session.sql("UPDATE maintenance_state SET last_completed_at = NULL WHERE singleton_id = 1")
    for _ in range(2):
        session.operations.append(session.run(LIST_ALL))
        after = session.expired_held()
        session.removed.append(before - after)
        before = after
    session.still_expired = before


@then("no row at or beyond the cutoff is returned by the read")
def then_no_expired_row_is_returned(session: Session) -> None:
    listed = listed_ids(session.read)
    assert session.at_the_cutoff not in listed
    assert set(listed) == session.newer
    assert session.read is not None
    assert all(
        item["capturedAt"] > stamp(datetime.now(UTC) - RETENTION) for item in json.loads(session.read.stdout)["items"]
    )


@then("every newer row remains queryable")
def then_every_newer_row_remains_queryable(session: Session) -> None:
    for operation in session.operations:
        assert set(listed_ids(operation)) == session.newer
    rows = session.sql("SELECT event_id FROM event WHERE expires_at > ?", (stamp(datetime.now(UTC)),))
    assert {row[0] for row in rows} == session.newer


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: status reports how many events expired
@scenario(FEATURE, "status reports how many events expired")
def test_status_reports_how_many_events_expired() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@then("status reports as many locally expired events as the operations pruned")
def then_the_local_counter_matches_what_was_pruned(session: Session) -> None:
    assert session.status_before is not None
    session.status = session.json_result(["status"])
    assert session.status_before["expiredLocalTotal"] == 0
    assert sum(session.removed) > 0
    assert session.status["expiredLocalTotal"] == sum(session.removed)


@given("a representative event fixture has populated the database and WAL")
def given_a_populated_database_and_log(session: Session) -> None:
    # Another connection stays open, as a concurrent harness process would, so the log outlives the writers.
    session.holder = sqlite3.connect(session.database, autocommit=True)
    session.holder.execute("SELECT count(*) FROM event").fetchone()
    session.seed()
    session.populated = footprint_of(session.database)
    assert session.populated.wal_bytes > 0


@when("maintenance checkpoints, prunes expired rows, and performs the planned compaction policy")
def when_maintenance_reclaims_space(session: Session) -> None:
    session.maintenance = session.json_result(["maintenance"])
    session.status = session.json_result(["status"])


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: maintenance reports database bytes before and after and the largest footprint
@scenario(FEATURE, "maintenance reports database bytes before and after and the largest footprint")
def test_maintenance_reports_database_bytes_before_and_after_and_the_largest_footprint() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@then("maintenance reports the database bytes before and after it and the largest footprint it measured")
def then_maintenance_reports_its_before_after_and_peak(session: Session) -> None:
    assert session.maintenance is not None
    assert session.populated is not None
    report, on_disk = session.maintenance, footprint_of(session.database)
    assert report["expiredEventCount"] == BEYOND_CUTOFF
    assert session.expired_held() == 0
    assert report["databaseBytesBefore"] == session.populated.database_bytes
    assert (report["databaseBytesAfter"], report["walBytesAfter"]) == (on_disk.database_bytes, on_disk.wal_bytes)
    assert on_disk.wal_bytes == 0
    # So few rows free too little of the file for the policy to rewrite it: the freed pages stay on the free list.
    assert report["databaseBytesAfter"] >= report["databaseBytesBefore"]
    assert report["freelistBytesAfter"] > 0
    assert report["highWaterBytes"] >= max(session.populated.total_bytes, on_disk.total_bytes)


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: status reports database, WAL, and free-list bytes with a total
@scenario(FEATURE, "status reports database, WAL, and free-list bytes with a total")
def test_status_reports_database_wal_and_free_list_bytes_with_a_total() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@then("status reports the database, WAL, and free-list bytes on disk separately with their current total")
def then_status_reports_the_files_as_they_stand(session: Session) -> None:
    assert session.status is not None
    status, on_disk = session.status, footprint_of(session.database)
    [(free_pages,)] = session.sql("PRAGMA freelist_count")
    [(page_size,)] = session.sql("PRAGMA page_size")
    assert (status["databaseBytes"], status["walBytes"]) == (on_disk.database_bytes, on_disk.wal_bytes)
    assert status["freelistBytes"] == free_pages * page_size > 0
    assert status["highWaterBytes"] == on_disk.total_bytes
    assert status["eventCount"] == NEWER


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: maintenance --if-due does nothing unless maintenance is due
@scenario(FEATURE, "maintenance --if-due does nothing unless maintenance is due")
def test_maintenance_if_due_does_nothing_unless_maintenance_is_due() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the database holds expired events and maintenance {state}"))
def given_expired_events_and_maintenance_state(session: Session, state: str) -> None:
    session.seed()
    if state == "ran a moment ago":
        session.sql("UPDATE maintenance_state SET last_completed_at = ? WHERE singleton_id = 1", (stamp(session.now),))
    else:
        assert state == "has never run"
        session.sql("UPDATE maintenance_state SET last_completed_at = NULL WHERE singleton_id = 1")
    assert session.expired_held() == BEYOND_CUTOFF


@when("the user runs maintenance with --if-due")
def when_maintenance_runs_if_due(session: Session) -> None:
    session.maintenance = session.json_result(["maintenance", "--if-due"])


@then(parsers.parse("the expired events are {pruned}"))
def then_the_expired_events_are(session: Session, pruned: str) -> None:
    held = session.expired_held()
    if pruned == "pruned":
        assert held == 0
    else:
        assert pruned == "left in place"
        assert held == BEYOND_CUTOFF
