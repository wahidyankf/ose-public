"""Physical space against a real store: file sizes, the free list, safe checkpoints, compaction, status, maintenance."""

import json
import platform
import sqlite3
import sys
from collections.abc import Generator
from contextlib import closing, contextmanager
from datetime import timedelta
from pathlib import Path
from typing import Any

import pytest

from ferret import __version__
from ferret.domain.retention import MAINTENANCE_INTERVAL
from ferret.domain.space import StorageFacts
from support.bulk import seed_events
from support.burst import integrity_check
from support.fakes import FIXED_NOW, FakeMonotonic, FixedClock
from support.machine import Machine, make_machine
from support.populate import make_event, stamp
from support.retention import CUTOFF, aged_snapshot, expired_events, fresh_events

NOW = FIXED_NOW
RECENT = timedelta(minutes=30)
LARGE = 30_000


@pytest.fixture
def machine(tmp_path: Path) -> Machine:
    return make_machine(tmp_path, clock=FixedClock(NOW), monotonic=FakeMonotonic())


@contextmanager
def log_kept_open(machine: Machine) -> Generator[sqlite3.Connection]:
    """Another process's connection: while it is open, the write-ahead log is not folded away as writers close."""
    with closing(sqlite3.connect(machine.database, autocommit=True)) as holder:
        holder.execute("SELECT count(*) FROM event").fetchone()
        yield holder


def wal_path(machine: Machine) -> Path:
    return Path(f"{machine.database}-wal")


def run_json(machine: Machine, *arguments: str) -> dict[str, Any]:
    ran = machine.run([*arguments, "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    return json.loads(ran.stdout)


def facts_of(machine: Machine) -> StorageFacts:
    return machine.runtime().telemetry.storage_facts()


def test_the_storage_figures_are_the_sizes_of_the_real_files(machine: Machine) -> None:
    with log_kept_open(machine):
        machine.fill(fresh_events(300, now=NOW))

        facts = facts_of(machine)

        page_size = machine.sql("PRAGMA page_size")[0][0]
        free_pages = machine.sql("PRAGMA freelist_count")[0][0]
        assert facts == StorageFacts(
            machine.database.stat().st_size, wal_path(machine).stat().st_size, page_size * free_pages
        )
        assert facts.wal_bytes > 0


def test_a_log_that_no_connection_keeps_alive_has_no_file_and_measures_as_zero_bytes(machine: Machine) -> None:
    machine.fill(fresh_events(10, now=NOW))

    assert facts_of(machine).wal_bytes == 0


def test_a_checkpoint_folds_the_log_into_the_database_and_truncates_it(machine: Machine) -> None:
    with log_kept_open(machine):
        machine.fill(fresh_events(300, now=NOW))
        before = facts_of(machine)

        outcome = machine.runtime().telemetry.checkpoint()
        after = facts_of(machine)

        assert outcome == "truncated"
        assert before.wal_bytes > 0
        assert after.wal_bytes == 0
        assert after.database_bytes >= before.database_bytes
        assert machine.sql("SELECT count(*) FROM event") == [(300,)]


def test_a_checkpoint_is_skipped_while_a_reader_holds_the_log_and_forces_nothing(machine: Machine) -> None:
    with log_kept_open(machine) as reader:
        machine.fill(fresh_events(300, now=NOW))
        reader.execute("BEGIN")
        reader.execute("SELECT count(*) FROM event").fetchone()
        before = facts_of(machine)

        skipped = machine.runtime().telemetry.checkpoint()
        unchanged = facts_of(machine)
        reader.execute("COMMIT")
        truncated = machine.runtime().telemetry.checkpoint()

        assert (skipped, truncated) == ("skipped", "truncated")
        assert before.wal_bytes > 0
        assert unchanged.wal_bytes == before.wal_bytes
        assert facts_of(machine).wal_bytes == 0


def test_pruned_rows_become_free_pages_that_maintenance_and_status_both_report(machine: Machine) -> None:
    machine.fill([*expired_events(300, now=NOW), *fresh_events(10, now=NOW)])
    assert facts_of(machine).freelist_bytes == 0

    report = run_json(machine, "maintenance")
    status = run_json(machine, "status")

    assert (report["result"], report["expiredEventCount"], report["expiredLocalTotal"]) == ("completed", 300, 300)
    assert report["freelistBytesAfter"] > 0
    assert (status["freelistBytes"], status["walBytes"]) == (report["freelistBytesAfter"], 0)
    assert machine.sql("SELECT count(*) FROM event") == [(10,)]
    assert integrity_check(machine.database) == [("ok",)]


def test_status_reads_the_store_as_it_stands_and_changes_nothing(machine: Machine) -> None:
    nearly_expired = make_event(4, ago=CUTOFF - timedelta(hours=12), now=NOW)
    machine.fill([*fresh_events(3, now=NOW), nearly_expired, *expired_events(2, now=NOW)])
    machine.runtime().capabilities.store_snapshot(aged_snapshot(1, now=NOW, ago=timedelta(hours=1)))
    machine.set_marker(stamp(NOW - RECENT))
    rows_before = machine.sql("SELECT event_id FROM event ORDER BY event_id")

    document = run_json(machine, "status")

    assert {key: document[key] for key in ("eventCount", "capabilitySnapshotCount", "nearExpiryCount")} == {
        "eventCount": 4,
        "capabilitySnapshotCount": 1,
        "nearExpiryCount": 1,
    }
    assert (document["logicallyExpiredCount"], document["oldestCapturedAt"]) == (2, nearly_expired.captured_at)
    assert (document["databaseState"], document["integrityState"], document["permissionsState"]) == (
        "healthy",
        "ok",
        "private",
    )
    assert (document["dataHome"], document["databasePath"], document["schemaNumber"]) == (
        str(machine.data_home),
        str(machine.database),
        1,
    )
    assert (document["expiredLocalTotal"], document["expiredBeforeAckTotal"]) == (0, 0)
    assert (document["lastMaintenanceAt"], document["maintenanceDue"]) == (stamp(NOW - RECENT), False)
    assert document["databaseBytes"] == machine.database.stat().st_size
    assert document["runtime"] == {
        "ferretVersion": __version__,
        "interpreterPath": sys.executable,
        "interpreterVersion": platform.python_version(),
        "interpreterState": "supported",
    }
    codex = next(adapter for adapter in document["adapters"] if adapter["harness"] == "codex")
    assert (codex["platformSupport"], codex["configurationState"]) == ("supported", "configured")
    assert machine.sql("SELECT event_id FROM event ORDER BY event_id") == rows_before
    assert machine.sql("SELECT last_completed_at FROM maintenance_state") == [(stamp(NOW - RECENT),)]


def test_status_reports_a_log_another_connection_keeps_alive_apart_from_the_database(machine: Machine) -> None:
    with log_kept_open(machine):
        machine.fill(fresh_events(300, now=NOW))

        document = run_json(machine, "status")

        assert document["walBytes"] > 0
        assert document["highWaterBytes"] == document["databaseBytes"] + document["walBytes"]


def test_a_page_of_the_database_overwritten_with_noise_is_an_integrity_failure(machine: Machine) -> None:
    seed_events(machine, now=NOW, live=2000, expired=0)
    with machine.database.open("r+b") as handle:
        handle.seek(10 * 4096)
        handle.write(b"\xff" * 4096)

    ran = machine.run(["status", "--json"])

    assert (ran.code, ran.stdout) == (4, "")
    assert json.loads(ran.stderr)["error"]["code"] == "integrity_failure"
    assert str(machine.home) not in ran.stderr


def test_a_file_that_is_not_a_database_is_an_integrity_failure_for_status_and_maintenance(machine: Machine) -> None:
    machine.database.write_bytes(b"this is not a database\n" * 200)

    codes = [machine.run([command, "--json"]).code for command in ("status", "maintenance")]

    assert codes == [4, 4]


def test_maintenance_that_cannot_take_the_write_lock_is_unavailable_and_changes_nothing(machine: Machine) -> None:
    machine.fill(expired_events(3, now=NOW))
    holder = sqlite3.connect(machine.database, autocommit=True)
    holder.execute("BEGIN IMMEDIATE")
    try:
        ran = machine.run(["maintenance", "--json"])
    finally:
        holder.execute("ROLLBACK")
        holder.close()

    error = json.loads(ran.stderr)["error"]
    assert (ran.code, ran.stdout, error["code"], error["retryable"]) == (3, "", "storage_unavailable", True)
    assert machine.sql("SELECT count(*) FROM event") == [(3,)]
    assert machine.sql("SELECT last_completed_at FROM maintenance_state") == [(None,)]


def test_maintenance_twice_leaves_one_state_row_that_keeps_only_the_latest_completion(tmp_path: Path) -> None:
    clock = FixedClock(NOW)
    machine = make_machine(tmp_path, clock=clock, monotonic=FakeMonotonic())
    machine.fill(expired_events(2, now=NOW))

    first = run_json(machine, "maintenance")
    clock.advance(timedelta(hours=25))
    machine.fill(expired_events(3, now=clock.now(), first=500))
    second = run_json(machine, "maintenance")

    assert (first["expiredEventCount"], second["expiredEventCount"], second["expiredLocalTotal"]) == (2, 3, 5)
    assert machine.sql("SELECT count(*) FROM maintenance_state") == [(1,)]
    assert machine.sql("SELECT last_completed_at, last_result FROM maintenance_state") == [
        (stamp(NOW + timedelta(hours=25)), "completed")
    ]


def test_if_due_only_measures_until_the_interval_has_passed_since_the_last_completion(tmp_path: Path) -> None:
    clock = FixedClock(NOW)
    machine = make_machine(tmp_path, clock=clock, monotonic=FakeMonotonic())
    machine.fill(expired_events(2, now=NOW))
    run_json(machine, "maintenance")
    machine.fill(expired_events(3, now=NOW, first=500))

    early = run_json(machine, "maintenance", "--if-due")
    clock.advance(MAINTENANCE_INTERVAL)
    late = run_json(machine, "maintenance", "--if-due")

    assert (early["result"], early["expiredEventCount"], early["databaseBytesAfter"] > 0) == ("not_due", 0, True)
    assert (late["result"], late["expiredEventCount"]) == ("completed", 3)


def test_maintenance_compacts_a_large_free_list_and_keeps_every_live_row(machine: Machine) -> None:
    seed_events(machine, now=NOW, live=LARGE, expired=LARGE)
    before = facts_of(machine)

    report = run_json(machine, "maintenance")
    status = run_json(machine, "status")

    assert report["expiredEventCount"] == report["expiredLocalTotal"] == LARGE
    assert report["databaseBytesBefore"] == before.database_bytes
    assert report["databaseBytesAfter"] < report["databaseBytesBefore"] * 0.75
    assert (report["walBytesAfter"], report["freelistBytesAfter"]) == (0, 0)
    assert report["highWaterBytes"] > report["databaseBytesAfter"]
    assert report["highWaterBytes"] >= report["databaseBytesBefore"]
    # The rewrite goes through the log while the old file is still whole, so the peak is the two files together.
    assert report["highWaterBytes"] >= report["databaseBytesBefore"] + report["databaseBytesAfter"]
    assert (status["databaseBytes"], status["freelistBytes"]) == (report["databaseBytesAfter"], 0)
    assert machine.sql("SELECT count(*) FROM event WHERE expires_at > ?", (stamp(NOW),)) == [(LARGE,)]
    assert machine.sql("SELECT count(*) FROM event") == [(LARGE,)]
    assert integrity_check(machine.database) == [("ok",)]
