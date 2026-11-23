"""E2E bindings for the metadata envelope feature: the built artifact, fed real standard input."""

import dataclasses
import json
import re
import sqlite3
from contextlib import closing
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from event_documents import encode_document, now_stamp, sealed_event
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
# The limits the contract names, which the built artifact enforces by itself.
CANONICAL_LIMIT_BYTES = 16 * 1024
RAW_LIMIT_BYTES = 64 * 1024 * 1024
# The raw payloads of the payload outline, by harness, and the canaries each content description names.
PAYLOADS = {
    "claude_code": lambda: claude_tool("PostToolUse", duration_ms=27, tool_response={"content": CANARIES[2]}),
    "codex": codex_view_image,
}
CONTENT_CANARIES: dict[str, tuple[str, ...]] = {
    "prompt text, tool arguments, and environment values": tuple(CANARIES),
    "a 1 MiB base64 image": (IMAGE_CANARY,),
}
STORE_FILES = {
    "config.json",
    "ferret.lock",
    "ferret.sqlite3",
    "ferret.sqlite3-shm",
    "ferret.sqlite3-wal",
    "identity.json",
    "identity.key",
}


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
    tool: str = ""
    content: str = ""
    document: dict[str, Any] = dataclasses.field(default_factory=dict[str, Any])

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
    submit_raw(session, encode_document(document))


def submit_raw(session: Session, raw: bytes) -> None:
    session.workspace.mkdir(parents=True, exist_ok=True)
    session.completed = run_artifact(
        session.artifact,
        ["capture", "--json"],
        home=session.home,
        stdin=raw,
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


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: A valid lifecycle event is captured and appears in events list
@scenario(FEATURE, "A valid lifecycle event is captured and appears in events list")
def test_a_valid_lifecycle_event_is_captured_and_appears_in_events_list() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: Refuse a raw value in place of an opaque identifier
@scenario(FEATURE, "Refuse a raw value in place of an opaque identifier")
def test_refuse_a_raw_value_in_place_of_an_opaque_identifier() -> None:
    """Bound to the feature outline; each example expands independently."""


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: Reject a forbidden capture field
@scenario(FEATURE, "Reject a forbidden capture field")
def test_reject_a_forbidden_capture_field() -> None:
    """Bound to the feature outline; each example expands independently."""


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: Reject an unknown capture field
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
    # Stamped now: retention hides events older than thirty days from every query, --all-time included.
    stamp = now_stamp()
    session.document = sealed_event(occurredAt=stamp, capturedAt=stamp)
    submit(session, session.document)


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


@when("an adapter submits an event of 16 KiB plus one byte")
def when_submit_event_over_the_canonical_limit(session: Session) -> None:
    # A valid event padded with spaces to one byte past the canonical limit, so only the size is wrong.
    submit_raw(session, encode_document(VECTOR_DOCUMENT).ljust(CANONICAL_LIMIT_BYTES + 1, b" "))


@then("events list shows that one event with its opaque workspace and session identifiers")
def then_events_list_shows_the_event(session: Session) -> None:
    listed = run_artifact(session.artifact, ["events", "list", "--all-time", "--json"], home=session.home)
    assert (listed.returncode, listed.stderr) == (0, b"")
    [item] = json.loads(listed.stdout)["items"]
    assert item["eventId"] == session.document["eventId"]
    assert (item["workspaceId"], item["sessionId"], item["parentSessionId"]) == (
        "ws_327b250d010590da40f0f76d18da910a",
        "ss_d0de260ca18a8379984031556b2d43ac",
        None,
    )
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
        "eventId": session.document["eventId"],
        "eventHash": session.document["eventHash"],
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


@then("the diagnostic names no field and echoes no part of the input")
def then_names_no_field_and_echoes_nothing(session: Session) -> None:
    assert diagnostic(session) == closed_error(None)
    assert session.completed is not None
    assert VECTOR_DOCUMENT["eventId"].encode() not in session.completed.stderr


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: ferret capture refuses input over 16 KiB
@scenario(FEATURE, "ferret capture refuses input over 16 KiB")
def test_ferret_capture_refuses_input_over_16_kib() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given(parsers.parse("a raw {harness} {event} payload for the {tool} tool carrying {content}"))
def given_a_raw_payload_for_a_tool(session: Session, harness: str, event: str, tool: str, content: str) -> None:
    assert event == "tool.completed"
    initialized = run_artifact(session.artifact, ["init", "--json"], home=session.home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    session.harness = harness
    session.tool = tool
    session.content = content
    session.raw = encode_payload(PAYLOADS[harness]())


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


@then(parsers.parse("one {event} event naming {tool} is stored with only allowlisted metadata"))
def then_one_event_with_only_allowlisted_metadata(session: Session, event: str, tool: str) -> None:
    with closing(sqlite3.connect(session.database)) as connection:
        rows = connection.execute(
            "SELECT harness, event_type, tool_name, workspace_id, session_id FROM event"
        ).fetchall()
    assert len(rows) == 1
    harness, event_type, tool_name, workspace, native = rows[0]
    assert (harness, event_type, tool_name) == (session.harness, event, tool)
    assert re.fullmatch(r"ws_[0-9a-f]{32}", workspace)
    assert re.fullmatch(r"ss_[0-9a-f]{32}", native)
    assert session.raw not in data_home_bytes(session)


@then(parsers.parse("no part of the {content} reaches the store"))
def then_no_part_of_the_content_reaches_the_store(session: Session, content: str) -> None:
    assert session.content == content
    everything = {path: path.read_bytes() for path in session.home.parent.rglob("*") if path.is_file()}
    written = b"".join(everything.values())
    for canary in CONTENT_CANARIES[content]:
        assert canary.encode() not in written
    # A refused payload would leave its failure record beside the store, and a spooled one a file in the artifact's
    # temporary directory; an accepted, unspooled one leaves neither.
    assert {path.name for path in everything} <= STORE_FILES
    assert {path.parent for path in everything} == {session.data_home}
    assert list(session.temporary.iterdir()) == []


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout, session.completed.stderr) == (0, b"", b"")


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: A raw harness payload yields only allowlisted metadata and no diagnostic echoes its content
@scenario(FEATURE, "A raw harness payload yields only allowlisted metadata and no diagnostic echoes its content")
def test_a_raw_harness_payload_yields_only_allowlisted_metadata() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("an initialized store and a raw harness payload larger than 64 MiB")
def given_an_oversized_payload(session: Session) -> None:
    initialized = run_artifact(session.artifact, ["init", "--json"], home=session.home)
    assert (initialized.returncode, initialized.stderr) == (0, b"")
    session.harness = "claude_code"
    session.raw = b"x" * (RAW_LIMIT_BYTES + 1)


@then("it stores no event and writes nothing to either stream and exits 0")
def then_oversized_payload_stores_nothing(session: Session) -> None:
    assert session.completed is not None
    assert (session.completed.returncode, session.completed.stdout, session.completed.stderr) == (0, b"", b"")
    assert count(session, "event") == 0


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: A payload over 64 MiB is refused and the hook still exits 0
@scenario(FEATURE, "A payload over 64 MiB is refused and the hook still exits 0")
def test_a_payload_over_64_mib_is_refused_and_the_hook_still_exits_zero() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""
