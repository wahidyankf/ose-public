"""The privacy boundary: strict parsing of untrusted bytes, forbidden-field detection, and raw hook projection.

Nothing here echoes a rejected value. A failure carries a closed code and, at most, the name of a safe schema field or
a forbidden-field category, so a caller's prompt, response, tool arguments, transcript path, or environment never
reaches a diagnostic, a log, or storage.
"""

import json
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any, Final, cast

from ferret.domain.errors import FerretError
from ferret.domain.event import Event, event_from_document

CANONICAL_LIMIT_BYTES: Final = 16 * 1024
# A raw hook payload carries the whole tool result, and a tool whose result is an image carries the image itself as
# base64: a Codex ``view_image`` completion runs to 0.4-1.4 MB, so an earlier 256 KiB limit refused every one. The
# limit bounds one call's memory and time, not what a result may be; only the allowlisted scalars survive projection.
# Measured on a developer machine, a whole capture at the limit takes about 0.15 s and 220 MiB of memory, well inside
# the adapter's 900 ms deadline; a 1 MiB image takes 0.07 s and 35 MiB.
RAW_LIMIT_BYTES: Final = 64 * 1024 * 1024
_BYTE_ORDER_MARK: Final = b"\xef\xbb\xbf"

type Scalar = str | int | float | bool | None

# Property names that carry content, folded to lowercase letters and digits so ``tool_arguments``, ``toolArguments``,
# and ``tool-arguments`` are one spelling. Each maps to the category a diagnostic may name.
_FORBIDDEN_CATEGORIES: Final[Mapping[str, str]] = {
    "prompt": "prompt",
    "userprompt": "prompt",
    "systemprompt": "prompt",
    "initialprompt": "prompt",
    "response": "response",
    "toolresponse": "response",
    "toolresult": "response",
    "assistantresponse": "response",
    "toolarguments": "tool_arguments",
    "toolinput": "tool_arguments",
    "arguments": "tool_arguments",
    "args": "tool_arguments",
    "transcriptpath": "transcript_path",
    "transcript": "transcript_path",
    "environment": "environment",
    "env": "environment",
    "environmentvariables": "environment",
    "envvars": "environment",
}


def _reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    document: dict[str, Any] = {}
    for key, value in pairs:
        if key in document:
            raise ValueError("duplicate key")
        document[key] = value
    return document


def _reject_constant(_name: str) -> Any:
    raise ValueError("non-finite number")


def parse_object(raw: bytes, limit: int) -> dict[str, Any]:
    """Decode exactly one JSON object from at most ``limit`` bytes, or raise ``invalid_event`` with no field.

    Oversized input, a byte order mark, invalid UTF-8, malformed or truncated JSON, trailing data, duplicate keys,
    non-finite numbers, runaway nesting, and any root other than an object are all refused.
    """
    if len(raw) > limit or raw.startswith(_BYTE_ORDER_MARK):
        raise FerretError("ferret.event.invalid")
    try:
        document: object = json.loads(
            raw.decode("utf-8"), object_pairs_hook=_reject_duplicates, parse_constant=_reject_constant
        )
    except ValueError, RecursionError:
        raise FerretError("ferret.event.invalid") from None
    if not isinstance(document, dict):
        raise FerretError("ferret.event.invalid")
    return cast(dict[str, Any], document)


def forbidden_category(document: Mapping[str, Any]) -> str | None:
    """The content category of the first top-level property that names one, or None when there is none."""
    for key in document:
        folded = "".join(character for character in key.casefold() if character.isalnum())
        category = _FORBIDDEN_CATEGORIES.get(folded)
        if category is not None:
            return category
    return None


def validate_capture(raw: bytes, *, now: datetime) -> Event:
    """Turn one already-canonical capture payload into an Event, or raise ``invalid_event``.

    The payload is size-checked and parsed strictly, a content-bearing property is refused by category before the
    schema is consulted, and the closed schema and hash are then verified. The identifiers are validated as opaque
    and never derived again.
    """
    document = parse_object(raw, CANONICAL_LIMIT_BYTES)
    category = forbidden_category(document)
    if category is not None:
        raise FerretError("ferret.event.invalid", field=category)
    return event_from_document(document, now=now)


def project_hook_payload(raw: bytes, allowed_paths: Sequence[tuple[str, ...]]) -> dict[str, Scalar]:
    """Keep only the scalar values at the allowlisted paths of one raw harness payload, keyed by dotted path.

    A path that is absent, runs through a non-object, or ends at an object or array contributes nothing, so no
    nested content can slip through under an allowed name.
    """
    document = parse_object(raw, RAW_LIMIT_BYTES)
    projected: dict[str, Scalar] = {}
    for path in allowed_paths:
        value: Any = document
        for key in path:
            if not isinstance(value, dict) or key not in value:
                break
            value = cast(dict[str, Any], value)[key]
        else:
            if value is None or isinstance(value, (str, int, float, bool)):
                projected[".".join(path)] = value
    return projected
