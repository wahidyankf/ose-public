"""The private data home on a real POSIX filesystem: exclusive symlink-safe creation and one advisory lock."""

import errno
import fcntl
import os
import shutil
import stat
import time
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path

from ferret.application.ports import FileFacts, Kind
from ferret.domain.errors import FerretError
from ferret.domain.storage import LOCK_FILE, PRIVATE_FILE_MODE, is_private_mode

LOCK_TIMEOUT_SECONDS = 5.0
LOCK_POLL_SECONDS = 0.005
MAX_FILE_BYTES = 65536
_CREATE = os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC
_READ = os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC
_LOCK = os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_CLOEXEC


def kind_of(mode: int) -> Kind:
    """The kind of object a stat mode describes."""
    if stat.S_ISLNK(mode):
        return "symlink"
    if stat.S_ISREG(mode):
        return "file"
    if stat.S_ISDIR(mode):
        return "directory"
    return "other"


def _open_failure(error: OSError) -> FerretError:
    """A refused symlink or planted object is unsafe storage; anything else is unavailable storage."""
    if error.errno in {errno.ELOOP, errno.EEXIST}:
        return FerretError("ferret.storage.unsafe")
    return FerretError("ferret.storage.unavailable")


class PosixDataHome:
    """The data-home directory at ``path``; every file is opened without following a symlink."""

    def __init__(self, path: Path, *, lock_timeout_seconds: float = LOCK_TIMEOUT_SECONDS) -> None:
        self._path = path
        self._lock_timeout_seconds = lock_timeout_seconds

    def facts(self, name: str | None) -> FileFacts:
        target = self._path if name is None else self._path / name
        try:
            info = os.lstat(target)
        except FileNotFoundError:
            return FileFacts(kind="missing")
        except OSError:
            raise FerretError("ferret.storage.unavailable") from None
        return FileFacts(
            kind=kind_of(info.st_mode),
            mode=stat.S_IMODE(info.st_mode),
            owned_by_current_user=info.st_uid == os.geteuid(),
            link_count=info.st_nlink,
        )

    def ensure_directory(self, mode: int) -> None:
        try:
            # The parents are ordinary base directories -- `~/.local/share` and the like -- so they are created
            # at the user's own umask. Only the leaf, which is FERRET's, is forced private: a data home is
            # private by policy, but forcing 0700 on a directory shared with every other application would be
            # this tool deciding something that is not its to decide.
            self._path.parent.mkdir(parents=True, exist_ok=True)
            os.mkdir(self._path, mode)
        except FileExistsError:
            return
        except OSError:
            raise FerretError("ferret.storage.unavailable") from None

    def create_file(self, name: str, content: bytes, mode: int) -> None:
        target = self._path / name
        try:
            descriptor = os.open(target, _CREATE, mode)
        except OSError as error:
            raise _open_failure(error) from None
        try:
            try:
                os.fchmod(descriptor, mode)
                view = memoryview(content)
                while view:
                    view = view[os.write(descriptor, view) :]
                os.fsync(descriptor)
            finally:
                os.close(descriptor)
            self._sync_directory()
        except OSError:
            # A half-written file would poison the next initialization, so it never survives a failed write.
            target.unlink(missing_ok=True)
            raise FerretError("ferret.storage.unavailable") from None

    def read_file(self, name: str) -> bytes:
        try:
            descriptor = os.open(self._path / name, _READ)
        except OSError as error:
            raise _open_failure(error) from None
        try:
            content = os.read(descriptor, MAX_FILE_BYTES + 1)
        except OSError:
            raise FerretError("ferret.storage.unavailable") from None
        finally:
            os.close(descriptor)
        if len(content) > MAX_FILE_BYTES:
            raise FerretError("ferret.storage.unavailable")
        return content

    def purge(self) -> None:
        try:
            shutil.rmtree(self._path)
        except FileNotFoundError:
            return
        except OSError:
            raise FerretError("ferret.storage.unavailable") from None

    @contextmanager
    def lock(self) -> Generator[None]:
        descriptor = self._open_lock_file()
        try:
            self._acquire(descriptor)
            try:
                yield
            finally:
                fcntl.flock(descriptor, fcntl.LOCK_UN)
        finally:
            os.close(descriptor)

    def _open_lock_file(self) -> int:
        try:
            descriptor = os.open(self._path / LOCK_FILE, _LOCK, PRIVATE_FILE_MODE)
        except OSError as error:
            raise _open_failure(error) from None
        info = os.fstat(descriptor)
        if (
            not stat.S_ISREG(info.st_mode)
            or info.st_uid != os.geteuid()
            or info.st_nlink != 1
            or not is_private_mode(stat.S_IMODE(info.st_mode))
        ):
            os.close(descriptor)
            raise FerretError("ferret.storage.unsafe")
        return descriptor

    def _acquire(self, descriptor: int) -> None:
        deadline = time.monotonic() + self._lock_timeout_seconds
        while True:
            try:
                fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                if time.monotonic() >= deadline:
                    raise FerretError("ferret.storage.unavailable", retryable=True) from None
                time.sleep(LOCK_POLL_SECONDS)
            else:
                return

    def _sync_directory(self) -> None:
        descriptor = os.open(self._path, os.O_RDONLY | os.O_DIRECTORY | os.O_CLOEXEC)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
