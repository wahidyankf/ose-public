"""Unit bindings for the metadata envelope feature, in process with every OS dependency faked."""

import io
import json
import re
from dataclasses import dataclass

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret import cli
from ferret.application.initialization import initialize_store
from ferret.application.privacy import RAW_LIMIT_BYTES
from ferret.commands import build_handlers
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, encode, event_document
from support.fakes import World, make_world
from support.hook_payloads import CANARIES, IMAGE_CANARY, claude_tool, codex_view_image
from support.hook_payloads import encode as encode_payload

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature"
CANARY = "canary-value-that-must-never-be-echoed"
# The raw values an adapter might wrongly pass where an opaque identifier belongs, by the kind the scenario names.
RAW_VALUES = {
    "workspace path": "/users/example/work/canary-raw-workspace-3e71",
    "harness session value": "canary-raw-harness-session-5a02",
}
# A property the closed schema does not define: its name and its value are both canaries, so neither may be echoed.
UNKNOWN_KEY = "canary_unknown_property_4d7e"
UNKNOWN_VALUE = "canary-unknown-value-a19f"


@dataclass(slots=True)
class Outcome:
    code: int
    stdout: str
    stderr: str


@dataclass(slots=True)
class Session:
    """The fake machine, the field under test, and what the capture command produced."""

    world: World
    outcome: Outcome | None = None
    category: str | None = None
    raw: str = ""
    harness: str = "claude_code"


@pytest.fixture
def session() -> Session:
    world = make_world()
    initialize_store(world.runtime)
    return Session(world=world)


def submit(session: Session, document: dict[str, object]) -> None:
    session.world.input.data = encode(document)
    stdout, stderr = io.StringIO(), io.StringIO()
    handlers = build_handlers(lambda: session.world.runtime)
    code = cli.main(["capture", "--json"], stdout=stdout, stderr=stderr, handlers=handlers)
    session.outcome = Outcome(code, stdout.getvalue(), stderr.getvalue())


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
    assert session.world.schema.applied
    assert session.world.events.stored == []


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
    session.raw = RAW_VALUES[value]
    # Resealed, so the raw value is the only thing wrong with the event.
    submit(session, event_document(**{field: session.raw}))


@when("an adapter submits an otherwise valid event with a property the schema does not define")
def when_submit_event_with_unknown_property(session: Session) -> None:
    submit(session, {**VECTOR_DOCUMENT, UNKNOWN_KEY: UNKNOWN_VALUE})


@then("the CLI stores one event with its canonical hash and opaque identifiers")
def then_stores_one_event(session: Session) -> None:
    [event] = session.world.events.stored
    assert event.event_hash == VECTOR_HASH
    assert re.fullmatch(r"ws_[0-9a-f]{32}", event.workspace_id)
    assert re.fullmatch(r"ss_[0-9a-f]{32}", event.session_id)
    assert re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", event.installation_id)


@then("the stored record holds only the opaque workspace and session identifiers it was given")
def then_only_the_given_opaque_identifiers(session: Session) -> None:
    [event] = session.world.events.stored
    document = event.to_document()
    assert (document["workspaceId"], document["sessionId"], document["parentSessionId"]) == (
        "ws_327b250d010590da40f0f76d18da910a",
        "ss_d0de260ca18a8379984031556b2d43ac",
        None,
    )
    assert set(document) == set(VECTOR_DOCUMENT)
    # No stored value is a path, so no directory the capture ran in can have been kept under another name.
    assert [name for name, value in document.items() if isinstance(value, str) and "/" in value] == []
    # Direct capture takes its identifiers as given: it never resolves a workspace from a directory of its own.
    assert session.world.workspaces.asked == []


@then("the direct capture command reports success")
def then_reports_success(session: Session) -> None:
    assert session.outcome is not None
    assert (session.outcome.code, session.outcome.stderr) == (0, "")
    assert json.loads(session.outcome.stdout) == {
        "schemaVersion": 1,
        "command": "capture",
        "exitCode": 0,
        "result": "stored",
        "eventId": VECTOR_DOCUMENT["eventId"],
        "eventHash": VECTOR_HASH,
    }


@then("capture rejects the complete event without storing a partial row")
def then_rejects_without_a_row(session: Session) -> None:
    assert session.outcome is not None
    assert (session.outcome.code, session.outcome.stdout) == (2, "")
    assert session.world.events.captures == 0
    assert session.world.events.stored == []


def diagnostic(session: Session) -> dict[str, object]:
    """The error object of the rejected capture's closed failure envelope."""
    assert session.outcome is not None
    envelope = json.loads(session.outcome.stderr)
    assert (envelope["schemaVersion"], envelope["command"], envelope["exitCode"]) == (1, "capture", 2)
    return envelope["error"]


@then("the diagnostic names the field category without echoing its value")
def then_names_the_category_only(session: Session) -> None:
    assert diagnostic(session) == {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": session.category,
        "retryable": False,
    }
    assert session.outcome is not None
    assert CANARY not in session.outcome.stderr


@then(parsers.parse("the diagnostic names the {field} field without echoing its value"))
def then_names_the_identifier_field_only(session: Session, field: str) -> None:
    assert diagnostic(session) == {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": field,
        "retryable": False,
    }
    assert session.outcome is not None
    assert session.raw not in session.outcome.stderr


@then("the diagnostic names no field and echoes neither the unknown property name nor its value")
def then_names_no_field(session: Session) -> None:
    assert diagnostic(session) == {
        "code": "ferret.event.invalid",
        "message": "the event is not a valid FERRET event",
        "field": None,
        "retryable": False,
    }
    assert session.outcome is not None
    assert UNKNOWN_KEY not in session.outcome.stderr
    assert UNKNOWN_VALUE not in session.outcome.stderr


@scenario(FEATURE, "Project raw hook JSON without retaining content")
def test_project_raw_hook_json_without_retaining_content() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a raw harness payload carrying prompt text, tool arguments, and environment values")
def given_a_raw_payload_with_content(session: Session) -> None:
    session.world.input.data = encode_payload(
        claude_tool("PostToolUse", duration_ms=27, tool_response={"content": CANARIES[2]})
    )


@when("capture-hook maps it through that harness's allowlist mapper")
def when_capture_hook_maps_the_payload(session: Session) -> None:
    stdout, stderr = io.StringIO(), io.StringIO()
    handlers = build_handlers(lambda: session.world.runtime)
    argv = ["capture-hook", "--harness", session.harness, "--event", "tool.completed"]
    code = cli.main(argv, stdout=stdout, stderr=stderr, handlers=handlers)
    session.outcome = Outcome(code, stdout.getvalue(), stderr.getvalue())


@then("only allowlisted metadata reaches the canonical envelope")
def then_only_allowlisted_metadata_is_kept(session: Session) -> None:
    [event] = session.world.events.stored
    document = event.to_document()
    assert (document["harness"], document["eventType"], document["toolName"], document["durationMs"]) == (
        "claude_code",
        "tool.completed",
        "Read",
        27,
    )
    assert re.fullmatch(r"ws_[0-9a-f]{32}", document["workspaceId"])
    assert re.fullmatch(r"ss_[0-9a-f]{32}", document["sessionId"])
    assert not any(canary in json.dumps(document) for canary in CANARIES)


@then("the raw bytes stay in memory and are never spooled, logged, or written to SQLite")
def then_the_raw_bytes_are_never_written(session: Session) -> None:
    world = session.world
    written = b"".join(entry.content for entry in world.files.files.values())
    assert not any(canary.encode() in written for canary in CANARIES)
    assert world.input.reads == [RAW_LIMIT_BYTES + 1]
    assert [event for event in world.events.stored if any(c in json.dumps(event.to_document()) for c in CANARIES)] == []


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.outcome is not None
    assert (session.outcome.code, session.outcome.stdout, session.outcome.stderr) == (0, "", "")


@scenario(FEATURE, "Record a tool completion whose result is a large image")
def test_record_a_tool_completion_whose_result_is_a_large_image() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""


@given("a raw Codex view_image completion whose result is a 1 MiB base64 image")
def given_a_codex_view_image_completion(session: Session) -> None:
    session.harness = "codex"
    session.world.input.data = encode_payload(codex_view_image())
    assert len(session.world.input.data) > 1024 * 1024


@then("one tool-completed event naming view_image is stored")
def then_one_view_image_completion_is_stored(session: Session) -> None:
    [event] = session.world.events.stored
    document = event.to_document()
    assert (document["harness"], document["eventType"], document["toolName"]) == (
        "codex",
        "tool.completed",
        "view_image",
    )
    assert (document["outcome"], document["outcomeVisibility"]) == ("success", "derived")
    assert (document["durationMs"], document["durationVisibility"]) == (None, "unknown")


@then("no part of the image or of the other content reaches the store")
def then_no_image_or_content_is_stored(session: Session) -> None:
    world = session.world
    stored = json.dumps([event.to_document() for event in world.events.stored])
    written = b"".join(entry.content for entry in world.files.files.values())
    for canary in (IMAGE_CANARY, *CANARIES):
        assert canary not in stored
        assert canary.encode() not in written
    assert world.input.reads == [RAW_LIMIT_BYTES + 1]
