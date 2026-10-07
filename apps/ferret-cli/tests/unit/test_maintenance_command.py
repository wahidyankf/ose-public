"""Explicit ``maintenance``: prune to exhaustion in bounded batches, checkpoint safely, compact by policy, measure."""

import json
from datetime import timedelta
from typing import Any

import pytest

from ferret.application.maintenance import (
    Reclamation,
    measure_storage,
    prune_to_exhaustion,
    reclaim_space,
    run_maintenance,
)
from ferret.application.ports import ExpiryCounters
from ferret.domain.errors import FerretError
from ferret.domain.retention import MAINTENANCE_INTERVAL
from ferret.domain.space import MIB, StorageFacts
from support.fakes import FIXED_NOW, World
from support.invoke import run_cli
from support.populate import WORKSPACE_A, WORKSPACE_B, numbers, stamp, world_with
from support.results import refusal_of, value_of
from support.retention import EXPIRED, aged_snapshot, expired_events, fresh_events

NOW = FIXED_NOW
SMALL = StorageFacts(database_bytes=131072, wal_bytes=65536, freelist_bytes=4096)
WORTH_COMPACTING = StorageFacts(database_bytes=64 * MIB, wal_bytes=0, freelist_bytes=16 * MIB)


def maintain(world: World, *flags: str) -> dict[str, Any]:
    ran = run_cli(world, ["maintenance", "--json", *flags])
    assert (ran.code, ran.stderr) == (0, "")
    return json.loads(ran.stdout)


def failure_of(world: World, *flags: str) -> tuple[int, dict[str, Any]]:
    ran = run_cli(world, ["maintenance", "--json", *flags])
    assert ran.stdout == ""
    return ran.code, json.loads(ran.stderr)["error"]


def test_maintenance_repeats_the_bounded_transactions_until_none_remain() -> None:
    world = world_with(*expired_events(250, now=NOW), *fresh_events(4, now=NOW))
    world.capabilities.stored.extend(aged_snapshot(number, now=NOW, ago=EXPIRED) for number in range(3))

    report = maintain(world)

    assert report["result"] == "completed"
    assert list(report) == [
        "schemaVersion",
        "command",
        "exitCode",
        "result",
        "expiredEventCount",
        "expiredWorkspaceCount",
        "expiredCapabilitySnapshotCount",
        "expiredLocalTotal",
        "expiredBeforeAckTotal",
        "databaseBytesBefore",
        "databaseBytesAfter",
        "walBytesAfter",
        "freelistBytesAfter",
        "highWaterBytes",
    ]
    assert (report["expiredEventCount"], report["expiredCapabilitySnapshotCount"]) == (250, 3)
    assert (report["expiredLocalTotal"], report["expiredBeforeAckTotal"]) == (253, 0)
    assert [batch.events + batch.snapshots for batch in world.telemetry.prunes] == [100, 100, 53, 0]
    assert world.telemetry.marker == stamp(NOW)
    assert numbers(tuple(world.events.stored)) == [1001, 1002, 1003, 1004]


def test_a_workspace_left_with_no_retained_event_is_counted_once_when_it_goes() -> None:
    world = world_with(
        *expired_events(2, now=NOW, workspaceId=WORKSPACE_B), *fresh_events(1, now=NOW, workspaceId=WORKSPACE_A)
    )

    assert maintain(world)["expiredWorkspaceCount"] == 1


def test_only_the_rows_this_run_removed_are_reported_and_the_lifetime_counter_keeps_its_history() -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.telemetry.local_total = 7

    report = maintain(world)

    assert (report["expiredEventCount"], report["expiredLocalTotal"]) == (3, 10)


def test_maintenance_measures_the_bytes_before_and_after_and_reports_the_largest_footprint() -> None:
    world = world_with()
    world.telemetry.facts = SMALL

    report = maintain(world)

    assert (report["databaseBytesBefore"], report["databaseBytesAfter"]) == (131072, 131072)
    assert (report["walBytesAfter"], report["freelistBytesAfter"]) == (0, 4096)
    assert report["highWaterBytes"] == 196608
    assert (world.telemetry.checkpoints, world.telemetry.compactions) == (["truncated"], [])


def test_a_small_free_list_is_left_alone_and_no_integrity_check_is_spent_on_it() -> None:
    world = world_with()
    world.telemetry.facts = SMALL

    maintain(world)

    assert world.telemetry.integrity_checks == []


def test_compaction_shrinks_the_file_but_the_high_water_mark_keeps_the_peak_of_the_rewrite() -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING

    report = maintain(world)

    assert (report["databaseBytesBefore"], report["databaseBytesAfter"]) == (64 * MIB, 48 * MIB)
    assert (report["walBytesAfter"], report["freelistBytesAfter"]) == (0, 0)
    assert report["highWaterBytes"] == 96 * MIB
    assert (world.telemetry.checkpoints, world.telemetry.compactions) == (["truncated", "truncated"], ["compacted"])


def test_the_whole_database_is_checked_before_it_is_rewritten() -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING

    maintain(world)

    assert world.telemetry.integrity_checks == [True]


def test_a_damaged_database_is_never_rewritten() -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING
    world.telemetry.integrity_ok = False

    code, error = failure_of(world)

    assert (code, error["code"]) == (2, "ferret.storage.integrity-failure")
    assert (world.telemetry.compactions, world.telemetry.facts) == ([], WORTH_COMPACTING)


def test_a_checkpoint_blocked_by_an_open_reader_is_skipped_rather_than_forced() -> None:
    world = world_with()
    world.telemetry.facts = SMALL
    world.telemetry.reader_open = True

    report = maintain(world)

    assert (report["result"], report["walBytesAfter"], report["databaseBytesAfter"]) == ("completed", 65536, 131072)
    assert world.telemetry.checkpoints == ["skipped"]


def test_a_compaction_that_cannot_finish_leaves_the_bytes_as_they_were_and_status_still_reports_them() -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING
    world.telemetry.compaction_fails = True

    report = maintain(world)
    after = json.loads(run_cli(world, ["status", "--json"]).stdout)

    assert report["result"] == "completed"
    assert (report["databaseBytesAfter"], report["freelistBytesAfter"], report["highWaterBytes"]) == (
        64 * MIB,
        16 * MIB,
        64 * MIB,
    )
    assert (after["databaseBytes"], after["walBytes"], after["freelistBytes"], after["highWaterBytes"]) == (
        64 * MIB,
        0,
        16 * MIB,
        64 * MIB,
    )
    assert (world.telemetry.compactions, world.telemetry.checkpoints) == (["failed"], ["truncated"])


def test_maintenance_that_cannot_take_the_write_lock_is_reported_and_never_claims_completion() -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.telemetry.lock_held = True

    code, error = failure_of(world)

    assert (code, error["code"], error["retryable"]) == (2, "ferret.storage.unavailable", True)
    assert (world.telemetry.marker, len(world.events.stored)) == (None, 3)
    assert (world.telemetry.checkpoints, world.telemetry.compactions) == ([], [])


def test_a_store_that_cannot_be_read_is_unavailable() -> None:
    world = world_with()
    world.telemetry.broken = FerretError("ferret.storage.unavailable", retryable=True)

    code, error = failure_of(world)

    assert (code, error["code"]) == (2, "ferret.storage.unavailable")


def test_an_uninitialized_store_is_refused_before_anything_is_measured_or_pruned() -> None:
    world = world_with(initialized=False)

    code, error = failure_of(world)

    assert (code, error["code"]) == (2, "ferret.storage.uninitialized")
    assert (world.telemetry.prunes, world.telemetry.checkpoints, world.telemetry.integrity_checks) == ([], [], [])


def test_if_due_does_nothing_but_measure_while_maintenance_is_not_due() -> None:
    world = world_with(*expired_events(5, now=NOW))
    world.telemetry.marker = stamp(NOW - timedelta(minutes=30))
    world.telemetry.facts = SMALL

    report = maintain(world, "--if-due")

    assert report["result"] == "not_due"
    assert (report["expiredEventCount"], report["expiredWorkspaceCount"], report["expiredCapabilitySnapshotCount"]) == (
        0,
        0,
        0,
    )
    assert (report["databaseBytesBefore"], report["databaseBytesAfter"]) == (131072, 131072)
    assert (report["walBytesAfter"], report["freelistBytesAfter"], report["highWaterBytes"]) == (65536, 4096, 196608)
    assert (world.telemetry.prunes, world.telemetry.checkpoints, world.telemetry.compactions) == ([], [], [])
    assert len(world.events.stored) == 5


def test_if_due_runs_the_whole_maintenance_once_it_is_due() -> None:
    world = world_with(*expired_events(5, now=NOW))
    world.telemetry.marker = stamp(NOW - MAINTENANCE_INTERVAL)

    report = maintain(world, "--if-due")

    assert (report["result"], report["expiredEventCount"]) == ("completed", 5)


def test_maintenance_without_if_due_runs_even_when_it_was_done_a_moment_ago() -> None:
    world = world_with(*expired_events(5, now=NOW))
    world.telemetry.marker = stamp(NOW)

    assert maintain(world)["expiredEventCount"] == 5


def test_maintenance_twice_leaves_only_the_latest_completion() -> None:
    world = world_with(*expired_events(2, now=NOW))
    first = maintain(world)
    world.clock.advance(timedelta(hours=25))
    world.events.stored.extend(expired_events(3, now=world.clock.now(), first=500))
    second = maintain(world)

    assert (first["expiredEventCount"], second["expiredEventCount"]) == (2, 3)
    assert world.telemetry.marker == stamp(NOW + timedelta(hours=25))
    assert value_of(world.telemetry.expiry_counters()) == ExpiryCounters(local_total=5, before_ack_total=0)


def test_measure_storage_reads_the_three_physical_figures_from_the_store() -> None:
    world = world_with()
    world.telemetry.facts = SMALL

    assert value_of(measure_storage(world.runtime)) == SMALL


@pytest.mark.parametrize(
    ("facts", "reader_open", "compaction_fails", "expected"),
    [
        pytest.param(
            SMALL,
            False,
            False,
            Reclamation("truncated", "not_needed", (SMALL, StorageFacts(131072, 0, 4096))),
            id="a-small-free-list-is-checkpointed-only",
        ),
        pytest.param(
            WORTH_COMPACTING,
            False,
            False,
            Reclamation(
                "truncated",
                "compacted",
                (
                    WORTH_COMPACTING,
                    WORTH_COMPACTING,
                    StorageFacts(48 * MIB, 48 * MIB, 0),
                    StorageFacts(48 * MIB, 0, 0),
                ),
            ),
            id="a-large-free-list-is-compacted-and-checkpointed-again",
        ),
        pytest.param(
            WORTH_COMPACTING,
            True,
            False,
            Reclamation(
                "skipped",
                "compacted",
                (
                    WORTH_COMPACTING,
                    WORTH_COMPACTING,
                    StorageFacts(48 * MIB, 48 * MIB, 0),
                    StorageFacts(48 * MIB, 48 * MIB, 0),
                ),
            ),
            id="an-open-reader-blocks-both-checkpoints",
        ),
        pytest.param(
            WORTH_COMPACTING,
            False,
            True,
            Reclamation("truncated", "failed", (WORTH_COMPACTING, WORTH_COMPACTING, WORTH_COMPACTING)),
            id="a-failed-compaction-changes-no-byte",
        ),
    ],
)
def test_reclaim_space_reports_what_it_did_and_every_measurement_it_took(
    facts: StorageFacts, reader_open: bool, compaction_fails: bool, expected: Reclamation
) -> None:
    world = world_with()
    world.telemetry.facts = facts
    world.telemetry.reader_open = reader_open
    world.telemetry.compaction_fails = compaction_fails

    assert value_of(reclaim_space(world.runtime)) == expected


def test_reclaim_space_refuses_a_damaged_database_and_rewrites_nothing() -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING
    world.telemetry.integrity_ok = False

    refusal = refusal_of(reclaim_space(world.runtime))

    assert (refusal.code, refusal.exit_code, refusal.retryable) == ("ferret.storage.integrity-failure", 2, False)
    assert (world.telemetry.compactions, world.telemetry.facts) == ([], WORTH_COMPACTING)


@pytest.mark.parametrize(
    ("call", "from_call"),
    [
        pytest.param("storage_facts", 1, id="the-first-measurement"),
        pytest.param("checkpoint", 1, id="the-first-checkpoint"),
        pytest.param("storage_facts", 2, id="the-measurement-after-it"),
        pytest.param("check_integrity", 1, id="the-integrity-check"),
        pytest.param("compact", 1, id="the-compaction"),
        pytest.param("checkpoint", 2, id="the-checkpoint-after-the-compaction"),
        pytest.param("storage_facts", 3, id="the-last-measurement"),
    ],
)
def test_reclaim_space_ends_with_the_failure_of_any_store_call_it_makes(call: str, from_call: int) -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING
    failure = FerretError("ferret.storage.unavailable", retryable=True)
    world.telemetry.refusals[call] = failure
    world.telemetry.refuse_from[call] = from_call

    assert refusal_of(reclaim_space(world.runtime)) is failure
    assert world.telemetry.calls[call] == from_call


def test_pruning_to_exhaustion_returns_the_rows_it_removed() -> None:
    world = world_with(*expired_events(250, now=NOW), *fresh_events(4, now=NOW))

    pruned = value_of(prune_to_exhaustion(world.runtime))

    assert (pruned.events, pruned.snapshots) == (250, 0)
    assert numbers(tuple(world.events.stored)) == [1001, 1002, 1003, 1004]


def test_pruning_to_exhaustion_returns_a_retryable_refusal_when_the_write_lock_cannot_be_taken() -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.telemetry.lock_held = True

    refusal = refusal_of(prune_to_exhaustion(world.runtime))

    assert (refusal.code, refusal.exit_code, refusal.retryable) == ("ferret.storage.unavailable", 2, True)
    assert len(world.events.stored) == 3


def test_run_maintenance_returns_the_report_of_a_whole_run() -> None:
    world = world_with(*expired_events(5, now=NOW))
    world.telemetry.facts = SMALL

    report = value_of(run_maintenance(world.runtime, if_due=False))

    assert (report.result, report.pruned.events, report.before, report.high_water_bytes) == (
        "completed",
        5,
        SMALL,
        196608,
    )


def test_run_maintenance_returns_a_not_due_report_that_only_measures() -> None:
    world = world_with(*expired_events(5, now=NOW))
    world.telemetry.marker = stamp(NOW - timedelta(minutes=30))
    world.telemetry.facts = SMALL

    report = value_of(run_maintenance(world.runtime, if_due=True))

    assert (report.result, report.pruned.events, report.before, report.after) == ("not_due", 0, SMALL, SMALL)
    assert (report.high_water_bytes, world.telemetry.prunes) == (196608, [])


def test_run_maintenance_returns_the_refusal_of_a_store_that_is_not_initialized_before_measuring() -> None:
    world = world_with(initialized=False)

    refusal = refusal_of(run_maintenance(world.runtime, if_due=False))

    assert refusal.code == "ferret.storage.uninitialized"
    assert (world.telemetry.prunes, world.telemetry.checkpoints, world.telemetry.integrity_checks) == ([], [], [])


def test_run_maintenance_returns_the_refusal_of_a_damaged_database() -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING
    world.telemetry.integrity_ok = False

    refusal = refusal_of(run_maintenance(world.runtime, if_due=False))

    assert refusal.code == "ferret.storage.integrity-failure"
    assert world.telemetry.compactions == []


FAILURES = [
    pytest.param(FerretError("ferret.storage.unavailable", retryable=True), id="retryable"),
    pytest.param(FerretError("ferret.storage.integrity-failure"), id="integrity"),
]


@pytest.mark.parametrize("failure", FAILURES)
@pytest.mark.parametrize(
    "call", ["storage_facts", "prune_batch", "checkpoint", "check_integrity", "compact", "expiry_counters"]
)
def test_a_telemetry_call_that_fails_ends_a_whole_run_with_its_own_failure(call: str, failure: FerretError) -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.telemetry.facts = WORTH_COMPACTING
    world.telemetry.refusals[call] = failure

    refusal = refusal_of(run_maintenance(world.runtime, if_due=False))

    assert (refusal.code, refusal.exit_code, refusal.retryable) == (failure.code, 2, failure.retryable)


@pytest.mark.parametrize("failure", FAILURES)
@pytest.mark.parametrize("call", ["last_completed_at", "storage_facts", "expiry_counters"])
def test_a_telemetry_call_that_fails_ends_a_run_that_is_not_due_with_its_own_failure(
    call: str, failure: FerretError
) -> None:
    world = world_with()
    world.telemetry.marker = stamp(NOW - timedelta(minutes=30))
    world.telemetry.refusals[call] = failure

    refusal = refusal_of(run_maintenance(world.runtime, if_due=True))

    assert (refusal.code, refusal.exit_code, refusal.retryable) == (failure.code, 2, failure.retryable)


@pytest.mark.parametrize("failure", FAILURES)
@pytest.mark.parametrize("call", ["storage_facts", "checkpoint", "check_integrity", "compact"])
def test_reclaiming_space_ends_with_the_failure_of_the_call_that_failed_and_rewrites_nothing(
    call: str, failure: FerretError
) -> None:
    world = world_with()
    world.telemetry.facts = WORTH_COMPACTING
    world.telemetry.refusals[call] = failure

    refusal = refusal_of(reclaim_space(world.runtime))

    assert (refusal.code, refusal.retryable) == (failure.code, failure.retryable)
    assert (world.telemetry.compactions, world.telemetry.facts) == ([], WORTH_COMPACTING)


@pytest.mark.parametrize("failure", FAILURES)
def test_pruning_to_exhaustion_ends_with_the_failure_of_a_batch_that_fails(failure: FerretError) -> None:
    world = world_with(*expired_events(3, now=NOW))
    world.telemetry.refusals["prune_batch"] = failure

    refusal = refusal_of(prune_to_exhaustion(world.runtime))

    assert (refusal.code, refusal.retryable) == (failure.code, failure.retryable)
    assert len(world.events.stored) == 3


def test_measuring_storage_returns_the_failure_of_a_store_that_cannot_be_read() -> None:
    world = world_with()
    world.telemetry.refusals["storage_facts"] = FerretError("ferret.storage.integrity-failure")

    assert refusal_of(measure_storage(world.runtime)).code == "ferret.storage.integrity-failure"
