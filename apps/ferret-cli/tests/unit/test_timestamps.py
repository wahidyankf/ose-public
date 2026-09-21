"""The one timestamp spelling: UTC, exactly three fractional digits, and a trailing Z."""

from datetime import UTC, datetime, timedelta, timezone

import pytest

from ferret.domain.timestamps import add_days, format_timestamp, parse_rfc3339, parse_timestamp

MOMENT = datetime(2026, 9, 18, 8, 15, 30, 123000, tzinfo=UTC)
CANONICAL = "2026-09-18T08:15:30.123Z"


def test_a_moment_formats_as_utc_with_millisecond_precision() -> None:
    assert format_timestamp(MOMENT) == CANONICAL


def test_finer_precision_is_truncated_not_rounded() -> None:
    assert format_timestamp(MOMENT.replace(microsecond=123999)) == CANONICAL


def test_a_moment_in_another_zone_is_converted_to_utc() -> None:
    local = MOMENT.astimezone(timezone(timedelta(hours=7)))

    assert format_timestamp(local) == CANONICAL


def test_a_naive_moment_is_refused() -> None:
    with pytest.raises(ValueError, match="time zone"):
        format_timestamp(datetime(2026, 9, 18, 8, 15, 30))


def test_a_canonical_timestamp_round_trips() -> None:
    assert parse_timestamp(CANONICAL) == MOMENT
    assert format_timestamp(parse_timestamp(CANONICAL)) == CANONICAL


@pytest.mark.parametrize(
    "text",
    [
        "",
        "yesterday",
        "2026-09-18T08:15:30Z",
        "2026-09-18T08:15:30.12Z",
        "2026-09-18T08:15:30.1234Z",
        "2026-09-18T08:15:30.123+00:00",
        "2026-09-18T08:15:30.123",
        "2026-09-18 08:15:30.123Z",
        "2026-13-18T08:15:30.123Z",
        "2026-02-30T08:15:30.123Z",
        "2026-09-18T24:00:00.000Z",
        "2026-09-18T08:15:30.123Z ",
        "\uff12\uff10\uff12\uff16-09-18T08:15:30.123Z",
        "2026-09-18T08:15:30.\u0661\u0662\u0663Z",
    ],
    ids=[
        "empty",
        "word",
        "no-fraction",
        "two-digit-fraction",
        "four-digit-fraction",
        "offset",
        "no-zone",
        "space-separator",
        "month-13",
        "day-30-of-february",
        "hour-24",
        "trailing-space",
        "fullwidth-digits",
        "arabic-indic-digits",
    ],
)
def test_any_other_spelling_is_refused(text: str) -> None:
    with pytest.raises(ValueError, match=r"canonical|day|month|hour"):
        parse_timestamp(text)


def test_days_are_added_on_the_calendar() -> None:
    assert format_timestamp(add_days(MOMENT, 30)) == "2026-10-18T08:15:30.123Z"
    assert format_timestamp(add_days(MOMENT, 0)) == CANONICAL


def test_a_year_before_one_thousand_is_padded_to_four_digits() -> None:
    assert format_timestamp(datetime(5, 1, 2, 3, 4, 5, 678000, tzinfo=UTC)) == "0005-01-02T03:04:05.678Z"


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        pytest.param("2026-09-18T08:15:30.123Z", "2026-09-18T08:15:30.123Z", id="canonical"),
        pytest.param("2026-09-18t08:15:30.123z", "2026-09-18T08:15:30.123Z", id="lowercase-separator-and-zone"),
        pytest.param("2026-09-18T08:15:30Z", "2026-09-18T08:15:30.000Z", id="no-fraction"),
        pytest.param("2026-09-18T08:15:30.5Z", "2026-09-18T08:15:30.500Z", id="one-fraction-digit"),
        pytest.param("2026-09-18T08:15:30.123999999Z", "2026-09-18T08:15:30.123Z", id="nine-digits-are-floored"),
        pytest.param("2026-09-18T15:15:30+07:00", "2026-09-18T08:15:30.000Z", id="positive-offset"),
        pytest.param("2026-09-18T02:45:30-05:30", "2026-09-18T08:15:30.000Z", id="negative-offset"),
        pytest.param("2026-09-18T08:15:30+00:00", "2026-09-18T08:15:30.000Z", id="zero-offset"),
        pytest.param("2026-09-18T08:15:30-23:59", "2026-09-19T08:14:30.000Z", id="widest-offset-crosses-a-day"),
    ],
)
def test_an_rfc3339_timestamp_is_read_as_the_utc_moment_it_names(text: str, expected: str) -> None:
    assert format_timestamp(parse_rfc3339(text)) == expected


@pytest.mark.parametrize(
    "text",
    [
        pytest.param("", id="empty"),
        pytest.param("2026-09-18", id="date-only"),
        pytest.param("2026-09-18T08:15:30", id="no-zone"),
        pytest.param("2026-09-18 08:15:30Z", id="space-separator"),
        pytest.param("2026-09-18T08:15:30+0200", id="offset-without-colon"),
        pytest.param("2026-09-18T08:15:30.Z", id="empty-fraction"),
        pytest.param("2026-09-18T08:15:30.1234567890Z", id="ten-fraction-digits"),
        pytest.param("2026-09-18T08:15:30Z ", id="trailing-space"),
        pytest.param("2026-02-30T08:15:30Z", id="day-30-of-february"),
        pytest.param("2026-09-18T24:00:00Z", id="hour-24"),
        pytest.param("2026-09-18T08:15:30+24:00", id="offset-hours-out-of-range"),
        pytest.param("2026-09-18T08:15:30+00:60", id="offset-minutes-out-of-range"),
        pytest.param("0001-01-01T00:00:00+01:00", id="offset-before-the-first-year"),
        pytest.param("9999-12-31T23:59:59-01:00", id="offset-after-the-last-year"),
        pytest.param("\uff12\uff10\uff12\uff16-09-18T08:15:30Z", id="fullwidth-digits"),
        pytest.param("\u0662\u0660\u0662\u0666-09-18T08:15:30Z", id="arabic-indic-digits"),
    ],
)
def test_any_other_rfc3339_spelling_is_refused(text: str) -> None:
    with pytest.raises(ValueError, match=r"RFC 3339|day|month|hour|offset|range"):
        parse_rfc3339(text)
