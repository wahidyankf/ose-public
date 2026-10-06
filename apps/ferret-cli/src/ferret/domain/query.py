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

from typekit import Err, Ok, Result, attempt

from ferret.domain import fields
from ferret.domain.canonical import canonical_bytes
from ferret.domain.errors import ErrorCode, FerretError, FerretResult, as_internal_failure
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


def single_value(options: Options, name: str, *, refusal: ErrorCode) -> FerretResult[str | None]:
    """The one value of an option that may be given at most once, or ``None`` when it is absent."""
    values = options.get(name, ())
    if len(values) > 1:
        return Err(FerretError(refusal))
    return Ok(values[0] if values else None)


def _bound(raw: str | None) -> FerretResult[datetime | None]:
    """The moment an RFC 3339 bound spells, or ``None`` when the bound is absent."""
    if raw is None:
        return Ok(None)
    return parse_rfc3339(raw).map_err(lambda _: FerretError("ferret.filter.invalid"))


def _timestamp_bound(options: Options, name: str) -> FerretResult[datetime | None]:
    return single_value(options, name, refusal="ferret.filter.invalid").flat_map(_bound)


def _ordered(bounds: tuple[str, str]) -> FerretResult[tuple[str | None, str | None]]:
    """``bounds``, provided the window they delimit is not empty."""
    start_text, end_text = bounds
    if start_text >= end_text:
        return Err(FerretError("ferret.filter.invalid"))
    return Ok(bounds)


def _window(
    options: Options, now: datetime, lower: datetime | None, upper: datetime | None
) -> FerretResult[tuple[str | None, str | None]]:
    """The default window is the seven days ending at ``now``; one bound alone borrows the other from that width."""
    if "--all-time" in options:
        if lower is not None or upper is not None:
            return Err(FerretError("ferret.filter.invalid"))
        return Ok((None, None))
    end = upper if upper is not None else now
    start = lower if lower is not None else end - DEFAULT_WINDOW
    return (
        format_timestamp(start)
        .flat_map(lambda start_text: format_timestamp(end).map(lambda end_text: (start_text, end_text)))
        .map_err(as_internal_failure)
        .flat_map(_ordered)
    )


def _interval(options: Options, now: datetime) -> FerretResult[tuple[str | None, str | None]]:
    """The start and end of the query's window as UTC milliseconds, both ``None`` for all time."""
    return _timestamp_bound(options, "--from").flat_map(
        lambda lower: _timestamp_bound(options, "--to").flat_map(lambda upper: _window(options, now, lower, upper))
    )


def _closed(allowed: frozenset[str]) -> Callable[[str], bool]:
    return allowed.__contains__


def _accepted(raw: str | None, accepts: Callable[[str], bool]) -> FerretResult[str | None]:
    """The NFC form of ``raw`` when ``accepts`` it, ``None`` when the filter is absent, otherwise a refusal."""
    if raw is None:
        return Ok(None)
    value = unicodedata.normalize("NFC", raw)
    return Ok(value) if accepts(value) else Err(FerretError("ferret.filter.invalid"))


def _name_filter(options: Options, name: str, accepts: Callable[[str], bool]) -> FerretResult[str | None]:
    """One scalar filter: given at most once, and a value ``accepts`` in its normalized form."""
    return single_value(options, name, refusal="ferret.filter.invalid").flat_map(lambda raw: _accepted(raw, accepts))


# (criteria attribute, option, what the normalized value must be): the scalar filters in the order they are checked.
_NAME_FILTERS: Final[tuple[tuple[str, str, Callable[[str], bool]], ...]] = (
    ("harness", "--harness", lambda value: fields.HARNESS.fullmatch(value) is not None),
    ("workspace", "--workspace", lambda value: fields.WORKSPACE_ID.fullmatch(value) is not None),
    ("event_type", "--event-type", _closed(EVENT_TYPES)),
    ("agent", "--agent", lambda value: fields.is_name(value, logical=False)),
    ("skill", "--skill", lambda value: fields.is_name(value, logical=False)),
    ("tool", "--tool", lambda value: fields.is_name(value, logical=True)),
    ("outcome", "--outcome", _closed(OUTCOMES)),
)


def _criteria(options: Options, window: tuple[str | None, str | None]) -> FerretResult[EventCriteria]:
    """The criteria of ``window`` and every scalar filter, or the refusal of the first filter that fails."""
    names: dict[str, str | None] = {}
    for attribute, option, accepts in _NAME_FILTERS:
        chosen = _name_filter(options, option, accepts)
        if isinstance(chosen, Err):
            return chosen
        names[attribute] = chosen.value
    return Ok(EventCriteria(start=window[0], end=window[1], **names))


def criteria_from_options(options: Options, *, now: datetime) -> FerretResult[EventCriteria]:
    """Read the filter options into criteria, resolving the time window against ``now``.

    Each scalar filter may appear once, timestamps are RFC 3339 and normalized to UTC milliseconds, and every value
    must be one the corresponding event field could hold, so a filter that can never match is a mistake, not an
    empty result.
    """
    return _interval(options, now).flat_map(lambda window: _criteria(options, window))


def _limit(raw: str | None) -> FerretResult[int]:
    """The page size ``raw`` spells, ``DEFAULT_LIMIT`` when the option is absent."""
    if raw is None:
        return Ok(DEFAULT_LIMIT)
    if _LIMIT_DIGITS.fullmatch(raw) is None or len(raw.lstrip("0")) > _LIMIT_WIDTH:
        return Err(FerretError("ferret.args.invalid"))
    # A run of zeros past the interpreter's integer-string limit raises ``ValueError`` from ``int``, and always has been
    # answered with the last-resort code, so that stays the code.
    return (
        attempt(lambda: int(raw), ValueError)
        .map_err(lambda _: FerretError("ferret.storage.unavailable"))
        .flat_map(lambda limit: Ok(limit) if 1 <= limit <= MAX_LIMIT else Err(FerretError("ferret.args.invalid")))
    )


def parse_limit(options: Options) -> FerretResult[int]:
    """The page size: one through ``MAX_LIMIT`` written in ASCII digits, or ``DEFAULT_LIMIT`` when absent."""
    return single_value(options, "--limit", refusal="ferret.args.invalid").flat_map(_limit)


def filter_digest(criteria: EventCriteria, limit: int) -> FerretResult[str]:
    """SHA-256 of the compact JSON of every filter and the page size, so a cursor only resumes its own query.

    A float among the typed fields is a defect no input reaches, so it is an internal failure.
    """
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
    return canonical_bytes(document).map(lambda raw: hashlib.sha256(raw).hexdigest()).map_err(as_internal_failure)


def encode_cursor(position: Position, digest: str) -> FerretResult[str]:
    """The opaque token that resumes after ``position``: base64url, unpadded, of the canonical cursor document.

    A float among the typed fields is a defect no input reaches, so it is an internal failure.
    """
    document = {
        "version": CURSOR_VERSION,
        "occurredAt": position.occurred_at,
        "eventId": position.event_id,
        "filterDigest": digest,
    }
    return (
        canonical_bytes(document)
        .map(lambda raw: base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii"))
        .map_err(as_internal_failure)
    )


def _invalid_cursor() -> FerretError:
    return FerretError("ferret.cursor.invalid")


def _token_bytes(token: str) -> Result[bytes, ValueError]:
    """The bytes ``token`` spells in unpadded base64url, provided it is the only spelling of them."""
    padded = token + "=" * (-len(token) % 4)
    return attempt(lambda: base64.urlsafe_b64decode(padded), ValueError).flat_map(
        lambda raw: (
            Ok(raw)
            if base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii") == token
            else Err(ValueError("the token has non-canonical trailing bits"))
        )
    )


def _json_object(parsed: object) -> Result[dict[str, Any], ValueError]:
    """``parsed`` when it is a JSON object, which is all a cursor document may be."""
    if not isinstance(parsed, dict):
        return Err(ValueError("the token is not an object"))
    return Ok(cast(dict[str, Any], parsed))


def _canonical_document(
    document: dict[str, Any], raw: bytes
) -> Result[dict[str, Any], ValueError | RecursionError | TypeError]:
    """``document``, provided ``raw`` is exactly its canonical bytes.

    A document nested past the interpreter's limit raises ``RecursionError`` from the recursive float check, and one
    whose strings hold a lone surrogate raises ``UnicodeEncodeError``, a ``ValueError``, from the UTF-8 encoding.
    """
    # ``canonical_bytes`` returns a result of its own, so ``attempt`` wraps it in another and ``flat_map`` joins them.
    return (
        attempt(lambda: canonical_bytes(document), RecursionError, ValueError)
        .flat_map(lambda spelled: spelled)
        .flat_map(
            lambda canonical: (
                Ok(document) if canonical == raw else Err(ValueError("the token is not in canonical form"))
            )
        )
    )


def _cursor_document(token: str) -> FerretResult[dict[str, Any]]:
    """The exact canonical document ``token`` spells, or ``invalid_cursor`` for any other byte sequence."""
    if _CURSOR_ALPHABET.fullmatch(token) is None:
        return Err(_invalid_cursor())
    return (
        _token_bytes(token)
        .flat_map(
            lambda raw: (
                attempt(lambda: json.loads(raw.decode("utf-8")), ValueError, RecursionError)
                .flat_map(_json_object)
                .flat_map(lambda document: _canonical_document(document, raw))
            )
        )
        .map_err(lambda _: _invalid_cursor())
    )


def _cursor_text(document: Mapping[str, Any], key: str) -> FerretResult[str]:
    """The string a cursor document holds at ``key``; any other JSON type is no cursor."""
    value = document[key]
    return Ok(value) if isinstance(value, str) else Err(_invalid_cursor())


def _moment(text: str) -> FerretResult[str]:
    """``text`` when it is a canonical UTC timestamp."""
    return parse_timestamp(text).map(lambda _: text).map_err(lambda _: _invalid_cursor())


def _resumable(position: Position, claimed: object, digest: str) -> FerretResult[Position]:
    """``position`` when its event ID is well formed and ``claimed`` is the digest of the query asking."""
    if fields.UUID_V4.fullmatch(position.event_id) is None or claimed != digest:
        return Err(_invalid_cursor())
    return Ok(position)


def _position(document: Mapping[str, Any], digest: str) -> FerretResult[Position]:
    """The position of a canonical cursor document: its exact keys, this version, and a place in this query."""
    version = document.get("version")
    if tuple(document) != CURSOR_KEYS or type(version) is not int or version != CURSOR_VERSION:
        return Err(_invalid_cursor())
    return (
        _cursor_text(document, "occurredAt")
        .flat_map(_moment)
        .flat_map(
            lambda occurred_at: _cursor_text(document, "eventId").map(lambda event_id: Position(occurred_at, event_id))
        )
        .flat_map(lambda position: _resumable(position, document["filterDigest"], digest))
    )


def decode_cursor(token: str, digest: str) -> FerretResult[Position]:
    """The position ``token`` resumes after, provided it is a well-formed cursor of the query whose digest is given."""
    return _cursor_document(token).flat_map(lambda document: _position(document, digest))
