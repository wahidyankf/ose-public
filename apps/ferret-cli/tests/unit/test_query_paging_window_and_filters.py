"""Unit checks for the query scenarios that page results, refuse bad cursors and filters, and bound the time window.

Each test runs the real command line in process over the fake machine, so every query, filter, and window decision is
production code, and the fake store only supplies events.
"""

import json
from datetime import timedelta
from typing import Any

import pytest

from support.invoke import Ran, run_cli
from support.populate import NO_OUTCOME, make_event, world_with

NO_ROWS = "No rows.\n"


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


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: events list pages results with --limit and --cursor
def test_events_list_pages_results_with_limit_and_cursor() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 6)])
    paged = ["events", "list", "--json", "--limit", "2", "--all-time"]
    first = listed(run_cli(world, paged))
    second = listed(run_cli(world, [*paged, "--cursor", first["nextCursor"]]))
    last = listed(run_cli(world, [*paged, "--cursor", second["nextCursor"]]))
    assert ids(first["items"]) == [1, 2]
    assert ids(second["items"]) == [3, 4]
    assert ids(last["items"]) == [5]
    assert (first["nextCursor"] is not None, last["nextCursor"]) == (True, None)
    # The page size is one through 200: both ends of the range are refused with the closed argument failure.
    for size in ("0", "201"):
        refused = run_cli(world, ["events", "list", "--json", "--limit", size])
        assert (refused.code, error_code(refused)) == (2, "ferret.args.invalid")


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: A bad cursor reports ferret.cursor.invalid
def test_a_cursor_this_query_did_not_issue_reports_cursor_invalid() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 4)])
    first = listed(run_cli(world, ["events", "list", "--json", "--limit", "1", "--all-time"]))
    # The cursor was issued for an unfiltered query, so resuming it under a harness filter is not its query.
    filtered = ["events", "list", "--json", "--limit", "1", "--all-time", "--harness", "codex"]
    ran = run_cli(world, [*filtered, "--cursor", first["nextCursor"]])
    assert (ran.code, error_code(ran)) == (2, "ferret.cursor.invalid")


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: An empty query result exits 1 for <command>
@pytest.mark.parametrize(
    "arguments",
    [["events", "list"], ["usage", "--group-by", "harness"], ["outcomes", "--group-by", "harness"]],
    ids=["events-list", "usage", "outcomes"],
)
def test_an_empty_query_result_exits_1(arguments: list[str]) -> None:
    ran = run_cli(world_with(), arguments)
    assert (ran.code, ran.stdout, ran.stderr) == (1, "", NO_ROWS)


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: A bad filter value reports ferret.filter.invalid
def test_a_bad_filter_value_reports_filter_invalid() -> None:
    world = world_with(make_event(1, ago=timedelta(minutes=1)))
    ran = run_cli(world, ["events", "list", "--json", "--harness", "Bad"])
    assert (ran.code, error_code(ran)) == (2, "ferret.filter.invalid")
    # The refusal came from the arguments, so the store was never read.
    assert world.events.reads == 0


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: events list, events export, usage, and outcomes filter by agent, skill, and tool
def test_every_query_filters_by_agent_skill_and_tool() -> None:
    world = world_with(
        make_event(
            1,
            ago=timedelta(minutes=1),
            eventType="agent.ended",
            agentName="reviewer",
            toolName=None,
            outcome="cancelled",
        ),
        make_event(
            2, ago=timedelta(minutes=2), eventType="skill.invoked", skillName="tdd", toolName=None, **NO_OUTCOME
        ),
        make_event(3, ago=timedelta(minutes=3), eventType="tool.failed", toolName="Write", outcome="failure"),
    )
    for option, value, number in (("--agent", "reviewer", 1), ("--skill", "tdd", 2), ("--tool", "Write", 3)):
        assert ids(listed(run_cli(world, ["events", "list", "--json", option, value]))["items"]) == [number]
        export = run_cli(world, ["events", "export", "--format", "jsonl", option, value])
        assert (export.code, export.stderr, export.stdout.count("\n")) == (0, "", 1)
        assert json.loads(export.stdout)["eventId"] == event_id(number)
        for command in ("usage", "outcomes"):
            summary = listed(run_cli(world, [command, "--group-by", "harness", option, value, "--json"]))
            assert sum(row["eventCount"] for row in summary["rows"]) == 1


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: The default window is the last seven days
def test_the_default_window_is_the_last_seven_days() -> None:
    world = world_with(make_event(1, ago=timedelta(days=8)), make_event(2, ago=timedelta(days=2)))
    assert ids(listed(run_cli(world, ["events", "list", "--json"]))["items"]) == [2]


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: --from and --to bound the window
def test_from_and_to_bound_the_window() -> None:
    # The fake clock reads 2026-09-18T08:00Z, so these are a day, a middle day, and an hour before it.
    world = world_with(
        make_event(1, ago=timedelta(days=3)),
        make_event(2, ago=timedelta(days=1, hours=20)),
        make_event(3, ago=timedelta(hours=1)),
    )
    bounded = run_cli(
        world, ["events", "list", "--json", "--from", "2026-09-16T00:00:00Z", "--to", "2026-09-17T00:00:00Z"]
    )
    assert ids(listed(bounded)["items"]) == [2]


# @scenario specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature: --all-time ignores the seven-day window
def test_all_time_ignores_the_seven_day_window() -> None:
    world = world_with(make_event(1, ago=timedelta(days=20)), make_event(2, ago=timedelta(days=2)))
    assert ids(listed(run_cli(world, ["events", "list", "--json"]))["items"]) == [2]
    assert ids(listed(run_cli(world, ["events", "list", "--json", "--all-time"]))["items"]) == [2, 1]
