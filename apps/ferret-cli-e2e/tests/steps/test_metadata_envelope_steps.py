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
from vendor_payloads import CANARIES, IMAGE_CANARY, claude_tool, codex_view_image
from vendor_payloads import encode as encode_payload

FEATURE = "../../../../specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature"
CANARY = "canary-value-that-must-never-be-echoed"
VECTOR_DOCUMENT = sealed_event()
# The capture process runs in a workspace directory with a native harness session in its environment, the raw values an
# adapter's context carries; neither may reach the data home.
RAW_WORKSPACE_NAME = "canary-raw-workspace-3e71"
RAW_SESSION = "canary-raw-harness-session-5a02"
# The raw values an adapter might wrongly pass where an opaque identifier belongs, by the kind the scenario names.
RAW_VALUES = {
    "workspace path": "/users/example/work/canary-raw-workspace-3e71",
    "harness session value": RAW_SESSION,
}
# A property the closed schema does not define: its name and its value are both canaries, so neither may be echoed.
UNKNOWN_KEY = "canary_unknown_property_4d7e"
UNKNOWN_VALUE = "canary-unknown-value-a19f"


@dataclass(slots=True)
class Session:
    """The built artifact, an isolated home, the field under test, and what the capture process returned."""

    artifact: Path
    home: Path
    completed: Completed | None = None
    category: str | None = None
    raw: bytes = b""
    raw_value: str = ""
    harness: str = "claude_code"

    @property
    def data_home(self) -> Path:
        return self.home / ".local" / "share" / "ferret"

    @property
    def database(self) -> Path:
        return self.data_home / "ferret.sqlite3"

    @property
    def workspace(self) -> Path:
        """The directory the capture process runs in, named with a canary so any copy of it can be found."""
        return self.home.parent / "work" / RAW_WORKSPACE_NAME

    @property
    def temporary(self) -> Path:
        """The artifact's TMPDIR, inside the test's own directory, so a file spooled to temporary storage is seen."""
        return self.home.parent / "tmp"


@pytest.fixture
def session(artifact: Path, home: Path) -> Session:
    return Session(artifact=artifact, home=home)


def submit(session: Session, document: dict[str, Any]) -> None:
    session.workspace.mkdir(parents=True, exist_ok=True)
    session.completed = run_artifact(
        session.artifact,
        ["capture", "--json"],
        home=session.home,
        stdin=encode_document(document),
        cwd=session.workspace,
        extra_environment={
            "PWD": str(session.workspace),
            "CLAUDE_SESSION_ID": RAW_SESSION,
            "CODEX_SESSION_ID": RAW_SESSION,
        },
    )


def sqlite_rows(session: Session, statement: str) -> list[tuple[Any, ...]]:
    with closing(sqlite3.connect(session.database)) as connection:
        return connection.execute(statement).fetchall()


def count(session: Session, table: str) -> int:
    with closing(sqlite3.connect(session.database)) as connection:
        return int(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0])


def data_home_bytes(session: Session) -> bytes:
    """Every byte of every file below the data home, however deep, so nothing written there can go unread."""
    return b"".join(path.read_bytes() for path in sorted(session.data_home.rglob("*")) if path.is_file())


@scenario(FEATURE, "Capture a valid lifecycle event")
def test_capture_a_valid_lifecycle_event() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@scenario(FEATURE, "Refuse a raw value in place of an opaque identifier")
def test_refuse_a_raw_value_in_place_of_an_opaque_identifier() -> None:
    """Bound to the feature outline; each example expands independently."""


@scenario(FEATURE, "Reject a forbidden capture field")
def test_reject_a_forbidden_capture_field() -> None:
    """Bound to the feature outline; each example expands independently."""


@scenario(FEATURE, "Reject an unknown capture field")
def test_reject_an_unknown_capture_field() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


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
    # The example names the property itself, and the contract spells each of these categories the same way.
    session.category = field
    submit(session, {**VECTOR_DOCUMENT, field: CANARY})


@when(parsers.parse("an adapter submits an otherwise valid event whose {field} is a raw {value}"))
def when_submit_event_with_raw_identifier(session: Session, field: str, value: str) -> None:
    session.raw_value = RAW_VALUES[value]
    # Resealed, so the raw value is the only thing wrong with the event.
    submit(session, sealed_event(**{field: session.raw_value}))


@when("an adapter submits an otherwise valid event with a property the schema does not define")
def when_submit_event_with_unknown_property(session: Session) -> None:
    submit(session, {**VECTOR_DOCUMENT, UNKNOWN_KEY: UNKNOWN_VALUE})


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


@then("the stored record holds only the opaque workspace and session identifiers it was given")
def then_only_the_given_opaque_identifiers(session: Session) -> None:
    rows = sqlite_rows(session, "SELECT workspace_id, session_id, parent_session_id FROM event")
    assert rows == [("ws_327b250d010590da40f0f76d18da910a", "ss_d0de260ca18a8379984031556b2d43ac", None)]
    assert sqlite_rows(session, "SELECT workspace_id FROM workspace") == [("ws_327b250d010590da40f0f76d18da910a",)]
    # The directory the capture ran in and the session its environment named were at hand; none of their bytes stayed.
    stored = data_home_bytes(session)
    assert RAW_WORKSPACE_NAME.encode() not in stored
    assert str(session.workspace).encode() not in stored
    assert RAW_SESSION.encode() not in stored


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


def diagnostic(session: Session) -> dict[str, Any]:
    """The error object of the rejected capture's closed failure envelope, its keys in contract order."""
    assert session.completed is not None
    envelope = json.loads(session.completed.stderr)
    assert (envelope["schemaVersion"], envelope["command"], envelope["exitCode"]) == (1, "capture", 2)
    error = envelope["error"]
    assert list(error) == ["code", "message", "field", "retryable"]
    return error


def closed_error(field: str | None) -> dict[str, Any]:
    return {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": field,
        "retryable": False,
    }


@then("the diagnostic names the field category without echoing its value")
def then_names_the_category_only(session: Session) -> None:
    assert diagnostic(session) == closed_error(session.category)
    assert session.completed is not None
    assert CANARY.encode() not in session.completed.stderr
    assert CANARY.encode() not in data_home_bytes(session)


@then(parsers.parse("the diagnostic names the {field} field without echoing its value"))
def then_names_the_identifier_field_only(session: Session, field: str) -> None:
    assert diagnostic(session) == closed_error(field)
    assert session.completed is not None
    assert session.raw_value.encode() not in session.completed.stderr
    assert session.raw_value.encode() not in data_home_bytes(session)


@then("the diagnostic names no field and echoes neither the unknown property name nor its value")
def then_names_no_field(session: Session) -> None:
    assert diagnostic(session) == closed_error(None)
    assert session.completed is not None
    for canary in (UNKNOWN_KEY, UNKNOWN_VALUE):
        assert canary.encode() not in session.completed.stderr
        assert canary.encode() not in data_home_bytes(session)


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
    session.temporary.mkdir()
    session.completed = run_artifact(
        session.artifact,
        ["capture-hook", "--harness", session.harness, "--event", "tool.completed"],
        home=session.home,
        stdin=session.raw,
        extra_environment={"TMPDIR": str(session.temporary)},
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
    # Nothing but the store's own files exists: no spool, log, or scratch file beside them or in the artifact's
    # temporary directory, which lies inside the scanned tree and must stay empty.
    assert {path.name for path in everything} <= STORE_FILES
    assert {path.parent for path in everything} == {session.data_home}
    assert list(session.temporary.iterdir()) == []


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout, session.completed.stderr) == (0, b"", b"")


# Record a tool completion whose result is a large image: the same command, fed Codex's view_image completion.
@scenario(FEATURE, "Record a tool completion whose result is a large image")
def test_record_a_tool_completion_whose_result_is_a_large_image() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a raw Codex view_image completion whose result is a 1 MiB base64 image")
def given_a_codex_view_image_completion(session: Session) -> None:
    initialized = run_artifact(session.artifact, ["init", "--json"], home=session.home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    session.harness = "codex"
    session.raw = encode_payload(codex_view_image())
    assert len(session.raw) > 1024 * 1024


@then("one tool-completed event naming view_image is stored")
def then_one_view_image_completion_is_stored(session: Session) -> None:
    with closing(sqlite3.connect(session.database)) as connection:
        rows = connection.execute(
            "SELECT harness, event_type, tool_name, outcome, outcome_visibility, duration_ms, duration_visibility "
            "FROM event"
        ).fetchall()
    assert rows == [("codex", "tool.completed", "view_image", "success", "derived", None, "unknown")]


@then("no part of the image or of the other content reaches the store")
def then_no_image_or_content_is_stored(session: Session) -> None:
    everything = {path: path.read_bytes() for path in session.home.parent.rglob("*") if path.is_file()}
    written = b"".join(everything.values())
    for canary in (IMAGE_CANARY, *CANARIES):
        assert canary.encode() not in written
    # A refused payload would leave its failure record beside the store, and a spooled one a file in the artifact's
    # temporary directory; an accepted, unspooled one leaves neither.
    assert {path.name for path in everything} <= STORE_FILES
    assert {path.parent for path in everything} == {session.data_home}
    assert list(session.temporary.iterdir()) == []
