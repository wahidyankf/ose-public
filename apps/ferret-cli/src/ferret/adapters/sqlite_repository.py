"""The SQLite repositories: one short write transaction per stored event, capability snapshot, or bounded prune."""

import sqlite3
import time
from collections.abc import Generator, Mapping, Sequence
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Literal

from ferret.adapters.sqlite_schema import (
    BUSY_TIMEOUT_MS,
    LOCK_ATTEMPT_TIMEOUT_MS,
    WRITE_LOCK_BUDGET_MS,
    connect,
    translate_error,
)
from ferret.application.ports import Budget, CaptureResult, Compaction, ExpiryCounters, PruneResult, StoreCounts
from ferret.domain.capability import Capability, CapabilitySnapshot
from ferret.domain.errors import FerretError
from ferret.domain.event import Event
from ferret.domain.identity import resolve_identity
from ferret.domain.query import EventCriteria, Position
from ferret.domain.space import StorageFacts
from ferret.domain.timestamps import format_timestamp

_UPSERT_WORKSPACE = (
    "INSERT INTO workspace (workspace_id, first_seen_at, last_seen_at) VALUES (?, ?, ?)"
    " ON CONFLICT (workspace_id) DO UPDATE SET"
    " first_seen_at = MIN(first_seen_at, excluded.first_seen_at),"
    " last_seen_at = MAX(last_seen_at, excluded.last_seen_at)"
)
_SELECT_HASH = "SELECT event_hash FROM event WHERE event_id = ?"
_INSERT_EVENT = (
    "INSERT INTO event ("
    "event_id, event_hash, schema_version, occurred_at, captured_at, expires_at, harness, harness_version,"
    " installation_id, workspace_id, session_id, parent_session_id, event_type, agent_name, skill_name, tool_name,"
    " outcome, duration_ms, subject_visibility, outcome_visibility, duration_visibility"
    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
)
# The columns an ``Event`` is built from, in the order of its fields, so a row becomes an event positionally.
_EVENT_COLUMNS = (
    "schema_version, event_id, event_hash, occurred_at, captured_at, harness, harness_version, installation_id,"
    " workspace_id, session_id, parent_session_id, event_type, agent_name, skill_name, tool_name, outcome,"
    " duration_ms, subject_visibility, outcome_visibility, duration_visibility"
)
_SELECT_LIVE = f"SELECT {_EVENT_COLUMNS} FROM event WHERE event_id = ? AND expires_at > ?"
# The stored column and the criteria attribute of each exact-match filter.
_EXACT_FILTERS = (
    ("harness", "harness"),
    ("workspace_id", "workspace"),
    ("event_type", "event_type"),
    ("agent_name", "agent"),
    ("skill_name", "skill"),
    ("tool_name", "tool"),
    ("outcome", "outcome"),
)

_SELECT_SNAPSHOT_HASH = "SELECT snapshot_hash FROM capability_snapshot WHERE snapshot_id = ?"
_INSERT_SNAPSHOT = (
    "INSERT INTO capability_snapshot ("
    "snapshot_id, snapshot_hash, schema_version, captured_at, expires_at, harness, harness_version, installation_id"
    ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
)
_INSERT_ITEM = "INSERT INTO capability_item (snapshot_id, capability_name, state, source) VALUES (?, ?, ?, ?)"
# One statement, so the header and its items come from one consistent read even while maintenance prunes. The unary
# plus keeps the planner on the harness index that supplies the order rather than on the expiry index.
_SELECT_LATEST = (
    "SELECT s.snapshot_id, s.snapshot_hash, s.schema_version, s.captured_at, s.harness_version, s.installation_id,"
    " i.capability_name, i.state, i.source"
    " FROM (SELECT snapshot_id, snapshot_hash, schema_version, captured_at, harness_version, installation_id"
    " FROM capability_snapshot WHERE harness = ? AND +expires_at > ?"
    " ORDER BY captured_at DESC, snapshot_id DESC LIMIT 1)"
    " AS s LEFT JOIN capability_item AS i ON i.snapshot_id = s.snapshot_id ORDER BY i.capability_name"
)

# Expired rows in prune order, served by the two expiry indexes. A snapshot's items go with it through the foreign
# key's cascade, and a workspace goes once no event refers to it.
_EXPIRED_EVENTS = "SELECT event_id FROM event WHERE expires_at <= ? ORDER BY expires_at, event_id LIMIT ?"
_EXPIRED_SNAPSHOTS = (
    "SELECT snapshot_id FROM capability_snapshot WHERE expires_at <= ? ORDER BY expires_at, snapshot_id LIMIT ?"
)
_DELETE_EVENT = "DELETE FROM event WHERE event_id = ?"
_DELETE_SNAPSHOT = "DELETE FROM capability_snapshot WHERE snapshot_id = ?"
_DELETE_ORPHAN_WORKSPACES = (
    "DELETE FROM workspace WHERE NOT EXISTS (SELECT 1 FROM event WHERE event.workspace_id = workspace.workspace_id)"
)
_ANY_EXPIRED = (
    "SELECT EXISTS (SELECT 1 FROM event WHERE expires_at <= ?)"
    " OR EXISTS (SELECT 1 FROM capability_snapshot WHERE expires_at <= ?)"
)
_ADD_EXPIRED = "UPDATE operational_counter SET value = value + ? WHERE name = 'expired_local_total'"
_MARK_COMPLETED = (
    "UPDATE maintenance_state SET last_started_at = ?, last_completed_at = ?, last_result = 'completed'"
    " WHERE singleton_id = 1"
)
_SELECT_MARKER = "SELECT last_completed_at FROM maintenance_state WHERE singleton_id = 1"
_SELECT_COUNTERS = "SELECT name, value FROM operational_counter"
_SELECT_SCHEMA = "SELECT max(version) FROM schema_migration"
_SELECT_FREE_BYTES = (
    "SELECT (SELECT freelist_count FROM pragma_freelist_count) * (SELECT page_size FROM pragma_page_size)"
)
# Live rows are those not expired at :now. The oldest live capture is the first live row in expiry order, because a
# row expires a fixed span after it was captured, so the expiry index answers it without a scan of the table.
_SELECT_COUNTS = (
    "SELECT"
    " (SELECT count(*) FROM event WHERE expires_at > :now),"
    " (SELECT count(*) FROM capability_snapshot WHERE expires_at > :now),"
    " (SELECT captured_at FROM event WHERE expires_at > :now ORDER BY expires_at, event_id LIMIT 1),"
    " (SELECT count(*) FROM event WHERE expires_at > :now AND expires_at <= :near)"
    " + (SELECT count(*) FROM capability_snapshot WHERE expires_at > :now AND expires_at <= :near),"
    " (SELECT count(*) FROM event WHERE expires_at <= :now)"
    " + (SELECT count(*) FROM capability_snapshot WHERE expires_at <= :now)"
)


def read_statement(
    criteria: EventCriteria, *, now: datetime, newest_first: bool, after: Position | None, limit: int
) -> tuple[str, tuple[str | int, ...]]:
    """The one parameterized statement behind an event read, and its parameters.

    Only column names taken from a fixed table are ever written into the text; every value is a parameter. The order
    is the ``(occurred_at, event_id)`` index order, so a page is found by walking an index rather than sorting. The
    unary plus keeps the planner from choosing the expiry index for the retention test, which would force a sort.
    """
    conditions = ["+expires_at > ?"]
    parameters: list[str | int] = [format_timestamp(now)]
    if criteria.start is not None:
        conditions.append("occurred_at >= ?")
        parameters.append(criteria.start)
    if criteria.end is not None:
        conditions.append("occurred_at < ?")
        parameters.append(criteria.end)
    for column, attribute in _EXACT_FILTERS:
        value: str | None = getattr(criteria, attribute)
        if value is not None:
            conditions.append(f"{column} = ?")
            parameters.append(value)
    if after is not None:
        conditions.append(f"(occurred_at, event_id) {'<' if newest_first else '>'} (?, ?)")
        parameters.extend((after.occurred_at, after.event_id))
    direction = "DESC" if newest_first else "ASC"
    parameters.append(limit)
    return (
        f"SELECT {_EVENT_COLUMNS} FROM event WHERE {' AND '.join(conditions)}"
        f" ORDER BY occurred_at {direction}, event_id {direction} LIMIT ?",
        tuple(parameters),
    )


def _fetch(
    database_path: Path, statement: str, parameters: Sequence[str | int] | Mapping[str, str | int] = ()
) -> list[tuple[Any, ...]]:
    """One consistent read on a fresh verified connection that is closed before its rows are returned."""
    connection = connect(database_path)
    try:
        return connection.execute(statement, parameters).fetchall()
    except sqlite3.Error as error:
        raise translate_error(error) from None
    finally:
        connection.close()


def _size(path: Path) -> int:
    """The size of one file, zero when it does not exist, as the log does not while no connection keeps it alive."""
    try:
        return path.stat().st_size
    except FileNotFoundError:
        return 0
    except OSError:
        raise FerretError("storage_unavailable") from None


def _file_sizes(database_path: Path) -> tuple[int, int]:
    """The database file's bytes and its write-ahead log's bytes."""
    return _size(database_path), _size(Path(f"{database_path}-wal"))


def _acquire(database_path: Path, *, budget_ms: int) -> sqlite3.Connection:
    """One verified connection holding the write lock, taken inside a real wall-clock budget.

    SQLite's busy timeout is not a bound on how long ``BEGIN IMMEDIATE`` takes: a contended acquisition runs several
    sequential lock waits and each one is given the whole timeout, so a single attempt costs a multiple of it. A
    budget expressed only as a busy timeout therefore overruns, which is what pushed the capture hook past the
    deadline its acceptance criterion states. Each attempt here gets a short busy timeout instead, so SQLite's own
    handler still does the waiting and a writer contending with a burst is not starved by a bare retry loop, while
    the caller's budget bounds the acquisition. Once the lock is held the connection gets the ordinary busy timeout
    back, so a statement inside the transaction still waits for a checkpointer rather than failing on it.
    """
    deadline = time.monotonic() + budget_ms / 1000
    attempt_ms = min(LOCK_ATTEMPT_TIMEOUT_MS, budget_ms)
    while True:
        connection = connect(database_path, busy_timeout_ms=attempt_ms)
        try:
            connection.execute("BEGIN IMMEDIATE")
        except sqlite3.Error as error:
            connection.close()
            failure = translate_error(error)
            if not failure.retryable or time.monotonic() >= deadline:
                raise failure from None
        else:
            connection.execute(f"PRAGMA busy_timeout = {int(BUSY_TIMEOUT_MS)}")
            return connection


@contextmanager
def _write_transaction(database_path: Path, *, budget_ms: int = WRITE_LOCK_BUDGET_MS) -> Generator[sqlite3.Connection]:
    """One verified connection inside one ``BEGIN IMMEDIATE`` transaction.

    The transaction commits when the block finishes and rolls back on any failure, and the connection is closed on
    every path. A SQLite failure is translated onto the closed failure contract without carrying its message.
    ``budget_ms`` is how long the wait for the write lock may last, measured on the monotonic clock.
    """
    connection = _acquire(database_path, budget_ms=budget_ms)
    try:
        try:
            yield connection
            connection.execute("COMMIT")
        except BaseException:
            if connection.in_transaction:
                connection.execute("ROLLBACK")
            raise
    except sqlite3.Error as error:
        raise translate_error(error) from None
    finally:
        connection.close()


class SQLiteEventRepository:
    """Stores events in one database file, opening a fresh verified connection for each capture.

    A capture is one short ``BEGIN IMMEDIATE`` transaction that looks the event ID up, applies the identity policy,
    and inserts the workspace and event together or not at all, so a concurrent writer never observes or leaves a
    partial row.
    """

    def __init__(self, database_path: Path) -> None:
        self._database_path = database_path

    def capture(self, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        budget_ms = WRITE_LOCK_BUDGET_MS if budget is None else budget.remaining_ms()
        with _write_transaction(self._database_path, budget_ms=budget_ms) as connection:
            return self._capture(connection, event)

    def read(
        self, criteria: EventCriteria, *, now: datetime, newest_first: bool, after: Position | None, limit: int
    ) -> tuple[Event, ...]:
        statement, parameters = read_statement(criteria, now=now, newest_first=newest_first, after=after, limit=limit)
        return self._select(statement, parameters)

    def find(self, event_id: str, *, now: datetime) -> Event | None:
        found = self._select(_SELECT_LIVE, (event_id, format_timestamp(now)))
        return found[0] if found else None

    def _select(self, statement: str, parameters: tuple[str | int, ...]) -> tuple[Event, ...]:
        return tuple(Event(*row) for row in _fetch(self._database_path, statement, parameters))

    def _capture(self, connection: sqlite3.Connection, event: Event) -> CaptureResult:
        row = connection.execute(_SELECT_HASH, (event.event_id,)).fetchone()
        if resolve_identity(None if row is None else str(row[0]), event.event_hash) == "duplicate":
            return "duplicate"
        self._store(connection, event)
        return "stored"

    @staticmethod
    def _store(connection: sqlite3.Connection, event: Event) -> None:
        connection.execute(_UPSERT_WORKSPACE, (event.workspace_id, event.captured_at, event.captured_at))
        connection.execute(
            _INSERT_EVENT,
            (
                event.event_id,
                event.event_hash,
                event.schema_version,
                event.occurred_at,
                event.captured_at,
                event.expires_at,
                event.harness,
                event.harness_version,
                event.installation_id,
                event.workspace_id,
                event.session_id,
                event.parent_session_id,
                event.event_type,
                event.agent_name,
                event.skill_name,
                event.tool_name,
                event.outcome,
                event.duration_ms,
                event.subject_visibility,
                event.outcome_visibility,
                event.duration_visibility,
            ),
        )


class SQLiteCapabilityRepository:
    """Stores capability snapshots in one database file, each with its items in a single write transaction.

    The snapshot ID is the only identity: an unseen ID is inserted, the same ID and hash is a duplicate, and the same
    ID with a different hash is a conflict that changes nothing. The hash is not a uniqueness key, so equal content
    under two IDs is two snapshots. Items are keyed by ``(snapshot_id, capability_name)`` and go with their snapshot.
    """

    def __init__(self, database_path: Path) -> None:
        self._database_path = database_path

    def store_snapshot(self, snapshot: CapabilitySnapshot) -> CaptureResult:
        with _write_transaction(self._database_path) as connection:
            row = connection.execute(_SELECT_SNAPSHOT_HASH, (snapshot.snapshot_id,)).fetchone()
            if resolve_identity(None if row is None else str(row[0]), snapshot.snapshot_hash) == "duplicate":
                return "duplicate"
            connection.execute(
                _INSERT_SNAPSHOT,
                (
                    snapshot.snapshot_id,
                    snapshot.snapshot_hash,
                    snapshot.schema_version,
                    snapshot.captured_at,
                    snapshot.expires_at,
                    snapshot.harness,
                    snapshot.harness_version,
                    snapshot.installation_id,
                ),
            )
            connection.executemany(
                _INSERT_ITEM,
                [(snapshot.snapshot_id, item.name, item.state, item.source) for item in snapshot.capabilities],
            )
            return "stored"

    def latest_snapshot(self, harness: str, *, now: datetime) -> CapabilitySnapshot | None:
        found = _fetch(self._database_path, _SELECT_LATEST, (harness, format_timestamp(now)))
        if not found:
            return None
        snapshot_id, hash_, schema_version, captured_at, harness_version, installation_id = found[0][:6]
        return CapabilitySnapshot(
            schema_version=schema_version,
            snapshot_id=snapshot_id,
            snapshot_hash=hash_,
            captured_at=captured_at,
            harness=harness,
            harness_version=harness_version,
            installation_id=installation_id,
            capabilities=tuple(Capability(row[6], row[7], row[8]) for row in found if row[6] is not None),
        )


class SQLiteTelemetryRepository:
    """Retention and its bookkeeping in one database file: the completion marker, the counters, and the bounded prune.

    A prune is one ``BEGIN IMMEDIATE`` transaction on its own connection, opened with what is left of the caller's
    budget as its busy timeout, so the wait for the write lock is charged to that budget. The rows it deletes, the
    counter increment that accounts for them, and any move of the marker commit together or not at all.
    """

    def __init__(self, database_path: Path) -> None:
        self._database_path = database_path

    def last_completed_at(self) -> str | None:
        rows = _fetch(self._database_path, _SELECT_MARKER)
        return rows[0][0] if rows else None

    def expiry_counters(self) -> ExpiryCounters:
        counters = {str(name): int(value) for name, value in _fetch(self._database_path, _SELECT_COUNTERS)}
        return ExpiryCounters(counters.get("expired_local_total", 0), counters.get("expired_before_ack_total", 0))

    def schema_number(self) -> int:
        return int(_fetch(self._database_path, _SELECT_SCHEMA)[0][0])

    def storage_facts(self) -> StorageFacts:
        # The files are sized before a connection is opened: closing the last connection folds the log away.
        database_bytes, wal_bytes = _file_sizes(self._database_path)
        return StorageFacts(database_bytes, wal_bytes, int(_fetch(self._database_path, _SELECT_FREE_BYTES)[0][0]))

    def counts(self, *, now: datetime, near_expiry_within: timedelta) -> StoreCounts:
        parameters = {"now": format_timestamp(now), "near": format_timestamp(now + near_expiry_within)}
        events, snapshots, oldest, near_expiry, logically_expired = _fetch(
            self._database_path, _SELECT_COUNTS, parameters
        )[0]
        return StoreCounts(events, snapshots, oldest, near_expiry, logically_expired)

    def check_integrity(self, *, thorough: bool) -> bool:
        rows = _fetch(self._database_path, "PRAGMA integrity_check" if thorough else "PRAGMA quick_check")
        return [tuple(row) for row in rows] == [("ok",)]

    def checkpoint(self) -> Literal["truncated", "skipped"]:
        # No busy timeout: a reader or writer that holds the log makes the checkpoint report busy instead of waiting.
        connection = connect(self._database_path, busy_timeout_ms=0)
        try:
            busy = int(connection.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()[0])
        except sqlite3.Error as error:
            raise translate_error(error) from None
        finally:
            connection.close()
        return "skipped" if busy else "truncated"

    def compact(self) -> Compaction:
        """Rewrite the file with ``VACUUM``, which is transactional: an interrupted or failed one changes no byte."""
        connection = connect(self._database_path)
        try:
            # The rewrite goes through the log. Without an automatic checkpoint the old file and the whole rewritten
            # log are both on disk when it commits, which is the run's peak, and the caller folds the log away next.
            connection.execute("PRAGMA wal_autocheckpoint = 0")
            try:
                connection.execute("VACUUM")
            except sqlite3.Error:
                measured = None
            else:
                free_bytes = int(connection.execute(_SELECT_FREE_BYTES).fetchone()[0])
                measured = StorageFacts(*_file_sizes(self._database_path), free_bytes)
        except sqlite3.Error as error:
            raise translate_error(error) from None
        finally:
            connection.close()
        if measured is None:
            return Compaction("failed", self.storage_facts())
        return Compaction("compacted", measured)

    def prune_batch(self, *, now: datetime, limit: int, budget: Budget) -> PruneResult:
        remaining_ms = budget.remaining_ms()
        if remaining_ms == 0:
            return PruneResult("skipped")
        try:
            with _write_transaction(self._database_path, budget_ms=remaining_ms) as connection:
                return self._prune(connection, format_timestamp(now), limit, budget)
        except FerretError as error:
            # A lock that could not be taken in time, or a transaction that lost it, changed nothing: skip.
            if error.retryable:
                return PruneResult("skipped")
            raise

    @staticmethod
    def _prune(connection: sqlite3.Connection, horizon: str, limit: int, budget: Budget) -> PruneResult:
        event_ids = [row[0] for row in connection.execute(_EXPIRED_EVENTS, (horizon, limit))]
        snapshot_ids = [row[0] for row in connection.execute(_EXPIRED_SNAPSHOTS, (horizon, limit - len(event_ids)))]
        doomed = [(_DELETE_EVENT, identifier) for identifier in event_ids]
        doomed += [(_DELETE_SNAPSHOT, identifier) for identifier in snapshot_ids]
        deleted = 0
        for statement, identifier in doomed:
            if budget.spent():
                break
            connection.execute(statement, (identifier,))
            deleted += 1
        if deleted:
            connection.execute(_ADD_EXPIRED, (deleted,))
        workspaces = connection.execute(_DELETE_ORPHAN_WORKSPACES).rowcount
        remaining = bool(connection.execute(_ANY_EXPIRED, (horizon, horizon)).fetchone()[0])
        completed = deleted == 0 and not remaining
        if completed:
            connection.execute(_MARK_COMPLETED, (horizon, horizon))
        events = min(deleted, len(event_ids))
        return PruneResult(
            "pruned",
            events=events,
            snapshots=deleted - events,
            workspaces=workspaces,
            remaining=remaining,
            completed=completed,
        )
