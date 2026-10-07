"""The closed failure contract: every code, its exit status, and the fixed value-free message it carries."""

from collections.abc import Mapping
from dataclasses import KW_ONLY, dataclass
from typing import Literal

from typekit import Result

#: The run happened and the answer was affirmative.
EXIT_SUCCESS = 0
#: The run happened and the answer was negative: a query that legitimately matched nothing.
#:
#: Separate from ``EXIT_SUCCESS`` because a caller that cannot tell an empty answer from a satisfied one has to
#: parse the payload to find out, and separate from ``EXIT_CALLER_ERROR`` because nothing went wrong.
EXIT_NEGATIVE_RESULT = 1
#: FERRET did not get as far as an answer: the invocation, the environment, or the stored data was unusable.
#:
#: This one status replaces the three FERRET used to return. The distinctions they drew -- caller, environment,
#: integrity -- are real, and they live in ``error.code``, which is where a caller can branch on them without
#: every consumer having to learn a status vocabulary unique to this tool.
EXIT_CALLER_ERROR = 2

type ErrorCode = Literal[
    "ferret.args.invalid",
    "ferret.args.confirmation-required",
    "ferret.filter.invalid",
    "ferret.cursor.invalid",
    "ferret.event.invalid",
    "ferret.event.idempotency-conflict",
    "ferret.storage.uninitialized",
    "ferret.storage.unsafe",
    "ferret.storage.unavailable",
    "ferret.storage.integrity-failure",
    "ferret.install.collision",
    "ferret.install.ownership-mismatch",
    "ferret.internal.failure",
]

# One row per closed code: (exit status, message). No message carries a rejected value, so a caller's raw
# input, a path, or a payload can never reach a diagnostic.
FAILURES: Mapping[ErrorCode, tuple[int, str]] = {
    "ferret.args.invalid": (EXIT_CALLER_ERROR, "unrecognized or incomplete arguments"),
    "ferret.args.confirmation-required": (EXIT_CALLER_ERROR, "purging data requires --yes"),
    "ferret.filter.invalid": (EXIT_CALLER_ERROR, "a filter value is not valid"),
    "ferret.cursor.invalid": (EXIT_CALLER_ERROR, "the cursor is not valid for this query"),
    "ferret.event.invalid": (EXIT_CALLER_ERROR, "the event is not a valid FERRET event"),
    "ferret.event.idempotency-conflict": (
        EXIT_CALLER_ERROR,
        "an event with this ID already exists with different content",
    ),
    "ferret.storage.uninitialized": (EXIT_CALLER_ERROR, "FERRET is not initialized"),
    "ferret.storage.unsafe": (EXIT_CALLER_ERROR, "the data home is not private to the current user"),
    "ferret.storage.unavailable": (EXIT_CALLER_ERROR, "storage is unavailable"),
    "ferret.storage.integrity-failure": (EXIT_CALLER_ERROR, "the database failed its integrity check"),
    "ferret.install.collision": (EXIT_CALLER_ERROR, "a file that FERRET does not own is in the way"),
    "ferret.install.ownership-mismatch": (
        EXIT_CALLER_ERROR,
        "the installed files no longer match the FERRET manifest",
    ),
    "ferret.internal.failure": (EXIT_CALLER_ERROR, "FERRET failed internally"),
}

# Advice is kept out of the message on purpose. A diagnostic states what is wrong; what to do about it goes
# on a following line, so a caller matching on the message is never matching on a suggestion that may change.
ADVICE: Mapping[ErrorCode, str] = {
    "ferret.args.invalid": "try 'ferret --help' for usage",
    "ferret.storage.uninitialized": "try 'ferret init'",
}


@dataclass(frozen=True, slots=True)
class FerretError:
    """One closed failure, a value and no exception. It carries a code, never an input value.

    ``field`` names a property of the FERRET contract, never what a caller sent, and the exit status and message are
    looked up from the code, so neither the error nor its text form (the code, the field, and the flag) holds one.
    """

    code: ErrorCode
    _: KW_ONLY
    field: str | None = None
    retryable: bool = False

    @property
    def exit_code(self) -> int:
        """The exit status ``FAILURES`` holds for the code."""
        return FAILURES[self.code][0]

    @property
    def message(self) -> str:
        """The fixed, value-free message ``FAILURES`` holds for the code."""
        return FAILURES[self.code][1]


#: What a fallible FERRET function returns: its value, or the one closed failure that stopped it.
type FerretResult[T] = Result[T, FerretError]


def as_internal_failure(_cause: object) -> FerretError:
    """The closed failure for a defect no input reaches, whatever its cause: for ``map_err`` to turn a cause into."""
    return FerretError("ferret.internal.failure")
