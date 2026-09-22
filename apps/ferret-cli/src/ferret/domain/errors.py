"""The closed failure contract: every code, its exit status, and the fixed value-free message it carries."""

from collections.abc import Mapping
from typing import Literal

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
    "ferret.args.invalid": (EXIT_CALLER_ERROR, "unrecognized or incomplete arguments; run 'ferret --help' for usage"),
    "ferret.args.confirmation-required": (EXIT_CALLER_ERROR, "purging data requires --yes"),
    "ferret.filter.invalid": (EXIT_CALLER_ERROR, "a filter value is not valid"),
    "ferret.cursor.invalid": (EXIT_CALLER_ERROR, "the cursor is not valid for this query"),
    "ferret.event.invalid": (EXIT_CALLER_ERROR, "the event is not a valid FERRET event"),
    "ferret.event.idempotency-conflict": (
        EXIT_CALLER_ERROR,
        "an event with this ID already exists with different content",
    ),
    "ferret.storage.uninitialized": (EXIT_CALLER_ERROR, "FERRET is not initialized; run 'ferret init'"),
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


class FerretError(Exception):
    """One closed failure. It carries a code, never a value: the message is fixed per code."""

    def __init__(self, code: ErrorCode, *, field: str | None = None, retryable: bool = False) -> None:
        exit_code, message = FAILURES[code]
        super().__init__(message)
        self.code: ErrorCode = code
        self.exit_code = exit_code
        self.message = message
        self.field = field
        self.retryable = retryable
