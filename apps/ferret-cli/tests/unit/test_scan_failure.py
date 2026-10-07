"""A read that fails once a scan is under way: the export keeps what it wrote, and the summaries answer the failure.

A scan reads its batches lazily, so a later batch can fail after the first has been consumed. Through the command line
that is one observable behaviour: an export has already written the events of the batches before the failure and then
ends with the failure's closed error, and a summary, which writes nothing until it has the whole answer, ends with
that error alone. Each case injects the failure at the repository port, so it holds however the port reports it.
"""

import json
from dataclasses import dataclass, replace
from datetime import datetime, timedelta

import pytest
from typekit import Err, Ok

from ferret.application import queries
from ferret.application.ports import Budget, CaptureResult
from ferret.application.queries import scan_events
from ferret.domain.errors import FerretError, FerretResult
from ferret.domain.event import Event
from ferret.domain.query import EventCriteria, Position
from ferret.rendering import render_export_line
from support.fakes import FakeEvents, World
from support.invoke import Ran, run_runtime
from support.populate import make_event, numbers, world_with
from support.results import refusal_of, value_of, values_of

BATCH = 2
EVENTS = 5
# Five events in batches of two take three reads; no run reaches a fourth, so a failure on it never happens.
NEVER = 4
INTEGRITY = FerretError("ferret.storage.integrity-failure")
BUSY = FerretError("ferret.storage.unavailable", retryable=True)
EXPORT = ["events", "export", "--format", "jsonl"]


@dataclass(slots=True)
class FailsOnRead:
    """The fake repository, whose ``read`` number ``nth`` fails with ``failure``; every other call is the fake's."""

    inner: FakeEvents
    nth: int
    failure: FerretError
    calls: int = 0

    def capture(self, event: Event, *, budget: Budget | None = None) -> FerretResult[CaptureResult]:
        return self.inner.capture(event, budget=budget)

    def read(
        self,
        criteria: EventCriteria,
        *,
        now: datetime,
        newest_first: bool,
        after: Position | None,
        limit: int,
    ) -> FerretResult[tuple[Event, ...]]:
        self.calls += 1
        if self.calls == self.nth:
            return Err(self.failure)
        return self.inner.read(criteria, now=now, newest_first=newest_first, after=after, limit=limit)

    def find(self, event_id: str, *, now: datetime) -> FerretResult[Event | None]:
        return self.inner.find(event_id, now=now)


def five_events_in_batches_of_two(monkeypatch: pytest.MonkeyPatch) -> World:
    monkeypatch.setattr(queries, "BATCH_SIZE", BATCH)
    return world_with(*[make_event(number, ago=timedelta(minutes=10 - number)) for number in range(1, EVENTS + 1)])


def failing_on_read(world: World, nth: int, failure: FerretError) -> tuple[FailsOnRead, World]:
    """``world`` with its event repository failing on read number ``nth``, and the repository that does it."""
    failing = FailsOnRead(world.events, nth, failure)
    return failing, replace(world, runtime=replace(world.runtime, events=failing))


def run_failing_on_read(world: World, nth: int, failure: FerretError, argv: list[str]) -> tuple[Ran, FailsOnRead]:
    """``argv`` through ``cli.main`` over ``world`` with its event repository failing on read number ``nth``."""
    failing, failed = failing_on_read(world, nth, failure)
    return run_runtime(failed.runtime, argv), failing


def exported(world: World, count: int) -> str:
    """The lines an export writes for the first ``count`` events of the world."""
    return "".join(render_export_line(event) for event in world.events.stored[:count])


@pytest.mark.parametrize(
    ("nth", "written"),
    [
        pytest.param(1, 0, id="first-batch"),
        pytest.param(2, BATCH, id="second-batch"),
        pytest.param(3, 2 * BATCH, id="third-batch"),
    ],
)
@pytest.mark.parametrize("failure", [INTEGRITY, BUSY], ids=["integrity", "retryable"])
def test_an_export_whose_later_batch_fails_keeps_what_it_wrote_and_ends_with_the_failure(
    monkeypatch: pytest.MonkeyPatch, nth: int, written: int, failure: FerretError
) -> None:
    world = five_events_in_batches_of_two(monkeypatch)

    ran, failing = run_failing_on_read(world, nth, failure, EXPORT)

    assert ran.code == failure.exit_code
    assert ran.stdout == exported(world, written)
    assert ran.stderr == f"ferret: [{failure.code}] {failure.message}\n"
    assert failing.calls == nth


@pytest.mark.parametrize("command", ["usage", "outcomes"])
@pytest.mark.parametrize("nth", [1, 2, 3])
@pytest.mark.parametrize("failure", [INTEGRITY, BUSY], ids=["integrity", "retryable"])
def test_a_summary_whose_later_batch_fails_answers_the_failure_and_writes_no_summary(
    monkeypatch: pytest.MonkeyPatch, command: str, nth: int, failure: FerretError
) -> None:
    world = five_events_in_batches_of_two(monkeypatch)

    ran, failing = run_failing_on_read(world, nth, failure, [command, "--group-by", "harness", "--json"])

    error = json.loads(ran.stderr)["error"]
    assert (ran.code, ran.stdout) == (failure.exit_code, "")
    assert (error["code"], error["retryable"]) == (failure.code, failure.retryable)
    assert failing.calls == nth


def test_an_export_with_no_failing_read_writes_every_event_and_reads_each_batch_once(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    world = five_events_in_batches_of_two(monkeypatch)

    ran, failing = run_failing_on_read(world, NEVER, INTEGRITY, EXPORT)

    assert (ran.code, ran.stdout, ran.stderr) == (0, exported(world, EVENTS), "")
    assert failing.calls == 3


def test_a_summary_with_no_failing_read_counts_every_event_and_reads_each_batch_once(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    world = five_events_in_batches_of_two(monkeypatch)

    ran, failing = run_failing_on_read(world, NEVER, INTEGRITY, ["usage", "--group-by", "harness", "--json"])

    assert (ran.code, ran.stderr) == (0, "")
    assert [row["eventCount"] for row in json.loads(ran.stdout)["rows"]] == [EVENTS]
    assert failing.calls == 3


@pytest.mark.parametrize(
    ("nth", "yielded"),
    [
        pytest.param(1, 0, id="first-batch"),
        pytest.param(2, BATCH, id="second-batch"),
        pytest.param(3, 2 * BATCH, id="third-batch"),
    ],
)
def test_a_scan_yields_the_events_before_a_failed_batch_then_its_one_failure_and_ends(
    monkeypatch: pytest.MonkeyPatch, nth: int, yielded: int
) -> None:
    world = five_events_in_batches_of_two(monkeypatch)
    failing, failed = failing_on_read(world, nth, INTEGRITY)

    stream = value_of(scan_events(failed.runtime, {}))
    items = list(stream)

    assert [isinstance(item, Ok) for item in items] == [True] * yielded + [False]
    assert numbers(values_of(items[:yielded])) == list(range(1, yielded + 1))
    assert refusal_of(items[-1]) is INTEGRITY
    assert (failing.calls, next(stream, None)) == (nth, None)


def test_a_scan_reads_a_batch_only_when_the_consumer_reaches_it(monkeypatch: pytest.MonkeyPatch) -> None:
    world = five_events_in_batches_of_two(monkeypatch)
    failing, failed = failing_on_read(world, 2, BUSY)

    stream = value_of(scan_events(failed.runtime, {}))
    assert failing.calls == 0
    first, second = value_of(next(stream)), value_of(next(stream))

    assert (numbers((first, second)), failing.calls) == ([1, 2], 1)
    assert refusal_of(next(stream)) is BUSY
    assert failing.calls == 2
