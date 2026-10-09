"""Capstone: pure transform functions -- validate and summarize inventory records.

No file I/O and no argparse here on purpose: every function in this module is pure,
which is exactly what makes it trivially unit-testable in tests/test_transform.py
without touching a filesystem or a CLI.
"""

from __future__ import annotations

import math
from typing import TypedDict


class InvalidRecordError(Exception):
    """Raised when an inventory record fails validation."""


class InventoryRecord(TypedDict):
    """One row of the input JSON: an item name, its count, and its unit price."""

    name: str
    quantity: int
    price: float


class SummaryRecord(TypedDict):
    """One row of the output JSON: the item name plus its computed total value."""

    name: str
    quantity: int
    total_value: float


def validate_records(records: object) -> list[InventoryRecord]:
    """Check the JSON shape and return typed, nonnegative records.

    A type hint on json.load would not validate its runtime data. This function
    narrows each field before constructing an InventoryRecord for the rest of the
    program to use.
    """
    if not isinstance(records, list):
        raise InvalidRecordError("expected a top-level JSON array")

    validated: list[InventoryRecord] = []
    for index, raw_record in enumerate(records, start=1):
        if not isinstance(raw_record, dict):
            raise InvalidRecordError(f"record {index} must be an object")

        name: object = raw_record.get("name")
        quantity: object = raw_record.get("quantity")
        price: object = raw_record.get("price")
        if not isinstance(name, str):
            raise InvalidRecordError(f"record {index} needs a string name")
        if isinstance(quantity, bool) or not isinstance(quantity, int):
            raise InvalidRecordError(f"record {index} needs an integer quantity")
        if quantity < 0:
            raise InvalidRecordError(f"{name!r} has a negative quantity")
        if isinstance(price, bool) or not isinstance(price, (int, float)):
            raise InvalidRecordError(f"record {index} needs a numeric price")
        try:
            numeric_price = float(price)
        except OverflowError as err:
            raise InvalidRecordError(f"record {index} needs a finite price") from err
        if not math.isfinite(numeric_price):
            raise InvalidRecordError(f"record {index} needs a finite price")
        if numeric_price < 0:
            raise InvalidRecordError(f"{name!r} has a negative price")

        validated.append({"name": name, "quantity": quantity, "price": numeric_price})
    return validated


def _total_value(record: InventoryRecord) -> float:
    """Compute one row, rejecting results outside the finite float range."""
    try:
        value = record["quantity"] * record["price"]
    except OverflowError as err:
        raise InvalidRecordError(f"{record['name']!r} needs a finite total") from err
    if not math.isfinite(value):
        raise InvalidRecordError(f"{record['name']!r} needs a finite total")
    return round(value, 2)


def summarize(records: list[InventoryRecord]) -> list[SummaryRecord]:
    """Compute each record's total value (quantity * price) via a comprehension."""
    return [
        {
            "name": record["name"],
            "quantity": record["quantity"],
            "total_value": _total_value(record),
            # => reject overflow before rounding; round is for display, not exact money arithmetic
        }
        for record in records  # => one comprehension replaces a build-up loop (Example 29's pattern)
    ]


def grand_total(summary: list[SummaryRecord]) -> float:
    """Sum every summary row's total_value -- a generator expression, not a loop."""
    total = sum(row["total_value"] for row in summary)
    # => sum(... for ...) is Example 33's generator-expression pattern, not a materialized list
    if not math.isfinite(total):
        raise InvalidRecordError("expected a finite grand total")
    return round(total, 2)
