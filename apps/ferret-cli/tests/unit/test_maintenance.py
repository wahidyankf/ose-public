"""Logical expiry on every read, and the bounded prune the next operation attempts when maintenance is due."""

import json
from dataclasses import replace
from datetime import timedelta

import pytest

from ferret.application.capabilities import record_snapshot
from ferret.application.maintenance import prune_due
from ferret.application.ports import Budget, ExpiryCounters, PruneResult
from ferret.domain.errors import FerretError
from ferret.domain.retention import MAINTENANCE_INTERVAL, PRUNE_BUDGET_MS, PRUNE_ROW_LIMIT, is_due
from ferret.domain.storage import MAINTENANCE_INTERVAL_SECONDS
from support.events import encode, event_document
from support.fakes import FIXED_NOW, FakeMonotonic
from support.invoke import run_cli
from support.populate import WORKSPACE_A, WORKSPACE_B, numbers, stamp, world_with
from support.retention import CUTOFF, aged_snapshot, edge_events, expired_events, fresh_events
from support.snapshots import snapshot_document

NOW = FIXED_NOW
READS = {
    "events list": ["events", "list", "--all-time"],
    "events export": ["events", "export", "--format", "jsonl", "--all-time"],
    "usage": ["usage", "--group-by", "harness", "--all-time"],
    "outcomes": ["outcomes", "--group-by", "harness", "--all-time"],
}


def test_the_plan_fixes_the_row_limit_the_time_budget_and_the_interval() -> None:
    assert PRUNE_ROW_LIMIT == 100
    assert PRUNE_BUDGET_MS == 100
    assert MAINTENANCE_INTERVAL.total_seconds() == MAINTENANCE_INTERVAL_SECONDS
    assert MAINTENANCE_INTERVAL.total_seconds() == 60 * 60


@pytest.mark.parametrize(
    ("marker", "due"),
    [
        pytest.param(None, True, id="never-completed"),
        pytest.param(stamp(NOW), False, id="just-completed"),
        pytest.param(stamp(NOW - MAINTENANCE_INTERVAL + timedelta(milliseconds=1)), False, id="a-millisecond-short"),
        pytest.param(stamp(NOW - MAINTENANCE_INTERVAL), True, id="exactly-the-interval"),
        pytest.param(stamp(NOW - timedelta(days=9)), True, id="long-ago"),
        pytest.param(stamp(NOW + timedelta(milliseconds=1)), True, id="ahead-of-now-is-a-clock-jump"),
        pytest.param("yesterday", True, id="an-unreadable-marker-is-not-trusted"),
    ],
)
def test_maintenance_is_due_once_the_interval_has_passed_since_the_last_completion(
    marker: str | None, due: bool
) -> None:
    assert is_due(marker, NOW) is due


def test_a_budget_reads_the_monotonic_clock_once_per_question() -> None:
    clock = FakeMonotonic()
    budget = Budget.start(clock, 100)
    clock.advance(40)

    assert (budget.elapsed_ms(), budget.remaining_ms(), budget.spent()) == (40, 60, False)

    clock.advance(60)
    assert (budget.remaining_ms(), budget.spent()) == (0, True)
    clock.advance(500)
    assert budget.remaining_ms() == 0
    assert clock.readings == 7


def test_a_row_expiring_exactly_now_is_hidden_from_every_read_path_before_any_prune() -> None:
    hidden, visible = edge_events(NOW)
    old_snapshot = aged_snapshot(1, now=NOW, ago=CUTOFF)
    new_snapshot = aged_snapshot(2, now=NOW, ago=CUTOFF - timedelta(milliseconds=1))
    world = world_with(hidden, visible, *expired_events(3, now=NOW))
    world.capabilities.stored.extend([old_snapshot, new_snapshot])
    world.telemetry.marker = stamp(NOW)

    listed = json.loads(run_cli(world, [*READS["events list"], "--json"]).stdout)["items"]
    exported = run_cli(world, READS["events export"]).stdout.splitlines()
    usage = json.loads(run_cli(world, [*READS["usage"], "--json"]).stdout)["rows"]
    outcomes = json.loads(run_cli(world, [*READS["outcomes"], "--json"]).stdout)["rows"]

    assert [item["eventId"] for item in listed] == [visible.event_id]
    assert [json.loads(line)["eventId"] for line in exported] == [visible.event_id]
    assert [row["eventCount"] for row in usage] == [1]
    assert [row["eventCount"] for row in outcomes] == [1]
    assert world.events.find(hidden.event_id, now=NOW) is None
    assert world.events.find(visible.event_id, now=NOW) == visible
    assert world.capabilities.latest_snapshot("codex", now=NOW) == new_snapshot
    assert world.capabilities.latest_snapshot("codex", now=NOW + timedelta(milliseconds=1)) is None
    assert world.telemetry.prunes == []
    assert len(world.events.stored) == 5


def test_nothing_is_attempted_while_maintenance_is_not_due() -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.telemetry.marker = stamp(NOW - timedelta(minutes=59))

    assert prune_due(world.runtime) is None
    assert (world.telemetry.prunes, len(world.events.stored)) == ([], 3)


def test_a_due_prune_over_an_empty_store_completes_and_advances_the_marker() -> None:
    world = world_with()

    result = prune_due(world.runtime)

    assert result == PruneResult("pruned", completed=True)
    assert world.telemetry.marker == stamp(NOW)
    assert prune_due(world.runtime) is None


def test_each_due_prune_takes_one_bounded_batch_and_only_an_empty_one_advances_the_marker() -> None:
    world = world_with(*expired_events(250, now=NOW), *fresh_events(4, now=NOW))

    batches = [prune_due(world.runtime) for _ in range(4)]

    assert batches == [
        PruneResult("pruned", events=100, workspaces=0, remaining=True),
        PruneResult("pruned", events=100, workspaces=0, remaining=True),
        PruneResult("pruned", events=50, workspaces=0, remaining=False),
        PruneResult("pruned", completed=True),
    ]
    assert world.telemetry.marker == stamp(NOW)
    assert numbers(tuple(world.events.stored)) == [1001, 1002, 1003, 1004]
    assert world.telemetry.expiry_counters() == ExpiryCounters(local_total=250, before_ack_total=0)


def test_a_partial_batch_leaves_the_marker_unchanged_so_the_next_operation_continues() -> None:
    world = world_with(*expired_events(101, now=NOW))

    first = prune_due(world.runtime)

    assert first is not None
    assert first.remaining
    assert world.telemetry.marker is None
    assert numbers(tuple(world.events.stored)) == [101]


def test_the_prune_stops_when_the_monotonic_budget_is_spent_before_the_row_limit() -> None:
    world = world_with(*expired_events(20, now=NOW))
    runtime = replace(world.runtime, monotonic=FakeMonotonic(step_ms=30))

    result = prune_due(runtime)

    # Each reading is 30 ms later: the budget starts at 30, the lock question reads 60, and the checks before rows read
    # 90 and 120 (both inside the budget) and then 150, which is 120 ms in.
    assert result == PruneResult("pruned", events=2, remaining=True)
    assert numbers(tuple(world.events.stored)) == list(range(3, 21))
    assert world.telemetry.marker is None


def test_the_row_limit_counts_events_and_snapshots_together_with_events_first() -> None:
    world = world_with(*expired_events(60, now=NOW))
    world.capabilities.stored.extend(aged_snapshot(number, now=NOW, ago=timedelta(days=31)) for number in range(60))

    result = prune_due(world.runtime)

    assert result == PruneResult("pruned", events=60, snapshots=40, workspaces=1, remaining=True)
    assert (len(world.events.stored), len(world.capabilities.stored)) == (0, 20)
    assert world.telemetry.expiry_counters() == ExpiryCounters(local_total=100, before_ack_total=0)


def test_ties_in_expiry_are_broken_by_event_id() -> None:
    world = world_with(*reversed(expired_events(150, now=NOW, tied=True)))

    prune_due(world.runtime)

    assert sorted(numbers(tuple(world.events.stored))) == list(range(101, 151))


@pytest.mark.parametrize(
    ("also_retained", "orphans"),
    [
        pytest.param(None, 1, id="its-last-event-expired"),
        pytest.param(WORKSPACE_B, 0, id="a-retained-event-remains"),
    ],
)
def test_a_workspace_that_loses_its_last_retained_event_is_reported_as_removed(
    also_retained: str | None, orphans: int
) -> None:
    world = world_with(
        *expired_events(2, now=NOW, workspaceId=WORKSPACE_B), *fresh_events(1, now=NOW, workspaceId=WORKSPACE_A)
    )
    if also_retained is not None:
        world.events.stored.extend(fresh_events(1, now=NOW, first=1500, workspaceId=also_retained))

    result = prune_due(world.runtime)

    assert result is not None
    assert result.workspaces == orphans


def test_the_counters_only_move_by_what_a_prune_deleted_and_never_reclassify_history() -> None:
    world = world_with(*expired_events(7, now=NOW))
    world.telemetry.local_total = 7

    prune_due(world.runtime)
    assert world.telemetry.expiry_counters() == ExpiryCounters(local_total=14, before_ack_total=0)

    world.telemetry.marker = None
    prune_due(world.runtime)
    assert world.telemetry.expiry_counters() == ExpiryCounters(local_total=14, before_ack_total=0)


def test_a_prune_that_cannot_take_the_lock_is_skipped_and_the_operation_still_succeeds() -> None:
    world = world_with(*expired_events(3, now=NOW, first=101))
    world.telemetry.lock_held = True
    world.input.data = encode(event_document())

    ran = run_cli(world, ["capture", "--json"])

    assert ran.code == 0
    assert world.telemetry.prunes == [PruneResult("skipped")]
    assert (world.telemetry.marker, world.telemetry.expiry_counters()) == (None, ExpiryCounters(0, 0))
    assert len(world.events.stored) == 4


@pytest.mark.parametrize(
    "failure",
    [FerretError("storage_unavailable", retryable=True), FerretError("integrity_failure")],
    ids=["unavailable", "integrity"],
)
def test_a_prune_failure_never_reaches_the_operation(failure: FerretError) -> None:
    world = world_with()
    world.telemetry.broken = failure

    ran = run_cli(world, [*READS["events list"], "--json"])

    assert (ran.code, json.loads(ran.stdout)["items"]) == (0, [])


@pytest.mark.parametrize("operation", [*READS, "capture"])
def test_every_operation_attempts_the_prune_when_maintenance_is_due(operation: str) -> None:
    world = world_with(*expired_events(5, now=NOW, first=101))
    if operation == "capture":
        world.input.data = encode(event_document())
        argv = ["capture", "--json"]
    else:
        argv = READS[operation]

    ran = run_cli(world, argv)

    assert ran.code == 0
    assert [result.events for result in world.telemetry.prunes] == [5]
    assert not any(101 <= number <= 105 for number in numbers(tuple(world.events.stored)))


def test_recording_a_capability_snapshot_also_attempts_the_prune() -> None:
    world = world_with()
    world.capabilities.stored.append(aged_snapshot(1, now=NOW, ago=timedelta(days=31)))

    record_snapshot(world.runtime, snapshot_document())

    assert [result.snapshots for result in world.telemetry.prunes] == [1]


def test_a_refused_request_never_reaches_storage_or_the_prune() -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.files.touched.clear()

    refused = run_cli(world, ["events", "list", "--harness", "Bad"])

    assert refused.code == 2
    assert (world.files.touched, world.telemetry.prunes) == ([], [])


@pytest.mark.parametrize("operation", ["events list", "usage"])
def test_an_uninitialized_store_is_refused_before_any_prune(operation: str) -> None:
    world = world_with(initialized=False)

    ran = run_cli(world, READS[operation])

    assert ran.code == 3
    assert world.telemetry.prunes == []
