"""What a blocked writer may wait: the busy timeout the repository configures, never the wall clock it takes.

SQLite honours the busy timeout by sleeping in short steps and counting the nominal length of each, so on a host whose
timers stretch every sleep a 250 ms timeout really lasts far longer. A wall-clock bound in a test therefore measures the
machine. The plan fixes the timeout at 250 ms, and the one-second hook deadline is enforced by the wrapper watchdog.
"""

import sqlite3
from pathlib import Path

import pytest

from ferret.adapters import sqlite_repository
from ferret.adapters.sqlite_schema import connect

PLANNED_BUSY_TIMEOUT_MS = 250


def record_busy_timeouts(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    """Note the busy timeout of every connection a repository opens, as the connection itself reports it."""
    budgets: list[int] = []

    def connect_and_note(path: Path, *, busy_timeout_ms: int = PLANNED_BUSY_TIMEOUT_MS) -> sqlite3.Connection:
        connection = connect(path, busy_timeout_ms=busy_timeout_ms)
        budgets.append(connection.execute("PRAGMA busy_timeout").fetchone()[0])
        return connection

    monkeypatch.setattr(sqlite_repository, "connect", connect_and_note)
    return budgets
