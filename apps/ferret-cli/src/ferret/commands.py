"""Command handlers: each turns one parsed request into one use-case call and one rendered result."""

from collections.abc import Callable, Iterator, Mapping, Sized
from contextlib import suppress
from typing import TextIO

from typekit import Err, Ok

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
from ferret.cli import EXIT_SUCCESS, CommandPath, Handler, OutputMode, Request, run_version
from ferret.domain.errors import EXIT_NEGATIVE_RESULT, FerretResult
from ferret.domain.event import Event
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
    result_status,
)

type RuntimeFactory = Callable[[], FerretResult[Runtime]]


def _record_failure(runtime_factory: RuntimeFactory, code: str) -> None:
    """Write down one lost event, or give up quietly when even that cannot be done."""
    with suppress(Exception):
        runtime_factory().tap(lambda runtime: runtime.hook_failures.record(code))


def _writing[T](stdout: TextIO, request: Request, render: Callable[[T, OutputMode], str]) -> Callable[[T], int]:
    """The step that renders a result for ``request`` onto stdout: the command that produced it succeeded."""

    def write(result: T) -> int:
        stdout.write(render(result, request.output))
        return EXIT_SUCCESS

    return write


def _emit(text: str, stdout: TextIO, stderr: TextIO, rows: Sized) -> int:
    """A result goes to stdout; a text result with no rows leaves stdout empty and says so on stderr.

    The status comes from the rows rather than from the text, because a JSON envelope for an empty page is not an
    empty string: a caller told ``0`` there would have to parse the payload to learn the query matched nothing.
    """
    if text:
        stdout.write(text)
    else:
        stderr.write(NO_ROWS)
    return result_status(rows)


def _stream_export(events: Iterator[FerretResult[Event]], stdout: TextIO) -> FerretResult[int]:
    """Write each event the moment it is read, and end at the first failure, which is the answer.

    Each event is flushed as it is written, so a consumer sees it at once and a closed pipe ends the stream. Counted
    rather than collected: the point of streaming is that the whole export never has to be held. The events before a
    failure stay written, so the failure follows a partial export instead of replacing it.
    """
    exported = 0
    for item in events:
        match item:
            case Err():
                return item
            case Ok(event):
                stdout.write(render_export_line(event))
                stdout.flush()
                exported += 1
    return Ok(EXIT_SUCCESS if exported else EXIT_NEGATIVE_RESULT)


def build_handlers(runtime_factory: RuntimeFactory) -> Mapping[CommandPath, Handler]:
    """The handler registry over one runtime factory, called once per invocation so ``version`` never needs it."""

    def init(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return runtime_factory().flat_map(initialize_store).map(_writing(stdout, request, render_init))

    def capture(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return runtime_factory().flat_map(capture_event).map(_writing(stdout, request, render_capture))

    def capture_from_hook(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        # The one command a harness runs for every event, so it is silent and exits zero whatever happens: an
        # unsupported payload, an unusable store, and a bug in this code alike must never reach the conversation.
        #
        # Silent, but not without a record. A failure is written to the data home, where `ferret status` reports
        # it, so a maintainer can learn the callback is losing events instead of inferring it from telemetry
        # that stopped arriving. Recording is itself best-effort: whatever broke the capture may be what stops
        # the record, and a callback that raised while writing one would be worse than one that wrote none.
        try:
            (harness,), (event,) = request.options["--harness"], request.options["--event"]
            runtime_factory().flat_map(lambda runtime: capture_hook(runtime, harness=harness, event=event)).tap_err(
                lambda failure: _record_failure(runtime_factory, failure.code)
            )
        except Exception:
            _record_failure(runtime_factory, "ferret.internal.failure")
        return Ok(EXIT_SUCCESS)

    def events_list(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return (
            runtime_factory()
            .flat_map(lambda runtime: list_events(runtime, request.options))
            .map(lambda page: _emit(render_events(page, request.output), stdout, stderr, page.items))
        )

    def events_export(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return (
            runtime_factory()
            .flat_map(lambda runtime: export_events(runtime, request.options))
            .flat_map(lambda events: _stream_export(events, stdout))
        )

    def usage(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return (
            runtime_factory()
            .flat_map(lambda runtime: summarize_usage(runtime, request.options))
            .map(lambda summary: _emit(render_usage(summary, request.output), stdout, stderr, summary.rows))
        )

    def outcomes(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return (
            runtime_factory()
            .flat_map(lambda runtime: summarize_outcomes(runtime, request.options))
            .map(lambda summary: _emit(render_outcomes(summary, request.output), stdout, stderr, summary.rows))
        )

    def status(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return runtime_factory().flat_map(report_status).map(_writing(stdout, request, render_status))

    def maintenance(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return (
            runtime_factory()
            .flat_map(lambda runtime: run_maintenance(runtime, if_due="--if-due" in request.options))
            .map(_writing(stdout, request, render_maintenance))
        )

    def self_install(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return runtime_factory().flat_map(install_user).map(_writing(stdout, request, render_install))

    def self_uninstall(request: Request, stdout: TextIO, stderr: TextIO) -> FerretResult[int]:
        return (
            runtime_factory()
            .flat_map(
                lambda runtime: uninstall_user(
                    runtime, purge_data="--purge-data" in request.options, confirmed="--yes" in request.options
                )
            )
            .map(_writing(stdout, request, render_uninstall))
        )

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
