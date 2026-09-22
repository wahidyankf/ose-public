"""Field validators shared by every canonical document: NFC text, patterns, closed sets, and bounded timestamps.

A rejected field raises ``invalid_event`` naming only the schema field, never the offending value. That one closed code
serves events and capability snapshots alike, because the failure contract has no other invalid-document code.
"""

import re
import unicodedata
from datetime import datetime, timedelta
from typing import Final

from ferret.domain.errors import FerretError
from ferret.domain.timestamps import parse_timestamp

FUTURE_SKEW: Final = timedelta(hours=24)
MAX_NAME_LENGTH: Final = 128

UUID_V4: Final = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}")
HARNESS: Final = re.compile(r"[a-z][a-z0-9_]{0,31}")
HARNESS_VERSION: Final = re.compile(r"[A-Za-z0-9._+\-]{1,64}")
HASH: Final = re.compile(r"[0-9a-f]{64}")
WORKSPACE_ID: Final = re.compile(r"ws_[0-9a-f]{32}")
_NAME: Final = re.compile(r"[\w.:\-]+")
_LOGICAL_NAME: Final = re.compile(r"[\w.:\-]+(?:/[\w.:\-]+)*")


def invalid(field: str | None) -> FerretError:
    return FerretError("ferret.event.invalid", field=field)


def text(value: object, field: str) -> str:
    """A string normalized to NFC; any other JSON type is refused."""
    if not isinstance(value, str):
        raise invalid(field)
    return unicodedata.normalize("NFC", value)


def is_name(value: str, *, logical: bool) -> bool:
    """Whether NFC text is a bounded identifier of letters, digits, and ``- _ . :``, split by ``/`` when logical.

    A colon directly before a slash is a drive letter or a URI scheme, never a logical identifier, and a ``.`` or
    ``..`` segment is a path traversal, so both are refused along with a leading, trailing, or doubled slash.
    """
    pattern = _LOGICAL_NAME if logical else _NAME
    if len(value) > MAX_NAME_LENGTH or pattern.fullmatch(value) is None or ":/" in value:
        return False
    return all(segment not in {".", ".."} for segment in value.split("/"))


def matching(value: object, field: str, pattern: re.Pattern[str]) -> str:
    normalized = text(value, field)
    if pattern.fullmatch(normalized) is None:
        raise invalid(field)
    return normalized


def optional(value: object, field: str, pattern: re.Pattern[str]) -> str | None:
    return None if value is None else matching(value, field, pattern)


def member(value: object, field: str, allowed: frozenset[str]) -> str:
    normalized = text(value, field)
    if normalized not in allowed:
        raise invalid(field)
    return normalized


def timestamp(value: object, field: str, now: datetime) -> str:
    """A canonical UTC timestamp no more than a day ahead of ``now``."""
    normalized = text(value, field)
    try:
        moment = parse_timestamp(normalized)
    except ValueError:
        raise invalid(field) from None
    if moment > now + FUTURE_SKEW:
        raise invalid(field)
    return normalized
