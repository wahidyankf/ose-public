"""A real temporary machine: an isolated HOME whose store is created and filled through the real adapters."""

import io
import sqlite3
from collections.abc import Iterable, Sequence
from contextlib import closing
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Any

from ferret import cli
from ferret.adapters.system import system_runtime
from ferret.application.initialization import initialize_store
from ferret.application.ports import Clock, Monotonic, Runtime
from ferret.commands import build_handlers
from ferret.domain.event import Event
from ferret.domain.storage import DATABASE_FILE
from support.invoke import Ran


@dataclass(frozen=True, slots=True)
class Machine:
    """One isolated HOME with its own real data home, SQLite database, clock, and randomness.

    A test that needs a fixed wall clock or a controllable monotonic clock supplies one; the rest stays real.
    """

    home: Path
    clock: Clock | None = None
    monotonic: Monotonic | None = None
    artifact: Path | None = None
    path: str = ""

    @property
    def data_home(self) -> Path:
        return self.home / ".ferret"

    @property
    def database(self) -> Path:
        return self.data_home / DATABASE_FILE

    def runtime(self, stdin: bytes | None = None) -> Runtime:
        real = system_runtime(
            {"HOME": str(self.home), "PATH": self.path},
            stdin=None if stdin is None else io.BytesIO(stdin),
            artifact=self.artifact,
        )
        return replace(
            real,
            clock=real.clock if self.clock is None else self.clock,
            monotonic=real.monotonic if self.monotonic is None else self.monotonic,
        )

    def sql(self, statement: str, parameters: Sequence[Any] = ()) -> list[tuple[Any, ...]]:
        """Rows from the database read with plain ``sqlite3``, independently of every repository under test."""
        with closing(sqlite3.connect(self.database)) as connection:
            return connection.execute(statement, tuple(parameters)).fetchall()

    def write_sql(self, statement: str, parameters: Sequence[Any] = ()) -> None:
        """One statement committed with plain ``sqlite3``, to arrange state no product command can reach."""
        with closing(sqlite3.connect(self.database, autocommit=True)) as connection:
            connection.execute(statement, tuple(parameters))

    def set_marker(self, moment: str | None) -> None:
        """Set the last completed maintenance time, or clear it."""
        self.write_sql("UPDATE maintenance_state SET last_completed_at = ? WHERE singleton_id = 1", (moment,))

    def initialize(self) -> None:
        initialize_store(self.runtime())

    def fill(self, events: Iterable[Event]) -> None:
        """Store ``events`` through the real event repository, one transaction each."""
        repository = self.runtime().events
        for event in events:
            repository.capture(event)

    def run(self, argv: Sequence[str], *, stdin: bytes | None = None) -> Ran:
        """Invoke ``ferret`` in process over this machine's real ports, with ``stdin`` as any input a command reads."""
        stdout, stderr = io.StringIO(), io.StringIO()
        handlers = build_handlers(lambda: self.runtime(stdin))
        code = cli.main(list(argv), stdout=stdout, stderr=stderr, handlers=handlers)
        return Ran(code, stdout.getvalue(), stderr.getvalue())


def make_machine(
    root: Path,
    *,
    initialized: bool = True,
    clock: Clock | None = None,
    monotonic: Monotonic | None = None,
    artifact: Path | None = None,
) -> Machine:
    """A private HOME under ``root``, with FERRET initialized in it unless told otherwise."""
    home = root / "home"
    home.mkdir(mode=0o700)
    machine = Machine(home, clock, monotonic, artifact)
    if initialized:
        machine.initialize()
    return machine
