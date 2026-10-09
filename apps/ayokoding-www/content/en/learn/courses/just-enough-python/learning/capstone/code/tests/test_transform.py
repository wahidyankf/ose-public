"""Capstone: pytest coverage for the pure functions in app.transform."""

import pytest

from app.transform import (
    InvalidRecordError,
    InventoryRecord,
    SummaryRecord,
    grand_total,
    summarize,
    validate_records,
)


def test_validate_records_accepts_clean_data() -> None:
    records: list[InventoryRecord] = [{"name": "widget", "quantity": 2, "price": 5.0}]
    assert validate_records(records) == records


def test_validate_records_rejects_negative_quantity() -> None:
    records: list[InventoryRecord] = [{"name": "widget", "quantity": -1, "price": 5.0}]
    with pytest.raises(InvalidRecordError):
        validate_records(records)


@pytest.mark.parametrize(
    ("records", "message"),
    [
        ({"name": "widget"}, "top-level JSON array"),
        ([{"name": "widget", "quantity": 1}], "price"),
        ([{"name": "widget", "quantity": True, "price": 2.5}], "quantity"),
        ([{"name": "widget", "quantity": 1, "price": True}], "price"),
        ([{"name": "widget", "quantity": 1, "price": "2.5"}], "price"),
        ([{"name": "widget", "quantity": 1, "price": -2.5}], "negative price"),
        ([{"name": "widget", "quantity": 1, "price": float("nan")}], "finite price"),
        ([{"name": "widget", "quantity": 1, "price": 10**400}], "finite price"),
    ],
)
def test_validate_records_rejects_invalid_json_shape(
    records: object, message: str
) -> None:
    with pytest.raises(InvalidRecordError, match=message):
        validate_records(records)


def test_summarize_computes_total_value() -> None:
    records: list[InventoryRecord] = [{"name": "widget", "quantity": 3, "price": 2.5}]
    assert summarize(records) == [{"name": "widget", "quantity": 3, "total_value": 7.5}]


def test_summarize_rejects_nonfinite_total() -> None:
    records: list[InventoryRecord] = [{"name": "widget", "quantity": 2, "price": 1e308}]
    with pytest.raises(InvalidRecordError, match="finite total"):
        summarize(records)


def test_grand_total_sums_every_row() -> None:
    summary: list[SummaryRecord] = [
        {"name": "widget", "quantity": 3, "total_value": 7.5},
        {"name": "gadget", "quantity": 1, "total_value": 12.0},
    ]
    assert grand_total(summary) == 19.5


def test_grand_total_rejects_nonfinite_sum() -> None:
    summary: list[SummaryRecord] = [
        {"name": "a", "quantity": 1, "total_value": 1e308},
        {"name": "b", "quantity": 1, "total_value": 1e308},
    ]
    with pytest.raises(InvalidRecordError, match="finite grand total"):
        grand_total(summary)
