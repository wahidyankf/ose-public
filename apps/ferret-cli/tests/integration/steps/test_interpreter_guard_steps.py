"""Integration bindings for the interpreter guard: the real artifact, a real process, a real restart.

The unit bindings decide the guard's choice from an in-memory host. These carry the same scenario through the
built zipapp and its generated entry point, searching a real ``PATH`` with the real filesystem probes, so the
wiring between the two is covered by the scenario rather than only by the tests beside it.

Two things are injected, both in a driver that runs before the archive's own entry point: the version the guard
reads, because a second Python release cannot be conjured on every host, and an empty list of fallback
directories, so the host the guard searches is exactly the ``PATH`` each example builds and not whatever this
machine has installed in ``/usr/local/bin``. Everything below those two lines is the shipped code.

The supported interpreter an example makes reachable is a recording shim named ``python3.14``: it writes how it
was started to a marker file and then becomes this test's own interpreter, so a restart leaves evidence of its
own rather than looking exactly like a run that never restarted.
"""

import shlex
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

import build_zipapp
from ferret import __version__

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

SOURCE = Path(__file__).resolve().parents[3] / "src"
OLD = (3, 13, 12)

DRIVER = """import sys

sys.version_info = {version}
sys.argv = [{archive!r}, "version"]
sys.path.insert(0, {archive!r})

import ferret._bootstrap

ferret._bootstrap.FALLBACK_DIRECTORIES = ()

import runpy

runpy.run_path({archive!r}, run_name="__main__")
"""

SHIM = """#!/bin/sh
printf '%s\\n' "${{FERRET_BOOTSTRAPPED-unset}}" "$@" > {marker}
exec {interpreter} "$@"
"""


@pytest.fixture(scope="module")
def artifact(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The real artifact, built from the current sources exactly as a release builds it."""
    target = tmp_path_factory.mktemp("guarded-steps") / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    return target


@dataclass
class Start:
    """One start of the built artifact, where a restart would record itself, and what the process returned."""

    marker: Path
    environment: dict[str, str] = field(default_factory=dict[str, str])
    old: bool = False
    ran: subprocess.CompletedProcess[str] | None = None


@pytest.fixture
def start(tmp_path: Path) -> Start:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    interpreters = tmp_path / "interpreters"
    interpreters.mkdir()
    return Start(marker=tmp_path / "restarted", environment={"PATH": str(interpreters), "HOME": str(home)})


def reachable_supported_interpreter(start: Start) -> None:
    """Put a ``python3.14`` on the example's PATH that records its start and then runs this interpreter."""
    shim = Path(start.environment["PATH"]) / "python3.14"
    shim.write_text(SHIM.format(marker=shlex.quote(str(start.marker)), interpreter=shlex.quote(sys.executable)))
    shim.chmod(0o755)


@scenario(FEATURE, "Run on a host whose default interpreter is older than FERRET requires")
def test_run_on_a_host_whose_default_interpreter_is_older_than_ferret_requires() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the artifact is started by {started_by}"))
def given_the_artifact_is_started_by(start: Start, started_by: str) -> None:
    if started_by == "an interpreter FERRET supports":
        # A supported interpreter is reachable too, so staying put is a choice the guard makes.
        reachable_supported_interpreter(start)
        return
    start.old = True
    if started_by == "an older interpreter while a supported one is reachable":
        reachable_supported_interpreter(start)
        return
    # The example's PATH is an empty directory and the driver empties the fallback list: nothing to find.
    assert started_by == "an older interpreter with no supported one reachable", started_by


@when("the user runs any FERRET command")
def when_any_command_runs(start: Start, artifact: Path) -> None:
    command = (
        [sys.executable, "-c", DRIVER.format(version=OLD, archive=str(artifact))]
        if start.old
        else [sys.executable, str(artifact), "version"]
    )
    start.ran = subprocess.run(command, capture_output=True, text=True, check=False, env=start.environment)


@then(parsers.parse("FERRET {outcome}"))
def then_ferret(start: Start, outcome: str, artifact: Path) -> None:
    ran = start.ran
    assert ran is not None
    if outcome == "exits 2 naming the version it requires":
        assert (ran.returncode, ran.stdout) == (2, "")
        assert ran.stderr.splitlines() == [
            "ferret: requires Python 3.14 or newer, running 3.13; set FERRET_PYTHON to a suitable interpreter"
        ]
        assert not start.marker.exists()
        return
    assert (ran.returncode, ran.stdout.strip(), ran.stderr) == (0, f"ferret {__version__}", "")
    if outcome == "runs the command on that interpreter":
        assert not start.marker.exists()
        return
    assert outcome == "restarts itself on the supported interpreter", outcome
    # The shim saw the sentinel the guard sets on its child, then the archive and the command it was asked to run.
    assert start.marker.read_text().splitlines() == ["1", str(artifact), "version"]


@then("no Python traceback reaches the caller")
def then_no_traceback(start: Start) -> None:
    ran = start.ran
    assert ran is not None
    # A syntax error from an interpreter that cannot parse the package is printed in the same traceback form.
    assert "Traceback" not in ran.stderr
    assert "SyntaxError" not in ran.stderr
