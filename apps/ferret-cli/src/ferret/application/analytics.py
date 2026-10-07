"""Usage and outcome summaries: events grouped by up to three dimensions, each provenance kept apart.

A summary is an operational proxy, never a quality or causal claim. A value that could not be observed is counted in
its own unknown bucket rather than folded into zero, and a statistic with no sample is absent rather than zero.
"""

from collections.abc import Callable, Iterable, Iterator, Mapping
from dataclasses import dataclass
from typing import Final, Protocol

from typekit import Err, Ok

from ferret.application.ports import Runtime
from ferret.application.queries import scan_events
from ferret.domain.errors import FerretError, FerretResult
from ferret.domain.event import KNOWN_VISIBILITIES, Event
from ferret.domain.query import Options, single_value

type Dimension = tuple[str, str | None]

MAX_DIMENSIONS: Final = 3
USAGE_DIMENSIONS: Final = ("harness", "event_type", "agent", "skill", "tool", "subject_visibility")
OUTCOME_DIMENSIONS: Final = ("harness", "event_type", "agent", "skill", "tool", "outcome", "outcome_visibility")
USAGE_INTERPRETATION: Final = "Operational usage only; unknown subject visibility is not zero usage."
OUTCOMES_INTERPRETATION: Final = "Operational correlation only; this is not semantic quality or causal attribution."

_DIMENSION_VALUES: Final[Mapping[str, Callable[[Event], str | None]]] = {
    "harness": lambda event: event.harness,
    "event_type": lambda event: event.event_type,
    "agent": lambda event: event.agent_name,
    "skill": lambda event: event.skill_name,
    "tool": lambda event: event.tool_name,
    "subject_visibility": lambda event: event.subject_visibility,
    "outcome": lambda event: event.outcome,
    "outcome_visibility": lambda event: event.outcome_visibility,
}


@dataclass(frozen=True, slots=True)
class UsageRow:
    """Events in one group, split by whether the subject they name was observed, derived, or unknown."""

    dimensions: tuple[Dimension, ...]
    event_count: int
    observed_subject_count: int
    derived_subject_count: int
    unknown_subject_count: int


@dataclass(frozen=True, slots=True)
class OutcomeRow:
    """Events in one group: terminal outcomes and their provenance, and duration statistics over the known samples."""

    dimensions: tuple[Dimension, ...]
    event_count: int
    success_count: int
    failure_count: int
    cancelled_count: int
    unknown_outcome_count: int
    observed_outcome_count: int
    derived_outcome_count: int
    duration_sample_count: int
    duration_total_ms: int | None
    duration_min_ms: int | None
    duration_max_ms: int | None


@dataclass(frozen=True, slots=True)
class Summary[Row]:
    """The grouped rows of one summary, the dimensions they were grouped by, and what the numbers do not mean."""

    group_by: tuple[str, ...]
    rows: tuple[Row, ...]
    interpretation: str


class _Tally(Protocol):
    def add(self, event: Event) -> None: ...


@dataclass(slots=True)
class _UsageTally:
    events: int = 0
    observed: int = 0
    derived: int = 0
    unknown: int = 0

    def add(self, event: Event) -> None:
        self.events += 1
        if event.subject_visibility == "observed":
            self.observed += 1
        elif event.subject_visibility == "derived":
            self.derived += 1
        elif event.subject_visibility == "unknown":
            self.unknown += 1


@dataclass(slots=True)
class _OutcomeTally:
    events: int = 0
    success: int = 0
    failure: int = 0
    cancelled: int = 0
    unknown: int = 0
    observed: int = 0
    derived: int = 0
    samples: int = 0
    total: int = 0
    shortest: int | None = None
    longest: int | None = None

    def add(self, event: Event) -> None:
        self.events += 1
        if event.outcome == "success":
            self.success += 1
        elif event.outcome == "failure":
            self.failure += 1
        elif event.outcome == "cancelled":
            self.cancelled += 1
        if event.outcome_visibility == "observed":
            self.observed += 1
        elif event.outcome_visibility == "derived":
            self.derived += 1
        elif event.outcome_visibility == "unknown":
            self.unknown += 1
        duration = event.duration_ms
        if duration is not None and event.duration_visibility in KNOWN_VISIBILITIES:
            self.samples += 1
            self.total += duration
            self.shortest = duration if self.shortest is None else min(self.shortest, duration)
            self.longest = duration if self.longest is None else max(self.longest, duration)


def _dimensions(raw: str | None, allowed: tuple[str, ...]) -> FerretResult[tuple[str, ...]]:
    """The names ``raw`` spells, when there are one to three of them, each unique and one of ``allowed``."""
    names = () if raw is None else tuple(raw.split(","))
    if not 1 <= len(names) <= MAX_DIMENSIONS or len(set(names)) != len(names) or not set(names) <= set(allowed):
        return Err(FerretError("ferret.args.invalid"))
    return Ok(names)


def parse_group_by(options: Options, allowed: tuple[str, ...]) -> FerretResult[tuple[str, ...]]:
    """One to three unique dimensions from ``allowed``, comma separated and kept in the order the caller wrote them."""
    return single_value(options, "--group-by", refusal="ferret.args.invalid").flat_map(
        lambda raw: _dimensions(raw, allowed)
    )


def _order(values: tuple[str | None, ...]) -> tuple[tuple[bool, str], ...]:
    """Strings in code point order, with an absent value after every string, one dimension after another."""
    return tuple((value is None, "" if value is None else value) for value in values)


def _grouped[Tally: _Tally](
    events: Iterable[Event], group_by: tuple[str, ...], new: Callable[[], Tally]
) -> list[tuple[tuple[Dimension, ...], Tally]]:
    readers = [_DIMENSION_VALUES[name] for name in group_by]
    tallies: dict[tuple[str | None, ...], Tally] = {}
    for event in events:
        key = tuple(read(event) for read in readers)
        tally = tallies.get(key)
        if tally is None:
            tally = tallies[key] = new()
        tally.add(event)
    return [(tuple(zip(group_by, key, strict=True)), tallies[key]) for key in sorted(tallies, key=_order)]


def aggregate_usage(events: Iterable[Event], group_by: tuple[str, ...]) -> tuple[UsageRow, ...]:
    """Count ``events`` per group; an event whose subject is not applicable counts as an event but in no bucket."""
    return tuple(
        UsageRow(dimensions, tally.events, tally.observed, tally.derived, tally.unknown)
        for dimensions, tally in _grouped(events, group_by, _UsageTally)
    )


def aggregate_outcomes(events: Iterable[Event], group_by: tuple[str, ...]) -> tuple[OutcomeRow, ...]:
    """Aggregate ``events`` per group; a group with no known duration has absent duration statistics, never zeros."""
    return tuple(
        OutcomeRow(
            dimensions,
            tally.events,
            tally.success,
            tally.failure,
            tally.cancelled,
            tally.unknown,
            tally.observed,
            tally.derived,
            tally.samples,
            tally.total if tally.samples else None,
            tally.shortest,
            tally.longest,
        )
        for dimensions, tally in _grouped(events, group_by, _OutcomeTally)
    )


def _until_failure(scan: Iterable[FerretResult[Event]], failures: list[FerretError]) -> Iterator[Event]:
    """The events of ``scan`` up to its first failure, which ends them and is noted in ``failures``.

    The aggregation reads one event at a time, so a scan that fails after a million events never holds them all.
    """
    for item in scan:
        if isinstance(item, Err):
            failures.append(item.error)
            return
        yield item.value


def _summarized[Row](
    scan: Iterable[FerretResult[Event]],
    group_by: tuple[str, ...],
    aggregate: Callable[[Iterable[Event], tuple[str, ...]], tuple[Row, ...]],
    interpretation: str,
) -> FerretResult[Summary[Row]]:
    """The summary ``aggregate`` makes of every event of ``scan``, or the failure that ended the scan early."""
    failures: list[FerretError] = []
    rows = aggregate(_until_failure(scan, failures), group_by)
    if failures:
        return Err(failures[0])
    return Ok(Summary(group_by, rows, interpretation))


def _summary[Row](
    runtime: Runtime,
    options: Options,
    allowed: tuple[str, ...],
    aggregate: Callable[[Iterable[Event], tuple[str, ...]], tuple[Row, ...]],
    interpretation: str,
) -> FerretResult[Summary[Row]]:
    """The summary ``aggregate`` makes of the events the filters select; the grouping is validated before storage."""
    return parse_group_by(options, allowed).flat_map(
        lambda group_by: scan_events(runtime, options).flat_map(
            lambda scan: _summarized(scan, group_by, aggregate, interpretation)
        )
    )


def summarize_usage(runtime: Runtime, options: Options) -> FerretResult[Summary[UsageRow]]:
    """Usage over the events the filters select, grouped as requested; arguments are validated before storage."""
    return _summary(runtime, options, USAGE_DIMENSIONS, aggregate_usage, USAGE_INTERPRETATION)


def summarize_outcomes(runtime: Runtime, options: Options) -> FerretResult[Summary[OutcomeRow]]:
    """Outcomes over the events the filters select, grouped as requested; arguments are validated before storage."""
    return _summary(runtime, options, OUTCOME_DIMENSIONS, aggregate_outcomes, OUTCOMES_INTERPRETATION)
