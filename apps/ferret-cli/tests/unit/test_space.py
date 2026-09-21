"""Physical space rules: high-water accounting, the compaction policy, and the planning-envelope gate."""

import pytest

from ferret.domain.space import (
    COMPACTION_MIN_FREELIST_BYTES,
    COMPACTION_MIN_FREELIST_SHARE,
    ENVELOPE_MAX_BYTES_PER_EVENT,
    ENVELOPE_MIN_BYTES_PER_EVENT,
    KIB,
    MIB,
    SizeReport,
    StorageFacts,
    bytes_per_event,
    high_water_bytes,
    index_share,
    should_compact,
    size_report,
)


def test_the_plan_fixes_the_envelope_and_the_compaction_thresholds() -> None:
    assert ENVELOPE_MIN_BYTES_PER_EVENT == 0.7 * KIB
    assert ENVELOPE_MAX_BYTES_PER_EVENT == 1.5 * KIB
    assert COMPACTION_MIN_FREELIST_BYTES == 16 * MIB
    assert COMPACTION_MIN_FREELIST_SHARE == 0.25


def test_a_footprint_is_the_database_and_its_log_together() -> None:
    assert StorageFacts(database_bytes=131072, wal_bytes=32768, freelist_bytes=4096).footprint_bytes == 163840


def test_the_high_water_mark_is_the_largest_footprint_measured_and_never_falls_below_any_of_them() -> None:
    before = StorageFacts(64 * MIB, 0, 16 * MIB)
    rewriting = StorageFacts(48 * MIB, 48 * MIB, 0)
    after = StorageFacts(48 * MIB, 0, 0)

    assert high_water_bytes([before, rewriting, after]) == 96 * MIB
    assert high_water_bytes([after, before]) == 64 * MIB
    assert high_water_bytes([after]) == 48 * MIB


def test_a_high_water_mark_needs_at_least_one_measurement() -> None:
    with pytest.raises(ValueError, match="measurement"):
        high_water_bytes([])


@pytest.mark.parametrize(
    ("database_bytes", "freelist_bytes", "compact"),
    [
        pytest.param(64 * MIB, 16 * MIB, True, id="exactly-both-thresholds"),
        pytest.param(64 * MIB, 32 * MIB, True, id="well-above-both"),
        pytest.param(64 * MIB, 16 * MIB - 1, False, id="a-byte-below-the-absolute-threshold"),
        pytest.param(65 * MIB, 16 * MIB, False, id="below-the-proportional-threshold"),
        pytest.param(8 * MIB, 6 * MIB, False, id="mostly-free-but-too-small-to-be-worth-a-rewrite"),
        pytest.param(4096 * MIB, 512 * MIB, False, id="large-in-bytes-but-a-small-share"),
        pytest.param(0, 0, False, id="an-empty-file"),
    ],
)
def test_compaction_runs_only_when_free_pages_exceed_both_the_absolute_and_the_proportional_threshold(
    database_bytes: int, freelist_bytes: int, compact: bool
) -> None:
    assert should_compact(StorageFacts(database_bytes, 0, freelist_bytes)) is compact


def test_bytes_per_event_divides_the_database_by_its_events() -> None:
    assert bytes_per_event(1_024_000, 1000) == 1024.0


def test_bytes_per_event_is_undefined_without_events() -> None:
    with pytest.raises(ValueError, match="events"):
        bytes_per_event(4096, 0)


def test_index_share_is_the_fraction_of_the_database_held_by_indexes() -> None:
    assert index_share(250, 1000) == 0.25


def test_index_share_is_undefined_for_an_empty_database() -> None:
    with pytest.raises(ValueError, match="database"):
        index_share(0, 0)


@pytest.mark.parametrize(
    ("per_event", "acceptance"),
    [
        pytest.param(ENVELOPE_MIN_BYTES_PER_EVENT, "within_envelope", id="the-lower-bound-is-inside"),
        pytest.param(1.0 * KIB, "within_envelope", id="the-middle"),
        pytest.param(ENVELOPE_MAX_BYTES_PER_EVENT, "within_envelope", id="the-upper-bound-is-inside"),
        pytest.param(ENVELOPE_MIN_BYTES_PER_EVENT - 0.1, "unexplained", id="just-under"),
        pytest.param(ENVELOPE_MAX_BYTES_PER_EVENT + 0.1, "unexplained", id="just-over"),
    ],
)
def test_a_size_outside_the_planning_envelope_fails_the_gate_until_it_is_explained(
    per_event: float, acceptance: str
) -> None:
    report = size_report(events=1000, database_bytes=round(per_event * 1000), index_bytes=0)

    assert report.acceptance == acceptance
    assert report.passes is (acceptance == "within_envelope")


def test_an_explanation_lets_an_outside_size_pass_and_is_kept_with_the_figures() -> None:
    report = size_report(
        events=1000, database_bytes=2 * KIB * 1000, index_bytes=500_000, explanation="fixed page overhead dominates"
    )

    assert report == SizeReport(
        events=1000,
        database_bytes=2 * KIB * 1000,
        index_bytes=500_000,
        bytes_per_event=2.0 * KIB,
        index_share=500_000 / (2 * KIB * 1000),
        acceptance="explained",
        explanation="fixed page overhead dominates",
    )
    assert report.passes


@pytest.mark.parametrize("explanation", ["", "   "])
def test_a_blank_explanation_explains_nothing(explanation: str) -> None:
    report = size_report(events=1000, database_bytes=3 * KIB * 1000, index_bytes=0, explanation=explanation)

    assert (report.acceptance, report.explanation) == ("unexplained", None)


def test_an_explanation_of_an_inside_size_is_not_needed_and_is_not_kept() -> None:
    report = size_report(events=1000, database_bytes=1 * KIB * 1000, index_bytes=0, explanation="unneeded")

    assert (report.acceptance, report.explanation) == ("within_envelope", None)
