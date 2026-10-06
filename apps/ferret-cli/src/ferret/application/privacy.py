"""The privacy boundary: strict parsing of untrusted bytes, forbidden-field detection, and raw hook projection.

Nothing here echoes a rejected value. A failure carries a closed code and, at most, the name of a safe schema field or
a forbidden-field category, so a caller's prompt, response, tool arguments, transcript path, or environment never
reaches a diagnostic, a log, or storage.
"""

import json
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any, Final, cast

from typekit import Err, Ok, attempt

from ferret.domain.errors import FerretError, FerretResult
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


def _event_invalid(_cause: object) -> FerretError:
    """The one refusal of every unreadable input: no field, whatever made it unreadable."""
    return FerretError("ferret.event.invalid")


def _object(document: object, refused: list[str]) -> FerretResult[dict[str, Any]]:
    """``document`` when it is a JSON object and nothing was refused on the way to it."""
    if refused or not isinstance(document, dict):
        return Err(FerretError("ferret.event.invalid"))
    return Ok(cast(dict[str, Any], document))


def parse_object(raw: bytes, limit: int) -> FerretResult[dict[str, Any]]:
    """Decode exactly one JSON object from at most ``limit`` bytes, or an ``Err`` of ``invalid_event`` with no field.

    Oversized input, a byte order mark, invalid UTF-8, malformed or truncated JSON, trailing data, duplicate keys,
    non-finite numbers, runaway nesting, and any root other than an object are all refused.

    ``json.loads`` calls a hook for every object and every constant it reads, and a hook can only signal by raising,
    which this layer never does. So each hook records what it refused in ``refused``, which this function owns, and the
    result of the parse is judged once it is done. Every refusal has the same code, so the order they are met in is
    not observable.
    """
    if len(raw) > limit or raw.startswith(_BYTE_ORDER_MARK):
        return Err(FerretError("ferret.event.invalid"))
    refused: list[str] = []

    def keep_unique(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        document = dict(pairs)
        if len(document) != len(pairs):
            refused.append("duplicate key")
        return document

    def refuse_constant(_name: str) -> None:
        refused.append("non-finite number")

    def read() -> object:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=keep_unique, parse_constant=refuse_constant)

    return (
        attempt(read, ValueError, RecursionError)
        .map_err(_event_invalid)
        .flat_map(lambda document: _object(document, refused))
    )


def forbidden_category(document: Mapping[str, Any]) -> str | None:
    """The content category of the first top-level property that names one, or None when there is none."""
    for key in document:
        folded = "".join(character for character in key.casefold() if character.isalnum())
        category = _FORBIDDEN_CATEGORIES.get(folded)
        if category is not None:
            return category
    return None


def _without_content(document: dict[str, Any]) -> FerretResult[dict[str, Any]]:
    """``document`` when no top-level property of it names content, which is refused by category."""
    category = forbidden_category(document)
    if category is not None:
        return Err(FerretError("ferret.event.invalid", field=category))
    return Ok(document)


def validate_capture(raw: bytes, *, now: datetime) -> FerretResult[Event]:
    """Turn one already-canonical capture payload into an Event, or an ``Err`` of ``invalid_event``.

    The payload is size-checked and parsed strictly, a content-bearing property is refused by category before the
    schema is consulted, and the closed schema and hash are then verified. The identifiers are validated as opaque
    and never derived again.
    """
    return (
        parse_object(raw, CANONICAL_LIMIT_BYTES)
        .flat_map(_without_content)
        .flat_map(lambda document: event_from_document(document, now=now))
    )


def _projection(document: dict[str, Any], allowed_paths: Sequence[tuple[str, ...]]) -> dict[str, Scalar]:
    """The scalar at each allowlisted path of ``document``, keyed by the dotted path."""
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


def project_hook_payload(raw: bytes, allowed_paths: Sequence[tuple[str, ...]]) -> FerretResult[dict[str, Scalar]]:
    """Keep only the scalar values at the allowlisted paths of one raw harness payload, keyed by dotted path.

    A path that is absent, runs through a non-object, or ends at an object or array contributes nothing, so no
    nested content can slip through under an allowed name. A payload that is not one JSON object is an ``Err`` of
    ``invalid_event``.
    """
    return parse_object(raw, RAW_LIMIT_BYTES).map(lambda document: _projection(document, allowed_paths))
