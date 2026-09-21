"""The help and version surface of the built artifact, proven through its public process boundary."""

import json
from pathlib import Path

import pytest

from ferret_process import Completed, run_artifact

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

options:
  -h, --help          show this help and exit
  -V, --version       show the version and exit
  --output <text|json>
                      render the result as text or JSON; defaults to text
  --json              shorthand for --output json

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

VERSION_LINE = "ferret 0.1.0\n"
BARE_USAGE = "usage: ferret <command> [options]\nRun 'ferret --help' for the commands and options.\n"
INVALID_ARGUMENTS_TEXT = (
    "FERRET error [invalid_arguments]: unrecognized or incomplete arguments; run 'ferret --help' for usage\n"
)
LISTED_COMMANDS = [
    "init",
    "capture",
    "capture-hook",
    "status",
    "events list",
    "events export",
    "usage",
    "outcomes",
    "maintenance",
    "self install",
    "self uninstall",
    "version",
]


def listed_commands(root_help: str) -> list[str]:
    """The command names in the root help's `commands:` block, in the order the block lists them."""
    names: list[str] = []
    in_commands = False
    for line in root_help.splitlines():
        if line == "commands:":
            in_commands = True
        elif line == "options:":
            break
        elif in_commands and line.strip():
            names.append(line.strip().split("  ")[0])
    return names


def run(artifact: Path, home: Path, *arguments: str) -> Completed:
    return run_artifact(artifact, arguments, home=home)


@pytest.mark.parametrize("flag", ["--help", "-h"])
def test_root_help_is_written_to_stdout_with_exit_zero(artifact: Path, home: Path, flag: str) -> None:
    result = run(artifact, home, flag)

    assert result.returncode == 0
    assert result.stdout.decode("utf-8") == GOLDEN_ROOT_HELP
    assert result.stderr == b""


def test_every_version_spelling_prints_the_same_single_line(artifact: Path, home: Path) -> None:
    for arguments in (["version"], ["--version"], ["-V"]):
        result = run(artifact, home, *arguments)

        assert result.returncode == 0, arguments
        assert result.stdout.decode("utf-8") == VERSION_LINE, arguments
        assert result.stderr == b"", arguments


def test_a_bare_invocation_writes_the_short_usage_to_stderr_and_exits_two(artifact: Path, home: Path) -> None:
    result = run(artifact, home)

    assert result.returncode == 2
    assert result.stdout == b""
    assert result.stderr.decode("utf-8") == BARE_USAGE


def test_the_help_subcommand_is_rejected_as_invalid_arguments(artifact: Path, home: Path) -> None:
    result = run(artifact, home, "help")

    assert result.returncode == 2
    assert result.stdout == b""
    assert result.stderr.decode("utf-8") == INVALID_ARGUMENTS_TEXT


@pytest.mark.parametrize("command", ["help", "version", "init"])
def test_json_shorthand_and_output_json_produce_byte_identical_failures(
    artifact: Path, home: Path, command: str
) -> None:
    shorthand = run(artifact, home, command, "--bogus-option", "--json")
    explicit = run(artifact, home, command, "--bogus-option", "--output", "json")

    assert shorthand == explicit
    assert shorthand.returncode == 2
    assert shorthand.stdout == b""
    envelope = json.loads(shorthand.stderr)
    assert envelope["error"] == {"code": "invalid_arguments", "field": None, "retryable": False}
    assert shorthand.stderr == json.dumps(envelope, separators=(",", ":")).encode("utf-8") + b"\n"


def test_the_root_help_lists_every_command_of_the_grammar(artifact: Path, home: Path) -> None:
    result = run(artifact, home, "--help")

    assert sorted(listed_commands(result.stdout.decode("utf-8"))) == sorted(LISTED_COMMANDS)


def test_every_command_listed_in_root_help_resolves_under_help(artifact: Path, home: Path) -> None:
    root = run(artifact, home, "--help").stdout.decode("utf-8")

    for name in listed_commands(root):
        result = run(artifact, home, *name.split(), "--help")

        assert result.returncode == 0, name
        assert result.stdout.decode("utf-8").startswith(f"usage: ferret {name}"), name
        assert result.stderr == b"", name


def test_events_export_help_is_the_frozen_text(artifact: Path, home: Path) -> None:
    result = run(artifact, home, "events", "export", "--help")

    assert result.returncode == 0
    assert result.stdout.decode("utf-8") == GOLDEN_EXPORT_HELP
    assert result.stderr == b""


@pytest.mark.parametrize("arguments", [["--vers"], ["ini"], ["events"], ["init", "--bogus-option"]])
def test_an_unknown_or_incomplete_invocation_exits_two_on_stderr(
    artifact: Path, home: Path, arguments: list[str]
) -> None:
    result = run(artifact, home, *arguments)

    assert result.returncode == 2
    assert result.stdout == b""
    assert result.stderr.decode("utf-8") == INVALID_ARGUMENTS_TEXT


def test_output_is_identical_whatever_the_locale_and_time_zone(artifact: Path, home: Path) -> None:
    baseline = run(artifact, home, "--help")

    for locale in ("C", "tr_TR.UTF-8", "ja_JP.UTF-8"):
        varied = run_artifact(
            artifact,
            ["--help"],
            home=home,
            extra_environment={"LC_ALL": locale, "LANG": locale, "TZ": "Pacific/Kiritimati"},
        )

        assert varied == baseline, locale
