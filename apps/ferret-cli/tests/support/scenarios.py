"""The event populations and expected renderings the query and analytics bindings share across in-process adapters."""

import json
from collections.abc import Iterable, Sequence
from datetime import datetime, timedelta
from typing import Any

from ferret.domain.event import Event
from support.populate import NO_OUTCOME, WORKSPACE_A, WORKSPACE_B, make_event, stamp

MATCHING = (3, 4, 5)

# What each example of the machine-readable outline runs, and the command name its JSON result carries.
INVOCATIONS: dict[str, tuple[list[str], str]] = {
    "init": (["init"], "init"),
    "events list": (["events", "list"], "events.list"),
    "events export": (["events", "export", "--format", "jsonl"], "events.export"),
    "usage": (["usage", "--group-by", "harness,tool"], "usage"),
    "outcomes": (["outcomes", "--group-by", "harness,tool"], "outcomes"),
    "status": (["status"], "status"),
    "maintenance": (["maintenance"], "maintenance"),
    "self install": (["self", "install", "--target", "user"], "self.install"),
    "self uninstall": (["self", "uninstall"], "self.uninstall"),
}
# What the standalone scenario runs, in order, spelled the way a script would; export is a stream, so it has no --json.
LOCAL_COMMANDS: dict[str, list[str]] = {
    "capture": ["capture", "--json"],
    "events list": ["events", "list", "--json"],
    "events export": ["events", "export", "--format", "jsonl"],
    "usage": ["usage", "--group-by", "harness,tool", "--json"],
    "outcomes": ["outcomes", "--group-by", "harness,tool", "--json"],
    "maintenance": ["maintenance", "--json"],
}
# A name containing one of these words would point at a backend, a network address, or a credential.
BACKEND_WORDS = ("backend", "network", "socket", "http", "url", "token", "server")
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


def filter_arguments(now: datetime) -> list[str]:
    """Every filter of the deterministic-export scenario: a three-hour interval ending an hour before ``now``."""
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


def agent_ended(number: int, *, now: datetime, ago: timedelta, **overrides: Any) -> Event:
    """An ``agent.ended`` failure by a Codex agent in the second workspace, changed only where ``overrides`` say."""
    fields: dict[str, Any] = {
        "eventType": "agent.ended",
        "agentName": "reviewer",
        "toolName": None,
        "outcome": "failure",
        "harness": "codex",
        "workspaceId": WORKSPACE_B,
        **overrides,
    }
    return make_event(number, ago=ago, now=now, **fields)


def two_workspaces_and_two_harnesses(now: datetime) -> list[Event]:
    """Three events the filters match (numbers 3 to 5) and six that each miss exactly one filter or interval bound."""
    hours = timedelta(hours=2)
    return [
        agent_ended(1, now=now, ago=timedelta(hours=4)),
        agent_ended(2, now=now, ago=timedelta(hours=1)),
        agent_ended(3, now=now, ago=timedelta(hours=3)),
        agent_ended(4, now=now, ago=hours),
        agent_ended(5, now=now, ago=hours),
        agent_ended(6, now=now, ago=hours, harness="claude_code"),
        agent_ended(7, now=now, ago=hours, workspaceId=WORKSPACE_A),
        agent_ended(
            8, now=now, ago=hours, eventType="session.ended", agentName=None, subjectVisibility="not_applicable"
        ),
        agent_ended(9, now=now, ago=hours, outcome="success"),
    ]


def command_result_events(now: datetime) -> list[Event]:
    """Three recent tool events, one of them failed and one of them without a known duration."""
    return [
        make_event(1, ago=timedelta(minutes=3), now=now),
        make_event(2, ago=timedelta(minutes=2), now=now, durationMs=None, durationVisibility="unknown"),
        make_event(3, ago=timedelta(minutes=1), now=now, toolName="Write", eventType="tool.failed", outcome="failure"),
    ]


def incomplete_visibility_events(now: datetime) -> list[Event]:
    """Two observed successes, an observed failure without a duration, a derived cancellation, an unknown outcome."""
    return [
        make_event(1, ago=timedelta(minutes=5), now=now, durationMs=10),
        make_event(2, ago=timedelta(minutes=4), now=now, durationMs=27),
        make_event(
            3,
            ago=timedelta(minutes=3),
            now=now,
            eventType="tool.failed",
            outcome="failure",
            durationMs=None,
            durationVisibility="unknown",
        ),
        make_event(
            4,
            ago=timedelta(minutes=2),
            now=now,
            eventType="agent.ended",
            agentName="reviewer",
            toolName=None,
            outcome="cancelled",
            outcomeVisibility="derived",
            durationMs=5,
            durationVisibility="derived",
        ),
        make_event(
            5,
            ago=timedelta(minutes=1),
            now=now,
            eventType="session.ended",
            toolName=None,
            subjectVisibility="not_applicable",
            outcome="unknown",
            outcomeVisibility="unknown",
            durationMs=None,
            durationVisibility="unknown",
        ),
        make_event(6, ago=timedelta(seconds=30), now=now, eventType="tool.started", **NO_OUTCOME),
    ]


def backend_traces(names: Iterable[str]) -> list[str]:
    """The names among ``names`` that mention a backend, a network address, or a credential."""
    return [name for name in names if any(word in name.lower() for word in BACKEND_WORDS)]


def canonical_line(event: Event) -> str:
    """One export line: the canonical compact object followed by a line feed, encoded independently of the CLI."""
    return json.dumps(event.to_document(), separators=(",", ":"), ensure_ascii=False) + "\n"


def table(text: str) -> list[list[str]]:
    return [line.split("\t") for line in text.splitlines()]


def cells(values: Sequence[Any]) -> list[str]:
    return ["-" if value is None else str(value) for value in values]


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
        f"Backend: {document['backend']['state']}",
        *(
            f"Adapter {adapter['harness']}: {adapter['platformSupport']}/{adapter['configurationState']}"
            f"/{scalar(adapter['latestSnapshotId'])}"
            for adapter in document["adapters"]
        ),
    ]


def expected_table(command: str, document: dict[str, Any]) -> list[list[str]]:
    """The tab-separated rows a JSON result must render as, derived from that same result."""
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
