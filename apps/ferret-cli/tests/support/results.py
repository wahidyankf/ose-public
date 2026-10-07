"""Taking a ``typekit.Result`` apart in a test: the value an ``Ok`` carries, or what an ``Err`` carries."""

from collections.abc import Iterable

from typekit import Err, Ok, Result

from ferret.domain.errors import ErrorCode, FerretError, FerretResult


def value_of[T](result: Result[T, object]) -> T:
    """The value an ``Ok`` carries; an ``Err`` fails the test."""
    assert isinstance(result, Ok), f"expected an Ok, got {result!r}"
    return result.value


def values_of[T](results: Iterable[Result[T, object]]) -> tuple[T, ...]:
    """The value each ``Ok`` of a stream carries, in order; the first ``Err`` fails the test."""
    return tuple(value_of(result) for result in results)


def refusal_of(result: FerretResult[object]) -> FerretError:
    """The ``FerretError`` an ``Err`` carries; an ``Ok`` fails the test."""
    assert isinstance(result, Err), f"expected an Err, got {result!r}"
    return result.error


def refused(result: FerretResult[object]) -> tuple[ErrorCode, bool]:
    """The code and the retryable flag of the refusal an ``Err`` carries; an ``Ok`` fails the test."""
    refusal = refusal_of(result)
    return (refusal.code, refusal.retryable)


def fault_of(result: Result[object, Exception]) -> str:
    """The message of the exception an ``Err`` carries; an ``Ok`` fails the test."""
    assert isinstance(result, Err), f"expected an Err, got {result!r}"
    return str(result.error)
