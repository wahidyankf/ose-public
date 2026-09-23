"""Unit bindings for the query and export feature, in process with every OS dependency faked."""

import json
from dataclasses import dataclass, field, fields, replace
from datetime import datetime

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret.application.ports import Budget, CaptureResult, Runtime
from ferret.domain.errors import FAILURES
from ferret.domain.event import Event
from ferret.domain.query import EventCriteria, Position
from support.events import encode
from support.fakes import FIXED_NOW, FakeEvents, World
from support.invoke import Ran, run_cli, run_runtime
from support.populate import WORKSPACE_A, WORKSPACE_B, make_event, world_with
from support.scenarios import (
    INVOCATIONS,
    LOCAL_COMMANDS,
    backend_traces,
    canonical_line,
    command_result_events,
    expected_lines,
    expected_table,
    filter_arguments,
    table,
    two_workspaces_and_two_harnesses,
)

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature"
# What the deterministic-export filters must reach the repository as, spelled out from the contract: the interval runs
# from three hours to one hour before the fixed clock, half open, in canonical millisecond UTC stamps.
FILTERED = EventCriteria(
    start="2026-09-18T05:00:00.000Z",
    end="2026-09-18T07:00:00.000Z",
    harness="codex",
    workspace="ws_00000000000000000000000000000002",
    event_type="agent.ended",
    outcome="failure",
)


@dataclass(slots=True)
class ReadSpy:
    """The fake repository with every read recorded, so a test sees exactly what production asked the store for.

    Matching and ordering stay the fake's; what this proves is the criteria and direction production chose, while the
    real SQL's matching and ordering are proved by the Integration adapter.
    """

    inner: FakeEvents
    reads: list[tuple[EventCriteria, bool]] = field(default_factory=lambda: list[tuple[EventCriteria, bool]]())

    def capture(self, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        return self.inner.capture(event, budget=budget)

    def read(
        self,
        criteria: EventCriteria,
        *,
        now: datetime,
        newest_first: bool,
        after: Position | None,
        limit: int,
    ) -> tuple[Event, ...]:
        self.reads.append((criteria, newest_first))
        return self.inner.read(criteria, now=now, newest_first=newest_first, after=after, limit=limit)

    def find(self, event_id: str, *, now: datetime) -> Event | None:
        return self.inner.find(event_id, now=now)

    def taken(self) -> list[tuple[EventCriteria, bool]]:
        """The reads recorded since the last call, which are then forgotten."""
        recorded, self.reads = self.reads, []
        return recorded


@dataclass(slots=True)
class Session:
    """The fake machine and what each invocation of a scenario wrote."""

    world: World
    listing: Ran | None = None
    repeat: Ran | None = None
    export: Ran | None = None
    quiet: Ran | None = None
    refused: Ran | None = None
    reads: dict[str, list[tuple[EventCriteria, bool]]] = field(
        default_factory=lambda: dict[str, list[tuple[EventCriteria, bool]]]()
    )
    refused_store_reads: int = -1
    command: str = ""
    machine: Ran | None = None
    human: Ran | None = None
    captured: Event | None = None
    files_before: frozenset[str] = frozenset()
    commands: dict[str, Ran] = field(default_factory=lambda: dict[str, Ran]())


@pytest.fixture
def session() -> Session:
    return Session(world=world_with())


@scenario(FEATURE, "Filter and export deterministic local events")
def test_filter_and_export_deterministic_local_events() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains events from two workspaces and two harnesses")
def given_two_workspaces_and_two_harnesses(session: Session) -> None:
    session.world.events.stored.extend(two_workspaces_and_two_harnesses(FIXED_NOW))
    stored = session.world.events.stored
    assert {event.workspace_id for event in stored} == {WORKSPACE_A, WORKSPACE_B}
    assert {event.harness for event in stored} == {"codex", "claude_code"}


def with_harness(filters: list[str], harness: str) -> list[str]:
    """The same filters with the harness value replaced."""
    position = filters.index("--harness") + 1
    return [*filters[:position], harness, *filters[position + 1 :]]


@when("the user filters by UTC interval, harness, workspace, event type, and outcome")
def when_filtered(session: Session) -> None:
    filters = filter_arguments(FIXED_NOW)
    spy = ReadSpy(session.world.events)
    runtime = replace(session.world.runtime, events=spy)
    session.listing = run_runtime(runtime, ["events", "list", "--json", *filters])
    session.reads["listing"] = spy.taken()
    session.repeat = run_runtime(runtime, ["events", "list", "--json", *filters])
    session.reads["repeat"] = spy.taken()
    session.export = run_runtime(runtime, ["events", "export", "--format", "jsonl", *filters])
    session.reads["export"] = spy.taken()
    # The same filters once for a harness with no events, whose human listing has a diagnostic to write, and once with
    # a malformed harness, which is refused.
    session.quiet = run_runtime(runtime, ["events", "list", *with_harness(filters, "opencode")])
    session.reads["quiet"] = spy.taken()
    session.refused = run_runtime(runtime, ["events", "export", "--format", "jsonl", *with_harness(filters, "Bad")])
    session.reads["refused"] = spy.taken()


@then("only matching events are listed, newest first by timestamp and then event ID")
def then_only_matching_events_newest_first(session: Session) -> None:
    # Production asks the store for exactly these filters, newest first, once per listing.
    assert session.reads["listing"] == [(FILTERED, True)]
    assert session.reads["repeat"] == [(FILTERED, True)]
    assert session.listing is not None
    assert (session.listing.code, session.listing.stderr) == (0, "")
    items = json.loads(session.listing.stdout)["items"]
    # Events 4 and 5 share a timestamp, so the event ID breaks the tie in the same newest-first direction.
    assert [int(item["eventId"][-12:]) for item in items] == [5, 4, 3]
    assert session.repeat == session.listing


@then("the JSON Lines export holds one canonical event object per line, oldest first by timestamp and then event ID")
def then_export_is_one_canonical_object_per_line_oldest_first(session: Session) -> None:
    # The export asks for the same filters in the opposite direction: oldest first.
    assert session.reads["export"] == [(FILTERED, False)]
    assert session.export is not None
    assert (session.export.code, session.export.stderr) == (0, "")
    stored = {int(event.event_id[-12:]): event for event in session.world.events.stored}
    assert session.export.stdout.splitlines(keepends=True) == [canonical_line(stored[number]) for number in (3, 4, 5)]


@then("diagnostics do not contaminate standard output")
def then_diagnostics_stay_off_standard_output(session: Session) -> None:
    # `1`: the query ran and matched nothing, which is a result and not a failure.
    assert session.quiet == (1, "", "No rows.\n")
    assert session.refused == (2, "", "ferret: [ferret.filter.invalid] a filter value is not valid\n")
    # The malformed filter was refused before the store was read at all.
    assert session.reads["refused"] == []


@scenario(FEATURE, "Emit a stable machine-readable command result")
def test_emit_a_stable_machine_readable_command_result() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("FERRET is initialized")
def given_ferret_is_initialized(session: Session) -> None:
    session.world.events.stored.extend(command_result_events(FIXED_NOW))
    assert session.world.schema.applied


@when(parsers.parse("the user runs {command} with --json"))
def when_run_with_json(session: Session, command: str) -> None:
    arguments, _ = INVOCATIONS[command]
    session.command = command
    if command in ("self install", "self uninstall"):
        # An install is what both an install and an uninstall act on, so the two runs compared below start alike.
        run_cli(session.world, INVOCATIONS["self install"][0])
    session.machine = run_cli(session.world, [*arguments, "--json"])
    if command == "self uninstall":
        run_cli(session.world, INVOCATIONS["self install"][0])
    session.human = run_cli(session.world, arguments)


@then("stdout is one JSON object carrying schemaVersion and command")
def then_stdout_is_one_json_object(session: Session) -> None:
    assert session.machine is not None
    code, out, err = session.machine
    document = json.loads(out)
    assert (code, err, out.count("\n")) == (0, "", 1)
    assert (document["schemaVersion"], document["command"]) == (1, INVOCATIONS[session.command][1])


@then("the human output of the same command derives from that same result")
def then_human_output_derives_from_the_same_result(session: Session) -> None:
    assert session.machine is not None
    assert session.human is not None
    assert (session.human.code, session.human.stderr) == (0, "")
    document = json.loads(session.machine.stdout)
    if session.command in ("status", "maintenance", "self install", "self uninstall"):
        assert session.human.stdout.splitlines() == expected_lines(session.command, document)
        return
    if session.command == "init":
        for key in ("result", "dataHome", "databasePath", "schemaNumber", "installationId", "retentionDays"):
            assert str(document[key]) in session.human.stdout
        return
    assert table(session.human.stdout) == expected_table(session.command, document)


@then("a failure instead emits a closed error code exposing no path beyond the resolved data home")
def then_a_failure_is_a_closed_error_without_a_path(session: Session) -> None:
    arguments, name = INVOCATIONS[session.command]
    if session.command == "self install":
        # A file that is not FERRET's stands where the launcher must go.
        session.world.installer.put_file(session.world.installer.paths.launcher, b"#!/bin/sh\n", 0o755)
    elif session.command == "self uninstall":
        # Deleting the user's data asks for confirmation, and none is given.
        arguments = [*arguments, "--purge-data"]
    else:
        directory = session.world.files.directory
        assert directory is not None
        directory.mode = 0o755

    code, out, err = run_cli(session.world, [*arguments, "--json"])

    assert out == ""
    envelope = json.loads(err)
    assert list(envelope) == ["schemaVersion", "command", "exitCode", "error"]
    assert envelope["command"] == name
    assert code == envelope["exitCode"] == FAILURES[envelope["error"]["code"]][0]
    assert set(envelope["error"]) == {"code", "message", "field", "retryable"}
    assert "/" not in err


@scenario(FEATURE, "Keep the export a raw stream when JSON is requested")
def test_keep_the_export_a_raw_stream_when_json_is_requested() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user exports events once with --json and once without it")
def when_export_with_and_without_json(session: Session) -> None:
    arguments = ["events", "export", "--format", "jsonl"]
    session.machine = run_cli(session.world, [*arguments, "--json"])
    session.refused_store_reads = session.world.events.reads
    session.human = run_cli(session.world, arguments)


@then("the export with --json exits 2 with the closed ferret.args.invalid error on stderr and nothing on stdout")
def then_the_json_export_is_refused(session: Session) -> None:
    assert session.machine is not None
    code, out, err = session.machine
    assert (code, out, err.count("\n")) == (2, "", 1)
    assert json.loads(err) == {
        "schemaVersion": 1,
        "command": "events.export",
        "exitCode": 2,
        "error": {
            "code": "ferret.args.invalid",
            "message": "unrecognized or incomplete arguments",
            "field": None,
            "retryable": False,
        },
    }
    # The request was refused as arguments, before any event was read.
    assert session.refused_store_reads == 0


@then("the export without --json writes one canonical event object per line")
def then_the_plain_export_is_json_lines(session: Session) -> None:
    assert session.human is not None
    assert (session.human.code, session.human.stderr) == (0, "")
    stored = {int(event.event_id[-12:]): event for event in session.world.events.stored}
    assert session.human.stdout.splitlines(keepends=True) == [canonical_line(stored[number]) for number in (1, 2, 3)]


@scenario(FEATURE, "Use FERRET without a backend")
def test_use_ferret_without_a_backend() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("no backend URL, token, or process exists")
def given_no_backend_url_token_or_process(session: Session, network_attempts: list[str]) -> None:
    files = session.world.files.files
    # The runtime is everything a command can reach: no port of it names a backend, and neither does what init wrote.
    assert backend_traces(port.name for port in fields(Runtime)) == []
    assert backend_traces(files) == []
    assert backend_traces(json.loads(files["config.json"].content)) == []
    session.files_before = frozenset(files)
    assert network_attempts == []


@when("the user captures, lists, exports, summarizes, and maintains local events")
def when_every_local_command_runs(session: Session) -> None:
    session.captured = make_event(1, now=FIXED_NOW)
    session.world.input.data = encode(session.captured.to_document())
    for name, arguments in LOCAL_COMMANDS.items():
        session.commands[name] = run_cli(session.world, arguments)


@then("every command completes using only the local data home")
def then_every_command_completes_from_the_data_home(session: Session) -> None:
    assert session.captured is not None
    assert {name: (ran.code, ran.stderr) for name, ran in session.commands.items()} == dict.fromkeys(
        LOCAL_COMMANDS, (0, "")
    )
    stored = session.world.events.stored
    assert [event.event_id for event in stored] == [session.captured.event_id]
    listing = json.loads(session.commands["events list"].stdout)
    assert [item["eventId"] for item in listing["items"]] == [session.captured.event_id]
    assert session.commands["events export"].stdout == canonical_line(stored[0])
    for summary in ("usage", "outcomes"):
        assert sum(row["eventCount"] for row in json.loads(session.commands[summary].stdout)["rows"]) == 1
    assert json.loads(session.commands["maintenance"].stdout)["result"] == "completed"
    # The data home is the only place a command could have written, and it gained no file after init.
    assert frozenset(session.world.files.files) == session.files_before


@then("status identifies backend synchronization as unavailable by design")
def then_status_names_the_backend_as_unavailable(session: Session) -> None:
    machine = run_cli(session.world, ["status", "--json"])
    human = run_cli(session.world, ["status"])

    assert (machine.code, machine.stderr, human.code, human.stderr) == (0, "", 0, "")
    assert json.loads(machine.stdout)["backend"] == {"state": "not_available_in_this_version"}
    assert "Backend: not_available_in_this_version" in human.stdout.splitlines()


@then("no network connection is attempted")
def then_no_network_connection_is_attempted(network_attempts: list[str]) -> None:
    assert network_attempts == []
