"""Run the command line in process against a fake machine and keep exactly what it wrote to each stream."""

import io
from collections.abc import Sequence
from typing import NamedTuple

from ferret import cli
from ferret.application.ports import Runtime
from ferret.commands import build_handlers
from support.fakes import World


class Ran(NamedTuple):
    """One invocation's exit code and the complete text of its two output streams."""

    code: int
    stdout: str
    stderr: str


def run_cli(world: World, argv: Sequence[str]) -> Ran:
    """Invoke ``ferret`` with ``argv`` over ``world``'s ports."""
    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(list(argv), stdout=stdout, stderr=stderr, handlers=build_handlers(lambda: world.runtime))
    return Ran(code, stdout.getvalue(), stderr.getvalue())


def run_runtime(runtime: Runtime, argv: Sequence[str]) -> Ran:
    """Invoke ``ferret`` with ``argv`` over an explicit runtime, for a test that swaps one port for a failing one."""
    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(list(argv), stdout=stdout, stderr=stderr, handlers=build_handlers(lambda: runtime))
    return Ran(code, stdout.getvalue(), stderr.getvalue())
