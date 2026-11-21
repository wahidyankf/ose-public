"""Integration checks for the query scenarios that page results, refuse bad cursors and filters, and bound the window.

Each test runs the command line over a real temporary home and SQLite database, with the real clock. Events are built
relative to that clock, so the default window, the bounds, and --all-time are decided by production code alone.
"""

import json
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest

from support.invoke import Ran
from support.machine import make_machine
from support.populate import NO_OUTCOME, make_event, stamp


def listed(ran: Ran) -> dict[str, Any]:
    """The JSON document a successful command wrote, with nothing on stderr."""
    assert ran.stderr == ""
    return json.loads(ran.stdout)


def error_code(ran: Ran) -> str:
    """The closed failure code of a refused command, which writes nothing to stdout."""
    assert ran.stdout == ""
    return json.loads(ran.stderr)["error"]["code"]


def ids(items: list[dict[str, Any]]) -> list[int]:
    """The test-assigned numbers of events, read back from their event IDs."""
    return [int(item["eventId"][-12:]) for item in items]


def event_id(number: int) -> str:
    return f"00000000-0000-4000-8000-{number:012d}"


@pytest.fixture
def now() -> datetime:
    return datetime.now(UTC).replace(microsecond=0)


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: events list pages results with --limit and --cursor
def test_events_list_pages_results_with_limit_and_cursor(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill([make_event(number, ago=timedelta(minutes=number), now=now) for number in range(1, 6)])
    # A cursor names its query's window, and a default window moves with the clock, so paging runs over all time.
    paged = ["events", "list", "--json", "--limit", "2", "--all-time"]
    first = listed(machine.run(paged))
    second = listed(machine.run([*paged, "--cursor", first["nextCursor"]]))
    last = listed(machine.run([*paged, "--cursor", second["nextCursor"]]))
    assert ids(first["items"]) == [1, 2]
    assert ids(second["items"]) == [3, 4]
    assert ids(last["items"]) == [5]
    assert (first["nextCursor"] is not None, last["nextCursor"]) == (True, None)
    for size in ("0", "201"):
        refused = machine.run(["events", "list", "--json", "--limit", size])
        assert (refused.code, error_code(refused)) == (2, "ferret.args.invalid")


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: A bad cursor reports ferret.cursor.invalid
def test_a_cursor_this_query_did_not_issue_reports_cursor_invalid(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill([make_event(number, ago=timedelta(minutes=number), now=now) for number in range(1, 4)])
    first = listed(machine.run(["events", "list", "--json", "--limit", "1"]))
    ran = machine.run(["events", "list", "--json", "--harness", "codex", "--cursor", first["nextCursor"]])
    assert (ran.code, error_code(ran)) == (2, "ferret.cursor.invalid")


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: An empty query result exits 1 for <command>
@pytest.mark.parametrize(
    "arguments",
    [["events", "list"], ["usage", "--group-by", "harness"], ["outcomes", "--group-by", "harness"]],
    ids=["events-list", "usage", "outcomes"],
)
def test_an_empty_query_result_exits_1(tmp_path: Path, arguments: list[str]) -> None:
    ran = make_machine(tmp_path).run(arguments)
    assert (ran.code, ran.stdout, ran.stderr) == (1, "", "No rows.\n")


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: A bad filter value reports ferret.filter.invalid
def test_a_bad_filter_value_reports_filter_invalid(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill([make_event(1, ago=timedelta(minutes=1), now=now)])
    ran = machine.run(["events", "list", "--json", "--harness", "Bad"])
    assert (ran.code, error_code(ran)) == (2, "ferret.filter.invalid")


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: events list, events export, usage, and outcomes filter by agent, skill, and tool
def test_every_query_filters_by_agent_skill_and_tool(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill(
        [
            make_event(
                1,
                ago=timedelta(minutes=1),
                now=now,
                eventType="agent.ended",
                agentName="reviewer",
                toolName=None,
                outcome="cancelled",
            ),
            make_event(
                2,
                ago=timedelta(minutes=2),
                now=now,
                eventType="skill.invoked",
                skillName="tdd",
                toolName=None,
                **NO_OUTCOME,
            ),
            make_event(
                3, ago=timedelta(minutes=3), now=now, eventType="tool.failed", toolName="Write", outcome="failure"
            ),
        ]
    )
    for option, value, number in (("--agent", "reviewer", 1), ("--skill", "tdd", 2), ("--tool", "Write", 3)):
        assert ids(listed(machine.run(["events", "list", "--json", option, value]))["items"]) == [number]
        export = machine.run(["events", "export", "--format", "jsonl", option, value])
        assert (export.code, export.stderr, export.stdout.count("\n")) == (0, "", 1)
        assert json.loads(export.stdout)["eventId"] == event_id(number)
        for command in ("usage", "outcomes"):
            summary = listed(machine.run([command, "--group-by", "harness", option, value, "--json"]))
            assert sum(row["eventCount"] for row in summary["rows"]) == 1


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: The default window is the last seven days
def test_the_default_window_is_the_last_seven_days(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill([make_event(1, ago=timedelta(days=8), now=now), make_event(2, ago=timedelta(days=2), now=now)])
    assert ids(listed(machine.run(["events", "list", "--json"]))["items"]) == [2]


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: --from and --to bound the window
def test_from_and_to_bound_the_window(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill(
        [
            make_event(1, ago=timedelta(days=3), now=now),
            make_event(2, ago=timedelta(hours=44), now=now),
            make_event(3, ago=timedelta(hours=1), now=now),
        ]
    )
    lower, upper = stamp(now - timedelta(days=2)), stamp(now - timedelta(days=1))
    bounded = machine.run(["events", "list", "--json", "--from", lower, "--to", upper])
    assert ids(listed(bounded)["items"]) == [2]


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: --all-time ignores the seven-day window
def test_all_time_ignores_the_seven_day_window(tmp_path: Path, now: datetime) -> None:
    machine = make_machine(tmp_path)
    machine.fill([make_event(1, ago=timedelta(days=20), now=now), make_event(2, ago=timedelta(days=2), now=now)])
    assert ids(listed(machine.run(["events", "list", "--json"]))["items"]) == [2]
    assert ids(listed(machine.run(["events", "list", "--json", "--all-time"]))["items"]) == [2, 1]
