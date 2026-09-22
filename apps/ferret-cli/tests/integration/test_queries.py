"""The SQLite event reader against a real database: agreement with the fake, keyset paging, expiry, and index use."""

import json
import sqlite3
from contextlib import closing
from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest

from ferret.adapters.sqlite_repository import SQLiteEventRepository, read_statement
from ferret.application import queries
from ferret.application.queries import export_events, list_events
from ferret.domain.event import Event
from ferret.domain.query import EventCriteria, Position, criteria_from_options
from ferret.domain.timestamps import format_timestamp
from support.fakes import FakeEvents
from support.machine import Machine, make_machine
from support.populate import WORKSPACE_A, WORKSPACE_B, make_event, mixed_events, numbers, stamp

NOW = datetime(2026, 9, 18, 8, 0, 0, tzinfo=UTC)
CAPACITY = 500


@pytest.fixture
def database(tmp_path: Path) -> Path:
    return make_machine(tmp_path).data_home / "ferret.sqlite3"


@pytest.fixture
def repository(database: Path) -> SQLiteEventRepository:
    return SQLiteEventRepository(database)


@pytest.fixture
def filled(repository: SQLiteEventRepository) -> tuple[SQLiteEventRepository, FakeEvents]:
    """The real repository and a fake, both holding the same sixty-two events."""
    fake = FakeEvents()
    for event in mixed_events(NOW):
        repository.capture(event)
        fake.capture(event)
    return repository, fake


def read_all(
    source: SQLiteEventRepository | FakeEvents, criteria: EventCriteria, *, newest_first: bool
) -> tuple[Event, ...]:
    return source.read(criteria, now=NOW, newest_first=newest_first, after=None, limit=CAPACITY)


WINDOWED: dict[str, tuple[dict[str, tuple[str, ...]], bool]] = {
    "default-window": ({}, True),
    "all-time": ({"--all-time": ()}, True),
    "harness": ({"--all-time": (), "--harness": ("codex",)}, True),
    "workspace": ({"--all-time": (), "--workspace": (WORKSPACE_B,)}, True),
    "event-type": ({"--all-time": (), "--event-type": ("tool.failed",)}, True),
    "outcome": ({"--all-time": (), "--outcome": ("cancelled",)}, True),
    "agent": ({"--all-time": (), "--agent": ("reviewer",)}, True),
    "skill": ({"--all-time": (), "--skill": ("tdd",)}, True),
    "tool": ({"--all-time": (), "--tool": ("Write",)}, True),
    "combined": ({"--all-time": (), "--harness": ("codex",), "--workspace": (WORKSPACE_A,)}, True),
    "interval": (
        {"--from": (stamp(NOW - timedelta(minutes=30)),), "--to": (stamp(NOW - timedelta(minutes=10)),)},
        True,
    ),
    "from-only": ({"--from": (stamp(NOW - timedelta(minutes=30)),)}, True),
    "to-only": ({"--to": (stamp(NOW - timedelta(minutes=30)),)}, True),
    "no-match": (
        {"--all-time": (), "--harness": ("codex",), "--event-type": ("session.started",), "--tool": ("Read",)},
        False,
    ),
}


@pytest.mark.parametrize("newest_first", [True, False])
@pytest.mark.parametrize(("options", "expects_rows"), list(WINDOWED.values()), ids=list(WINDOWED))
def test_the_real_reader_returns_exactly_what_the_fake_returns(
    filled: tuple[SQLiteEventRepository, FakeEvents],
    options: dict[str, tuple[str, ...]],
    expects_rows: bool,
    newest_first: bool,
) -> None:
    real, fake = filled
    criteria = criteria_from_options(options, now=NOW)

    from_sqlite = read_all(real, criteria, newest_first=newest_first)

    assert from_sqlite == read_all(fake, criteria, newest_first=newest_first)
    assert bool(from_sqlite) is expects_rows
    assert all(event.expires_at > format_timestamp(NOW) for event in from_sqlite)


@pytest.mark.parametrize("limit", [1, 2, 7, 61])
@pytest.mark.parametrize("newest_first", [True, False])
def test_a_limit_takes_the_first_rows_of_the_order(
    filled: tuple[SQLiteEventRepository, FakeEvents], limit: int, newest_first: bool
) -> None:
    real, _ = filled
    criteria = criteria_from_options({"--all-time": ()}, now=NOW)
    everything = read_all(real, criteria, newest_first=newest_first)

    assert real.read(criteria, now=NOW, newest_first=newest_first, after=None, limit=limit) == everything[:limit]


@pytest.mark.parametrize("newest_first", [True, False])
def test_every_row_is_a_resumption_point_that_continues_strictly_after_it(
    filled: tuple[SQLiteEventRepository, FakeEvents], newest_first: bool
) -> None:
    real, _ = filled
    criteria = criteria_from_options({"--all-time": ()}, now=NOW)
    everything = read_all(real, criteria, newest_first=newest_first)

    for index, event in enumerate(everything):
        rest = real.read(
            criteria,
            now=NOW,
            newest_first=newest_first,
            after=Position(event.occurred_at, event.event_id),
            limit=CAPACITY,
        )
        assert rest == everything[index + 1 :]


@pytest.mark.parametrize("newest_first", [True, False])
@pytest.mark.parametrize("size", [1, 3, 4, 5, 8])
def test_paging_in_any_batch_size_visits_every_row_exactly_once(
    filled: tuple[SQLiteEventRepository, FakeEvents], newest_first: bool, size: int
) -> None:
    real, _ = filled
    criteria = criteria_from_options({"--all-time": ()}, now=NOW)
    everything = read_all(real, criteria, newest_first=newest_first)
    seen: list[Event] = []
    after: Position | None = None

    while batch := real.read(criteria, now=NOW, newest_first=newest_first, after=after, limit=size):
        seen.extend(batch)
        after = Position(batch[-1].occurred_at, batch[-1].event_id)

    assert seen == list(everything)
    assert len({event.event_id for event in seen}) == len(seen) == 61


def test_equal_timestamps_are_ordered_by_event_id_in_both_directions(
    filled: tuple[SQLiteEventRepository, FakeEvents],
) -> None:
    real, _ = filled
    criteria = criteria_from_options(
        {"--from": (stamp(NOW - timedelta(minutes=5)),), "--to": (stamp(NOW + timedelta(minutes=1)),)}, now=NOW
    )

    newest = real.read(criteria, now=NOW, newest_first=True, after=None, limit=CAPACITY)
    oldest = real.read(criteria, now=NOW, newest_first=False, after=None, limit=CAPACITY)

    assert numbers(newest) == [4, 3, 2, 1]
    assert numbers(oldest) == [1, 2, 3, 4]


@pytest.mark.parametrize(
    ("lead", "visible"),
    [
        pytest.param(timedelta(milliseconds=-1), True, id="one-millisecond-before"),
        pytest.param(timedelta(0), False, id="exactly-at-expiry"),
        pytest.param(timedelta(milliseconds=1), False, id="one-millisecond-after"),
    ],
)
def test_expiry_is_judged_against_the_injected_now(
    repository: SQLiteEventRepository, lead: timedelta, visible: bool
) -> None:
    event = make_event(1, ago=timedelta(days=10), now=NOW)
    repository.capture(event)
    moment = NOW + timedelta(days=20) + lead
    criteria = criteria_from_options({"--all-time": ()}, now=moment)

    read = repository.read(criteria, now=moment, newest_first=True, after=None, limit=10)
    found = repository.find(event.event_id, now=moment)

    assert (read, found) == (((event,), event) if visible else ((), None))


def test_find_returns_a_row_by_id_whatever_the_filters_and_none_for_a_stranger(
    filled: tuple[SQLiteEventRepository, FakeEvents],
) -> None:
    real, fake = filled
    stored = fake.stored[10]

    assert real.find(stored.event_id, now=NOW) == stored
    assert real.find("00000000-0000-4000-8000-999999999999", now=NOW) is None
    assert real.find(fake.stored[60].event_id, now=NOW) is None


PLANNED: dict[str, dict[str, tuple[str, ...]]] = {
    "default-window": {},
    "all-time": {"--all-time": ()},
    "harness": {"--all-time": (), "--harness": ("codex",)},
    "workspace": {"--all-time": (), "--workspace": (WORKSPACE_B,)},
    "event-type": {"--all-time": (), "--event-type": ("tool.failed",)},
    "agent-without-index": {"--all-time": (), "--agent": ("reviewer",)},
    "harness-and-workspace": {"--all-time": (), "--harness": ("codex",), "--workspace": (WORKSPACE_A,)},
    "interval-and-outcome": {
        "--from": (stamp(NOW - timedelta(hours=2)),),
        "--to": (stamp(NOW - timedelta(minutes=10)),),
        "--outcome": ("success",),
    },
}


@pytest.mark.parametrize("keyset", [False, True])
@pytest.mark.parametrize("newest_first", [True, False])
@pytest.mark.parametrize("options", list(PLANNED.values()), ids=list(PLANNED))
def test_the_read_statement_walks_an_index_and_never_sorts(
    filled: tuple[SQLiteEventRepository, FakeEvents],
    database: Path,
    options: dict[str, tuple[str, ...]],
    newest_first: bool,
    keyset: bool,
) -> None:
    _, fake = filled
    criteria = criteria_from_options(options, now=NOW)
    after = Position(fake.stored[20].occurred_at, fake.stored[20].event_id) if keyset else None
    statement, parameters = read_statement(criteria, now=NOW, newest_first=newest_first, after=after, limit=100)

    with closing(sqlite3.connect(database)) as connection:
        plan = [str(row[3]) for row in connection.execute("EXPLAIN QUERY PLAN " + statement, parameters)]

    assert not any("TEMP B-TREE" in step for step in plan), plan
    assert any("USING INDEX" in step or "USING COVERING INDEX" in step for step in plan), plan


def test_an_export_that_a_writer_interleaves_with_still_returns_each_earlier_row_exactly_once(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    machine = make_machine(tmp_path)
    now = datetime.now(UTC)
    before = [make_event(number, ago=timedelta(minutes=100 - number), now=now) for number in range(1, 9)]
    machine.fill(before)
    monkeypatch.setattr(queries, "BATCH_SIZE", 3)

    stream = export_events(machine.runtime(), {"--all-time": ()})
    first_batch = [next(stream) for _ in range(3)]
    machine.fill(
        [
            make_event(50, ago=timedelta(minutes=200), now=now),
            make_event(51, ago=timedelta(minutes=1), now=now),
        ]
    )
    rest = list(stream)

    assert numbers((*first_batch, *rest)) == [1, 2, 3, 4, 5, 6, 7, 8, 51]


def test_list_and_export_over_real_storage_follow_the_documented_orders(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    now = datetime.now(UTC)
    machine.fill(make_event(number, ago=timedelta(minutes=1 + number % 3), now=now) for number in range(1, 8))

    listed = list_events(machine.runtime(), {})
    exported = tuple(export_events(machine.runtime(), {}))

    assert numbers(listed.items) == [6, 3, 7, 4, 1, 5, 2]
    assert numbers(exported) == [2, 5, 1, 4, 7, 3, 6]
    assert listed.next_cursor is None


def test_a_cursor_chain_over_real_storage_walks_every_row_once(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    now = datetime.now(UTC)
    machine.fill(make_event(number, ago=timedelta(minutes=number), now=now) for number in range(1, 8))
    options: dict[str, tuple[str, ...]] = {"--limit": ("3",), "--all-time": ()}
    seen: list[int] = []

    page = list_events(machine.runtime(), options)
    seen.extend(numbers(page.items))
    while page.next_cursor is not None:
        page = list_events(machine.runtime(), {**options, "--cursor": (page.next_cursor,)})
        seen.extend(numbers(page.items))

    assert seen == [1, 2, 3, 4, 5, 6, 7]


def test_a_cursor_stops_working_when_its_row_is_deleted_underneath_it(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    now = datetime.now(UTC)
    machine.fill(make_event(number, ago=timedelta(minutes=number), now=now) for number in range(1, 6))
    options: dict[str, tuple[str, ...]] = {"--limit": ("2",), "--all-time": ()}
    cursor = list_events(machine.runtime(), options).next_cursor or ""
    with closing(sqlite3.connect(machine.data_home / "ferret.sqlite3")) as connection:
        connection.execute("DELETE FROM event WHERE event_id = ?", ("00000000-0000-4000-8000-000000000002",))
        connection.commit()

    outcome = machine.run(["events", "list", "--json", "--limit", "2", "--all-time", "--cursor", cursor])

    assert (outcome.code, outcome.stdout) == (2, "")
    assert json.loads(outcome.stderr)["error"]["code"] == "ferret.cursor.invalid"


def test_a_database_that_is_not_a_database_is_a_closed_integrity_failure_without_a_path(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    (machine.data_home / "ferret.sqlite3").write_bytes(b"this is not a sqlite database" * 200)

    listing = machine.run(["events", "list", "--json"])
    exported = machine.run(["events", "export", "--format", "jsonl"])

    assert (listing.code, listing.stdout) == (2, "")
    assert json.loads(listing.stderr)["error"]["code"] == "ferret.storage.integrity-failure"
    assert (exported.code, exported.stdout) == (2, "")
    assert (
        exported.stderr == "FERRET error [ferret.storage.integrity-failure]: the database failed its integrity check\n"
    )
    assert str(machine.home) not in listing.stderr + exported.stderr


def test_a_machine_without_a_store_reports_uninitialized_for_every_read(tmp_path: Path) -> None:
    machine: Machine = make_machine(tmp_path, initialized=False)

    for argv in (["events", "list"], ["events", "export", "--format", "jsonl"]):
        outcome = machine.run(argv)
        assert (outcome.code, outcome.stdout) == (2, "")
        assert "ferret.storage.uninitialized" in outcome.stderr
    assert not machine.data_home.exists()
