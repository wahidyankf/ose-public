"""``status``: one read-only report of the store, its physical space, retention counters, runtime, and adapters."""

import json
from dataclasses import replace
from datetime import timedelta
from typing import Any

import pytest

from ferret import __version__
from ferret.application.ports import InterpreterFacts
from ferret.domain.errors import FAILURES, FerretError
from ferret.domain.retention import MAINTENANCE_INTERVAL
from ferret.domain.space import MIB, StorageFacts
from support.fakes import FAKE_DATA_HOME, FIXED_NOW, World
from support.invoke import Ran, run_cli
from support.populate import make_event, stamp, world_with
from support.retention import CUTOFF, EXPIRED, aged_snapshot, expired_events, fresh_events
from support.scenarios import expected_lines

NOW = FIXED_NOW
RECENT = timedelta(minutes=30)
TOP_LEVEL_KEYS = [
    "schemaVersion",
    "command",
    "exitCode",
    "runtime",
    "databaseState",
    "dataHome",
    "databasePath",
    "schemaNumber",
    "integrityState",
    "permissionsState",
    "eventCount",
    "capabilitySnapshotCount",
    "oldestCapturedAt",
    "nearExpiryCount",
    "logicallyExpiredCount",
    "databaseBytes",
    "walBytes",
    "freelistBytes",
    "highWaterBytes",
    "expiredLocalTotal",
    "expiredBeforeAckTotal",
    "hookFailureCount",
    "lastHookFailureAt",
    "lastMaintenanceAt",
    "maintenanceDue",
    "backend",
    "adapters",
]
RUNTIME_KEYS = ["ferretVersion", "interpreterPath", "interpreterVersion", "interpreterState"]
ADAPTER_KEYS = [
    "harness",
    "platformSupport",
    "configurationState",
    "latestSnapshotId",
    "latestSnapshotHash",
    "snapshotCapturedAt",
    "capabilities",
]


def status(world: World, *arguments: str) -> dict[str, Any]:
    ran = run_cli(world, ["status", "--json", *arguments])
    assert (ran.code, ran.stderr) == (0, "")
    return json.loads(ran.stdout)


def error_of(ran: Ran) -> dict[str, Any]:
    assert ran.stdout == ""
    return json.loads(ran.stderr)


def test_physical_space_fields() -> None:
    world = world_with()
    world.telemetry.facts = StorageFacts(database_bytes=131072, wal_bytes=32768, freelist_bytes=4096)

    report = status(world)

    assert report["databaseBytes"] == 131072
    assert report["walBytes"] == 32768
    assert report["freelistBytes"] == 4096
    assert report["highWaterBytes"] == 163840


def test_the_high_water_mark_counts_the_log_that_has_not_been_truncated() -> None:
    world = world_with()
    world.telemetry.facts = StorageFacts(database_bytes=64 * MIB, wal_bytes=0, freelist_bytes=0)
    assert status(world)["highWaterBytes"] == 64 * MIB

    world.telemetry.facts = StorageFacts(database_bytes=64 * MIB, wal_bytes=48 * MIB, freelist_bytes=0)
    assert status(world)["highWaterBytes"] == 112 * MIB


def populated_world() -> World:
    """Four live events (one about to expire), two expired ones still stored, and a live Codex snapshot."""
    near_expiry = make_event(4, ago=CUTOFF - timedelta(hours=12), now=NOW)
    world = world_with(*fresh_events(3, now=NOW), near_expiry, *expired_events(2, now=NOW))
    world.capabilities.stored.append(aged_snapshot(1, now=NOW, ago=timedelta(hours=1), harness="codex"))
    world.telemetry.local_total = 7
    world.telemetry.marker = stamp(NOW - RECENT)
    world.telemetry.facts = StorageFacts(database_bytes=65536, wal_bytes=0, freelist_bytes=4096)
    return world


def test_status_is_one_json_object_in_the_documented_key_order() -> None:
    ran = run_cli(populated_world(), ["status", "--json"])

    assert (ran.code, ran.stderr, ran.stdout.count("\n")) == (0, "", 1)
    document = json.loads(ran.stdout)
    assert list(document) == TOP_LEVEL_KEYS
    assert list(document["runtime"]) == RUNTIME_KEYS
    assert [list(adapter) for adapter in document["adapters"]] == [ADAPTER_KEYS] * 3


def test_status_reports_the_store_as_it_stands() -> None:
    world = populated_world()
    codex = world.capabilities.stored[0]

    document = status(world)

    assert {key: document[key] for key in TOP_LEVEL_KEYS if key not in {"runtime", "adapters"}} == {
        "schemaVersion": 1,
        "command": "status",
        "exitCode": 0,
        "databaseState": "healthy",
        "dataHome": str(FAKE_DATA_HOME),
        "databasePath": str(FAKE_DATA_HOME / "ferret.sqlite3"),
        "schemaNumber": 1,
        "integrityState": "ok",
        "permissionsState": "private",
        "eventCount": 4,
        "capabilitySnapshotCount": 1,
        "oldestCapturedAt": stamp(NOW - CUTOFF + timedelta(hours=12)),
        "nearExpiryCount": 1,
        "logicallyExpiredCount": 2,
        "databaseBytes": 65536,
        "walBytes": 0,
        "freelistBytes": 4096,
        "highWaterBytes": 65536,
        "expiredLocalTotal": 7,
        "expiredBeforeAckTotal": 0,
        "hookFailureCount": 0,
        "lastHookFailureAt": None,
        "lastMaintenanceAt": stamp(NOW - RECENT),
        "maintenanceDue": False,
        "backend": {"state": "not_available_in_this_version"},
    }
    assert document["runtime"] == {
        "ferretVersion": __version__,
        "interpreterPath": "/usr/local/bin/python3.14",
        "interpreterVersion": "3.14.7",
        "interpreterState": "supported",
    }
    assert document["adapters"] == [
        {
            "harness": "claude_code",
            "platformSupport": "supported",
            "configurationState": "not_configured",
            "latestSnapshotId": None,
            "latestSnapshotHash": None,
            "snapshotCapturedAt": None,
            "capabilities": [],
        },
        {
            "harness": "codex",
            "platformSupport": "supported",
            "configurationState": "configured",
            "latestSnapshotId": codex.snapshot_id,
            "latestSnapshotHash": codex.snapshot_hash,
            "snapshotCapturedAt": codex.captured_at,
            "capabilities": [{"name": c.name, "state": c.state, "source": c.source} for c in codex.capabilities],
        },
        {
            "harness": "opencode",
            "platformSupport": "probe_required",
            "configurationState": "not_configured",
            "latestSnapshotId": None,
            "latestSnapshotHash": None,
            "snapshotCapturedAt": None,
            "capabilities": [],
        },
    ]


def test_an_expired_snapshot_does_not_make_an_adapter_configured() -> None:
    world = world_with()
    world.capabilities.stored.append(aged_snapshot(1, now=NOW, ago=EXPIRED, harness="codex"))

    codex = next(adapter for adapter in status(world)["adapters"] if adapter["harness"] == "codex")

    assert (codex["configurationState"], codex["latestSnapshotId"]) == ("not_configured", None)


def test_an_empty_store_reports_absence_as_null_and_maintenance_as_due() -> None:
    document = status(world_with())

    assert (document["eventCount"], document["capabilitySnapshotCount"]) == (0, 0)
    assert (document["oldestCapturedAt"], document["nearExpiryCount"], document["logicallyExpiredCount"]) == (
        None,
        0,
        0,
    )
    assert (document["lastMaintenanceAt"], document["maintenanceDue"]) == (None, True)


def test_maintenance_due_follows_the_marker_and_the_clock() -> None:
    world = world_with()
    world.telemetry.marker = stamp(NOW - MAINTENANCE_INTERVAL)

    assert status(world)["maintenanceDue"] is True

    world.telemetry.marker = stamp(NOW - MAINTENANCE_INTERVAL + timedelta(minutes=1))
    assert status(world)["maintenanceDue"] is False


def test_the_human_report_is_the_same_result_in_the_documented_line_order() -> None:
    world = populated_world()
    document = status(world)

    ran = run_cli(world, ["status"])

    assert (ran.code, ran.stderr) == (0, "")
    assert ran.stdout.splitlines() == expected_lines("status", document)
    assert ran.stdout.splitlines()[0] == "FERRET status: healthy"
    assert "Maintenance: last=" + stamp(NOW - RECENT) + " due=no" in ran.stdout


def test_the_human_report_renders_absence_as_a_hyphen_and_true_as_yes() -> None:
    ran = run_cli(world_with(), ["status"])

    assert "Oldest capture: -" in ran.stdout.splitlines()
    assert "Maintenance: last=- due=yes" in ran.stdout.splitlines()
    assert "Adapter codex: supported/not_configured/-" in ran.stdout.splitlines()


@pytest.mark.parametrize(
    ("path", "version", "state"),
    [
        pytest.param("/usr/local/bin/python3.14", "3.14.7", "supported", id="the-supported-minor"),
        pytest.param("/usr/local/bin/python3.14", "3.14.0", "supported", id="any-patch-of-it"),
        pytest.param("/usr/bin/python3.13", "3.13.9", "unsupported_version", id="older"),
        pytest.param("/usr/bin/python3.15", "3.15.0", "unsupported_version", id="newer"),
        pytest.param("", "3.14.7", "unresolved", id="no-path"),
        pytest.param("/usr/bin/python3", "", "unresolved", id="no-version"),
        pytest.param("/usr/bin/python3", "not-a-version", "unresolved", id="an-unreadable-version"),
    ],
)
def test_a_runtime_gap_is_a_reported_state_and_never_an_empty_result(path: str, version: str, state: str) -> None:
    world = world_with()
    runtime = replace(world.runtime, interpreter=InterpreterFacts(path=path, version=version))

    ran = run_cli(replace(world, runtime=runtime), ["status", "--json"])

    document = json.loads(ran.stdout)
    assert ran.code == 0
    assert (document["runtime"]["interpreterState"], document["runtime"]["interpreterVersion"]) == (state, version)
    assert document["runtime"]["interpreterPath"] == path


def test_status_only_reads_and_leaves_expired_rows_for_the_next_operation_to_prune() -> None:
    world = world_with(*expired_events(5, now=NOW))

    document = status(world)

    assert document["logicallyExpiredCount"] == 5
    assert (world.telemetry.prunes, len(world.events.stored)) == ([], 5)
    assert (document["expiredLocalTotal"], world.telemetry.checkpoints, world.telemetry.compactions) == (0, [], [])


def test_the_integrity_probe_is_the_quick_one_so_status_stays_fast_on_a_large_store() -> None:
    world = world_with()

    status(world)

    assert world.telemetry.integrity_checks == [False]


def test_an_uninitialized_store_is_a_closed_failure_that_touches_no_telemetry() -> None:
    world = world_with(initialized=False)

    ran = run_cli(world, ["status", "--json"])

    envelope = error_of(ran)
    assert (ran.code, envelope["command"], envelope["error"]["code"]) == (2, "status", "ferret.storage.uninitialized")
    assert (world.telemetry.integrity_checks, world.telemetry.prunes) == ([], [])


def test_a_data_home_open_to_others_is_refused_as_unsafe_storage() -> None:
    world = world_with()
    assert world.files.directory is not None
    world.files.directory.mode = 0o755

    ran = run_cli(world, ["status", "--json"])

    assert (ran.code, error_of(ran)["error"]["code"]) == (2, "ferret.storage.unsafe")


def test_a_failed_integrity_check_is_the_integrity_failure_exit() -> None:
    world = world_with()
    world.telemetry.integrity_ok = False

    ran = run_cli(world, ["status", "--json"])

    assert (ran.code, error_of(ran)["error"]["code"]) == (
        FAILURES["ferret.storage.integrity-failure"][0],
        "ferret.storage.integrity-failure",
    )


def test_a_store_that_cannot_be_read_is_unavailable_and_says_it_may_be_retried() -> None:
    world = world_with()
    world.telemetry.broken = FerretError("ferret.storage.unavailable", retryable=True)

    ran = run_cli(world, ["status", "--json"])

    error = error_of(ran)["error"]
    assert (ran.code, error["code"], error["retryable"]) == (2, "ferret.storage.unavailable", True)
