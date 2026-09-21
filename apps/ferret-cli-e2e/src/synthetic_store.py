"""Deterministic synthetic events written straight into a real FERRET store, for the storage benchmark and fixtures.

Nothing is validated here: the store's own constraints reject a malformed row, and a synthetic row only has to be
shaped like a real capture (fixed-width identifiers and hashes, names of realistic length, a realistic mix of event
types) so that the bytes it takes are honest. The same seed always yields the same rows in the same order.
"""

import hashlib
import random
import sqlite3
import uuid
from collections.abc import Sequence
from datetime import datetime, timedelta

from event_documents import stamp

RETENTION = timedelta(days=30)
INSTALLATION_ID = "00000000-0000-4000-8000-000000000002"
EVENTS_PER_SESSION = 40
WORKSPACE_COUNT = 12
BATCH_ROWS = 1000
HARNESSES = (("claude_code", 60), ("codex", 25), ("opencode", 15))
# (event type, weight, outcome, whether it carries a duration)
EVENT_MIX = (
    ("tool.started", 22, "not_applicable", False),
    ("tool.completed", 30, "terminal", True),
    ("tool.failed", 4, "failure", True),
    ("agent.started", 6, "not_applicable", False),
    ("agent.ended", 6, "terminal", True),
    ("skill.invoked", 8, "not_applicable", False),
    ("session.started", 2, "not_applicable", False),
    ("session.ended", 2, "terminal", True),
)
PLAIN_TOOLS = ("Read", "Write", "Edit", "Bash", "Grep", "Glob", "WebFetch", "Task", "TodoWrite", "MultiEdit", "LS")
MCP_SERVERS = ("plugin_context7_context7", "claude-in-chrome", "plugin_playwright_playwright", "claude_ai_Gmail")
MCP_TOOLS = ("query-docs", "navigate", "read_page", "browser_snapshot", "javascript_tool", "resolve-library-id")
AGENTS = ("plan-maker", "plan-checker", "swe-python-dev", "docs-fixer", "rules-checker", "general-purpose", "Explore")
SKILLS = ("artifact-design", "harness-compatibility-protocol", "commit", "review", "plan-execution", "simplify")
WORKSPACES = tuple(f"ws_{hashlib.sha256(f'workspace-{n}'.encode()).hexdigest()[:32]}" for n in range(WORKSPACE_COUNT))
_INSERT_WORKSPACE = "INSERT OR IGNORE INTO workspace (workspace_id, first_seen_at, last_seen_at) VALUES (?, ?, ?)"
_INSERT_EVENT = (
    "INSERT INTO event (event_id, event_hash, schema_version, occurred_at, captured_at, expires_at, harness,"
    " harness_version, installation_id, workspace_id, session_id, parent_session_id, event_type, agent_name,"
    " skill_name, tool_name, outcome, duration_ms, subject_visibility, outcome_visibility, duration_visibility)"
    " VALUES (?, ?, '1.0', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
)

Row = tuple[object, ...]


def tool_name(rng: random.Random) -> str:
    """A built-in tool most of the time and a longer MCP tool name the rest of it."""
    if rng.random() < 0.8:
        return rng.choice(PLAIN_TOOLS)
    return f"mcp__{rng.choice(MCP_SERVERS)}__{rng.choice(MCP_TOOLS)}"


def synthetic_rows(seed: int, count: int, *, now: datetime, expired: int) -> list[Row]:
    """``count`` event rows in capture order: ``expired`` beyond the retention cutoff, the rest inside it.

    Expired rows were captured over thirty days and one hour before ``now``; the others within the last twenty-nine
    days, so no row sits near the cutoff and the split does not depend on how long a run takes.
    """
    rng = random.Random(seed)
    weights = [weight for _, weight, _, _ in EVENT_MIX]
    harnesses = [name for name, _ in HARNESSES]
    harness_weights = [weight for _, weight in HARNESSES]

    def age_of(number: int) -> timedelta:
        if number < expired:
            return RETENTION + timedelta(hours=1, seconds=rng.uniform(0, 30 * 86400))
        return timedelta(seconds=rng.uniform(1, 29 * 86400))

    moments = sorted(now - age_of(number) for number in range(count))
    rows: list[Row] = []
    for number, captured in enumerate(moments):
        event_type, _, outcome_kind, carries_duration = rng.choices(EVENT_MIX, weights)[0]
        harness = rng.choices(harnesses, harness_weights)[0]
        event_id = str(uuid.UUID(int=rng.getrandbits(128), version=4))
        moment = stamp(captured)
        name = tool_name(rng) if event_type.startswith("tool.") else None
        agent = rng.choice(AGENTS) if event_type.startswith("agent.") else None
        skill = rng.choice(SKILLS) if event_type == "skill.invoked" else None
        outcome = outcome_kind
        if outcome_kind == "terminal":
            outcome = rng.choices(["success", "failure", "cancelled"], [90, 7, 3])[0]
        rows.append(
            (
                event_id,
                hashlib.sha256(event_id.encode()).hexdigest(),
                moment,
                moment,
                stamp(captured + RETENTION),
                harness,
                f"1.0.{rng.randint(100, 140)}",
                INSTALLATION_ID,
                WORKSPACES[rng.randrange(WORKSPACE_COUNT)],
                f"ss_{hashlib.sha256(f'{seed}-{number // EVENTS_PER_SESSION}'.encode()).hexdigest()[:32]}",
                event_type,
                agent,
                skill,
                name,
                outcome,
                min(int(rng.expovariate(1 / 800)), 86_400_000) if carries_duration else None,
                "not_applicable" if event_type.startswith("session.") else "observed",
                "observed" if outcome != "not_applicable" else "not_applicable",
                "observed" if carries_duration else "not_applicable",
            )
        )
    return rows


def insert_events(connection: sqlite3.Connection, rows: Sequence[Row], *, now: datetime) -> None:
    """Write ``rows`` and the workspaces they belong to, one transaction per batch, on an autocommit connection."""
    first_seen = min((str(row[3]) for row in rows), default=stamp(now))
    connection.executemany(_INSERT_WORKSPACE, [(name, first_seen, stamp(now)) for name in WORKSPACES])
    for start in range(0, len(rows), BATCH_ROWS):
        connection.execute("BEGIN")
        connection.executemany(_INSERT_EVENT, rows[start : start + BATCH_ROWS])
        connection.execute("COMMIT")
