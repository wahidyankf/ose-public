"""Integration checks for the harness scenarios that have no step bindings.

Each test runs a real install collision over a real HOME, a purge confirmation over a real store, the interpreter
override and its failure through the built artifact, the exit codes of a closed pipe and an interrupt, the help
and version answers, the Command Code status, and an escaped fault.

The artifact runs in a real subprocess. The interpreter guard reads a version it cannot be given on every host,
so the driver injects only that version and an empty list of fallback directories, as test_interpreter_guard
does.
"""

import io
import json
import os
import signal
import subprocess
import sys
import time
from dataclasses import replace
from datetime import UTC, datetime
from pathlib import Path

import pytest

import build_zipapp
from ferret import __version__, cli
from ferret._bootstrap import OVERRIDE_VARIABLE, unstartable
from ferret.domain.install import InstallPaths
from support.artifacts import write_test_artifact
from support.machine import Machine, make_machine
from support.populate import make_event

SOURCE = Path(__file__).resolve().parents[2] / "src"

DRIVER = """import sys

sys.version_info = {version}
sys.argv = [{archive!r}] + {arguments!r}
sys.path.insert(0, {archive!r})

import ferret._bootstrap

ferret._bootstrap.FALLBACK_DIRECTORIES = ()

import runpy

runpy.run_path({archive!r}, run_name="__main__")
"""
OLD_VERSION = (3, 13, 12)


@pytest.fixture(scope="module")
def artifact(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The real artifact, built from the current sources exactly as a release builds it."""
    target = tmp_path_factory.mktemp("harness-built") / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    return target


def as_if_old(artifact: Path, arguments: list[str], environment: dict[str, str]) -> subprocess.CompletedProcess[str]:
    """Run the artifact's entry point with the guard told it is on an interpreter older than FERRET requires."""
    driver = DRIVER.format(version=OLD_VERSION, archive=str(artifact), arguments=arguments)
    return subprocess.run([sys.executable, "-c", driver], capture_output=True, text=True, check=False, env=environment)


def status(returncode: int) -> int:
    """The exit status a shell reports: a plain exit code, or 128 plus the signal that ended the process."""
    return returncode if returncode >= 0 else 128 - returncode


def tree(directory: Path) -> dict[str, bytes]:
    """Every file under ``directory`` and its bytes, so two moments can be compared whole."""
    return {str(path.relative_to(directory)): path.read_bytes() for path in directory.rglob("*") if path.is_file()}


def fresh_machine(tmp_path: Path) -> Machine:
    """A real initialized home whose artifact is a stand-in that an install copies, on a real PATH."""
    source = tmp_path / "dist" / "ferret.pyz"
    write_test_artifact(source)  # returns the digest; the install copies the file at ``source``
    return replace(make_machine(tmp_path, artifact=source), path="/usr/bin:/bin")


def installed_machine(tmp_path: Path, *, events: int = 0) -> Machine:
    """A real home with FERRET installed for the user and ``events`` stored events."""
    machine = fresh_machine(tmp_path)
    if events:
        machine.fill([make_event(number, now=datetime.now(UTC)) for number in range(1, events + 1)])
    installed = machine.run(["self", "install", "--target", "user", "--json"])
    assert (installed.code, installed.stderr) == (0, "")
    return machine


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: self install reports ferret.install.collision when another file owns the launcher path
def test_self_install_reports_a_collision_when_another_file_owns_the_launcher(tmp_path: Path) -> None:
    machine = fresh_machine(tmp_path)
    paths = InstallPaths(machine.home)
    paths.bin.mkdir(parents=True)
    paths.launcher.write_bytes(b"#!/bin/sh\n")
    paths.launcher.chmod(0o755)
    ran = machine.run(["self", "install", "--target", "user", "--json"])
    assert (ran.code, ran.stdout) == (2, "")
    assert json.loads(ran.stderr)["error"]["code"] == "ferret.install.collision"
    # The refusal changes nothing: the foreign launcher is untouched, and no version directory or manifest appeared.
    assert paths.launcher.read_bytes() == b"#!/bin/sh\n"
    assert [path for path in paths.share.iterdir() if path.is_dir()] == []
    assert not paths.manifest.exists()


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: self uninstall --purge-data --yes deletes the data home
def test_self_uninstall_purge_deletes_the_data_home(tmp_path: Path) -> None:
    machine = installed_machine(tmp_path, events=1)
    ran = machine.run(["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (ran.code, ran.stderr, json.loads(ran.stdout)["dataAction"]) == (0, "", "deleted")
    assert not machine.data_home.exists()


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: self uninstall --purge-data without --yes refuses and keeps the data home
def test_self_uninstall_purge_without_yes_refuses_and_keeps_the_data_home(tmp_path: Path) -> None:
    machine = installed_machine(tmp_path, events=1)
    before = tree(machine.data_home)
    ran = machine.run(["self", "uninstall", "--purge-data", "--json"])
    assert (ran.code, ran.stdout) == (2, "")
    assert json.loads(ran.stderr)["error"]["code"] == "ferret.args.confirmation-required"
    assert tree(machine.data_home) == before
    assert machine.sql("SELECT COUNT(*) FROM event") == [(1,)]


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: FERRET_PYTHON names the interpreter to use outright
def test_ferret_python_names_the_interpreter_outright(artifact: Path, tmp_path: Path) -> None:
    """No PATH entry exists, so the named interpreter is the only one the guard can start."""
    ran = as_if_old(
        artifact,
        ["version"],
        {"PATH": str(tmp_path / "no-such-directory"), OVERRIDE_VARIABLE: sys.executable, "HOME": str(tmp_path)},
    )
    assert (ran.returncode, ran.stdout.strip(), ran.stderr) == (0, f"ferret {__version__}", "")


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: An interpreter that is found but cannot be started exits 126
def test_an_interpreter_found_but_unstartable_exits_126(artifact: Path, tmp_path: Path) -> None:
    """A supported interpreter name on PATH whose file has no executable format: found, then refused by the kernel."""
    found = tmp_path / "python3.14"
    found.write_bytes(b"this file has no executable format\n")
    found.chmod(0o755)
    ran = as_if_old(artifact, ["version"], {"PATH": str(tmp_path), "HOME": str(tmp_path)})
    assert ran.returncode == 126
    assert ran.stderr.strip() == unstartable(str(found))


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: A closed output pipe exits 141 and an interrupt exits 130
def test_a_closed_output_pipe_exits_141_and_an_interrupt_exits_130(artifact: Path, tmp_path: Path) -> None:
    environment = {"PATH": "/usr/bin:/bin", "HOME": str(tmp_path)}
    # 141: the reader closes before the artifact writes, so its write meets a pipe with no reader.
    closed = subprocess.Popen(
        [sys.executable, str(artifact), "version"],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=environment,
    )
    assert closed.stdout is not None
    assert closed.stderr is not None
    closed.stdout.close()
    closed_stderr = closed.stderr.read().decode(errors="replace")
    # A signal death reports as 128 plus the signal, as the conformance runner measures it: SIGPIPE is 13.
    assert (status(closed.wait()), closed_stderr) == (141, "")
    # 130: `capture` blocks reading standard input from a pipe nobody writes to, so the interrupt lands while it waits.
    read_fd, write_fd = os.pipe()
    try:
        interrupted = subprocess.Popen(
            [sys.executable, str(artifact), "capture"],
            stdin=read_fd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=environment,
        )
        read_fd = -1
        time.sleep(1.0)
        interrupted.send_signal(signal.SIGINT)
        _, interrupted_stderr = interrupted.communicate(timeout=30)
    finally:
        if read_fd != -1:
            os.close(read_fd)
        os.close(write_fd)
    assert (status(interrupted.returncode), interrupted_stderr) == (130, b"")


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: ferret --help and ferret help list every command and exit status
# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: ferret version and --version print the version and exit 0
def test_help_and_version_are_answered_by_the_built_artifact(artifact: Path) -> None:
    def answer(*arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run([sys.executable, str(artifact), *arguments], capture_output=True, text=True, check=False)

    flag, word = answer("--help"), answer("help")
    assert (flag.returncode, word.returncode, flag.stderr, word.stderr) == (0, 0, "", "")
    assert flag.stdout == word.stdout
    for spec in cli.COMMANDS:
        if spec.path != ("capture-hook",):
            assert " ".join(spec.path) in flag.stdout
    for status in ("  0 ", "  1 ", "  2 ", "  126 ", "  128+N "):
        assert status in flag.stdout
    by_word, by_flag = answer("version"), answer("--version")
    assert (by_word.returncode, by_flag.returncode, by_word.stderr, by_flag.stderr) == (0, 0, "", "")
    assert by_word.stdout == by_flag.stdout == f"ferret {__version__}\n"


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: status reports Command Code as probe_required
def test_status_reports_command_code_as_probe_required(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    ran = machine.run(["status", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    [adapter] = [item for item in json.loads(ran.stdout)["adapters"] if item["harness"] == "commandcode"]
    assert adapter["platformSupport"] == "probe_required"


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: An internal failure exits 2 with ferret.internal.failure
def test_an_internal_failure_escaping_the_command_line_exits_2() -> None:
    """The decided binding: an escaped fault is written as its closed code and exits 2 through the real ``cli.run``."""

    class BrokenStream(io.StringIO):
        def write(self, text: str) -> int:
            raise OSError("the output stream failed")

    err = io.StringIO()
    code = cli.run(["--version"], stdout=BrokenStream(), stderr=err)
    assert (code, err.getvalue()) == (2, "ferret: [ferret.internal.failure] FERRET failed internally\n")
