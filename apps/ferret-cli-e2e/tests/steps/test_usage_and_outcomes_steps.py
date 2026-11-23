"""E2E bindings for the usage and outcomes feature: the built artifact, seeded only through its own commands."""

import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from event_documents import numbered_event
from ferret_process import Completed, capture_documents, run_artifact

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature"
NO_OUTCOME: dict[str, Any] = {
    "outcome": "not_applicable",
    "durationMs": None,
    "outcomeVisibility": "not_applicable",
    "durationVisibility": "not_applicable",
}


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, and the outcome summary the user asked for."""

    artifact: Path
    home: Path
    summary: Completed | None = None

    def row(self) -> dict[str, Any]:
        assert self.summary is not None
        assert (self.summary.returncode, self.summary.stderr) == (0, b"")
        [row] = json.loads(self.summary.stdout)["rows"]
        return row


@pytest.fixture
def session(artifact: Path, home: Path) -> Session:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    return Session(artifact=artifact, home=home)


# @scenario specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature: Summarize outcomes with incomplete visibility
@scenario(FEATURE, "Summarize outcomes with incomplete visibility")
def test_summarize_outcomes_with_incomplete_visibility() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("some completed operations have observed durations and some outcomes are unknown")
def given_observed_durations_and_unknown_outcomes(session: Session) -> None:
    now = datetime.now(UTC)
    capture_documents(
        session.artifact,
        session.home,
        [
            numbered_event(1, now=now, ago=timedelta(minutes=5), durationMs=10),
            numbered_event(2, now=now, ago=timedelta(minutes=4), durationMs=27),
            numbered_event(
                3,
                now=now,
                ago=timedelta(minutes=3),
                eventType="tool.failed",
                outcome="failure",
                durationMs=None,
                durationVisibility="unknown",
            ),
            numbered_event(
                4,
                now=now,
                ago=timedelta(minutes=2),
                eventType="agent.ended",
                agentName="reviewer",
                toolName=None,
                outcome="cancelled",
                outcomeVisibility="derived",
                durationMs=5,
                durationVisibility="derived",
            ),
            numbered_event(
                5,
                now=now,
                ago=timedelta(minutes=1),
                eventType="session.ended",
                toolName=None,
                subjectVisibility="not_applicable",
                outcome="unknown",
                outcomeVisibility="unknown",
                durationMs=None,
                durationVisibility="unknown",
            ),
            numbered_event(6, now=now, ago=timedelta(seconds=30), eventType="tool.started", **NO_OUTCOME),
        ],
    )


@when("the user requests outcome analytics")
def when_outcome_analytics_are_requested(session: Session) -> None:
    session.summary = run_artifact(session.artifact, ["outcomes", "--group-by", "harness", "--json"], home=session.home)


@then("outcomes and known durations are aggregated, with observed and derived outcomes counted separately")
def then_outcomes_and_known_durations_are_aggregated(session: Session) -> None:
    row = session.row()

    # The outcome counts take every terminal outcome, whatever its provenance: the cancellation here is derived.
    assert (row["successCount"], row["failureCount"], row["cancelledCount"]) == (2, 1, 1)
    # Provenance is where observed and derived part: three observed outcomes and the one derived cancellation.
    assert (row["observedOutcomeCount"], row["derivedOutcomeCount"]) == (3, 1)
    # The duration statistics cover every known duration, the observed 10 and 27 ms and the derived 5 ms alike, and
    # skip the failure and the session end whose durations are unknown.
    assert (row["durationSampleCount"], row["durationTotalMs"], row["durationMinMs"], row["durationMaxMs"]) == (
        3,
        42,
        5,
        27,
    )


@then("unknown outcomes remain in an explicit unknown bucket")
def then_unknown_outcomes_stay_unknown(session: Session) -> None:
    row = session.row()

    assert row["unknownOutcomeCount"] == 1
    assert row["successCount"] + row["failureCount"] + row["cancelledCount"] + row["unknownOutcomeCount"] == 5
    assert row["eventCount"] == 6


@then("the output states that the summary is not a semantic quality or causal evaluation")
def then_the_summary_disclaims_quality_and_causation(session: Session) -> None:
    assert session.summary is not None
    interpretation = json.loads(session.summary.stdout)["interpretation"]
    assert interpretation == "Operational correlation only; this is not semantic quality or causal attribution."
    help_text = run_artifact(session.artifact, ["outcomes", "--help"], home=session.home)
    assert "not a semantic quality or causal evaluation" in " ".join(help_text.stdout.decode().split())


# @scenario specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature: Count usage by one to three dimensions and honour the filters
@scenario(FEATURE, "Count usage by one to three dimensions and honour the filters")
def test_count_usage_by_one_to_three_dimensions_and_honour_the_filters() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("the database holds agent-ended events from two harnesses")
def given_agent_ended_events_from_two_harnesses(session: Session) -> None:
    now = datetime.now(UTC)
    capture_documents(
        session.artifact,
        session.home,
        [
            numbered_event(
                1,
                now=now,
                ago=timedelta(minutes=5),
                eventType="agent.ended",
                agentName="reviewer",
                toolName=None,
                harness="codex",
                outcome="failure",
            ),
            numbered_event(
                2,
                now=now,
                ago=timedelta(minutes=4),
                eventType="agent.ended",
                agentName="reviewer",
                toolName=None,
                harness="codex",
                outcome="failure",
            ),
            numbered_event(
                3,
                now=now,
                ago=timedelta(minutes=3),
                eventType="agent.ended",
                agentName="reviewer",
                toolName=None,
                harness="claude_code",
                outcome="failure",
            ),
        ],
    )


@when(parsers.parse("the user counts usage grouped by {dimensions} for the codex harness only"))
def when_usage_is_counted_for_codex(session: Session, dimensions: str) -> None:
    session.summary = run_artifact(
        session.artifact,
        ["usage", "--group-by", dimensions, "--harness", "codex", "--json"],
        home=session.home,
    )


@then("each group names every dimension asked for and counts the matching events once")
def then_each_group_names_every_dimension(session: Session) -> None:
    assert session.summary is not None
    assert (session.summary.returncode, session.summary.stderr) == (0, b"")
    document = json.loads(session.summary.stdout)
    assert document["rows"], "the codex events must form at least one group"
    for row in document["rows"]:
        assert [dimension["name"] for dimension in row["dimensions"]] == document["groupBy"]
    assert sum(row["eventCount"] for row in document["rows"]) == 2


@then("no event from the other harness is counted")
def then_no_event_from_the_other_harness_is_counted(session: Session) -> None:
    assert session.summary is not None
    document = json.loads(session.summary.stdout)
    harness_values = [
        dimension["value"]
        for row in document["rows"]
        for dimension in row["dimensions"]
        if dimension["name"] == "harness"
    ]
    assert harness_values == ["codex"] * len(harness_values)
    assert sum(row["eventCount"] for row in document["rows"]) == 2


# @scenario specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature: Outcomes refuses a group-by list that repeats or misnames a dimension
@scenario(FEATURE, "Outcomes refuses a group-by list that repeats or misnames a dimension")
def test_outcomes_refuses_a_group_by_list_that_repeats_or_misnames_a_dimension() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("FERRET is initialized")
def given_ferret_is_initialized(session: Session) -> None:
    assert session.home.is_dir()


@when(parsers.parse("the user runs outcomes grouped by {dimensions}"))
def when_outcomes_are_grouped_by_refused_list(session: Session, dimensions: str) -> None:
    session.summary = run_artifact(
        session.artifact, ["outcomes", "--group-by", dimensions, "--json"], home=session.home
    )


@then("the command exits 2 with ferret.args.invalid on stderr and nothing on stdout")
def then_outcomes_refuses_with_args_invalid(session: Session) -> None:
    assert session.summary is not None
    assert (session.summary.returncode, session.summary.stdout) == (2, b"")
    assert json.loads(session.summary.stderr)["error"]["code"] == "ferret.args.invalid"
