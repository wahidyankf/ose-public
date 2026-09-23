"""Where the fail-open callback writes down that it lost an event.

``capture-hook`` must never speak: a harness runs it for every event, and anything it writes lands in a
conversation. But a callback that is silent *and* keeps no record is one a maintainer cannot learn is broken --
every event is lost, and the only evidence is telemetry that stops arriving.

So the failure goes to a file instead of a stream. The record is a timestamp and a closed code, never the
payload, the arguments, or the exception text: the same value-free rule every other FERRET diagnostic follows.
Writing it is itself best-effort, because the reason the callback failed may be the very thing that stops the
record being written, and a callback that raised while recording a failure would be worse than one that did not
record it.
"""

import os
import stat
import time
from collections.abc import Callable
from pathlib import Path

from ferret.domain.storage import (
    CONFIG_FILE,
    DATABASE_FILE,
    HOOK_FAILURE_FILE,
    HOOK_FAILURE_LIMIT,
    IDENTITY_FILE,
    KEY_FILE,
    PRIVATE_FILE_MODE,
    is_private_mode,
)

#: The artifacts whose safety decides whether this data home may be written into at all.
ARTIFACTS = (KEY_FILE, IDENTITY_FILE, CONFIG_FILE, DATABASE_FILE)


class PosixHookFailureLog:
    """The hook-failure record of one data home, as the ``HookFailureLog`` port."""

    def __init__(self, data_home: Path) -> None:
        self._data_home = data_home

    def record(self, code: str) -> None:
        record_hook_failure(self._data_home, code)

    def read(self) -> tuple[int, str | None]:
        return read_hook_failures(self._data_home)


def record_hook_failure(data_home: Path, code: str) -> None:
    """Append one record, keeping the file to the most recent ``HOOK_FAILURE_LIMIT``. Never raises.

    Nothing is created. The record goes into a data home that already exists and is already private; a store
    that was refused as unsafe, or one that is not there at all, is left exactly as it was found. A tool that
    wrote into a directory it had just refused as unsafe would be doing the thing the refusal is for.
    """
    try:
        if not _is_safe_data_home(data_home):
            return
        path = data_home / HOOK_FAILURE_FILE
        line = f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}\t{code}\n"
        existing = path.read_text(encoding="utf-8").splitlines(keepends=True) if path.exists() else []
        kept = [*existing, line][-HOOK_FAILURE_LIMIT:]
        path.write_text("".join(kept), encoding="utf-8")
        os.chmod(path, PRIVATE_FILE_MODE)
    except OSError:
        return


def _is_safe_data_home(path: Path) -> bool:
    """Whether ``path`` is a data home the store itself would accept.

    The same judgement the persistent commands make, so the record never lands in a home one of them refused: the
    directory and every artifact in it must be a private object this user owns. An artifact that is not there is not
    a reason to refuse -- an uninitialized home is merely empty, not unsafe.
    """
    if not _is_private(path, stat.S_ISDIR):
        return False
    return all(not (path / name).exists() or _is_private(path / name, stat.S_ISREG) for name in ARTIFACTS)


def _is_private(path: Path, is_expected_kind: Callable[[int], bool]) -> bool:
    """Whether ``path`` is an object of the expected kind that this user owns with no bit for anyone else."""
    try:
        info = path.lstat()
    except OSError:
        return False
    return (
        is_expected_kind(info.st_mode) and info.st_uid == os.geteuid() and is_private_mode(stat.S_IMODE(info.st_mode))
    )


def read_hook_failures(data_home: Path) -> tuple[int, str | None]:
    """How many failures are on record and when the last one was, or ``(0, None)`` when there is no record."""
    try:
        lines = (data_home / HOOK_FAILURE_FILE).read_text(encoding="utf-8").splitlines()
    except OSError:
        return (0, None)
    records = [line for line in lines if line.strip()]
    if not records:
        return (0, None)
    return (len(records), records[-1].split("\t", 1)[0])
