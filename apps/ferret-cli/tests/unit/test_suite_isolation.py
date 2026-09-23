"""The suite never reads or writes the caller's own FERRET data home.

The CLI honours ``FERRET_DATA_HOME``, ``XDG_DATA_HOME``, and ``HOME`` from the process environment, which is right
for a user and wrong for a test: a developer whose shell exports any of them to their real store would otherwise have
test noise written into it. The shared ``conftest.py`` points every one of them at a private scratch home for each
test; these tests fail if it stops doing so.
"""

import io
import os
from pathlib import Path

import pytest

from ferret import cli
from ferret.adapters.filesystem import resolve_data_home
from ferret.adapters.hook_failures import read_hook_failures
from ferret.adapters.system import home_directory


def ambient_data_home() -> Path:
    """The data home a command run in this process would resolve, exactly as the CLI resolves it."""
    return resolve_data_home(os.environ, home_directory(os.environ))


def test_the_ambient_data_home_is_a_private_scratch_directory_of_this_run(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    home = home_directory(os.environ)

    assert home.is_relative_to(tmp_path_factory.getbasetemp())
    assert ambient_data_home() == home / ".local" / "share" / "ferret"
    assert (home.stat().st_mode & 0o777) == 0o700


def test_a_callback_failure_recorded_in_process_lands_in_the_scratch_data_home() -> None:
    # The exact path that leaked: a usage mistake in the exempt callback records itself in whatever data home the
    # process environment names, and a test calls `main` without passing an environment of its own.
    data_home = ambient_data_home()
    data_home.mkdir(mode=0o700, parents=True)

    code = cli.main(["capture-hook"], stdout=io.StringIO(), stderr=io.StringIO(), handlers={})

    assert code == 0
    assert read_hook_failures(data_home)[0] == 1


def test_each_test_gets_its_own_scratch_home(tmp_path_factory: pytest.TempPathFactory) -> None:
    # Together with the test above, which left a record behind, this proves no state carries from one test to the
    # next: a fresh home holds no data home at all.
    assert not ambient_data_home().exists()
    assert home_directory(os.environ).is_relative_to(tmp_path_factory.getbasetemp())
