"""Seed expiry relative to one instant into an isolated FERRET store, hold its write lock, and run the retention matrix.

Usage: manual_retention_fixture.py run-matrix --run-id ID --raw-root local-tmp/ferret-plan01/ID --bin PATH-TO-ARTIFACT
                                              --reference-now UTC-INSTANT --expired-events N --expired-snapshots N
                                              --retained-events N --summary PATH
       manual_retention_fixture.py hold-lock --database PATH --ready-file PATH --release-file PATH

``run-matrix`` owns the same raw-root rules as ``manual_evidence.py``: the root is exactly
``local-tmp/ferret-plan01/<run-id>`` relative to the working directory, it carries a run marker, and it is reused only
when the marker matches. Its case directory holds every raw stream, the isolated home, XDG data home, and FERRET data
home, so nothing outside it is read or written. Only the store ``init`` created there is written to directly, and only
by ``seed_relative``: expired rows expire at or before ``--reference-now`` (the newest exactly at it) and retained rows
expire a month after it, so no production clock or configuration is touched. The tracked summary holds only labels,
numeric exits, byte counts, relative file names, SHA-256 values, and assertion results.

``hold-lock`` takes the store's write lock in its own process, announces it through ``--ready-file``, and gives it up
when ``--release-file`` appears. It stops on its own after ten seconds, so a lock is never held longer than that.
Exit status of ``run-matrix``: 0 every assertion held, 1 one did not, 2 the arguments or the raw root were refused,
3 the host cannot run FERRET. Exit status of ``hold-lock``: 0 released, 2 refused, 4 hard stop, 5 lock unavailable.
"""

import argparse
import re
import sqlite3
import subprocess
import sys
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

TESTS = Path(__file__).resolve().parents[1]
if str(TESTS) not in sys.path:
    sys.path.insert(0, str(TESTS))

from support.manual_evidence import (  # noqa: E402
    MINIMUM_PYTHON,
    RefusedError,
    Result,
    Session,
    as_list,
    as_object,
    canonical_item,
    claim_root,
    event,
    fresh_case_directory,
    initialize,
    parses,
    stamp,
)
from support.snapshots import snapshot_document  # noqa: E402

RELEASED = 0
REFUSED = 2
HARD_STOP = 4
UNAVAILABLE = 5
HANDSHAKE_SECONDS = 10.0
POLL_SECONDS = 0.005
PRUNE_ROW_LIMIT = 100
RETENTION = timedelta(days=30)
RETAINED_AGE = timedelta(hours=1)
LATEST_REFERENCE_AGE = timedelta(hours=1)
MAX_EXPIRED_EVENTS = 5000
MAX_EXPIRED_SNAPSHOTS = 1000
MAX_RETAINED_EVENTS = 100
RETAINED_BASE = 9000
SNAPSHOT_BASE = 7000
EXPIRED_WORKSPACE = f"ws_{0xE0:032x}"
RETAINED_WORKSPACE = f"ws_{0xF0:032x}"
INSTANT = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z")

# The stored column of each event field, in the order the packaged schema declares them; the expiry is computed.
EVENT_COLUMNS = {
    "event_id": "eventId",
    "event_hash": "eventHash",
    "schema_version": "schemaVersion",
    "occurred_at": "occurredAt",
    "captured_at": "capturedAt",
    "harness": "harness",
    "harness_version": "harnessVersion",
    "installation_id": "installationId",
    "workspace_id": "workspaceId",
    "session_id": "sessionId",
    "parent_session_id": "parentSessionId",
    "event_type": "eventType",
    "agent_name": "agentName",
    "skill_name": "skillName",
    "tool_name": "toolName",
    "outcome": "outcome",
    "duration_ms": "durationMs",
    "subject_visibility": "subjectVisibility",
    "outcome_visibility": "outcomeVisibility",
    "duration_visibility": "durationVisibility",
}
INSERT_EVENT = (
    f"INSERT INTO event ({', '.join([*EVENT_COLUMNS, 'expires_at'])})"
    f" VALUES ({', '.join(f':{name}' for name in [*EVENT_COLUMNS, 'expires_at'])})"
)
INSERT_WORKSPACE = "INSERT INTO workspace (workspace_id, first_seen_at, last_seen_at) VALUES (?, ?, ?)"
INSERT_SNAPSHOT = (
    "INSERT INTO capability_snapshot"
    " (snapshot_id, snapshot_hash, schema_version, captured_at, expires_at, harness, harness_version, installation_id)"
    " VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
)
INSERT_ITEM = "INSERT INTO capability_item (snapshot_id, capability_name, state, source) VALUES (?, ?, ?, ?)"
SELECT_INSPECTION = (
    "SELECT"
    " (SELECT count(*) FROM event WHERE expires_at <= :now),"
    " (SELECT count(*) FROM capability_snapshot WHERE expires_at <= :now),"
    " (SELECT count(*) FROM event WHERE expires_at > :now),"
    " (SELECT count(*) FROM capability_snapshot WHERE expires_at > :now),"
    " (SELECT count(*) FROM workspace),"
    " (SELECT value FROM operational_counter WHERE name = 'expired_local_total'),"
    " (SELECT value FROM operational_counter WHERE name = 'expired_before_ack_total'),"
    " (SELECT last_completed_at FROM maintenance_state WHERE singleton_id = 1)"
)


@dataclass(frozen=True)
class Inspection:
    """The physical state of the store at one instant: which rows are expired, the counters, and the marker."""

    expired_events: int
    expired_snapshots: int
    live_events: int
    live_snapshots: int
    workspaces: int
    expired_local_total: int
    expired_before_ack_total: int
    marker: str | None


def identifier(number: int) -> str:
    return f"00000000-0000-4000-8000-{number:012d}"


def retained_ids(retained_events: int) -> list[str]:
    return [identifier(RETAINED_BASE + index) for index in range(retained_events)]


def seed_relative(
    database: Path,
    *,
    installation_id: str,
    reference_now: datetime,
    expired_events: int,
    expired_snapshots: int,
    retained_events: int,
) -> None:
    """Insert expired and retained rows straight into ``database``, with expiry fixed relative to ``reference_now``.

    Expired event ``k`` (and expired snapshot ``k``) expires ``k`` seconds before ``reference_now``, so the first of
    each expires exactly at it. Retained event ``j`` was captured an hour, plus ``j`` seconds, before it. The store
    must hold no event or snapshot yet, so nothing that was not seeded here is ever altered.
    """
    connection = sqlite3.connect(database, timeout=HANDSHAKE_SECONDS, autocommit=True)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        held = connection.execute(
            "SELECT (SELECT count(*) FROM event) + (SELECT count(*) FROM capability_snapshot)"
        ).fetchone()[0]
        if held:
            raise RefusedError("the store already holds events or capability snapshots")
        connection.execute("BEGIN IMMEDIATE")
        try:
            expired_start = reference_now - RETENTION
            expired_moments = [expired_start - timedelta(seconds=k) for k in range(expired_events)]
            retained_moments = [reference_now - RETAINED_AGE - timedelta(seconds=j) for j in range(retained_events)]
            for name, moments in ((EXPIRED_WORKSPACE, expired_moments), (RETAINED_WORKSPACE, retained_moments)):
                if moments:
                    connection.execute(INSERT_WORKSPACE, (name, stamp(min(moments)), stamp(max(moments))))
            for number, captured in enumerate(expired_moments, start=1):
                insert_event(connection, installation_id, number, captured, EXPIRED_WORKSPACE)
            for number, captured in enumerate(retained_moments, start=RETAINED_BASE):
                insert_event(connection, installation_id, number, captured, RETAINED_WORKSPACE)
            for k in range(expired_snapshots):
                insert_snapshot(connection, installation_id, SNAPSHOT_BASE + k, expired_start - timedelta(seconds=k))
            connection.execute("COMMIT")
        except BaseException:
            if connection.in_transaction:
                connection.execute("ROLLBACK")
            raise
    finally:
        connection.close()


def insert_event(
    connection: sqlite3.Connection, installation_id: str, number: int, captured: datetime, workspace: str
) -> None:
    """One event captured at ``captured``, sealed with a hash computed here rather than by the artifact."""
    document = event(
        installation_id,
        number,
        captured - timedelta(milliseconds=7),
        workspaceId=workspace,
        sessionId=f"ss_{number:032x}",
    )
    values: dict[str, Any] = {column: document[field] for column, field in EVENT_COLUMNS.items()}
    values["expires_at"] = stamp(captured + RETENTION)
    connection.execute(INSERT_EVENT, values)


def insert_snapshot(connection: sqlite3.Connection, installation_id: str, number: int, captured: datetime) -> None:
    """One capability snapshot, with its items, captured at ``captured``."""
    document = snapshot_document(
        snapshotId=identifier(number), capturedAt=stamp(captured), harness="codex", installationId=installation_id
    )
    connection.execute(
        INSERT_SNAPSHOT,
        (
            document["snapshotId"],
            document["snapshotHash"],
            document["schemaVersion"],
            document["capturedAt"],
            stamp(captured + RETENTION),
            document["harness"],
            document["harnessVersion"],
            document["installationId"],
        ),
    )
    for item in as_list(document["capabilities"]) or []:
        row = as_object(item) or {}
        connection.execute(INSERT_ITEM, (document["snapshotId"], row["name"], row["state"], row["source"]))


def inspect(database: Path, *, reference_now: datetime) -> Inspection:
    """Read the store directly and without writing: which rows are expired at ``reference_now``, and the counters."""
    connection = sqlite3.connect(f"{database.resolve().as_uri()}?mode=ro", uri=True, timeout=HANDSHAKE_SECONDS)
    try:
        row = connection.execute(SELECT_INSPECTION, {"now": stamp(reference_now)}).fetchone()
    finally:
        connection.close()
    return Inspection(*row)


def await_ready(
    ready_file: Path, *, timeout_seconds: float = HANDSHAKE_SECONDS, alive: Callable[[], bool] = lambda: True
) -> bool:
    """Whether ``ready_file`` appears before the deadline; a holder no longer ``alive`` ends the wait at once."""
    deadline = time.monotonic() + min(timeout_seconds, HANDSHAKE_SECONDS)
    while not ready_file.is_file():
        if not alive() or time.monotonic() >= deadline:
            return ready_file.is_file()
        time.sleep(POLL_SECONDS)
    return True


def hold_lock(
    database: Path, ready_file: Path, release_file: Path, *, hard_stop_seconds: float = HANDSHAKE_SECONDS
) -> int:
    """Hold the store's write lock until ``release_file`` appears or the hard stop, ten seconds at most, is reached."""
    if not database.is_file():
        raise RefusedError("the database does not exist")
    deadline = time.monotonic() + min(hard_stop_seconds, HANDSHAKE_SECONDS)
    connection = sqlite3.connect(database, timeout=max(deadline - time.monotonic(), 0), autocommit=True)
    try:
        try:
            connection.execute("BEGIN IMMEDIATE")
        except sqlite3.OperationalError:
            return UNAVAILABLE
        announcement = ready_file.with_name(f"{ready_file.name}.part")
        announcement.write_text("ready\n")
        announcement.replace(ready_file)
        outcome = HARD_STOP
        while time.monotonic() < deadline:
            if release_file.is_file():
                outcome = RELEASED
                break
            time.sleep(POLL_SECONDS)
        connection.execute("ROLLBACK")
        return outcome
    finally:
        connection.close()


def listed_ids(result: Result) -> list[str] | None:
    """The event IDs of a single canonical page, or ``None`` unless the command succeeded quietly with all of them."""
    reply = parses(result)
    items = None if reply is None else as_list(reply.get("items"))
    if result.code != 0 or result.stderr or reply is None or items is None or reply.get("nextCursor") is not None:
        return None
    if not all(canonical_item(item) for item in items):
        return None
    return [str((as_object(item) or {})["eventId"]) for item in items]


def status_facts(session: Session, label: str) -> dict[str, Any] | None:
    """Run ``status --json`` and return its document when it succeeded quietly."""
    result = session.run(label, ["status", "--json"])
    reply = parses(result)
    return reply if result.code == 0 and not result.stderr and reply is not None else None


def start_holder(session: Session, database: Path, ready: Path, release: Path) -> subprocess.Popen[bytes]:
    return subprocess.Popen(
        [
            sys.executable,
            str(Path(__file__).resolve()),
            "hold-lock",
            "--database",
            str(database),
            "--ready-file",
            str(ready),
            "--release-file",
            str(release),
        ],
        env=session.environment(),
        cwd=session.root / "work",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def finish_holder(session: Session, holder: subprocess.Popen[bytes], release: Path) -> int:
    """Release the lock, wait for the holder inside the handshake window, and record how it ended."""
    release.write_text("release\n")
    try:
        stdout, stderr = holder.communicate(timeout=HANDSHAKE_SECONDS)
        code = holder.returncode
    except subprocess.TimeoutExpired:
        holder.kill()
        stdout, stderr = holder.communicate()
        code = 124
    session.record(Result("hold-lock", code, stdout, stderr))
    return code


def matrix(session: Session, reference: datetime, *, expired: int, snapshots: int, retained: int) -> None:
    """Every retention expectation, in order: seed, locked reads, one bounded unlocked prune, maintenance, repeat."""
    initialization = initialize(session)
    if initialization is None:
        return
    database = session.data_home / "ferret.sqlite3"
    total = expired + snapshots
    seed_relative(
        database,
        installation_id=str(initialization["installationId"]),
        reference_now=reference,
        expired_events=expired,
        expired_snapshots=snapshots,
        retained_events=retained,
    )
    wanted = retained_ids(retained)
    seeded = inspect(database, reference_now=reference)
    session.check(
        "the seeded store holds every expired and retained row and counts no expiry",
        seeded == Inspection(expired, snapshots, retained, 0, 2, 0, 0, None),
    )
    facts = status_facts(session, "status-seeded")
    session.check(
        "status sees the retained rows as live and every expired row as logically expired",
        facts is not None
        and facts.get("eventCount") == retained
        and facts.get("logicallyExpiredCount") == total
        and facts.get("expiredLocalTotal") == 0
        and facts.get("expiredBeforeAckTotal") == 0
        and facts.get("maintenanceDue") is True
        and facts.get("lastMaintenanceAt") is None,
    )

    lock_directory = session.root / "lock"
    lock_directory.mkdir()
    ready = lock_directory / "ready"
    release = lock_directory / "release"
    holder = start_holder(session, database, ready, release)
    took = False
    try:
        took = session.check(
            "the lock holder took the write lock inside the handshake window",
            await_ready(ready, alive=lambda: holder.poll() is None),
        )
        if took:
            locked = session.run("events-list-locked", ["events", "list", "--json", "--all-time"])
            session.check("reads expose no expired row while the lock is held", listed_ids(locked) == wanted)
            facts = status_facts(session, "status-locked")
            session.check(
                "the locked attempt changed no row, counter, or marker",
                facts is not None
                and facts.get("logicallyExpiredCount") == total
                and facts.get("expiredLocalTotal") == 0
                and facts.get("lastMaintenanceAt") is None
                and inspect(database, reference_now=reference) == seeded,
            )
    finally:
        if holder.poll() is None and not took:
            holder.kill()
        code = finish_holder(session, holder, release)
    session.check("the lock holder was released and exited zero inside the handshake window", code == RELEASED)
    if not took:
        return

    unlocked = session.run("events-list-unlocked", ["events", "list", "--json", "--all-time"])
    session.check("reads expose no expired row after the first unlocked operation", listed_ids(unlocked) == wanted)
    partial = inspect(database, reference_now=reference)
    removed = partial.expired_local_total
    session.check(
        "the first unlocked operation removed at most 100 expired rows and left the rest",
        0 < removed <= PRUNE_ROW_LIMIT
        and partial.expired_events + partial.expired_snapshots == total - removed
        and partial.live_events == retained
        and partial.expired_before_ack_total == 0,
    )
    session.check("a partial prune leaves the maintenance marker unchanged", partial.marker is None)
    facts = status_facts(session, "status-partial")
    session.check(
        "status agrees with the store after the partial prune",
        facts is not None
        and facts.get("expiredLocalTotal") == removed
        and facts.get("logicallyExpiredCount") == total - removed
        and facts.get("maintenanceDue") is True,
    )

    first = session.run("maintenance", ["maintenance", "--json"])
    reply = parses(first)
    session.check(
        "explicit maintenance removed the remainder",
        first.code == 0
        and not first.stderr
        and reply is not None
        and reply.get("result") == "completed"
        and reply.get("expiredEventCount", 0) + reply.get("expiredCapabilitySnapshotCount", 0) == total - removed,
    )
    final = inspect(database, reference_now=reference)
    session.check(
        "the expired workspace went with its last event",
        final.workspaces == 1 and final.expired_events == 0 and final.expired_snapshots == 0,
    )
    again = session.run("maintenance-repeat", ["maintenance", "--json"])
    repeat = parses(again)
    session.check(
        "repeating maintenance removed nothing more",
        again.code == 0
        and not again.stderr
        and repeat is not None
        and repeat.get("expiredEventCount") == 0
        and repeat.get("expiredWorkspaceCount") == 0
        and repeat.get("expiredCapabilitySnapshotCount") == 0,
    )
    facts = status_facts(session, "status-final")
    session.check(
        "expiredLocalTotal counts every expired row once and expiredBeforeAckTotal is zero",
        facts is not None
        and facts.get("expiredLocalTotal") == total
        and facts.get("expiredBeforeAckTotal") == 0
        and facts.get("logicallyExpiredCount") == 0
        and facts.get("maintenanceDue") is False
        and final.expired_local_total == total
        and final.expired_before_ack_total == 0
        and final.marker is not None
        and repeat is not None
        and repeat.get("expiredLocalTotal") == total,
    )
    survivors = session.run("events-list-final", ["events", "list", "--json", "--all-time"])
    session.check(
        "the retained rows survived every prune",
        listed_ids(survivors) == wanted and seeded.live_events == partial.live_events == final.live_events == retained,
    )


def honor(arguments: argparse.Namespace) -> datetime:
    """The reference instant when every argument is one the matrix can honor, else a refusal."""
    if INSTANT.fullmatch(arguments.reference_now) is None:
        raise RefusedError("the reference instant must be YYYY-MM-DDTHH:MM:SS.mmmZ")
    reference = datetime.strptime(arguments.reference_now, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=UTC)
    age = datetime.now(UTC) - reference
    if not timedelta(0) <= age <= LATEST_REFERENCE_AGE:
        raise RefusedError("the reference instant must not be in the future or more than an hour old")
    if not 1 <= arguments.expired_events <= MAX_EXPIRED_EVENTS:
        raise RefusedError(f"the expired event count must be between 1 and {MAX_EXPIRED_EVENTS}")
    if not 0 <= arguments.expired_snapshots <= MAX_EXPIRED_SNAPSHOTS:
        raise RefusedError(f"the expired snapshot count must be between 0 and {MAX_EXPIRED_SNAPSHOTS}")
    if arguments.expired_events + arguments.expired_snapshots <= PRUNE_ROW_LIMIT:
        raise RefusedError(f"a partial prune needs more than {PRUNE_ROW_LIMIT} expired rows")
    if not 1 <= arguments.retained_events <= MAX_RETAINED_EVENTS:
        raise RefusedError(f"the retained event count must be between 1 and {MAX_RETAINED_EVENTS}")
    return reference


def run_matrix(arguments: argparse.Namespace) -> int:
    """Run the matrix for the parsed ``run-matrix`` arguments and write its summary; the return value is its status."""
    try:
        reference = honor(arguments)
        root = claim_root(arguments.raw_root, arguments.run_id)
    except RefusedError as refusal:
        sys.stderr.write(f"refused: {refusal}\n")
        return REFUSED
    artifact = arguments.bin.resolve()
    if sys.version_info < MINIMUM_PYTHON or not artifact.is_file():
        sys.stderr.write("this host cannot run the artifact under test\n")
        return 3
    session = Session("retention", fresh_case_directory(root, "retention"), artifact)
    session.lines.append("case=retention")
    matrix(
        session,
        reference,
        expired=arguments.expired_events,
        snapshots=arguments.expired_snapshots,
        retained=arguments.retained_events,
    )
    session.check("every recorded assertion held", session.failures == 0)
    arguments.summary.parent.mkdir(parents=True, exist_ok=True)
    arguments.summary.write_text("\n".join(session.lines) + "\n")
    return 0 if session.failures == 0 else 1


def parse(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="manual_retention_fixture.py", description=(__doc__ or "").split("\n\n")[0])
    commands = parser.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run-matrix")
    run.add_argument("--run-id", required=True)
    run.add_argument("--raw-root", required=True)
    run.add_argument("--bin", required=True, type=Path)
    run.add_argument("--reference-now", required=True)
    run.add_argument("--expired-events", required=True, type=int)
    run.add_argument("--expired-snapshots", required=True, type=int)
    run.add_argument("--retained-events", required=True, type=int)
    run.add_argument("--summary", required=True, type=Path)
    lock = commands.add_parser("hold-lock")
    lock.add_argument("--database", required=True, type=Path)
    lock.add_argument("--ready-file", required=True, type=Path)
    lock.add_argument("--release-file", required=True, type=Path)
    lock.add_argument("--hard-stop-seconds", type=float, default=HANDSHAKE_SECONDS)
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    try:
        arguments = parse(argv)
    except SystemExit as stop:
        return REFUSED if stop.code else 0
    if arguments.command == "run-matrix":
        return run_matrix(arguments)
    try:
        return hold_lock(
            arguments.database,
            arguments.ready_file,
            arguments.release_file,
            hard_stop_seconds=arguments.hard_stop_seconds,
        )
    except RefusedError as refusal:
        sys.stderr.write(f"refused: {refusal}\n")
        return REFUSED


if __name__ == "__main__":
    sys.exit(main())
