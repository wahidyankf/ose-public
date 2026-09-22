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

from ferret.adapters.filesystem import (
    Mount,
    adopt_legacy_data_home,
    is_local_filesystem,
    parse_linux_mounts,
    parse_macos_mounts,
    resolve_data_home,
)
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
from ferret.domain.errors import FerretError
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
        try:
            stream = sys.stdin.buffer if self._stream is None else self._stream
            return stream.read(limit)
        except AttributeError, OSError, ValueError:
            return b""


def home_directory(environment: Mapping[str, str]) -> Path:
    """``$HOME``, or the account database's home directory when the variable is unset or empty."""
    configured = environment.get("HOME", "")
    if configured:
        return Path(configured)
    try:
        return Path(pwd.getpwuid(os.getuid()).pw_dir)
    except KeyError:
        raise FerretError("ferret.storage.unavailable") from None


def mount_table() -> list[Mount]:
    """The mounted filesystems as the platform reports them, or none when it cannot be read."""
    try:
        if LINUX_MOUNTS.exists():
            return parse_linux_mounts(LINUX_MOUNTS.read_text(encoding="utf-8", errors="replace"))
        completed = subprocess.run(
            [MACOS_MOUNT_COMMAND],
            capture_output=True,
            text=True,
            timeout=MOUNT_TIMEOUT_SECONDS,
            check=False,
        )
    except OSError, subprocess.SubprocessError:
        return []
    return parse_macos_mounts(completed.stdout)


def resolve_physical(path: Path) -> Path:
    """``path`` with every existing ancestor's symlinks resolved, so a mount lookup sees where it really lives."""
    existing = path
    while not existing.exists() and existing != existing.parent:
        existing = existing.parent
    return Path(os.path.realpath(existing)).joinpath(*path.relative_to(existing).parts)


def require_local(data_home: Path) -> None:
    """Refuse a data home the platform cannot establish as a local filesystem: WAL does not work over a network."""
    if not is_local_filesystem(resolve_physical(data_home), mount_table()):
        raise FerretError("ferret.storage.unsafe")


def system_runtime(
    environment: Mapping[str, str] | None = None,
    *,
    stdin: BinaryIO | None = None,
    artifact: Path | None = None,
) -> Runtime:
    """Wire the real ports for one process.

    Environment, input, and the artifact an install copies are injectable so tests never read the caller's; the
    artifact defaults to the zipapp the process runs from.
    """
    env = os.environ if environment is None else environment
    home = home_directory(env)
    data_home = resolve_data_home(env, home)
    if env.get(DATA_HOME_VARIABLE):
        require_local(data_home)
    else:
        # Only when FERRET chose the location itself. A caller who named one is not asking to be moved.
        data_home = adopt_legacy_data_home(home, data_home)
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
    )
