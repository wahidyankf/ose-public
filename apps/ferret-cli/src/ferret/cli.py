"""The FERRET command line: the closed grammar, help and version, and the closed failure contract."""

import argparse
import json
import signal
import sys
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal, NoReturn, Protocol, TextIO, cast

from ferret import __version__
from ferret.domain.errors import EXIT_CALLER_ERROR, EXIT_SUCCESS, FAILURES, FerretError
from ferret.help_text import COMMAND_HELP, ROOT_HELP, ROOT_USAGE

type CommandPath = tuple[str, ...]
type OutputMode = Literal["text", "json"]

VERSION_LINE = f"ferret {__version__}"

# No message carries a rejected value: a caller's raw input never reaches a diagnostic.
INVALID_ARGUMENTS_MESSAGE = FAILURES["ferret.args.invalid"][1]
STORAGE_UNAVAILABLE_MESSAGE = FAILURES["ferret.storage.unavailable"][1]
INTERNAL_FAILURE_MESSAGE = FAILURES["ferret.internal.failure"][1]
BARE_INVOCATION_HINT = "Run 'ferret --help' for the commands and options.\n"

GROUPS = ("events", "self")

FILTER_OPTIONS = (
    "--from",
    "--to",
    "--harness",
    "--workspace",
    "--event-type",
    "--agent",
    "--skill",
    "--tool",
    "--outcome",
)


@dataclass(frozen=True, slots=True)
class CommandSpec:
    """One leaf of the closed grammar.

    ``flags`` take no value, ``options`` take one and may repeat, ``required`` names the options that must be
    present, and ``choices`` closes an option's value set. ``machine_output`` says whether the command accepts
    ``--output`` and ``--json``.
    """

    path: CommandPath
    machine_output: bool
    flags: tuple[str, ...] = ()
    options: tuple[str, ...] = ()
    required: tuple[str, ...] = ()
    choices: Mapping[str, tuple[str, ...]] | None = None


COMMANDS: tuple[CommandSpec, ...] = (
    CommandSpec(("version",), machine_output=False),
    CommandSpec(("init",), machine_output=True),
    CommandSpec(("capture",), machine_output=True),
    CommandSpec(
        ("capture-hook",),
        machine_output=False,
        options=("--harness", "--event"),
        required=("--harness", "--event"),
    ),
    CommandSpec(("status",), machine_output=True),
    CommandSpec(
        ("events", "list"),
        machine_output=True,
        flags=("--all-time",),
        options=(*FILTER_OPTIONS, "--limit", "--cursor"),
    ),
    CommandSpec(
        ("events", "export"),
        machine_output=False,
        flags=("--all-time",),
        options=(*FILTER_OPTIONS, "--format"),
        required=("--format",),
        choices={"--format": ("jsonl",)},
    ),
    CommandSpec(
        ("usage",),
        machine_output=True,
        flags=("--all-time",),
        options=(*FILTER_OPTIONS, "--group-by"),
        required=("--group-by",),
    ),
    CommandSpec(
        ("outcomes",),
        machine_output=True,
        flags=("--all-time",),
        options=(*FILTER_OPTIONS, "--group-by"),
        required=("--group-by",),
    ),
    CommandSpec(("maintenance",), machine_output=True, flags=("--if-due",)),
    CommandSpec(
        ("self", "install"),
        machine_output=True,
        options=("--target",),
        required=("--target",),
        choices={"--target": ("user",)},
    ),
    CommandSpec(("self", "uninstall"), machine_output=True, flags=("--purge-data", "--yes")),
)

SPECS: Mapping[CommandPath, CommandSpec] = {spec.path: spec for spec in COMMANDS}


@dataclass(frozen=True, slots=True)
class Request:
    """A parsed invocation: the resolved command, its output mode, and every option occurrence in order."""

    command: CommandPath
    output: OutputMode
    options: Mapping[str, tuple[str, ...]]


type Handler = Callable[[Request, TextIO, TextIO], int]


class UsageError(Exception):
    """The arguments do not fit the grammar. It carries no detail: a diagnostic never echoes a rejected value."""


class HelpRequested(Exception):  # noqa: N818 - control flow, not an error
    """``-h`` or ``--help`` was read, so help for ``path`` is the result."""

    def __init__(self, path: CommandPath) -> None:
        super().__init__("help requested")
        self.path = path


class VersionRequested(Exception):  # noqa: N818 - control flow, not an error
    """``-V`` or ``--version`` was read, so the version line is the result."""


class _Parser(argparse.ArgumentParser):
    """An argparse parser whose failures carry no message and whose help is a fixed literal."""

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(add_help=False, allow_abbrev=False, **kwargs)

    def error(self, message: str) -> NoReturn:
        raise UsageError


class _Subcommands(Protocol):
    def add_parser(self, name: str) -> _Parser: ...


class _HelpAction(argparse.Action):
    def __init__(self, option_strings: Sequence[str], dest: str, *, path: CommandPath) -> None:
        super().__init__(option_strings, dest, nargs=0, default=argparse.SUPPRESS)
        self._path = path

    def __call__(
        self,
        parser: argparse.ArgumentParser,
        namespace: argparse.Namespace,
        values: str | Sequence[object] | None,
        option_string: str | None = None,
    ) -> NoReturn:
        raise HelpRequested(self._path)


class _VersionAction(argparse.Action):
    def __init__(self, option_strings: Sequence[str], dest: str) -> None:
        super().__init__(option_strings, dest, nargs=0, default=argparse.SUPPRESS)

    def __call__(
        self,
        parser: argparse.ArgumentParser,
        namespace: argparse.Namespace,
        values: str | Sequence[object] | None,
        option_string: str | None = None,
    ) -> NoReturn:
        raise VersionRequested


def _add_output_options(parser: argparse.ArgumentParser, *, after_command: bool) -> None:
    # A value given after the command must not overwrite one given before it unless it is actually present,
    # so a subcommand's default is suppressed rather than None.
    default = argparse.SUPPRESS if after_command else None
    parser.add_argument("--output", dest="output", choices=("text", "json"), default=default)
    parser.add_argument("--json", dest="output", action="store_const", const="json", default=default)


def _add_command(parser: _Parser, spec: CommandSpec) -> None:
    parser.add_argument("-h", "--help", action=_HelpAction, path=spec.path)
    parser.set_defaults(command_path=spec.path)
    if spec.machine_output:
        _add_output_options(parser, after_command=True)
    for flag in spec.flags:
        parser.add_argument(flag, dest=flag, action="store_true", default=False)
    choices = spec.choices or {}
    for option in spec.options:
        parser.add_argument(
            option,
            dest=option,
            action="append",
            default=None,
            choices=choices.get(option),
            required=option in spec.required,
        )


def _build_parser() -> _Parser:
    root = _Parser(prog="ferret")
    root.add_argument("-h", "--help", action=_HelpAction, path=())
    root.add_argument("-V", "--version", action=_VersionAction)
    _add_output_options(root, after_command=False)
    top = cast(_Subcommands, root.add_subparsers(dest="command", parser_class=_Parser, required=True))
    group_commands: dict[str, _Subcommands] = {}
    for group in GROUPS:
        group_parser = top.add_parser(group)
        group_parser.add_argument("-h", "--help", action=_HelpAction, path=(group,))
        group_commands[group] = cast(
            _Subcommands,
            group_parser.add_subparsers(dest=f"{group}_command", parser_class=_Parser, required=True),
        )
    for spec in COMMANDS:
        parent = top if len(spec.path) == 1 else group_commands[spec.path[0]]
        _add_command(parent.add_parser(spec.path[-1]), spec)
    return root


def parse_arguments(arguments: Sequence[str]) -> Request:
    """Resolve ``arguments`` against the closed grammar, or raise UsageError, HelpRequested, or VersionRequested."""
    values: dict[str, object] = vars(_build_parser().parse_args(list(arguments)))
    path = cast(CommandPath, values["command_path"])
    spec = SPECS[path]
    chosen = values.get("output")
    if chosen is not None and not spec.machine_output:
        raise UsageError
    options: dict[str, tuple[str, ...]] = {}
    for flag in spec.flags:
        if values[flag]:
            options[flag] = ()
    for option in spec.options:
        occurrences = cast(list[str] | None, values[option])
        if occurrences is not None:
            options[option] = tuple(occurrences)
    output: OutputMode = "json" if chosen == "json" else "text"
    return Request(command=path, output=output, options=options)


def requested_output(arguments: Sequence[str]) -> OutputMode:
    """Read the output mode from raw arguments, for a failure raised before parsing finished."""
    mode: OutputMode = "text"
    for index, token in enumerate(arguments):
        if token == "--":
            break
        value: str | None = None
        if token == "--json":
            value = "json"
        elif token.startswith("--output="):
            value = token.partition("=")[2]
        elif token == "--output" and index + 1 < len(arguments):
            value = arguments[index + 1]
        if value is not None:
            mode = "json" if value == "json" else "text"
    return mode


def resolved_path(arguments: Sequence[str]) -> CommandPath:
    """The deepest command the raw arguments name, for a failure raised before parsing finished."""
    known = {spec.path[:depth] for spec in COMMANDS for depth in range(1, len(spec.path) + 1)}
    path: CommandPath = ()
    skip_value = False
    for token in arguments:
        if skip_value:
            skip_value = False
        elif token == "--":
            break
        elif token == "--output":
            skip_value = True
        elif not token.startswith("-"):
            if (*path, token) not in known:
                break
            path = (*path, token)
            if path in SPECS:
                break
    return path


def command_name(path: CommandPath) -> str | None:
    """The dotted command name of a resolved leaf, or None for the root and a group."""
    return ".".join(path) if path in SPECS else None


def fail(
    stderr: TextIO,
    *,
    command: CommandPath,
    output: OutputMode,
    code: str,
    exit_code: int,
    message: str,
    retryable: bool = False,
    field: str | None = None,
) -> int:
    """Write one closed failure to stderr in the requested mode and return its exit code."""
    if output == "json":
        envelope = {
            "schemaVersion": 1,
            "command": command_name(command),
            "exitCode": exit_code,
            # The message travels with the code. A caller that does not recognize the code still has one
            # sentence to show a person, which is the whole reason a failure is reported rather than logged.
            "error": {"code": code, "message": message, "field": field, "retryable": retryable},
        }
        stderr.write(json.dumps(envelope, separators=(",", ":"), ensure_ascii=False) + "\n")
    else:
        stderr.write(f"FERRET error [{code}]: {message}\n")
    return exit_code


def run_version(request: Request, stdout: TextIO, stderr: TextIO) -> int:
    stdout.write(VERSION_LINE + "\n")
    return EXIT_SUCCESS


def _prepare_process_stdout() -> None:
    """Make the real stdout behave like a Unix filter: a closed pipe ends the process, and the bytes are UTF-8.

    Python ignores SIGPIPE, which turns a consumer that stops reading into a traceback. Restoring the default
    disposition lets it end the process quietly instead. Only the process's own stdout is touched, so a call with
    injected streams never changes signal handling. The encoding is set explicitly so a locale cannot change what an
    export contains.
    """
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
    # Only a real text stream can be reconfigured; any other object already owns its encoding.
    reconfigure = getattr(sys.stdout, "reconfigure", None)
    if reconfigure is not None:
        reconfigure(encoding="utf-8")


def _asks_for_help(arguments: Sequence[str]) -> bool:
    """Whether this invocation asked for help, whatever else it said."""
    return any(argument in ("-h", "--help") for argument in arguments)


def _record_callback_failure(code: str) -> None:
    """Write down a callback failure that happened before a runtime existed. Never raises."""
    try:
        import os

        from ferret.adapters.filesystem import resolve_data_home
        from ferret.adapters.hook_failures import record_hook_failure
        from ferret.adapters.system import home_directory

        record_hook_failure(resolve_data_home(os.environ, home_directory(os.environ)), code)
    except Exception:
        return


def help_for(arguments: Sequence[str]) -> str | None:
    """The help text a ``help`` command asks for, or ``None`` when this invocation is not one.

    ``help`` is a command as well as a flag because a caller who has just met a subcommand tree tries the word
    before the flag, and a tool that answers only one of them makes them read documentation to learn which.
    An unknown path is not help: it falls through to the usage error the same spelling would get as a command.
    """
    if not arguments or arguments[0] != "help":
        return None
    path: CommandPath = tuple(arguments[1:])
    if path == ():
        return ROOT_HELP
    return COMMAND_HELP.get(path)


def main(
    argv: Sequence[str] | None = None,
    *,
    stdout: TextIO | None = None,
    stderr: TextIO | None = None,
    handlers: Mapping[CommandPath, Handler] | None = None,
) -> int:
    """Run one invocation and return its exit code. Streams and handlers are injectable for tests."""
    arguments = list(sys.argv[1:] if argv is None else argv)
    if stdout is None:
        _prepare_process_stdout()
    out = sys.stdout if stdout is None else stdout
    err = sys.stderr if stderr is None else stderr
    if handlers is None:
        # Deferred so that help, version, and usage errors never import the persistence adapters.
        from ferret.commands import default_handlers

        registry = default_handlers()
    else:
        registry = handlers

    if not arguments:
        err.write(ROOT_USAGE + BARE_INVOCATION_HINT)
        return EXIT_CALLER_ERROR
    if arguments[0] == "capture-hook" and not _asks_for_help(arguments):
        # The one callback that must never speak. Argument parsing runs before the handler, so a missing or
        # misspelled option used to reach a caller as a diagnostic on stderr and exit 2 -- which, for a hook a
        # harness runs on every event, is the one thing this command exists not to do. `--help` is still
        # answered, because a person asking for it is not a harness.
        try:
            request = parse_arguments(arguments)
        except Exception:
            _record_callback_failure("ferret.args.invalid")
            return EXIT_SUCCESS
        try:
            return registry[request.command](request, out, err)
        except Exception:
            _record_callback_failure("ferret.internal.failure")
            return EXIT_SUCCESS
    if arguments[0] == "help":
        requested_help = help_for(arguments)
        if requested_help is None:
            return fail(
                err,
                command=(),
                output=requested_output(arguments),
                code="ferret.args.invalid",
                exit_code=EXIT_CALLER_ERROR,
                message=INVALID_ARGUMENTS_MESSAGE,
            )
        out.write(requested_help)
        return EXIT_SUCCESS
    try:
        request = parse_arguments(arguments)
    except HelpRequested as requested:
        out.write(ROOT_HELP if requested.path == () else COMMAND_HELP[requested.path])
        return EXIT_SUCCESS
    except VersionRequested:
        out.write(VERSION_LINE + "\n")
        return EXIT_SUCCESS
    except UsageError:
        return fail(
            err,
            command=resolved_path(arguments),
            output=requested_output(arguments),
            code="ferret.args.invalid",
            exit_code=EXIT_CALLER_ERROR,
            message=INVALID_ARGUMENTS_MESSAGE,
        )

    try:
        return registry[request.command](request, out, err)
    except FerretError as error:
        return fail(
            err,
            command=request.command,
            output=request.output,
            code=error.code,
            exit_code=error.exit_code,
            message=error.message,
            retryable=error.retryable,
            field=error.field,
        )
    except Exception:
        # The closed failure contract maps every unknown internal failure to storage_unavailable, and the
        # exception text is dropped so no path or value can leak.
        return fail(
            err,
            command=request.command,
            output=request.output,
            code="ferret.storage.unavailable",
            exit_code=EXIT_CALLER_ERROR,
            message=STORAGE_UNAVAILABLE_MESSAGE,
        )


def run(
    argv: Sequence[str] | None = None,
    *,
    stdout: TextIO | None = None,
    stderr: TextIO | None = None,
    handlers: Mapping[CommandPath, Handler] | None = None,
) -> int:
    """``main`` with nothing able to escape it as a traceback.

    ``main`` already answers for every failure it can name. This answers for the ones it cannot: a fault in
    argument parsing, in help, in stream setup, or in this module itself. Without it such a fault reaches the
    interpreter's default handler, which prints a traceback -- carrying paths and values the closed failure
    contract exists to keep out of a diagnostic -- and exits ``1``, the status reserved for a result.

    ``BaseException`` is deliberately not caught: an interrupt must end the process the way the signal says to.
    """
    try:
        return main(argv, stdout=stdout, stderr=stderr, handlers=handlers)
    except Exception:
        stream = sys.stderr if stderr is None else stderr
        stream.write(f"FERRET error [ferret.internal.failure]: {INTERNAL_FAILURE_MESSAGE}\n")
        return EXIT_CALLER_ERROR
