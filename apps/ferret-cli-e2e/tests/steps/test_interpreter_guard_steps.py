"""E2E bindings for the interpreter guard: the published artifact started by an interpreter that cannot run it.

The process here is the real one — the built zipapp, its own generated entry point, a real ``PATH`` search, and a
real restart. Two things are injected, in a driver that runs before the archive's entry point: the version the
guard reads, because a host cannot be relied on to carry a second Python release, and an empty list of fallback
directories, so the host the guard searches is exactly the ``PATH`` each example builds rather than whatever this
machine has installed. A suite that needed a particular machine would be answering for it rather than for FERRET.

The supported interpreter an example makes reachable is a recording shim named ``python3.14``: it writes how it
was started to a marker file and then becomes this test's own interpreter, so a restart leaves evidence of its
own.
"""

import shlex
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

OLD_VERSION = (3, 13, 12)
REQUIRED_LINE = "ferret: requires Python 3.14 or newer, running 3.13; set FERRET_PYTHON to a suitable interpreter"

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


@dataclass
class Started:
    """One attempt to start the artifact, where a restart would record itself, and what came back."""

    environment: dict[str, str]
    marker: Path
    old: bool = False
    ran: subprocess.CompletedProcess[str] | None = None


@pytest.fixture
def interpreters(tmp_path: Path) -> Path:
    """The only directory on the example's PATH: empty unless the example makes an interpreter reachable."""
    directory = tmp_path / "interpreters"
    directory.mkdir()
    return directory


@pytest.fixture
def started(home: Path, interpreters: Path, tmp_path: Path) -> Started:
    return Started(environment={"PATH": str(interpreters), "HOME": str(home)}, marker=tmp_path / "restarted")


def reachable_supported_interpreter(started: Started, interpreters: Path) -> None:
    """Put a ``python3.14`` on the example's PATH that records its start and then runs this interpreter."""
    shim = interpreters / "python3.14"
    shim.write_text(SHIM.format(marker=shlex.quote(str(started.marker)), interpreter=shlex.quote(sys.executable)))
    shim.chmod(0o755)


@scenario(FEATURE, "Run on a host whose default interpreter is older than FERRET requires")
def test_run_on_a_host_whose_default_interpreter_is_older_than_ferret_requires() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the artifact is started by {interpreter}"))
def given_the_artifact_is_started_by(started: Started, interpreter: str, interpreters: Path) -> None:
    if interpreter == "an interpreter FERRET supports":
        # A supported interpreter is reachable too, so staying put is a choice the guard makes.
        reachable_supported_interpreter(started, interpreters)
        return
    started.old = True
    if interpreter == "an older interpreter while a supported one is reachable":
        reachable_supported_interpreter(started, interpreters)
        return
    # The example's PATH is an empty directory and the driver empties the fallback list: nothing to find.
    assert interpreter == "an older interpreter with no supported one reachable", interpreter


@when("the user runs any FERRET command")
def when_any_command_runs(started: Started, artifact: Path) -> None:
    if not started.old:
        started.ran = subprocess.run(
            [sys.executable, str(artifact), "version"],
            capture_output=True,
            text=True,
            check=False,
            env=started.environment,
        )
        return
    driver = DRIVER.format(version=OLD_VERSION, archive=str(artifact))
    started.ran = subprocess.run(
        [sys.executable, "-c", driver], capture_output=True, text=True, check=False, env=started.environment
    )


@then(parsers.parse("FERRET {outcome}"))
def then_ferret(started: Started, outcome: str, version_line: str, artifact: Path) -> None:
    ran = started.ran
    assert ran is not None
    if outcome == "exits 2 naming the version it requires":
        assert (ran.returncode, ran.stdout) == (2, "")
        assert ran.stderr.splitlines() == [REQUIRED_LINE]
        assert not started.marker.exists()
        return
    assert (ran.returncode, ran.stdout, ran.stderr) == (0, version_line, "")
    if outcome == "runs the command on that interpreter":
        assert not started.marker.exists()
        return
    assert outcome == "restarts itself on the supported interpreter", outcome
    # The shim saw the sentinel the guard sets on its child, then the archive and the command it was asked to run.
    assert started.marker.read_text().splitlines() == ["1", str(artifact), "version"]


@pytest.fixture
def version_line(artifact: Path) -> str:
    """What ``version`` prints, taken from the artifact under test rather than repeated here."""
    ran = subprocess.run([sys.executable, str(artifact), "version"], capture_output=True, text=True, check=False)
    return ran.stdout


@then("no Python traceback reaches the caller")
def then_no_traceback(started: Started) -> None:
    ran = started.ran
    assert ran is not None
    # A syntax error from an interpreter that cannot parse the package is printed in the same traceback form.
    assert "Traceback" not in ran.stderr
    assert "SyntaxError" not in ran.stderr
