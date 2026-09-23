"""Reading events back: closed filters, the keyset cursor, stable ordering, and a lazily streamed export."""

import base64
import hashlib
import io
import json
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from ferret import cli
from ferret.application import queries
from ferret.application.queries import export_events, list_events
from ferret.commands import build_handlers
from ferret.domain.errors import FerretError
from ferret.domain.query import (
    DEFAULT_LIMIT,
    MAX_LIMIT,
    Position,
    criteria_from_options,
    decode_cursor,
    encode_cursor,
    filter_digest,
    parse_limit,
)
from support.fakes import FIXED_NOW
from support.invoke import run_cli
from support.populate import WORKSPACE_A, WORKSPACE_B, make_event, numbers, stamp, world_with

Options = Mapping[str, tuple[str, ...]]

VECTOR_NOW = datetime(2026, 9, 18, 8, 15, 30, 130_000, tzinfo=UTC)
VECTOR_DIGEST = "4a6316b0c1bfc5fe97b3ee7992eef191d2b2774a0d5426dbe2f58ec3b74d8481"
VECTOR_DIGEST_INPUT = (
    '{"from":"2026-09-11T08:15:30.130Z","to":"2026-09-18T08:15:30.130Z","harness":null,"workspace":null,'
    '"eventType":null,"agent":null,"skill":null,"tool":null,"outcome":null,"limit":100}'
)
VECTOR_POSITION = Position("2026-09-18T08:15:30.123Z", "00000000-0000-4000-8000-000000000001")
VECTOR_CURSOR = (
    "eyJ2ZXJzaW9uIjoxLCJvY2N1cnJlZEF0IjoiMjAyNi0wOS0xOFQwODoxNTozMC4xMjNaIiwiZXZlbnRJZCI6IjAwMDAwMDAwLTAwMDAtNDAwMC04"
    "MDAwLTAwMDAwMDAwMDAwMSIsImZpbHRlckRpZ2VzdCI6IjRhNjMxNmIwYzFiZmM1ZmU5N2IzZWU3OTkyZWVmMTkxZDJiMjc3NGEwZDU0MjZkYmUy"
    "ZjU4ZWMzYjc0ZDg0ODEifQ"
)


def refusal(action: Any, *arguments: Any, **keywords: Any) -> FerretError:
    with pytest.raises(FerretError) as caught:
        action(*arguments, **keywords)
    return caught.value


def oracle_digest(document: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def test_the_fixed_default_filter_digest_and_cursor() -> None:
    criteria = criteria_from_options({}, now=VECTOR_NOW)

    assert (criteria.start, criteria.end) == ("2026-09-11T08:15:30.130Z", "2026-09-18T08:15:30.130Z")
    assert hashlib.sha256(VECTOR_DIGEST_INPUT.encode()).hexdigest() == VECTOR_DIGEST
    assert filter_digest(criteria, DEFAULT_LIMIT) == VECTOR_DIGEST
    assert encode_cursor(VECTOR_POSITION, VECTOR_DIGEST) == VECTOR_CURSOR
    assert decode_cursor(VECTOR_CURSOR, VECTOR_DIGEST) == VECTOR_POSITION


def test_the_digest_covers_every_filter_and_the_limit_in_the_fixed_order() -> None:
    options: Options = {
        "--from": ("2026-09-10T00:00:00.000Z",),
        "--to": ("2026-09-12T00:00:00.000Z",),
        "--harness": ("codex",),
        "--workspace": (WORKSPACE_A,),
        "--event-type": ("tool.failed",),
        "--agent": ("reviewer",),
        "--skill": ("tdd",),
        "--tool": ("mcp/Read",),
        "--outcome": ("failure",),
    }
    expected = oracle_digest(
        {
            "from": "2026-09-10T00:00:00.000Z",
            "to": "2026-09-12T00:00:00.000Z",
            "harness": "codex",
            "workspace": WORKSPACE_A,
            "eventType": "tool.failed",
            "agent": "reviewer",
            "skill": "tdd",
            "tool": "mcp/Read",
            "outcome": "failure",
            "limit": 25,
        }
    )

    assert filter_digest(criteria_from_options(options, now=VECTOR_NOW), 25) == expected


def test_an_all_time_query_has_null_bounds_in_its_digest() -> None:
    criteria = criteria_from_options({"--all-time": ()}, now=VECTOR_NOW)

    assert (criteria.start, criteria.end) == (None, None)
    assert filter_digest(criteria, 10) == oracle_digest(
        {
            "from": None,
            "to": None,
            "harness": None,
            "workspace": None,
            "eventType": None,
            "agent": None,
            "skill": None,
            "tool": None,
            "outcome": None,
            "limit": 10,
        }
    )


@pytest.mark.parametrize(
    ("options", "start", "end"),
    [
        pytest.param({}, "2026-09-11T08:15:30.130Z", "2026-09-18T08:15:30.130Z", id="default-seven-days-to-now"),
        pytest.param(
            {"--from": ("2026-09-15T00:00:00.000Z",)},
            "2026-09-15T00:00:00.000Z",
            "2026-09-18T08:15:30.130Z",
            id="from-alone-ends-now",
        ),
        pytest.param(
            {"--to": ("2026-09-15T00:00:00.000Z",)},
            "2026-09-08T00:00:00.000Z",
            "2026-09-15T00:00:00.000Z",
            id="to-alone-starts-seven-days-earlier",
        ),
        pytest.param(
            {"--from": ("2026-09-01T00:00:00.000Z",), "--to": ("2026-09-02T00:00:00.000Z",)},
            "2026-09-01T00:00:00.000Z",
            "2026-09-02T00:00:00.000Z",
            id="both-bounds",
        ),
        pytest.param({"--all-time": ()}, None, None, id="all-time"),
        pytest.param(
            {"--from": ("2026-09-18T10:00:00+02:00",)},
            "2026-09-18T08:00:00.000Z",
            "2026-09-18T08:15:30.130Z",
            id="offset-is-normalized-to-utc",
        ),
        pytest.param(
            {"--from": ("2026-09-18T07:00:00.5z",), "--to": ("2026-09-18T07:00:01.123999999Z",)},
            "2026-09-18T07:00:00.500Z",
            "2026-09-18T07:00:01.123Z",
            id="fraction-is-normalized-to-milliseconds-without-rounding",
        ),
        pytest.param(
            {"--from": ("2026-09-18t01:00:00-05:30",)},
            "2026-09-18T06:30:00.000Z",
            "2026-09-18T08:15:30.130Z",
            id="lowercase-separator-and-negative-offset",
        ),
    ],
)
def test_the_time_window_follows_the_default_and_bound_rules(
    options: Options, start: str | None, end: str | None
) -> None:
    criteria = criteria_from_options(options, now=VECTOR_NOW)

    assert (criteria.start, criteria.end) == (start, end)


@pytest.mark.parametrize(
    "options",
    [
        pytest.param(
            {"--from": ("2026-09-02T00:00:00.000Z",), "--to": ("2026-09-02T00:00:00.000Z",)}, id="empty-window"
        ),
        pytest.param({"--from": ("2026-09-03T00:00:00.000Z",), "--to": ("2026-09-02T00:00:00.000Z",)}, id="inverted"),
        pytest.param({"--from": ("2026-09-19T00:00:00.000Z",)}, id="from-after-the-implied-end"),
        pytest.param({"--all-time": (), "--from": ("2026-09-01T00:00:00.000Z",)}, id="all-time-with-from"),
        pytest.param({"--all-time": (), "--to": ("2026-09-01T00:00:00.000Z",)}, id="all-time-with-to"),
        pytest.param({"--harness": ("codex", "opencode")}, id="repeated-harness"),
        pytest.param({"--from": ("2026-09-01T00:00:00.000Z", "2026-09-02T00:00:00.000Z")}, id="repeated-from"),
        pytest.param({"--from": ("2026-09-18",)}, id="date-only"),
        pytest.param({"--from": ("2026-09-18T08:00:00",)}, id="no-zone"),
        pytest.param({"--from": ("2026-09-18T08:00:00+0200",)}, id="offset-without-colon"),
        pytest.param({"--from": ("2026-09-18T08:00:00.Z",)}, id="empty-fraction"),
        pytest.param({"--from": ("2026-09-18T08:00:00.1234567890Z",)}, id="ten-fraction-digits"),
        pytest.param({"--from": ("2026-13-18T08:00:00.000Z",)}, id="month-thirteen"),
        pytest.param({"--from": ("2026-02-30T08:00:00.000Z",)}, id="february-thirtieth"),
        pytest.param({"--from": ("2026-09-18T24:00:00.000Z",)}, id="hour-twenty-four"),
        pytest.param({"--from": ("2026-09-18T08:00:60.000Z",)}, id="leap-second"),
        pytest.param({"--from": ("2026-09-18T08:00:00+24:00",)}, id="offset-out-of-range"),
        pytest.param({"--from": ("\uff12\uff10\uff12\uff16-09-18T08:00:00.000Z",)}, id="fullwidth-digits"),
        pytest.param({"--from": ("",)}, id="empty-timestamp"),
        pytest.param({"--harness": ("Codex",)}, id="uppercase-harness"),
        pytest.param({"--harness": ("",)}, id="empty-harness"),
        pytest.param({"--workspace": ("ws_ABC",)}, id="short-workspace"),
        pytest.param({"--workspace": ("/users/example/repo",)}, id="raw-workspace-path"),
        pytest.param({"--event-type": ("tool.exploded",)}, id="unknown-event-type"),
        pytest.param({"--outcome": ("great",)}, id="unknown-outcome"),
        pytest.param({"--agent": ("a" * 129,)}, id="overlong-agent"),
        pytest.param({"--skill": ("../etc",)}, id="path-like-skill"),
        pytest.param({"--tool": ("a/../b",)}, id="dot-dot-tool-segment"),
        pytest.param({"--tool": ("C:/temp",)}, id="drive-letter-tool"),
        pytest.param({"--agent": ("two words",)}, id="whitespace-agent"),
        pytest.param({"--agent": ("line\nbreak",)}, id="line-break-agent"),
    ],
)
def test_a_malformed_filter_is_invalid_filter_without_echoing_its_value(options: Options) -> None:
    error = refusal(criteria_from_options, options, now=VECTOR_NOW)

    assert (error.code, error.exit_code, error.field, error.retryable) == ("ferret.filter.invalid", 2, None, False)
    assert all(value not in str(error) for values in options.values() for value in values if value)


def test_a_name_filter_is_matched_in_its_normalized_form() -> None:
    composed = "Caf\u00e9"
    decomposed = "Cafe\u0301"

    criteria = criteria_from_options({"--tool": (decomposed,)}, now=VECTOR_NOW)

    assert criteria.tool == composed


def test_every_closed_event_type_and_outcome_is_an_accepted_filter() -> None:
    for event_type in ("session.started", "tool.failed", "skill.invoked"):
        assert criteria_from_options({"--event-type": (event_type,)}, now=VECTOR_NOW).event_type == event_type
    for outcome in ("success", "failure", "cancelled", "unknown", "not_applicable"):
        assert criteria_from_options({"--outcome": (outcome,)}, now=VECTOR_NOW).outcome == outcome


@pytest.mark.parametrize(
    ("options", "expected"),
    [
        pytest.param({}, DEFAULT_LIMIT, id="default"),
        pytest.param({"--limit": ("1",)}, 1, id="minimum"),
        pytest.param({"--limit": ("200",)}, MAX_LIMIT, id="maximum"),
        pytest.param({"--limit": ("37",)}, 37, id="middle"),
    ],
)
def test_the_page_size_defaults_to_one_hundred_and_accepts_one_through_two_hundred(
    options: Options, expected: int
) -> None:
    assert parse_limit(options) == expected


@pytest.mark.parametrize(
    "value",
    ["0", "201", "-1", "1.5", "abc", "", " 5", "5 ", "+5", "\u0661\u0662", "1e2", "0x10"],
)
def test_a_page_size_outside_the_range_is_invalid_arguments(value: str) -> None:
    error = refusal(parse_limit, {"--limit": (value,)})

    assert (error.code, error.exit_code, error.field) == ("ferret.args.invalid", 2, None)


def test_a_repeated_page_size_is_invalid_arguments() -> None:
    assert refusal(parse_limit, {"--limit": ("5", "6")}).code == "ferret.args.invalid"


@pytest.mark.parametrize(
    "cursor",
    [
        pytest.param("", id="empty"),
        pytest.param(VECTOR_CURSOR + "=", id="padded"),
        pytest.param(VECTOR_CURSOR + "\n", id="trailing-newline"),
        pytest.param(" " + VECTOR_CURSOR, id="leading-space"),
        pytest.param(VECTOR_CURSOR.replace("-", "+").replace("_", "/") + "!", id="outside-the-alphabet"),
        pytest.param(VECTOR_CURSOR[:-1] + "R", id="non-canonical-trailing-bits"),
        pytest.param(VECTOR_CURSOR[:-4], id="truncated"),
        pytest.param(base64.urlsafe_b64encode(b"not json").rstrip(b"=").decode(), id="not-json"),
        pytest.param(base64.urlsafe_b64encode(b"[]").rstrip(b"=").decode(), id="not-an-object"),
        pytest.param(base64.urlsafe_b64encode(b"\xff\xfe").rstrip(b"=").decode(), id="not-utf-8"),
    ],
)
def test_a_cursor_that_does_not_decode_is_invalid_cursor(cursor: str) -> None:
    error = refusal(decode_cursor, cursor, VECTOR_DIGEST)

    assert (error.code, error.exit_code, error.field, error.retryable) == ("ferret.cursor.invalid", 2, None, False)
    assert cursor not in str(error) or cursor == ""


def encoded(document: str) -> str:
    return base64.urlsafe_b64encode(document.encode()).rstrip(b"=").decode()


CURSOR_PARTS = (
    '"version":1,"occurredAt":"2026-09-18T08:15:30.123Z","eventId":"00000000-0000-4000-8000-000000000001",'
    f'"filterDigest":"{VECTOR_DIGEST}"'
)


@pytest.mark.parametrize(
    "document",
    [
        pytest.param("{" + CURSOR_PARTS + ', "extra":1}', id="extra-property-with-spacing"),
        pytest.param("{" + CURSOR_PARTS + ',"extra":1}', id="extra-property"),
        pytest.param("{" + CURSOR_PARTS.replace('"version":1,', "") + "}", id="missing-version"),
        pytest.param("{" + CURSOR_PARTS.replace('"version":1', '"version":2') + "}", id="future-version"),
        pytest.param("{" + CURSOR_PARTS.replace('"version":1', '"version":"1"') + "}", id="string-version"),
        pytest.param("{" + CURSOR_PARTS.replace('"version":1', '"version":true') + "}", id="boolean-version"),
        pytest.param(
            '{"occurredAt":"2026-09-18T08:15:30.123Z","version":1,'
            '"eventId":"00000000-0000-4000-8000-000000000001",' + f'"filterDigest":"{VECTOR_DIGEST}"' + "}",
            id="wrong-property-order",
        ),
        pytest.param("{ " + CURSOR_PARTS + " }", id="whitespace-inside-the-object"),
        pytest.param("{" + CURSOR_PARTS + "," + CURSOR_PARTS.split(",")[0] + "}", id="duplicate-key"),
        pytest.param("{" + CURSOR_PARTS.replace("08:15:30.123Z", "08:15:30Z") + "}", id="non-canonical-timestamp"),
        pytest.param(
            "{" + CURSOR_PARTS.replace("4000-8000-000000000001", "1000-8000-000000000001") + "}", id="bad-uuid"
        ),
        pytest.param("{" + CURSOR_PARTS.replace(VECTOR_DIGEST, "A" * 64) + "}", id="uppercase-digest"),
        pytest.param("{" + CURSOR_PARTS.replace(VECTOR_DIGEST, "0" * 64) + "}", id="digest-of-another-query"),
        pytest.param(
            "{" + CURSOR_PARTS.replace('"eventId":"00000000-0000-4000-8000-000000000001"', '"eventId":7') + "}",
            id="numeric-event-id",
        ),
    ],
)
def test_a_cursor_whose_document_is_not_the_exact_shape_is_invalid_cursor(document: str) -> None:
    assert refusal(decode_cursor, encoded(document), VECTOR_DIGEST).code == "ferret.cursor.invalid"


def test_the_cursor_of_one_query_is_refused_by_a_query_with_other_filters() -> None:
    other = filter_digest(criteria_from_options({"--harness": ("codex",)}, now=VECTOR_NOW), DEFAULT_LIMIT)

    assert refusal(decode_cursor, VECTOR_CURSOR, other).code == "ferret.cursor.invalid"


def test_events_list_returns_the_newest_first_with_the_event_id_breaking_ties_downward() -> None:
    same_moment = timedelta(minutes=5)
    world = world_with(
        make_event(1, ago=timedelta(minutes=30)),
        make_event(2, ago=same_moment),
        make_event(3, ago=timedelta(minutes=1)),
        make_event(4, ago=same_moment),
    )

    page = list_events(world.runtime, {})

    assert numbers(page.items) == [3, 4, 2, 1]
    assert page.next_cursor is None


def test_events_export_streams_the_oldest_first_with_the_event_id_breaking_ties_upward() -> None:
    same_moment = timedelta(minutes=5)
    world = world_with(
        make_event(1, ago=timedelta(minutes=30)),
        make_event(2, ago=same_moment),
        make_event(3, ago=timedelta(minutes=1)),
        make_event(4, ago=same_moment),
    )

    assert numbers(tuple(export_events(world.runtime, {}))) == [1, 2, 4, 3]


@pytest.mark.parametrize(
    ("options", "expected"),
    [
        pytest.param({"--harness": ("codex",)}, [2, 4], id="harness"),
        pytest.param({"--workspace": (WORKSPACE_B,)}, [3, 4], id="workspace"),
        pytest.param({"--event-type": ("tool.failed",)}, [3], id="event-type"),
        pytest.param({"--outcome": ("failure",)}, [3], id="outcome"),
        pytest.param({"--agent": ("reviewer",)}, [5], id="agent"),
        pytest.param({"--skill": ("tdd",)}, [6], id="skill"),
        pytest.param({"--tool": ("Write",)}, [2], id="tool"),
        pytest.param({"--harness": ("codex",), "--workspace": (WORKSPACE_B,)}, [4], id="harness-and-workspace"),
        pytest.param(
            {"--harness": ("claude_code",), "--outcome": ("failure",), "--workspace": (WORKSPACE_B,)},
            [3],
            id="three-filters",
        ),
        pytest.param({"--harness": ("opencode",)}, [], id="no-match"),
    ],
)
def test_each_filter_narrows_the_result_and_they_combine_conjunctively(options: Options, expected: list[int]) -> None:
    world = world_with(
        make_event(1, ago=timedelta(minutes=60), workspaceId=WORKSPACE_A),
        make_event(2, ago=timedelta(minutes=50), harness="codex", workspaceId=WORKSPACE_A, toolName="Write"),
        make_event(
            3,
            ago=timedelta(minutes=40),
            workspaceId=WORKSPACE_B,
            eventType="tool.failed",
            outcome="failure",
        ),
        make_event(4, ago=timedelta(minutes=30), harness="codex", workspaceId=WORKSPACE_B),
        make_event(
            5,
            ago=timedelta(minutes=20),
            eventType="agent.started",
            agentName="reviewer",
            toolName=None,
            outcome="not_applicable",
            durationMs=None,
            outcomeVisibility="not_applicable",
            durationVisibility="not_applicable",
        ),
        make_event(
            6,
            ago=timedelta(minutes=10),
            eventType="skill.invoked",
            skillName="tdd",
            toolName=None,
            outcome="not_applicable",
            durationMs=None,
            outcomeVisibility="not_applicable",
            durationVisibility="not_applicable",
        ),
    )

    assert sorted(numbers(list_events(world.runtime, options).items)) == sorted(expected)
    assert sorted(numbers(tuple(export_events(world.runtime, options)))) == sorted(expected)


def test_the_interval_includes_its_lower_bound_and_excludes_its_upper_bound() -> None:
    world = world_with(
        make_event(1, ago=timedelta(hours=3)),
        make_event(2, ago=timedelta(hours=2)),
        make_event(3, ago=timedelta(hours=1)),
    )
    lower, upper = stamp(FIXED_NOW - timedelta(hours=2)), stamp(FIXED_NOW - timedelta(hours=1))

    page = list_events(world.runtime, {"--from": (lower,), "--to": (upper,)})

    assert numbers(page.items) == [2]


def test_the_default_window_is_the_seven_days_ending_now_and_all_time_widens_it() -> None:
    world = world_with(
        make_event(1, ago=timedelta(days=8)),
        make_event(2, ago=timedelta(days=7)),
        make_event(3, ago=timedelta(days=1)),
        make_event(4, ago=timedelta(0)),
    )

    assert numbers(list_events(world.runtime, {}).items) == [3, 2]
    assert numbers(list_events(world.runtime, {"--all-time": ()}).items) == [4, 3, 2, 1]


def test_an_event_that_expired_is_never_returned_even_for_all_time() -> None:
    world = world_with(
        make_event(1, ago=timedelta(days=31)),
        make_event(2, ago=timedelta(days=30)),
        make_event(3, ago=timedelta(days=29, hours=23)),
    )

    assert numbers(list_events(world.runtime, {"--all-time": ()}).items) == [3]
    assert numbers(tuple(export_events(world.runtime, {"--all-time": ()}))) == [3]


def test_pages_chain_by_cursor_without_a_gap_or_a_repeat() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 8)])
    options: Options = {"--limit": ("3",)}

    first = list_events(world.runtime, options)
    second = list_events(world.runtime, {**options, "--cursor": (first.next_cursor or "",)})
    third = list_events(world.runtime, {**options, "--cursor": (second.next_cursor or "",)})

    assert [numbers(page.items) for page in (first, second, third)] == [[1, 2, 3], [4, 5, 6], [7]]
    assert (first.next_cursor is None, second.next_cursor is None, third.next_cursor is None) == (False, False, True)


def test_a_page_that_exactly_fills_the_limit_reports_no_further_cursor() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 4)])

    page = list_events(world.runtime, {"--limit": ("3",)})

    assert (numbers(page.items), page.next_cursor) == ([1, 2, 3], None)


def test_the_cursor_names_the_last_item_and_the_digest_of_its_own_query() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 5)])

    page = list_events(world.runtime, {"--limit": ("2",)})

    last = page.items[-1]
    criteria = criteria_from_options({}, now=FIXED_NOW)
    assert page.next_cursor == encode_cursor(Position(last.occurred_at, last.event_id), filter_digest(criteria, 2))


def test_a_cursor_is_refused_when_the_filters_or_the_limit_differ() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 6)])
    cursor = list_events(world.runtime, {"--limit": ("2",)}).next_cursor or ""

    for options in (
        {"--limit": ("3",), "--cursor": (cursor,)},
        {"--limit": ("2",), "--cursor": (cursor,), "--harness": ("claude_code",)},
        {"--limit": ("2",), "--cursor": (cursor,), "--all-time": ()},
    ):
        assert refusal(list_events, world.runtime, options).code == "ferret.cursor.invalid"


def test_a_cursor_is_refused_once_its_referenced_row_has_expired_or_vanished() -> None:
    world = world_with(*[make_event(number, ago=timedelta(days=29, minutes=number)) for number in range(1, 5)])
    options: Options = {"--limit": ("2",), "--all-time": ()}
    cursor = list_events(world.runtime, options).next_cursor or ""
    world.clock.advance(timedelta(days=1))

    assert refusal(list_events, world.runtime, {**options, "--cursor": (cursor,)}).code == "ferret.cursor.invalid"

    fresh = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 5)])
    kept = list_events(fresh.runtime, {"--limit": ("2",)}).next_cursor or ""
    fresh.events.stored.clear()
    assert refusal(list_events, fresh.runtime, {"--limit": ("2",), "--cursor": (kept,)}).code == "ferret.cursor.invalid"


def test_a_cursor_whose_position_disagrees_with_its_row_is_refused() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 5)])
    criteria = criteria_from_options({}, now=FIXED_NOW)
    forged = encode_cursor(
        Position("2026-09-18T07:00:00.000Z", world.events.stored[0].event_id), filter_digest(criteria, 2)
    )

    assert (
        refusal(list_events, world.runtime, {"--limit": ("2",), "--cursor": (forged,)}).code == "ferret.cursor.invalid"
    )


def test_a_repeated_cursor_option_is_invalid_arguments() -> None:
    world = world_with(make_event(1))

    assert (
        refusal(list_events, world.runtime, {"--cursor": (VECTOR_CURSOR, VECTOR_CURSOR)}).code == "ferret.args.invalid"
    )


def test_a_bad_filter_or_cursor_is_refused_before_storage_is_touched() -> None:
    world = world_with(initialized=False)

    for options in ({"--harness": ("Bad",)}, {"--cursor": ("!",)}, {"--limit": ("0",)}):
        assert refusal(list_events, world.runtime, options).code in {
            "ferret.filter.invalid",
            "ferret.cursor.invalid",
            "ferret.args.invalid",
        }
    assert refusal(export_events, world.runtime, {"--harness": ("Bad",)}).code == "ferret.filter.invalid"
    assert world.files.touched == []


def test_a_valid_query_needs_an_initialized_store() -> None:
    world = world_with(initialized=False)

    assert refusal(list_events, world.runtime, {}).code == "ferret.storage.uninitialized"
    assert refusal(export_events, world.runtime, {}).code == "ferret.storage.uninitialized"
    assert world.events.reads == 0


def test_export_validates_when_called_rather_than_when_first_read() -> None:
    world = world_with(make_event(1))

    with pytest.raises(FerretError):
        export_events(world.runtime, {"--harness": ("Bad",)})


def test_export_reads_in_batches_and_only_as_the_consumer_advances(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(queries, "BATCH_SIZE", 2)
    world = world_with(*[make_event(number, ago=timedelta(minutes=10 - number)) for number in range(1, 8)])

    stream = export_events(world.runtime, {})
    assert world.events.reads == 0
    first = next(stream)
    assert (numbers((first,)), world.events.reads) == ([1], 1)
    remaining = list(stream)

    assert numbers(tuple(remaining)) == [2, 3, 4, 5, 6, 7]
    assert world.events.reads == 4


def test_export_of_an_empty_result_yields_nothing() -> None:
    assert list(export_events(world_with().runtime, {})) == []


def test_export_batches_are_windows_of_one_consistent_order_with_equal_timestamps(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(queries, "BATCH_SIZE", 2)
    world = world_with(*[make_event(number, ago=timedelta(minutes=1)) for number in range(1, 6)])

    assert numbers(tuple(export_events(world.runtime, {}))) == [1, 2, 3, 4, 5]


def test_events_list_json_is_one_compact_object_of_canonical_events_and_a_cursor() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=number)) for number in range(1, 4)])

    code, out, err = run_cli(world, ["events", "list", "--json", "--limit", "2"])

    document = json.loads(out)
    assert (code, err, out.endswith("\n"), out.count("\n")) == (0, "", True, 1)
    assert list(document) == ["schemaVersion", "command", "exitCode", "items", "nextCursor"]
    assert (document["schemaVersion"], document["command"], document["exitCode"]) == (1, "events.list", 0)
    assert document["items"] == [item.to_document() for item in world.events.stored[:2]]
    assert document["nextCursor"] == encode_cursor(
        Position(world.events.stored[1].occurred_at, world.events.stored[1].event_id),
        filter_digest(criteria_from_options({}, now=FIXED_NOW), 2),
    )


def test_events_list_json_with_no_rows_is_an_empty_array_and_a_null_cursor() -> None:
    code, out, err = run_cli(world_with(), ["events", "list", "--json"])

    # `1`, not `0`: the query ran and matched nothing, which a caller must be able to tell from a match
    # without parsing the payload. `exitCode` in the envelope says the same number.
    assert (code, err) == (1, "")
    assert out == '{"schemaVersion":1,"command":"events.list","exitCode":1,"items":[],"nextCursor":null}\n'


def test_events_list_text_is_a_tab_separated_table_with_dashes_for_null() -> None:
    world = world_with(make_event(1, ago=timedelta(minutes=1)))

    code, out, err = run_cli(world, ["events", "list"])

    header = (
        "occurredAt\teventId\tharness\tworkspaceId\teventType\tagentName\tskillName\ttoolName\toutcome\t"
        "subjectVisibility\toutcomeVisibility\tdurationVisibility\n"
    )
    row = (
        "2026-09-18T07:59:00.000Z\t00000000-0000-4000-8000-000000000001\tclaude_code\t"
        "ws_327b250d010590da40f0f76d18da910a\ttool.completed\t-\t-\tRead\tsuccess\tobserved\tobserved\tobserved\n"
    )
    assert (code, out, err) == (0, header + row, "")


def test_an_empty_text_page_prints_no_rows_to_stderr_and_leaves_stdout_empty() -> None:
    assert run_cli(world_with(), ["events", "list"]) == (1, "", "No rows.\n")


def test_events_export_writes_one_canonical_event_per_line_and_flushes_each() -> None:
    world = world_with(*[make_event(number, ago=timedelta(minutes=10 - number)) for number in range(1, 4)])
    flushes: list[int] = []

    class Recording(io.StringIO):
        def flush(self) -> None:
            flushes.append(len(self.getvalue().splitlines()))
            super().flush()

    stdout, stderr = Recording(), io.StringIO()
    code = cli.main(
        ["events", "export", "--format", "jsonl"],
        stdout=stdout,
        stderr=stderr,
        handlers=build_handlers(lambda: world.runtime),
    )

    lines = stdout.getvalue().splitlines(keepends=True)
    assert (code, stderr.getvalue(), flushes) == (0, "", [1, 2, 3])
    assert [json.loads(line) for line in lines] == [item.to_document() for item in world.events.stored]
    assert all(line.endswith("\n") and line.count("\n") == 1 for line in lines)


def test_events_export_of_an_empty_result_is_zero_bytes() -> None:
    assert run_cli(world_with(), ["events", "export", "--format", "jsonl"]) == (1, "", "")


def test_export_rejects_a_machine_output_request_and_writes_nothing_to_stdout() -> None:
    code, out, err = run_cli(world_with(), ["events", "export", "--format", "jsonl", "--json"])

    assert (code, out) == (2, "")
    assert json.loads(err)["error"]["code"] == "ferret.args.invalid"


def test_a_failed_export_reports_its_closed_error_on_stderr_only() -> None:
    code, out, err = run_cli(world_with(), ["events", "export", "--format", "jsonl", "--harness", "Bad"])

    assert (code, out, err) == (2, "", "ferret: [ferret.filter.invalid] a filter value is not valid\n")


def test_a_failed_list_names_its_command_in_the_json_error() -> None:
    code, out, err = run_cli(world_with(), ["events", "list", "--json", "--cursor", "!"])

    assert (code, out) == (2, "")
    assert json.loads(err) == {
        "schemaVersion": 1,
        "command": "events.list",
        "exitCode": 2,
        "error": {
            "code": "ferret.cursor.invalid",
            "message": "the cursor is not valid for this query",
            "field": None,
            "retryable": False,
        },
    }
