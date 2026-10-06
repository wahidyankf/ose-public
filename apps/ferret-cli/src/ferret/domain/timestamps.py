"""UTC RFC 3339 timestamps with exactly three fractional digits and a trailing ``Z``, ASCII digits only."""

import re
from datetime import UTC, datetime, timedelta

from typekit import Err, Ok, Result, attempt

_PATTERN = re.compile(r"([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{3})Z")
_RFC3339 = re.compile(
    r"([0-9]{4})-([0-9]{2})-([0-9]{2})[Tt]([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,9}))?"
    r"(?:[Zz]|([+-])([0-9]{2}):([0-9]{2}))"
)
MAX_OFFSET_HOURS = 23
MAX_OFFSET_MINUTES = 59


def format_timestamp(moment: datetime) -> Result[str, ValueError]:
    """Render an aware moment as UTC with millisecond precision; a moment with no time zone is an ``Err``."""
    if moment.tzinfo is None:
        return Err(ValueError("a timestamp needs a time zone"))
    utc = moment.astimezone(UTC)
    # Fields are padded here rather than by strftime, whose %Y leaves a year before 1000 unpadded on some platforms.
    return Ok(
        f"{utc.year:04d}-{utc.month:02d}-{utc.day:02d}T{utc.hour:02d}:{utc.minute:02d}:{utc.second:02d}"
        f".{utc.microsecond // 1000:03d}Z"
    )


def _utc_moment(
    year: int, month: int, day: int, hour: int, minute: int, second: int, millisecond: int
) -> Result[datetime, ValueError]:
    """The UTC moment of these calendar fields, or an ``Err`` when they name no real one, such as 30 February."""
    return attempt(lambda: datetime(year, month, day, hour, minute, second, millisecond * 1000, tzinfo=UTC), ValueError)


def parse_timestamp(text: str) -> Result[datetime, ValueError]:
    """Read one canonical timestamp, or an ``Err`` of ``ValueError`` for any other spelling."""
    match = _PATTERN.fullmatch(text)
    if match is None:
        return Err(ValueError("not a canonical UTC timestamp"))
    return _utc_moment(*(int(group) for group in match.groups()))


def parse_rfc3339(text: str) -> Result[datetime, ValueError]:
    """Read one RFC 3339 timestamp with an explicit zone as an aware UTC moment, or an ``Err`` of ``ValueError``.

    A lowercase ``t`` or ``z`` and a numeric offset are accepted, and a fraction of one to nine digits is floored to
    milliseconds rather than rounded. Only ASCII digits are read, so no other script's numerals are.
    """
    match = _RFC3339.fullmatch(text)
    if match is None:
        return Err(ValueError("not an RFC 3339 timestamp"))
    year, month, day, hour, minute, second = (int(match[group]) for group in range(1, 7))
    milliseconds = int((match[7] or "").ljust(3, "0")[:3])
    moment = _utc_moment(year, month, day, hour, minute, second, milliseconds)
    sign = match[8]
    if sign is None:
        return moment
    offset_hours, offset_minutes = int(match[9]), int(match[10])
    return moment.flat_map(lambda utc: _at_offset(utc, sign, offset_hours, offset_minutes))


def _at_offset(moment: datetime, sign: str, hours: int, minutes: int) -> Result[datetime, ValueError]:
    """``moment`` in UTC, given the zone ``sign`` ``hours``:``minutes`` it was read in; an ``Err`` if out of range."""
    if hours > MAX_OFFSET_HOURS or minutes > MAX_OFFSET_MINUTES:
        return Err(ValueError("the zone offset is out of range"))
    offset = timedelta(hours=hours, minutes=minutes)
    return attempt(lambda: moment - offset if sign == "+" else moment + offset, OverflowError).map_err(
        lambda _: ValueError("the timestamp is out of range")
    )


def add_days(moment: datetime, days: int) -> datetime:
    return moment + timedelta(days=days)
