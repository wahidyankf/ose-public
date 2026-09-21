"""The closed failure contract: every code, its exit status, and the fixed value-free message it carries."""

from collections.abc import Mapping
from typing import Literal

EXIT_SUCCESS = 0
EXIT_CALLER_ERROR = 2
EXIT_ENVIRONMENT_ERROR = 3
EXIT_INTEGRITY_FAILURE = 4

type ErrorCode = Literal[
    "invalid_arguments",
    "invalid_filter",
    "invalid_cursor",
    "invalid_event",
    "idempotency_conflict",
    "confirmation_required",
    "uninitialized",
    "unsafe_storage",
    "storage_unavailable",
    "install_collision",
    "install_ownership_mismatch",
    "integrity_failure",
]

# One row per closed code: (exit status, message). No message carries a rejected value, so a caller's raw
# input, a path, or a payload can never reach a diagnostic.
FAILURES: Mapping[ErrorCode, tuple[int, str]] = {
    "invalid_arguments": (EXIT_CALLER_ERROR, "unrecognized or incomplete arguments; run 'ferret --help' for usage"),
    "invalid_filter": (EXIT_CALLER_ERROR, "a filter value is not valid"),
    "invalid_cursor": (EXIT_CALLER_ERROR, "the cursor is not valid for this query"),
    "invalid_event": (EXIT_CALLER_ERROR, "the event is not a valid FERRET event"),
    "idempotency_conflict": (EXIT_CALLER_ERROR, "an event with this ID already exists with different content"),
    "confirmation_required": (EXIT_CALLER_ERROR, "purging data requires --yes"),
    "uninitialized": (EXIT_ENVIRONMENT_ERROR, "FERRET is not initialized; run 'ferret init'"),
    "unsafe_storage": (EXIT_ENVIRONMENT_ERROR, "the data home is not private to the current user"),
    "storage_unavailable": (EXIT_ENVIRONMENT_ERROR, "storage is unavailable"),
    "install_collision": (EXIT_ENVIRONMENT_ERROR, "a file that FERRET does not own is in the way"),
    "install_ownership_mismatch": (EXIT_ENVIRONMENT_ERROR, "the installed files no longer match the FERRET manifest"),
    "integrity_failure": (EXIT_INTEGRITY_FAILURE, "the database failed its integrity check"),
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
