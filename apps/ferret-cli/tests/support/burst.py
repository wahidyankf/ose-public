"""Concurrent bursts of unique captures from several repositories against one real store.

Two shapes: threads calling the event repository directly, for the repository's own tests, and one in-tree CLI
process per event, one adapter per harness, for the behaviour that names the whole ``capture`` command.
"""

import json
import sqlite3
import subprocess
import sys
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
from support.events import encode, event_document

REPOSITORY_COUNT = 3
BURST_SIZE = 20
NOW = datetime(2026, 9, 18, 8, 15, 31, tzinfo=UTC)
HARNESSES = ("claude_code", "codex", "opencode")
PROCESS_BURST_SIZE = 10
SOURCE = Path(__file__).resolve().parents[2] / "src"
# The child is this working tree's source run by the interpreter running the tests, exactly as `ferret` would be.
RUNNER = (
    "import sys; sys.path.insert(0, sys.argv[1]); from ferret.cli import main; raise SystemExit(main(sys.argv[2:]))"
)
# A child that has not returned by now is hung rather than late; the timing assertion is the bound under test.
HUNG_SECONDS = 30.0


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


@dataclass(frozen=True, slots=True)
class ProcessCapture:
    """One ``ferret capture --json`` process: the event it was given, what it printed, and how long it took."""

    document: dict[str, Any]
    code: int
    stdout: bytes
    stderr: bytes
    elapsed: float

    @property
    def result(self) -> str | None:
        return json.loads(self.stdout)["result"] if self.stdout else None


def burst_document(adapter: int, sequence: int, moment: str) -> dict[str, Any]:
    """One adapter's event at ``moment``: its own harness, its repository's workspace, and an ID no other adapter uses.

    The moment is the real clock's, because the child processes read the real clock and a stale event would be refused.
    """
    return event_document(
        eventId=event_id(adapter, sequence),
        harness=HARNESSES[adapter],
        workspaceId=workspace_id(adapter),
        occurredAt=moment,
        capturedAt=moment,
    )


def expected_process_rows(moment: str, size: int = PROCESS_BURST_SIZE) -> list[dict[str, Any]]:
    """The row every burst event must leave behind, read from the document it was submitted as."""
    rows = [
        {
            "event_id": document["eventId"],
            "event_hash": document["eventHash"],
            "harness": document["harness"],
            "workspace_id": document["workspaceId"],
            "occurred_at": document["occurredAt"],
            "session_id": document["sessionId"],
            "tool_name": document["toolName"],
        }
        for adapter in range(len(HARNESSES))
        for sequence in range(size)
        for document in (burst_document(adapter, sequence, moment),)
    ]
    return sorted(rows, key=lambda row: row["event_id"])


def stored_process_rows(database: Path) -> list[dict[str, Any]]:
    """Every event row, read with plain ``sqlite3`` independently of the code under test."""
    with closing(sqlite3.connect(database)) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(
            "SELECT event_id, event_hash, harness, workspace_id, occurred_at, session_id, tool_name"
            " FROM event ORDER BY event_id"
        )
        return [dict(row) for row in cursor]


def capture_process(home: Path, repository: Path, document: dict[str, Any]) -> ProcessCapture:
    """Run ``ferret capture --json`` from ``repository`` with ``document`` on standard input, timed end to end.

    ``subprocess.run(timeout=...)`` waits by polling with growing sleeps that would be added to the measured time, so
    a timer kills a hung child instead and the wait stays exact.
    """
    started = time.monotonic()
    with subprocess.Popen(  # the interpreter is the one running these tests; the source is this working tree's
        [sys.executable, "-c", RUNNER, str(SOURCE), "capture", "--json"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=repository,
        env={"HOME": str(home), "PATH": "/usr/bin:/bin"},
    ) as process:
        guard = threading.Timer(HUNG_SECONDS, process.kill)
        guard.start()
        try:
            stdout, stderr = process.communicate(encode(document))
        finally:
            guard.cancel()
        elapsed = time.monotonic() - started
    return ProcessCapture(document, process.returncode, stdout, stderr, elapsed)


def run_process_burst(
    home: Path, repositories: tuple[Path, ...], moment: str, *, size: int = PROCESS_BURST_SIZE
) -> list[list[ProcessCapture]]:
    """Each adapter captures its burst from its own repository, one process at a time, alongside the others.

    The adapters are released together by a barrier so their processes overlap. A worker's exception is re-raised
    when its result is collected, so a failure to run a child fails the caller.
    """
    barrier = threading.Barrier(len(repositories))

    def adapter_burst(adapter: int) -> list[ProcessCapture]:
        barrier.wait()
        return [
            capture_process(home, repositories[adapter], burst_document(adapter, sequence, moment))
            for sequence in range(size)
        ]

    with ThreadPoolExecutor(max_workers=len(repositories)) as pool:
        return list(pool.map(adapter_burst, range(len(repositories))))
