"""Unit bindings for the retention feature, in process with every OS dependency faked.

The scenario names ``status`` for the counters; that command lands with the maintenance packet, so until then these
steps read the same two counters from the port that ``status`` will report.
"""

import json
from dataclasses import dataclass
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.domain.retention import PRUNE_ROW_LIMIT
from ferret.domain.space import KIB, MIB, StorageFacts, size_report
from support.fakes import FIXED_NOW, World
from support.invoke import Ran, run_cli
from support.populate import stamp, world_with
from support.retention import cutoff_stamp, edge_events, expired_events, fresh_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/retention-and-space.feature"
BEYOND_CUTOFF = 130
NEWER = 5
LIST_ALL = ["events", "list", "--all-time", "--limit", "200", "--json"]


@dataclass(slots=True)
class Session:
    """The fake machine and what the read and the next operation wrote."""

    world: World
    read: Ran | None = None
    next_operation: Ran | None = None
    maintenance: dict[str, Any] | None = None
    status: dict[str, Any] | None = None


def event_ids(ran: Ran | None) -> list[str]:
    assert ran is not None
    return [item["eventId"] for item in json.loads(ran.stdout)["items"]]


@pytest.fixture
def session() -> Session:
    return Session(world=world_with())


@scenario(FEATURE, "Hide then prune every expired usage-derived record")
def test_hide_then_prune_every_expired_usage_derived_record() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains rows captured before and after the thirty-day cutoff")
def given_rows_around_the_cutoff(session: Session) -> None:
    exactly_at_the_cutoff, just_inside = edge_events(FIXED_NOW)
    session.world = world_with(
        *expired_events(BEYOND_CUTOFF, now=FIXED_NOW),
        exactly_at_the_cutoff,
        just_inside,
        *fresh_events(NEWER, now=FIXED_NOW),
    )
    session.world.telemetry.marker = stamp(FIXED_NOW)


@when("a read runs before physical pruning and then the next FERRET operation runs with a fixed clock")
def when_a_read_then_the_next_operation_runs(session: Session) -> None:
    world = session.world
    session.read = run_cli(world, LIST_ALL)
    assert world.telemetry.prunes == []
    world.telemetry.marker = None
    session.next_operation = run_cli(world, LIST_ALL)


@then("no row at or beyond the cutoff is returned by the read")
def then_no_expired_row_is_returned(session: Session) -> None:
    assert session.read is not None
    items = json.loads(session.read.stdout)["items"]
    assert items
    assert all(item["capturedAt"] > cutoff_stamp(FIXED_NOW) for item in items)


@then("the next operation stops physical pruning at the first of 100 rows or 100 monotonic milliseconds")
def then_the_prune_stops_at_its_first_limit(session: Session) -> None:
    world = session.world
    [batch] = world.telemetry.prunes
    still_expired = [held for held in world.events.stored if held.expires_at <= stamp(FIXED_NOW)]
    assert (batch.events, batch.remaining) == (PRUNE_ROW_LIMIT, True)
    assert len(still_expired) == BEYOND_CUTOFF + 1 - PRUNE_ROW_LIMIT


@then("every newer row remains queryable")
def then_every_newer_row_remains_queryable(session: Session) -> None:
    newer = {held.event_id for held in session.world.events.stored if held.expires_at > stamp(FIXED_NOW)}
    assert len(newer) == NEWER + 1
    assert set(event_ids(session.next_operation)) == newer
    assert set(event_ids(session.read)) == newer


@then("status increments expiredLocalTotal for locally expired rows")
def then_the_local_counter_grows_by_what_was_pruned(session: Session) -> None:
    assert session.world.telemetry.expiry_counters().local_total == PRUNE_ROW_LIMIT


@then("expiredBeforeAckTotal remains zero")
def then_the_before_ack_counter_stays_zero(session: Session) -> None:
    assert session.world.telemetry.expiry_counters().before_ack_total == 0


# What the measurement scenario starts from: a database with a live log and a free list worth compacting.
POPULATED = StorageFacts(database_bytes=64 * MIB, wal_bytes=8 * MIB, freelist_bytes=16 * MIB)
INDEX_BYTES = 20 * MIB


@scenario(FEATURE, "Measure storage before and after retention")
def test_measure_storage_before_and_after_retention() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a representative event fixture has populated the database and WAL")
def given_a_populated_database_and_log(session: Session) -> None:
    session.world = world_with(*expired_events(BEYOND_CUTOFF, now=FIXED_NOW), *fresh_events(NEWER, now=FIXED_NOW))
    session.world.telemetry.facts = POPULATED


@when("maintenance checkpoints, prunes expired rows, and performs the planned compaction policy")
def when_maintenance_reclaims_space(session: Session) -> None:
    ran = run_cli(session.world, ["maintenance", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    session.maintenance = json.loads(ran.stdout)
    session.status = json.loads(run_cli(session.world, ["status", "--json"]).stdout)


@then("status reports database, WAL, and total high-water bytes separately")
def then_status_reports_the_three_figures_separately(session: Session) -> None:
    assert session.maintenance is not None
    assert session.status is not None
    world = session.world
    assert world.telemetry.checkpoints == ["truncated", "truncated"]
    assert world.telemetry.compactions == ["compacted"]
    status = session.status
    assert (status["databaseBytes"], status["walBytes"], status["freelistBytes"]) == (48 * MIB, 0, 0)
    assert status["highWaterBytes"] == status["databaseBytes"] + status["walBytes"]
    # The rewrite went through the log, so the run's peak is larger than either file was before or after it.
    report = session.maintenance
    assert (report["databaseBytesBefore"], report["databaseBytesAfter"], report["walBytesAfter"]) == (
        64 * MIB,
        48 * MIB,
        0,
    )
    assert report["highWaterBytes"] == 96 * MIB


@then("the benchmark reports bytes per event and index share")
def then_the_benchmark_reports_bytes_per_event_and_index_share(session: Session) -> None:
    assert session.status is not None
    events = session.status["eventCount"]
    report = size_report(events=events, database_bytes=session.status["databaseBytes"], index_bytes=INDEX_BYTES)

    assert events == NEWER
    assert report.bytes_per_event == session.status["databaseBytes"] / events
    assert report.index_share == INDEX_BYTES / session.status["databaseBytes"]


@then("a size outside the planning envelope fails the storage acceptance gate pending explanation")
def then_an_outside_size_fails_the_gate_until_explained(session: Session) -> None:
    oversized = size_report(events=1000, database_bytes=3 * KIB * 1000, index_bytes=0)
    explained = size_report(
        events=1000, database_bytes=3 * KIB * 1000, index_bytes=0, explanation="fixed page overhead dominates"
    )

    assert (oversized.acceptance, oversized.passes) == ("unexplained", False)
    assert (explained.acceptance, explained.passes) == ("explained", True)
