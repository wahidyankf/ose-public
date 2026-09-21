"""Populations too large to capture one event at a time, written straight into the tables of a real store."""

import hashlib
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta

from support.machine import Machine
from support.populate import stamp
from support.retention import EXPIRED

INSTALLATION_ID = "00000000-0000-4000-8000-000000000002"
HARNESSES = ("claude_code", "codex", "opencode")
TOOLS = ("Read", "Write", "Edit", "Bash", "Grep", "Glob", "WebFetch", "Task")
WORKSPACES = tuple(f"ws_{number:032x}" for number in range(1, 9))
_INSERT_WORKSPACE = "INSERT OR IGNORE INTO workspace (workspace_id, first_seen_at, last_seen_at) VALUES (?, ?, ?)"
_INSERT_EVENT = (
    "INSERT INTO event (event_id, event_hash, schema_version, occurred_at, captured_at, expires_at, harness,"
    " harness_version, installation_id, workspace_id, session_id, parent_session_id, event_type, agent_name,"
    " skill_name, tool_name, outcome, duration_ms, subject_visibility, outcome_visibility, duration_visibility)"
    " VALUES (?, ?, '1.0', ?, ?, ?, ?, '1.0.123', ?, ?, ?, NULL, 'tool.completed', NULL, NULL, ?, 'success', ?,"
    " 'observed', 'observed', 'observed')"
)


def seed_events(machine: Machine, *, now: datetime, live: int, expired: int) -> None:
    """Insert ``live`` events captured within the last hour and ``expired`` ones beyond the cutoff, in one transaction.

    The rows are shaped like real captures (fixed-width hashes and identifiers, a small spread of harnesses, tools and
    workspaces), so the bytes each one takes are representative. Nothing is checked here: the schema's own constraints
    reject a malformed row.
    """
    rows: list[tuple[object, ...]] = []
    for number in range(live + expired):
        beyond = number >= live
        captured = now - (EXPIRED + timedelta(seconds=number) if beyond else timedelta(seconds=number + 1))
        moment = stamp(captured)
        rows.append(
            (
                f"00000000-0000-4000-8000-{number + 1:012d}",
                hashlib.sha256(str(number).encode()).hexdigest(),
                moment,
                moment,
                stamp(captured + timedelta(days=30)),
                HARNESSES[number % len(HARNESSES)],
                INSTALLATION_ID,
                WORKSPACES[number % len(WORKSPACES)],
                f"ss_{number // 50:032x}",
                TOOLS[number % len(TOOLS)],
                number % 900,
            )
        )
    first_seen = stamp(now - EXPIRED)
    with closing(sqlite3.connect(machine.database, autocommit=True)) as connection:
        connection.execute("BEGIN")
        connection.executemany(_INSERT_WORKSPACE, [(name, first_seen, stamp(now)) for name in WORKSPACES])
        connection.executemany(_INSERT_EVENT, rows)
        connection.execute("COMMIT")
