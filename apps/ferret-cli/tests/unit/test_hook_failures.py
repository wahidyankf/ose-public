"""Where the fail-open callback writes down that it lost an event, and what ``status`` reads back from it.

The callback may never speak, so this file is the whole of what a maintainer has: if the record is not written, or
is written somewhere the store itself refused, the silence is indistinguishable from health.
"""

import os
import stat
from collections.abc import Callable
from pathlib import Path

import pytest

from ferret.adapters.hook_failures import PosixHookFailureLog, read_hook_failures, record_hook_failure
from ferret.domain.storage import HOOK_FAILURE_FILE, HOOK_FAILURE_LIMIT

TIMESTAMP = len("2026-09-22T00:00:00Z")


@pytest.fixture
def data_home(tmp_path: Path) -> Path:
    home = tmp_path / "ferret"
    home.mkdir(mode=0o700)
    return home


def records(data_home: Path) -> list[str]:
    return (data_home / HOOK_FAILURE_FILE).read_text(encoding="utf-8").splitlines()


def test_a_record_is_one_timestamped_code_and_the_file_is_private(data_home: Path) -> None:
    record_hook_failure(data_home, "ferret.event.invalid")

    (line,) = records(data_home)
    moment, code = line.split("\t")
    assert code == "ferret.event.invalid"
    assert (len(moment), moment[-1]) == (TIMESTAMP, "Z")
    assert stat.S_IMODE((data_home / HOOK_FAILURE_FILE).stat().st_mode) == 0o600


def test_records_accumulate_and_status_reads_the_count_and_the_last_moment(data_home: Path) -> None:
    record_hook_failure(data_home, "ferret.args.invalid")
    record_hook_failure(data_home, "ferret.internal.failure")

    count, last = read_hook_failures(data_home)

    assert count == 2
    assert last == records(data_home)[-1].split("\t")[0]


def test_the_file_is_bounded_so_a_broken_callback_cannot_fill_the_disk(data_home: Path) -> None:
    for _ in range(HOOK_FAILURE_LIMIT + 5):
        record_hook_failure(data_home, "ferret.internal.failure")

    assert read_hook_failures(data_home) == (HOOK_FAILURE_LIMIT, records(data_home)[-1].split("\t")[0])


def test_the_port_records_into_and_reads_from_its_own_data_home(data_home: Path) -> None:
    log = PosixHookFailureLog(data_home)

    log.record("ferret.storage.unavailable")

    (line,) = records(data_home)
    assert line.endswith("\tferret.storage.unavailable")
    assert log.read() == (1, line.split("\t")[0])


def test_no_record_is_no_failure_rather_than_an_error(tmp_path: Path) -> None:
    assert read_hook_failures(tmp_path / "nowhere") == (0, None)


def test_a_file_of_blank_lines_reads_as_no_failure(data_home: Path) -> None:
    (data_home / HOOK_FAILURE_FILE).write_text("\n  \n", encoding="utf-8")

    assert read_hook_failures(data_home) == (0, None)


def widen_the_directory(data_home: Path) -> None:
    data_home.chmod(0o755)


def widen_an_artifact(data_home: Path) -> None:
    (data_home / "identity.key").chmod(0o644)


@pytest.mark.parametrize(
    "widen",
    [
        pytest.param(widen_the_directory, id="a-data-home-open-to-others"),
        pytest.param(widen_an_artifact, id="an-artifact-open-to-others"),
    ],
)
def test_nothing_is_written_into_a_data_home_the_store_itself_would_refuse(
    data_home: Path, widen: Callable[[Path], None]
) -> None:
    # Writing into a directory this tool has just refused as unsafe is the one thing the refusal exists to prevent.
    (data_home / "identity.key").write_bytes(b"x" * 32)
    (data_home / "identity.key").chmod(0o600)
    widen(data_home)

    record_hook_failure(data_home, "ferret.storage.unsafe")

    assert not (data_home / HOOK_FAILURE_FILE).exists()


def test_nothing_is_written_where_there_is_no_data_home(tmp_path: Path) -> None:
    absent = tmp_path / "nowhere"

    record_hook_failure(absent, "ferret.storage.uninitialized")

    assert not absent.exists()


def test_a_data_home_that_is_a_file_or_a_link_is_not_one(tmp_path: Path) -> None:
    plain = tmp_path / "plain"
    plain.write_text("")
    linked = tmp_path / "linked"
    linked.symlink_to(tmp_path / "elsewhere")

    record_hook_failure(plain, "ferret.storage.unsafe")
    record_hook_failure(linked, "ferret.storage.unsafe")

    assert plain.read_text() == ""
    assert not (tmp_path / "elsewhere").exists()


def test_a_data_home_that_cannot_be_written_to_gives_up_quietly(data_home: Path) -> None:
    # Recording is best-effort by design: whatever broke the capture may be what stops the record, and a callback
    # that raised while writing one would be worse than a callback that wrote none.
    (data_home / HOOK_FAILURE_FILE).write_text("", encoding="utf-8")
    (data_home / HOOK_FAILURE_FILE).chmod(0o400)
    try:
        record_hook_failure(data_home, "ferret.internal.failure")
    finally:
        (data_home / HOOK_FAILURE_FILE).chmod(0o600)

    assert records(data_home) == []


def test_a_data_home_owned_by_someone_else_is_not_written_into(
    data_home: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    someone_else = os.geteuid() + 1
    monkeypatch.setattr(os, "geteuid", lambda: someone_else)

    record_hook_failure(data_home, "ferret.storage.unsafe")

    assert not (data_home / HOOK_FAILURE_FILE).exists()
