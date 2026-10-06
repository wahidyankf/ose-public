"""The data home on a real filesystem: private exclusive files, refusals returned as values, and the one lock."""

import errno
import fcntl
import os
import stat
from collections.abc import Callable
from pathlib import Path

import pytest
from typekit import Err, Ok

from ferret.adapters.posix_storage import MAX_FILE_BYTES, PosixDataHome
from ferret.application.ports import FileFacts
from ferret.domain.errors import ErrorCode, FerretError, FerretResult
from support.results import refused, value_of

UNAVAILABLE: tuple[ErrorCode, bool] = ("ferret.storage.unavailable", False)
UNSAFE: tuple[ErrorCode, bool] = ("ferret.storage.unsafe", False)
LOCK_NAME = "ferret.lock"


@pytest.fixture
def data_home(tmp_path: Path) -> Path:
    path = tmp_path / "ferret"
    path.mkdir(mode=0o700)
    return path


def refuse(*arguments: object) -> None:
    raise OSError(errno.EIO, "injected failure")


def open_descriptors() -> int:
    """How many descriptors this process holds, so a test can show that a call closed everything it opened."""
    return len(os.listdir("/dev/fd"))


def lock_is_free(data_home: Path) -> bool:
    """Whether another descriptor can take the lock file's exclusive lock this moment."""
    descriptor = os.open(data_home / LOCK_NAME, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return False
    finally:
        os.close(descriptor)
    return True


def hold_the_lock(data_home: Path) -> int:
    """Take the exclusive lock with a descriptor of this test, so the code under test has to wait for it."""
    descriptor = os.open(data_home / LOCK_NAME, os.O_RDWR | os.O_CREAT, 0o600)
    fcntl.flock(descriptor, fcntl.LOCK_EX)
    return descriptor


def work_that_must_not_run() -> FerretResult[None]:
    raise AssertionError("the work ran without the lock")


def test_facts_describe_a_missing_a_regular_and_a_linked_object_and_the_directory(data_home: Path) -> None:
    home = PosixDataHome(data_home)
    (data_home / "identity.key").write_bytes(b"k")
    (data_home / "identity.key").chmod(0o600)
    os.symlink("/nowhere/at/all", data_home / "link")

    assert value_of(home.facts("absent")) == FileFacts(kind="missing")
    assert value_of(home.facts("identity.key")) == FileFacts(
        kind="file", mode=0o600, owned_by_current_user=True, link_count=1
    )
    assert value_of(home.facts("link")).kind == "symlink"
    directory = value_of(home.facts(None))
    assert (directory.kind, directory.mode) == ("directory", 0o700)


def test_facts_below_a_regular_file_are_unavailable_storage_not_an_absence(data_home: Path) -> None:
    (data_home / "identity.key").write_bytes(b"k")

    assert refused(PosixDataHome(data_home).facts("identity.key/below")) == UNAVAILABLE


def test_the_directory_is_made_private_whatever_the_umask(tmp_path: Path) -> None:
    path = tmp_path / "base" / "share" / "ferret"
    previous = os.umask(0)
    try:
        assert value_of(PosixDataHome(path).ensure_directory(0o700)) is None
    finally:
        os.umask(previous)

    assert stat.S_IMODE(path.stat().st_mode) == 0o700


def test_a_directory_that_already_exists_is_left_as_it_is(tmp_path: Path) -> None:
    path = tmp_path / "ferret"
    path.mkdir(mode=0o750)
    path.chmod(0o750)

    assert value_of(PosixDataHome(path).ensure_directory(0o700)) is None

    assert stat.S_IMODE(path.stat().st_mode) == 0o750


def test_a_parent_that_is_a_regular_file_is_not_an_error_here_but_the_next_lookup_refuses(tmp_path: Path) -> None:
    (tmp_path / "file").write_bytes(b"x")
    home = PosixDataHome(tmp_path / "file" / "ferret")

    assert value_of(home.ensure_directory(0o700)) is None
    assert refused(home.facts(None)) == UNAVAILABLE


def test_a_directory_that_cannot_be_made_is_unavailable_storage(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("ferret.adapters.posix_storage.os.mkdir", refuse)

    assert refused(PosixDataHome(tmp_path / "ferret").ensure_directory(0o700)) == UNAVAILABLE


def test_a_file_is_created_exclusively_with_exactly_the_mode_asked_whatever_the_umask(data_home: Path) -> None:
    home = PosixDataHome(data_home)
    previous = os.umask(0)
    try:
        assert value_of(home.create_file("identity.key", b"secret", 0o600)) is None
    finally:
        os.umask(previous)

    assert (data_home / "identity.key").read_bytes() == b"secret"
    assert stat.S_IMODE((data_home / "identity.key").stat().st_mode) == 0o600
    assert refused(home.create_file("identity.key", b"other", 0o600)) == UNSAFE
    assert (data_home / "identity.key").read_bytes() == b"secret"


def test_a_file_is_never_created_through_a_link(data_home: Path, tmp_path: Path) -> None:
    victim = tmp_path / "victim"
    victim.write_text("keep", encoding="utf-8")
    os.symlink(victim, data_home / "identity.key")

    assert refused(PosixDataHome(data_home).create_file("identity.key", b"secret", 0o600)) == UNSAFE
    assert victim.read_text(encoding="utf-8") == "keep"


def test_a_file_in_a_directory_that_is_not_there_is_unavailable_storage(tmp_path: Path) -> None:
    assert refused(PosixDataHome(tmp_path / "absent").create_file("identity.key", b"secret", 0o600)) == UNAVAILABLE


def fail_the_flush_of_the_file(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("ferret.adapters.posix_storage.os.fsync", refuse)


def fail_the_flush_of_the_directory(monkeypatch: pytest.MonkeyPatch) -> None:
    opened = os.open

    def open_unless_directory(path: str | Path, flags: int, mode: int = 0o777) -> int:
        if flags & os.O_DIRECTORY:
            raise OSError(errno.EIO, "injected failure")
        return opened(path, flags, mode)

    monkeypatch.setattr("ferret.adapters.posix_storage.os.open", open_unless_directory)


@pytest.mark.parametrize(
    "fail", [fail_the_flush_of_the_file, fail_the_flush_of_the_directory], ids=lambda fail: fail.__name__
)
def test_a_failed_write_is_unavailable_storage_and_no_half_written_file_survives(
    data_home: Path, monkeypatch: pytest.MonkeyPatch, fail: Callable[[pytest.MonkeyPatch], None]
) -> None:
    home = PosixDataHome(data_home)
    before = open_descriptors()
    fail(monkeypatch)

    assert refused(home.create_file("identity.key", b"secret", 0o600)) == UNAVAILABLE

    monkeypatch.undo()
    assert not os.path.lexists(data_home / "identity.key")
    assert open_descriptors() == before


def test_a_small_file_reads_back_up_to_the_limit(data_home: Path) -> None:
    home = PosixDataHome(data_home)
    (data_home / "identity.json").write_bytes(b"content")
    (data_home / "config.json").write_bytes(b"x" * MAX_FILE_BYTES)

    assert value_of(home.read_file("identity.json")) == b"content"
    assert len(value_of(home.read_file("config.json"))) == MAX_FILE_BYTES


def test_a_file_that_is_not_there_is_unavailable_storage(data_home: Path) -> None:
    assert refused(PosixDataHome(data_home).read_file("identity.json")) == UNAVAILABLE


def test_a_file_that_is_a_link_is_unsafe_and_never_followed(data_home: Path, tmp_path: Path) -> None:
    victim = tmp_path / "victim"
    victim.write_text("do not read", encoding="utf-8")
    os.symlink(victim, data_home / "identity.json")

    assert refused(PosixDataHome(data_home).read_file("identity.json")) == UNSAFE


def test_a_file_larger_than_the_limit_is_unavailable_storage(data_home: Path) -> None:
    (data_home / "config.json").write_bytes(b"x" * (MAX_FILE_BYTES + 1))

    assert refused(PosixDataHome(data_home).read_file("config.json")) == UNAVAILABLE


def test_something_that_opens_but_cannot_be_read_is_unavailable_storage_and_its_descriptor_is_closed(
    data_home: Path,
) -> None:
    # A directory opens without trouble and then refuses to be read.
    (data_home / "config.json").mkdir()
    before = open_descriptors()

    assert refused(PosixDataHome(data_home).read_file("config.json")) == UNAVAILABLE

    assert open_descriptors() == before


def test_the_work_runs_while_the_lock_is_held_and_its_result_comes_back(data_home: Path) -> None:
    seen: list[bool] = []

    def work() -> FerretResult[str]:
        seen.append(lock_is_free(data_home))
        return Ok("done")

    before = open_descriptors()

    assert value_of(PosixDataHome(data_home).with_lock(work)) == "done"

    assert seen == [False]
    assert lock_is_free(data_home)
    assert open_descriptors() == before


def test_a_refusal_the_work_returns_comes_back_and_releases_the_lock(data_home: Path) -> None:
    def work() -> FerretResult[str]:
        return Err(FerretError("ferret.install.collision", field="somewhere"))

    before = open_descriptors()

    result = PosixDataHome(data_home).with_lock(work)

    assert refused(result) == ("ferret.install.collision", False)
    assert lock_is_free(data_home)
    assert open_descriptors() == before


def test_work_that_raises_still_releases_the_lock_and_closes_the_descriptor(data_home: Path) -> None:
    def work() -> FerretResult[None]:
        raise RuntimeError("a defect")

    before = open_descriptors()

    with pytest.raises(RuntimeError, match="a defect"):
        PosixDataHome(data_home).with_lock(work)

    assert lock_is_free(data_home)
    assert open_descriptors() == before


def test_a_lock_file_that_is_a_link_is_unsafe_and_the_work_never_runs(data_home: Path, tmp_path: Path) -> None:
    victim = tmp_path / "victim"
    victim.write_text("keep", encoding="utf-8")
    os.symlink(victim, data_home / LOCK_NAME)
    before = open_descriptors()

    assert refused(PosixDataHome(data_home).with_lock(work_that_must_not_run)) == UNSAFE

    assert victim.read_text(encoding="utf-8") == "keep"
    assert open_descriptors() == before


def widen_the_lock_file(lock: Path) -> None:
    lock.chmod(0o644)


def link_the_lock_file_a_second_time(lock: Path) -> None:
    os.link(lock, lock.with_name("second-name"))


@pytest.mark.parametrize(
    "damage", [widen_the_lock_file, link_the_lock_file_a_second_time], ids=lambda damage: damage.__name__
)
def test_a_lock_file_that_is_not_private_to_this_user_is_unsafe_and_is_closed_again(
    data_home: Path, damage: Callable[[Path], None]
) -> None:
    lock = data_home / LOCK_NAME
    lock.touch(mode=0o600)
    lock.chmod(0o600)
    damage(lock)
    before = open_descriptors()

    assert refused(PosixDataHome(data_home).with_lock(work_that_must_not_run)) == UNSAFE

    assert open_descriptors() == before


def test_a_lock_that_stays_held_past_the_wait_is_a_retryable_refusal_and_the_work_never_runs(data_home: Path) -> None:
    holder = hold_the_lock(data_home)
    try:
        before = open_descriptors()

        result = PosixDataHome(data_home, lock_timeout_seconds=0.05).with_lock(work_that_must_not_run)

        assert refused(result) == ("ferret.storage.unavailable", True)
        assert open_descriptors() == before
    finally:
        os.close(holder)

    assert value_of(PosixDataHome(data_home).with_lock(lambda: Ok("free again"))) == "free again"
