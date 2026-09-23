"""Integration bindings for the initialization and concurrency feature, against a real temporary home."""

import io
import json
import os
import sqlite3
import stat
from contextlib import closing
from dataclasses import dataclass, field
from datetime import UTC, datetime
from functools import partial
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret import cli
from ferret.adapters.system import system_runtime
from ferret.application.initialization import initialize_store
from ferret.commands import build_handlers
from support.burst import (
    HARNESSES,
    PROCESS_BURST_SIZE,
    ProcessCapture,
    expected_process_rows,
    integrity_check,
    run_process_burst,
    stored_process_rows,
    workspace_id,
)
from support.populate import stamp

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/storage/initialization-and-concurrency.feature"


@dataclass(slots=True)
class Session:
    """A private temporary home, two repositories inside it, and what each invocation returned."""

    home: Path
    repositories: tuple[Path, Path]
    documents: list[dict[str, Any]] = field(default_factory=lambda: list[dict[str, Any]]())

    @property
    def data_home(self) -> Path:
        return self.home / ".local" / "share" / "ferret"


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
        stdout, stderr = io.StringIO(), io.StringIO()
        environment = {"HOME": str(session.home), "PWD": str(repository)}
        handlers = build_handlers(partial(system_runtime, environment))
        assert cli.main(["init", "--json"], stdout=stdout, stderr=stderr, handlers=handlers) == 0
        assert stderr.getvalue() == ""
        session.documents.append(json.loads(stdout.getvalue()))


@then("both commands resolve the same private data home and SQLite database")
def then_same_home_and_database(session: Session) -> None:
    first, second = session.documents
    assert first["dataHome"] == second["dataHome"] == str(session.data_home)
    assert first["databasePath"] == second["databasePath"] == str(session.data_home / "ferret.sqlite3")
    assert (session.data_home / "ferret.sqlite3").is_file()


@then("exactly one installation identity and current schema exist")
def then_one_identity_and_schema(session: Session) -> None:
    first, second = session.documents
    assert (first["result"], second["result"]) == ("created", "already_initialized")
    identity = json.loads((session.data_home / "identity.json").read_text(encoding="utf-8"))
    assert identity["installationId"] == first["installationId"] == second["installationId"]
    with closing(sqlite3.connect(session.data_home / "ferret.sqlite3")) as connection:
        migrations = connection.execute("SELECT version FROM schema_migration").fetchall()
    assert migrations == [(first["schemaNumber"],)]


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
    """A real initialized home shared by three repositories, and what each adapter's burst of processes returned."""

    home: Path
    repositories: tuple[Path, ...]
    moment: str = ""
    bursts: list[list[ProcessCapture]] = field(default_factory=lambda: list[list[ProcessCapture]]())

    @property
    def database(self) -> Path:
        return self.home / ".local" / "share" / "ferret" / "ferret.sqlite3"

    def captures(self) -> list[ProcessCapture]:
        return [capture for burst in self.bursts for capture in burst]


@pytest.fixture
def burst_session(tmp_path: Path) -> BurstSession:
    home = tmp_path / "home"
    home.mkdir(mode=0o700)
    repositories = tuple(tmp_path / "work" / f"repo-{harness}" for harness in HARNESSES)
    for repository in repositories:
        repository.mkdir(parents=True)
    return BurstSession(home=home, repositories=repositories)


@scenario(FEATURE, "Capture concurrently across repositories")
def test_capture_concurrently_across_repositories() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("three repositories and three harness adapters use the same initialized data home")
def given_three_adapters_share_one_home(burst_session: BurstSession) -> None:
    initialize_store(system_runtime({"HOME": str(burst_session.home)}))
    assert len(burst_session.repositories) == len(HARNESSES) == 3
    assert stored_process_rows(burst_session.database) == []


@when("each adapter submits a bounded burst of unique events concurrently")
def when_each_adapter_submits_a_burst(burst_session: BurstSession) -> None:
    burst_session.moment = stamp(datetime.now(UTC))
    burst_session.bursts = run_process_burst(burst_session.home, burst_session.repositories, burst_session.moment)


@then("every successful direct capture has exactly one durable row")
def then_every_capture_has_one_row(burst_session: BurstSession) -> None:
    captures = burst_session.captures()
    assert len(captures) == len(HARNESSES) * PROCESS_BURST_SIZE
    assert [(capture.code, capture.stderr, capture.result) for capture in captures] == [(0, b"", "stored")] * len(
        captures
    )
    rows = stored_process_rows(burst_session.database)
    assert sorted(row["event_id"] for row in rows) == sorted(capture.document["eventId"] for capture in captures)
    for adapter, harness in enumerate(HARNESSES):
        held = [row for row in rows if row["harness"] == harness]
        assert len(held) == PROCESS_BURST_SIZE
        assert {row["workspace_id"] for row in held} == {workspace_id(adapter)}


@then("every stored row matches its submitted event exactly and none is duplicated")
def then_every_row_matches_and_none_is_duplicated(burst_session: BurstSession) -> None:
    assert stored_process_rows(burst_session.database) == expected_process_rows(burst_session.moment)
    assert integrity_check(burst_session.database) == [("ok",)]


@then("every adapter returns within 1000 milliseconds")
def then_every_adapter_returns_within_a_second(burst_session: BurstSession) -> None:
    assert max(capture.elapsed for capture in burst_session.captures()) < 1.0
