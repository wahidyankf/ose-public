"""Retention against real SQLite: reads hide expiry first; the prune is bounded, atomic, and counted exactly once."""

import hashlib
import sqlite3
import subprocess
import sys
from dataclasses import replace
from datetime import timedelta
from pathlib import Path

import pytest

from ferret.adapters.sqlite_schema import WRITE_LOCK_BUDGET_MS, SQLiteSchema
from ferret.application.maintenance import prune_due
from ferret.application.ports import Budget, ExpiryCounters, PruneResult
from ferret.domain.query import criteria_from_options
from ferret.domain.retention import PRUNE_BUDGET_MS, PRUNE_ROW_LIMIT
from support.burst import integrity_check
from support.busy import PLANNED_ATTEMPT_TIMEOUT_MS, PLANNED_BUSY_TIMEOUT_MS, record_busy_timeouts
from support.fakes import FIXED_NOW, FakeMonotonic, FixedClock, SimulatedCrash, make_world
from support.machine import Machine, make_machine
from support.populate import WORKSPACE_A, WORKSPACE_B, numbers, stamp
from support.retention import CUTOFF, aged_snapshot, edge_events, expired_events, fresh_events
from support.vacuum import interrupt_every_vacuum

NOW = FIXED_NOW
EVERYTHING = criteria_from_options({"--all-time": ()}, now=NOW)
SOURCE = Path(__file__).resolve().parents[2] / "src"


def new_machine(root: Path, *, step_ms: int = 0) -> Machine:
    return make_machine(root, clock=FixedClock(NOW), monotonic=FakeMonotonic(step_ms))


@pytest.fixture
def machine(tmp_path: Path) -> Machine:
    return new_machine(tmp_path)


def event_numbers(machine: Machine) -> list[int]:
    return [int(row[0][-12:]) for row in machine.sql("SELECT event_id FROM event ORDER BY event_id")]


def counters(machine: Machine) -> ExpiryCounters:
    values = dict(machine.sql("SELECT name, value FROM operational_counter"))
    return ExpiryCounters(values["expired_local_total"], values["expired_before_ack_total"])


def marker(machine: Machine) -> str | None:
    return machine.sql("SELECT last_completed_at FROM maintenance_state WHERE singleton_id = 1")[0][0]


def store_snapshots(machine: Machine, count: int, *, ago: timedelta = timedelta(days=31)) -> None:
    repository = machine.runtime().capabilities
    for number in range(count):
        repository.store_snapshot(aged_snapshot(number, now=NOW, ago=ago))


def prune(machine: Machine) -> PruneResult | None:
    return prune_due(machine.runtime())


def test_reads_hide_a_row_expiring_exactly_now_before_any_prune(machine: Machine) -> None:
    hidden, visible = edge_events(NOW)
    machine.fill([hidden, visible, *expired_events(3, now=NOW)])
    machine.runtime().capabilities.store_snapshot(aged_snapshot(1, now=NOW, ago=CUTOFF))
    newest = aged_snapshot(2, now=NOW, ago=CUTOFF - timedelta(milliseconds=1))
    machine.runtime().capabilities.store_snapshot(newest)
    machine.set_marker(stamp(NOW))
    runtime = machine.runtime()

    listed = runtime.events.read(EVERYTHING, now=NOW, newest_first=True, after=None, limit=200)

    assert listed == (visible,)
    assert runtime.events.find(hidden.event_id, now=NOW) is None
    assert runtime.events.find(visible.event_id, now=NOW) == visible
    assert runtime.capabilities.latest_snapshot("codex", now=NOW) == newest
    assert runtime.capabilities.latest_snapshot("codex", now=NOW + timedelta(milliseconds=1)) is None
    assert machine.sql("SELECT count(*) FROM event") == [(5,)]
    assert machine.run(["events", "list", "--all-time", "--json"]).stdout.count('"eventId"') == 1


def test_the_prune_deletes_in_expiry_order_a_batch_at_a_time_and_only_an_empty_batch_completes(
    machine: Machine,
) -> None:
    machine.fill([*expired_events(250, now=NOW), *fresh_events(4, now=NOW)])

    batches = [prune(machine) for _ in range(3)]

    assert batches == [
        PruneResult("pruned", events=100, remaining=True),
        PruneResult("pruned", events=100, remaining=True),
        PruneResult("pruned", events=50),
    ]
    assert (marker(machine), counters(machine)) == (None, ExpiryCounters(250, 0))
    assert event_numbers(machine) == [1001, 1002, 1003, 1004]

    assert prune(machine) == PruneResult("pruned", completed=True)
    assert marker(machine) == stamp(NOW)
    assert machine.sql("SELECT last_started_at, last_result FROM maintenance_state") == [(stamp(NOW), "completed")]
    assert counters(machine) == ExpiryCounters(250, 0)
    assert prune(machine) is None


def test_ties_in_expiry_are_broken_by_event_id(machine: Machine) -> None:
    machine.fill(reversed(expired_events(150, now=NOW, tied=True)))

    prune(machine)

    assert event_numbers(machine) == list(range(101, 151))


def test_the_row_limit_is_shared_by_events_and_snapshots_and_snapshot_items_go_with_them(machine: Machine) -> None:
    machine.fill(expired_events(60, now=NOW))
    store_snapshots(machine, 60)

    result = prune(machine)

    assert result == PruneResult("pruned", events=60, snapshots=40, workspaces=1, remaining=True)
    assert machine.sql("SELECT count(*) FROM event") == [(0,)]
    assert machine.sql("SELECT count(*) FROM capability_snapshot") == [(20,)]
    assert machine.sql("SELECT count(*) FROM capability_item") == [(40,)]
    assert counters(machine) == ExpiryCounters(100, 0)


@pytest.mark.parametrize(
    ("retained_in_b", "workspaces_left", "orphans"),
    [
        pytest.param(False, [WORKSPACE_A], 1, id="its-last-event-expired"),
        pytest.param(True, [WORKSPACE_A, WORKSPACE_B], 0, id="a-retained-event-remains"),
    ],
)
def test_a_workspace_is_removed_with_its_last_retained_event(
    machine: Machine, retained_in_b: bool, workspaces_left: list[str], orphans: int
) -> None:
    machine.fill(
        [*expired_events(2, now=NOW, workspaceId=WORKSPACE_B), *fresh_events(1, now=NOW, workspaceId=WORKSPACE_A)]
    )
    if retained_in_b:
        machine.fill(fresh_events(1, now=NOW, first=1500, workspaceId=WORKSPACE_B))

    result = prune(machine)

    assert result is not None
    assert result.workspaces == orphans
    assert [
        row[0] for row in machine.sql("SELECT workspace_id FROM workspace ORDER BY workspace_id")
    ] == workspaces_left
    assert counters(machine).local_total == 2


def test_the_budget_stops_the_prune_between_rows_and_commits_what_was_deleted(tmp_path: Path) -> None:
    machine = new_machine(tmp_path, step_ms=30)
    machine.fill(expired_events(20, now=NOW))

    result = prune(machine)

    assert result == PruneResult("pruned", events=2, remaining=True)
    assert event_numbers(machine) == list(range(3, 21))
    assert (marker(machine), counters(machine)) == (None, ExpiryCounters(2, 0))


def test_a_prune_that_cannot_take_the_lock_skips_and_changes_nothing_within_its_own_budget(
    machine: Machine, monkeypatch: pytest.MonkeyPatch
) -> None:
    machine.fill(expired_events(3, now=NOW))
    budgets = record_busy_timeouts(monkeypatch)
    holder = sqlite3.connect(machine.database, autocommit=True)
    holder.execute("BEGIN IMMEDIATE")
    try:
        result = prune(machine)
    finally:
        holder.execute("ROLLBACK")
        holder.close()

    assert result == PruneResult("skipped")
    # The prune's attempts use the short attempt timeout; its own budget bounds the acquisition instead. The
    # reading that decides whether a prune is due keeps the ordinary timeout, because a reader never contends.
    assert PLANNED_ATTEMPT_TIMEOUT_MS in budgets
    assert set(budgets) <= {PLANNED_ATTEMPT_TIMEOUT_MS, PLANNED_BUSY_TIMEOUT_MS}
    assert (event_numbers(machine), marker(machine), counters(machine)) == ([1, 2, 3], None, ExpiryCounters(0, 0))
    assert PRUNE_BUDGET_MS + WRITE_LOCK_BUDGET_MS < 1000 + PRUNE_BUDGET_MS


def test_a_failure_inside_the_transaction_rolls_back_the_rows_and_the_counter(machine: Machine) -> None:
    machine.fill(expired_events(10, now=NOW))

    class Crashing(FakeMonotonic):
        def now_ns(self) -> int:
            if self.readings >= 4:
                raise SimulatedCrash
            return super().now_ns()

    budget = Budget.start(Crashing(), PRUNE_BUDGET_MS)
    with pytest.raises(SimulatedCrash):
        machine.runtime().telemetry.prune_batch(now=NOW, limit=PRUNE_ROW_LIMIT, budget=budget)

    assert (event_numbers(machine), marker(machine), counters(machine)) == (
        list(range(1, 11)),
        None,
        ExpiryCounters(0, 0),
    )


CHILD = """
import os, sys
sys.path.insert(0, sys.argv[3])
from datetime import UTC, datetime
from ferret.adapters.system import system_runtime
from ferret.application.ports import Budget

class Steady:
    def __init__(self, dies_at):
        self.readings, self.dies_at = 0, dies_at
    def now_ns(self):
        self.readings += 1
        if self.readings == self.dies_at:
            os._exit(9)
        return 0

runtime = system_runtime({"HOME": sys.argv[1]})
budget = Budget.start(Steady(int(sys.argv[2])), 100)
runtime.telemetry.prune_batch(now=datetime(2026, 9, 18, 8, 0, tzinfo=UTC), limit=100, budget=budget)
os._exit(9)
"""


def crash_a_prune(machine: Machine, *, dies_at_reading: int) -> None:
    """Run a prune in another process that is killed abruptly, at the given clock reading or after its commit."""
    arguments = [sys.executable, "-c", CHILD, str(machine.home), str(dies_at_reading), str(SOURCE)]
    child = subprocess.run(arguments, check=False)
    assert child.returncode == 9


def test_a_prune_killed_after_a_partial_commit_resumes_and_counts_every_row_exactly_once(machine: Machine) -> None:
    machine.fill(expired_events(150, now=NOW))

    crash_a_prune(machine, dies_at_reading=10**9)

    assert (len(event_numbers(machine)), marker(machine), counters(machine)) == (50, None, ExpiryCounters(100, 0))
    assert [prune(machine), prune(machine)] == [
        PruneResult("pruned", events=50, workspaces=1),
        PruneResult("pruned", completed=True),
    ]
    assert (event_numbers(machine), marker(machine), counters(machine)) == ([], stamp(NOW), ExpiryCounters(150, 0))


def test_a_prune_killed_before_its_commit_leaves_the_rows_and_the_counter_untouched(machine: Machine) -> None:
    machine.fill(expired_events(150, now=NOW))

    crash_a_prune(machine, dies_at_reading=5)

    assert (len(event_numbers(machine)), marker(machine), counters(machine)) == (150, None, ExpiryCounters(0, 0))


def test_counters_keep_their_history_across_a_migration_pass_and_never_reclassify_local_expiry(
    machine: Machine,
) -> None:
    machine.write_sql("UPDATE operational_counter SET value = 7 WHERE name = 'expired_local_total'")
    machine.fill(expired_events(3, now=NOW))

    SQLiteSchema(machine.database, FixedClock(NOW)).migrate()
    assert counters(machine) == ExpiryCounters(7, 0)

    prune(machine)
    assert counters(machine) == ExpiryCounters(10, 0)


def test_maintenance_state_stays_one_row_that_keeps_only_the_latest_completion(tmp_path: Path) -> None:
    clock = FixedClock(NOW)
    machine = make_machine(tmp_path, clock=clock, monotonic=FakeMonotonic())

    prune(machine)
    first = marker(machine)
    clock.advance(timedelta(hours=25))
    prune(machine)

    assert first == stamp(NOW)
    assert marker(machine) == stamp(NOW + timedelta(hours=25))
    assert machine.sql("SELECT count(*) FROM maintenance_state") == [(1,)]


@pytest.mark.parametrize(
    "argv",
    [
        ["events", "list", "--all-time", "--json"],
        ["events", "export", "--format", "jsonl", "--all-time"],
        ["usage", "--group-by", "harness", "--all-time", "--json"],
        ["outcomes", "--group-by", "harness", "--all-time", "--json"],
    ],
    ids=["events-list", "events-export", "usage", "outcomes"],
)
def test_every_operation_of_the_real_store_prunes_first_when_maintenance_is_due(
    machine: Machine, argv: list[str]
) -> None:
    machine.fill([*expired_events(5, now=NOW), *fresh_events(2, now=NOW)])

    ran = machine.run(argv)

    assert ran.code == 0
    assert event_numbers(machine) == [1001, 1002]
    assert counters(machine) == ExpiryCounters(5, 0)


@pytest.mark.parametrize(
    ("events", "snapshots", "tied", "step"),
    [
        pytest.param(250, 0, False, 0, id="events-only"),
        pytest.param(60, 60, False, 0, id="events-and-snapshots"),
        pytest.param(150, 0, True, 0, id="tied-expiry"),
        pytest.param(20, 5, False, 30, id="budget-spent-first"),
    ],
)
def test_the_fake_and_the_real_prune_agree_batch_for_batch(
    tmp_path: Path, events: int, snapshots: int, tied: bool, step: int
) -> None:
    machine = new_machine(tmp_path, step_ms=step)
    world = make_world()
    seed = [*expired_events(events, now=NOW, tied=tied), *fresh_events(3, now=NOW)]
    aged = [aged_snapshot(number, now=NOW, ago=timedelta(days=31)) for number in range(snapshots)]
    machine.fill(seed)
    for snapshot in aged:
        machine.runtime().capabilities.store_snapshot(snapshot)
    world.events.stored.extend(seed)
    world.capabilities.stored.extend(aged)
    fake_runtime = replace(world.runtime, monotonic=FakeMonotonic(step))

    real = [prune(machine) for _ in range(6)]
    fake = [prune_due(fake_runtime) for _ in range(6)]

    assert real == fake
    assert event_numbers(machine) == numbers(tuple(world.events.stored))
    assert counters(machine) == world.telemetry.expiry_counters()
    assert marker(machine) == world.telemetry.marker


def test_failed_compaction_preserves_readable_original(machine: Machine, monkeypatch: pytest.MonkeyPatch) -> None:
    machine.fill([*expired_events(120, now=NOW), *fresh_events(60, now=NOW)])
    machine.run(["maintenance", "--json"])
    export = ["events", "export", "--format", "jsonl", "--all-time"]
    readable_before = machine.run(export).stdout
    file_before = hashlib.sha256(machine.database.read_bytes()).hexdigest()
    free_pages = machine.sql("PRAGMA freelist_count")

    interrupt_every_vacuum(monkeypatch)
    compaction = machine.runtime().telemetry.compact()
    monkeypatch.undo()

    assert compaction.outcome == "failed"
    assert readable_before.count("\n") == 60
    assert machine.run(export).stdout == readable_before
    assert hashlib.sha256(machine.database.read_bytes()).hexdigest() == file_before
    assert machine.sql("PRAGMA freelist_count") == free_pages
    assert integrity_check(machine.database) == [("ok",)]
