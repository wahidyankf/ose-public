"""The built artifact on a host whose interpreter is older than FERRET requires.

The unit tests decide every branch of the guard from pure inputs. What they cannot show is the wiring: that the
generated ``__main__.py`` really reaches the guard before importing the command line, that the guard really
replaces the process, and that the archive really runs to completion on the interpreter it picked.

These run the real artifact in a real subprocess. Only one thing is injected — the version the guard reads —
because a second Python release cannot be conjured on every host, and making the suite depend on one would trade
this defect for a host-dependent gate. The driver patches ``sys.version_info`` and nothing else, so every path it
exercises below that line is the shipped one.
"""

import subprocess
import sys
from pathlib import Path

import pytest

import build_zipapp
from ferret import __version__
from ferret._bootstrap import OVERRIDE_VARIABLE, SENTINEL_VARIABLE

SOURCE = Path(__file__).resolve().parents[2] / "src"

DRIVER = """import sys

sys.version_info = {version}
sys.argv = [{archive!r}] + {arguments!r}
sys.path.insert(0, {archive!r})

import runpy

runpy.run_path({archive!r}, run_name="__main__")
"""


@pytest.fixture(scope="module")
def artifact(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The real artifact, built from the current sources exactly as a release builds it."""
    target = tmp_path_factory.mktemp("guarded") / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    return target


def as_if_old(
    artifact: Path, arguments: list[str], *, environment: dict[str, str], version: tuple[int, int, int]
) -> subprocess.CompletedProcess[str]:
    """Run the artifact's own entry point with the guard told it is on ``version``."""
    driver = DRIVER.format(version=version, archive=str(artifact), arguments=arguments)
    return subprocess.run([sys.executable, "-c", driver], capture_output=True, text=True, check=False, env=environment)


def test_the_artifact_runs_the_command_when_the_interpreter_is_already_supported(artifact: Path) -> None:
    ran = subprocess.run([sys.executable, str(artifact), "version"], capture_output=True, text=True, check=False)
    assert (ran.returncode, ran.stdout.strip(), ran.stderr) == (0, f"ferret {__version__}", "")


def test_an_older_interpreter_restarts_the_artifact_and_the_command_still_succeeds(
    artifact: Path, tmp_path: Path
) -> None:
    """The defect this module exists for: before the guard, this raised SyntaxError from inside the archive."""
    ran = as_if_old(
        artifact,
        ["version"],
        environment={"PATH": "/usr/bin:/bin", OVERRIDE_VARIABLE: sys.executable, "HOME": str(tmp_path)},
        version=(3, 13, 12),
    )
    assert ran.returncode == 0
    assert ran.stdout.strip() == f"ferret {__version__}"
    assert "SyntaxError" not in ran.stderr
    assert ran.stderr == ""


def test_an_older_interpreter_with_nothing_to_restart_on_exits_two_with_one_line_and_no_traceback(
    artifact: Path, tmp_path: Path
) -> None:
    empty = tmp_path / "empty"
    empty.mkdir()
    ran = as_if_old(
        artifact,
        ["version"],
        # The sentinel stands in for the one case a test cannot build: every search directory examined, none usable.
        environment={"PATH": str(empty), SENTINEL_VARIABLE: "1", "HOME": str(tmp_path)},
        version=(3, 13, 12),
    )
    assert ran.returncode == 2
    assert ran.stdout == ""
    assert ran.stderr.splitlines() == [
        f"ferret: requires Python 3.14 or newer, running 3.13; set {OVERRIDE_VARIABLE} to a suitable interpreter"
    ]
    assert "Traceback" not in ran.stderr


def test_the_restarted_command_still_reaches_the_store_and_reports_it_is_uninitialized(
    artifact: Path, tmp_path: Path
) -> None:
    """A restart must land in the real command, not merely in a working interpreter."""
    ran = as_if_old(
        artifact,
        ["status", "--json"],
        environment={
            "PATH": "/usr/bin:/bin",
            OVERRIDE_VARIABLE: sys.executable,
            "HOME": str(tmp_path),
            "FERRET_DATA_HOME": str(tmp_path / "data"),
        },
        version=(3, 13, 12),
    )
    # A failing command reports on standard error, so this also shows the guard left both streams to the command.
    assert ran.returncode == 2
    assert '"code":"ferret.storage.uninitialized"' in ran.stderr
    assert ran.stdout == ""


def test_the_capture_hook_path_stays_silent_when_no_interpreter_can_run_ferret(tmp_path: Path) -> None:
    """The hook is the path that loses events in silence, so it must never print a diagnostic into a harness."""
    empty = tmp_path / "empty"
    empty.mkdir()
    ran = subprocess.run(
        [
            str(Path(__file__).resolve().parents[4] / ".claude" / "hooks" / "ferret-capture.sh"),
            "claude_code",
            "PostToolUse",
        ],
        input="{}",
        capture_output=True,
        text=True,
        check=False,
        env={"PATH": str(empty), "HOME": str(tmp_path)},
    )
    assert (ran.returncode, ran.stdout, ran.stderr) == (0, "", "")
