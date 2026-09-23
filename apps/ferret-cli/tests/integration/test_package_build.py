"""The zipapp build: reproducible bytes, fixed archive metadata, and an artifact that runs."""

import hashlib
import marshal
import os
import shutil
import signal
import stat
import subprocess
import sys
import time
import zipfile
from pathlib import Path

import pytest

import build_zipapp
from ferret import __version__

SOURCE = Path(__file__).resolve().parents[2] / "src"


def copy_source(destination: Path, *, modified: int) -> Path:
    """A copy of the package sources whose every file and directory carries one chosen modification time."""
    shutil.copytree(SOURCE, destination, ignore=shutil.ignore_patterns("__pycache__"))
    for path in [destination, *destination.rglob("*")]:
        os.utime(path, (modified, modified))
    return destination


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_the_same_sources_build_to_the_same_bytes_whatever_their_modification_time(tmp_path: Path) -> None:
    early = copy_source(tmp_path / "early" / "src", modified=315_532_800)
    late = copy_source(tmp_path / "late" / "src", modified=1_790_000_000)

    build_zipapp.build(early, tmp_path / "early.pyz")
    build_zipapp.build(late, tmp_path / "late.pyz")

    assert digest(tmp_path / "early.pyz") == digest(tmp_path / "late.pyz")


def test_a_rebuild_replaces_the_artifact_with_identical_bytes(tmp_path: Path) -> None:
    target = tmp_path / "dist" / "ferret.pyz"

    build_zipapp.build(SOURCE, target)
    first = digest(target)
    build_zipapp.build(SOURCE, target)

    assert digest(target) == first


def test_every_entry_has_a_fixed_timestamp_mode_and_no_compression(tmp_path: Path) -> None:
    target = tmp_path / "ferret.pyz"

    build_zipapp.build(SOURCE, target)

    with zipfile.ZipFile(target) as archive:
        entries = archive.infolist()
    assert entries
    for entry in entries:
        assert entry.date_time == build_zipapp.FIXED_TIMESTAMP, entry.filename
        assert entry.compress_type == zipfile.ZIP_STORED, entry.filename
        assert entry.create_system == 3, entry.filename
        assert stat.S_IMODE(entry.external_attr >> 16) == build_zipapp.FILE_MODE, entry.filename


def test_the_archive_lists_its_entry_point_first_then_the_package_sorted(tmp_path: Path) -> None:
    target = tmp_path / "ferret.pyz"

    build_zipapp.build(SOURCE, target)

    with zipfile.ZipFile(target) as archive:
        names = archive.namelist()
    assert names[0] == "__main__.py"
    assert names[1:] == sorted(names[1:])
    assert {"ferret/__init__.py", "ferret/cli.py", "ferret/help_text.py"} <= set(names)


def test_only_package_sources_are_archived(tmp_path: Path) -> None:
    source = copy_source(tmp_path / "src", modified=315_532_800)
    (source / "ferret" / "__pycache__").mkdir()
    (source / "ferret" / "__pycache__" / "stale.py").write_text("raise SystemExit(1)\n", encoding="utf-8")
    (source / "ferret" / "notes.txt").write_text("not source\n", encoding="utf-8")
    target = tmp_path / "ferret.pyz"

    build_zipapp.build(source, target)

    with zipfile.ZipFile(target) as archive:
        names = archive.namelist()
    assert not [name for name in names if "__pycache__" in name]
    assert "ferret/notes.txt" not in names


def test_the_artifact_starts_with_a_shebang_and_is_executable(tmp_path: Path) -> None:
    target = tmp_path / "ferret.pyz"

    build_zipapp.build(SOURCE, target)

    assert target.read_bytes().startswith(build_zipapp.SHEBANG)
    assert stat.S_IMODE(target.stat().st_mode) == build_zipapp.ARTIFACT_MODE


def test_the_built_artifact_runs_and_reports_its_version(tmp_path: Path) -> None:
    target = tmp_path / "ferret.pyz"
    build_zipapp.build(SOURCE, target)

    completed = subprocess.run(  # the interpreter is the one running these tests; the artifact is this test's own
        [sys.executable, str(target), "--version"],
        capture_output=True,
        text=True,
        check=False,
        env={"PATH": "/usr/bin:/bin"},
    )

    assert completed.returncode == 0
    assert completed.stdout == f"ferret {__version__}\n"
    assert completed.stderr == ""


def test_the_command_line_builds_the_named_source_to_the_named_artifact(tmp_path: Path) -> None:
    target = tmp_path / "out" / "ferret.pyz"

    assert build_zipapp.main(["--source", str(SOURCE), "--output", str(target)]) == 0

    assert zipfile.is_zipfile(target)


def test_the_command_line_defaults_to_the_project_layout(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    copy_source(tmp_path / "src", modified=315_532_800)
    monkeypatch.chdir(tmp_path)

    assert build_zipapp.main([]) == 0

    assert zipfile.is_zipfile(tmp_path / "dist" / "ferret.pyz")


def test_every_source_is_archived_with_its_bytecode_and_no_bytecode_stands_alone(tmp_path: Path) -> None:
    target = tmp_path / "ferret.pyz"

    build_zipapp.build(SOURCE, target)

    with zipfile.ZipFile(target) as archive:
        names = set(archive.namelist())
    sources = {name for name in names if name.endswith(".py") and name != "__main__.py"}
    assert sources
    assert {name + "c" for name in sources} == {name for name in names if name.endswith(".pyc")}


def test_the_bytecode_is_unchecked_hash_and_names_the_archive_path_not_the_build_location(tmp_path: Path) -> None:
    source = copy_source(tmp_path / "checkout-of-some-user" / "src", modified=315_532_800)
    target = tmp_path / "ferret.pyz"

    build_zipapp.build(source, target)

    with zipfile.ZipFile(target) as archive:
        compiled = archive.read("ferret/cli.pyc")
    assert int.from_bytes(compiled[4:8], "little") == 0b01
    assert marshal.loads(compiled[16:]).co_filename == "ferret/cli.py"
    assert b"checkout-of-some-user" not in target.read_bytes()
    assert str(tmp_path).encode() not in target.read_bytes()


def test_the_bytecode_does_not_depend_on_the_hash_seed_or_where_the_sources_live(tmp_path: Path) -> None:
    script = Path(build_zipapp.__file__)
    built: list[str] = []
    for seed, place in (("1", "first"), ("31415", "second")):
        source = copy_source(tmp_path / place / "src", modified=315_532_800)
        target = tmp_path / f"{place}.pyz"
        subprocess.run(  # the interpreter is the one running these tests; the builder is this project's own
            [sys.executable, str(script), "--source", str(source), "--output", str(target)],
            check=True,
            env={"PATH": "/usr/bin:/bin", "PYTHONHASHSEED": seed},
        )
        built.append(digest(target))

    assert built[0] == built[1]


def test_the_artifact_loads_its_modules_from_bytecode(tmp_path: Path) -> None:
    target = tmp_path / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    program = "import sys; sys.path.insert(0, sys.argv[1]); import ferret.cli; print(ferret.cli.__file__)"

    completed = subprocess.run(  # the interpreter is the one running these tests; the artifact is this test's own
        [sys.executable, "-c", program, str(target)],
        capture_output=True,
        text=True,
        check=False,
        env={"PATH": "/usr/bin:/bin"},
    )

    assert completed.returncode == 0
    assert completed.stdout.strip().endswith("ferret.pyz/ferret/cli.pyc")


def test_an_interrupt_while_a_command_blocks_exits_one_three_zero_without_a_traceback(tmp_path: Path) -> None:
    """`KeyboardInterrupt` descends from `BaseException`, so the entry point needs its own clause for it.

    Without one, an interrupt delivered while `capture` blocks on stdin printed a full traceback carrying
    absolute paths — the disclosure the closed failure contract exists to prevent — even though the status
    was already `130`. This drives the artifact through a pipe nobody writes to, so the read genuinely blocks.
    """
    target = tmp_path / "ferret.pyz"
    build_zipapp.build(SOURCE, target)

    read_fd, write_fd = os.pipe()
    try:
        process = subprocess.Popen(  # the interpreter is the one running these tests; the artifact is this test's own
            [sys.executable, str(target), "capture"],
            stdin=read_fd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env={"PATH": "/usr/bin:/bin", "HOME": str(tmp_path)},
        )
        os.close(read_fd)
        read_fd = -1
        time.sleep(1.0)  # long enough that the process is certainly inside the blocking read
        process.send_signal(signal.SIGINT)
        _, errors = process.communicate(timeout=30)
    finally:
        if read_fd != -1:
            os.close(read_fd)
        os.close(write_fd)

    # A shell renders "died by SIGINT" as 130, which is what `128+N` names. Keeping the process
    # genuinely signal-terminated is why this asserts the negative return code rather than 130:
    # exiting 130 normally would satisfy a shell and lie to anything reading `WIFSIGNALED`.
    assert process.returncode == -signal.SIGINT
    assert "Traceback" not in errors
    assert "KeyboardInterrupt" not in errors
    assert errors == ""
