"""Fixtures shared by every adapter of this project's tests."""

import signal
from collections.abc import Generator, Iterator
from pathlib import Path

import pytest

from support.network import deny_network


@pytest.fixture(autouse=True)
def isolated_home(tmp_path_factory: pytest.TempPathFactory, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Give every test a private, empty HOME and clear both data-home overrides.

    The CLI resolves its data home from ``FERRET_DATA_HOME``, then ``XDG_DATA_HOME``, then ``HOME``, and a test that
    calls it without an environment of its own -- in process, or in a child that inherits this one -- would otherwise
    read and write the caller's real store. The home sits outside ``tmp_path`` so tests that inspect their own
    directory never see it, and a test that sets any of these variables itself still wins.
    """
    home = tmp_path_factory.mktemp("isolated") / "home"
    home.mkdir(mode=0o700)
    monkeypatch.setenv("HOME", str(home))
    monkeypatch.delenv("FERRET_DATA_HOME", raising=False)
    monkeypatch.delenv("XDG_DATA_HOME", raising=False)
    return home


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
