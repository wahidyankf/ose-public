"""Unit bindings for the metadata envelope feature, in process with every OS dependency faked."""

import io
import json
import re
from dataclasses import dataclass

import pytest
from pytest_bdd import given, parsers, scenario, then, when
from typekit import Ok

from ferret import cli
from ferret.application.initialization import initialize_store
from ferret.application.privacy import CANONICAL_LIMIT_BYTES, RAW_LIMIT_BYTES
from ferret.commands import build_handlers
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, encode, event_document
from support.fakes import World, make_world
from support.hook_payloads import CANARIES, IMAGE_CANARY, claude_tool, codex_view_image
from support.hook_payloads import encode as encode_payload
from support.invoke import run_cli

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
# Each raw payload the outline names, built here, with the canaries it carries.
PAYLOADS = {
    "claude_code": lambda: claude_tool("PostToolUse", duration_ms=27, tool_response={"content": CANARIES[2]}),
    "codex": codex_view_image,
}
CONTENT_CANARIES = {
    "prompt text, tool arguments, and environment values": CANARIES,
    "a 1 MiB base64 image": (IMAGE_CANARY,),
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
    raw: str = ""
    harness: str = "claude_code"
    canaries: tuple[str, ...] = ()
    tool: str = ""


@pytest.fixture
def session() -> Session:
    world = make_world()
    initialize_store(world.runtime)
    return Session(world=world)


def submit_raw(session: Session, raw: bytes) -> None:
    session.world.input.data = raw
    stdout, stderr = io.StringIO(), io.StringIO()
    handlers = build_handlers(lambda: Ok(session.world.runtime))
    code = cli.main(["capture", "--json"], stdout=stdout, stderr=stderr, handlers=handlers)
    session.outcome = Outcome(code, stdout.getvalue(), stderr.getvalue())


def submit(session: Session, document: dict[str, object]) -> None:
    submit_raw(session, encode(document))


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: A valid lifecycle event is captured and appears in events list
@scenario(FEATURE, "A valid lifecycle event is captured and appears in events list")
def test_a_valid_lifecycle_event_is_captured_and_appears_in_events_list() -> None:
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


@when("an adapter submits an event of 16 KiB plus one byte")
def when_submit_event_over_the_canonical_limit(session: Session) -> None:
    # A valid event padded with spaces to one byte past the canonical limit, so only the size is wrong.
    submit_raw(session, encode(VECTOR_DOCUMENT).ljust(CANONICAL_LIMIT_BYTES + 1, b" "))


@then("events list shows that one event with its opaque workspace and session identifiers")
def then_events_list_shows_the_event(session: Session) -> None:
    ran = run_cli(session.world, ["events", "list", "--all-time", "--json"])
    assert (ran.code, ran.stderr) == (0, "")
    document = json.loads(ran.stdout)
    [item] = document["items"]
    assert item["eventId"] == VECTOR_DOCUMENT["eventId"]
    assert (item["workspaceId"], item["sessionId"], item["parentSessionId"]) == (
        "ws_327b250d010590da40f0f76d18da910a",
        "ss_d0de260ca18a8379984031556b2d43ac",
        None,
    )
    # No listed value is a path, so no directory the capture ran in can have been kept under another name.
    assert [name for name, value in item.items() if isinstance(value, str) and "/" in value] == []
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


@then("the diagnostic names no field and echoes no part of the input")
def then_names_no_field_and_echoes_nothing(session: Session) -> None:
    assert diagnostic(session)["field"] is None
    assert session.outcome is not None
    assert VECTOR_DOCUMENT["eventId"] not in session.outcome.stderr


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: ferret capture refuses input over 16 KiB
@scenario(FEATURE, "ferret capture refuses input over 16 KiB")
def test_ferret_capture_refuses_input_over_16_kib() -> None:
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


@given(parsers.parse("a raw {harness} {event} payload for the {tool} tool carrying {content}"))
def given_a_raw_payload_for_a_tool(session: Session, harness: str, event: str, tool: str, content: str) -> None:
    assert event == "tool.completed"
    session.harness = harness
    session.canaries = CONTENT_CANARIES[content]
    session.world.input.data = encode_payload(PAYLOADS[harness]())
    session.tool = tool


@when("capture-hook maps it through that harness's allowlist mapper")
def when_capture_hook_maps_the_payload(session: Session) -> None:
    stdout, stderr = io.StringIO(), io.StringIO()
    handlers = build_handlers(lambda: Ok(session.world.runtime))
    argv = ["capture-hook", "--harness", session.harness, "--event", "tool.completed"]
    code = cli.main(argv, stdout=stdout, stderr=stderr, handlers=handlers)
    session.outcome = Outcome(code, stdout.getvalue(), stderr.getvalue())


@then(parsers.parse("one {event} event naming {tool} is stored with only allowlisted metadata"))
def then_one_event_with_only_allowlisted_metadata(session: Session, event: str, tool: str) -> None:
    [stored] = session.world.events.stored
    document = stored.to_document()
    assert (document["harness"], document["eventType"], document["toolName"]) == (session.harness, event, tool)
    assert re.fullmatch(r"ws_[0-9a-f]{32}", document["workspaceId"])
    assert re.fullmatch(r"ss_[0-9a-f]{32}", document["sessionId"])
    assert not any(canary in json.dumps(document) for canary in (*CANARIES, IMAGE_CANARY))
    assert session.world.input.reads == [RAW_LIMIT_BYTES + 1]


@then(parsers.parse("no part of the {content} reaches the store"))
def then_no_part_of_the_content_reaches_the_store(session: Session, content: str) -> None:
    world = session.world
    stored = json.dumps([event.to_document() for event in world.events.stored])
    written = b"".join(entry.content for entry in world.files.files.values())
    for canary in session.canaries:
        assert canary not in stored
        assert canary.encode() not in written


@then("any diagnostic about the payload names no value taken from it")
def then_no_diagnostic_names_a_value(session: Session) -> None:
    assert session.outcome is not None
    assert (session.outcome.code, session.outcome.stdout, session.outcome.stderr) == (0, "", "")


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: A raw harness payload yields only allowlisted metadata and no diagnostic echoes its content
@scenario(FEATURE, "A raw harness payload yields only allowlisted metadata and no diagnostic echoes its content")
def test_a_raw_harness_payload_yields_only_allowlisted_metadata() -> None:
    """Bound to the feature outline; each example expands independently."""


@given("an initialized store and a raw harness payload larger than 64 MiB")
def given_an_oversized_payload(session: Session) -> None:
    session.harness = "claude_code"
    session.world.input.data = b"x" * (RAW_LIMIT_BYTES + 1)


@then("it stores no event and writes nothing to either stream and exits 0")
def then_oversized_payload_stores_nothing(session: Session) -> None:
    assert session.outcome is not None
    assert (session.outcome.code, session.outcome.stdout, session.outcome.stderr) == (0, "", "")
    assert session.world.events.stored == []


# @scenario specs/apps/ferret/cli/behaviours/privacy/metadata-envelope.feature: A payload over 64 MiB is refused and the hook still exits 0
@scenario(FEATURE, "A payload over 64 MiB is refused and the hook still exits 0")
def test_a_payload_over_64_mib_is_refused_and_the_hook_still_exits_zero() -> None:
    """Bound to the feature scenario; the steps below carry the assertions."""
