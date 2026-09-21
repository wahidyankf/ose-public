"""Unit bindings for the initialization and concurrency feature, in process with every OS dependency faked."""

import io
import json
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret import cli
from ferret.application.initialization import InitResult, initialize_store
from ferret.application.ports import Runtime
from ferret.commands import build_handlers
from ferret.domain.event import event_from_document
from support.events import encode, event_document
from support.fakes import FAKE_DATA_HOME, FIXED_NOW, FakeInput, World, make_world

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature"
REPOSITORIES = (Path("/users/example/work/repo-a"), Path("/users/example/work/repo-b"))
ADAPTERS = 3
BURST_SIZE = 20


@dataclass(frozen=True, slots=True)
class Attempt:
    """One capture invocation: its exit code, its output, and how long it took."""

    code: int
    stdout: str
    stderr: str
    elapsed: float


@dataclass(slots=True)
class Session:
    """The fake machine, what each invocation returned, and each adapter's input and burst."""

    world: World
    results: list[InitResult] = field(default_factory=lambda: list[InitResult]())
    inputs: list[FakeInput] = field(default_factory=lambda: list[FakeInput]())
    bursts: list[list[Attempt]] = field(default_factory=lambda: list[list[Attempt]]())


def unique_event_id(adapter: int, sequence: int) -> str:
    return f"00000000-0000-4000-8000-{adapter:04x}{sequence:08x}"


def capture_once(runtime: Runtime, stdin: FakeInput, document: dict[str, Any]) -> Attempt:
    stdin.data = encode(document)
    stdout, stderr = io.StringIO(), io.StringIO()
    started = time.perf_counter()
    code = cli.main(["capture", "--json"], stdout=stdout, stderr=stderr, handlers=build_handlers(lambda: runtime))
    return Attempt(code, stdout.getvalue(), stderr.getvalue(), time.perf_counter() - started)


def submit_burst(session: Session, adapter: int) -> list[Attempt]:
    runtime = replace(session.world.runtime, input=session.inputs[adapter])
    return [
        capture_once(runtime, session.inputs[adapter], event_document(eventId=unique_event_id(adapter, sequence)))
        for sequence in range(BURST_SIZE)
    ]


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
    for _ in REPOSITORIES:
        session.results.append(initialize_store(session.world.runtime))


@then("both commands resolve the same private data home and SQLite database")
def then_same_home_and_database(session: Session) -> None:
    first, second = session.results
    assert first.data_home == second.data_home == FAKE_DATA_HOME
    assert first.database_path == second.database_path == FAKE_DATA_HOME / "ferret.sqlite3"


@then("exactly one installation identity and current schema exist")
def then_one_identity_and_schema(session: Session) -> None:
    first, second = session.results
    assert (first.result, second.result) == ("created", "already_initialized")
    assert first.installation_id == second.installation_id
    assert first.schema_number == second.schema_number == session.world.schema.number
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
    assert not any(FAKE_DATA_HOME.is_relative_to(repository) for repository in REPOSITORIES)


@scenario(FEATURE, "Capture concurrently across repositories")
def test_capture_concurrently_across_repositories() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("three repositories and three harness adapters use the same initialized data home")
def given_three_adapters_share_one_home(session: Session) -> None:
    initialize_store(session.world.runtime)
    session.inputs = [FakeInput() for _ in range(ADAPTERS)]


@when("each adapter submits a bounded burst of unique events concurrently")
def when_each_adapter_submits_a_burst(session: Session) -> None:
    def burst(adapter: int) -> list[Attempt]:
        return submit_burst(session, adapter)

    with ThreadPoolExecutor(max_workers=ADAPTERS) as pool:
        session.bursts = list(pool.map(burst, range(ADAPTERS)))


@then("every successful direct capture has exactly one durable row")
def then_every_capture_has_one_row(session: Session) -> None:
    attempts = [attempt for burst in session.bursts for attempt in burst]
    assert [attempt.code for attempt in attempts] == [0] * len(attempts)
    assert {json.loads(attempt.stdout)["result"] for attempt in attempts} == {"stored"}
    expected = sorted(
        unique_event_id(adapter, sequence) for adapter in range(ADAPTERS) for sequence in range(BURST_SIZE)
    )
    assert sorted(event.event_id for event in session.world.events.stored) == expected


@then("no row is partially written or duplicated")
def then_no_row_is_partial_or_duplicated(session: Session) -> None:
    stored = session.world.events.stored
    assert len({event.event_id for event in stored}) == len(stored) == ADAPTERS * BURST_SIZE
    assert all(event_from_document(event.to_document(), now=FIXED_NOW) == event for event in stored)
    runtime = replace(session.world.runtime, input=session.inputs[0])

    replay = capture_once(runtime, session.inputs[0], stored[0].to_document())

    assert json.loads(replay.stdout)["result"] == "duplicate"
    assert len(session.world.events.stored) == ADAPTERS * BURST_SIZE


@then("every adapter returns within 1000 milliseconds")
def then_every_adapter_returns_within_a_second(session: Session) -> None:
    assert max(attempt.elapsed for burst in session.bursts for attempt in burst) < 1.0
