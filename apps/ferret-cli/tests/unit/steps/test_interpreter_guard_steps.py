"""Unit bindings for the interpreter guard: the decision itself, with no process and no filesystem of consequence.

The guard's whole job is a choice — carry on, restart somewhere, or refuse — so at this layer the scenario is
bound to that choice directly. What it decides is then driven through the real artifact at the integration and
E2E layers.
"""

from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret import _bootstrap
from ferret._bootstrap import EXIT_ENVIRONMENT_ERROR, OVERRIDE_VARIABLE, diagnosis, relaunch

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

ARCHIVE = "/users/example/.local/share/ferret/0.1.1/ferret.pyz"
SUPPORTED = (3, 14, 7)
OLD = (3, 13, 12)
SENTINEL = "FERRET_BOOTSTRAPPED"


type Restart = tuple[str, list[str], dict[str, str]]


@dataclass
class Start:
    """One start of the artifact: what the host offered, and what the guard did about it."""

    environment: dict[str, str] = field(default_factory=dict[str, str])
    restarted: list[Restart] = field(default_factory=list[Restart])
    reported: list[str] = field(default_factory=list[str])
    status: int | None = None


@pytest.fixture
def start(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Start:
    # Only the PATH each example builds is searched, so the host's own interpreters cannot answer for it.
    monkeypatch.setattr(_bootstrap, "FALLBACK_DIRECTORIES", ())
    empty = tmp_path / "no-interpreters"
    empty.mkdir()
    return Start(environment={"PATH": str(empty)})


def interpreter(directory: Path, name: str) -> Path:
    path = directory / name
    path.write_text("#!/bin/sh\nexit 0\n")
    path.chmod(0o755)
    return path


@scenario(FEATURE, "Run on a host whose default interpreter is older than FERRET requires")
def test_run_on_a_host_whose_default_interpreter_is_older_than_ferret_requires() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the artifact is started by {started_by}"))
def given_the_artifact_is_started_by(
    start: Start, started_by: str, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    if started_by == "an interpreter FERRET supports":
        monkeypatch.setattr(_bootstrap.sys, "version_info", SUPPORTED)
        return
    monkeypatch.setattr(_bootstrap.sys, "version_info", OLD)
    if started_by == "an older interpreter while a supported one is reachable":
        reachable = tmp_path / "reachable"
        reachable.mkdir()
        start.environment[OVERRIDE_VARIABLE] = str(interpreter(reachable, "python3.14"))
        return
    assert started_by == "an older interpreter with no supported one reachable", started_by


@when("the user runs any FERRET command")
def when_any_command_runs(start: Start) -> None:
    def restart(path: str, argv: list[str], environ: Mapping[str, str]) -> None:
        start.restarted.append((path, argv, dict(environ)))

    start.status = relaunch(ARCHIVE, ["version"], start.environment, execute=restart, report=start.reported.append)


@then(parsers.parse("FERRET {outcome}"))
def then_ferret(start: Start, outcome: str) -> None:
    if outcome == "runs the command on that interpreter":
        assert (start.status, start.restarted, start.reported) == (None, [], [])
        return
    if outcome == "restarts itself on the supported interpreter":
        wanted = start.environment[OVERRIDE_VARIABLE]
        assert start.status is None
        # The child carries the caller's environment plus the sentinel, and nothing else changes.
        assert start.restarted == [(wanted, [wanted, ARCHIVE, "version"], {**start.environment, SENTINEL: "1"})]
        assert start.reported == []
        return
    assert outcome == "exits 3 naming the version it requires", outcome
    assert (start.status, start.restarted) == (EXIT_ENVIRONMENT_ERROR, [])
    assert start.reported == [diagnosis(OLD)]


@then("no Python traceback and no syntax error reaches the caller")
def then_no_traceback(start: Start) -> None:
    # The guard decides before anything 3.14-only is imported, so the only thing it can ever emit is its own line.
    assert all(line == diagnosis(OLD) for line in start.reported)
