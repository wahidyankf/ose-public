"""Unit bindings for the interpreter guard: the decision itself, with no process and no real filesystem.

The guard's whole job is a choice — carry on, restart somewhere, or refuse — so at this layer the scenario is
bound to that choice directly. The host it searches is an in-memory table handed to the production ``relaunch``
through its filesystem probes, and the running version and restart are injected too, so nothing here reads a real
directory, starts a process, or depends on which interpreters this machine happens to have. What the guard
decides is then driven through the real artifact at the integration and E2E layers.
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret import _bootstrap
from ferret._bootstrap import relaunch

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature"

ARCHIVE = "/users/example/.local/share/ferret/0.1.1/ferret.pyz"
SUPPORTED = (3, 14, 7)
OLD = (3, 13, 12)
#: The one fallback directory this host has; the real list is replaced so no home directory is ever expanded.
FALLBACK = "/usr/local/bin"
#: Where the reachable supported interpreter lives, off the default directories, so only a real search finds it.
REACHABLE = "/opt/example/bin/python3.14"

type Restart = tuple[str, list[str], dict[str, str]]


class Host:
    """An in-memory filesystem holding only interpreters: each directory's entries, and which paths can be started."""

    def __init__(self, directories: Mapping[str, Sequence[str]]) -> None:
        self.directories = {directory: list(names) for directory, names in directories.items()}

    def listdir(self, directory: str) -> list[str]:
        if directory not in self.directories:
            raise FileNotFoundError(directory)
        return list(self.directories[directory])

    def is_executable(self, path: str) -> bool:
        directory, _, name = path.rpartition("/")
        return name in self.directories.get(directory, [])


@dataclass
class Start:
    """One start of the artifact: what the host offered, and what the guard did about it."""

    environment: dict[str, str] = field(default_factory=dict[str, str])
    host: Host = field(default_factory=lambda: Host({}))
    restarted: list[Restart] = field(default_factory=list[Restart])
    reported: list[str] = field(default_factory=list[str])
    status: int | None = None
    raised: BaseException | None = None


@pytest.fixture
def start(monkeypatch: pytest.MonkeyPatch) -> Start:
    monkeypatch.setattr(_bootstrap, "FALLBACK_DIRECTORIES", (FALLBACK,))
    return Start(environment={"PATH": "/usr/bin"})


@scenario(FEATURE, "Run on a host whose default interpreter is older than FERRET requires")
def test_run_on_a_host_whose_default_interpreter_is_older_than_ferret_requires() -> None:
    """Bound to the feature outline; each example expands independently."""


@given(parsers.parse("the artifact is started by {started_by}"))
def given_the_artifact_is_started_by(start: Start, started_by: str, monkeypatch: pytest.MonkeyPatch) -> None:
    # Every host carries the default python3 and an older versioned one; only what else it holds differs.
    older_only = {"/usr/bin": ["python3", "python3.13"], FALLBACK: ["python3.12"]}
    if started_by == "an interpreter FERRET supports":
        monkeypatch.setattr(_bootstrap.sys, "version_info", SUPPORTED)
        # A supported interpreter is reachable too, so staying put is a choice the guard makes, not the only option.
        start.environment["PATH"] = "/usr/bin:/opt/example/bin"
        start.host = Host({**older_only, "/opt/example/bin": ["python3.14"]})
        return
    monkeypatch.setattr(_bootstrap.sys, "version_info", OLD)
    if started_by == "an older interpreter while a supported one is reachable":
        start.environment["PATH"] = "/usr/bin:/opt/example/bin"
        start.host = Host({**older_only, "/opt/example/bin": ["python3.14"]})
        return
    assert started_by == "an older interpreter with no supported one reachable", started_by
    start.host = Host(older_only)


@when("the user runs any FERRET command")
def when_any_command_runs(start: Start) -> None:
    def restart(path: str, argv: list[str], environ: Mapping[str, str]) -> None:
        start.restarted.append((path, argv, dict(environ)))

    # Whatever escapes relaunch is what its caller would print as a traceback, so it is kept for the Then to judge.
    try:
        start.status = relaunch(
            ARCHIVE,
            ["version"],
            start.environment,
            execute=restart,
            report=start.reported.append,
            listdir=start.host.listdir,
            is_executable=start.host.is_executable,
        )
    except Exception as error:
        start.raised = error


@then(parsers.parse("FERRET {outcome}"))
def then_ferret(start: Start, outcome: str) -> None:
    if outcome == "runs the command on that interpreter":
        # No status and no restart: the entry point goes on to import and run the command in this process.
        assert (start.status, start.restarted, start.reported) == (None, [], [])
        return
    if outcome == "restarts itself on the supported interpreter":
        assert start.status is None
        # The child is the archive on the interpreter found, with the caller's environment plus the sentinel.
        assert start.restarted == [
            (
                REACHABLE,
                [REACHABLE, ARCHIVE, "version"],
                {"PATH": "/usr/bin:/opt/example/bin", "FERRET_BOOTSTRAPPED": "1"},
            )
        ]
        assert start.reported == []
        return
    assert outcome == "exits 2 naming the version it requires", outcome
    assert (start.status, start.restarted) == (2, [])
    assert start.reported == [
        "ferret: requires Python 3.14 or newer, running 3.13; set FERRET_PYTHON to a suitable interpreter"
    ]


@then("no Python traceback reaches the caller")
def then_no_traceback(start: Start) -> None:
    # A traceback reaches the caller only as an exception out of relaunch; anything it says instead is one line.
    assert start.raised is None
    assert all("\n" not in line and "Traceback" not in line for line in start.reported)
