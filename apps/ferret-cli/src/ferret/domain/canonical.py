"""Deterministic JSON bytes: the one serialization every hash in the shared data contract is computed over."""

import json
from typing import Any, cast


def _require_exact_numbers(value: Any) -> None:
    """Refuse a floating-point number anywhere in ``value``: the contract has integers only."""
    if isinstance(value, float):
        raise TypeError("floating-point numbers have no canonical form")
    if isinstance(value, dict):
        for item in cast(dict[str, Any], value).values():
            _require_exact_numbers(item)
    elif isinstance(value, list):
        for item in cast(list[Any], value):
            _require_exact_numbers(item)


def canonical_bytes(value: Any) -> bytes:
    """Compact UTF-8 JSON in the caller's property order.

    Only the quotation mark, the reverse solidus, and U+0000 through U+001F are escaped, with the short escape where
    JSON defines one and a lowercase four-digit ``\\u00xx`` otherwise. Every other scalar is emitted directly.
    """
    _require_exact_numbers(value)
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode("utf-8")
