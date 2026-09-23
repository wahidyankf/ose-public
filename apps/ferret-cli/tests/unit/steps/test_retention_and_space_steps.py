"""Unit bindings for the retention feature, in process with every OS dependency faked."""

import json
from dataclasses import dataclass, field, replace
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.domain.space import MIB, StorageFacts
from support.fakes import FIXED_NOW, FakeMonotonic, World
from support.invoke import Ran, run_cli, run_runtime
from support.populate import stamp, world_with
from support.retention import cutoff_stamp, edge_events, expired_events, fresh_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature"
BEYOND_CUTOFF = 200
NEWER = 5
LIST_ALL = ["events", "list", "--all-time", "--limit", "200", "--json"]
# The second operation's monotonic clock advances this much at every reading, so its prune runs out of time first.
SLOW_READING_MS = 10


@dataclass(slots=True)
class Session:
    """The fake machine, what the read and the next operations wrote, and what status reported around them."""

    world: World
    at_the_cutoff: str = ""
    newer: set[str] = field(default_factory=lambda: set[str]())
    read: Ran | None = None
    operations: list[Ran] = field(default_factory=lambda: list[Ran]())
    removed: list[int] = field(default_factory=lambda: list[int]())
    still_expired: int = 0
    status_before: dict[str, Any] | None = None
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None


def event_ids(ran: Ran | None) -> list[str]:
    assert ran is not None
    assert (ran.code, ran.stderr) == (0, "")
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


def expired_held(world: World) -> int:
    """How many rows the fake store still holds whose retention has ended at the fixed moment."""
    return sum(held.expires_at <= stamp(FIXED_NOW) for held in world.events.stored)


def status_of(world: World) -> dict[str, Any]:
    ran = run_cli(world, ["status", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    result: dict[str, Any] = json.loads(ran.stdout)
    return result


@pytest.fixture
def session() -> Session:
    return Session(world=world_with())


@scenario(FEATURE, "Hide then prune every expired usage-derived record")
def test_hide_then_prune_every_expired_usage_derived_record() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains rows captured before and after the thirty-day cutoff")
def given_rows_around_the_cutoff(session: Session) -> None:
    exactly_at_the_cutoff, just_inside = edge_events(FIXED_NOW)
    newer = [just_inside, *fresh_events(NEWER, now=FIXED_NOW)]
    session.world = world_with(*expired_events(BEYOND_CUTOFF, now=FIXED_NOW), exactly_at_the_cutoff, *newer)
    session.at_the_cutoff = exactly_at_the_cutoff.event_id
    session.newer = {event.event_id for event in newer}
    # Maintenance completed a moment ago, so the read below is not the operation that prunes.
    session.world.telemetry.marker = stamp(FIXED_NOW)
    session.status_before = status_of(session.world)
    assert expired_held(session.world) == BEYOND_CUTOFF + 1


@when("a read runs before physical pruning and then the next two FERRET operations run")
def when_a_read_then_the_next_operations_run(session: Session) -> None:
    world = session.world
    session.read = run_cli(world, LIST_ALL)
    before = expired_held(world)
    world.telemetry.marker = None
    # The first operation's clock stands still, so only the row limit can stop its prune; the second one's clock runs.
    slow = replace(world.runtime, monotonic=FakeMonotonic(step_ms=SLOW_READING_MS))
    for operation in (lambda: run_cli(world, LIST_ALL), lambda: run_runtime(slow, LIST_ALL)):
        session.operations.append(operation())
        after = expired_held(world)
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
    assert session.newer <= {held.event_id for held in session.world.events.stored}


@then("status increments expiredLocalTotal for locally expired rows")
def then_the_local_counter_grows_by_what_was_pruned(session: Session) -> None:
    assert session.status_before is not None
    session.status = status_of(session.world)
    assert session.status_before["expiredLocalTotal"] == 0
    assert session.status["expiredLocalTotal"] == sum(session.removed) == 108


@then("expiredBeforeAckTotal remains zero")
def then_the_before_ack_counter_stays_zero(session: Session) -> None:
    assert session.status_before is not None
    assert session.status is not None
    assert session.status_before["expiredBeforeAckTotal"] == session.status["expiredBeforeAckTotal"] == 0


# What the measurement scenario starts from: a database with a live log and a free list worth compacting.
POPULATED = StorageFacts(database_bytes=64 * MIB, wal_bytes=8 * MIB, freelist_bytes=16 * MIB)
MEASURED_EXPIRED = 130


@scenario(FEATURE, "Measure storage before and after retention")
def test_measure_storage_before_and_after_retention() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a representative event fixture has populated the database and WAL")
def given_a_populated_database_and_log(session: Session) -> None:
    session.world = world_with(*expired_events(MEASURED_EXPIRED, now=FIXED_NOW), *fresh_events(NEWER, now=FIXED_NOW))
    session.world.telemetry.facts = POPULATED


@when("maintenance checkpoints, prunes expired rows, and performs the planned compaction policy")
def when_maintenance_reclaims_space(session: Session) -> None:
    ran = run_cli(session.world, ["maintenance", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    session.maintenance = json.loads(ran.stdout)
    session.status = status_of(session.world)


@then("maintenance reports the database bytes before and after it and the largest footprint it measured")
def then_maintenance_reports_its_before_after_and_peak(session: Session) -> None:
    assert session.maintenance is not None
    world = session.world
    # A quarter of the file was free, so the policy rewrote it between two checkpoints of the log.
    assert world.telemetry.checkpoints == ["truncated", "truncated"]
    assert world.telemetry.compactions == ["compacted"]
    assert expired_held(world) == 0
    report = session.maintenance
    assert report["expiredEventCount"] == MEASURED_EXPIRED
    assert (report["databaseBytesBefore"], report["databaseBytesAfter"]) == (64 * MIB, 48 * MIB)
    assert (report["walBytesAfter"], report["freelistBytesAfter"]) == (0, 0)
    # The rewrite went through the log, so the run's peak is larger than either file was before or after it.
    assert report["highWaterBytes"] == 96 * MIB


@then("status reports the database, WAL, and free-list bytes on disk separately with their current total")
def then_status_reports_the_files_as_they_stand(session: Session) -> None:
    assert session.status is not None
    status, on_disk = session.status, session.world.telemetry.facts
    assert (status["databaseBytes"], status["walBytes"], status["freelistBytes"]) == (48 * MIB, 0, 0)
    assert (on_disk.database_bytes, on_disk.wal_bytes, on_disk.freelist_bytes) == (48 * MIB, 0, 0)
    assert status["highWaterBytes"] == 48 * MIB
    assert status["eventCount"] == NEWER
