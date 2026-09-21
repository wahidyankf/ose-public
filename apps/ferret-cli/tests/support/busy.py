"""What a blocked writer may wait: a short busy timeout per attempt, under a budget measured on a monotonic clock.

SQLite's busy timeout bounds each of the sequential lock waits a ``BEGIN IMMEDIATE`` makes, not the acquisition, so one
attempt costs a multiple of it and a budget expressed as a busy timeout overruns several-fold. The repository therefore
retries with a short attempt timeout and stops when the caller's budget is spent. These helpers observe both halves:
the timeout every attempt is opened with, and the clock the acquisition reads. Neither measures the host, because the
clock is injectable, so the bound is asserted deterministically rather than by timing the machine.
"""

import sqlite3
from pathlib import Path

import pytest

from ferret.adapters import sqlite_repository
from ferret.adapters.sqlite_schema import connect

PLANNED_BUSY_TIMEOUT_MS = 250
PLANNED_ATTEMPT_TIMEOUT_MS = 20


class SteppingClock:
    """A monotonic clock that advances a fixed step each reading, so a budget is spent after a known number of them."""

    def __init__(self, step_seconds: float) -> None:
        self._step = step_seconds
        self._now = 0.0
        self.readings = 0

    def monotonic(self) -> float:
        self.readings += 1
        now = self._now
        self._now += self._step
        return now


def stepping_clock(monkeypatch: pytest.MonkeyPatch, step_seconds: float) -> SteppingClock:
    """Make the repository read ``clock`` instead of the host's, leaving every other use of ``time`` alone."""
    clock = SteppingClock(step_seconds)
    monkeypatch.setattr(sqlite_repository.time, "monotonic", clock.monotonic, raising=True)
    return clock


def record_busy_timeouts(monkeypatch: pytest.MonkeyPatch) -> list[int]:
    """Note the busy timeout of every connection a repository opens, as the connection itself reports it."""
    budgets: list[int] = []

    def connect_and_note(path: Path, *, busy_timeout_ms: int = PLANNED_BUSY_TIMEOUT_MS) -> sqlite3.Connection:
        connection = connect(path, busy_timeout_ms=busy_timeout_ms)
        budgets.append(connection.execute("PRAGMA busy_timeout").fetchone()[0])
        return connection

    monkeypatch.setattr(sqlite_repository, "connect", connect_and_note)
    return budgets
