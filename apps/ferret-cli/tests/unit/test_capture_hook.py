"""The raw-hook capture use case: what one vendor payload becomes, and everything that must never be stored."""

import json
from dataclasses import replace
from datetime import timedelta
from typing import Any

import pytest

from ferret.application.capture_hook import capture_hook
from ferret.application.initialization import initialize_store
from ferret.application.ports import Budget, CaptureResult
from ferret.application.privacy import RAW_LIMIT_BYTES
from ferret.domain.errors import FerretError
from ferret.domain.event import Event
from ferret.domain.identity import derive_identifier
from ferret.domain.timestamps import format_timestamp
from support.fakes import (
    FIXED_NOW,
    INSTALLATION_ID,
    Entry,
    FakeEvents,
    FakeWorkspaces,
    SequenceRandomness,
    World,
    make_world,
)
from support.hook_payloads import (
    CANARIES,
    CLAUDE_CODE,
    CODEX,
    IMAGE_BYTES,
    IMAGE_CANARY,
    OPENCODE,
    REGISTRATIONS,
    SESSION,
    WORKSPACE,
    claude_code,
    claude_tool,
    codex_view_image,
    encode,
    opencode_session_created,
)

EVENT_ID = "00000000-0000-4000-8000-0000000000aa"
KEY = bytes(range(32))
REGISTRATION_IDS = [f"{harness}-{event}" for harness, event, _ in REGISTRATIONS]


def world_for(payload: dict[str, Any] | bytes, *, workspaces: FakeWorkspaces | None = None) -> World:
    raw = payload if isinstance(payload, bytes) else encode(payload)
    world = make_world(
        input_data=raw,
        randomness=SequenceRandomness((INSTALLATION_ID, EVENT_ID)),
        workspaces=workspaces,
    )
    initialize_store(world.runtime)
    return world


def only_event(world: World) -> Event:
    assert len(world.events.stored) == 1
    return world.events.stored[0]


def refused(world: World, harness: str = CLAUDE_CODE, event: str = "tool.started") -> FerretError:
    with pytest.raises(FerretError) as caught:
        capture_hook(world.runtime, harness=harness, event=event)
    return caught.value


@pytest.mark.parametrize(("harness", "event", "payload"), REGISTRATIONS, ids=REGISTRATION_IDS)
def test_every_registration_stores_one_event_of_its_own_type(harness: str, event: str, payload: dict[str, Any]) -> None:
    world = world_for(payload)

    result = capture_hook(world.runtime, harness=harness, event=event)

    stored = only_event(world)
    assert result == "stored"
    assert (stored.harness, stored.event_type, stored.event_id) == (harness, event, EVENT_ID)


@pytest.mark.parametrize(("harness", "event", "payload"), REGISTRATIONS, ids=REGISTRATION_IDS)
def test_nothing_the_harness_sent_beyond_metadata_reaches_the_stored_event(
    harness: str, event: str, payload: dict[str, Any]
) -> None:
    world = world_for(payload)

    capture_hook(world.runtime, harness=harness, event=event)

    stored = json.dumps(only_event(world).to_document(), ensure_ascii=False)
    assert [canary for canary in CANARIES if canary in stored] == []
    assert WORKSPACE not in stored
    assert SESSION not in stored


def test_identifiers_are_derived_under_the_installation_key_and_the_reported_values_are_not_kept() -> None:
    world = world_for(claude_tool("PreToolUse"))

    capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started")

    stored = only_event(world)
    assert stored.workspace_id == derive_identifier(KEY, "ws", WORKSPACE)
    assert stored.session_id == derive_identifier(KEY, "ss", CLAUDE_CODE, SESSION)
    assert stored.parent_session_id is None
    assert stored.installation_id == INSTALLATION_ID


def test_a_directory_inside_a_repository_is_reported_as_the_repository_root() -> None:
    inner = claude_tool("PreToolUse", cwd=f"{WORKSPACE}/packages/one")
    world = world_for(inner, workspaces=FakeWorkspaces(roots=(WORKSPACE,)))

    capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started")

    assert world.workspaces.asked == [f"{WORKSPACE}/packages/one"]
    assert only_event(world).workspace_id == derive_identifier(KEY, "ws", WORKSPACE)


def test_two_directories_of_one_repository_share_a_workspace_identifier() -> None:
    roots = FakeWorkspaces(roots=(WORKSPACE,))
    first = world_for(claude_tool("PreToolUse", cwd=f"{WORKSPACE}/a"), workspaces=roots)
    second = world_for(claude_tool("PreToolUse", cwd=f"{WORKSPACE}/b"), workspaces=roots)

    capture_hook(first.runtime, harness=CLAUDE_CODE, event="tool.started")
    capture_hook(second.runtime, harness=CLAUDE_CODE, event="tool.started")

    assert only_event(first).workspace_id == only_event(second).workspace_id


def test_a_session_of_another_harness_gets_another_identifier() -> None:
    claude = world_for(claude_tool("PreToolUse"))
    codex = world_for(claude_tool("PreToolUse"))

    capture_hook(claude.runtime, harness=CLAUDE_CODE, event="tool.started")
    capture_hook(codex.runtime, harness=CODEX, event="tool.started")

    assert only_event(claude).session_id != only_event(codex).session_id


def test_a_child_session_carries_the_derived_identifier_of_its_parent() -> None:
    payload = opencode_session_created()
    payload["input"]["event"]["properties"]["info"]["parentID"] = "native-parent-0001"
    world = world_for(payload)

    capture_hook(world.runtime, harness=OPENCODE, event="session.started")

    assert only_event(world).parent_session_id == derive_identifier(KEY, "ss", OPENCODE, "native-parent-0001")


def test_the_event_is_stamped_with_the_current_time() -> None:
    world = world_for(claude_tool("PreToolUse"))
    world.clock.advance(timedelta(minutes=5))

    capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started")

    stamp = format_timestamp(FIXED_NOW + timedelta(minutes=5))
    assert (only_event(world).occurred_at, only_event(world).captured_at) == (stamp, stamp)


def test_a_reported_duration_and_tool_name_are_kept_as_observed_metadata() -> None:
    world = world_for(claude_tool("PostToolUse", duration_ms=27))

    capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.completed")

    stored = only_event(world)
    assert (stored.tool_name, stored.duration_ms, stored.duration_visibility) == ("Read", 27, "observed")


def test_a_harness_without_a_mapper_stores_nothing_and_reads_no_input() -> None:
    world = world_for(claude_tool("PreToolUse"))

    result = capture_hook(world.runtime, harness="unknown-harness", event="tool.started")

    assert result is None
    assert (world.events.captures, world.input.reads) == (0, [])


def test_an_event_the_payload_does_not_describe_stores_nothing() -> None:
    world = world_for(claude_code("Stop"))

    assert capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started") is None
    assert world.events.captures == 0


def test_a_payload_that_is_not_a_json_object_is_refused_before_storage() -> None:
    world = world_for(b"{not json")

    assert refused(world).code == "ferret.event.invalid"
    assert world.events.captures == 0


def test_one_byte_past_the_raw_limit_is_read_and_the_payload_refused() -> None:
    world = world_for(b"{" + b" " * RAW_LIMIT_BYTES + b"}")

    assert refused(world).code == "ferret.event.invalid"
    assert world.input.reads == [RAW_LIMIT_BYTES + 1]


@pytest.mark.parametrize("size", [300 * 1024, IMAGE_BYTES, 16 * IMAGE_BYTES], ids=["300KiB", "1MiB", "16MiB"])
def test_a_codex_view_image_completion_is_stored_however_large_its_image(size: int) -> None:
    """Regression: every ``view_image`` completion was refused, because the image it returns outran a 256 KiB limit."""
    world = world_for(codex_view_image(size=size))

    assert capture_hook(world.runtime, harness=CODEX, event="tool.completed") == "stored"

    stored = only_event(world)
    assert (stored.event_type, stored.tool_name, stored.outcome, stored.outcome_visibility) == (
        "tool.completed",
        "view_image",
        "success",
        "derived",
    )
    document = json.dumps(stored.to_document())
    assert IMAGE_CANARY not in document
    assert [canary for canary in CANARIES if canary in document] == []


def test_a_payload_of_exactly_the_raw_limit_is_accepted() -> None:
    payload = encode(codex_view_image())
    world = world_for(payload + b" " * (RAW_LIMIT_BYTES - len(payload)))

    assert capture_hook(world.runtime, harness=CODEX, event="tool.completed") == "stored"
    assert world.input.reads == [RAW_LIMIT_BYTES + 1]


def test_a_payload_with_a_duplicate_key_is_refused() -> None:
    world = world_for(b'{"session_id":"a","session_id":"b","cwd":"/work","hook_event_name":"PreToolUse"}')

    assert refused(world).code == "ferret.event.invalid"


def test_an_uninitialized_store_is_refused_and_nothing_is_created() -> None:
    world = make_world(input_data=encode(claude_tool("PreToolUse")))

    assert refused(world).code == "ferret.storage.uninitialized"
    assert world.files.creates == []


@pytest.mark.parametrize("length", [0, 31, 33])
def test_an_installation_key_of_the_wrong_length_makes_the_store_unusable(length: int) -> None:
    world = world_for(claude_tool("PreToolUse"))
    world.files.files["identity.key"] = Entry(content=b"k" * length)

    assert refused(world).code == "ferret.storage.unavailable"
    assert world.events.captures == 0


def test_an_unreadable_identity_document_makes_the_store_unusable() -> None:
    world = world_for(claude_tool("PreToolUse"))
    world.files.files["identity.json"] = Entry(content=b"[]")

    assert refused(world).code == "ferret.storage.unavailable"


def test_the_bounded_prune_runs_before_the_event_is_stored(monkeypatch: pytest.MonkeyPatch) -> None:
    world = world_for(claude_tool("PreToolUse"))
    original = FakeEvents.capture
    pruned_before_capture: list[int] = []

    def observe(self: FakeEvents, event: Event, *, budget: Budget | None = None) -> CaptureResult:
        pruned_before_capture.append(len(world.telemetry.prunes))
        return original(self, event, budget=budget)

    monkeypatch.setattr(FakeEvents, "capture", observe)

    capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started")

    assert pruned_before_capture == [1]


def test_a_prune_that_is_not_due_leaves_the_capture_alone() -> None:
    world = world_for(claude_tool("PreToolUse"))
    world.telemetry.marker = format_timestamp(FIXED_NOW)

    assert capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started") == "stored"
    assert world.telemetry.prunes == []


def test_a_prune_that_cannot_take_the_lock_still_lets_the_event_be_stored() -> None:
    world = world_for(claude_tool("PreToolUse"))
    world.telemetry.lock_held = True

    assert capture_hook(world.runtime, harness=CLAUDE_CODE, event="tool.started") == "stored"
    assert [prune.state for prune in world.telemetry.prunes] == ["skipped"]


def test_a_mapper_mistake_can_never_store_an_invalid_row(monkeypatch: pytest.MonkeyPatch) -> None:
    world = world_for(claude_tool("PreToolUse"))

    def broken(event: Event, **changes: Any) -> Event:
        return replace(event, **{**changes, "event_type": "not.an.event"})

    monkeypatch.setattr("ferret.application.capture_hook.replace", broken)

    assert refused(world).code == "ferret.event.invalid"
    assert world.events.captures == 0
