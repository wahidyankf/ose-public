"""The benchmark's own rules, and what it measures of a real store built by the artifact.

The pure rules (percentiles, projections, the acceptance gate, and the rows it seeds) are checked directly. The
measured figures are checked by running the benchmark as a separate process against the built artifact: bytes per
event and index share come from real stores, and the planning-envelope gate judges a size that was really measured.
"""

import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

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

BENCHMARK = Path(__file__).resolve().parents[1] / "src" / "storage_benchmark.py"
SEED = 20260918
CAPTURE_SAMPLES = "3"
REPRESENTATIVE_EVENTS = 1000
# Two events cannot outweigh the schema's fixed pages, so the measured size per event lies far above the envelope.
TOO_FEW_FOR_THE_ENVELOPE = 2
EXPLANATION = "the fixed schema pages dominate a two-event fixture"
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


def run_benchmark(
    artifact: Path, scratch: Path, events: int, *extra: str
) -> tuple[subprocess.CompletedProcess[str], dict[str, Any]]:
    """The benchmark as a separate process against ``artifact``, and the aggregate result it wrote."""
    output = scratch / f"storage-{events}-{len(extra)}.json"
    ran = subprocess.run(  # the interpreter is the one running these tests; the benchmark is this project's own
        [
            sys.executable,
            str(BENCHMARK),
            "--events",
            str(events),
            "--seed",
            str(SEED),
            "--output",
            str(output),
            "--artifact",
            str(artifact),
            "--capture-samples",
            CAPTURE_SAMPLES,
            *extra,
        ],
        capture_output=True,
        text=True,
        env={"PATH": "/usr/bin:/bin"},
        timeout=300,
        check=False,
    )
    report: dict[str, Any] = json.loads(output.read_text())
    return ran, report


def test_the_benchmark_reports_bytes_per_event_and_index_share_of_a_measured_store(
    artifact: Path, tmp_path: Path
) -> None:
    ran, report = run_benchmark(artifact, tmp_path, REPRESENTATIVE_EVENTS)

    assert (ran.returncode, ran.stderr) == (0, "")
    database_bytes = report["insertion"]["afterCheckpoint"]["databaseBytes"]
    assert report["perEvent"]["bytesPerEvent"] == round(database_bytes / REPRESENTATIVE_EVENTS, 1)
    assert report["perEvent"]["indexShare"] == round(report["space"]["indexBytes"] / database_bytes, 3)
    assert 0 < report["perEvent"]["indexShare"] < 1
    assert ENVELOPE_MIN_BYTES_PER_EVENT <= report["perEvent"]["bytesPerEvent"] <= ENVELOPE_MAX_BYTES_PER_EVENT
    assert report["acceptance"] == {"state": "within_envelope", "problems": [], "explanation": None}
    assert report["reclamation"]["expiredEventCount"] == REPRESENTATIVE_EVENTS // 2
    assert report["reclamation"]["observedPeakBytes"] <= (
        report["reclamation"]["reportedHighWaterBytes"] + PEAK_ALLOWANCE_BYTES
    )
    labels = [line.split(":")[0] for line in ran.stdout.splitlines()]
    assert labels[:5] == [
        "FERRET storage benchmark",
        "Empty schema",
        "Loaded before checkpoint",
        "Loaded after checkpoint",
        "Per event",
    ]
    assert "Maintenance" in labels


def test_a_measured_size_outside_the_planning_envelope_fails_the_gate_until_it_is_explained(
    artifact: Path, tmp_path: Path
) -> None:
    refused, unexplained = run_benchmark(artifact, tmp_path, TOO_FEW_FOR_THE_ENVELOPE)
    accepted, explained = run_benchmark(artifact, tmp_path, TOO_FEW_FOR_THE_ENVELOPE, "--explanation", EXPLANATION)

    database_bytes = unexplained["insertion"]["afterCheckpoint"]["databaseBytes"]
    assert unexplained["perEvent"]["bytesPerEvent"] == round(database_bytes / TOO_FEW_FOR_THE_ENVELOPE, 1)
    assert unexplained["perEvent"]["bytesPerEvent"] > ENVELOPE_MAX_BYTES_PER_EVENT
    assert refused.returncode == 1
    assert unexplained["acceptance"]["state"] == "unexplained"
    assert any("planning envelope" in problem for problem in unexplained["acceptance"]["problems"])
    assert "Acceptance: unexplained" in refused.stdout.splitlines()
    assert (accepted.returncode, accepted.stderr) == (0, "")
    assert explained["acceptance"]["state"] == "explained"
    assert explained["acceptance"]["explanation"] == EXPLANATION
    assert explained["perEvent"] == unexplained["perEvent"]
