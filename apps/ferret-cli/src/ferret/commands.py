"""Command handlers: each turns one parsed request into one use-case call and one rendered result."""

from collections.abc import Callable, Mapping
from contextlib import suppress
from typing import TextIO

from ferret.adapters.system import system_runtime
from ferret.application.analytics import summarize_outcomes, summarize_usage
from ferret.application.capture import capture_event
from ferret.application.capture_hook import capture_hook
from ferret.application.initialization import initialize_store
from ferret.application.install import install_user, uninstall_user
from ferret.application.maintenance import run_maintenance
from ferret.application.ports import Runtime
from ferret.application.queries import export_events, list_events
from ferret.application.status import report_status
from ferret.cli import EXIT_SUCCESS, CommandPath, Handler, Request, run_version
from ferret.rendering import (
    NO_ROWS,
    render_capture,
    render_events,
    render_export_line,
    render_init,
    render_install,
    render_maintenance,
    render_outcomes,
    render_status,
    render_uninstall,
    render_usage,
)

type RuntimeFactory = Callable[[], Runtime]


def _emit(text: str, stdout: TextIO, stderr: TextIO) -> None:
    """A result goes to stdout; a text result with no rows leaves stdout empty and says so on stderr."""
    if text:
        stdout.write(text)
    else:
        stderr.write(NO_ROWS)


def build_handlers(runtime_factory: RuntimeFactory) -> Mapping[CommandPath, Handler]:
    """The handler registry over one runtime factory, called once per invocation so ``version`` never needs it."""

    def init(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        stdout.write(render_init(initialize_store(runtime_factory()), request.output))
        return EXIT_SUCCESS

    def capture(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        stdout.write(render_capture(capture_event(runtime_factory()), request.output))
        return EXIT_SUCCESS

    def capture_from_hook(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        # The one command a harness runs for every event, so it is silent and exits zero whatever happens: an
        # unsupported payload, an unusable store, and a bug in this code alike must never reach the conversation.
        with suppress(Exception):
            (harness,), (event,) = request.options["--harness"], request.options["--event"]
            capture_hook(runtime_factory(), harness=harness, event=event)
        return EXIT_SUCCESS

    def events_list(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        _emit(render_events(list_events(runtime_factory(), request.options), request.output), stdout, stderr)
        return EXIT_SUCCESS

    def events_export(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        # Each event is flushed as it is written, so a consumer sees it at once and a closed pipe ends the stream.
        for event in export_events(runtime_factory(), request.options):
            stdout.write(render_export_line(event))
            stdout.flush()
        return EXIT_SUCCESS

    def usage(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        _emit(render_usage(summarize_usage(runtime_factory(), request.options), request.output), stdout, stderr)
        return EXIT_SUCCESS

    def outcomes(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        _emit(render_outcomes(summarize_outcomes(runtime_factory(), request.options), request.output), stdout, stderr)
        return EXIT_SUCCESS

    def status(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        stdout.write(render_status(report_status(runtime_factory()), request.output))
        return EXIT_SUCCESS

    def maintenance(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        report = run_maintenance(runtime_factory(), if_due="--if-due" in request.options)
        stdout.write(render_maintenance(report, request.output))
        return EXIT_SUCCESS

    def self_install(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        stdout.write(render_install(install_user(runtime_factory()), request.output))
        return EXIT_SUCCESS

    def self_uninstall(request: Request, stdout: TextIO, stderr: TextIO) -> int:
        outcome = uninstall_user(
            runtime_factory(), purge_data="--purge-data" in request.options, confirmed="--yes" in request.options
        )
        stdout.write(render_uninstall(outcome, request.output))
        return EXIT_SUCCESS

    return {
        ("version",): run_version,
        ("init",): init,
        ("capture",): capture,
        ("capture-hook",): capture_from_hook,
        ("events", "list"): events_list,
        ("events", "export"): events_export,
        ("usage",): usage,
        ("outcomes",): outcomes,
        ("status",): status,
        ("maintenance",): maintenance,
        ("self", "install"): self_install,
        ("self", "uninstall"): self_uninstall,
    }


def default_handlers() -> Mapping[CommandPath, Handler]:
    """The registry wired to the real clock, filesystem, and SQLite."""
    return build_handlers(system_runtime)
