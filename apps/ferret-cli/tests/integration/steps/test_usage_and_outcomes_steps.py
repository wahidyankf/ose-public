"""Integration bindings for the usage and outcomes feature, against a real temporary home and SQLite database."""

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, scenario, then, when

from ferret.help_text import COMMAND_HELP
from support.invoke import Ran
from support.machine import Machine, make_machine
from support.scenarios import incomplete_visibility_events

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/analytics/usage-and-outcomes.feature"


@dataclass(slots=True)
class Session:
    """A private temporary machine and the outcome summary the user asked for."""

    machine: Machine
    now: datetime
    summary: Ran | None = None

    def row(self) -> dict[str, Any]:
        assert self.summary is not None
        assert (self.summary.code, self.summary.stderr) == (0, "")
        [row] = json.loads(self.summary.stdout)["rows"]
        return row


@pytest.fixture
def session(tmp_path: Path) -> Session:
    return Session(machine=make_machine(tmp_path), now=datetime.now(UTC))


@scenario(FEATURE, "Summarize outcomes with incomplete visibility")
def test_summarize_outcomes_with_incomplete_visibility() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("some completed operations have observed durations and some outcomes are unknown")
def given_observed_durations_and_unknown_outcomes(session: Session) -> None:
    session.machine.fill(incomplete_visibility_events(session.now))


@when("the user requests outcome analytics")
def when_outcome_analytics_are_requested(session: Session) -> None:
    session.summary = session.machine.run(["outcomes", "--group-by", "harness", "--json"])


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
