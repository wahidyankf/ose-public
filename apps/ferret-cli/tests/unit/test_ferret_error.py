"""``FerretError`` as a value: one closed failure, no exception, that compares, hashes, and prints by its fields."""

import inspect
from dataclasses import FrozenInstanceError

import pytest

from ferret.domain.errors import FAILURES, ErrorCode, FerretError

REFERENCE = FerretError("ferret.storage.unavailable", field="outcome", retryable=True)


def test_a_ferret_error_is_a_value_and_no_exception() -> None:
    assert not issubclass(FerretError, BaseException)


def test_errors_with_the_same_code_field_and_retryable_flag_are_equal() -> None:
    twin = FerretError("ferret.storage.unavailable", field="outcome", retryable=True)

    assert twin == REFERENCE
    assert hash(twin) == hash(REFERENCE)


@pytest.mark.parametrize(
    "other",
    [
        FerretError("ferret.storage.integrity-failure", field="outcome", retryable=True),
        FerretError("ferret.storage.unavailable", field="durationMs", retryable=True),
        FerretError("ferret.storage.unavailable", field=None, retryable=True),
        FerretError("ferret.storage.unavailable", field="outcome", retryable=False),
    ],
    ids=["another-code", "another-field", "no-field", "not-retryable"],
)
def test_errors_that_differ_in_the_code_the_field_or_the_flag_are_not_equal(other: FerretError) -> None:
    assert other != REFERENCE


@pytest.mark.parametrize("attribute", ["code", "field", "retryable", "exit_code", "message"])
def test_an_attribute_write_is_refused(attribute: str) -> None:
    error = FerretError("ferret.args.invalid")

    with pytest.raises(FrozenInstanceError):
        setattr(error, attribute, "changed")

    assert error == FerretError("ferret.args.invalid")


@pytest.mark.parametrize("code", list(FAILURES))
def test_each_code_reports_the_exit_status_and_message_the_table_holds(code: ErrorCode) -> None:
    error = FerretError(code)

    assert (error.exit_code, error.message) == FAILURES[code]


def test_the_field_and_the_flag_default_to_no_field_and_not_retryable() -> None:
    error = FerretError("ferret.args.invalid")

    assert (error.field, error.retryable) == (None, False)


def test_the_field_and_the_flag_are_keyword_only() -> None:
    kinds = {name: parameter.kind for name, parameter in inspect.signature(FerretError).parameters.items()}

    assert kinds == {
        "code": inspect.Parameter.POSITIONAL_OR_KEYWORD,
        "field": inspect.Parameter.KEYWORD_ONLY,
        "retryable": inspect.Parameter.KEYWORD_ONLY,
    }


def test_its_text_form_names_the_code_the_field_and_the_flag_and_never_the_message() -> None:
    error = FerretError("ferret.event.invalid", field="prompt", retryable=True)

    expected = "FerretError(code='ferret.event.invalid', field='prompt', retryable=True)"
    assert (str(error), repr(error)) == (expected, expected)
