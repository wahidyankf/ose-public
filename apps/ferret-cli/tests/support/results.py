"""Taking a ``typekit.Result`` apart in a test: the value an ``Ok`` carries, or the refusal an ``Err`` carries."""

from typekit import Err, Ok, Result

from ferret.domain.errors import FerretError, FerretResult


def value_of[T](result: Result[T, object]) -> T:
    """The value an ``Ok`` carries; an ``Err`` fails the test."""
    assert isinstance(result, Ok), f"expected an Ok, got {result!r}"
    return result.value


def refusal_of(result: FerretResult[object]) -> FerretError:
    """The ``FerretError`` an ``Err`` carries; an ``Ok`` fails the test."""
    assert isinstance(result, Err), f"expected an Err, got {result!r}"
    return result.error
