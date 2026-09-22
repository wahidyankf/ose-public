"""The SQLite capability repository against a real database: composite items, producer-owned identity, atomicity."""

import sqlite3
from contextlib import closing
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest

from ferret.adapters.sqlite_repository import SQLiteCapabilityRepository
from ferret.adapters.sqlite_schema import SQLiteSchema, connect
from ferret.adapters.system import SystemClock
from ferret.domain.capability import Capability, CapabilitySnapshot, snapshot_from_document
from ferret.domain.errors import FerretError
from support.busy import PLANNED_ATTEMPT_TIMEOUT_MS, record_busy_timeouts
from support.snapshots import VECTOR_DOCUMENT, VECTOR_HASH, capability, snapshot_document

NOW = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)
SECOND_ID = "00000000-0000-4000-8000-000000000005"
THIRD_ID = "00000000-0000-4000-8000-000000000006"
VECTOR_ROW = {
    "snapshot_id": "00000000-0000-4000-8000-000000000004",
    "snapshot_hash": VECTOR_HASH,
    "schema_version": "1.0",
    "captured_at": "2026-09-18T08:00:00.000Z",
    "expires_at": "2026-10-18T08:00:00.000Z",
    "harness": "codex",
    "harness_version": "1.2.3",
    "installation_id": "00000000-0000-4000-8000-000000000002",
}
VECTOR_ITEMS = [
    {
        "snapshot_id": "00000000-0000-4000-8000-000000000004",
        "capability_name": "session_lifecycle",
        "state": "observed",
        "source": "official_hook",
    },
    {
        "snapshot_id": "00000000-0000-4000-8000-000000000004",
        "capability_name": "skill_invocation",
        "state": "unknown",
        "source": "unavailable",
    },
]


@pytest.fixture
def database(tmp_path: Path) -> Path:
    path = tmp_path / "ferret.sqlite3"
    SQLiteSchema(path, SystemClock()).migrate()
    return path


def make_snapshot(**overrides: Any) -> CapabilitySnapshot:
    return snapshot_from_document(snapshot_document(**overrides), now=NOW)


def rows(database: Path, table: str) -> list[dict[str, Any]]:
    with closing(sqlite3.connect(database)) as connection:
        connection.row_factory = sqlite3.Row
        return [dict(row) for row in connection.execute(f"SELECT * FROM {table} ORDER BY 1, 2")]


def snapshot_ids(database: Path) -> list[str]:
    return [row["snapshot_id"] for row in rows(database, "capability_snapshot")]


def test_snapshot_idempotency_and_composite_items(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)

    first = repository.store_snapshot(make_snapshot())
    again = repository.store_snapshot(make_snapshot())

    assert (first, again) == ("stored", "duplicate")
    assert rows(database, "capability_snapshot") == [VECTOR_ROW]
    assert rows(database, "capability_item") == VECTOR_ITEMS

    with pytest.raises(FerretError) as caught:
        repository.store_snapshot(make_snapshot(harnessVersion="9.9.9"))

    assert caught.value.code == "ferret.event.idempotency-conflict"
    assert rows(database, "capability_snapshot") == [VECTOR_ROW]
    assert rows(database, "capability_item") == VECTOR_ITEMS

    later = make_snapshot(snapshotId=SECOND_ID, capturedAt="2026-09-18T09:00:00.000Z")

    assert repository.store_snapshot(later) == "stored"
    assert snapshot_ids(database) == [VECTOR_ROW["snapshot_id"], SECOND_ID]
    assert [(item["snapshot_id"], item["capability_name"]) for item in rows(database, "capability_item")] == [
        (VECTOR_ROW["snapshot_id"], "session_lifecycle"),
        (VECTOR_ROW["snapshot_id"], "skill_invocation"),
        (SECOND_ID, "session_lifecycle"),
        (SECOND_ID, "skill_invocation"),
    ]


def test_the_same_capability_name_is_refused_twice_within_one_snapshot_by_the_schema_itself(database: Path) -> None:
    SQLiteCapabilityRepository(database).store_snapshot(make_snapshot())

    with closing(connect(database)) as connection, pytest.raises(sqlite3.IntegrityError):
        connection.execute(
            "INSERT INTO capability_item (snapshot_id, capability_name, state, source) VALUES (?, ?, ?, ?)",
            (VECTOR_ROW["snapshot_id"], "session_lifecycle", "unknown", "unavailable"),
        )


def test_removing_a_snapshot_removes_its_items_and_no_other_snapshots(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)
    repository.store_snapshot(make_snapshot())
    repository.store_snapshot(make_snapshot(snapshotId=SECOND_ID, capturedAt="2026-09-18T09:00:00.000Z"))

    with closing(connect(database)) as connection:
        connection.execute("DELETE FROM capability_snapshot WHERE snapshot_id = ?", (VECTOR_ROW["snapshot_id"],))

    assert snapshot_ids(database) == [SECOND_ID]
    assert {item["snapshot_id"] for item in rows(database, "capability_item")} == {SECOND_ID}
    assert len(rows(database, "capability_item")) == 2


def test_a_snapshot_hash_is_not_a_uniqueness_key(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)
    original = make_snapshot()
    twin = replace(original, snapshot_id=SECOND_ID)

    assert repository.store_snapshot(original) == "stored"
    assert repository.store_snapshot(twin) == "stored"

    assert [row["snapshot_hash"] for row in rows(database, "capability_snapshot")] == [VECTOR_HASH, VECTOR_HASH]
    assert snapshot_ids(database) == [VECTOR_ROW["snapshot_id"], SECOND_ID]


def test_a_stored_snapshot_reads_back_exactly_as_it_was_written(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)
    written = make_snapshot()

    repository.store_snapshot(written)

    assert repository.latest_snapshot("codex", now=NOW) == written


@pytest.mark.parametrize(
    "overrides",
    [
        pytest.param({"harnessVersion": None}, id="no-harness-version"),
        pytest.param({"capabilities": []}, id="no-capabilities"),
        pytest.param(
            {"capabilities": [capability("outcome", "derived", "official_plugin"), capability("tool_lifecycle")]},
            id="mixed-states-and-sources",
        ),
    ],
)
def test_the_read_back_keeps_optional_fields_and_the_item_order(database: Path, overrides: dict[str, Any]) -> None:
    repository = SQLiteCapabilityRepository(database)
    written = make_snapshot(**overrides)

    repository.store_snapshot(written)

    assert repository.latest_snapshot("codex", now=NOW) == written


def test_the_latest_snapshot_is_the_newest_capture_for_that_harness_only(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)
    oldest = make_snapshot(snapshotId=THIRD_ID, capturedAt="2026-09-18T07:00:00.000Z")
    newest = make_snapshot(snapshotId=SECOND_ID, capturedAt="2026-09-18T09:00:00.000Z")
    middle = make_snapshot()
    other_harness = make_snapshot(
        harness="opencode", snapshotId="00000000-0000-4000-8000-000000000007", capturedAt="2026-09-18T10:00:00.000Z"
    )

    for snapshot in (newest, oldest, middle, other_harness):
        repository.store_snapshot(snapshot)

    assert repository.latest_snapshot("codex", now=NOW) == newest
    assert repository.latest_snapshot("opencode", now=NOW) == other_harness
    assert repository.latest_snapshot("claude_code", now=NOW) is None


def test_a_tie_on_the_capture_moment_resolves_to_the_greater_snapshot_id(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)
    lower = make_snapshot()
    higher = make_snapshot(snapshotId=SECOND_ID)

    repository.store_snapshot(higher)
    repository.store_snapshot(lower)

    assert repository.latest_snapshot("codex", now=NOW) == higher


def test_a_snapshot_with_the_same_name_twice_stores_neither_the_snapshot_nor_any_item(database: Path) -> None:
    doubled = replace(make_snapshot(), capabilities=(Capability("outcome", "observed", "official_hook"),) * 2)

    with pytest.raises(FerretError) as caught:
        SQLiteCapabilityRepository(database).store_snapshot(doubled)

    assert caught.value.code == "ferret.storage.integrity-failure"
    assert (rows(database, "capability_snapshot"), rows(database, "capability_item")) == ([], [])


def test_a_constraint_failure_after_the_snapshot_row_rolls_the_whole_snapshot_back(database: Path) -> None:
    exploded = replace(make_snapshot(), capabilities=(Capability("outcome", "exploded", "official_hook"),))

    with pytest.raises(FerretError) as caught:
        SQLiteCapabilityRepository(database).store_snapshot(exploded)

    assert caught.value.code == "ferret.storage.integrity-failure"
    assert (rows(database, "capability_snapshot"), rows(database, "capability_item")) == ([], [])


def test_a_failed_insert_leaves_no_snapshot_row(database: Path) -> None:
    with closing(sqlite3.connect(database)) as connection:
        connection.execute("DROP TABLE capability_item")

    with pytest.raises(FerretError) as caught:
        SQLiteCapabilityRepository(database).store_snapshot(make_snapshot())

    assert caught.value.code == "ferret.storage.unavailable"
    assert rows(database, "capability_snapshot") == []


def test_a_writer_blocked_beyond_the_busy_timeout_fails_retryably_and_leaves_no_row(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    budgets = record_busy_timeouts(monkeypatch)
    blocker = sqlite3.connect(database, autocommit=True)
    blocker.execute("BEGIN IMMEDIATE")
    try:
        with pytest.raises(FerretError) as caught:
            SQLiteCapabilityRepository(database).store_snapshot(make_snapshot())
    finally:
        blocker.execute("ROLLBACK")
        blocker.close()

    assert (caught.value.code, caught.value.retryable) == ("ferret.storage.unavailable", True)
    # Every attempt is opened with the short attempt timeout, never with the budget: a budget handed to
    # SQLite as a busy timeout is not a bound, which is the defect this asserts against.
    assert budgets != []
    assert set(budgets) == {PLANNED_ATTEMPT_TIMEOUT_MS}
    assert rows(database, "capability_snapshot") == []
    assert SQLiteCapabilityRepository(database).store_snapshot(make_snapshot()) == "stored"


def test_the_vector_document_is_what_the_row_read_back_produces(database: Path) -> None:
    repository = SQLiteCapabilityRepository(database)
    repository.store_snapshot(snapshot_from_document(VECTOR_DOCUMENT, now=NOW))

    latest = repository.latest_snapshot("codex", now=NOW)

    assert latest is not None
    assert latest.to_document() == VECTOR_DOCUMENT
