"""The benchmark's own rules: percentiles, projections, the acceptance gate, and the rows it seeds."""

from datetime import UTC, datetime

import pytest

from event_documents import stamp
from storage_benchmark import (
    ENVELOPE_MAX_BYTES_PER_EVENT,
    ENVELOPE_MIN_BYTES_PER_EVENT,
    KIB,
    PEAK_ALLOWANCE_BYTES,
    Acceptance,
    distribution,
    judge,
    percentile,
    projections,
)
from synthetic_store import RETENTION, WORKSPACES, synthetic_rows

NOW = datetime(2026, 9, 18, 8, 15, 30, tzinfo=UTC)
INSIDE = 1000.0
ENOUGH = 10 * 1024 * 1024


def gate(
    *, bytes_per_event: float = INSIDE, peak: int = ENOUGH, high_water: int = ENOUGH, explanation: str | None = None
) -> Acceptance:
    return judge(
        bytes_per_event=bytes_per_event, observed_peak=peak, reported_high_water=high_water, explanation=explanation
    )


def test_a_percentile_is_the_nearest_rank_of_the_ordered_samples() -> None:
    ordered = [float(number) for number in range(1, 101)]

    assert (percentile(ordered, 0.50), percentile(ordered, 0.95), percentile(ordered, 1.0)) == (50.0, 95.0, 100.0)
    assert percentile([7.0], 0.95) == 7.0


def test_a_distribution_summarises_unordered_samples_to_a_tenth_of_a_millisecond() -> None:
    assert distribution([30.04, 10.0, 20.0]) == {
        "count": 3,
        "minMs": 10.0,
        "p50Ms": 20.0,
        "p95Ms": 30.0,
        "maxMs": 30.0,
        "meanMs": 20.0,
    }


@pytest.mark.parametrize("bytes_per_event", [ENVELOPE_MIN_BYTES_PER_EVENT, INSIDE, ENVELOPE_MAX_BYTES_PER_EVENT])
def test_a_size_inside_the_envelope_passes_with_nothing_to_explain(bytes_per_event: float) -> None:
    accepted = gate(bytes_per_event=bytes_per_event, explanation="not needed")

    assert (accepted.state, accepted.problems, accepted.explanation, accepted.passes) == (
        "within_envelope",
        (),
        None,
        True,
    )


@pytest.mark.parametrize("bytes_per_event", [ENVELOPE_MIN_BYTES_PER_EVENT - 0.1, ENVELOPE_MAX_BYTES_PER_EVENT + 0.1])
def test_a_size_outside_the_envelope_fails_until_it_is_explained(bytes_per_event: float) -> None:
    refused = gate(bytes_per_event=bytes_per_event)
    explained = gate(bytes_per_event=bytes_per_event, explanation="fixed pages dominate")

    assert (refused.state, refused.passes) == ("unexplained", False)
    assert (explained.state, explained.passes, explained.explanation) == ("explained", True, "fixed pages dominate")
    assert len(refused.problems) == 1
    assert "planning envelope" in refused.problems[0]


def test_a_peak_beyond_the_reported_high_water_mark_and_its_allowance_fails_the_gate() -> None:
    within_allowance = gate(peak=ENOUGH + PEAK_ALLOWANCE_BYTES, high_water=ENOUGH)
    beyond_allowance = gate(peak=ENOUGH + PEAK_ALLOWANCE_BYTES + 1, high_water=ENOUGH)

    assert within_allowance.state == "within_envelope"
    assert (beyond_allowance.state, len(beyond_allowance.problems)) == ("unexplained", 1)
    assert "high-water" in beyond_allowance.problems[0]


def test_projections_scale_the_measured_marginal_size_to_a_thirty_day_store_at_each_planned_rate() -> None:
    projected = projections(empty_bytes=80 * KIB, marginal_bytes_per_event=1000.0)

    assert [item["eventsPerDay"] for item in projected] == [5_000, 20_000, 100_000]
    assert [item["events"] for item in projected] == [150_000, 600_000, 3_000_000]
    assert projected[0]["steadyStateBytes"] == 80 * KIB + 150_000_000
    assert all(item["compactionPeakBytes"] == 2 * item["steadyStateBytes"] for item in projected)


def test_the_same_seed_seeds_the_same_rows_and_another_seed_seeds_others() -> None:
    first = synthetic_rows(7, 200, now=NOW, expired=100)

    assert synthetic_rows(7, 200, now=NOW, expired=100) == first
    assert synthetic_rows(8, 200, now=NOW, expired=100) != first


def test_the_seeded_rows_split_exactly_at_the_retention_cutoff() -> None:
    rows = synthetic_rows(7, 200, now=NOW, expired=100)
    cutoff = stamp(NOW - RETENTION)

    assert sum(str(row[4]) <= stamp(NOW) for row in rows) == 100
    assert all(str(row[3]) < cutoff for row in rows[:100])
    assert all(str(row[3]) > cutoff for row in rows[100:])
    assert [str(row[3]) for row in rows] == sorted(str(row[3]) for row in rows)
    assert len({row[0] for row in rows}) == 200
    assert {row[8] for row in rows} <= set(WORKSPACES)
