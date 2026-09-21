"""Shared fixtures: the built artifact under test and an isolated home directory for each test."""

import os
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BUILT_ARTIFACT = PROJECT_ROOT.parent / "ferret-cli" / "dist" / "ferret.pyz"


@pytest.fixture(scope="session")
def artifact() -> Path:
    """The zipapp produced by the owner's build, or the one named by FERRET_ARTIFACT."""
    path = Path(os.environ.get("FERRET_ARTIFACT", str(BUILT_ARTIFACT))).resolve()
    if not path.is_file():
        pytest.fail(f"no built artifact at {path}; run the ferret-cli build target first", pytrace=False)
    return path


@pytest.fixture
def home(tmp_path: Path) -> Path:
    """A private HOME so no test can read or write the developer's real FERRET data home."""
    directory = tmp_path / "home"
    directory.mkdir(mode=0o700)
    return directory


@pytest.fixture
def workdir(tmp_path: Path) -> Path:
    """An empty directory to run commands from, so a test can prove a command wrote nothing outside the data home."""
    directory = tmp_path / "workdir"
    directory.mkdir(mode=0o700)
    return directory


@pytest.fixture
def socket_log(tmp_path: Path) -> Path:
    """Where a process run with sockets denied notes each attempt; the file does not exist until one happens."""
    return tmp_path / "denied-sockets.log"
