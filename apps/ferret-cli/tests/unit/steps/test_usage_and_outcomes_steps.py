"""Unit bindings for the usage and outcomes feature, in process with every OS dependency faked."""

import json
from dataclasses import dataclass
from datetime import timedelta
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.help_text import COMMAND_HELP
from support.fakes import FIXED_NOW, World
from support.invoke import Ran, run_cli
from support.populate import world_with
from support.scenarios import agent_ended, incomplete_visibility_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature"


@dataclass(slots=True)
class Session:
    """The fake machine and the outcome summary the user asked for."""

    world: World
    summary: Ran | None = None

    def row(self) -> dict[str, Any]:
        assert self.summary is not None
        assert (self.summary.code, self.summary.stderr) == (0, "")
        [row] = json.loads(self.summary.stdout)["rows"]
        return row


@pytest.fixture
def session() -> Session:
    return Session(world=world_with())


# @scenario specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature: Summarize outcomes with incomplete visibility
@scenario(FEATURE, "Summarize outcomes with incomplete visibility")
def test_summarize_outcomes_with_incomplete_visibility() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("some completed operations have observed durations and some outcomes are unknown")
def given_observed_durations_and_unknown_outcomes(session: Session) -> None:
    session.world.events.stored.extend(incomplete_visibility_events(FIXED_NOW))


@when("the user requests outcome analytics")
def when_outcome_analytics_are_requested(session: Session) -> None:
    session.summary = run_cli(session.world, ["outcomes", "--group-by", "harness", "--json"])


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
    assert "not a semantic quality or causal evaluation" in " ".join(COMMAND_HELP[("outcomes",)].split())


# @scenario specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature: Count usage by one to three dimensions and honour the filters
@scenario(FEATURE, "Count usage by one to three dimensions and honour the filters")
def test_count_usage_by_one_to_three_dimensions_and_honour_the_filters() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("the database holds agent-ended events from two harnesses")
def given_agent_ended_events_from_two_harnesses(session: Session) -> None:
    session.world.events.stored.extend(
        [
            agent_ended(1, now=FIXED_NOW, ago=timedelta(hours=1)),
            agent_ended(2, now=FIXED_NOW, ago=timedelta(hours=2)),
            agent_ended(3, now=FIXED_NOW, ago=timedelta(hours=2), harness="claude_code"),
        ]
    )


@when(parsers.parse("the user counts usage grouped by {dimensions} for the codex harness only"))
def when_usage_is_counted_for_codex(session: Session, dimensions: str) -> None:
    session.summary = run_cli(session.world, ["usage", "--group-by", dimensions, "--harness", "codex", "--json"])


@then("each group names every dimension asked for and counts the matching events once")
def then_each_group_names_every_dimension(session: Session) -> None:
    assert session.summary is not None
    assert (session.summary.code, session.summary.stderr) == (0, "")
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
    assert session.world.schema.applied


@when(parsers.parse("the user runs outcomes grouped by {dimensions}"))
def when_outcomes_are_grouped_by_refused_list(session: Session, dimensions: str) -> None:
    session.summary = run_cli(session.world, ["outcomes", "--group-by", dimensions, "--json"])


@then("the command exits 2 with ferret.args.invalid on stderr and nothing on stdout")
def then_outcomes_refuses_with_args_invalid(session: Session) -> None:
    assert session.summary is not None
    assert (session.summary.code, session.summary.stdout) == (2, "")
    assert json.loads(session.summary.stderr)["error"]["code"] == "ferret.args.invalid"
