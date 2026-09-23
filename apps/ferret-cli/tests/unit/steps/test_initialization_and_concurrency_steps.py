"""Unit bindings for the initialization and concurrency feature, in process with every OS dependency faked."""

import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field, replace
from datetime import datetime
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.adapters.filesystem import resolve_data_home
from ferret.adapters.system import home_directory
from ferret.application.initialization import initialize_store
from ferret.application.ports import Budget, PruneResult, Runtime
from ferret.domain.event import Event, event_from_document
from support.events import encode, event_document
from support.fakes import FAKE_HOME, FIXED_NOW, FakeInput, FakeMonotonic, FakeTelemetry, World, make_world
from support.invoke import run_runtime
from support.populate import FAR_FUTURE
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

    def prune_batch(self, *, now: datetime, limit: int, budget: Budget) -> PruneResult:
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


@scenario(FEATURE, "Initialize one private store from multiple repositories")
def test_initialize_one_private_store_from_multiple_repositories() -> None:
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
        data_home = resolve_data_home(environment, home_directory(environment))
        ran = run_runtime(replace(session.world.runtime, data_home=data_home), ["init", "--json"])
        assert (ran.code, ran.stderr) == (0, "")
        session.documents.append(json.loads(ran.stdout))


@then("both commands resolve the same private data home and SQLite database")
def then_same_home_and_database(session: Session) -> None:
    first, second = session.documents
    expected = FAKE_HOME / ".local" / "share" / "ferret"
    assert first["dataHome"] == second["dataHome"] == str(expected)
    assert first["databasePath"] == second["databasePath"] == str(expected / "ferret.sqlite3")


@then("exactly one installation identity and current schema exist")
def then_one_identity_and_schema(session: Session) -> None:
    first, second = session.documents
    assert (first["result"], second["result"]) == ("created", "already_initialized")
    assert first["installationId"] == second["installationId"]
    assert first["schemaNumber"] == second["schemaNumber"] == session.world.schema.number
    assert session.world.randomness.uuid_calls == 1
    assert [name for name in session.world.files.files if name == "identity.json"] == ["identity.json"]


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
        assert rows[attempt.document["eventId"]] == event_from_document(attempt.document, now=FAR_FUTURE)


@then("every adapter returns within 1000 milliseconds")
def then_every_adapter_returns_within_a_second(session: Session) -> None:
    attempts = submitted(session)
    # Every capture pruned part of the backlog on its own clock; an unbounded prune of it would cost seconds.
    assert len(session.world.events.stored) < EXPIRED_BACKLOG + len(attempts)
    assert all(attempt.elapsed_ms > 0 for attempt in attempts)
    assert max(attempt.elapsed_ms for attempt in attempts) < 1000
