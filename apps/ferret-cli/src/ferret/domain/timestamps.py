"""UTC RFC 3339 timestamps with exactly three fractional digits and a trailing ``Z``, ASCII digits only."""

import re
from datetime import UTC, datetime, timedelta

_PATTERN = re.compile(r"([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{3})Z")
_RFC3339 = re.compile(
    r"([0-9]{4})-([0-9]{2})-([0-9]{2})[Tt]([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,9}))?"
    r"(?:[Zz]|([+-])([0-9]{2}):([0-9]{2}))"
)
MAX_OFFSET_HOURS = 23
MAX_OFFSET_MINUTES = 59


def format_timestamp(moment: datetime) -> str:
    """Render an aware moment as UTC with millisecond precision."""
    if moment.tzinfo is None:
        raise ValueError("a timestamp needs a time zone")
    utc = moment.astimezone(UTC)
    # Fields are padded here rather than by strftime, whose %Y leaves a year before 1000 unpadded on some platforms.
    return (
        f"{utc.year:04d}-{utc.month:02d}-{utc.day:02d}T{utc.hour:02d}:{utc.minute:02d}:{utc.second:02d}"
        f".{utc.microsecond // 1000:03d}Z"
    )


def parse_timestamp(text: str) -> datetime:
    """Read one canonical timestamp, or raise ValueError for any other spelling."""
    match = _PATTERN.fullmatch(text)
    if match is None:
        raise ValueError("not a canonical UTC timestamp")
    year, month, day, hour, minute, second, millisecond = (int(group) for group in match.groups())
    return datetime(year, month, day, hour, minute, second, millisecond * 1000, tzinfo=UTC)


def parse_rfc3339(text: str) -> datetime:
    """Read one RFC 3339 timestamp with an explicit zone as an aware UTC moment, or raise ValueError.

    A lowercase ``t`` or ``z`` and a numeric offset are accepted, and a fraction of one to nine digits is floored to
    milliseconds rather than rounded. Only ASCII digits are read, so no other script's numerals are.
    """
    match = _RFC3339.fullmatch(text)
    if match is None:
        raise ValueError("not an RFC 3339 timestamp")
    year, month, day, hour, minute, second = (int(match[group]) for group in range(1, 7))
    milliseconds = int((match[7] or "").ljust(3, "0")[:3])
    moment = datetime(year, month, day, hour, minute, second, milliseconds * 1000, tzinfo=UTC)
    sign = match[8]
    if sign is None:
        return moment
    offset_hours, offset_minutes = int(match[9]), int(match[10])
    if offset_hours > MAX_OFFSET_HOURS or offset_minutes > MAX_OFFSET_MINUTES:
        raise ValueError("the zone offset is out of range")
    offset = timedelta(hours=offset_hours, minutes=offset_minutes)
    try:
        return moment - offset if sign == "+" else moment + offset
    except OverflowError:
        raise ValueError("the timestamp is out of range") from None


def add_days(moment: datetime, days: int) -> datetime:
    return moment + timedelta(days=days)
