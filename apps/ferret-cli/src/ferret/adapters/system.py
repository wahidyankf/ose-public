"""The real clock, entropy, environment, and the wiring that turns them into a Runtime."""

import os
import platform
import pwd
import secrets
import subprocess
import sys
import time
import uuid
from collections.abc import Mapping
from datetime import UTC, datetime
from pathlib import Path
from typing import BinaryIO

from typekit import Err, Ok, attempt

from ferret.adapters.filesystem import (
    Mount,
    adopt_legacy_data_home,
    is_local_filesystem,
    parse_linux_mounts,
    parse_macos_mounts,
    resolve_data_home,
)
from ferret.adapters.hook_failures import PosixHookFailureLog
from ferret.adapters.posix_install import PosixUserInstall
from ferret.adapters.posix_storage import PosixDataHome
from ferret.adapters.posix_workspace import PosixWorkspaceRoots
from ferret.adapters.sqlite_repository import (
    SQLiteCapabilityRepository,
    SQLiteEventRepository,
    SQLiteTelemetryRepository,
)
from ferret.adapters.sqlite_schema import SQLiteSchema
from ferret.application.ports import InterpreterFacts, Runtime
from ferret.domain.errors import FerretError, FerretResult
from ferret.domain.storage import DATA_HOME_VARIABLE, DATABASE_FILE

LINUX_MOUNTS = Path("/proc/self/mountinfo")
MACOS_MOUNT_COMMAND = "/sbin/mount"
MOUNT_TIMEOUT_SECONDS = 5


class SystemClock:
    def now(self) -> datetime:
        return datetime.now(UTC)


class SystemMonotonic:
    def now_ns(self) -> int:
        return time.monotonic_ns()


class SystemRandomness:
    def uuid4(self) -> str:
        return str(uuid.uuid4())

    def token_bytes(self, count: int) -> bytes:
        return secrets.token_bytes(count)


class StandardInput:
    """Standard input as raw bytes; an unreadable or closed stream reads as empty, which no command accepts."""

    def __init__(self, stream: BinaryIO | None = None) -> None:
        self._stream = stream

    def read(self, limit: int) -> bytes:
        read = attempt(lambda: self._source().read(limit), AttributeError, OSError, ValueError)
        match read:
            case Ok(data):
                return data
            case Err():
                return b""

    def _source(self) -> BinaryIO:
        return sys.stdin.buffer if self._stream is None else self._stream


def home_directory(environment: Mapping[str, str]) -> FerretResult[Path]:
    """``$HOME``, or the account database's home directory when the variable is unset or empty.

    A user the account database does not know, with no ``$HOME`` to say, has no home: ``unavailable_storage``.
    """
    configured = environment.get("HOME", "")
    if configured:
        return Ok(Path(configured))
    return (
        attempt(lambda: pwd.getpwuid(os.getuid()), KeyError)
        .map(lambda account: Path(account.pw_dir))
        .map_err(lambda _: FerretError("ferret.storage.unavailable"))
    )


def _reported_mounts() -> list[Mount]:
    """The mount table as ``/proc`` or the ``mount`` command reports it; either may fail to run."""
    if LINUX_MOUNTS.exists():
        return parse_linux_mounts(LINUX_MOUNTS.read_text(encoding="utf-8", errors="replace"))
    completed = subprocess.run(
        [MACOS_MOUNT_COMMAND],
        capture_output=True,
        text=True,
        timeout=MOUNT_TIMEOUT_SECONDS,
        check=False,
    )
    return parse_macos_mounts(completed.stdout)


def mount_table() -> list[Mount]:
    """The mounted filesystems as the platform reports them, or none when it cannot be read."""
    reported = attempt(_reported_mounts, OSError, subprocess.SubprocessError)
    match reported:
        case Ok(mounts):
            return mounts
        case Err():
            return []


def resolve_physical(path: Path) -> Path:
    """``path`` with every existing ancestor's symlinks resolved, so a mount lookup sees where it really lives."""
    existing = path
    while not existing.exists() and existing != existing.parent:
        existing = existing.parent
    return Path(os.path.realpath(existing)).joinpath(*path.relative_to(existing).parts)


def require_local(data_home: Path) -> FerretResult[Path]:
    """The data home, or an ``Err`` when the platform cannot establish it as local: WAL does not work over a network."""
    if is_local_filesystem(resolve_physical(data_home), mount_table()):
        return Ok(data_home)
    return Err(FerretError("ferret.storage.unsafe"))


def _located_data_home(env: Mapping[str, str], home: Path) -> FerretResult[Path]:
    """Where this process keeps its data: the named location if it is local, else FERRET's own, adopting an old one."""
    located = resolve_data_home(env, home)
    if env.get(DATA_HOME_VARIABLE):
        return located.flat_map(require_local)
    # Only when FERRET chose the location itself. A caller who named one is not asking to be moved.
    return located.map(lambda data_home: adopt_legacy_data_home(home, data_home))


def _wired(
    env: Mapping[str, str], home: Path, data_home: Path, *, stdin: BinaryIO | None, artifact: Path | None
) -> Runtime:
    """The real ports over one resolved home and data home."""
    clock = SystemClock()
    return Runtime(
        data_home=data_home,
        files=PosixDataHome(data_home),
        schema=SQLiteSchema(data_home / DATABASE_FILE, clock),
        clock=clock,
        randomness=SystemRandomness(),
        input=StandardInput(stdin),
        events=SQLiteEventRepository(data_home / DATABASE_FILE),
        capabilities=SQLiteCapabilityRepository(data_home / DATABASE_FILE),
        telemetry=SQLiteTelemetryRepository(data_home / DATABASE_FILE),
        monotonic=SystemMonotonic(),
        interpreter=InterpreterFacts(path=sys.executable, version=platform.python_version()),
        installer=PosixUserInstall(home, path_variable=env.get("PATH", ""), artifact=artifact),
        workspaces=PosixWorkspaceRoots(),
        hook_failures=PosixHookFailureLog(data_home),
    )


def system_runtime(
    environment: Mapping[str, str] | None = None,
    *,
    stdin: BinaryIO | None = None,
    artifact: Path | None = None,
) -> FerretResult[Runtime]:
    """Wire the real ports for one process, or the refusal that stops it: no home, or a data home it cannot trust.

    Environment, input, and the artifact an install copies are injectable so tests never read the caller's; the
    artifact defaults to the zipapp the process runs from.
    """
    env = os.environ if environment is None else environment
    return home_directory(env).flat_map(
        lambda home: _located_data_home(env, home).map(
            lambda data_home: _wired(env, home, data_home, stdin=stdin, artifact=artifact)
        )
    )
