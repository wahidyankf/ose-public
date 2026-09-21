"""The capture use case and command: a bounded read, validation before any storage access, then one store call."""

import io
import json
from dataclasses import dataclass, replace

import pytest

from ferret import cli
from ferret.application.capture import capture_event
from ferret.application.initialization import initialize_store
from ferret.application.privacy import CANONICAL_LIMIT_BYTES
from ferret.commands import build_handlers
from ferret.domain.errors import FerretError
from support.events import VECTOR_DOCUMENT, VECTOR_HASH, encode, event_document
from support.fakes import Entry, World, make_world

ARTIFACTS = ["identity.key", "identity.json", "config.json", "ferret.sqlite3"]
CAPTURE_TEXT = f"""\
FERRET capture: stored
Event: {VECTOR_DOCUMENT["eventId"]}
Hash: {VECTOR_HASH}
"""
CAPTURE_JSON = (
    '{"schemaVersion":1,"command":"capture","exitCode":0,"result":"stored",'
    f'"eventId":"{VECTOR_DOCUMENT["eventId"]}","eventHash":"{VECTOR_HASH}"}}\n'
)


@dataclass(frozen=True, slots=True)
class Outcome:
    code: int
    stdout: str
    stderr: str


def initialized_world(payload: bytes) -> World:
    world = make_world(input_data=payload)
    initialize_store(world.runtime)
    return world


def run(argv: list[str], world: World) -> Outcome:
    stdout, stderr = io.StringIO(), io.StringIO()
    code = cli.main(argv, stdout=stdout, stderr=stderr, handlers=build_handlers(lambda: world.runtime))
    return Outcome(code, stdout.getvalue(), stderr.getvalue())


def refused(world: World) -> FerretError:
    with pytest.raises(FerretError) as caught:
        capture_event(world.runtime)
    return caught.value


def test_a_valid_event_is_stored_once_and_the_outcome_names_it() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))

    outcome = capture_event(world.runtime)

    assert (outcome.result, outcome.event_id, outcome.event_hash) == ("stored", VECTOR_DOCUMENT["eventId"], VECTOR_HASH)
    assert [event.event_hash for event in world.events.stored] == [VECTOR_HASH]


def test_a_ready_store_is_verified_without_writing_anything() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))
    creates_before = list(world.files.creates)

    capture_event(world.runtime)

    assert world.files.creates == creates_before


def test_only_one_byte_past_the_limit_is_read_to_detect_an_oversized_event() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))

    capture_event(world.runtime)

    assert world.input.reads == [CANONICAL_LIMIT_BYTES + 1]


@pytest.mark.parametrize(
    "payload",
    [
        b" " * (CANONICAL_LIMIT_BYTES + 5),
        encode({**VECTOR_DOCUMENT, "prompt": "canary"}),
        b"{}",
        b"",
    ],
    ids=["oversized", "forbidden-field", "empty-object", "empty-input"],
)
def test_an_invalid_payload_is_rejected_before_any_storage_is_touched(payload: bytes) -> None:
    world = make_world(input_data=payload)

    error = refused(world)

    assert error.code == "invalid_event"
    assert world.files.touched == []
    assert world.events.captures == 0


def test_a_valid_event_needs_an_initialized_store() -> None:
    world = make_world(input_data=encode(VECTOR_DOCUMENT))

    error = refused(world)

    assert error.code == "uninitialized"
    assert error.exit_code == 3
    assert world.events.captures == 0


@pytest.mark.parametrize("missing", ARTIFACTS)
def test_a_store_missing_any_artifact_is_uninitialized(missing: str) -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))
    del world.files.files[missing]

    assert refused(world).code == "uninitialized"
    assert world.events.captures == 0


@pytest.mark.parametrize(
    ("target", "entry"),
    [
        (None, Entry(kind="directory", mode=0o755)),
        (None, Entry(kind="symlink")),
        (None, Entry(kind="directory", owned=False)),
        ("ferret.sqlite3", Entry(mode=0o644)),
        ("ferret.sqlite3", Entry(kind="symlink")),
        ("identity.key", Entry(links=2)),
        ("identity.json", Entry(owned=False)),
    ],
    ids=[
        "group-readable-directory",
        "symlinked-directory",
        "foreign-directory",
        "widened-database",
        "linked-database",
        "hard-linked-key",
        "foreign-identity",
    ],
)
def test_an_unsafe_store_is_refused_without_being_repaired(target: str | None, entry: Entry) -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))
    if target is None:
        world.files.directory = entry
    else:
        world.files.files[target] = replace(entry, content=world.files.files[target].content)

    assert refused(world).code == "unsafe_storage"
    assert world.events.captures == 0


def test_capture_json_is_the_frozen_success_object() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))

    assert run(["capture", "--json"], world) == Outcome(0, CAPTURE_JSON, "")


def test_capture_text_is_the_frozen_human_output() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))

    assert run(["capture"], world) == Outcome(0, CAPTURE_TEXT, "")


def test_the_same_event_captured_twice_is_stored_once_and_reported_as_a_duplicate() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))

    first = run(["capture", "--json"], world)
    second = run(["capture", "--json"], world)

    assert (first.code, second.code) == (0, 0)
    assert json.loads(first.stdout)["result"] == "stored"
    assert json.loads(second.stdout) == {**json.loads(first.stdout), "result": "duplicate"}
    assert len(world.events.stored) == 1


def test_the_same_id_with_different_content_is_an_idempotency_conflict() -> None:
    world = initialized_world(encode(VECTOR_DOCUMENT))
    run(["capture", "--json"], world)
    world.input.data = encode(event_document(toolName="Write"))

    outcome = run(["capture", "--json"], world)

    assert outcome == Outcome(
        2,
        "",
        '{"schemaVersion":1,"command":"capture","exitCode":2,'
        '"error":{"code":"idempotency_conflict","field":null,"retryable":false}}\n',
    )
    assert [event.tool_name for event in world.events.stored] == ["Read"]


def test_a_rejected_capture_json_failure_names_the_field_and_no_value() -> None:
    world = initialized_world(encode({**VECTOR_DOCUMENT, "toolName": "/etc/passwd"}))

    outcome = run(["capture", "--json"], world)

    assert outcome == Outcome(
        2,
        "",
        '{"schemaVersion":1,"command":"capture","exitCode":2,'
        '"error":{"code":"invalid_event","field":"toolName","retryable":false}}\n',
    )
    assert "/etc/passwd" not in outcome.stderr


def test_a_rejected_capture_text_failure_is_the_frozen_literal() -> None:
    outcome = run(["capture"], initialized_world(encode({**VECTOR_DOCUMENT, "prompt": "canary"})))

    assert outcome == Outcome(2, "", "FERRET error [invalid_event]: the event is not a valid FERRET event\n")
