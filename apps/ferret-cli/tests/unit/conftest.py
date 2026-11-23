"""Fixtures for the unit tests: the network is denied around each one, and a stand-in repository is offered."""

from collections.abc import Iterator
from pathlib import Path

import pytest

from support.network import deny_network


@pytest.fixture(autouse=True)
def network_denied() -> Iterator[list[str]]:
    """Deny the network around every unit test (C12, C21), so no unit test can reach it even through a swallowed error.

    The list holds each attempt; an attempt the code under test caught and carried on from still fails the test here.
    """
    with deny_network() as attempts:
        yield attempts
    assert attempts == [], f"the unit test attempted network access: {attempts}"


@pytest.fixture
def repository(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """A stand-in repository root: the helpers resolve every repository-relative path against the working directory."""
    monkeypatch.chdir(tmp_path)
    return tmp_path
