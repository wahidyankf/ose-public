"""Fixtures for the unit tests that run the real artifact from a stand-in repository."""

from pathlib import Path

import pytest

import build_zipapp

SOURCE = Path(__file__).resolve().parents[2] / "src"


@pytest.fixture(scope="session")
def artifact(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The real FERRET artifact, built once per run from the current sources."""
    target = tmp_path_factory.mktemp("artifact") / "ferret.pyz"
    build_zipapp.build(SOURCE, target)
    return target


@pytest.fixture
def repository(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """A stand-in repository root: the helpers resolve every repository-relative path against the working directory."""
    monkeypatch.chdir(tmp_path)
    return tmp_path
