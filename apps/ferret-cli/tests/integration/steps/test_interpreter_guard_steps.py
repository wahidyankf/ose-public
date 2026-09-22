"""Integration bindings for the interpreter guard: the real artifact, a real process, a real restart.

The unit bindings decide the guard's choice from pure inputs. These carry the same scenario through the built
zipapp and its generated entry point, so the wiring between the two is covered by the scenario rather than only
by the tests beside it.
"""

import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

import build_zipapp
from ferret import __version__
from ferret._bootstrap import OVERRIDE_VARIABLE, SENTINEL_VARIABLE, diagnosis

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

SOURCE = Path(__file__).resolve().parents[3] / "src"
OLD = (3, 13, 12)

DRIVER = """import sys

sys.version_info = {version}
sys.argv = [{archive!r}, "version"]
sys.path.insert(0, {archive!r})

import runpy

runpy.run_path({archive!r}, run_name="__main__")
"""


@pytest.fixture(scope="module")
def artifact(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The real artifact, built from the current sources exactly as a release builds it."""
    target = tmp_path_factory.mktemp("guarded-steps") / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    return target


@dataclass
class Start:
    """One start of the built artifact and what the process returned."""

    environment: dict[str, str] = field(default_factory=dict[str, str])
    old: bool = False
    ran: subprocess.CompletedProcess[str] | None = None


@pytest.fixture
def start(tmp_path: Path) -> Start:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    return Start(environment={"PATH": "/usr/bin:/bin", "HOME": str(home)})


@scenario(FEATURE, "Run on a host whose default interpreter is older than FERRET requires")
def test_run_on_a_host_whose_default_interpreter_is_older_than_ferret_requires() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the artifact is started by {started_by}"))
def given_the_artifact_is_started_by(start: Start, started_by: str, tmp_path: Path) -> None:
    if started_by == "an interpreter FERRET supports":
        return
    start.old = True
    if started_by == "an older interpreter while a supported one is reachable":
        start.environment[OVERRIDE_VARIABLE] = sys.executable
        return
    assert started_by == "an older interpreter with no supported one reachable", started_by
    empty = tmp_path / "no-interpreters"
    empty.mkdir()
    # The sentinel stands in for the one state a test cannot build: every search directory looked at, none usable.
    start.environment["PATH"] = str(empty)
    start.environment[SENTINEL_VARIABLE] = "1"


@when("the user runs any FERRET command")
def when_any_command_runs(start: Start, artifact: Path) -> None:
    command = (
        [sys.executable, "-c", DRIVER.format(version=OLD, archive=str(artifact))]
        if start.old
        else [sys.executable, str(artifact), "version"]
    )
    start.ran = subprocess.run(command, capture_output=True, text=True, check=False, env=start.environment)


@then(parsers.parse("FERRET {outcome}"))
def then_ferret(start: Start, outcome: str) -> None:
    ran = start.ran
    assert ran is not None
    if outcome == "exits 2 naming the version it requires":
        assert (ran.returncode, ran.stdout) == (2, "")
        assert ran.stderr.splitlines() == [diagnosis(OLD)]
        return
    assert outcome in ("runs the command on that interpreter", "restarts itself on the supported interpreter")
    assert (ran.returncode, ran.stdout.strip(), ran.stderr) == (0, f"ferret {__version__}", "")


@then("no Python traceback and no syntax error reaches the caller")
def then_no_traceback(start: Start) -> None:
    ran = start.ran
    assert ran is not None
    assert "Traceback" not in ran.stderr
    assert "SyntaxError" not in ran.stderr
