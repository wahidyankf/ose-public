"""Unit bindings for the retention feature, in process with every OS dependency faked."""

import json
from dataclasses import dataclass, field, replace
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.domain.space import MIB, StorageFacts
from support.fakes import FIXED_NOW, FakeMonotonic, World
from support.invoke import Ran, run_cli, run_runtime
from support.populate import stamp, world_with
from support.results import value_of
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
    status_before: dict[str, Any] | None = None
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None


def event_ids(ran: Ran | None) -> list[str]:
    assert ran is not None
    assert (ran.code, ran.stderr) == (0, "")
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


def expired_held(world: World) -> int:
    """How many rows the fake store still holds whose retention has ended at the fixed moment."""
    return sum(value_of(held.expires_at) <= stamp(FIXED_NOW) for held in world.events.stored)


def status_of(world: World) -> dict[str, Any]:
    ran = run_cli(world, ["status", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    result: dict[str, Any] = json.loads(ran.stdout)
    return result


@pytest.fixture
def session() -> Session:
    return Session(world=world_with())


def rows_around_the_cutoff(session: Session) -> None:
    """Rows captured before and after the thirty-day cutoff, with the status taken before any operation runs."""
    exactly_at_the_cutoff, just_inside = edge_events(FIXED_NOW)
    newer = [just_inside, *fresh_events(NEWER, now=FIXED_NOW)]
    session.world = world_with(*expired_events(BEYOND_CUTOFF, now=FIXED_NOW), exactly_at_the_cutoff, *newer)
    session.at_the_cutoff = exactly_at_the_cutoff.event_id
    session.newer = {event.event_id for event in newer}
    # Maintenance completed a moment ago, so the read below is not the operation that prunes.
    session.world.telemetry.marker = stamp(FIXED_NOW)
    session.status_before = status_of(session.world)
    assert expired_held(session.world) == BEYOND_CUTOFF + 1


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: Events older than thirty days are never returned
@scenario(FEATURE, "Events older than thirty days are never returned")
def test_events_older_than_thirty_days_are_never_returned() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains rows captured before and after the thirty-day cutoff")
def given_rows_around_the_cutoff(session: Session) -> None:
    rows_around_the_cutoff(session)


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


@then("no row at or beyond the cutoff is returned by the read")
def then_no_expired_row_is_returned(session: Session) -> None:
    listed = event_ids(session.read)
    assert session.at_the_cutoff not in listed
    assert set(listed) == session.newer
    assert session.read is not None
    assert all(item["capturedAt"] > cutoff_stamp(FIXED_NOW) for item in json.loads(session.read.stdout)["items"])


@then("every newer row remains queryable")
def then_every_newer_row_remains_queryable(session: Session) -> None:
    for operation in session.operations:
        assert set(event_ids(operation)) == session.newer
    assert session.newer <= {held.event_id for held in session.world.events.stored}


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: status reports how many events expired
@scenario(FEATURE, "status reports how many events expired")
def test_status_reports_how_many_events_expired() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@then("status reports as many locally expired events as the operations pruned")
def then_the_local_counter_matches_what_was_pruned(session: Session) -> None:
    assert session.status_before is not None
    session.status = status_of(session.world)
    assert session.status_before["expiredLocalTotal"] == 0
    assert sum(session.removed) > 0
    assert session.status["expiredLocalTotal"] == sum(session.removed)


# What the measurement scenarios start from: a database with a live log and a free list worth compacting.
POPULATED = StorageFacts(database_bytes=64 * MIB, wal_bytes=8 * MIB, freelist_bytes=16 * MIB)
MEASURED_EXPIRED = 130


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


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: maintenance reports database bytes before and after and the largest footprint
@scenario(FEATURE, "maintenance reports database bytes before and after and the largest footprint")
def test_maintenance_reports_database_bytes_before_and_after_and_the_largest_footprint() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


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


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: status reports database, WAL, and free-list bytes with a total
@scenario(FEATURE, "status reports database, WAL, and free-list bytes with a total")
def test_status_reports_database_wal_and_free_list_bytes_with_a_total() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@then("status reports the database, WAL, and free-list bytes on disk separately with their current total")
def then_status_reports_the_files_as_they_stand(session: Session) -> None:
    assert session.status is not None
    status, on_disk = session.status, session.world.telemetry.facts
    assert (status["databaseBytes"], status["walBytes"], status["freelistBytes"]) == (48 * MIB, 0, 0)
    assert (on_disk.database_bytes, on_disk.wal_bytes, on_disk.freelist_bytes) == (48 * MIB, 0, 0)
    assert status["highWaterBytes"] == 48 * MIB
    assert status["eventCount"] == NEWER


# @scenario specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature: maintenance --if-due does nothing unless maintenance is due
@scenario(FEATURE, "maintenance --if-due does nothing unless maintenance is due")
def test_maintenance_if_due_does_nothing_unless_maintenance_is_due() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the database holds expired events and maintenance {state}"))
def given_expired_events_and_maintenance_state(session: Session, state: str) -> None:
    session.world = world_with(*expired_events(BEYOND_CUTOFF, now=FIXED_NOW), *fresh_events(NEWER, now=FIXED_NOW))
    if state == "ran a moment ago":
        session.world.telemetry.marker = stamp(FIXED_NOW)
    else:
        assert state == "has never run"
    assert expired_held(session.world) == BEYOND_CUTOFF


@when("the user runs maintenance with --if-due")
def when_maintenance_runs_if_due(session: Session) -> None:
    ran = run_cli(session.world, ["maintenance", "--if-due", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    session.maintenance = json.loads(ran.stdout)


@then(parsers.parse("the expired events are {pruned}"))
def then_the_expired_events_are(session: Session, pruned: str) -> None:
    held = expired_held(session.world)
    if pruned == "pruned":
        assert held == 0
    else:
        assert pruned == "left in place"
        assert held == BEYOND_CUTOFF
