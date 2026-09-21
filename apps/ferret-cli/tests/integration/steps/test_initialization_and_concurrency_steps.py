"""Integration bindings for the initialization and concurrency feature, against a real temporary home."""

import json
import os
import sqlite3
import stat
from dataclasses import dataclass, field
from pathlib import Path

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.adapters.system import system_runtime
from ferret.application.initialization import InitResult, initialize_store
from support.burst import (
    REPOSITORY_COUNT,
    Capture,
    expected_rows,
    integrity_check,
    run_burst,
    stored_rows,
)

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature"


@dataclass(slots=True)
class Session:
    """A private temporary home, two repositories inside it, and what each invocation returned."""

    home: Path
    repositories: tuple[Path, Path]
    results: list[InitResult] = field(default_factory=lambda: list[InitResult]())

    @property
    def data_home(self) -> Path:
        return self.home / ".ferret"


@pytest.fixture
def session(tmp_path: Path) -> Session:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    repositories = (tmp_path / "work" / "repo-a", tmp_path / "work" / "repo-b")
    for repository in repositories:
        repository.mkdir(parents=True)
    return Session(home=home, repositories=repositories)


@scenario(FEATURE, "Initialize one private store from multiple repositories")
def test_initialize_one_private_store_from_multiple_repositories() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("FERRET has not been initialized for the current operating-system user")
def given_not_initialized(session: Session) -> None:
    assert not session.data_home.exists()


@when("the user runs ferret init from two different repositories")
def when_init_from_two_repositories(session: Session, monkeypatch: pytest.MonkeyPatch) -> None:
    for repository in session.repositories:
        monkeypatch.chdir(repository)
        session.results.append(initialize_store(system_runtime({"HOME": str(session.home)})))


@then("both commands resolve the same private data home and SQLite database")
def then_same_home_and_database(session: Session) -> None:
    first, second = session.results
    assert first.data_home == second.data_home == session.data_home
    assert first.database_path == second.database_path == session.data_home / "ferret.sqlite3"
    assert first.database_path.is_file()


@then("exactly one installation identity and current schema exist")
def then_one_identity_and_schema(session: Session) -> None:
    first, second = session.results
    identity = json.loads((session.data_home / "identity.json").read_text(encoding="utf-8"))
    assert identity["installationId"] == first.installation_id == second.installation_id
    with sqlite3.connect(first.database_path) as connection:
        migrations = connection.execute("SELECT version FROM schema_migration").fetchall()
    assert migrations == [(first.schema_number,)]


@then("POSIX modes make every artifact private")
def then_every_artifact_private(session: Session) -> None:
    assert stat.S_IMODE(session.data_home.stat().st_mode) == 0o700
    modes = {stat.S_IMODE(path.lstat().st_mode) for path in session.data_home.iterdir()}
    assert modes == {0o600}
    assert all(path.stat().st_uid == os.getuid() for path in session.data_home.iterdir())


@then("no repository-local telemetry database is created")
def then_no_repository_database(session: Session) -> None:
    for repository in session.repositories:
        assert list(repository.rglob("*")) == []


@dataclass(slots=True)
class BurstSession:
    """A real initialized home shared by every adapter, and what each adapter's burst returned."""

    database: Path
    bursts: list[list[Capture]] = field(default_factory=lambda: list[list[Capture]]())


@pytest.fixture
def burst_session(tmp_path: Path) -> BurstSession:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    result = initialize_store(system_runtime({"HOME": str(home)}))
    return BurstSession(database=result.database_path)


@scenario(FEATURE, "Capture concurrently across repositories")
def test_capture_concurrently_across_repositories() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("three repositories and three harness adapters use the same initialized data home")
def given_three_adapters_share_one_home(burst_session: BurstSession) -> None:
    assert REPOSITORY_COUNT == 3
    assert stored_rows(burst_session.database) == []


@when("each adapter submits a bounded burst of unique events concurrently")
def when_each_adapter_submits_a_burst(burst_session: BurstSession) -> None:
    burst_session.bursts = run_burst(burst_session.database)


@then("every successful direct capture has exactly one durable row")
def then_every_capture_has_one_row(burst_session: BurstSession) -> None:
    captures = [capture for burst in burst_session.bursts for capture in burst]
    assert {capture.result for capture in captures} == {"stored"}
    assert [row["event_id"] for row in stored_rows(burst_session.database)] == [
        row["event_id"] for row in expected_rows()
    ]


@then("no row is partially written or duplicated")
def then_no_row_is_partial_or_duplicated(burst_session: BurstSession) -> None:
    assert stored_rows(burst_session.database) == expected_rows()
    assert integrity_check(burst_session.database) == [("ok",)]


@then("every adapter returns within 1000 milliseconds")
def then_every_adapter_returns_within_a_second(burst_session: BurstSession) -> None:
    assert max(capture.elapsed for burst in burst_session.bursts for capture in burst) < 1.0
