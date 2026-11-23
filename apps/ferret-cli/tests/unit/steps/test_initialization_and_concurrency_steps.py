"""Unit bindings for the initialization and concurrency feature, in process with every OS dependency faked."""

import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field, replace
from datetime import datetime
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when
from typekit import Err

from ferret.adapters.filesystem import resolve_data_home
from ferret.adapters.system import home_directory
from ferret.application.initialization import initialize_store
from ferret.application.ports import Budget, PruneResult, Runtime
from ferret.domain.errors import FerretResult
from ferret.domain.event import Event, event_from_document
from support.events import encode, event_document
from support.fakes import FAKE_HOME, FIXED_NOW, FakeInput, FakeMonotonic, FakeTelemetry, World, make_world
from support.invoke import Ran, run_cli, run_runtime
from support.populate import FAR_FUTURE
from support.results import value_of
from support.retention import expired_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature"
REPOSITORIES = (FAKE_HOME / "work" / "repo-a", FAKE_HOME / "work" / "repo-b")
HARNESSES = ("claude_code", "codex", "opencode")
BURST_SIZE = 20
# Rows already expired in the shared store, so every capture also pays for the bounded prune it rides on.
EXPIRED_BACKLOG = 400
# Numbered well clear of the burst's IDs, which carry the adapter in their leading digits.
BACKLOG_FIRST = 900_000_000_001
# Each reading of an adapter's monotonic clock costs this much, so the time a capture spends is known exactly.
MILLISECONDS_PER_READING = 15


class SerializedTelemetry(FakeTelemetry):
    """The fake telemetry with each prune taken under the event store's lock, as SQLite's write lock serializes it.

    The shared fake removes rows without a lock, so two adapters pruning at once could race on the same row; the real
    store never lets them.
    """

    __slots__ = ()

    def prune_batch(self, *, now: datetime, limit: int, budget: Budget) -> FerretResult[PruneResult]:
        with self.events.lock:
            return super().prune_batch(now=now, limit=limit, budget=budget)


@dataclass(frozen=True, slots=True)
class Attempt:
    """One capture invocation: its exit code, its output, the event it submitted, and its own clock's cost."""

    code: int
    stdout: str
    stderr: str
    document: dict[str, Any]
    elapsed_ms: int


@dataclass(slots=True)
class Session:
    """The fake machine, what each invocation returned, and each adapter's runtime and burst."""

    world: World
    documents: list[dict[str, Any]] = field(default_factory=lambda: list[dict[str, Any]]())
    expired: list[Event] = field(default_factory=lambda: list[Event]())
    runtimes: list[Runtime] = field(default_factory=lambda: list[Runtime]())
    clocks: list[FakeMonotonic] = field(default_factory=lambda: list[FakeMonotonic]())
    bursts: list[list[Attempt]] = field(default_factory=lambda: list[list[Attempt]]())
    environment: dict[str, str] = field(default_factory=lambda: dict[str, str]())
    refusal: str | None = None
    refusal_exit_code: int | None = None
    ran: Ran | None = None


def unique_event_id(adapter: int, sequence: int) -> str:
    return f"00000000-0000-4000-8000-{adapter:04x}{sequence:08x}"


def burst_document(adapter: int, sequence: int) -> dict[str, Any]:
    """One adapter's event: its own harness, its own repository's workspace, and an ID no other adapter uses."""
    return event_document(
        eventId=unique_event_id(adapter, sequence), harness=HARNESSES[adapter], workspaceId=f"ws_{adapter + 1:032x}"
    )


def capture_once(runtime: Runtime, clock: FakeMonotonic, document: dict[str, Any]) -> Attempt:
    assert isinstance(runtime.input, FakeInput)
    runtime.input.data = encode(document)
    readings = clock.readings
    ran = run_runtime(runtime, ["capture", "--json"])
    return Attempt(ran.code, ran.stdout, ran.stderr, document, (clock.readings - readings) * MILLISECONDS_PER_READING)


def submitted(session: Session) -> list[Attempt]:
    return [attempt for burst in session.bursts for attempt in burst]


def burst_rows(session: Session) -> list[Event]:
    """What the store holds for the burst, leaving out the expired backlog the Given put there."""
    backlog = {event.event_id for event in session.expired}
    return [event for event in session.world.events.stored if event.event_id not in backlog]


@pytest.fixture
def session() -> Session:
    return Session(world=make_world())


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: ferret init from two repositories resolves one data home
@scenario(FEATURE, "ferret init from two repositories resolves one data home")
def test_ferret_init_from_two_repositories_resolves_one_data_home() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: Every created file and directory is owner-only
@scenario(FEATURE, "Every created file and directory is owner-only")
def test_every_created_file_and_directory_is_owner_only() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: No telemetry file is created inside a repository
@scenario(FEATURE, "No telemetry file is created inside a repository")
def test_no_telemetry_file_is_created_inside_a_repository() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("FERRET has not been initialized for the current operating-system user")
def given_not_initialized(session: Session) -> None:
    assert session.world.files.directory is None
    assert not session.world.files.files


@when("the user runs ferret init from two different repositories")
def when_init_from_two_repositories(session: Session) -> None:
    for repository in REPOSITORIES:
        # Each invocation resolves its own data home from the environment it starts in, which names its repository.
        environment = {"HOME": str(FAKE_HOME), "PWD": str(repository)}
        data_home = value_of(resolve_data_home(environment, value_of(home_directory(environment))))
        ran = run_runtime(replace(session.world.runtime, data_home=data_home), ["init", "--json"])
        assert (ran.code, ran.stderr) == (0, "")
        session.documents.append(json.loads(ran.stdout))


@then("both commands resolve the same private data home and SQLite database")
def then_same_home_and_database(session: Session) -> None:
    first, second = session.documents
    expected = FAKE_HOME / ".local" / "share" / "ferret"
    assert first["dataHome"] == second["dataHome"] == str(expected)
    assert first["databasePath"] == second["databasePath"] == str(expected / "ferret.sqlite3")


@when("the user runs ferret init")
def when_the_user_runs_init(session: Session) -> None:
    init_with_environment(session, session.environment)


@then("POSIX modes make every artifact private")
def then_every_artifact_private(session: Session) -> None:
    directory = session.world.files.directory
    assert directory is not None
    assert directory.mode == 0o700
    assert session.world.files.files
    assert all(entry.mode == 0o600 for entry in session.world.files.files.values())


@then("no repository-local telemetry database is created")
def then_no_repository_database(session: Session) -> None:
    assert [name for name in session.world.files.files if name.endswith(".sqlite3")] == ["ferret.sqlite3"]
    for document in session.documents:
        for repository in REPOSITORIES:
            assert not Path(document["dataHome"]).is_relative_to(repository)
            assert not Path(document["databasePath"]).is_relative_to(repository)


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: Capture concurrently across repositories
@scenario(FEATURE, "Capture concurrently across repositories")
def test_capture_concurrently_across_repositories() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("three repositories and three harness adapters use the same initialized data home")
def given_three_adapters_share_one_home(session: Session) -> None:
    world = session.world
    telemetry = SerializedTelemetry(world.events, world.capabilities)
    world.runtime = replace(world.runtime, telemetry=telemetry)
    initialize_store(world.runtime)
    session.expired = expired_events(EXPIRED_BACKLOG, now=FIXED_NOW, first=BACKLOG_FIRST)
    world.events.stored.extend(session.expired)
    for _ in HARNESSES:
        # Each adapter is its own process: its own standard input and its own monotonic clock over the shared store.
        clock = FakeMonotonic(step_ms=MILLISECONDS_PER_READING)
        session.clocks.append(clock)
        session.runtimes.append(replace(world.runtime, input=FakeInput(), monotonic=clock))


@when("each adapter submits a bounded burst of unique events concurrently")
def when_each_adapter_submits_a_burst(session: Session) -> None:
    def burst(adapter: int) -> list[Attempt]:
        runtime, clock = session.runtimes[adapter], session.clocks[adapter]
        return [capture_once(runtime, clock, burst_document(adapter, sequence)) for sequence in range(BURST_SIZE)]

    with ThreadPoolExecutor(max_workers=len(HARNESSES)) as pool:
        session.bursts = list(pool.map(burst, range(len(HARNESSES))))


@then("every successful direct capture has exactly one durable row")
def then_every_capture_has_one_row(session: Session) -> None:
    attempts = submitted(session)
    assert len(attempts) == len(HARNESSES) * BURST_SIZE
    assert [(attempt.code, attempt.stderr) for attempt in attempts] == [(0, "")] * len(attempts)
    assert {json.loads(attempt.stdout)["result"] for attempt in attempts} == {"stored"}
    stored = sorted(event.event_id for event in burst_rows(session))
    assert stored == sorted(attempt.document["eventId"] for attempt in attempts)
    for adapter, harness in enumerate(HARNESSES):
        rows = [event for event in burst_rows(session) if event.harness == harness]
        assert len(rows) == BURST_SIZE
        assert {event.workspace_id for event in rows} == {f"ws_{adapter + 1:032x}"}


@then("every stored row matches its submitted event exactly and none is duplicated")
def then_every_row_matches_and_none_is_duplicated(session: Session) -> None:
    rows = {event.event_id: event for event in burst_rows(session)}
    assert len(rows) == len(burst_rows(session))
    for attempt in submitted(session):
        assert rows[attempt.document["eventId"]].to_document() == attempt.document
        assert rows[attempt.document["eventId"]] == value_of(event_from_document(attempt.document, now=FAR_FUTURE))


@then("every adapter returns within 1000 milliseconds")
def then_every_adapter_returns_within_a_second(session: Session) -> None:
    attempts = submitted(session)
    # Every capture pruned part of the backlog on its own clock; an unbounded prune of it would cost seconds.
    assert len(session.world.events.stored) < EXPIRED_BACKLOG + len(attempts)
    assert all(attempt.elapsed_ms > 0 for attempt in attempts)
    assert max(attempt.elapsed_ms for attempt in attempts) < 1000


def init_with_environment(session: Session, environment: dict[str, str]) -> None:
    """Run ``init`` as a process started with ``environment`` does: its data home is resolved from that environment."""
    resolved = resolve_data_home({"HOME": str(FAKE_HOME), **environment}, FAKE_HOME)
    if isinstance(resolved, Err):
        session.refusal = resolved.error.code
        session.refusal_exit_code = resolved.error.exit_code
        return
    session.ran = run_runtime(replace(session.world.runtime, data_home=value_of(resolved)), ["init", "--json"])


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: Running ferret init again reports already_initialized and changes nothing
@scenario(FEATURE, "Running ferret init again reports already_initialized and changes nothing")
def test_running_ferret_init_again_reports_already_initialized_and_changes_nothing() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("FERRET has already been initialized for the current operating-system user")
def given_already_initialized(session: Session) -> None:
    initialize_store(session.world.runtime)


@when("the user runs ferret init again")
def when_the_user_runs_init_again(session: Session) -> None:
    session.ran = run_cli(session.world, ["init", "--json"])


@then("the command reports already_initialized and keeps the same installation identity and schema")
def then_init_again_reports_already_initialized(session: Session) -> None:
    assert session.ran is not None
    document = json.loads(session.ran.stdout)
    assert (session.ran.code, session.ran.stderr, document["result"]) == (0, "", "already_initialized")
    assert document["schemaNumber"] == session.world.schema.number
    # The identity was created once, by the first initialization, and the second one created none.
    assert session.world.randomness.uuid_calls == 1


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


@given(parsers.parse("the environment sets {name} to {value}"))
def given_the_environment_sets(session: Session, name: str, value: str) -> None:
    session.environment[name] = value


@given("neither FERRET_DATA_HOME nor XDG_DATA_HOME is set")
def given_neither_data_home_variable_is_set(session: Session) -> None:
    assert session.environment == {}


@then(parsers.parse("the data home is {path}"))
def then_the_data_home_is(session: Session, path: str) -> None:
    assert session.refusal is None
    assert session.ran is not None
    assert (session.ran.code, session.ran.stderr) == (0, "")
    assert json.loads(session.ran.stdout)["dataHome"] == path


@then("the store is kept under HOME at .local/share/ferret")
def then_the_store_is_kept_under_home(session: Session) -> None:
    assert session.refusal is None
    assert session.ran is not None
    assert json.loads(session.ran.stdout)["dataHome"] == str(FAKE_HOME / ".local" / "share" / "ferret")


@then("the command exits 2 with ferret.storage.unsafe on stderr and creates no data home")
def then_unsafe_data_home_is_refused(session: Session) -> None:
    assert session.refusal == "ferret.storage.unsafe"
    assert session.refusal_exit_code == 2
    assert session.ran is None
    assert session.world.files.directory is None


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: A command on an uninitialized store exits 2 with ferret.storage.uninitialized
@scenario(FEATURE, "A command on an uninitialized store exits 2 with ferret.storage.uninitialized")
def test_a_command_on_an_uninitialized_store_exits_2_with_storage_uninitialized() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user runs events list")
def when_the_user_runs_events_list(session: Session) -> None:
    session.ran = run_cli(session.world, ["events", "list", "--json"])


@then("the command exits 2 with ferret.storage.uninitialized on stderr and nothing on stdout")
def then_uninitialized_store_is_refused(session: Session) -> None:
    assert session.ran is not None
    assert (session.ran.code, session.ran.stdout) == (2, "")
    assert json.loads(session.ran.stderr)["error"]["code"] == "ferret.storage.uninitialized"


# @scenario specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature: status reports paths, runtime, storage, health, and adapters
@scenario(FEATURE, "status reports paths, runtime, storage, health, and adapters")
def test_status_reports_paths_runtime_storage_health_and_adapters() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user runs status")
def when_the_user_runs_status(session: Session) -> None:
    session.ran = run_cli(session.world, ["status", "--json"])


@then("the status names the data home, the database, the runtime, the storage sizes, the health, and each adapter")
def then_status_names_its_parts(session: Session) -> None:
    assert session.ran is not None
    assert (session.ran.code, session.ran.stderr) == (0, "")
    document = json.loads(session.ran.stdout)
    assert document["dataHome"] == str(FAKE_HOME / ".local" / "share" / "ferret")
    assert document["databasePath"] == str(FAKE_HOME / ".local" / "share" / "ferret" / "ferret.sqlite3")
    assert {"runtime", "databaseBytes", "walBytes", "freelistBytes", "integrityState"} <= set(document)
    assert isinstance(document["adapters"], list)
