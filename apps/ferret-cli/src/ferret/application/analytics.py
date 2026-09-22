"""Usage and outcome summaries: events grouped by up to three dimensions, each provenance kept apart.

A summary is an operational proxy, never a quality or causal claim. A value that could not be observed is counted in
its own unknown bucket rather than folded into zero, and a statistic with no sample is absent rather than zero.
"""

from collections.abc import Callable, Iterable, Mapping
from dataclasses import dataclass
from typing import Final, Protocol

from ferret.application.ports import Runtime
from ferret.application.queries import scan_events
from ferret.domain.errors import FerretError
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


def parse_group_by(options: Options, allowed: tuple[str, ...]) -> tuple[str, ...]:
    """One to three unique dimensions from ``allowed``, comma separated and kept in the order the caller wrote them."""
    raw = single_value(options, "--group-by", refusal="ferret.args.invalid")
    names = () if raw is None else tuple(raw.split(","))
    if not 1 <= len(names) <= MAX_DIMENSIONS or len(set(names)) != len(names) or not set(names) <= set(allowed):
        raise FerretError("ferret.args.invalid")
    return names


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


def summarize_usage(runtime: Runtime, options: Options) -> Summary[UsageRow]:
    """Usage over the events the filters select, grouped as requested; arguments are validated before storage."""
    group_by = parse_group_by(options, USAGE_DIMENSIONS)
    return Summary(group_by, aggregate_usage(scan_events(runtime, options), group_by), USAGE_INTERPRETATION)


def summarize_outcomes(runtime: Runtime, options: Options) -> Summary[OutcomeRow]:
    """Outcomes over the events the filters select, grouped as requested; arguments are validated before storage."""
    group_by = parse_group_by(options, OUTCOME_DIMENSIONS)
    return Summary(group_by, aggregate_outcomes(scan_events(runtime, options), group_by), OUTCOMES_INTERPRETATION)
