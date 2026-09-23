"""The suite never hands a child process the developer's own FERRET data home.

A child that inherits this process's environment resolves its data home from ``FERRET_DATA_HOME``, then
``XDG_DATA_HOME``, then ``HOME``. The shared ``conftest.py`` points them at a private scratch home for each test;
this fails if it stops doing so.
"""

import os
import subprocess
import sys
from pathlib import Path

import pytest


def test_a_child_that_inherits_the_environment_sees_only_a_private_scratch_home(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    program = "import os; print(os.environ.get('FERRET_DATA_HOME')); print(os.environ.get('XDG_DATA_HOME'))"

    ran = subprocess.run([sys.executable, "-c", program], capture_output=True, text=True, check=True)
    home = Path(os.environ["HOME"])

    assert ran.stdout.splitlines() == ["None", "None"]
    assert home.is_relative_to(tmp_path_factory.getbasetemp())
    assert (home.stat().st_mode & 0o777) == 0o700
