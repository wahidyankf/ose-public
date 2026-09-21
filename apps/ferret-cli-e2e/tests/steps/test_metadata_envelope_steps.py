"""E2E bindings for the metadata envelope feature: the built artifact, fed real standard input."""

import json
import re
import sqlite3
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from event_documents import VECTOR_HASH, encode_document, sealed_event
from ferret_process import Completed, run_artifact
from vendor_payloads import CANARIES, claude_tool
from vendor_payloads import encode as encode_payload

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature"
CANARY = "canary-value-that-must-never-be-echoed"
RAW_WORKSPACE = "/users/example/work/repo-a"
RAW_SESSION = "raw-harness-session-123"
VECTOR_DOCUMENT = sealed_event()
FORBIDDEN_KEYS = {
    "prompt": ("prompt", "prompt"),
    "response": ("response", "response"),
    "tool_arguments": ("tool_arguments", "tool_arguments"),
    "transcript_path": ("transcript_path", "transcript_path"),
    "environment": ("environment", "environment"),
    "an unknown arbitrary field": ("unexpected_arbitrary_field", None),
}


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, the field under test, and what the capture process returned."""

    artifact: Path
    home: Path
    completed: Completed | None = None
    category: str | None = None
    raw: bytes = b""

    @property
    def data_home(self) -> Path:
        return self.home / ".ferret"

    @property
    def database(self) -> Path:
        return self.data_home / "ferret.sqlite3"


@pytest.fixture
def session(artifact: Path, home: Path) -> Session:
    return Session(artifact=artifact, home=home)


def submit(session: Session, document: dict[str, Any]) -> None:
    session.completed = run_artifact(
        session.artifact, ["capture", "--json"], home=session.home, stdin=encode_document(document)
    )


def count(session: Session, table: str) -> int:
    with closing(sqlite3.connect(session.database)) as connection:
        return int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


def data_home_bytes(session: Session) -> bytes:
    return b"".join(path.read_bytes() for path in sorted(session.data_home.iterdir()))


@scenario(FEATURE, "Capture a valid lifecycle event")
def test_capture_a_valid_lifecycle_event() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@scenario(FEATURE, "Reject a forbidden capture field")
def test_reject_a_forbidden_capture_field() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("FERRET is initialized with an empty local database")
def given_initialized_and_empty(session: Session) -> None:
    initialized = run_artifact(session.artifact, ["init", "--json"], home=session.home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    assert count(session, "event") == 0
    assert count(session, "workspace") == 0


@when("an adapter submits one schema-version-1.0 tool-completed event")
def when_submit_valid_event(session: Session) -> None:
    submit(session, VECTOR_DOCUMENT)


@when(parsers.parse("an adapter submits an otherwise valid event containing {field}"))
def when_submit_event_with_forbidden_field(session: Session, field: str) -> None:
    key, session.category = FORBIDDEN_KEYS[field]
    submit(session, {**VECTOR_DOCUMENT, key: CANARY})


@then("the CLI stores one event with its canonical hash and opaque identifiers")
def then_stores_one_event(session: Session) -> None:
    with closing(sqlite3.connect(session.database)) as connection:
        rows = connection.execute("SELECT event_hash, workspace_id, session_id, installation_id FROM event").fetchall()
    assert rows == [
        (
            VECTOR_HASH,
            VECTOR_DOCUMENT["workspaceId"],
            VECTOR_DOCUMENT["sessionId"],
            VECTOR_DOCUMENT["installationId"],
        )
    ]
    assert re.fullmatch(r"ws_[0-9a-f]{32}", rows[0][1])
    assert re.fullmatch(r"ss_[0-9a-f]{32}", rows[0][2])


@then("the stored record contains no raw workspace or harness session value")
def then_no_raw_values(session: Session) -> None:
    stored = data_home_bytes(session)
    assert RAW_WORKSPACE.encode() not in stored
    assert RAW_SESSION.encode() not in stored
    assert count(session, "workspace") == 1


@then("the direct capture command reports success")
def then_reports_success(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stderr) == (0, b"")
    assert json.loads(session.completed.stdout) == {
        "schemaVersion": 1,
        "command": "capture",
        "exitCode": 0,
        "result": "stored",
        "eventId": VECTOR_DOCUMENT["eventId"],
        "eventHash": VECTOR_HASH,
    }


@then("capture rejects the complete event without storing a partial row")
def then_rejects_without_a_row(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout) == (2, b"")
    assert count(session, "event") == 0
    assert count(session, "workspace") == 0


@then("the diagnostic names the field category without echoing its value")
def then_names_the_category_only(session: Session) -> None:
    assert session.completed is not None
    error = json.loads(session.completed.stderr)["error"]
    assert error == {"code": "invalid_event", "field": session.category, "retryable": False}
    assert CANARY.encode() not in session.completed.stderr
    assert CANARY.encode() not in data_home_bytes(session)


# Project raw hook JSON without retaining content: the built artifact's capture-hook command, fed a raw vendor payload.
STORE_FILES = {
    "config.json",
    "ferret.lock",
    "ferret.sqlite3",
    "ferret.sqlite3-shm",
    "ferret.sqlite3-wal",
    "identity.json",
    "identity.key",
}


@scenario(FEATURE, "Project raw hook JSON without retaining content")
def test_project_raw_hook_json_without_retaining_content() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a raw harness payload carrying prompt text, tool arguments, and environment values")
def given_a_raw_payload_with_content(session: Session) -> None:
    initialized = run_artifact(session.artifact, ["init", "--json"], home=session.home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    session.raw = encode_payload(claude_tool("PostToolUse", duration_ms=27, tool_response={"content": CANARIES[2]}))


@when("capture-hook maps it through that harness's allowlist mapper")
def when_capture_hook_maps_the_payload(session: Session) -> None:
    session.completed = run_artifact(
        session.artifact,
        ["capture-hook", "--harness", "claude_code", "--event", "tool.completed"],
        home=session.home,
        stdin=session.raw,
    )


@then("only allowlisted metadata reaches the canonical envelope")
def then_only_allowlisted_metadata_is_kept(session: Session) -> None:
    with closing(sqlite3.connect(session.database)) as connection:
        rows = connection.execute(
            "SELECT harness, event_type, tool_name, duration_ms, workspace_id, session_id, outcome FROM event"
        ).fetchall()
    assert len(rows) == 1
    harness, event_type, tool, duration, workspace, native, outcome = rows[0]
    assert (harness, event_type, tool, duration, outcome) == ("claude_code", "tool.completed", "Read", 27, "success")
    assert re.fullmatch(r"ws_[0-9a-f]{32}", workspace)
    assert re.fullmatch(r"ss_[0-9a-f]{32}", native)
    assert session.raw not in data_home_bytes(session)


@then("the raw bytes stay in memory and are never spooled, logged, or written to SQLite")
def then_the_raw_bytes_are_never_written(session: Session) -> None:
    everything = {path: path.read_bytes() for path in session.home.parent.rglob("*") if path.is_file()}
    written = b"".join(everything.values())
    assert not any(canary.encode() in written for canary in CANARIES)
    # Nothing but the store's own files exists: no spool, log, or scratch file beside them.
    assert {path.name for path in everything} <= STORE_FILES
    assert {path.parent for path in everything} == {session.data_home}


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout, session.completed.stderr) == (0, b"", b"")
