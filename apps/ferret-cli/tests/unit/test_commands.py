"""The command handlers: one use-case call and one rendered result per request, over a fake machine."""

import io
import json
from dataclasses import dataclass
from pathlib import Path

import pytest

from ferret import __version__, cli
from ferret.application.ports import Runtime
from ferret.commands import build_handlers, default_handlers
from ferret.domain.errors import FerretError
from support.fakes import FAKE_DATA_HOME, INSTALLATION_ID, World, make_world

INIT_JSON_CREATED = (
    '{"schemaVersion":1,"command":"init","exitCode":0,"result":"created","dataHome":"/users/example/.local/share/ferret",'
    '"databasePath":"/users/example/.local/share/ferret/ferret.sqlite3","schemaNumber":1,'
    f'"installationId":"{INSTALLATION_ID}","retentionDays":30,"permissionsState":"private"}}\n'
)
INIT_TEXT_CREATED = f"""\
FERRET init: created
Data home: {FAKE_DATA_HOME}
Database: {FAKE_DATA_HOME}/ferret.sqlite3
Schema: 1
Installation: {INSTALLATION_ID}
Retention days: 30
Permissions: private
"""


@dataclass(frozen=True, slots=True)
class Outcome:
    code: int
    stdout: str
    stderr: str


def run(argv: list[str], world: World) -> Outcome:
    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(argv, stdout=stdout, stderr=stderr, handlers=build_handlers(lambda: world.runtime))
    return Outcome(code, stdout.getvalue(), stderr.getvalue())


def test_init_json_is_the_frozen_success_object_and_repeats_as_already_initialized() -> None:
    world = make_world()

    assert run(["init", "--json"], world) == Outcome(0, INIT_JSON_CREATED, "")

    again = run(["init", "--json"], world)
    assert again.code == 0
    assert again.stderr == ""
    assert json.loads(again.stdout) == {**json.loads(INIT_JSON_CREATED), "result": "already_initialized"}


def test_init_text_is_the_frozen_human_output() -> None:
    assert run(["init"], make_world()) == Outcome(0, INIT_TEXT_CREATED, "")


def test_output_json_and_the_json_shorthand_are_the_same_result() -> None:
    assert run(["init", "--output", "json"], make_world()).stdout == INIT_JSON_CREATED
    assert run(["--json", "init"], make_world()).stdout == INIT_JSON_CREATED


@pytest.mark.parametrize("output", [[], ["--json"]])
def test_a_closed_failure_keeps_its_code_and_exit_status_and_carries_no_value(output: list[str]) -> None:
    world = make_world()
    run(["init"], world)
    assert world.files.directory is not None
    world.files.directory.mode = 0o755

    outcome = run(["init", *output], world)

    assert outcome.code == 2
    assert outcome.stdout == ""
    assert str(FAKE_DATA_HOME) not in outcome.stderr
    if output:
        assert json.loads(outcome.stderr) == {
            "schemaVersion": 1,
            "command": "init",
            "exitCode": 2,
            "error": {
                "code": "ferret.storage.unsafe",
                "message": "the data home is not private to the current user",
                "field": None,
                "retryable": False,
            },
        }
    else:
        assert outcome.stderr == "ferret: [ferret.storage.unsafe] the data home is not private to the current user\n"


def test_a_retryable_failure_says_so() -> None:
    def busy() -> Runtime:
        raise FerretError("ferret.storage.unavailable", retryable=True)

    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(["init", "--json"], stdout=stdout, stderr=stderr, handlers=build_handlers(busy))

    assert code == 2
    assert stdout.getvalue() == ""
    assert json.loads(stderr.getvalue())["error"] == {
        "code": "ferret.storage.unavailable",
        "message": "storage is unavailable",
        "field": None,
        "retryable": True,
    }


def test_a_field_named_failure_reports_the_safe_field() -> None:
    def invalid() -> Runtime:
        raise FerretError("ferret.event.invalid", field="toolName")

    stderr = io.StringIO()
    code = cli.main(["init", "--json"], stdout=io.StringIO(), stderr=stderr, handlers=build_handlers(invalid))

    assert code == 2
    assert json.loads(stderr.getvalue())["error"] == {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": "toolName",
        "retryable": False,
    }


def test_the_runtime_is_only_built_for_a_command_that_needs_it() -> None:
    def forbidden() -> Runtime:
        raise AssertionError("version must not build a runtime")

    stdout = io.StringIO()
    code = cli.main(["version"], stdout=stdout, stderr=io.StringIO(), handlers=build_handlers(forbidden))

    assert (code, stdout.getvalue()) == (0, f"ferret {__version__}\n")


def test_the_default_registry_wires_the_implemented_commands() -> None:
    assert set(default_handlers()) == {
        ("version",),
        ("init",),
        ("capture",),
        ("capture-hook",),
        ("events", "list"),
        ("events", "export"),
        ("usage",),
        ("outcomes",),
        ("status",),
        ("maintenance",),
        ("self", "install"),
        ("self", "uninstall"),
    }


def test_the_callback_swallows_a_fault_that_is_not_a_closed_failure_and_still_exits_zero(tmp_path: Path) -> None:
    # A bug in FERRET itself, on the one command a harness runs for every event: it may not speak and it may not
    # take a status a harness would read as trouble, so all that is left is the record -- and here even that
    # cannot be written, because what broke is the runtime the recorder would need.
    def broken() -> Runtime:
        raise RuntimeError("a fault the closed contract does not name")

    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(
        ["capture-hook", "--harness", "claude_code", "--event", "session-start"],
        stdout=stdout,
        stderr=stderr,
        handlers=build_handlers(broken),
    )

    assert (code, stdout.getvalue(), stderr.getvalue()) == (0, "", "")


def test_the_callback_records_the_closed_failure_it_swallowed() -> None:
    # A payload the mapper cannot read, which is a lost event and the kind of loss the callback may not report
    # any other way.
    world = make_world()

    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(
        ["capture-hook", "--harness", "claude_code", "--event", "session-start"],
        stdout=stdout,
        stderr=stderr,
        handlers=build_handlers(lambda: world.runtime),
    )

    assert (code, stdout.getvalue(), stderr.getvalue()) == (0, "", "")
    assert world.hook_failures.records == [("2026-09-18T08:00:00Z", "ferret.event.invalid")]
