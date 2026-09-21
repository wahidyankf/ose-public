"""Deny every network access made in this process and record each attempt, so a test can prove there were none.

An audit hook sees a socket created, connected, or resolved anywhere, standard library included, so the denial cannot
be bypassed by a module that holds its own reference to ``socket``. Hooks cannot be removed, so one is installed once
and stays inert unless a denial is active.
"""

import sys
from collections.abc import Generator
from contextlib import contextmanager
from typing import Any, Final

NETWORK_EVENT_PREFIX: Final = "socket."

_denials: list[list[str]] = []
_installed = False


class NetworkDeniedError(OSError):
    """Raised at the moment code tries to reach a network while a denial is active."""


def _refuse(event: str, arguments: tuple[Any, ...]) -> None:
    if _denials and event.startswith(NETWORK_EVENT_PREFIX):
        _denials[-1].append(event)
        raise NetworkDeniedError(f"network access is denied: {event} {arguments!r}")


@contextmanager
def deny_network() -> Generator[list[str]]:
    """Refuse every network event until the block ends; the yielded list holds the events attempted, in order."""
    global _installed
    if not _installed:
        sys.addaudithook(_refuse)
        _installed = True
    attempts: list[str] = []
    _denials.append(attempts)
    try:
        yield attempts
    finally:
        _denials.pop()
