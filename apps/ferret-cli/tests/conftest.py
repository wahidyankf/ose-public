"""Fixtures shared by every adapter of this project's tests."""

import signal
from collections.abc import Generator, Iterator

import pytest

from support.network import deny_network


@pytest.fixture(autouse=True)
def keep_broken_pipe_disposition() -> Iterator[None]:
    """A command run in process restores the default SIGPIPE disposition, which must not outlive the test.

    Left at the default, a later write to a closed pipe would kill the test runner instead of raising.
    """
    previous = signal.getsignal(signal.SIGPIPE)
    yield
    signal.signal(signal.SIGPIPE, previous)


@pytest.fixture
def network_attempts() -> Generator[list[str]]:
    """Refuse every network access the test makes; the list holds each attempt, and a test asserts it stays empty."""
    with deny_network() as attempts:
        yield attempts
