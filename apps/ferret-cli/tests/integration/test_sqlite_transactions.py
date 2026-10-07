"""The connections and transactions of the SQLite adapters: commit on success, and rollback and close on every way out.

Every write is one ``BEGIN IMMEDIATE`` transaction on its own connection, and every read is one statement on its own
connection. These tests hold what the adapters promise on each way out of them: a result that is stored or refused, a
SQLite failure part-way, a COMMIT or a ROLLBACK that itself fails, a migration that is refused or that stops half
done, and an unexpected exception, which is never turned into a result. Failures are injected at the SQLite
connection, below the adapter, so each holds however the adapter reports it.
"""

import sqlite3
from collections.abc import Callable, Mapping
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from ferret.adapters.sqlite_repository import (
    SQLiteCapabilityRepository,
    SQLiteEventRepository,
    SQLiteTelemetryRepository,
)
from ferret.adapters.sqlite_schema import LATEST_SCHEMA, SQLiteSchema
from ferret.adapters.system import SystemClock
from ferret.application.ports import Budget, PruneResult
from ferret.domain.capability import snapshot_from_document
from ferret.domain.errors import FerretResult
from ferret.domain.event import event_from_document
from ferret.domain.query import EventCriteria
from support.events import event_document
from support.fakes import FakeMonotonic
from support.results import refused, value_of
from support.snapshots import snapshot_document

NOW = datetime(2026, 9, 18, 8, 15, 31, tzinfo=UTC)
NOT_A_DATABASE = b"this is not a sqlite database" * 200
BUSY = sqlite3.OperationalError("database is locked")
IO_ERROR = sqlite3.OperationalError("disk I/O error")
UNAVAILABLE = ("ferret.storage.unavailable", False)
RETRYABLE = ("ferret.storage.unavailable", True)
INTEGRITY = ("ferret.storage.integrity-failure", False)
CONFLICT = ("ferret.event.idempotency-conflict", False)
EVERYTHING = EventCriteria(start=None, end=None)


@pytest.fixture
def database(tmp_path: Path) -> Path:
    path = tmp_path / "ferret.sqlite3"
    value_of(SQLiteSchema(path, SystemClock()).migrate())
    return path


def change(database: Path, statement: str, *parameters: Any) -> None:
    with closing(sqlite3.connect(database, autocommit=True)) as connection:
        connection.execute(statement, parameters)


def select(database: Path, statement: str) -> list[tuple[Any, ...]]:
    with closing(sqlite3.connect(database)) as connection:
        return connection.execute(statement).fetchall()


def failing_on(fragment: str, error: Exception) -> type[sqlite3.Connection]:
    """A connection class that raises ``error`` for any statement containing ``fragment`` and runs the rest."""

    class Failing(sqlite3.Connection):
        def execute(self, sql: str, parameters: Any = (), /) -> sqlite3.Cursor:
            if fragment in sql:
                raise error
            return super().execute(sql, parameters)

        def executemany(self, sql: str, parameters: Any, /) -> sqlite3.Cursor:
            if fragment in sql:
                raise error
            return super().executemany(sql, parameters)

    return Failing


def track_connections(
    monkeypatch: pytest.MonkeyPatch, factory: type[sqlite3.Connection] = sqlite3.Connection
) -> list[sqlite3.Connection]:
    """Every connection ``sqlite3.connect`` opens from now on, made by ``factory``, in the order they are opened."""
    real = sqlite3.connect
    opened: list[sqlite3.Connection] = []

    def connect_and_track(*arguments: Any, **options: Any) -> sqlite3.Connection:
        connection = real(*arguments, **options, factory=factory)
        opened.append(connection)
        return connection

    monkeypatch.setattr(sqlite3, "connect", connect_and_track)
    return opened


def assert_all_closed(opened: list[sqlite3.Connection]) -> None:
    assert opened != []
    for connection in opened:
        with pytest.raises(sqlite3.ProgrammingError):
            connection.in_transaction  # noqa: B018 - reading it on a closed connection is the check


@dataclass(frozen=True, slots=True)
class Write:
    """One kind of write transaction: how to run it, and what changes about it for each way it can end."""

    store: Callable[[Path, Mapping[str, Any]], FerretResult[Any]]
    changes: Mapping[str, Any]  # the same ID with other content, which the identity policy refuses
    failing: str  # a statement the work runs part-way through, after something is already written
    table: str  # a table whose absence makes the storage fail


def store_event(database: Path, changes: Mapping[str, Any]) -> FerretResult[Any]:
    event = value_of(event_from_document(event_document(**changes), now=NOW))
    return SQLiteEventRepository(database).capture(event)


def store_snapshot(database: Path, changes: Mapping[str, Any]) -> FerretResult[Any]:
    snapshot = value_of(snapshot_from_document(snapshot_document(**changes), now=NOW))
    return SQLiteCapabilityRepository(database).store_snapshot(snapshot)


@pytest.fixture(
    params=[
        Write(store_event, {"toolName": "Write"}, "INSERT INTO event (", "event"),
        Write(store_snapshot, {"harnessVersion": "9.9.9"}, "INSERT INTO capability_item", "capability_snapshot"),
    ],
    ids=["event", "snapshot"],
)
def write(request: pytest.FixtureRequest) -> Write:
    return request.param


def test_a_write_that_stores_or_finds_a_duplicate_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    opened = track_connections(monkeypatch)

    first = value_of(write.store(database, {}))
    again = value_of(write.store(database, {}))

    assert (first, again) == ("stored", "duplicate")
    assert len(opened) == 2
    assert_all_closed(opened)


def test_a_write_refused_by_the_identity_policy_rolls_back_and_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    value_of(write.store(database, {}))
    opened = track_connections(monkeypatch)

    conflict = write.store(database, write.changes)

    assert refused(conflict) == CONFLICT
    assert_all_closed(opened)


def test_a_write_to_a_store_that_fails_answers_it_and_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    change(database, f"DROP TABLE {write.table}")
    opened = track_connections(monkeypatch)

    failure = write.store(database, {})

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_write_that_fails_part_way_leaves_nothing_behind_and_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    opened = track_connections(monkeypatch, failing_on(write.failing, IO_ERROR))

    failure = write.store(database, {})

    assert refused(failure) == UNAVAILABLE
    assert select(database, "SELECT count(*) FROM workspace") == [(0,)]
    assert select(database, "SELECT count(*) FROM event") == [(0,)]
    assert select(database, "SELECT count(*) FROM capability_snapshot") == [(0,)]
    assert_all_closed(opened)


def test_a_commit_that_fails_rolls_back_closes_and_answers_the_translated_failure(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    opened = track_connections(monkeypatch, failing_on("COMMIT", BUSY))

    failure = write.store(database, {})

    assert refused(failure) == RETRYABLE
    assert select(database, "SELECT count(*) FROM event") == [(0,)]
    assert select(database, "SELECT count(*) FROM capability_snapshot") == [(0,)]
    assert_all_closed(opened)


def test_a_rollback_that_fails_replaces_the_failure_it_was_undoing_with_its_own(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    value_of(write.store(database, {}))
    opened = track_connections(monkeypatch, failing_on("ROLLBACK", IO_ERROR))

    failure = write.store(database, write.changes)

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_lock_that_cannot_be_taken_for_a_reason_other_than_a_busy_one_is_not_retried(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    opened = track_connections(monkeypatch, failing_on("BEGIN IMMEDIATE", IO_ERROR))

    failure = write.store(database, {})

    assert refused(failure) == UNAVAILABLE
    assert len(opened) == 1
    assert_all_closed(opened)


def test_an_unexpected_exception_rolls_back_and_closes_and_is_not_turned_into_a_result(
    database: Path, monkeypatch: pytest.MonkeyPatch, write: Write
) -> None:
    opened = track_connections(monkeypatch, failing_on(write.failing, RuntimeError("a defect")))

    with pytest.raises(RuntimeError, match="a defect"):
        write.store(database, {})

    assert select(database, "SELECT count(*) FROM workspace") == [(0,)]
    assert select(database, "SELECT count(*) FROM capability_snapshot") == [(0,)]
    assert_all_closed(opened)


def test_a_prune_that_cannot_take_the_lock_is_skipped_by_the_repository_itself(database: Path) -> None:
    blocker = sqlite3.connect(database, autocommit=True)
    blocker.execute("BEGIN IMMEDIATE")
    try:
        result = SQLiteTelemetryRepository(database).prune_batch(
            now=NOW, limit=100, budget=Budget.start(FakeMonotonic(), 100)
        )
    finally:
        blocker.execute("ROLLBACK")
        blocker.close()

    assert value_of(result) == PruneResult("skipped")


def test_a_prune_that_fails_for_any_other_reason_is_returned_not_skipped(tmp_path: Path) -> None:
    broken = tmp_path / "ferret.sqlite3"
    broken.write_bytes(NOT_A_DATABASE)

    result = SQLiteTelemetryRepository(broken).prune_batch(
        now=NOW, limit=100, budget=Budget.start(FakeMonotonic(), 100)
    )

    assert refused(result) == INTEGRITY


def test_a_prune_with_no_time_left_is_skipped_without_opening_a_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    opened = track_connections(monkeypatch)
    clock = FakeMonotonic()
    budget = Budget.start(clock, 100)
    clock.advance(500)

    result = SQLiteTelemetryRepository(database).prune_batch(now=NOW, limit=100, budget=budget)

    assert (value_of(result), opened) == (PruneResult("skipped"), [])


@dataclass(frozen=True, slots=True)
class Read:
    """One read of the repositories, and a fragment of the statement it runs, which a failure can be injected on."""

    run: Callable[[Path], FerretResult[Any]]
    fragment: str


READS = {
    "last_completed_at": Read(lambda path: SQLiteTelemetryRepository(path).last_completed_at(), "maintenance_state"),
    "expiry_counters": Read(lambda path: SQLiteTelemetryRepository(path).expiry_counters(), "operational_counter"),
    "schema_number": Read(lambda path: SQLiteTelemetryRepository(path).schema_number(), "schema_migration"),
    "storage_facts": Read(lambda path: SQLiteTelemetryRepository(path).storage_facts(), "freelist_count"),
    "check_integrity": Read(
        lambda path: SQLiteTelemetryRepository(path).check_integrity(thorough=False), "quick_check"
    ),
    "counts": Read(
        lambda path: SQLiteTelemetryRepository(path).counts(now=NOW, near_expiry_within=timedelta(days=1)),
        "capability_snapshot",
    ),
    "find": Read(
        lambda path: SQLiteEventRepository(path).find("00000000-0000-4000-8000-000000000001", now=NOW), "FROM event"
    ),
    "read": Read(
        lambda path: SQLiteEventRepository(path).read(EVERYTHING, now=NOW, newest_first=True, after=None, limit=10),
        "FROM event",
    ),
    "latest_snapshot": Read(
        lambda path: SQLiteCapabilityRepository(path).latest_snapshot("codex", now=NOW), "capability_snapshot"
    ),
}


@pytest.fixture(params=list(READS))
def read(request: pytest.FixtureRequest) -> Read:
    return READS[request.param]


def test_a_read_answers_and_closes_its_connection(database: Path, monkeypatch: pytest.MonkeyPatch, read: Read) -> None:
    opened = track_connections(monkeypatch)

    value_of(read.run(database))

    assert_all_closed(opened)


def test_a_read_whose_statement_fails_is_an_unavailable_store_and_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch, read: Read
) -> None:
    opened = track_connections(monkeypatch, failing_on(read.fragment, IO_ERROR))

    failure = read.run(database)

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_read_that_finds_the_store_busy_answers_a_retryable_failure(
    database: Path, monkeypatch: pytest.MonkeyPatch, read: Read
) -> None:
    track_connections(monkeypatch, failing_on(read.fragment, BUSY))

    assert refused(read.run(database)) == RETRYABLE


def test_a_read_of_a_file_that_is_not_a_database_is_an_integrity_failure(tmp_path: Path, read: Read) -> None:
    broken = tmp_path / "ferret.sqlite3"
    broken.write_bytes(NOT_A_DATABASE)

    assert refused(read.run(broken)) == INTEGRITY


def test_a_connection_whose_pragmas_cannot_be_verified_is_an_unavailable_store(monkeypatch: pytest.MonkeyPatch) -> None:
    opened = track_connections(monkeypatch)

    # An in-memory database has no write-ahead log, so the journal-mode pragma is not honoured.
    failure = SQLiteTelemetryRepository(Path(":memory:")).schema_number()

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_database_path_that_cannot_be_sized_is_an_unavailable_store(tmp_path: Path) -> None:
    a_file = tmp_path / "a-file"
    a_file.write_bytes(b"")

    failure = SQLiteTelemetryRepository(a_file / "ferret.sqlite3").storage_facts()

    assert refused(failure) == UNAVAILABLE


def test_a_checkpoint_that_fails_is_an_unavailable_store_and_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    opened = track_connections(monkeypatch, failing_on("wal_checkpoint", IO_ERROR))

    failure = SQLiteTelemetryRepository(database).checkpoint()

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_compaction_that_cannot_start_is_an_unavailable_store_and_closes_its_connection(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    opened = track_connections(monkeypatch, failing_on("wal_autocheckpoint", IO_ERROR))

    failure = SQLiteTelemetryRepository(database).compact()

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_compaction_that_vacuum_refuses_is_a_failed_compaction_that_changes_nothing(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    before = database.read_bytes()
    opened = track_connections(monkeypatch, failing_on("VACUUM", IO_ERROR))

    compaction = value_of(SQLiteTelemetryRepository(database).compact())

    assert compaction.outcome == "failed"
    assert database.read_bytes() == before
    assert_all_closed(opened)


def test_a_schema_newer_than_this_build_is_refused_and_nothing_is_written(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    change(
        database,
        "INSERT INTO schema_migration (version, checksum, applied_at) VALUES (?, 'later', 'then')",
        LATEST_SCHEMA + 1,
    )
    before = select(database, "SELECT version, checksum FROM schema_migration ORDER BY version")
    opened = track_connections(monkeypatch)

    failure = SQLiteSchema(database, SystemClock()).migrate()

    assert refused(failure) == UNAVAILABLE
    assert select(database, "SELECT version, checksum FROM schema_migration ORDER BY version") == before
    assert_all_closed(opened)


def test_a_migration_whose_recorded_checksum_differs_is_an_integrity_failure_and_nothing_is_written(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    change(database, "UPDATE schema_migration SET checksum = 'tampered'")
    opened = track_connections(monkeypatch)

    failure = SQLiteSchema(database, SystemClock()).migrate()

    assert refused(failure) == INTEGRITY
    assert select(database, "SELECT checksum FROM schema_migration") == [("tampered",)]
    assert_all_closed(opened)


def test_a_migration_that_stops_part_way_rolls_back_every_statement_it_ran(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "ferret.sqlite3"
    change(path, "CREATE TABLE workspace (workspace_id TEXT)")
    opened = track_connections(monkeypatch)

    failure = SQLiteSchema(path, SystemClock()).migrate()

    # The migration creates ``schema_migration`` before it reaches the colliding ``workspace``, so it ran a statement.
    assert refused(failure) == UNAVAILABLE
    assert select(path, "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name") == [("workspace",)]
    assert_all_closed(opened)


def test_a_migration_whose_commit_fails_rolls_back_and_answers_the_translated_failure(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "ferret.sqlite3"
    opened = track_connections(monkeypatch, failing_on("COMMIT", BUSY))

    failure = SQLiteSchema(path, SystemClock()).migrate()

    assert refused(failure) == RETRYABLE
    assert select(path, "SELECT count(*) FROM sqlite_master WHERE type = 'table'") == [(0,)]
    assert_all_closed(opened)


def test_a_rollback_that_fails_during_a_migration_replaces_the_refusal_it_was_undoing(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    change(database, "UPDATE schema_migration SET checksum = 'tampered'")
    opened = track_connections(monkeypatch, failing_on("ROLLBACK", IO_ERROR))

    failure = SQLiteSchema(database, SystemClock()).migrate()

    assert refused(failure) == UNAVAILABLE
    assert_all_closed(opened)


def test_a_migration_that_cannot_take_its_lock_answers_the_translated_failure_and_closes(
    database: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    opened = track_connections(monkeypatch, failing_on("BEGIN IMMEDIATE", BUSY))

    failure = SQLiteSchema(database, SystemClock()).migrate()

    assert refused(failure) == RETRYABLE
    assert_all_closed(opened)


def test_an_unexpected_exception_during_a_migration_rolls_back_closes_and_propagates(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    path = tmp_path / "ferret.sqlite3"
    opened = track_connections(monkeypatch, failing_on("CREATE TABLE workspace", RuntimeError("a defect")))

    with pytest.raises(RuntimeError, match="a defect"):
        SQLiteSchema(path, SystemClock()).migrate()

    assert select(path, "SELECT count(*) FROM sqlite_master WHERE type = 'table'") == [(0,)]
    assert_all_closed(opened)


def test_a_migration_of_a_file_that_is_not_a_database_is_an_integrity_failure(tmp_path: Path) -> None:
    broken = tmp_path / "ferret.sqlite3"
    broken.write_bytes(NOT_A_DATABASE)

    assert refused(SQLiteSchema(broken, SystemClock()).migrate()) == INTEGRITY
