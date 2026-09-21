"""Unit bindings for the metadata envelope feature, in process with every OS dependency faked."""

import io
import json
import re
from dataclasses import dataclass

import pytest
from pytest_bdd import given, parsers, scenario, then, when

from ferret import cli
from ferret.application.initialization import initialize_store
from ferret.commands import build_handlers
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, encode
from support.fakes import World, make_world
from support.hook_payloads import CANARIES, claude_tool
from support.hook_payloads import encode as encode_payload

FEATURE = "../../../../../specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature"
CANARY = "canary-value-that-must-never-be-echoed"
RAW_WORKSPACE = "/users/example/work/repo-a"
RAW_SESSION = "raw-harness-session-123"
FORBIDDEN_KEYS = {
    "prompt": ("prompt", "prompt"),
    "response": ("response", "response"),
    "tool_arguments": ("tool_arguments", "tool_arguments"),
    "transcript_path": ("transcript_path", "transcript_path"),
    "environment": ("environment", "environment"),
    "an unknown arbitrary field": ("unexpected_arbitrary_field", None),
}


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


@scenario(FEATURE, "Reject a forbidden capture field")
def test_reject_a_forbidden_capture_field() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("FERRET is initialized with an empty local database")
def given_initialized_and_empty(session: Session) -> None:
    assert session.world.schema.applied
    assert session.world.events.stored == []


@when("an adapter submits one schema-version-1.0 tool-completed event")
def when_submit_valid_event(session: Session) -> None:
    submit(session, VECTOR_DOCUMENT)


@when(parsers.parse("an adapter submits an otherwise valid event containing {field}"))
def when_submit_event_with_forbidden_field(session: Session, field: str) -> None:
    key, session.category = FORBIDDEN_KEYS[field]
    submit(session, {**VECTOR_DOCUMENT, key: CANARY})


@then("the CLI stores one event with its canonical hash and opaque identifiers")
def then_stores_one_event(session: Session) -> None:
    [event] = session.world.events.stored
    assert event.event_hash == VECTOR_HASH
    assert re.fullmatch(r"ws_[0-9a-f]{32}", event.workspace_id)
    assert re.fullmatch(r"ss_[0-9a-f]{32}", event.session_id)
    assert re.fullmatch(r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}", event.installation_id)


@then("the stored record contains no raw workspace or harness session value")
def then_no_raw_values(session: Session) -> None:
    [event] = session.world.events.stored
    stored = json.dumps(event.to_document())
    assert RAW_WORKSPACE not in stored
    assert RAW_SESSION not in stored
    assert set(event.to_document()) == set(VECTOR_DOCUMENT)


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


@then("the diagnostic names the field category without echoing its value")
def then_names_the_category_only(session: Session) -> None:
    assert session.outcome is not None
    error = json.loads(session.outcome.stderr)["error"]
    assert error == {"code": "invalid_event", "field": session.category, "retryable": False}
    assert CANARY not in session.outcome.stderr


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
    argv = ["capture-hook", "--harness", "claude_code", "--event", "tool.completed"]
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
    assert world.input.reads == [256 * 1024 + 1]
    assert [event for event in world.events.stored if any(c in json.dumps(event.to_document()) for c in CANARIES)] == []


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.outcome is not None
    assert (session.outcome.code, session.outcome.stdout, session.outcome.stderr) == (0, "", "")
