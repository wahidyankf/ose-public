"""E2E bindings for the interpreter guard: the published artifact started by an interpreter that cannot run it.

The process here is the real one — the built zipapp, its own generated entry point, a real ``PATH`` search, and a
real restart. The older interpreter is a real one too: the system ``python3`` of every supported host predates 3.14,
so the archive is parsed and run by an interpreter that genuinely cannot run FERRET, and a construct it cannot parse
would surface as the traceback the last step rules out. One thing is injected, in a driver that runs before the
archive's entry point: an empty list of fallback directories, so the host the guard searches is exactly the ``PATH``
each example builds rather than whatever this machine has installed.

The supported interpreter an example makes reachable is a recording shim named ``python3.14``: it writes how it
was started to a marker file and then becomes this test's own interpreter, so a restart leaves evidence of its
own.
"""

import shlex
import subprocess
import sys
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

#: Where a host keeps the interpreter it ships, which every supported host has and none yet ships at 3.14.
SYSTEM_INTERPRETERS = ("/usr/bin/python3", *(f"/usr/bin/python3.{minor}" for minor in range(13, 7, -1)))
REQUIRED_LINE = "ferret: requires Python 3.14 or newer, running {running}; set FERRET_PYTHON to a suitable interpreter"

DRIVER = """import sys

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


@dataclass(frozen=True)
class OlderInterpreter:
    """A real interpreter older than FERRET requires, and the ``major.minor`` it reports about itself."""

    path: str
    running: str


def older_interpreters() -> Iterator[OlderInterpreter]:
    for path in SYSTEM_INTERPRETERS:
        if not Path(path).is_file():
            continue
        probe = [path, "-c", "import sys; print('%d.%d' % sys.version_info[:2])"]
        asked = subprocess.run(probe, capture_output=True, text=True, check=False, env={"PATH": "/usr/bin:/bin"})
        running = asked.stdout.strip()
        if asked.returncode == 0 and tuple(int(part) for part in running.split(".")) < (3, 14):
            yield OlderInterpreter(path, running)


@pytest.fixture(scope="module")
def older_interpreter() -> OlderInterpreter:
    """The host's own older interpreter; a host without one cannot answer these examples, so that fails loudly."""
    found = next(older_interpreters(), None)
    if found is None:
        pytest.fail(f"no interpreter older than 3.14 at any of {SYSTEM_INTERPRETERS}", pytrace=False)
    return found


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
def when_any_command_runs(started: Started, artifact: Path, older_interpreter: OlderInterpreter) -> None:
    if not started.old:
        started.ran = subprocess.run(
            [sys.executable, str(artifact), "version"],
            capture_output=True,
            text=True,
            check=False,
            env=started.environment,
        )
        return
    driver = DRIVER.format(archive=str(artifact))
    started.ran = subprocess.run(
        [older_interpreter.path, "-c", driver], capture_output=True, text=True, check=False, env=started.environment
    )


@then(parsers.parse("FERRET {outcome}"))
def then_ferret(
    started: Started, outcome: str, version_line: str, artifact: Path, older_interpreter: OlderInterpreter
) -> None:
    ran = started.ran
    assert ran is not None
    if outcome == "exits 2 naming the version it requires":
        assert (ran.returncode, ran.stdout) == (2, "")
        assert ran.stderr.splitlines() == [REQUIRED_LINE.format(running=older_interpreter.running)]
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
