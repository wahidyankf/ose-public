"""The read side of the data contract: closed filters, the default window, the page size, and the keyset cursor.

Every rejection is a closed failure that names its code and never the rejected value, so a caller's raw input can
never reach a diagnostic.
"""

import base64
import hashlib
import json
import re
import unicodedata
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Final, cast

from ferret.domain import fields
from ferret.domain.canonical import canonical_bytes
from ferret.domain.errors import ErrorCode, FerretError
from ferret.domain.event import EVENT_TYPES, OUTCOMES
from ferret.domain.timestamps import format_timestamp, parse_rfc3339, parse_timestamp

type Options = Mapping[str, tuple[str, ...]]

DEFAULT_LIMIT: Final = 100
MAX_LIMIT: Final = 200
DEFAULT_WINDOW: Final = timedelta(days=7)
CURSOR_VERSION: Final = 1
CURSOR_KEYS: Final = ("version", "occurredAt", "eventId", "filterDigest")

_LIMIT_DIGITS = re.compile(r"[0-9]+")
_LIMIT_WIDTH = len(str(MAX_LIMIT))
_CURSOR_ALPHABET = re.compile(r"[A-Za-z0-9_\-]+")


@dataclass(frozen=True, slots=True)
class EventCriteria:
    """One query's filters: a half-open interval (open ends are ``None``) and exact matches on each present name."""

    start: str | None
    end: str | None
    harness: str | None = None
    workspace: str | None = None
    event_type: str | None = None
    agent: str | None = None
    skill: str | None = None
    tool: str | None = None
    outcome: str | None = None


@dataclass(frozen=True, slots=True)
class Position:
    """A place in the total ``(occurredAt, eventId)`` order: the last event a page returned."""

    occurred_at: str
    event_id: str


def single_value(options: Options, name: str, *, refusal: ErrorCode) -> str | None:
    """The one value of an option that may be given at most once, or ``None`` when it is absent."""
    values = options.get(name, ())
    if len(values) > 1:
        raise FerretError(refusal)
    return values[0] if values else None


def _timestamp_bound(options: Options, name: str) -> datetime | None:
    raw = single_value(options, name, refusal="invalid_filter")
    if raw is None:
        return None
    try:
        return parse_rfc3339(raw)
    except ValueError:
        raise FerretError("invalid_filter") from None


def _interval(options: Options, now: datetime) -> tuple[str | None, str | None]:
    """The default window is the seven days ending at ``now``; one bound alone borrows the other from that width."""
    lower, upper = _timestamp_bound(options, "--from"), _timestamp_bound(options, "--to")
    if "--all-time" in options:
        if lower is not None or upper is not None:
            raise FerretError("invalid_filter")
        return None, None
    end = upper if upper is not None else now
    start = lower if lower is not None else end - DEFAULT_WINDOW
    if format_timestamp(start) >= format_timestamp(end):
        raise FerretError("invalid_filter")
    return format_timestamp(start), format_timestamp(end)


def _closed(allowed: frozenset[str]) -> Callable[[str], bool]:
    return allowed.__contains__


def _name_filter(options: Options, name: str, accepts: Callable[[str], bool]) -> str | None:
    raw = single_value(options, name, refusal="invalid_filter")
    if raw is None:
        return None
    value = unicodedata.normalize("NFC", raw)
    if not accepts(value):
        raise FerretError("invalid_filter")
    return value


def criteria_from_options(options: Options, *, now: datetime) -> EventCriteria:
    """Read the filter options into criteria, resolving the time window against ``now``.

    Each scalar filter may appear once, timestamps are RFC 3339 and normalized to UTC milliseconds, and every value
    must be one the corresponding event field could hold, so a filter that can never match is a mistake, not an
    empty result.
    """
    start, end = _interval(options, now)
    return EventCriteria(
        start=start,
        end=end,
        harness=_name_filter(options, "--harness", lambda value: fields.HARNESS.fullmatch(value) is not None),
        workspace=_name_filter(options, "--workspace", lambda value: fields.WORKSPACE_ID.fullmatch(value) is not None),
        event_type=_name_filter(options, "--event-type", _closed(EVENT_TYPES)),
        agent=_name_filter(options, "--agent", lambda value: fields.is_name(value, logical=False)),
        skill=_name_filter(options, "--skill", lambda value: fields.is_name(value, logical=False)),
        tool=_name_filter(options, "--tool", lambda value: fields.is_name(value, logical=True)),
        outcome=_name_filter(options, "--outcome", _closed(OUTCOMES)),
    )


def parse_limit(options: Options) -> int:
    """The page size: one through ``MAX_LIMIT`` written in ASCII digits, or ``DEFAULT_LIMIT`` when absent."""
    raw = single_value(options, "--limit", refusal="invalid_arguments")
    if raw is None:
        return DEFAULT_LIMIT
    if _LIMIT_DIGITS.fullmatch(raw) is None or len(raw.lstrip("0")) > _LIMIT_WIDTH:
        raise FerretError("invalid_arguments")
    limit = int(raw)
    if not 1 <= limit <= MAX_LIMIT:
        raise FerretError("invalid_arguments")
    return limit


def filter_digest(criteria: EventCriteria, limit: int) -> str:
    """SHA-256 of the compact JSON of every filter and the page size, so a cursor only resumes its own query."""
    document = {
        "from": criteria.start,
        "to": criteria.end,
        "harness": criteria.harness,
        "workspace": criteria.workspace,
        "eventType": criteria.event_type,
        "agent": criteria.agent,
        "skill": criteria.skill,
        "tool": criteria.tool,
        "outcome": criteria.outcome,
        "limit": limit,
    }
    return hashlib.sha256(canonical_bytes(document)).hexdigest()


def encode_cursor(position: Position, digest: str) -> str:
    """The opaque token that resumes after ``position``: base64url, unpadded, of the canonical cursor document."""
    document = {
        "version": CURSOR_VERSION,
        "occurredAt": position.occurred_at,
        "eventId": position.event_id,
        "filterDigest": digest,
    }
    return base64.urlsafe_b64encode(canonical_bytes(document)).rstrip(b"=").decode("ascii")


def _invalid_cursor() -> FerretError:
    return FerretError("invalid_cursor")


def _cursor_document(token: str) -> dict[str, Any]:
    """The exact canonical document ``token`` spells, or ``invalid_cursor`` for any other byte sequence."""
    if _CURSOR_ALPHABET.fullmatch(token) is None:
        raise _invalid_cursor()
    try:
        raw = base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))
        if base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii") != token:
            raise ValueError("the token has non-canonical trailing bits")
        parsed: object = json.loads(raw.decode("utf-8"))
        if not isinstance(parsed, dict):
            raise ValueError("the token is not an object")
        document = cast(dict[str, Any], parsed)
        if canonical_bytes(document) != raw:
            raise ValueError("the token is not in canonical form")
    except ValueError, TypeError, RecursionError:
        raise _invalid_cursor() from None
    return document


def _cursor_text(document: Mapping[str, Any], key: str) -> str:
    value = document[key]
    if not isinstance(value, str):
        raise _invalid_cursor()
    return value


def decode_cursor(token: str, digest: str) -> Position:
    """The position ``token`` resumes after, provided it is a well-formed cursor of the query whose digest is given."""
    document = _cursor_document(token)
    version = document.get("version")
    if tuple(document) != CURSOR_KEYS or type(version) is not int or version != CURSOR_VERSION:
        raise _invalid_cursor()
    occurred_at, event_id = _cursor_text(document, "occurredAt"), _cursor_text(document, "eventId")
    try:
        parse_timestamp(occurred_at)
    except ValueError:
        raise _invalid_cursor() from None
    if fields.UUID_V4.fullmatch(event_id) is None or _cursor_text(document, "filterDigest") != digest:
        raise _invalid_cursor()
    return Position(occurred_at, event_id)
