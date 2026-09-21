"""Usage and outcome summaries over a real database, checked against an independent SQL recount."""

import json
import sqlite3
from contextlib import closing
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from ferret.application import queries
from ferret.domain.timestamps import format_timestamp
from support.machine import Machine, make_machine
from support.populate import WORKSPACE_B, make_event, mixed_events

COLUMNS = {
    "harness": "harness",
    "event_type": "event_type",
    "agent": "agent_name",
    "skill": "skill_name",
    "tool": "tool_name",
    "subject_visibility": "subject_visibility",
    "outcome": "outcome",
    "outcome_visibility": "outcome_visibility",
}
USAGE_NAMES = ("eventCount", "observedSubjectCount", "derivedSubjectCount", "unknownSubjectCount")
USAGE_SQL = (
    "COUNT(*)",
    "SUM(subject_visibility = 'observed')",
    "SUM(subject_visibility = 'derived')",
    "SUM(subject_visibility = 'unknown')",
)
OUTCOME_NAMES = (
    "eventCount",
    "successCount",
    "failureCount",
    "cancelledCount",
    "unknownOutcomeCount",
    "observedOutcomeCount",
    "derivedOutcomeCount",
    "durationSampleCount",
    "durationTotalMs",
    "durationMinMs",
    "durationMaxMs",
)
OUTCOME_SQL = (
    "COUNT(*)",
    "SUM(outcome = 'success')",
    "SUM(outcome = 'failure')",
    "SUM(outcome = 'cancelled')",
    "SUM(outcome_visibility = 'unknown')",
    "SUM(outcome_visibility = 'observed')",
    "SUM(outcome_visibility = 'derived')",
    "COUNT(duration_ms)",
    "SUM(duration_ms)",
    "MIN(duration_ms)",
    "MAX(duration_ms)",
)
METRICS = {"usage": (USAGE_NAMES, USAGE_SQL), "outcomes": (OUTCOME_NAMES, OUTCOME_SQL)}

USAGE_GROUPS = [
    ("harness",),
    ("event_type", "tool"),
    ("skill", "harness"),
    ("agent", "subject_visibility", "harness"),
    ("subject_visibility",),
    ("tool", "skill", "agent"),
]
OUTCOME_GROUPS = [
    ("harness",),
    ("outcome",),
    ("outcome_visibility", "event_type"),
    ("tool", "outcome", "harness"),
    ("agent", "skill", "tool"),
]


@pytest.fixture
def machine(tmp_path: Path) -> Machine:
    machine = make_machine(tmp_path)
    machine.fill(mixed_events(datetime.now(UTC)))
    return machine


def recount(
    machine: Machine,
    command: str,
    group_by: tuple[str, ...],
    *,
    where: str = "1 = 1",
    parameters: tuple[str, ...] = (),
) -> list[tuple[Any, ...]]:
    """The rows ``command`` must return, computed by one SQL ``GROUP BY`` that shares no code with the CLI."""
    _, metrics = METRICS[command]
    columns = [COLUMNS[name] for name in group_by]
    ordering = ", ".join(f"{column} IS NULL, {column}" for column in columns)
    statement = (
        f"SELECT {', '.join(columns)}, {', '.join(metrics)} FROM event"
        f" WHERE expires_at > ? AND {where} GROUP BY {', '.join(columns)} ORDER BY {ordering}"
    )
    with closing(sqlite3.connect(machine.data_home / "ferret.sqlite3")) as connection:
        return [tuple(row) for row in connection.execute(statement, (format_timestamp(datetime.now(UTC)), *parameters))]


def summary(machine: Machine, command: str, group_by: tuple[str, ...], *arguments: str) -> list[tuple[Any, ...]]:
    ran = machine.run([command, "--group-by", ",".join(group_by), "--json", *arguments])
    assert (ran.code, ran.stderr) == (0, "")
    document = json.loads(ran.stdout)
    names, _ = METRICS[command]
    assert document["groupBy"] == list(group_by)
    return [
        (*(dimension["value"] for dimension in row["dimensions"]), *(row[name] for name in names))
        for row in document["rows"]
    ]


@pytest.mark.parametrize("group_by", USAGE_GROUPS, ids=["+".join(group) for group in USAGE_GROUPS])
def test_usage_equals_an_independent_recount_including_null_dimensions(
    machine: Machine, group_by: tuple[str, ...]
) -> None:
    rows = summary(machine, "usage", group_by, "--all-time")

    assert rows == recount(machine, "usage", group_by)
    assert len(rows) > 1


@pytest.mark.parametrize("group_by", OUTCOME_GROUPS, ids=["+".join(group) for group in OUTCOME_GROUPS])
def test_outcomes_equal_an_independent_recount_including_null_durations(
    machine: Machine, group_by: tuple[str, ...]
) -> None:
    rows = summary(machine, "outcomes", group_by, "--all-time")

    assert rows == recount(machine, "outcomes", group_by)
    assert len(rows) > 1


def test_a_summary_with_filters_counts_only_the_matching_events(machine: Machine) -> None:
    filters = ("--all-time", "--harness", "codex", "--workspace", WORKSPACE_B)

    usage = summary(machine, "usage", ("event_type", "subject_visibility"), *filters)
    outcomes = summary(machine, "outcomes", ("outcome",), *filters)

    where = "harness = 'codex' AND workspace_id = ?"
    assert usage == recount(
        machine, "usage", ("event_type", "subject_visibility"), where=where, parameters=(WORKSPACE_B,)
    )
    assert outcomes == recount(machine, "outcomes", ("outcome",), where=where, parameters=(WORKSPACE_B,))
    assert len(usage) > 1
    assert len(outcomes) > 1


def test_the_default_window_is_the_seven_days_ending_now(tmp_path: Path) -> None:
    machine = make_machine(tmp_path)
    now = datetime.now(UTC)
    machine.fill([*mixed_events(now), make_event(103, ago=timedelta(days=8), now=now)])

    default = summary(machine, "usage", ("harness",))
    everything = summary(machine, "usage", ("harness",), "--all-time")

    assert sum(row[1] for row in default) == 60
    assert sum(row[1] for row in everything) == 62


@pytest.mark.parametrize("command", ["usage", "outcomes"])
def test_every_batch_of_a_multi_batch_stream_is_counted_once(
    machine: Machine, monkeypatch: pytest.MonkeyPatch, command: str
) -> None:
    group_by = ("harness", "event_type", "tool")
    expected = recount(machine, command, group_by)
    monkeypatch.setattr(queries, "BATCH_SIZE", 7)

    assert summary(machine, command, group_by, "--all-time") == expected
    assert sum(row[len(group_by)] for row in expected) == 61


def test_text_and_json_summaries_carry_the_same_numbers(machine: Machine) -> None:
    machine_rows = summary(machine, "outcomes", ("harness", "outcome"), "--all-time")

    text = machine.run(["outcomes", "--group-by", "harness,outcome", "--all-time"])

    assert (text.code, text.stderr) == (0, "")
    lines = [line.split("\t") for line in text.stdout.splitlines()]
    assert lines[0][:2] == ["harness", "outcome"]
    assert [
        (line[0], line[1], *(None if cell == "-" else int(cell) for cell in line[2:])) for line in lines[1:]
    ] == machine_rows
