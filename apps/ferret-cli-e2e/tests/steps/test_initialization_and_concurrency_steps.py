"""E2E bindings for the initialization and concurrency feature: the built artifact, run from real repositories."""

import json
import os
import sqlite3
import stat
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from event_documents import encode_document, now_stamp, sealed_event
from ferret_process import Completed, run_artifact

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature"

HARNESSES = ("claude_code", "codex", "opencode")
ADAPTERS = len(HARNESSES)
BURST_SIZE = 6


def literal(value: str, home: Path) -> str:
    """The path a feature names, placed under the test's own directory when it is absolute under /srv.

    Nothing may be written outside the test's temporary directory, so the feature's sample paths are moved there.
    """
    if value.startswith("/srv/"):
        return str(home.parent / value.removeprefix("/"))
    return value


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home with two repositories beside it, and each init's parsed result."""

    artifact: Path
    home: Path
    repositories: tuple[Path, Path]
    documents: list[dict[str, Any]] = field(default_factory=lambda: list[dict[str, Any]]())
    environment: dict[str, str] = field(default_factory=lambda: dict[str, str]())
    last: Completed | None = None

    @property
    def data_home(self) -> Path:
        return self.home / ".local" / "share" / "ferret"


@pytest.fixture
def session(artifact: Path, home: Path, tmp_path: Path) -> Session:
    repositories = (tmp_path / "work" / "repo-a", tmp_path / "work" / "repo-b")
    for repository in repositories:
        repository.mkdir(parents=True)
    return Session(artifact=artifact, home=home, repositories=repositories)


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: ferret init from two repositories resolves one data home
@scenario(FEATURE, "ferret init from two repositories resolves one data home")
def test_ferret_init_from_two_repositories_resolves_one_data_home() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("FERRET has not been initialized for the current operating-system user")
def given_not_initialized(session: Session) -> None:
    assert not session.data_home.exists()


@when("the user runs ferret init from two different repositories")
def when_init_from_two_repositories(session: Session) -> None:
    for repository in session.repositories:
        completed = run_artifact(session.artifact, ["init", "--json"], home=session.home, cwd=repository)
        assert completed.returncode == 0
        assert completed.stderr == b""
        session.documents.append(json.loads(completed.stdout))


@then("both commands resolve the same private data home and SQLite database")
def then_same_home_and_database(session: Session) -> None:
    first, second = session.documents
    assert first["dataHome"] == second["dataHome"] == str(session.data_home)
    assert first["databasePath"] == second["databasePath"] == str(session.data_home / "ferret.sqlite3")
    assert (session.data_home / "ferret.sqlite3").is_file()


@then("POSIX modes make every artifact private")
def then_every_artifact_private(session: Session) -> None:
    assert stat.S_IMODE(session.data_home.stat().st_mode) == 0o700
    assert {stat.S_IMODE(path.lstat().st_mode) for path in session.data_home.iterdir()} == {0o600}
    assert all(path.stat().st_uid == os.getuid() for path in session.data_home.iterdir())


@then("no repository-local telemetry database is created")
def then_no_repository_database(session: Session) -> None:
    for repository in session.repositories:
        assert list(repository.rglob("*")) == []


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: Every created file and directory is owner-only
@scenario(FEATURE, "Every created file and directory is owner-only")
def test_every_created_file_and_directory_is_owner_only() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user runs ferret init")
def when_the_user_runs_init(session: Session) -> None:
    session.last = run_artifact(
        session.artifact,
        ["init", "--json"],
        home=session.home,
        cwd=session.repositories[0],
        extra_environment=session.environment,
    )
    if session.last.returncode == 0:
        session.documents.append(json.loads(session.last.stdout))


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: No telemetry file is created inside a repository
@scenario(FEATURE, "No telemetry file is created inside a repository")
def test_no_telemetry_file_is_created_inside_a_repository() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: Capture concurrently across repositories
@scenario(FEATURE, "Capture concurrently across repositories")
def test_capture_concurrently_across_repositories() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@dataclass(frozen=True, slots=True)
class Attempt:
    """One capture process: its exit code, its parsed result, and how long it took."""

    code: int
    stderr: bytes
    result: str | None
    elapsed: float


@dataclass(slots=True)
class BurstSession:
    """The built artifact, an isolated home shared by three repositories, and each adapter's burst."""

    artifact: Path
    home: Path
    repositories: tuple[Path, ...]
    bursts: list[list[Attempt]] = field(default_factory=lambda: list[list[Attempt]]())
    stamp: str = ""

    @property
    def database(self) -> Path:
        return self.home / ".local" / "share" / "ferret" / "ferret.sqlite3"


def burst_event_id(adapter: int, sequence: int) -> str:
    return f"00000000-0000-4000-8000-{adapter:04x}{sequence:08x}"


def workspace_of(adapter: int) -> str:
    return f"ws_{adapter + 1:032x}"


def burst_document(adapter: int, sequence: int, stamp: str) -> dict[str, Any]:
    """One adapter's event: its own harness, its own repository's workspace, and an ID no other adapter uses."""
    return sealed_event(
        eventId=burst_event_id(adapter, sequence),
        harness=HARNESSES[adapter],
        workspaceId=workspace_of(adapter),
        occurredAt=stamp,
        capturedAt=stamp,
    )


def burst_documents(stamp: str) -> list[dict[str, Any]]:
    return sorted(
        (burst_document(adapter, sequence, stamp) for adapter in range(ADAPTERS) for sequence in range(BURST_SIZE)),
        key=lambda document: document["eventId"],
    )


def stored_rows(session: BurstSession) -> list[dict[str, str]]:
    with closing(sqlite3.connect(session.database)) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(
            "SELECT event_id, event_hash, harness, workspace_id, occurred_at, session_id, tool_name"
            " FROM event ORDER BY event_id"
        )
        return [dict(row) for row in cursor]


@pytest.fixture
def burst_session(artifact: Path, home: Path, tmp_path: Path) -> BurstSession:
    repositories = tuple(tmp_path / "work" / f"repo-{harness}" for harness in HARNESSES)
    for repository in repositories:
        repository.mkdir(parents=True)
    return BurstSession(artifact=artifact, home=home, repositories=repositories)


def submit_burst(session: BurstSession, adapter: int, stamp: str) -> list[Attempt]:
    attempts: list[Attempt] = []
    for sequence in range(BURST_SIZE):
        document = burst_document(adapter, sequence, stamp)
        started = time.perf_counter()
        completed = run_artifact(
            session.artifact,
            ["capture", "--json"],
            home=session.home,
            stdin=encode_document(document),
            cwd=session.repositories[adapter],
        )
        elapsed = time.perf_counter() - started
        result = json.loads(completed.stdout)["result"] if completed.stdout else None
        attempts.append(Attempt(completed.returncode, completed.stderr, result, elapsed))
    return attempts


@given("three repositories and three harness adapters use the same initialized data home")
def given_three_adapters_share_one_home(burst_session: BurstSession) -> None:
    initialized = run_artifact(burst_session.artifact, ["init", "--json"], home=burst_session.home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    assert stored_rows(burst_session) == []


@when("each adapter submits a bounded burst of unique events concurrently")
def when_each_adapter_submits_a_burst(burst_session: BurstSession) -> None:
    stamp = now_stamp()

    def burst(adapter: int) -> list[Attempt]:
        return submit_burst(burst_session, adapter, stamp)

    with ThreadPoolExecutor(max_workers=ADAPTERS) as pool:
        burst_session.bursts = list(pool.map(burst, range(ADAPTERS)))
    burst_session.stamp = stamp


@then("every successful direct capture has exactly one durable row")
def then_every_capture_has_one_row(burst_session: BurstSession) -> None:
    attempts = [attempt for burst in burst_session.bursts for attempt in burst]
    assert [(attempt.code, attempt.stderr, attempt.result) for attempt in attempts] == [(0, b"", "stored")] * len(
        attempts
    )
    rows = stored_rows(burst_session)
    assert [row["event_id"] for row in rows] == [
        document["eventId"] for document in burst_documents(burst_session.stamp)
    ]
    for adapter, harness in enumerate(HARNESSES):
        held = [row for row in rows if row["harness"] == harness]
        assert len(held) == BURST_SIZE
        assert {row["workspace_id"] for row in held} == {workspace_of(adapter)}


@then("every stored row matches its submitted event exactly and none is duplicated")
def then_every_row_matches_and_none_is_duplicated(burst_session: BurstSession) -> None:
    expected = [
        {
            "event_id": document["eventId"],
            "event_hash": document["eventHash"],
            "harness": document["harness"],
            "workspace_id": document["workspaceId"],
            "occurred_at": document["occurredAt"],
            "session_id": document["sessionId"],
            "tool_name": document["toolName"],
        }
        for document in burst_documents(burst_session.stamp)
    ]
    assert stored_rows(burst_session) == expected
    with closing(sqlite3.connect(burst_session.database)) as connection:
        assert connection.execute("PRAGMA integrity_check").fetchall() == [("ok",)]


@then("every adapter returns within 1000 milliseconds")
def then_every_adapter_returns_within_a_second(burst_session: BurstSession) -> None:
    assert max(attempt.elapsed for burst in burst_session.bursts for attempt in burst) < 1.0


@given("FERRET has already been initialized for the current operating-system user")
def given_already_initialized(session: Session) -> None:
    initialized = run_artifact(session.artifact, ["init", "--json"], home=session.home, cwd=session.repositories[0])
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    session.documents.append(json.loads(initialized.stdout))


@when("the user runs ferret init again")
def when_the_user_runs_init_again(session: Session) -> None:
    session.last = run_artifact(session.artifact, ["init", "--json"], home=session.home, cwd=session.repositories[1])
    assert session.last.returncode == 0
    session.documents.append(json.loads(session.last.stdout))


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: Running ferret init again reports already_initialized and changes nothing
@scenario(FEATURE, "Running ferret init again reports already_initialized and changes nothing")
def test_running_ferret_init_again_reports_already_initialized_and_changes_nothing() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@then("the command reports already_initialized and keeps the same installation identity and schema")
def then_init_again_reports_already_initialized(session: Session) -> None:
    first, again = session.documents
    assert (first["result"], again["result"]) == ("created", "already_initialized")
    assert first["installationId"] == again["installationId"]
    assert first["schemaNumber"] == again["schemaNumber"]


@given(parsers.parse("the environment sets {name} to {value}"))
def given_the_environment_sets(session: Session, name: str, value: str) -> None:
    session.environment[name] = literal(value, session.home)


@given("neither FERRET_DATA_HOME nor XDG_DATA_HOME is set")
def given_neither_data_home_variable_is_set(session: Session) -> None:
    assert session.environment == {}


@then(parsers.parse("the data home is {path}"))
def then_the_data_home_is(session: Session, path: str) -> None:
    assert session.last is not None
    assert (session.last.returncode, session.last.stderr) == (0, b"")
    assert json.loads(session.last.stdout)["dataHome"] == literal(path, session.home)


@then("the store is kept under HOME at .local/share/ferret")
def then_the_store_is_kept_under_home(session: Session) -> None:
    assert session.last is not None
    assert json.loads(session.last.stdout)["dataHome"] == str(session.home / ".local" / "share" / "ferret")


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: FERRET_DATA_HOME relocates the data home
@scenario(FEATURE, "FERRET_DATA_HOME relocates the data home")
def test_ferret_data_home_relocates_the_data_home() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: XDG_DATA_HOME sets the data home base
@scenario(FEATURE, "XDG_DATA_HOME sets the data home base")
def test_xdg_data_home_sets_the_data_home_base() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: HOME is the fallback data home base
@scenario(FEATURE, "HOME is the fallback data home base")
def test_home_is_the_fallback_data_home_base() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: A relative or unsafe FERRET_DATA_HOME reports ferret.storage.unsafe
@scenario(FEATURE, "A relative or unsafe FERRET_DATA_HOME reports ferret.storage.unsafe")
def test_a_relative_or_unsafe_ferret_data_home_reports_storage_unsafe() -> None:
    """Bound to the feature outline; each example expands independently."""


@then("the command exits 2 with ferret.storage.unsafe on stderr and creates no data home")
def then_unsafe_data_home_is_refused(session: Session) -> None:
    assert session.last is not None
    assert (session.last.returncode, session.last.stdout) == (2, b"")
    assert json.loads(session.last.stderr)["error"]["code"] == "ferret.storage.unsafe"
    assert not session.data_home.exists()


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: A command on an uninitialized store exits 2 with ferret.storage.uninitialized
@scenario(FEATURE, "A command on an uninitialized store exits 2 with ferret.storage.uninitialized")
def test_a_command_on_an_uninitialized_store_exits_2_with_storage_uninitialized() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user runs events list")
def when_the_user_runs_events_list(session: Session) -> None:
    session.last = run_artifact(session.artifact, ["events", "list", "--json"], home=session.home)


@then("the command exits 2 with ferret.storage.uninitialized on stderr and nothing on stdout")
def then_uninitialized_store_is_refused(session: Session) -> None:
    assert session.last is not None
    assert (session.last.returncode, session.last.stdout) == (2, b"")
    assert json.loads(session.last.stderr)["error"]["code"] == "ferret.storage.uninitialized"


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: status reports paths, runtime, storage, health, and adapters
@scenario(FEATURE, "status reports paths, runtime, storage, health, and adapters")
def test_status_reports_paths_runtime_storage_health_and_adapters() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user runs status")
def when_the_user_runs_status(session: Session) -> None:
    session.last = run_artifact(session.artifact, ["status", "--json"], home=session.home)


@then("the status names the data home, the database, the runtime, the storage sizes, the health, and each adapter")
def then_status_names_its_parts(session: Session) -> None:
    assert session.last is not None
    assert (session.last.returncode, session.last.stderr) == (0, b"")
    document = json.loads(session.last.stdout)
    assert document["dataHome"] == str(session.data_home)
    assert document["databasePath"] == str(session.data_home / "ferret.sqlite3")
    assert {"runtime", "databaseBytes", "walBytes", "freelistBytes", "integrityState"} <= set(document)
    assert isinstance(document["adapters"], list)
