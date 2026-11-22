"""Unit checks for the harness scenarios the step bindings do not cover: install collision, purge confirmation,
interpreter selection and failure, process exits, help and version, Command Code status, and an escaped fault.

Each test runs the real function or command line over the fake machine, so each decision is production code.
"""

import io
import json
import signal
from collections.abc import Mapping
from datetime import timedelta
from typing import Any, TextIO

from ferret import __version__, cli
from ferret._bootstrap import EXIT_NOT_EXECUTABLE, OVERRIDE_VARIABLE, relaunch, unstartable
from support.fakes import FIXED_NOW
from support.invoke import Ran, run_cli
from support.populate import make_event, world_with
from support.retention import aged_snapshot


def error_code(ran: Ran) -> str:
    """The closed failure code of a refused command, which writes nothing to stdout."""
    assert ran.stdout == ""
    return json.loads(ran.stderr)["error"]["code"]


def installed_world(*events: Any) -> Any:
    """A fake machine with FERRET installed for the current user and the given telemetry stored."""
    world = world_with(*events)
    ran = run_cli(world, ["self", "install", "--target", "user", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    return world


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: self install reports ferret.install.collision when another file owns the launcher path
def test_self_install_reports_a_collision_when_another_file_owns_the_launcher() -> None:
    world = world_with()
    installer = world.installer
    installer.put_file(installer.paths.launcher, b"#!/bin/sh\n", 0o755)
    ran = run_cli(world, ["self", "install", "--target", "user", "--json"])
    assert (ran.code, error_code(ran)) == (2, "ferret.install.collision")
    # The refusal changes nothing: the foreign file is still there, and nothing was staged under the share directory.
    assert installer.nodes[installer.paths.launcher].content == b"#!/bin/sh\n"
    assert not any(path.is_relative_to(installer.paths.share) for path in installer.nodes)


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: self uninstall --purge-data --yes deletes the data home
def test_self_uninstall_purge_deletes_the_data_home() -> None:
    world = installed_world(make_event(1))
    ran = run_cli(world, ["self", "uninstall", "--purge-data", "--yes", "--json"])
    assert (ran.code, ran.stderr, json.loads(ran.stdout)["dataAction"]) == (0, "", "deleted")
    assert (world.files.purges, world.files.files) == (1, {})


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: self uninstall --purge-data without --yes refuses and keeps the data home
def test_self_uninstall_purge_without_yes_refuses_and_keeps_the_data_home() -> None:
    world = installed_world(make_event(1))
    before = {name: entry.content for name, entry in world.files.files.items()}
    ran = run_cli(world, ["self", "uninstall", "--purge-data", "--json"])
    assert (ran.code, error_code(ran)) == (2, "ferret.args.confirmation-required")
    assert world.files.purges == 0
    assert {name: entry.content for name, entry in world.files.files.items()} == before


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: FERRET_PYTHON names the interpreter to use outright
def test_ferret_python_names_the_interpreter_outright() -> None:
    started: list[list[str]] = []
    override = "/opt/named/python-with-no-path-entry"
    code = relaunch(
        "/store/ferret.pyz",
        ["version"],
        {OVERRIDE_VARIABLE: override, "PATH": "/nowhere"},
        required=(99, 0),
        execute=lambda interpreter, argv, environ: started.append(argv),
        report=lambda line: None,
        listdir=lambda directory: [],
        is_executable=lambda path: path == override,
    )
    # No PATH entry and no fallback directory holds an interpreter, so the named one is the only one that could run.
    assert (code, started) == (None, [[override, "/store/ferret.pyz", "version"]])


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: An interpreter that is found but cannot be started exits 126
def test_an_interpreter_found_but_unstartable_exits_126() -> None:
    reported: list[str] = []

    def refuse(interpreter: str, argv: list[str], environ: Mapping[str, str]) -> None:
        raise OSError(8, "Exec format error")

    code = relaunch(
        "/store/ferret.pyz",
        ["version"],
        {"PATH": "/found"},
        required=(99, 0),
        execute=refuse,
        report=reported.append,
        listdir=lambda directory: ["python99.0"] if directory == "/found" else [],
        is_executable=lambda path: True,
    )
    assert (code, EXIT_NOT_EXECUTABLE) == (126, 126)
    assert reported == [unstartable("/found/python99.0")]


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: A closed output pipe exits 141 and an interrupt exits 130
def test_a_closed_output_pipe_exits_141_and_an_interrupt_exits_130() -> None:
    # 141: a process that writes to standard output takes the default SIGPIPE disposition, so a closed pipe ends it.
    assert cli.main(["version"], stdout=io.StringIO(), stderr=io.StringIO()) == 0
    assert cli.main(["version"]) == 0
    assert signal.getsignal(signal.SIGPIPE) == signal.SIG_DFL

    # 130: an interrupt is a BaseException, so the entry point lets it end the process, not turn it into a code.
    def interrupted(request: cli.Request, stdout: TextIO, stderr: TextIO) -> Any:
        raise KeyboardInterrupt

    raised = False
    try:
        cli.run(["version"], stdout=io.StringIO(), stderr=io.StringIO(), handlers={("version",): interrupted})
    except KeyboardInterrupt:
        raised = True
    assert raised


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: ferret --help and ferret help list every command and exit status
def test_help_lists_every_command_and_every_exit_status() -> None:
    by_flag, by_word = io.StringIO(), io.StringIO()
    assert cli.main(["--help"], stdout=by_flag, stderr=io.StringIO()) == 0
    assert cli.main(["help"], stdout=by_word, stderr=io.StringIO()) == 0
    assert by_flag.getvalue() == by_word.getvalue()
    text = by_flag.getvalue()
    for spec in cli.COMMANDS:
        if spec.path != ("capture-hook",):
            assert " ".join(spec.path) in text
    for status in ("  0 ", "  1 ", "  2 ", "  126 ", "  128+N "):
        assert status in text


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: ferret version and --version print the version and exit 0
def test_version_and_flag_print_the_version_and_exit_zero() -> None:
    by_word, by_flag = io.StringIO(), io.StringIO()
    assert cli.main(["version"], stdout=by_word, stderr=io.StringIO()) == 0
    assert cli.main(["--version"], stdout=by_flag, stderr=io.StringIO()) == 0
    assert by_word.getvalue() == by_flag.getvalue() == f"ferret {__version__}\n"


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: status reports Command Code as probe_required
def test_status_reports_command_code_as_probe_required() -> None:
    # The same check as test_status.py::test_a_commandcode_adapter_reports_the_capabilities_its_snapshot_actually_states
    # (the Command Code support level is probe_required), restated as this scenario's own binding.
    world = world_with()
    world.capabilities.stored.append(aged_snapshot(1, now=FIXED_NOW, ago=timedelta(minutes=30), harness="commandcode"))
    ran = run_cli(world, ["status", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    [adapter] = [item for item in json.loads(ran.stdout)["adapters"] if item["harness"] == "commandcode"]
    assert adapter["platformSupport"] == "probe_required"


# @scenario specs/apps/ferret/cli/behaviours/harness/fail-open-capabilities-and-platforms.feature: An internal failure exits 2 with ferret.internal.failure
def test_an_internal_failure_escaping_the_command_line_exits_2() -> None:
    class BrokenStream(io.StringIO):
        def write(self, text: str) -> int:
            raise OSError("the output stream failed")

    err = io.StringIO()
    # The version line is written after parsing, outside the handler's own failure handling, so the fault escapes main.
    code = cli.run(["--version"], stdout=BrokenStream(), stderr=err)
    assert (code, err.getvalue()) == (2, "ferret: [ferret.internal.failure] FERRET failed internally\n")
