"""SQLite connection policy and the numbered, transactional schema migrations packaged in the artifact."""

import hashlib
import sqlite3
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from typekit import Err, Ok

from ferret.application.ports import Clock, SchemaState
from ferret.domain.errors import FerretError, FerretResult, as_internal_failure
from ferret.domain.timestamps import format_timestamp

BUSY_TIMEOUT_MS = 250
# One attempt at the write lock gets this busy timeout, and the acquisition as a whole is capped by the caller's
# budget. SQLite's handler still does the waiting, because a bare retry loop starves a writer that keeps losing a
# burst; what it may not do is set the bound, since it applies to each of the sequential lock waits a
# BEGIN IMMEDIATE makes rather than to the acquisition, so one attempt costs a multiple of it.
LOCK_ATTEMPT_TIMEOUT_MS = 20
# How long taking the write lock may take when no caller states its own budget. A durable capture waits this long
# rather than dropping an event, and it stays under the one second every adapter call promises.
WRITE_LOCK_BUDGET_MS = 900
_SYNCHRONOUS_FULL = 2

_CLOSED_EVENT_TYPES = (
    "'session.started','session.ended','agent.started','agent.ended','skill.invoked',"
    "'tool.started','tool.completed','tool.failed'"
)
_CLOSED_VISIBILITY = "'observed','derived','unknown','not_applicable'"
_CLOSED_OUTCOMES = "'success','failure','cancelled','unknown','not_applicable'"


@dataclass(frozen=True, slots=True)
class Migration:
    """One forward-only schema step: its number and the statements it runs inside one transaction."""

    version: int
    statements: tuple[str, ...]

    @property
    def checksum(self) -> str:
        return hashlib.sha256("\n".join(self.statements).encode("utf-8")).hexdigest()


MIGRATIONS: tuple[Migration, ...] = (
    Migration(
        1,
        (
            "CREATE TABLE schema_migration ("
            " version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT",
            "CREATE TABLE workspace ("
            " workspace_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL) STRICT",
            "CREATE TABLE event ("
            " event_id TEXT PRIMARY KEY,"
            " event_hash TEXT NOT NULL,"
            " schema_version TEXT NOT NULL CHECK (schema_version = '1.0'),"
            " occurred_at TEXT NOT NULL,"
            " captured_at TEXT NOT NULL,"
            " expires_at TEXT NOT NULL,"
            " harness TEXT NOT NULL,"
            " harness_version TEXT,"
            " installation_id TEXT NOT NULL,"
            " workspace_id TEXT NOT NULL REFERENCES workspace (workspace_id),"
            " session_id TEXT NOT NULL,"
            " parent_session_id TEXT,"
            f" event_type TEXT NOT NULL CHECK (event_type IN ({_CLOSED_EVENT_TYPES})),"
            " agent_name TEXT,"
            " skill_name TEXT,"
            " tool_name TEXT,"
            f" outcome TEXT NOT NULL CHECK (outcome IN ({_CLOSED_OUTCOMES})),"
            " duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms BETWEEN 0 AND 86400000),"
            f" subject_visibility TEXT NOT NULL CHECK (subject_visibility IN ({_CLOSED_VISIBILITY})),"
            f" outcome_visibility TEXT NOT NULL CHECK (outcome_visibility IN ({_CLOSED_VISIBILITY})),"
            f" duration_visibility TEXT NOT NULL CHECK (duration_visibility IN ({_CLOSED_VISIBILITY}))"
            ") STRICT",
            "CREATE INDEX event_by_time ON event (occurred_at, event_id)",
            "CREATE INDEX event_by_harness_time ON event (harness, occurred_at, event_id)",
            "CREATE INDEX event_by_workspace_time ON event (workspace_id, occurred_at, event_id)",
            "CREATE INDEX event_by_type_time ON event (event_type, occurred_at, event_id)",
            "CREATE INDEX event_by_expiry ON event (expires_at, event_id)",
            "CREATE TABLE capability_snapshot ("
            " snapshot_id TEXT PRIMARY KEY,"
            " snapshot_hash TEXT NOT NULL,"
            " schema_version TEXT NOT NULL CHECK (schema_version = '1.0'),"
            " captured_at TEXT NOT NULL,"
            " expires_at TEXT NOT NULL,"
            " harness TEXT NOT NULL,"
            " harness_version TEXT,"
            " installation_id TEXT NOT NULL) STRICT",
            "CREATE INDEX capability_snapshot_by_harness ON capability_snapshot (harness, captured_at, snapshot_id)",
            "CREATE INDEX capability_snapshot_by_expiry ON capability_snapshot (expires_at, snapshot_id)",
            "CREATE TABLE capability_item ("
            " snapshot_id TEXT NOT NULL REFERENCES capability_snapshot (snapshot_id) ON DELETE CASCADE,"
            " capability_name TEXT NOT NULL,"
            " state TEXT NOT NULL CHECK (state IN ('observed','derived','unknown')),"
            " source TEXT NOT NULL CHECK (source IN ('official_hook','official_plugin','unavailable')),"
            " PRIMARY KEY (snapshot_id, capability_name)) STRICT",
            "CREATE TABLE maintenance_state ("
            " singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),"
            " last_started_at TEXT, last_completed_at TEXT, last_result TEXT) STRICT",
            "INSERT INTO maintenance_state (singleton_id) VALUES (1)",
            "CREATE TABLE operational_counter ("
            " name TEXT PRIMARY KEY, value INTEGER NOT NULL CHECK (value >= 0)) STRICT",
            "INSERT INTO operational_counter (name, value) VALUES ('expired_local_total', 0)",
            "INSERT INTO operational_counter (name, value) VALUES ('expired_before_ack_total', 0)",
        ),
    ),
)
LATEST_SCHEMA = MIGRATIONS[-1].version


def translate_error(error: sqlite3.Error) -> FerretError:
    """Map a SQLite failure onto the closed failure contract without carrying its message."""
    text = str(error).lower()
    if isinstance(error, sqlite3.OperationalError) and ("locked" in text or "busy" in text):
        return FerretError("ferret.storage.unavailable", retryable=True)
    if isinstance(error, sqlite3.DatabaseError) and not isinstance(error, sqlite3.OperationalError):
        return FerretError("ferret.storage.integrity-failure")
    if "malformed" in text or "not a database" in text or "corrupt" in text:
        return FerretError("ferret.storage.integrity-failure")
    return FerretError("ferret.storage.unavailable")


def connect(path: Path, *, busy_timeout_ms: int = BUSY_TIMEOUT_MS) -> FerretResult[sqlite3.Connection]:
    """Open one connection in autocommit mode with the four required pragmas applied and verified.

    A connection that cannot be opened or whose pragmas are not what was asked for is closed and returned as an ``Err``.
    """
    try:
        connection = sqlite3.connect(path, timeout=busy_timeout_ms / 1000, autocommit=True)
    except sqlite3.Error as error:
        return Err(translate_error(error))
    ready = _verified(connection, busy_timeout_ms)
    if isinstance(ready, Err):
        connection.close()
    return ready


def _verified(connection: sqlite3.Connection, busy_timeout_ms: int) -> FerretResult[sqlite3.Connection]:
    """The connection with its four pragmas applied and read back, or the failure of applying or reading one."""
    try:
        journal = connection.execute("PRAGMA journal_mode = WAL").fetchone()
        connection.execute("PRAGMA synchronous = FULL")
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute(f"PRAGMA busy_timeout = {int(busy_timeout_ms)}")
        honoured = (
            str(journal[0]).lower() == "wal",
            connection.execute("PRAGMA synchronous").fetchone()[0] == _SYNCHRONOUS_FULL,
            connection.execute("PRAGMA foreign_keys").fetchone()[0] == 1,
            connection.execute("PRAGMA busy_timeout").fetchone()[0] == busy_timeout_ms,
        )
    except sqlite3.Error as error:
        return Err(translate_error(error))
    if not all(honoured):
        return Err(FerretError("ferret.storage.unavailable"))
    return Ok(connection)


def run_on[T](connection: sqlite3.Connection, work: Callable[[sqlite3.Connection], FerretResult[T]]) -> FerretResult[T]:
    """Run ``work`` on ``connection``, closing it on every way out.

    A SQLite failure ``work`` or the close-out of a transaction raises is returned as the translated ``Err``. Any
    other exception propagates after the connection is closed.
    """
    try:
        return work(connection)
    except sqlite3.Error as error:
        return Err(translate_error(error))
    finally:
        connection.close()


def within_transaction[T](connection: sqlite3.Connection, work: Callable[[], FerretResult[T]]) -> FerretResult[T]:
    """Run ``work`` in the transaction ``connection`` has begun: ``COMMIT`` on an ``Ok``, ``ROLLBACK`` on anything else.

    Whatever the way out of ``work`` or of the ``COMMIT``, a transaction still open is rolled back. A SQLite failure
    raised by either is the caller's to translate, so this is for use inside ``run_on``, which does.
    """
    try:
        result = work()
        if isinstance(result, Ok):
            connection.execute("COMMIT")
        return result
    finally:
        if connection.in_transaction:
            connection.execute("ROLLBACK")


class SQLiteSchema:
    """Applies the packaged migrations to one database file."""

    def __init__(self, database_path: Path, clock: Clock) -> None:
        self._database_path = database_path
        self._clock = clock

    def migrate(self) -> FerretResult[SchemaState]:
        return connect(self._database_path).flat_map(lambda connection: run_on(connection, self._migrate))

    def _migrate(self, connection: sqlite3.Connection) -> FerretResult[SchemaState]:
        connection.execute("BEGIN IMMEDIATE")
        return within_transaction(connection, lambda: self._apply(connection))

    def _apply(self, connection: sqlite3.Connection) -> FerretResult[SchemaState]:
        known = connection.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migration'")
        applied: dict[int, str] = {}
        if known.fetchone() is not None:
            applied = {
                int(version): str(checksum)
                for version, checksum in connection.execute("SELECT version, checksum FROM schema_migration")
            }
        # A schema newer than this build is refused before anything is written.
        if applied and max(applied) > LATEST_SCHEMA:
            return Err(FerretError("ferret.storage.unavailable"))
        applied_now = False
        for migration in MIGRATIONS:
            if migration.version in applied:
                if applied[migration.version] != migration.checksum:
                    return Err(FerretError("ferret.storage.integrity-failure"))
                continue
            for statement in migration.statements:
                connection.execute(statement)
            recorded = self._record(connection, migration)
            if isinstance(recorded, Err):
                return recorded
            applied_now = True
        return Ok(SchemaState(number=LATEST_SCHEMA, applied_now=applied_now))

    def _record(self, connection: sqlite3.Connection, migration: Migration) -> FerretResult[None]:
        """Note in the database that ``migration`` ran, and when."""
        applied_at = format_timestamp(self._clock.now()).map_err(as_internal_failure)
        if isinstance(applied_at, Err):
            return applied_at
        connection.execute(
            "INSERT INTO schema_migration (version, checksum, applied_at) VALUES (?, ?, ?)",
            (migration.version, migration.checksum, applied_at.value),
        )
        return Ok(None)
