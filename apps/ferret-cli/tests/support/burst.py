"""A concurrent burst of unique captures from several repositories against one real database."""

import sqlite3
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ferret.adapters.sqlite_repository import SQLiteEventRepository
from ferret.domain.event import event_from_document
from support.events import event_document

REPOSITORY_COUNT = 3
BURST_SIZE = 20
NOW = datetime(2026, 9, 18, 8, 15, 31, tzinfo=UTC)


@dataclass(frozen=True, slots=True)
class Capture:
    """One capture call: which event, what the repository reported, and how long it took."""

    event_id: str
    result: str
    elapsed: float


def event_id(repository: int, sequence: int) -> str:
    return f"00000000-0000-4000-8000-{repository:04x}{sequence:08x}"


def workspace_id(repository: int) -> str:
    return f"ws_{repository + 1:032x}"


def expected_rows(repositories: int = REPOSITORY_COUNT, size: int = BURST_SIZE) -> list[dict[str, Any]]:
    """The row every burst event must leave behind: its ID, its recomputed hash, and its repository's workspace."""
    rows: list[dict[str, Any]] = []
    for repository in range(repositories):
        for sequence in range(size):
            document = event_document(eventId=event_id(repository, sequence), workspaceId=workspace_id(repository))
            rows.append(
                {
                    "event_id": document["eventId"],
                    "event_hash": document["eventHash"],
                    "workspace_id": document["workspaceId"],
                }
            )
    return sorted(rows, key=lambda row: row["event_id"])


def stored_rows(database: Path) -> list[dict[str, Any]]:
    with closing(sqlite3.connect(database)) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute("SELECT event_id, event_hash, workspace_id FROM event ORDER BY event_id")
        return [dict(row) for row in cursor]


def integrity_check(database: Path) -> list[tuple[str]]:
    with closing(sqlite3.connect(database)) as connection:
        return connection.execute("PRAGMA integrity_check").fetchall()


def run_burst(database: Path, *, repositories: int = REPOSITORY_COUNT, size: int = BURST_SIZE) -> list[list[Capture]]:
    """Each repository is one thread with its own repository object and connections, released together by a barrier.

    A worker's exception is re-raised when its result is collected, so a failed capture fails the caller.
    """
    barrier = threading.Barrier(repositories)

    def worker(repository: int) -> list[Capture]:
        events = SQLiteEventRepository(database)
        barrier.wait()
        captures: list[Capture] = []
        for sequence in range(size):
            document = event_document(eventId=event_id(repository, sequence), workspaceId=workspace_id(repository))
            event = event_from_document(document, now=NOW)
            started = time.perf_counter()
            result = events.capture(event)
            captures.append(Capture(event.event_id, result, time.perf_counter() - started))
        return captures

    with ThreadPoolExecutor(max_workers=repositories) as pool:
        return list(pool.map(worker, range(repositories)))
