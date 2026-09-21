"""Unit bindings for the usage and outcomes feature, in process with every OS dependency faked."""

import json
from dataclasses import dataclass
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.help_text import COMMAND_HELP
from support.fakes import FIXED_NOW, World
from support.invoke import Ran, run_cli
from support.populate import world_with
from support.scenarios import incomplete_visibility_events

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


@scenario(FEATURE, "Summarize outcomes with incomplete visibility")
def test_summarize_outcomes_with_incomplete_visibility() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("some completed operations have observed durations and some outcomes are unknown")
def given_observed_durations_and_unknown_outcomes(session: Session) -> None:
    session.world.events.stored.extend(incomplete_visibility_events(FIXED_NOW))


@when("the user requests outcome analytics")
def when_outcome_analytics_are_requested(session: Session) -> None:
    session.summary = run_cli(session.world, ["outcomes", "--group-by", "harness", "--json"])


@then("observed success, failure, cancellation, and duration values are aggregated separately")
def then_values_are_aggregated_separately(session: Session) -> None:
    row = session.row()

    assert (row["successCount"], row["failureCount"], row["cancelledCount"]) == (2, 1, 1)
    assert (row["observedOutcomeCount"], row["derivedOutcomeCount"]) == (3, 1)
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
