"""E2E bindings for the query and export feature: the built artifact, seeded only through its own commands."""

import json
import re
import sqlite3
from collections.abc import Mapping
from contextlib import closing
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from denied_sockets import LOG_VARIABLE, attempted, denied_socket_environment
from event_documents import encode_document, numbered_event, stamp
from ferret_process import Completed, capture_documents, run_artifact
from local_commands import LOCAL_COMMANDS, backend_traces, run_local_commands

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/queries/local-query-and-export.feature"
WORKSPACE_A = "ws_00000000000000000000000000000001"
WORKSPACE_B = "ws_00000000000000000000000000000002"
# An absolute path as it could appear in a diagnostic: a slash that starts a word, up to the next space or quote.
ABSOLUTE_PATH = re.compile(rb"(?<![\w.])/[^\s\"']+")
FAILURE_CODES = {
    "ferret.args.invalid": 2,
    "ferret.storage.unsafe": 2,
    "ferret.install.collision": 2,
    "ferret.args.confirmation-required": 2,
}

INVOCATIONS: dict[str, tuple[list[str], str]] = {
    "init": (["init"], "init"),
    "events list": (["events", "list"], "events.list"),
    "usage": (["usage", "--group-by", "harness,tool"], "usage"),
    "outcomes": (["outcomes", "--group-by", "harness,tool"], "outcomes"),
    "status": (["status"], "status"),
    "maintenance": (["maintenance"], "maintenance"),
    "self install": (["self", "install", "--target", "user"], "self.install"),
    "self uninstall": (["self", "uninstall"], "self.uninstall"),
}
LIST_COLUMNS = (
    "occurredAt",
    "eventId",
    "harness",
    "workspaceId",
    "eventType",
    "agentName",
    "skillName",
    "toolName",
    "outcome",
    "subjectVisibility",
    "outcomeVisibility",
    "durationVisibility",
)


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, its clock reading, and what each invocation returned."""

    artifact: Path
    home: Path
    now: datetime
    population: list[dict[str, Any]] = field(default_factory=lambda: list[dict[str, Any]]())
    listing: Completed | None = None
    repeat: Completed | None = None
    export: Completed | None = None
    quiet: Completed | None = None
    refused: Completed | None = None
    command: str = ""
    machine: Completed | None = None
    human: Completed | None = None
    environment: dict[str, str] = field(default_factory=lambda: dict[str, str]())
    commands: dict[str, Completed] = field(default_factory=lambda: dict[str, Completed]())

    def run(self, arguments: list[str], *, environment: Mapping[str, str] | None = None) -> Completed:
        return run_artifact(self.artifact, arguments, home=self.home, extra_environment=environment)

    @property
    def data_home(self) -> Path:
        return self.home / ".local" / "share" / "ferret"


@pytest.fixture
def session(artifact: Path, home: Path) -> Session:
    initialized = run_artifact(artifact, ["init", "--json"], home=home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    return Session(artifact=artifact, home=home, now=datetime.now(UTC))


def agent_ended(number: int, session: Session, *, ago: timedelta, **overrides: Any) -> dict[str, Any]:
    fields: dict[str, Any] = {
        "eventType": "agent.ended",
        "agentName": "reviewer",
        "toolName": None,
        "outcome": "failure",
        "harness": "codex",
        "workspaceId": WORKSPACE_B,
        **overrides,
    }
    return numbered_event(number, now=session.now, ago=ago, **fields)


def two_workspaces_and_two_harnesses(session: Session) -> list[dict[str, Any]]:
    hours = timedelta(hours=2)
    return [
        agent_ended(1, session, ago=timedelta(hours=4)),
        agent_ended(2, session, ago=timedelta(hours=1)),
        agent_ended(3, session, ago=timedelta(hours=3)),
        agent_ended(4, session, ago=hours),
        agent_ended(5, session, ago=hours),
        agent_ended(6, session, ago=hours, harness="claude_code"),
        agent_ended(7, session, ago=hours, workspaceId=WORKSPACE_A),
        agent_ended(
            8, session, ago=hours, eventType="session.ended", agentName=None, subjectVisibility="not_applicable"
        ),
        agent_ended(9, session, ago=hours, outcome="success"),
    ]


def filter_arguments(now: datetime) -> list[str]:
    return [
        "--from",
        stamp(now - timedelta(hours=3)),
        "--to",
        stamp(now - timedelta(hours=1)),
        "--harness",
        "codex",
        "--workspace",
        WORKSPACE_B,
        "--event-type",
        "agent.ended",
        "--outcome",
        "failure",
    ]


def line_of(document: dict[str, Any]) -> bytes:
    return encode_document(document) + b"\n"


def stored_values(session: Session, column: str) -> set[str]:
    with closing(sqlite3.connect(session.data_home / "ferret.sqlite3")) as connection:
        return {str(row[0]) for row in connection.execute(f"SELECT DISTINCT {column} FROM event")}


@scenario(FEATURE, "Filter and export deterministic local events")
def test_filter_and_export_deterministic_local_events() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("the database contains events from two workspaces and two harnesses")
def given_two_workspaces_and_two_harnesses(session: Session) -> None:
    session.population = two_workspaces_and_two_harnesses(session)
    capture_documents(session.artifact, session.home, session.population)
    assert stored_values(session, "workspace_id") == {WORKSPACE_A, WORKSPACE_B}
    assert stored_values(session, "harness") == {"codex", "claude_code"}


def with_harness(filters: list[str], harness: str) -> list[str]:
    """The same filters with the harness value replaced."""
    position = filters.index("--harness") + 1
    return [*filters[:position], harness, *filters[position + 1 :]]


@when("the user filters by UTC interval, harness, workspace, event type, and outcome")
def when_filtered(session: Session) -> None:
    filters = filter_arguments(session.now)
    session.listing = session.run(["events", "list", "--json", *filters])
    session.repeat = session.run(["events", "list", "--json", *filters])
    session.export = session.run(["events", "export", "--format", "jsonl", *filters])
    # The same filters once for a harness with no events, whose human listing has a diagnostic to write, and once with
    # a malformed harness, which is refused.
    session.quiet = session.run(["events", "list", *with_harness(filters, "opencode")])
    session.refused = session.run(["events", "export", "--format", "jsonl", *with_harness(filters, "Bad")])


@then("only matching events are listed, newest first by timestamp and then event ID")
def then_only_matching_events_newest_first(session: Session) -> None:
    assert session.listing is not None
    assert (session.listing.returncode, session.listing.stderr) == (0, b"")
    items = json.loads(session.listing.stdout)["items"]
    # Events 4 and 5 share a timestamp, so the event ID breaks the tie in the same newest-first direction.
    assert [int(item["eventId"][-12:]) for item in items] == [5, 4, 3]
    assert session.repeat == session.listing


@then("the JSON Lines export holds one canonical event object per line, oldest first by timestamp and then event ID")
def then_export_is_one_canonical_object_per_line_oldest_first(session: Session) -> None:
    assert session.export is not None
    assert (session.export.returncode, session.export.stderr) == (0, b"")
    stored = {int(document["eventId"][-12:]): document for document in session.population}
    assert session.export.stdout.splitlines(keepends=True) == [line_of(stored[number]) for number in (3, 4, 5)]


@then("diagnostics do not contaminate standard output")
def then_diagnostics_stay_off_standard_output(session: Session) -> None:
    # `1` because the query matched nothing, and the line saying so is on stderr, not stdout.
    assert session.quiet == Completed(1, b"", b"No rows.\n")
    assert session.refused == Completed(2, b"", b"ferret: [ferret.filter.invalid] a filter value is not valid\n")


@scenario(FEATURE, "Emit a stable machine-readable command result")
def test_emit_a_stable_machine_readable_command_result() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("FERRET is initialized")
def given_ferret_is_initialized(session: Session) -> None:
    session.population = [
        numbered_event(1, now=session.now, ago=timedelta(minutes=3)),
        numbered_event(2, now=session.now, ago=timedelta(minutes=2), durationMs=None, durationVisibility="unknown"),
        numbered_event(
            3, now=session.now, ago=timedelta(minutes=1), toolName="Write", eventType="tool.failed", outcome="failure"
        ),
    ]
    capture_documents(session.artifact, session.home, session.population)
    assert (session.data_home / "ferret.sqlite3").is_file()


@when(parsers.parse("the user runs {command} with --json"))
def when_run_with_json(session: Session, command: str) -> None:
    arguments, _ = INVOCATIONS[command]
    session.command = command
    if command in ("self install", "self uninstall"):
        # An install is what both an install and an uninstall act on, so the two runs compared below start alike.
        session.run(INVOCATIONS["self install"][0])
    if command == "maintenance":
        # The first run settles the size of the file, so the two runs compared below start from the same store.
        session.run([*arguments, "--json"])
    session.machine = session.run([*arguments, "--json"])
    if command == "self uninstall":
        session.run(INVOCATIONS["self install"][0])
    session.human = session.run(arguments)


@then("stdout is one JSON object carrying schemaVersion and command")
def then_stdout_is_one_json_object(session: Session) -> None:
    assert session.machine is not None
    assert (session.machine.returncode, session.machine.stderr) == (0, b"")
    assert session.machine.stdout.count(b"\n") == 1
    document = json.loads(session.machine.stdout)
    assert (document["schemaVersion"], document["command"]) == (1, INVOCATIONS[session.command][1])


def scalar(value: Any) -> str:
    """A JSON scalar as the human output spells it: null is a hyphen and a boolean is yes or no."""
    if value is None:
        return "-"
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)


def expected_lines(command: str, document: dict[str, Any]) -> list[str]:
    """The literal lines a status, maintenance, or self-command JSON result must render as, from the contract."""
    if command == "self install":
        return [
            f"FERRET self.install: {document['result']}",
            f"Version: {document['version']}",
            f"Artifact: {document['artifactPath']}",
            f"Launcher: {document['launcherPath']}",
            f"Manifest: {document['manifestPath']}",
            f"PATH action: {document['pathAction']}",
            f"Replaced version: {scalar(document['replacedOwnedVersion'])}",
        ]
    if command == "self uninstall":
        return [
            f"FERRET self.uninstall: {document['result']}",
            f"Removed: {', '.join(document['removedPaths']) or '-'}",
            f"PATH action: {document['pathAction']}",
            f"Data action: {document['dataAction']}",
        ]
    if command == "maintenance":
        return [
            f"FERRET maintenance: {scalar(document['result'])}",
            f"Expired: events={document['expiredEventCount']} workspaces={document['expiredWorkspaceCount']}"
            f" snapshots={document['expiredCapabilitySnapshotCount']}",
            f"Counters: local={document['expiredLocalTotal']} before-ack={document['expiredBeforeAckTotal']}",
            f"Physical bytes: before={document['databaseBytesBefore']} after={document['databaseBytesAfter']}"
            f" wal={document['walBytesAfter']} freelist={document['freelistBytesAfter']}"
            f" high-water={document['highWaterBytes']}",
        ]
    runtime = document["runtime"]
    return [
        f"FERRET status: {document['databaseState']}",
        f"Version: {runtime['ferretVersion']}",
        f"Interpreter: {runtime['interpreterState']} {runtime['interpreterVersion']} {runtime['interpreterPath']}",
        f"Data home: {document['dataHome']}",
        f"Database: {document['databasePath']}",
        f"Schema: {document['schemaNumber']}",
        f"Integrity: {document['integrityState']}",
        f"Permissions: {document['permissionsState']}",
        f"Events: {document['eventCount']}",
        f"Capability snapshots: {document['capabilitySnapshotCount']}",
        f"Oldest capture: {scalar(document['oldestCapturedAt'])}",
        f"Near expiry: {document['nearExpiryCount']}",
        f"Logical expiry: {document['logicallyExpiredCount']}",
        f"Physical bytes: database={document['databaseBytes']} wal={document['walBytes']}"
        f" freelist={document['freelistBytes']} high-water={document['highWaterBytes']}",
        f"Expired local: {document['expiredLocalTotal']}",
        f"Expired before ACK: {document['expiredBeforeAckTotal']}",
        f"Maintenance: last={scalar(document['lastMaintenanceAt'])} due={scalar(document['maintenanceDue'])}",
        f"Hook failures: count={document['hookFailureCount']} last={scalar(document['lastHookFailureAt'])}",
        f"Backend: {document['backend']['state']}",
        *(
            f"Adapter {adapter['harness']}: {adapter['platformSupport']}/{adapter['configurationState']}"
            f"/{scalar(adapter['latestSnapshotId'])}"
            for adapter in document["adapters"]
        ),
    ]


def table(text: str) -> list[list[str]]:
    return [line.split("\t") for line in text.splitlines()]


def cells(values: list[Any]) -> list[str]:
    return ["-" if value is None else str(value) for value in values]


def expected_table(command: str, document: dict[str, Any]) -> list[list[str]]:
    if command == "events list":
        return [list(LIST_COLUMNS), *(cells([item[column] for column in LIST_COLUMNS]) for item in document["items"])]
    rows = document["rows"]
    header = [*document["groupBy"], *(name for name in rows[0] if name != "dimensions")]
    body = [
        cells([dimension["value"] for dimension in row["dimensions"]])
        + cells([value for name, value in row.items() if name != "dimensions"])
        for row in rows
    ]
    return [header, *body]


@then("the human output of the same command derives from that same result")
def then_human_output_derives_from_the_same_result(session: Session) -> None:
    assert session.machine is not None
    assert session.human is not None
    assert (session.human.returncode, session.human.stderr) == (0, b"")
    document = json.loads(session.machine.stdout)
    text = session.human.stdout.decode()
    if session.command in ("status", "maintenance", "self install", "self uninstall"):
        assert text.splitlines() == expected_lines(session.command, document)
        return
    if session.command == "init":
        for key in ("result", "dataHome", "databasePath", "schemaNumber", "installationId", "retentionDays"):
            assert str(document[key]) in text
        return
    assert table(text) == expected_table(session.command, document)


@then("a failure instead emits a closed error code exposing no path beyond the resolved data home")
def then_a_failure_is_a_closed_error_without_a_path(session: Session) -> None:
    arguments, name = INVOCATIONS[session.command]
    if session.command == "self install":
        # A file that is not FERRET's stands where the launcher must go.
        launcher = session.home / ".local" / "bin" / "ferret"
        launcher.parent.mkdir(parents=True, exist_ok=True)
        launcher.unlink(missing_ok=True)
        launcher.write_bytes(b"#!/bin/sh\n")
        launcher.chmod(0o755)
    elif session.command == "self uninstall":
        # Deleting the user's data asks for confirmation, and none is given.
        arguments = [*arguments, "--purge-data"]
    else:
        session.data_home.chmod(0o755)

    failed = session.run([*arguments, "--json"])

    assert failed.stdout == b""
    envelope = json.loads(failed.stderr)
    assert list(envelope) == ["schemaVersion", "command", "exitCode", "error"]
    assert envelope["command"] == name
    assert failed.returncode == envelope["exitCode"] == FAILURE_CODES[envelope["error"]["code"]]
    assert set(envelope["error"]) == {"code", "message", "field", "retryable"}
    assert str(session.home).encode() not in failed.stderr
    # Any absolute path the diagnostic does carry lies inside the resolved data home.
    homes = {str(session.data_home).encode(), str(session.data_home.resolve()).encode()}
    outside = [
        path
        for path in ABSOLUTE_PATH.findall(failed.stderr)
        if not any(path == home or path.startswith(home + b"/") for home in homes)
    ]
    assert outside == []


@scenario(FEATURE, "Keep the export a raw stream when JSON is requested")
def test_keep_the_export_a_raw_stream_when_json_is_requested() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@when("the user exports events once with --json and once without it")
def when_export_with_and_without_json(session: Session) -> None:
    arguments = ["events", "export", "--format", "jsonl"]
    session.machine = session.run([*arguments, "--json"])
    session.human = session.run(arguments)


@then("the export with --json exits 2 with the closed ferret.args.invalid error on stderr and nothing on stdout")
def then_the_json_export_is_refused(session: Session) -> None:
    assert session.machine is not None
    assert (session.machine.returncode, session.machine.stdout, session.machine.stderr.count(b"\n")) == (2, b"", 1)
    assert json.loads(session.machine.stderr) == {
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


@then("the export without --json writes one canonical event object per line")
def then_the_plain_export_is_json_lines(session: Session) -> None:
    assert session.human is not None
    assert (session.human.returncode, session.human.stderr) == (0, b"")
    stored = {int(document["eventId"][-12:]): document for document in session.population}
    assert session.human.stdout.splitlines(keepends=True) == [line_of(stored[number]) for number in (1, 2, 3)]


@scenario(FEATURE, "Use FERRET without a backend")
def test_use_ferret_without_a_backend() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("no backend URL, token, or process exists")
def given_no_backend_url_token_or_process(session: Session, socket_log: Path) -> None:
    config = json.loads((session.data_home / "config.json").read_text(encoding="utf-8"))
    session.environment = denied_socket_environment(socket_log)
    # Beyond the denial itself the artifact is given nothing to reach a backend with, and the disk holds nothing either.
    assert set(session.environment) == {"PYTHONPATH", LOG_VARIABLE}
    assert backend_traces(path.name for path in session.data_home.iterdir()) == []
    assert backend_traces(config) == []
    assert attempted(socket_log) == []


@when("the user captures, lists, exports, summarizes, and maintains local events")
def when_every_local_command_runs(session: Session, workdir: Path) -> None:
    session.population = [numbered_event(1, now=session.now, ago=timedelta(seconds=1))]
    session.commands = run_local_commands(
        session.artifact, session.home, event=session.population[0], cwd=workdir, environment=session.environment
    )


@then("every command completes using only the local data home")
def then_every_command_completes_from_the_data_home(session: Session, workdir: Path) -> None:
    event = session.population[0]
    assert {name: (done.returncode, done.stderr) for name, done in session.commands.items()} == dict.fromkeys(
        LOCAL_COMMANDS, (0, b"")
    )
    listing = json.loads(session.commands["events list"].stdout)
    assert [item["eventId"] for item in listing["items"]] == [event["eventId"]]
    assert session.commands["events export"].stdout == line_of(event)
    for summary in ("usage", "outcomes"):
        assert sum(row["eventCount"] for row in json.loads(session.commands[summary].stdout)["rows"]) == 1
    assert json.loads(session.commands["maintenance"].stdout)["result"] == "completed"
    # Nothing was written outside the data home: not beside it in HOME and not in the directory the commands ran from.
    assert {path.name for path in session.home.iterdir()} == {".local"}
    assert list(workdir.iterdir()) == []


@then("status identifies backend synchronization as unavailable by design")
def then_status_names_the_backend_as_unavailable(session: Session) -> None:
    machine = session.run(["status", "--json"], environment=session.environment)
    human = session.run(["status"], environment=session.environment)

    assert (machine.returncode, machine.stderr, human.returncode, human.stderr) == (0, b"", 0, b"")
    assert json.loads(machine.stdout)["backend"] == {"state": "not_available_in_this_version"}
    assert b"Backend: not_available_in_this_version" in human.stdout.splitlines()


@then("no network connection is attempted")
def then_no_network_connection_is_attempted(socket_log: Path) -> None:
    assert attempted(socket_log) == []
