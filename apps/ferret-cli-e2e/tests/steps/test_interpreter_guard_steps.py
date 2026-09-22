"""E2E bindings for the interpreter guard: the published artifact started by an interpreter that cannot run it.

The process here is the real one — the built zipapp, its own generated entry point, and a real restart. The only
thing injected is the version the guard reads, because a host cannot be relied on to carry a second Python
release, and a suite that needed one would be answering for the machine rather than for FERRET.
"""

import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

OLD_VERSION = (3, 13, 12)
REQUIRED_LINE = "ferret: requires Python 3.14 or newer, running 3.13; set FERRET_PYTHON to a suitable interpreter"
SENTINEL = "FERRET_BOOTSTRAPPED"
OVERRIDE = "FERRET_PYTHON"

DRIVER = """import sys

sys.version_info = {version}
sys.argv = [{archive!r}, "version"]
sys.path.insert(0, {archive!r})

import runpy

runpy.run_path({archive!r}, run_name="__main__")
"""


@dataclass
class Started:
    """One attempt to start the artifact, and what came back."""

    environment: dict[str, str]
    old: bool = False
    ran: subprocess.CompletedProcess[str] | None = None


@pytest.fixture
def started(home: Path) -> Started:
    return Started(environment={"PATH": "/usr/bin:/bin", "HOME": str(home)})


@scenario(FEATURE, "Run on a host whose default interpreter is older than FERRET requires")
def test_run_on_a_host_whose_default_interpreter_is_older_than_ferret_requires() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the artifact is started by {interpreter}"))
def given_the_artifact_is_started_by(started: Started, interpreter: str, empty: Path) -> None:
    if interpreter == "an interpreter FERRET supports":
        return
    started.old = True
    if interpreter == "an older interpreter while a supported one is reachable":
        started.environment[OVERRIDE] = sys.executable
        return
    assert interpreter == "an older interpreter with no supported one reachable", interpreter
    # The sentinel stands in for the one state a test cannot build: every search directory looked at, none usable.
    started.environment["PATH"] = str(empty)
    started.environment[SENTINEL] = "1"


@pytest.fixture
def empty(tmp_path: Path) -> Path:
    """A directory with no interpreter in it, so the search has somewhere real to look and find nothing."""
    directory = tmp_path / "no-interpreters"
    directory.mkdir()
    return directory


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
def then_ferret(started: Started, outcome: str, version_line: str) -> None:
    ran = started.ran
    assert ran is not None
    if outcome == "exits 2 naming the version it requires":
        assert (ran.returncode, ran.stdout) == (2, "")
        assert ran.stderr.splitlines() == [REQUIRED_LINE]
        return
    assert outcome in ("runs the command on that interpreter", "restarts itself on the supported interpreter")
    assert (ran.returncode, ran.stdout, ran.stderr) == (0, version_line, "")


@pytest.fixture
def version_line(artifact: Path) -> str:
    """What ``version`` prints, taken from the artifact under test rather than repeated here."""
    ran = subprocess.run([sys.executable, str(artifact), "version"], capture_output=True, text=True, check=False)
    return ran.stdout


@then("no Python traceback and no syntax error reaches the caller")
def then_no_traceback(started: Started) -> None:
    ran = started.ran
    assert ran is not None
    assert "Traceback" not in ran.stderr
    assert "SyntaxError" not in ran.stderr
