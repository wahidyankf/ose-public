"""Run one isolated manual-evidence case against a built FERRET artifact and record only safe facts about it.

Usage: manual_evidence.py {capture,query,install} --run-id ID --raw-root local-tmp/ferret-plan01/ID
                                                   --bin PATH-TO-ARTIFACT --summary PATH

Every child process gets a home, an XDG data directory, and a FERRET data directory beneath its own case directory
inside the run's raw root, and nothing else from the caller's environment, so no command can touch the real user's
files. The raw root must be exactly ``local-tmp/ferret-plan01/<run-id>`` relative to the repository (the working
directory); it is created with a run marker, and an existing directory is reused only when it carries the same
marker, so nothing this helper did not create is ever written to or removed.

Raw stdin, stdout, and stderr of every command stay in the raw root. The tracked summary holds only case and command
labels, numeric exits, byte counts, relative file names, SHA-256 values, and assertion results, never a payload, an
environment value, a user name, or an absolute path. Exit status: 0 every assertion held, 1 one did not, 2 the
arguments or the raw root were refused, 3 the host cannot run FERRET.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, cast

CASES = ("capture", "query", "install")
MARKER = ".ferret-plan01-run"
RAW_PARENT = Path("local-tmp") / "ferret-plan01"
RUN_ID = re.compile(r"[a-z0-9][a-z0-9-]{0,63}")
CHILD_TIMEOUT_SECONDS = 30
MINIMUM_PYTHON = (3, 14)

UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}")
HASHED_ORDER = (
    "schemaVersion",
    "eventId",
    "occurredAt",
    "capturedAt",
    "harness",
    "harnessVersion",
    "installationId",
    "workspaceId",
    "sessionId",
    "parentSessionId",
    "eventType",
    "agentName",
    "skillName",
    "toolName",
    "outcome",
    "durationMs",
    "subjectVisibility",
    "outcomeVisibility",
    "durationVisibility",
)
DOCUMENT_ORDER = (*HASHED_ORDER[:2], "eventHash", *HASHED_ORDER[2:])
USAGE_NOTE = "Operational usage only; unknown subject visibility is not zero usage."
OUTCOMES_NOTE = "Operational correlation only; this is not semantic quality or causal attribution."
NO_ROWS = "No rows.\n"

Document = dict[str, Any]


def as_object(value: object) -> Document | None:
    """``value`` when it is a JSON object, else ``None``."""
    return cast(Document, value) if isinstance(value, dict) else None


def as_list(value: object) -> list[Any] | None:
    """``value`` when it is a JSON array, else ``None``."""
    return cast(list[Any], value) if isinstance(value, list) else None


class RefusedError(Exception):
    """The arguments or the raw root are not ones this helper may act on; nothing was created or changed."""


@dataclass(frozen=True)
class Result:
    """One finished child: its label, exit status, and the exact bytes it wrote."""

    label: str
    code: int
    stdout: bytes
    stderr: bytes

    def json(self) -> Document:
        document = as_object(json.loads(self.stdout))
        if document is None:
            raise ValueError("not an object")
        return document

    def error(self) -> Document:
        """The closed failure document a failed command writes to stderr."""
        document = as_object(json.loads(self.stderr))
        if document is None:
            raise ValueError("not an object")
        return document


@dataclass
class Session:
    """One case's isolated roots, the artifact under test, and the summary being built."""

    case: str
    root: Path
    artifact: Path
    lines: list[str] = field(default_factory=list[str])
    failures: int = 0
    steps: int = 0

    @property
    def home(self) -> Path:
        return self.root / "home"

    @property
    def data_home(self) -> Path:
        return self.root / "data"

    def environment(self) -> dict[str, str]:
        """The only variables a child sees: three roots beneath the case directory, a fixed path, and a locale."""
        return {
            "HOME": str(self.home),
            "XDG_DATA_HOME": str(self.root / "xdg-data"),
            "FERRET_DATA_HOME": str(self.data_home),
            "PATH": "/usr/bin:/bin",
            "LC_ALL": "C",
            "TZ": "UTC",
        }

    def run(self, label: str, arguments: Sequence[str], *, stdin: bytes = b"") -> Result:
        """Run one command, keep its raw streams in the case directory, and record its facts in the summary."""
        try:
            done = subprocess.run(
                [sys.executable, str(self.artifact), *arguments],
                input=stdin,
                capture_output=True,
                env=self.environment(),
                cwd=self.root / "work",
                timeout=CHILD_TIMEOUT_SECONDS,
                check=False,
            )
            result = Result(label, done.returncode, done.stdout, done.stderr)
        except subprocess.TimeoutExpired as expired:
            result = Result(label, 124, expired.stdout or b"", expired.stderr or b"")
        return self.record(result, stdin=stdin)

    def record(self, result: Result, *, stdin: bytes = b"") -> Result:
        """Keep one finished child's raw streams in the case directory and add its facts to the summary."""
        self.steps += 1
        stem = f"{self.steps:02d}-{result.label}"
        raw = self.root / "raw"
        raw.mkdir(exist_ok=True)
        (raw / f"{stem}.stdin").write_bytes(stdin)
        (raw / f"{stem}.stdout").write_bytes(result.stdout)
        (raw / f"{stem}.stderr").write_bytes(result.stderr)
        relative = f"{self.case}/raw/{stem}"
        self.lines += [
            f"command={result.label}",
            f"exit={result.code}",
            f"bytes=stdout:{len(result.stdout)} stderr:{len(result.stderr)}",
            f"sha256={sha256(result.stdout)} {relative}.stdout",
        ]
        if result.stderr:
            self.lines.append(f"sha256={sha256(result.stderr)} {relative}.stderr")
        return result

    def check(self, name: str, held: bool) -> bool:
        """Record one assertion by its fixed label; the label never carries a value."""
        self.lines.append(f"assertion={name}: {'pass' if held else 'FAIL'}")
        self.failures += 0 if held else 1
        return held


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stamp(moment: datetime) -> str:
    """The canonical millisecond spelling of an aware UTC moment."""
    return f"{moment:%Y-%m-%dT%H:%M:%S}.{moment.microsecond // 1000:03d}Z"


def oracle_hash(document: dict[str, Any]) -> str:
    """The event hash computed here, independently of the artifact: fixed order, no hash field, compact UTF-8."""
    ordered = {name: document[name] for name in HASHED_ORDER}
    return sha256(json.dumps(ordered, separators=(",", ":"), ensure_ascii=False).encode("utf-8"))


def sealed(**fields: Any) -> dict[str, Any]:
    """A canonical event in document order whose hash matches its other fields."""
    document = {**fields, "eventHash": oracle_hash(fields)}
    return {name: document[name] for name in DOCUMENT_ORDER}


def encode(document: dict[str, Any]) -> bytes:
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def event(installation: str, number: int, moment: datetime, **overrides: Any) -> dict[str, Any]:
    """A sealed event that occurred at ``moment``, with identifiers derived from ``number``."""
    fields: dict[str, Any] = {
        "schemaVersion": "1.0",
        "eventId": f"00000000-0000-4000-8000-{number:012d}",
        "occurredAt": stamp(moment),
        "capturedAt": stamp(moment + timedelta(milliseconds=7)),
        "harness": "claude_code",
        "harnessVersion": "1.0.123",
        "installationId": installation,
        "workspaceId": f"ws_{number:032x}",
        "sessionId": f"ss_{number:032x}",
        "parentSessionId": None,
        "eventType": "session.started",
        "agentName": None,
        "skillName": None,
        "toolName": None,
        "outcome": "not_applicable",
        "durationMs": None,
        "subjectVisibility": "not_applicable",
        "outcomeVisibility": "not_applicable",
        "durationVisibility": "not_applicable",
    }
    return sealed(**{**fields, **overrides})


def quiet(result: Result) -> bool:
    """No output at all on either stream."""
    return not result.stdout and not result.stderr


def parses(result: Result) -> dict[str, Any] | None:
    try:
        return result.json()
    except ValueError:
        return None


def failure_shape(result: Result, command: str, code: str, exit_code: int) -> bool:
    """A failed command writes nothing to stdout and the closed failure document, alone, to stderr."""
    if result.stdout or result.code != exit_code:
        return False
    try:
        document = result.error()
    except ValueError:
        return False
    error = as_object(document.get("error"))
    return bool(
        list(document) == ["schemaVersion", "command", "exitCode", "error"]
        and document["schemaVersion"] == 1
        and document["command"] == command
        and document["exitCode"] == exit_code
        and error is not None
        and list(error) == ["code", "field", "retryable"]
        and error["code"] == code
        and error["retryable"] is False
    )


def within(path: object, root: Path) -> bool:
    return isinstance(path, str) and Path(path).is_relative_to(root)


def mode(path: Path) -> int:
    return stat.S_IMODE(path.lstat().st_mode)


def store_bytes(session: Session) -> bytes:
    """Every byte of every file in the case's data home."""
    return b"".join(p.read_bytes() for p in sorted(session.data_home.rglob("*")) if p.is_file())


def initialize(session: Session) -> dict[str, Any] | None:
    """Run ``init`` and check its result against the contract; the database it creates is each case's prerequisite."""
    result = session.run("init", ["init", "--json"])
    document = parses(result)
    keys = [
        "schemaVersion",
        "command",
        "exitCode",
        "result",
        "dataHome",
        "databasePath",
        "schemaNumber",
        "installationId",
        "retentionDays",
        "permissionsState",
    ]
    held = (
        result.code == 0
        and not result.stderr
        and document is not None
        and list(document) == keys
        and document["schemaVersion"] == 1
        and document["command"] == "init"
        and document["exitCode"] == 0
        and document["result"] == "created"
        and document["schemaNumber"] == 1
        and document["retentionDays"] == 30
        and document["permissionsState"] == "private"
        and UUID.fullmatch(str(document["installationId"])) is not None
    )
    session.check("init reports the created contract shape", held)
    if not held or document is None:
        return None
    database = session.data_home / "ferret.sqlite3"
    session.check(
        "the data home and database are inside the case directory",
        within(document["dataHome"], session.root)
        and within(document["databasePath"], session.root)
        and database.is_file(),
    )
    session.check(
        "the data home and database are private",
        mode(session.data_home) == 0o700 and mode(database) == 0o600,
    )
    return document


def stored(session: Session, label: str, document: dict[str, Any], expected: str) -> Result:
    """Capture one event and check the wrapper: its result, its identifier, and the independently computed hash."""
    result = session.run(label, ["capture", "--json"], stdin=encode(document))
    reply = parses(result)
    session.check(
        f"{label} reports {expected} with the independently computed hash",
        result.code == 0
        and not result.stderr
        and reply is not None
        and list(reply) == ["schemaVersion", "command", "exitCode", "result", "eventId", "eventHash"]
        and reply["command"] == "capture"
        and reply["result"] == expected
        and reply["eventId"] == document["eventId"]
        and reply["eventHash"] == oracle_hash(document),
    )
    return result


HOOK_PAYLOAD: dict[str, Any] = {
    "session_id": "manual-session-0001",
    "cwd": "",
    "hook_event_name": "PreToolUse",
    "tool_name": "Read",
    "tool_use_id": "toolu_manual",
    "tool_input": {"file_path": "manual-canary-argument"},
    "prompt": "manual-canary-prompt",
    "transcript_path": "manual-canary-transcript",
}


def run_capture(session: Session) -> None:
    initialization = initialize(session)
    if initialization is None:
        return
    installation = str(initialization["installationId"])
    now = datetime.now(UTC)
    tool = event(
        installation,
        1,
        now - timedelta(hours=1),
        eventType="tool.completed",
        toolName="Read",
        outcome="success",
        durationMs=27,
        subjectVisibility="observed",
        outcomeVisibility="observed",
        durationVisibility="observed",
    )
    stored(session, "capture-stored", tool, "stored")
    stored(session, "capture-duplicate", tool, "duplicate")
    conflicting = event(
        installation,
        1,
        now - timedelta(hours=1),
        eventType="tool.completed",
        toolName="Write",
        outcome="success",
        durationMs=27,
        subjectVisibility="observed",
        outcomeVisibility="observed",
        durationVisibility="observed",
    )
    conflict = session.run("capture-conflict", ["capture", "--json"], stdin=encode(conflicting))
    session.check(
        "the same id with different content is refused as a safe idempotency conflict",
        failure_shape(conflict, "capture", "idempotency_conflict", 2)
        and b"Write" not in conflict.stderr
        and b"Read" not in conflict.stderr,
    )
    payload = {**HOOK_PAYLOAD, "cwd": str(session.root / "work")}
    hook = session.run(
        "capture-hook",
        ["capture-hook", "--harness", "claude_code", "--event", "tool.started"],
        stdin=encode(payload),
    )
    session.check("capture-hook writes zero bytes to either stream and exits zero", hook.code == 0 and quiet(hook))
    status = session.run("status", ["status", "--json"])
    reply = parses(status)
    session.check(
        "status counts the captured event and the hook event and reports a healthy private store",
        status.code == 0
        and not status.stderr
        and reply is not None
        and reply.get("command") == "status"
        and reply.get("databaseState") == "healthy"
        and reply.get("integrityState") == "ok"
        and reply.get("permissionsState") == "private"
        and reply.get("eventCount") == 2
        and reply.get("backend") == {"state": "not_available_in_this_version"}
        and reply.get("expiredBeforeAckTotal") == 0,
    )
    leaked = [
        needle
        for needle in (
            b"manual-canary-argument",
            b"manual-canary-prompt",
            b"manual-canary-transcript",
            str(session.root).encode(),
            str(session.home).encode(),
        )
        if needle in store_bytes(session)
    ]
    session.check("no payload content or path reached any byte of the data home", not leaked)


QUERY_TOOLS: tuple[tuple[str, dict[str, Any]], ...] = (
    (
        "read-completed",
        {
            "eventType": "tool.completed",
            "toolName": "Read",
            "outcome": "success",
            "durationMs": 27,
            "subjectVisibility": "observed",
            "outcomeVisibility": "observed",
            "durationVisibility": "observed",
        },
    ),
    (
        "bash-failed",
        {
            "eventType": "tool.failed",
            "toolName": "Bash",
            "outcome": "failure",
            "durationMs": 12,
            "subjectVisibility": "observed",
            "outcomeVisibility": "observed",
            "durationVisibility": "observed",
        },
    ),
    ("skill", {"eventType": "skill.invoked", "skillName": "ci-standards", "subjectVisibility": "observed"}),
    (
        "codex-agent",
        {"harness": "codex", "eventType": "agent.started", "agentName": "worker", "subjectVisibility": "observed"},
    ),
    (
        "codex-bash-completed",
        {
            "harness": "codex",
            "eventType": "tool.completed",
            "toolName": "Bash",
            "outcome": "success",
            "durationMs": None,
            "subjectVisibility": "observed",
            "outcomeVisibility": "derived",
            "durationVisibility": "unknown",
        },
    ),
    ("session", {"eventType": "session.started"}),
)


def canonical(line: bytes) -> dict[str, Any] | None:
    """One exported or listed event when it is a canonical object with a matching hash, else ``None``."""
    try:
        document = as_object(json.loads(line))
    except ValueError:
        return None
    if document is None or list(document) != list(DOCUMENT_ORDER):
        return None
    return document if document["eventHash"] == oracle_hash(document) else None


def sorted_descending(events: list[dict[str, Any]]) -> bool:
    keys = [(item["occurredAt"], item["eventId"]) for item in events]
    return keys == sorted(keys, reverse=True)


def list_pages(session: Session) -> tuple[list[dict[str, Any]], str | None, bool]:
    """Walk ``events list --limit 2`` to its end; return every event, the first page's cursor, and whether all held."""
    events: list[dict[str, Any]] = []
    first_cursor: str | None = None
    cursor: str | None = None
    held = True
    for page in range(1, 8):
        arguments = ["events", "list", "--json", "--all-time", "--limit", "2"]
        arguments += [] if cursor is None else ["--cursor", cursor]
        result = session.run(f"events-list-page-{page}", arguments)
        reply = parses(result)
        items = None if reply is None else reply.get("items")
        held = (
            held
            and result.code == 0
            and not result.stderr
            and reply is not None
            and list(reply) == ["schemaVersion", "command", "exitCode", "items", "nextCursor"]
            and reply["command"] == "events.list"
            and items is not None
            and len(items) <= 2
            and all(canonical_item(item) for item in items)
        )
        if not held or reply is None or items is None:
            break
        events += items
        cursor = reply["nextCursor"]
        if page == 1:
            first_cursor = cursor
        if cursor is None:
            break
    return events, first_cursor, held


def canonical_item(item: object) -> bool:
    """Whether ``item`` is a canonical event object whose hash matches its other fields."""
    document = as_object(item)
    return document is not None and canonical(encode(document)) is not None


def dimension_values(row: Document) -> list[Any]:
    return [dimension["value"] for dimension in row["dimensions"]]


def null_last(values: list[Any]) -> bool:
    strings = [value for value in values if value is not None]
    return values == sorted(strings) + [None] * (len(values) - len(strings))


def run_query(session: Session) -> None:
    initialization = initialize(session)
    if initialization is None:
        return
    installation = str(initialization["installationId"])
    now = datetime.now(UTC)
    seeded: list[dict[str, Any]] = []
    for number, (label, fields) in enumerate(QUERY_TOOLS, start=1):
        document = event(installation, number, now - timedelta(hours=len(QUERY_TOOLS) - number + 1), **fields)
        seeded.append(document)
        stored(session, f"seed-{label}", document, "stored")
    status = session.run("status", ["status", "--json"])
    reply = parses(status)
    session.check(
        "the prerequisite database holds exactly the seeded events",
        status.code == 0 and reply is not None and reply.get("eventCount") == len(seeded),
    )
    newest_first = sorted(seeded, key=lambda item: (item["occurredAt"], item["eventId"]), reverse=True)

    events, first_cursor, held = list_pages(session)
    session.check("every list page is a canonical, hash-verified page of at most two events", held)
    session.check(
        "paging visits every event once, newest first",
        events == newest_first and sorted_descending(events),
    )
    session.check("a full first page carries a cursor", first_cursor is not None)

    mismatched = session.run(
        "invalid-cursor",
        ["events", "list", "--json", "--all-time", "--limit", "3", "--cursor", first_cursor or "missing"],
    )
    session.check(
        "a cursor from another limit is refused as a safe invalid cursor",
        failure_shape(mismatched, "events.list", "invalid_cursor", 2),
    )

    export = session.run("events-export", ["events", "export", "--format", "jsonl"])
    exported = [canonical(line) for line in export.stdout.splitlines()]
    session.check(
        "export writes every event oldest first as canonical hash-verified lines and nothing else",
        export.code == 0
        and not export.stderr
        and export.stdout.endswith(b"\n")
        and all(item is not None for item in exported)
        and exported == list(reversed(newest_first)),
    )

    usage = session.run("usage-by-skill", ["usage", "--json", "--group-by", "skill"])
    reply = parses(usage)
    rows: list[Any] = [] if reply is None else as_list(reply.get("rows")) or []
    session.check(
        "usage keeps its contract shape, counts every event once, sorts null last, and states its disclaimer",
        usage.code == 0
        and not usage.stderr
        and reply is not None
        and list(reply) == ["schemaVersion", "command", "exitCode", "groupBy", "rows", "interpretation"]
        and reply["groupBy"] == ["skill"]
        and reply["interpretation"] == USAGE_NOTE
        and sum(row["eventCount"] for row in rows) == len(seeded)
        and null_last([dimension_values(row)[0] for row in rows])
        and any(dimension_values(row) == ["ci-standards"] and row["eventCount"] == 1 for row in rows),
    )

    outcomes = session.run("outcomes-by-tool", ["outcomes", "--json", "--group-by", "tool"])
    reply = parses(outcomes)
    rows: list[Any] = [] if reply is None else as_list(reply.get("rows")) or []
    by_tool: dict[Any, Document] = {dimension_values(row)[0]: row for row in rows}
    read, bash, none = by_tool.get("Read", {}), by_tool.get("Bash", {}), by_tool.get(None, {})
    session.check(
        "outcomes keep their contract shape, never count not-applicable outcomes, and state their disclaimer",
        outcomes.code == 0
        and not outcomes.stderr
        and reply is not None
        and list(reply) == ["schemaVersion", "command", "exitCode", "groupBy", "rows", "interpretation"]
        and reply["interpretation"] == OUTCOMES_NOTE
        and null_last(list(by_tool))
        and (read.get("eventCount"), read.get("successCount"), read.get("durationTotalMs")) == (1, 1, 27)
        and (bash.get("eventCount"), bash.get("successCount"), bash.get("failureCount")) == (2, 1, 1)
        and (bash.get("durationSampleCount"), bash.get("durationMinMs"), bash.get("durationMaxMs")) == (1, 12, 12)
        and (none.get("eventCount"), none.get("successCount"), none.get("failureCount")) == (3, 0, 0)
        and none.get("durationSampleCount") == 0
        and none.get("durationTotalMs") is None
        and none.get("durationMinMs") is None
        and none.get("durationMaxMs") is None,
    )

    empty = session.run("events-list-empty", ["events", "list", "--harness", "opencode"])
    session.check(
        "an empty human result writes nothing to stdout and the fixed line to stderr",
        empty.code == 0 and not empty.stdout and empty.stderr.decode() == NO_ROWS,
    )
    session.check(
        "no output of the case holds a terminal escape",
        b"\x1b" not in b"".join(p.read_bytes() for p in (session.root / "raw").glob("*.std*")),
    )


def files_at(session: Session, *names: str) -> dict[str, str]:
    """The SHA-256 of each named file under the case home, or ``missing``."""
    found: dict[str, str] = {}
    for name in names:
        path = session.home / name
        found[name] = sha256(path.read_bytes()) if path.is_file() and not path.is_symlink() else "missing"
    return found


UNOWNED = {".local/bin/unowned-tool": "not installed by ferret\n", ".local/share/other-tool/keep.txt": "keep me\n"}


def run_install(session: Session) -> None:
    initialization = initialize(session)
    if initialization is None:
        return
    for name, content in UNOWNED.items():
        path = session.home / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        path.chmod(0o755 if "bin" in name else 0o644)
    unowned = files_at(session, *UNOWNED)
    share = session.home / ".local" / "share" / "ferret"
    launcher = session.home / ".local" / "bin" / "ferret"
    manifest = share / "install.json"
    artifact_digest = sha256(session.artifact.read_bytes())
    keys = [
        "schemaVersion",
        "command",
        "exitCode",
        "result",
        "version",
        "artifactPath",
        "launcherPath",
        "manifestPath",
        "pathAction",
        "replacedOwnedVersion",
    ]

    states: list[str] = []
    first = session.run("install", ["self", "install", "--target", "user", "--json"])
    reply = parses(first)
    states.append(str(reply.get("result")) if reply else "none")
    installed_artifact = None if reply is None else Path(str(reply.get("artifactPath")))
    session.check(
        "install reports installed with its contract shape and only paths inside the case home",
        first.code == 0
        and not first.stderr
        and reply is not None
        and list(reply) == keys
        and reply["command"] == "self.install"
        and reply["result"] == "installed"
        and reply["pathAction"] in ("none", "add_home_local_bin")
        and reply["replacedOwnedVersion"] is None
        and all(within(reply[name], session.home) for name in ("artifactPath", "launcherPath", "manifestPath"))
        and Path(reply["manifestPath"]) == manifest
        and Path(reply["launcherPath"]) == launcher,
    )
    session.check(
        "the installed artifact is the built artifact, private, with a launcher link and a private manifest",
        installed_artifact is not None
        and installed_artifact.is_file()
        and sha256(installed_artifact.read_bytes()) == artifact_digest
        and mode(installed_artifact) == 0o700
        and launcher.is_symlink()
        and Path(os.readlink(launcher)) == installed_artifact
        and manifest.is_file()
        and mode(manifest) == 0o600,
    )
    installed_stamp = None if installed_artifact is None else installed_artifact.stat().st_mtime_ns

    again = session.run("install-again", ["self", "install", "--target", "user", "--json"])
    reply = parses(again)
    states.append(str(reply.get("result")) if reply else "none")
    session.check(
        "a second install reports already_installed and rewrites nothing",
        again.code == 0
        and not again.stderr
        and reply is not None
        and reply.get("result") == "already_installed"
        and installed_artifact is not None
        and installed_artifact.stat().st_mtime_ns == installed_stamp,
    )

    kept = session.run("uninstall-keep-data", ["self", "uninstall", "--json"])
    reply = parses(kept)
    states.append(str(reply.get("dataAction")) if reply else "none")
    owned = None if reply is None else as_list(reply.get("removedPaths"))
    session.check(
        "uninstall removes exactly the three owned paths, sorted, and keeps the data",
        kept.code == 0
        and not kept.stderr
        and reply is not None
        and list(reply)
        == ["schemaVersion", "command", "exitCode", "result", "removedPaths", "pathAction", "dataAction"]
        and reply["result"] == "uninstalled"
        and reply["pathAction"] == "none"
        and reply["dataAction"] == "kept"
        and owned is not None
        and owned == sorted(owned)
        and {str(launcher), str(manifest)} <= set(owned)
        and len(owned) == 3
        and not launcher.exists()
        and not launcher.is_symlink()
        and not manifest.exists()
        and installed_artifact is not None
        and not installed_artifact.exists()
        and (session.data_home / "ferret.sqlite3").is_file(),
    )
    session.check(
        "nothing FERRET did not install was removed after the first uninstall", files_at(session, *UNOWNED) == unowned
    )

    purged = session.run("uninstall-purge-data", ["self", "uninstall", "--purge-data", "--yes", "--json"])
    reply = parses(purged)
    states.append("purged" if reply and reply.get("dataAction") == "deleted" else "none")
    session.check(
        "uninstall with purge and confirmation deletes the data home and reports nothing left to remove",
        purged.code == 0
        and not purged.stderr
        and reply is not None
        and reply.get("result") == "not_installed"
        and reply.get("dataAction") == "deleted"
        and reply.get("removedPaths") == []
        and not session.data_home.exists(),
    )
    session.check("nothing FERRET did not install was removed after the purge", files_at(session, *UNOWNED) == unowned)
    session.check(f"install-states {' '.join(states)}", states == ["installed", "already_installed", "kept", "purged"])


RUNNERS: dict[str, Callable[[Session], None]] = {"capture": run_capture, "query": run_query, "install": run_install}


def claim_root(raw_root: str, run_id: str) -> Path:
    """The repository-relative raw root for ``run_id``, created with its marker or reused because it carries it."""
    if RUN_ID.fullmatch(run_id) is None:
        raise RefusedError("the run id must be lower-case letters, digits, and hyphens")
    if Path(raw_root) != RAW_PARENT / run_id:
        raise RefusedError("the raw root must be exactly local-tmp/ferret-plan01/<run-id>, relative to the repository")
    root = Path.cwd() / RAW_PARENT / run_id
    marker = root / MARKER
    if root.is_symlink():
        raise RefusedError("the raw root is a link")
    if root.exists():
        if not marker.is_file() or marker.read_text() != f"{run_id}\n":
            raise RefusedError("the raw root exists without this run's marker")
    else:
        root.mkdir(parents=True)
        marker.write_text(f"{run_id}\n")
    return root


def fresh_case_directory(root: Path, case: str) -> Path:
    """An empty directory for ``case`` inside the owned root, replacing a previous run of the same case."""
    directory = root / case
    if directory.exists():
        shutil.rmtree(directory)
    (directory / "home").mkdir(parents=True)
    (directory / "work").mkdir()
    return directory


def parse(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="manual_evidence.py", description=(__doc__ or "").split("\n\n")[0])
    parser.add_argument("case", choices=CASES)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--raw-root", required=True)
    parser.add_argument("--bin", required=True, type=Path)
    parser.add_argument("--summary", required=True, type=Path)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    try:
        arguments = parse(argv)
    except SystemExit as stop:
        return 2 if stop.code else 0
    try:
        root = claim_root(arguments.raw_root, arguments.run_id)
    except RefusedError as refusal:
        sys.stderr.write(f"refused: {refusal}\n")
        return 2
    artifact = arguments.bin.resolve()
    if sys.version_info < MINIMUM_PYTHON or not artifact.is_file():
        sys.stderr.write("this host cannot run the artifact under test\n")
        return 3
    session = Session(arguments.case, fresh_case_directory(root, arguments.case), artifact)
    session.lines.append(f"case={arguments.case}")
    RUNNERS[arguments.case](session)
    session.check("every recorded assertion held", session.failures == 0)
    arguments.summary.parent.mkdir(parents=True, exist_ok=True)
    arguments.summary.write_text("\n".join(session.lines) + "\n")
    return 0 if session.failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
