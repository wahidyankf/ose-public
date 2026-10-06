"""Deterministic JSON bytes: the one serialization every hash in the shared data contract is computed over."""

import json
from typing import Any, cast

from typekit import Err, Ok, Result, attempt


def _exact_numbers(value: Any) -> Result[None, TypeError]:
    """Refuse a floating-point number anywhere in ``value``: the contract has integers only."""
    if isinstance(value, float):
        return Err(TypeError("floating-point numbers have no canonical form"))
    if isinstance(value, dict):
        members = cast(dict[str, Any], value).values()
    elif isinstance(value, list):
        members = cast(list[Any], value)
    else:
        return Ok(None)
    for item in members:
        refused = _exact_numbers(item)
        if isinstance(refused, Err):
            return refused
    return Ok(None)


def _dumped(value: Any) -> Result[str, TypeError]:
    """The compact JSON text of ``value``, or an ``Err`` when it holds a value JSON has no spelling for."""
    return attempt(lambda: json.dumps(value, separators=(",", ":"), ensure_ascii=False, allow_nan=False), TypeError)


def canonical_bytes(value: Any) -> Result[bytes, TypeError]:
    """Compact UTF-8 JSON in the caller's property order, or an ``Err`` of ``TypeError`` for a value it cannot spell.

    Only the quotation mark, the reverse solidus, and U+0000 through U+001F are escaped, with the short escape where
    JSON defines one and a lowercase four-digit ``\\u00xx`` otherwise. Every other scalar is emitted directly. A
    floating-point number anywhere in ``value`` is the ``Err``; a value nested deeper than the interpreter allows
    still raises ``RecursionError``, which the caller that reads an untrusted document handles.
    """
    return _exact_numbers(value).flat_map(lambda _: _dumped(value)).map(lambda document: document.encode("utf-8"))
