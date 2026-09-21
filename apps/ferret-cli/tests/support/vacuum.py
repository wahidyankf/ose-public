"""A compaction that SQLite itself interrupts part-way through, as a full disk or a killed process would."""

import sqlite3
from pathlib import Path
from typing import Any

import pytest

from ferret.adapters import sqlite_repository
from ferret.adapters.sqlite_schema import connect
from support.busy import PLANNED_BUSY_TIMEOUT_MS


class InterruptedVacuum:
    """A real connection whose ``VACUUM`` SQLite aborts after its first few steps; everything else is untouched."""

    def __init__(self, real: sqlite3.Connection) -> None:
        self._real = real

    def execute(self, statement: str, *arguments: Any) -> sqlite3.Cursor:
        if statement.strip().upper() == "VACUUM":
            self._real.set_progress_handler(lambda: 1, 1)
        return self._real.execute(statement, *arguments)

    def __getattr__(self, name: str) -> Any:
        return getattr(self._real, name)


def interrupt_every_vacuum(monkeypatch: pytest.MonkeyPatch) -> None:
    """Make every connection the SQLite adapters open abort the compaction it runs, until the patch is undone."""

    def connect_and_interrupt(path: Path, *, busy_timeout_ms: int = PLANNED_BUSY_TIMEOUT_MS) -> InterruptedVacuum:
        return InterruptedVacuum(connect(path, busy_timeout_ms=busy_timeout_ms))

    monkeypatch.setattr(sqlite_repository, "connect", connect_and_interrupt)
