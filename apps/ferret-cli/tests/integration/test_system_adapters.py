"""The real standard input and mount table: what each reads, and the empty value each falls back to when it cannot."""

import io
import subprocess
import sys
from pathlib import Path

import pytest

from ferret.adapters import system
from ferret.adapters.filesystem import Mount
from ferret.adapters.system import StandardInput, mount_table

LINUX_TABLE = "22 1 259:2 / / rw,relatime shared:1 - ext4 /dev/nvme0n1p2 rw,errors=remount-ro\n"
MACOS_TABLE = "/dev/disk3s1s1 on / (apfs, sealed, local, read-only, journaled)\n"


class UnreadableStream(io.BytesIO):
    """A stream whose read fails with the error it is given."""

    def __init__(self, failure: Exception) -> None:
        super().__init__(b"never read")
        self._failure = failure

    def read(self, size: int | None = -1) -> bytes:
        raise self._failure


def command(directory: Path, script: str) -> Path:
    """An executable shell script standing in for the platform's ``mount`` command."""
    path = directory / "mount"
    path.write_text(f"#!/bin/sh\n{script}\n", encoding="utf-8")
    path.chmod(0o700)
    return path


def without_proc(monkeypatch: pytest.MonkeyPatch, directory: Path) -> None:
    """Make the platform look like one with no ``/proc/self/mountinfo``, so the ``mount`` command is the source."""
    monkeypatch.setattr(system, "LINUX_MOUNTS", directory / "absent-mountinfo")


def test_input_reads_up_to_the_limit_from_the_stream_it_is_given() -> None:
    assert StandardInput(io.BytesIO(b"abcdef")).read(3) == b"abc"


def test_input_reads_the_process_standard_input_when_it_is_given_no_stream(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "stdin", io.TextIOWrapper(io.BytesIO(b"abcdef")))

    assert StandardInput().read(4) == b"abcd"


def test_input_from_a_closed_stream_reads_as_empty() -> None:
    stream = io.BytesIO(b"abcdef")
    stream.close()

    assert StandardInput(stream).read(10) == b""


def test_input_from_a_stream_that_fails_to_read_reads_as_empty() -> None:
    assert StandardInput(UnreadableStream(OSError("device gone"))).read(10) == b""


@pytest.mark.parametrize("standard_input", [None, io.StringIO("text")], ids=["closed", "without-a-byte-buffer"])
def test_input_with_no_usable_process_standard_input_reads_as_empty(
    monkeypatch: pytest.MonkeyPatch, standard_input: io.StringIO | None
) -> None:
    monkeypatch.setattr(sys, "stdin", standard_input)

    assert StandardInput().read(10) == b""


def test_input_does_not_hide_a_failure_it_was_never_meant_to_absorb() -> None:
    with pytest.raises(RuntimeError, match="a defect"):
        StandardInput(UnreadableStream(RuntimeError("a defect"))).read(10)


def test_the_linux_mount_table_is_read_from_proc(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    table = tmp_path / "mountinfo"
    table.write_text(LINUX_TABLE, encoding="utf-8")
    monkeypatch.setattr(system, "LINUX_MOUNTS", table)

    assert mount_table() == [Mount(Path("/"), "ext4")]


def test_a_linux_mount_table_that_cannot_be_read_is_empty(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    # A directory exists but cannot be read as text, which the file system reports as an OSError.
    monkeypatch.setattr(system, "LINUX_MOUNTS", tmp_path)

    assert mount_table() == []


def test_the_macos_mount_table_is_read_from_the_mount_command(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    without_proc(monkeypatch, tmp_path)
    monkeypatch.setattr(system, "MACOS_MOUNT_COMMAND", str(command(tmp_path, f"printf '%s' '{MACOS_TABLE}'")))

    assert mount_table() == [Mount(Path("/"), "apfs")]


def test_a_missing_mount_command_gives_an_empty_table(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    without_proc(monkeypatch, tmp_path)
    monkeypatch.setattr(system, "MACOS_MOUNT_COMMAND", str(tmp_path / "absent-mount"))

    assert mount_table() == []


def test_a_mount_command_that_overruns_its_deadline_gives_an_empty_table(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    without_proc(monkeypatch, tmp_path)
    monkeypatch.setattr(system, "MACOS_MOUNT_COMMAND", str(command(tmp_path, "exec sleep 30")))
    monkeypatch.setattr(system, "MOUNT_TIMEOUT_SECONDS", 0.2)

    assert mount_table() == []


def test_a_mount_command_that_fails_in_a_way_it_was_never_meant_to_absorb_is_not_hidden(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    without_proc(monkeypatch, tmp_path)

    def fault(*arguments: object, **options: object) -> subprocess.CompletedProcess[str]:
        raise RuntimeError("a defect")

    monkeypatch.setattr(subprocess, "run", fault)

    with pytest.raises(RuntimeError, match="a defect"):
        mount_table()
