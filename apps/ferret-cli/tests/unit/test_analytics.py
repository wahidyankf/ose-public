"""Usage and outcome summaries: grouping, provenance kept apart, honest nulls, and the stable serialized results."""

import json
from collections.abc import Mapping
from datetime import timedelta
from typing import Any

import pytest

from ferret.application import queries
from ferret.application.analytics import (
    OUTCOME_DIMENSIONS,
    OUTCOMES_INTERPRETATION,
    USAGE_DIMENSIONS,
    USAGE_INTERPRETATION,
    aggregate_outcomes,
    aggregate_usage,
    parse_group_by,
    summarize_outcomes,
    summarize_usage,
)
from ferret.domain.errors import FerretError
from ferret.domain.event import Event
from ferret.help_text import COMMAND_HELP
from support.invoke import run_cli
from support.populate import NO_OUTCOME, make_event, world_with

Options = Mapping[str, tuple[str, ...]]


def tool_completed(number: int, *, duration: int | None = 27, **overrides: Any) -> Event:
    fields: dict[str, Any] = {
        "durationMs": duration,
        "durationVisibility": "observed" if duration is not None else "unknown",
    }
    return make_event(number, **{**fields, **overrides})


def tool_failed(number: int, *, duration: int | None = 27, **overrides: Any) -> Event:
    return tool_completed(number, duration=duration, eventType="tool.failed", outcome="failure", **overrides)


def session_started(number: int, **overrides: Any) -> Event:
    return make_event(
        number,
        eventType="session.started",
        toolName=None,
        subjectVisibility="not_applicable",
        **NO_OUTCOME,
        **overrides,
    )


def session_ended_unknown(number: int, **overrides: Any) -> Event:
    fields: dict[str, Any] = {
        "eventType": "session.ended",
        "toolName": None,
        "subjectVisibility": "not_applicable",
        "outcome": "unknown",
        "outcomeVisibility": "unknown",
        "durationMs": None,
        "durationVisibility": "unknown",
    }
    return make_event(number, **{**fields, **overrides})


def skill_invoked(number: int, skill: str | None, visibility: str, **overrides: Any) -> Event:
    return make_event(
        number,
        eventType="skill.invoked",
        skillName=skill,
        toolName=None,
        subjectVisibility=visibility,
        **NO_OUTCOME,
        **overrides,
    )


def agent_ended_cancelled_derived(number: int, **overrides: Any) -> Event:
    return make_event(
        number,
        eventType="agent.ended",
        agentName="reviewer",
        toolName=None,
        outcome="cancelled",
        outcomeVisibility="derived",
        durationMs=5,
        durationVisibility="derived",
        **overrides,
    )


def refusal(action: Any, *arguments: Any) -> FerretError:
    with pytest.raises(FerretError) as caught:
        action(*arguments)
    return caught.value


def dims(row: Any) -> list[tuple[str, str | None]]:
    return list(row.dimensions)


def test_usage_groups_events_and_keeps_subject_provenance_in_separate_counts() -> None:
    events = (
        skill_invoked(1, None, "unknown"),
        skill_invoked(2, None, "unknown"),
        skill_invoked(3, "tdd", "observed"),
        skill_invoked(4, "tdd", "derived"),
        skill_invoked(5, "tdd", "observed"),
        session_started(6),
    )

    rows = aggregate_usage(events, ("harness", "skill"))

    assert [(dims(row), row.event_count) for row in rows] == [
        ([("harness", "claude_code"), ("skill", "tdd")], 3),
        ([("harness", "claude_code"), ("skill", None)], 3),
    ]
    tdd, unnamed = rows
    assert (tdd.observed_subject_count, tdd.derived_subject_count, tdd.unknown_subject_count) == (2, 1, 0)
    assert (unnamed.observed_subject_count, unnamed.derived_subject_count, unnamed.unknown_subject_count) == (0, 0, 2)


def test_an_event_whose_subject_is_not_applicable_counts_as_an_event_but_in_no_subject_bucket() -> None:
    [row] = aggregate_usage((session_started(1), session_started(2)), ("harness",))

    assert (row.event_count, row.observed_subject_count, row.derived_subject_count, row.unknown_subject_count) == (
        2,
        0,
        0,
        0,
    )


def test_unknown_subjects_are_never_counted_as_zero_usage() -> None:
    [row] = aggregate_usage((skill_invoked(1, None, "unknown"),), ("skill",))

    assert (dims(row), row.event_count, row.unknown_subject_count) == ([("skill", None)], 1, 1)


def test_rows_sort_by_their_dimension_values_in_caller_order_with_null_after_strings() -> None:
    events = (
        skill_invoked(1, "beta", "observed", harness="codex"),
        skill_invoked(2, None, "unknown", harness="claude_code"),
        skill_invoked(3, "alpha", "observed", harness="codex"),
        skill_invoked(4, "beta", "observed", harness="claude_code"),
        skill_invoked(5, None, "unknown", harness="codex"),
    )

    by_harness_then_skill = [dims(row) for row in aggregate_usage(events, ("harness", "skill"))]
    by_skill_then_harness = [dims(row) for row in aggregate_usage(events, ("skill", "harness"))]

    assert by_harness_then_skill == [
        [("harness", "claude_code"), ("skill", "beta")],
        [("harness", "claude_code"), ("skill", None)],
        [("harness", "codex"), ("skill", "alpha")],
        [("harness", "codex"), ("skill", "beta")],
        [("harness", "codex"), ("skill", None)],
    ]
    assert by_skill_then_harness == [
        [("skill", "alpha"), ("harness", "codex")],
        [("skill", "beta"), ("harness", "claude_code")],
        [("skill", "beta"), ("harness", "codex")],
        [("skill", None), ("harness", "claude_code")],
        [("skill", None), ("harness", "codex")],
    ]


def test_strings_sort_by_code_point_whatever_the_locale() -> None:
    events = (skill_invoked(1, "b", "observed"), skill_invoked(2, "B", "observed"), skill_invoked(3, "a", "observed"))

    assert [row.dimensions[0][1] for row in aggregate_usage(events, ("skill",))] == ["B", "a", "b"]


@pytest.mark.parametrize("dimension", USAGE_DIMENSIONS)
def test_every_usage_dimension_reads_its_own_event_field(dimension: str) -> None:
    event = make_event(
        1,
        harness="codex",
        eventType="tool.failed",
        outcome="failure",
        toolName="Write",
        agentName=None,
        skillName=None,
        subjectVisibility="derived",
    )
    expected = {
        "harness": "codex",
        "event_type": "tool.failed",
        "agent": None,
        "skill": None,
        "tool": "Write",
        "subject_visibility": "derived",
    }

    [row] = aggregate_usage((event,), (dimension,))

    assert dims(row) == [(dimension, expected[dimension])]


def test_one_group_by_dimension_is_enough_and_three_are_the_most() -> None:
    event = make_event(1)

    assert len(aggregate_usage((event,), ("harness",))[0].dimensions) == 1
    assert len(aggregate_usage((event,), ("harness", "event_type", "tool"))[0].dimensions) == 3


def test_aggregating_nothing_yields_no_rows() -> None:
    assert aggregate_usage((), ("harness",)) == ()
    assert aggregate_outcomes((), ("harness",)) == ()


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        pytest.param("harness", ("harness",), id="one"),
        pytest.param("harness,skill", ("harness", "skill"), id="two-in-caller-order"),
        pytest.param("skill,harness,tool", ("skill", "harness", "tool"), id="three-in-caller-order"),
    ],
)
def test_group_by_is_a_comma_separated_list_kept_in_caller_order(raw: str, expected: tuple[str, ...]) -> None:
    assert parse_group_by({"--group-by": (raw,)}, USAGE_DIMENSIONS) == expected


@pytest.mark.parametrize(
    "options",
    [
        pytest.param({}, id="absent"),
        pytest.param({"--group-by": ("harness", "skill")}, id="repeated-option"),
        pytest.param({"--group-by": ("",)}, id="empty"),
        pytest.param({"--group-by": ("harness,",)}, id="trailing-comma"),
        pytest.param({"--group-by": (",harness",)}, id="leading-comma"),
        pytest.param({"--group-by": ("harness,,skill",)}, id="empty-item"),
        pytest.param({"--group-by": ("harness,harness",)}, id="repeated-dimension"),
        pytest.param({"--group-by": ("harness,skill,tool,agent",)}, id="four-dimensions"),
        pytest.param({"--group-by": ("workspace",)}, id="unknown-dimension"),
        pytest.param({"--group-by": ("Harness",)}, id="uppercase"),
        pytest.param({"--group-by": ("harness, skill",)}, id="space"),
        pytest.param({"--group-by": ("event-type",)}, id="dashed-spelling"),
        pytest.param({"--group-by": ("outcome",)}, id="outcome-is-not-a-usage-dimension"),
        pytest.param({"--group-by": ("duration",)}, id="duration-is-not-a-dimension"),
    ],
)
def test_a_malformed_group_by_is_invalid_arguments_for_usage(options: Options) -> None:
    error = refusal(parse_group_by, options, USAGE_DIMENSIONS)

    assert (error.code, error.exit_code, error.field, error.retryable) == ("ferret.args.invalid", 2, None, False)


def test_the_two_commands_accept_exactly_their_own_closed_dimension_sets() -> None:
    assert USAGE_DIMENSIONS == ("harness", "event_type", "agent", "skill", "tool", "subject_visibility")
    assert OUTCOME_DIMENSIONS == (
        "harness",
        "event_type",
        "agent",
        "skill",
        "tool",
        "outcome",
        "outcome_visibility",
    )
    assert parse_group_by({"--group-by": ("outcome,outcome_visibility",)}, OUTCOME_DIMENSIONS) == (
        "outcome",
        "outcome_visibility",
    )
    assert refusal(parse_group_by, {"--group-by": ("subject_visibility",)}, OUTCOME_DIMENSIONS).code == (
        "ferret.args.invalid"
    )


def test_outcomes_aggregate_success_failure_cancellation_unknown_and_duration_separately() -> None:
    events = (
        tool_completed(1, duration=10),
        tool_completed(2, duration=27),
        tool_failed(3, duration=None),
        session_ended_unknown(4),
        make_event(5, eventType="tool.started", **NO_OUTCOME),
        session_started(6),
    )

    [row] = aggregate_outcomes(events, ("harness",))

    assert dims(row) == [("harness", "claude_code")]
    assert (row.event_count, row.success_count, row.failure_count, row.cancelled_count) == (6, 2, 1, 0)
    assert (row.unknown_outcome_count, row.observed_outcome_count, row.derived_outcome_count) == (1, 3, 0)
    assert (row.duration_sample_count, row.duration_total_ms, row.duration_min_ms, row.duration_max_ms) == (
        2,
        37,
        10,
        27,
    )


def test_derived_values_are_counted_apart_from_observed_ones_and_still_feed_the_duration_statistics() -> None:
    events = (tool_completed(1, duration=10), agent_ended_cancelled_derived(2))

    [row] = aggregate_outcomes(events, ("harness",))

    assert (row.success_count, row.cancelled_count) == (1, 1)
    assert (row.observed_outcome_count, row.derived_outcome_count, row.unknown_outcome_count) == (1, 1, 0)
    assert (row.duration_sample_count, row.duration_total_ms, row.duration_min_ms, row.duration_max_ms) == (
        2,
        15,
        5,
        10,
    )


def test_a_group_with_no_duration_sample_reports_null_statistics_rather_than_zero() -> None:
    [row] = aggregate_outcomes((tool_failed(1, duration=None), session_ended_unknown(2)), ("harness",))

    assert row.duration_sample_count == 0
    assert (row.duration_total_ms, row.duration_min_ms, row.duration_max_ms) == (None, None, None)


def test_a_duration_of_zero_is_a_sample_not_an_absence() -> None:
    [row] = aggregate_outcomes((tool_completed(1, duration=0),), ("harness",))

    assert (row.duration_sample_count, row.duration_total_ms, row.duration_min_ms, row.duration_max_ms) == (1, 0, 0, 0)


def test_outcome_and_outcome_visibility_are_groupable_dimensions() -> None:
    events = (tool_completed(1), tool_failed(2), session_ended_unknown(3), session_started(4))

    by_outcome = {row.dimensions[0][1]: row.event_count for row in aggregate_outcomes(events, ("outcome",))}
    by_visibility = {
        row.dimensions[0][1]: row.event_count for row in aggregate_outcomes(events, ("outcome_visibility",))
    }

    assert by_outcome == {"failure": 1, "not_applicable": 1, "success": 1, "unknown": 1}
    assert by_visibility == {"not_applicable": 1, "observed": 2, "unknown": 1}


def provenance_event(dimension: str, visibility: str, other: str) -> Event:
    """One valid event whose ``dimension`` is ``visibility`` and whose others are ``other`` where its type allows."""
    if dimension == "subject":
        if visibility == "not_applicable":
            return make_event(
                1,
                eventType="session.ended",
                toolName=None,
                subjectVisibility=visibility,
                outcomeVisibility=other,
                durationVisibility=other,
            )
        named: dict[str, Any] = {"toolName": None} if visibility == "unknown" else {}
        return make_event(1, subjectVisibility=visibility, outcomeVisibility=other, durationVisibility=other, **named)
    if dimension == "outcome":
        if visibility == "not_applicable":
            return skill_invoked(1, "tdd", other)
        if visibility == "unknown":
            return session_ended_unknown(1, durationMs=9, durationVisibility=other)
        return make_event(1, outcomeVisibility=visibility, subjectVisibility=other, durationVisibility=other)
    if visibility == "not_applicable":
        return make_event(1, eventType="tool.started", subjectVisibility=other, **NO_OUTCOME)
    if visibility == "unknown":
        return make_event(
            1, durationMs=None, durationVisibility=visibility, subjectVisibility=other, outcomeVisibility=other
        )
    return make_event(1, durationMs=12, durationVisibility=visibility, subjectVisibility=other, outcomeVisibility=other)


@pytest.mark.parametrize(
    ("dimension", "visibility"),
    [
        pytest.param(dimension, visibility, id=f"{dimension}-{visibility}")
        for dimension in ("subject", "outcome", "duration")
        for visibility in ("observed", "derived", "unknown", "not_applicable")
    ],
)
def test_preserve_one_provenance_dimension_independently(dimension: str, visibility: str) -> None:
    other = "derived" if visibility == "observed" else "observed"
    event = provenance_event(dimension, visibility, other)
    [outcomes] = aggregate_outcomes((event,), ("harness",))

    if dimension == "subject":
        [usage] = aggregate_usage((event,), ("subject_visibility",))
        assert dims(usage) == [("subject_visibility", visibility)]
        assert usage.event_count == 1
        assert (usage.observed_subject_count, usage.derived_subject_count, usage.unknown_subject_count) == (
            int(visibility == "observed"),
            int(visibility == "derived"),
            int(visibility == "unknown"),
        )
    if dimension == "outcome":
        [labelled] = aggregate_outcomes((event,), ("outcome_visibility",))
        assert dims(labelled) == [("outcome_visibility", visibility)]
        assert (outcomes.observed_outcome_count, outcomes.derived_outcome_count, outcomes.unknown_outcome_count) == (
            int(visibility == "observed"),
            int(visibility == "derived"),
            int(visibility == "unknown"),
        )
    if dimension == "duration":
        sampled = visibility in {"observed", "derived"}
        assert outcomes.duration_sample_count == int(sampled)
        assert (outcomes.duration_total_ms, outcomes.duration_min_ms, outcomes.duration_max_ms) == (
            (event.duration_ms,) * 3 if sampled else (None, None, None)
        )
    assert outcomes.event_count == 1


def test_summaries_carry_their_closed_interpretation_and_group_order() -> None:
    world = world_with(tool_completed(1))

    usage = summarize_usage(world.runtime, {"--group-by": ("skill,harness",)})
    outcomes = summarize_outcomes(world.runtime, {"--group-by": ("tool",)})

    assert (usage.group_by, usage.interpretation) == (("skill", "harness"), USAGE_INTERPRETATION)
    assert (outcomes.group_by, outcomes.interpretation) == (("tool",), OUTCOMES_INTERPRETATION)
    assert USAGE_INTERPRETATION == "Operational usage only; unknown subject visibility is not zero usage."
    assert (
        OUTCOMES_INTERPRETATION == "Operational correlation only; this is not semantic quality or causal attribution."
    )


def test_summaries_apply_the_same_filters_window_and_expiry_as_the_queries() -> None:
    world = world_with(
        tool_completed(1, ago=timedelta(days=8)),
        tool_completed(2, ago=timedelta(days=1), harness="codex"),
        tool_completed(3, ago=timedelta(days=1)),
        tool_completed(4, ago=timedelta(days=31)),
    )

    default = summarize_usage(world.runtime, {"--group-by": ("harness",)})
    codex = summarize_usage(world.runtime, {"--group-by": ("harness",), "--harness": ("codex",)})
    everything = summarize_usage(world.runtime, {"--group-by": ("harness",), "--all-time": ()})

    assert [(row.dimensions[0][1], row.event_count) for row in default.rows] == [("claude_code", 1), ("codex", 1)]
    assert [(row.dimensions[0][1], row.event_count) for row in codex.rows] == [("codex", 1)]
    assert [(row.dimensions[0][1], row.event_count) for row in everything.rows] == [("claude_code", 2), ("codex", 1)]


def test_a_summary_reads_every_batch_of_the_stream(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(queries, "BATCH_SIZE", 2)
    world = world_with(
        *[tool_completed(number, ago=timedelta(minutes=number), duration=number) for number in range(1, 8)]
    )

    [row] = summarize_outcomes(world.runtime, {"--group-by": ("harness",)}).rows

    assert (row.event_count, row.duration_sample_count, row.duration_total_ms) == (7, 7, 28)
    assert world.events.reads == 4


def test_summaries_are_validated_before_storage_is_touched_and_need_an_initialized_store() -> None:
    world = world_with(initialized=False)

    assert refusal(summarize_usage, world.runtime, {"--group-by": ("nope",)}).code == "ferret.args.invalid"
    assert refusal(summarize_outcomes, world.runtime, {"--group-by": ("harness",), "--harness": ("Bad",)}).code == (
        "ferret.filter.invalid"
    )
    assert world.files.touched == []
    assert refusal(summarize_usage, world.runtime, {"--group-by": ("harness",)}).code == "ferret.storage.uninitialized"
    assert world.events.reads == 0


USAGE_JSON = (
    '{"schemaVersion":1,"command":"usage","exitCode":0,"groupBy":["harness","skill"],"rows":[{"dimensions":'
    '[{"name":"harness","value":"claude_code"},{"name":"skill","value":null}],"eventCount":2,'
    '"observedSubjectCount":0,"derivedSubjectCount":0,"unknownSubjectCount":2}],'
    '"interpretation":"Operational usage only; unknown subject visibility is not zero usage."}\n'
)


def test_usage_json_is_the_frozen_contract_shape() -> None:
    world = world_with(skill_invoked(1, None, "unknown"), skill_invoked(2, None, "unknown"))

    assert run_cli(world, ["usage", "--group-by", "harness,skill", "--json"]) == (0, USAGE_JSON, "")


def test_usage_text_is_a_tab_separated_table_of_the_same_rows() -> None:
    world = world_with(skill_invoked(1, None, "unknown"), skill_invoked(2, None, "unknown"))

    code, out, err = run_cli(world, ["usage", "--group-by", "harness,skill"])

    assert (code, err) == (0, "")
    assert out == (
        "harness\tskill\teventCount\tobservedSubjectCount\tderivedSubjectCount\tunknownSubjectCount\n"
        "claude_code\t-\t2\t0\t0\t2\n"
    )


def test_outcomes_json_is_the_frozen_contract_shape() -> None:
    world = world_with(tool_completed(1, duration=10), tool_completed(2, duration=27), tool_failed(3, duration=None))

    code, out, err = run_cli(world, ["outcomes", "--group-by", "harness,tool", "--json"])

    assert (code, err) == (0, "")
    assert out == (
        '{"schemaVersion":1,"command":"outcomes","exitCode":0,"groupBy":["harness","tool"],"rows":[{"dimensions":'
        '[{"name":"harness","value":"claude_code"},{"name":"tool","value":"Read"}],"eventCount":3,'
        '"successCount":2,"failureCount":1,"cancelledCount":0,"unknownOutcomeCount":0,"observedOutcomeCount":3,'
        '"derivedOutcomeCount":0,"durationSampleCount":2,"durationTotalMs":37,"durationMinMs":10,'
        '"durationMaxMs":27}],"interpretation":"Operational correlation only; this is not semantic quality or '
        'causal attribution."}\n'
    )


def test_outcomes_json_has_null_duration_statistics_when_nothing_was_sampled() -> None:
    world = world_with(session_ended_unknown(1))

    code, out, err = run_cli(world, ["outcomes", "--group-by", "harness", "--json"])

    [row] = json.loads(out)["rows"]
    assert (code, err) == (0, "")
    assert [row[key] for key in ("durationSampleCount", "durationTotalMs", "durationMinMs", "durationMaxMs")] == [
        0,
        None,
        None,
        None,
    ]
    assert row["unknownOutcomeCount"] == 1


def test_outcomes_text_uses_the_json_metric_names_and_dashes_for_null() -> None:
    world = world_with(session_ended_unknown(1))

    code, out, err = run_cli(world, ["outcomes", "--group-by", "harness"])

    assert (code, err) == (0, "")
    assert out == (
        "harness\teventCount\tsuccessCount\tfailureCount\tcancelledCount\tunknownOutcomeCount\t"
        "observedOutcomeCount\tderivedOutcomeCount\tdurationSampleCount\tdurationTotalMs\tdurationMinMs\t"
        "durationMaxMs\n"
        "claude_code\t1\t0\t0\t0\t1\t0\t0\t0\t-\t-\t-\n"
    )


@pytest.mark.parametrize("command", ["usage", "outcomes"])
def test_an_empty_result_is_empty_rows_in_json_and_no_rows_on_stderr_in_text(command: str) -> None:
    world = world_with()

    assert run_cli(world, [command, "--group-by", "harness"]) == (1, "", "No rows.\n")
    code, out, err = run_cli(world, [command, "--group-by", "harness", "--json"])

    assert (code, err, json.loads(out)["rows"]) == (1, "", [])


@pytest.mark.parametrize("command", ["usage", "outcomes"])
def test_an_invalid_group_by_or_filter_writes_only_a_closed_error(command: str) -> None:
    world = world_with(tool_completed(1))

    code, out, err = run_cli(world, [command, "--group-by", "workspace", "--json"])
    assert (code, out) == (2, "")
    assert json.loads(err) == {
        "schemaVersion": 1,
        "command": command,
        "exitCode": 2,
        "error": {
            "code": "ferret.args.invalid",
            "message": "unrecognized or incomplete arguments; run 'ferret --help' for usage",
            "field": None,
            "retryable": False,
        },
    }
    assert run_cli(world, [command, "--group-by", "harness", "--harness", "Bad"]) == (
        2,
        "",
        "FERRET error [ferret.filter.invalid]: a filter value is not valid\n",
    )


def test_the_help_of_each_summary_says_what_it_does_not_claim() -> None:
    usage = " ".join(COMMAND_HELP[("usage",)].split())
    outcomes = " ".join(COMMAND_HELP[("outcomes",)].split())

    assert "never substitute zero for unknown data" in usage
    assert "not a semantic quality or causal evaluation" in outcomes
    assert "never as success" in outcomes
