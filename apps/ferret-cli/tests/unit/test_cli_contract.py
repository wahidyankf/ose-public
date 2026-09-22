"""The command grammar, the help and version surface, and the closed failure contract, in process."""

import io
import json
import signal
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import TextIO

import pytest

from ferret import __version__, cli
from ferret.cli import COMMANDS, GROUPS, SPECS, CommandPath, Request
from ferret.help_text import COMMAND_HELP, ROOT_HELP

PROJECT_ROOT = Path(__file__).resolve().parents[2]

GOLDEN_ROOT_HELP = """\
usage: ferret <command> [options]

Local-first telemetry for coding-agent harnesses. Metadata only: never prompts,
responses, tool arguments, transcripts, or environment values.

commands:
  init                create the private data home, identity, and schema
  capture             store one canonical event read from stdin
  capture-hook        map one raw harness payload; always fails open
  status              report paths, runtime, storage, health, and adapters
  events list         list retained events, newest first
  events export       write retained events to stdout as JSON Lines
  usage               count observed activity by dimension
  outcomes            summarise operational outcomes by dimension
  maintenance         apply retention, checkpoint, and measure space
  self install        install the artifact for the current user
  self uninstall      remove the artifact; data is kept unless purged

  version             print the version and exit
  help                show this help and exit

options:
  -h, --help          show this help and exit
  -V, --version       show the version and exit
  --output <text|json>
                      render the result as text or JSON; defaults to text
  --json              shorthand for --output json

exit codes:
  0                   the command ran and the answer was affirmative
  1                   the command ran and a query matched nothing
  2                   FERRET could not run: the invocation, the environment,
                      or the stored data was unusable; see error.code
  126                 an interpreter was found and could not be started
  128+N               ended by signal N; 130 is an interrupt, 141 a closed pipe

Telemetry older than 30 days is never returned. Scripts should use --json.
Run 'ferret <command> --help' for a command's options.
"""

GOLDEN_EXPORT_HELP = """\
usage: ferret events export [filters] --format jsonl

Write retained events to stdout as JSON Lines, oldest first by (occurredAt,
eventId). An empty result is zero bytes.

options:
  -h, --help           show this help and exit
  --format jsonl       output format; jsonl is the only accepted value
                       (--output and --json are rejected; stdout is the data)
  --from <timestamp>   inclusive RFC 3339 UTC lower bound
  --to <timestamp>     exclusive RFC 3339 UTC upper bound
  --all-time           ignore the default seven-day window
  --harness <slug>     filter by harness
  --workspace <id>     filter by opaque workspace ID
  --event-type <type>  filter by event type
  --agent <name>       filter by agent name
  --skill <name>       filter by skill name
  --tool <name>        filter by tool name
  --outcome <outcome>  filter by outcome
"""

BARE_USAGE = "usage: ferret <command> [options]\nRun 'ferret --help' for the commands and options.\n"
INVALID_ARGUMENTS_TEXT = (
    "FERRET error [ferret.args.invalid]: unrecognized or incomplete arguments; run 'ferret --help' for usage\n"
)
LEAK_CANARY = "canary-value-that-must-never-be-echoed"


@dataclass(frozen=True, slots=True)
class Result:
    code: int
    stdout: str
    stderr: str


def run(argv: list[str], handlers: dict[CommandPath, cli.Handler] | None = None) -> Result:
    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(argv, stdout=stdout, stderr=stderr, handlers=handlers)
    return Result(code, stdout.getvalue(), stderr.getvalue())


def minimal_arguments(path: CommandPath) -> list[str]:
    """The smallest invocation of a command: its required options, each with a value its choices allow."""
    spec = SPECS[path]
    choices = spec.choices or {}
    arguments = list(path)
    for option in spec.required:
        arguments += [option, choices[option][0] if option in choices else "value"]
    return arguments


def recorded(argv: list[str]) -> Request:
    """Run a command whose handler only records the parsed request."""
    seen: list[Request] = []

    def record(request: Request, stdout: object, stderr: object) -> int:
        seen.append(request)
        return 0

    path = cli.parse_arguments(argv).command
    result = run(argv, {path: record})
    assert result == Result(0, "", "")
    return seen[0]


def test_project_metadata_declares_the_same_version_as_the_package() -> None:
    metadata = tomllib.loads((PROJECT_ROOT / "pyproject.toml").read_text(encoding="utf-8"))

    assert metadata["project"]["version"] == __version__
    assert metadata["project"]["dependencies"] == []


def test_root_help_is_the_frozen_text_on_stdout() -> None:
    for flag in ("--help", "-h"):
        assert run([flag]) == Result(0, GOLDEN_ROOT_HELP, "")


def test_events_export_help_is_the_frozen_text_on_stdout() -> None:
    for flag in ("--help", "-h"):
        assert run(["events", "export", flag]) == Result(0, GOLDEN_EXPORT_HELP, "")


def test_every_command_and_group_answers_help_on_stdout_with_exit_zero() -> None:
    paths = [*SPECS, *((group,) for group in GROUPS)]

    for path in paths:
        for flag in ("--help", "-h"):
            assert run([*path, flag]) == Result(0, COMMAND_HELP[path], ""), (path, flag)


def test_help_is_requested_before_a_missing_required_option_is_reported() -> None:
    assert run(["capture-hook", "--help"]).code == 0
    assert run(["events", "export", "-h"]).code == 0


def test_help_text_exists_for_exactly_the_commands_and_groups_of_the_grammar() -> None:
    assert set(COMMAND_HELP) == {*SPECS, *((group,) for group in GROUPS)}


def test_root_help_lists_every_command_of_the_grammar() -> None:
    listed = {line.strip().split("  ")[0] for line in ROOT_HELP.splitlines() if line.startswith("  ")}

    assert {" ".join(spec.path) for spec in COMMANDS} <= listed


def test_each_help_text_names_exactly_the_options_its_command_accepts() -> None:
    for spec in COMMANDS:
        text = COMMAND_HELP[spec.path]
        for name in (*spec.flags, *spec.options):
            assert name in text, (spec.path, name)
        assert ("--output <text|json>" in text) == spec.machine_output, spec.path
        assert ("shorthand for --output json" in text) == spec.machine_output, spec.path
        assert text.startswith(f"usage: ferret {' '.join(spec.path)}"), spec.path


@pytest.mark.parametrize("argv", [["version"], ["--version"], ["-V"]])
def test_every_version_spelling_prints_the_same_single_line(argv: list[str]) -> None:
    assert run(argv) == Result(0, f"ferret {__version__}\n", "")


def test_bare_invocation_writes_the_short_usage_to_stderr_and_fails() -> None:
    assert run([]) == Result(2, "", BARE_USAGE)


def test_the_help_subcommand_answers_for_the_root_and_for_every_path() -> None:
    assert run(["help"]) == Result(0, GOLDEN_ROOT_HELP, "")
    assert run(["help", "events", "export"]) == Result(0, GOLDEN_EXPORT_HELP, "")
    # A path that is not a command is not help; it gets the usage error the same spelling would get.
    assert run(["help", "nonsense"]) == Result(2, "", INVALID_ARGUMENTS_TEXT)


def test_only_the_word_help_is_the_help_command() -> None:
    # `help_for` is asked about every invocation; everything that is not the command must fall through to the
    # grammar rather than be answered with usage text.
    assert cli.help_for([]) is None
    assert cli.help_for(["status"]) is None
    assert cli.help_for(["--help"]) is None
    assert cli.help_for(["help"]) == ROOT_HELP
    # A help flag inside the help command is the one spelling nobody could have meant as a path.
    assert cli.help_for(["help", "--help"]) == ROOT_HELP
    assert cli.help_for(["help", "status", "-h"]) == COMMAND_HELP[("status",)]


def test_a_fault_in_the_callbacks_own_handler_is_still_silent_and_still_zero() -> None:
    # The handler is where a bug in FERRET would surface. On this one command it may not reach the conversation.
    def breaks(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        raise RuntimeError("a fault inside the callback")

    assert run(
        ["capture-hook", "--harness", "claude_code", "--event", "session-start"], {("capture-hook",): breaks}
    ) == Result(0, "", "")


def test_a_callback_that_cannot_even_record_its_failure_is_still_silent_and_still_zero(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Recording is best-effort: an environment that makes the data home unresolvable must not turn the one
    # command that may never speak into one that raises.
    monkeypatch.setenv("FERRET_DATA_HOME", "relative/not-absolute")

    assert run(["capture-hook"]) == Result(0, "", "")


def test_a_fault_outside_everything_main_answers_for_is_one_value_free_line_and_two(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # `main` answers for every failure it can name. This is the last resort for the ones it cannot -- a fault in
    # argument parsing, in help, or in this module itself -- which would otherwise be a traceback and exit `1`.
    def breaks(argv: object) -> Request:
        raise RuntimeError(LEAK_CANARY)

    monkeypatch.setattr(cli, "parse_arguments", breaks)
    stdout, stderr = io.StringIO(), io.StringIO()

    code = cli.run(["status"], stdout=stdout, stderr=stderr, handlers={})

    assert (code, stdout.getvalue()) == (2, "")
    assert stderr.getvalue() == f"FERRET error [ferret.internal.failure]: {cli.INTERNAL_FAILURE_MESSAGE}\n"
    assert LEAK_CANARY not in stderr.getvalue()


def test_run_is_main_when_nothing_escapes() -> None:
    stdout, stderr = io.StringIO(), io.StringIO()

    code = cli.run(["--help"], stdout=stdout, stderr=stderr, handlers={})

    assert (code, stdout.getvalue(), stderr.getvalue()) == (0, GOLDEN_ROOT_HELP, "")


@pytest.mark.parametrize(
    "argv",
    [
        ["init", "--unknown-option"],
        ["ini"],
        ["--vers"],
        ["init", "--out", "json"],
        ["events"],
        ["events", "nope"],
        ["self"],
        ["events", "export"],
        ["events", "export", "--format", "csv"],
        ["self", "install"],
        ["self", "install", "--target", "system"],
        ["usage"],
        ["outcomes"],
        ["init", "stray-positional"],
        ["--output", "yaml", "init"],
        ["init", "--output", "yaml"],
        ["--"],
    ],
)
def test_a_usage_mistake_is_invalid_arguments_on_stderr_with_exit_two(argv: list[str]) -> None:
    assert run(argv) == Result(2, "", INVALID_ARGUMENTS_TEXT)


@pytest.mark.parametrize("argv", [["capture-hook"], ["capture-hook", "--harness", "claude_code"]])
def test_a_usage_mistake_in_the_exempt_callback_is_silent(argv: list[str]) -> None:
    """The one command that must never speak, including when the caller got its arguments wrong.

    A harness runs this for every event. A diagnostic on stderr and an exit 2 land in the conversation, which is
    the one thing this command exists not to do -- so a usage mistake is recorded, not reported.
    """
    assert run(argv) == Result(0, "", "")


@pytest.mark.parametrize(
    "argv",
    [
        ["init", f"--{LEAK_CANARY}"],
        [LEAK_CANARY],
        ["events", "export", "--format", LEAK_CANARY],
        ["self", "install", "--target", LEAK_CANARY],
        ["--output", LEAK_CANARY, "init"],
    ],
)
def test_no_diagnostic_echoes_a_rejected_value(argv: list[str]) -> None:
    for mode in ([], ["--json"]):
        result = run([*argv, *mode])

        assert result.code == 2
        assert result.stdout == ""
        assert LEAK_CANARY not in result.stderr


@pytest.mark.parametrize(
    ("shorthand", "explicit"),
    [
        (["help", "--json"], ["help", "--output", "json"]),
        (["version", "--json"], ["version", "--output", "json"]),
        (["version", "--json"], ["version", "--output=json"]),
        (["--json", "help"], ["--output", "json", "help"]),
    ],
)
def test_json_shorthand_and_output_json_are_byte_identical(shorthand: list[str], explicit: list[str]) -> None:
    first, second = run(shorthand), run(explicit)

    assert first == second
    assert first.code == 2
    assert first.stdout == ""


@pytest.mark.parametrize(
    ("argv", "command"),
    [
        (["help", "--json"], None),
        (["version", "--json"], "version"),
        (["events", "--json"], None),
        (["events", "list", "--json", "--bogus"], "events.list"),
        (["self", "install", "--output", "json"], "self.install"),
        (["--output=json", "nope"], None),
        (["--json"], None),
        (["--json", "version"], "version"),
        (["events", "export", "--json", "--format", "jsonl"], "events.export"),
    ],
)
def test_a_json_usage_failure_is_one_compact_envelope_on_stderr(argv: list[str], command: str | None) -> None:
    result = run(argv)

    assert result.code == 2
    assert result.stdout == ""
    assert result.stderr.endswith("\n")
    assert result.stderr.count("\n") == 1
    assert json.loads(result.stderr) == {
        "schemaVersion": 1,
        "command": command,
        "exitCode": 2,
        "error": {
            "code": "ferret.args.invalid",
            "message": "unrecognized or incomplete arguments; run 'ferret --help' for usage",
            "field": None,
            "retryable": False,
        },
    }
    # Compact: the separators carry no padding. Checked by round-trip rather than by looking for a space,
    # because a message is a sentence and sentences have spaces in them.
    assert result.stderr == json.dumps(json.loads(result.stderr), separators=(",", ":")) + "\n"


def test_a_later_output_choice_wins_and_text_is_the_default() -> None:
    assert recorded(["init"]).output == "text"
    assert recorded(["init", "--json"]).output == "json"
    assert recorded(["init", "--output", "json"]).output == "json"
    assert recorded(["--json", "init"]).output == "json"
    assert recorded(["--output", "json", "init"]).output == "json"
    assert recorded(["--json", "init", "--output", "text"]).output == "text"
    assert recorded(["init", "--json", "--output", "text"]).output == "text"


@pytest.mark.parametrize(
    ("argv", "expected"),
    [
        (["json"], "text"),
        (["--json"], "json"),
        (["--output", "json"], "json"),
        (["--output=json"], "json"),
        (["--output", "text"], "text"),
        (["--output=text"], "text"),
        (["--json", "--output", "text"], "text"),
        (["--output", "text", "--json"], "json"),
        (["--output"], "text"),
        (["--", "--json"], "text"),
        (["--json", "--", "--output", "text"], "json"),
    ],
)
def test_the_output_mode_is_read_from_raw_arguments_for_a_failed_parse(argv: list[str], expected: str) -> None:
    assert cli.requested_output(argv) == expected


@pytest.mark.parametrize(
    ("argv", "expected"),
    [
        ([], ()),
        (["init"], ("init",)),
        (["init", "--json", "--bogus"], ("init",)),
        (["--json", "init"], ("init",)),
        (["--output", "json", "init"], ("init",)),
        (["--output"], ()),
        (["events"], ("events",)),
        (["events", "list", "--from", "x"], ("events", "list")),
        (["events", "nope"], ("events",)),
        (["events", "export", "list"], ("events", "export")),
        (["help"], ()),
        (["ini"], ()),
        (["--", "init"], ()),
        (["init", "extra"], ("init",)),
    ],
)
def test_the_failing_command_is_the_deepest_one_the_raw_arguments_name(argv: list[str], expected: CommandPath) -> None:
    assert cli.resolved_path(argv) == expected


def test_every_command_resolves_from_its_smallest_valid_invocation() -> None:
    for spec in COMMANDS:
        request = cli.parse_arguments(minimal_arguments(spec.path))

        assert request.command == spec.path
        assert request.output == "text"
        assert set(request.options) == set(spec.required)


def test_every_machine_command_accepts_json_and_every_other_command_rejects_it() -> None:
    for spec in COMMANDS:
        arguments = [*minimal_arguments(spec.path), "--json"]

        if spec.machine_output:
            assert cli.parse_arguments(arguments).output == "json", spec.path
        elif spec.path == ("capture-hook",):
            # The exempt callback never speaks, so it rejects the flag by ignoring it rather than by saying so.
            assert run(arguments) == Result(0, "", ""), spec.path
            with pytest.raises(cli.UsageError):
                cli.parse_arguments(arguments)
        else:
            assert run(arguments).code == 2, spec.path


def test_options_are_kept_in_order_with_every_occurrence() -> None:
    request = recorded(["events", "list", "--from", "a", "--all-time", "--from", "b", "--limit", "5", "--tool", "Read"])

    assert request.command == ("events", "list")
    assert request.options == {
        "--all-time": (),
        "--from": ("a", "b"),
        "--limit": ("5",),
        "--tool": ("Read",),
    }


def test_a_flag_that_is_absent_is_not_reported() -> None:
    assert recorded(["maintenance"]).options == {}
    assert recorded(["maintenance", "--if-due"]).options == {"--if-due": ()}
    assert recorded(["self", "uninstall", "--purge-data", "--yes"]).options == {
        "--purge-data": (),
        "--yes": (),
    }


def test_required_and_closed_options_are_parsed() -> None:
    assert recorded(["events", "export", "--format", "jsonl"]).options == {"--format": ("jsonl",)}
    assert recorded(["self", "install", "--target", "user"]).options == {"--target": ("user",)}
    assert recorded(["usage", "--group-by", "harness,tool"]).options == {"--group-by": ("harness,tool",)}
    assert recorded(["capture-hook", "--harness", "claude_code", "--event", "tool.started"]).options == {
        "--harness": ("claude_code",),
        "--event": ("tool.started",),
    }


def test_command_names_are_dotted_for_a_leaf_and_absent_for_the_root_and_a_group() -> None:
    assert cli.command_name(("init",)) == "init"
    assert cli.command_name(("events", "list")) == "events.list"
    assert cli.command_name(()) is None
    assert cli.command_name(("events",)) is None


@pytest.mark.parametrize("output", [[], ["--json"]])
def test_an_unknown_internal_failure_is_storage_unavailable_without_its_detail(output: list[str]) -> None:
    def explode(request: Request, stdout: object, stderr: object) -> int:
        raise RuntimeError(f"/private/{LEAK_CANARY}")

    result = run(["init", *output], {("init",): explode})

    assert result.code == 2
    assert result.stdout == ""
    assert LEAK_CANARY not in result.stderr
    assert "Traceback" not in result.stderr
    if output:
        assert json.loads(result.stderr) == {
            "schemaVersion": 1,
            "command": "init",
            "exitCode": 2,
            "error": {
                "code": "ferret.storage.unavailable",
                "message": "storage is unavailable",
                "field": None,
                "retryable": False,
            },
        }
    else:
        assert result.stderr == "FERRET error [ferret.storage.unavailable]: storage is unavailable\n"


def test_a_handler_owns_its_streams_and_exit_code() -> None:
    def speak(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        stdout.write("data\n")
        stderr.write("diagnostic\n")
        return 4

    assert run(["status"], {("status",): speak}) == Result(4, "data\n", "diagnostic\n")


def test_the_process_streams_and_arguments_are_the_defaults(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(sys, "argv", ["ferret", "--version"])

    assert cli.main() == 0
    assert capsys.readouterr().out == f"ferret {__version__}\n"

    assert cli.main(["help", "nonsense"]) == 2
    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == INVALID_ARGUMENTS_TEXT


@pytest.fixture
def signal_calls(monkeypatch: pytest.MonkeyPatch) -> list[tuple[int, object]]:
    """Every ``signal.signal`` call made during the test; none of them takes effect."""
    calls: list[tuple[int, object]] = []

    def record(number: int, action: object) -> None:
        calls.append((number, action))

    monkeypatch.setattr(signal, "signal", record)
    return calls


def test_a_real_stdout_gets_the_default_broken_pipe_disposition_before_anything_is_written(
    monkeypatch: pytest.MonkeyPatch, signal_calls: list[tuple[int, object]]
) -> None:
    written: list[str] = []

    class Recording(io.StringIO):
        def write(self, text: str, /) -> int:
            written.append(text)
            return super().write(text)

    monkeypatch.setattr(sys, "stdout", Recording())

    assert cli.main(["version"], stderr=io.StringIO()) == 0

    assert signal_calls == [(signal.SIGPIPE, signal.SIG_DFL)]
    assert written == [f"ferret {__version__}\n"]


def test_injected_streams_leave_the_signal_disposition_alone(signal_calls: list[tuple[int, object]]) -> None:
    assert run(["version"]).code == 0
    assert signal_calls == []
