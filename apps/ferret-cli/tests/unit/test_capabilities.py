"""Capability snapshots: the fixed vector, the closed schema, producer-owned identity, and honest visibility."""

import dataclasses
import json
from typing import Any

import pytest

from ferret.application.capabilities import DimensionReport, dimension_visibility, record_snapshot, report_dimension
from ferret.application.initialization import initialize_store
from ferret.domain.capability import (
    Capability,
    CapabilitySnapshot,
    canonical_snapshot_bytes,
    snapshot_from_document,
    snapshot_hash,
)
from ferret.domain.errors import FerretError
from support.fakes import FIXED_NOW, World, make_world
from support.snapshots import (
    DOCUMENT_ORDER,
    HASHED_ORDER,
    VECTOR_BYTES,
    VECTOR_DOCUMENT,
    VECTOR_HASH,
    capability,
    oracle_bytes,
    snapshot_document,
)

NOW = FIXED_NOW
SORTED_NAMES = (
    "agent_lifecycle",
    "duration",
    "outcome",
    "session_lifecycle",
    "skill_invocation",
    "tool_lifecycle",
)
LATER = "2026-09-18T09:00:00.000Z"
SECOND_ID = "00000000-0000-4000-8000-000000000005"


def vector_snapshot() -> CapabilitySnapshot:
    return snapshot_from_document(VECTOR_DOCUMENT, now=NOW)


def replaced(**fields: Any) -> dict[str, Any]:
    """The vector with fields swapped in and the hash left stale, so only the named field can be at fault."""
    return {**VECTOR_DOCUMENT, **fields}


def without(field: str) -> dict[str, Any]:
    return {name: value for name, value in VECTOR_DOCUMENT.items() if name != field}


def with_items(*items: Any) -> dict[str, Any]:
    return replaced(capabilities=list(items))


def unchecked(document: dict[str, Any]) -> CapabilitySnapshot:
    """A snapshot built straight from fields, bypassing validation, to probe the hash and the store alone."""
    return CapabilitySnapshot(
        schema_version=document["schemaVersion"],
        snapshot_id=document["snapshotId"],
        snapshot_hash=document["snapshotHash"],
        captured_at=document["capturedAt"],
        harness=document["harness"],
        harness_version=document["harnessVersion"],
        installation_id=document["installationId"],
        capabilities=tuple(Capability(**item) for item in document["capabilities"]),
    )


def refusal(document: dict[str, Any]) -> FerretError:
    with pytest.raises(FerretError) as caught:
        snapshot_from_document(document, now=NOW)
    return caught.value


def initialized_world() -> World:
    world = make_world()
    initialize_store(world.runtime)
    return world


def refused_recording(world: World, document: dict[str, Any]) -> FerretError:
    with pytest.raises(FerretError) as caught:
        record_snapshot(world.runtime, document)
    return caught.value


def test_fixed_snapshot_vector() -> None:
    snapshot = vector_snapshot()

    assert canonical_snapshot_bytes(snapshot) == VECTOR_BYTES
    assert snapshot_hash(snapshot) == VECTOR_HASH
    assert snapshot.snapshot_hash == VECTOR_HASH


def test_the_document_form_keeps_the_normative_property_and_item_order() -> None:
    document = vector_snapshot().to_document()

    assert list(document) == list(DOCUMENT_ORDER)
    assert document == VECTOR_DOCUMENT
    assert [list(item) for item in document["capabilities"]] == [["name", "state", "source"]] * 2


def test_the_snapshot_expires_thirty_days_after_it_was_captured() -> None:
    assert vector_snapshot().expires_at == "2026-10-18T08:00:00.000Z"


def test_a_snapshot_is_immutable_and_holds_its_capabilities_as_a_tuple() -> None:
    snapshot = vector_snapshot()

    with pytest.raises(dataclasses.FrozenInstanceError):
        setattr(snapshot, "harness", "opencode")  # noqa: B010 - the assignment is the behaviour under test
    assert isinstance(snapshot.capabilities, tuple)
    assert dataclasses.replace(snapshot, harness="opencode").harness == "opencode"
    assert snapshot.harness == "codex"


@pytest.mark.parametrize("field", HASHED_ORDER)
def test_altering_any_hashed_field_changes_the_digest(field: str) -> None:
    replacements: dict[str, Any] = {
        "schemaVersion": "1.1",
        "snapshotId": SECOND_ID,
        "capturedAt": LATER,
        "harness": "claude_code",
        "harnessVersion": "1.2.4",
        "installationId": "00000000-0000-4000-8000-000000000009",
        "capabilities": [capability("outcome", "derived", "official_plugin")],
    }
    altered = {**VECTOR_DOCUMENT, field: replacements[field]}

    assert canonical_snapshot_bytes(unchecked(altered)) != VECTOR_BYTES
    assert snapshot_hash(unchecked(altered)) != VECTOR_HASH


def test_the_hash_excludes_the_hash_field_itself() -> None:
    tampered = {**VECTOR_DOCUMENT, "snapshotHash": "0" * 64}

    assert canonical_snapshot_bytes(unchecked(tampered)) == VECTOR_BYTES
    assert snapshot_hash(unchecked(tampered)) == VECTOR_HASH


def test_reordered_and_pretty_printed_input_hashes_identically() -> None:
    scrambled = dict(reversed(list(VECTOR_DOCUMENT.items())))
    scrambled["capabilities"] = [dict(reversed(list(item.items()))) for item in VECTOR_DOCUMENT["capabilities"]]
    pretty = json.loads(json.dumps(scrambled, indent=4, sort_keys=True))

    snapshot = snapshot_from_document(pretty, now=NOW)

    assert snapshot_hash(snapshot) == VECTOR_HASH
    assert canonical_snapshot_bytes(snapshot) == VECTOR_BYTES


VALID = [
    pytest.param(snapshot_document(harnessVersion=None), id="no-harness-version"),
    pytest.param(snapshot_document(capabilities=[]), id="no-capabilities"),
    pytest.param(snapshot_document(capabilities=[capability(name) for name in SORTED_NAMES]), id="every-name"),
    pytest.param(
        snapshot_document(capabilities=[capability("outcome", "derived", "official_plugin")]),
        id="derived-from-a-plugin",
    ),
    pytest.param(
        snapshot_document(capabilities=[capability("duration", "unknown", "unavailable")]), id="unknown-unavailable"
    ),
    pytest.param(snapshot_document(harness="opencode", harnessVersion="0.15.3+build.7"), id="another-harness"),
    pytest.param(snapshot_document(capturedAt="2026-09-19T08:00:00.000Z"), id="captured-exactly-a-day-ahead"),
]


@pytest.mark.parametrize("document", VALID)
def test_a_valid_snapshot_round_trips_through_its_document_form(document: dict[str, Any]) -> None:
    snapshot = snapshot_from_document(document, now=NOW)

    assert snapshot.to_document() == document
    assert canonical_snapshot_bytes(snapshot) == oracle_bytes(document)
    assert snapshot.snapshot_hash == snapshot_hash(snapshot)


INVALID = [
    pytest.param({**VECTOR_DOCUMENT, "extra": "value"}, None, id="unknown-property"),
    *[pytest.param(without(name), name, id=f"missing-{name}") for name in DOCUMENT_ORDER],
    pytest.param(replaced(schemaVersion="2.0"), "schemaVersion", id="other-schema-version"),
    pytest.param(replaced(schemaVersion=1), "schemaVersion", id="numeric-schema-version"),
    pytest.param(replaced(snapshotId="00000000-0000-1000-8000-000000000004"), "snapshotId", id="uuid-version-1"),
    pytest.param(replaced(snapshotId="00000000-0000-4000-8000-00000000000A"), "snapshotId", id="uppercase-uuid"),
    pytest.param(replaced(snapshotId="not-a-uuid"), "snapshotId", id="not-a-uuid"),
    pytest.param(replaced(snapshotId=4), "snapshotId", id="numeric-snapshot-id"),
    pytest.param(replaced(snapshotHash="abc"), "snapshotHash", id="short-hash"),
    pytest.param(replaced(snapshotHash="A" * 64), "snapshotHash", id="uppercase-hash"),
    pytest.param(replaced(snapshotHash=7), "snapshotHash", id="numeric-hash"),
    pytest.param(replaced(capturedAt="2026-09-18 08:00:00.000Z"), "capturedAt", id="space-separated-timestamp"),
    pytest.param(replaced(capturedAt="2026-09-18T08:00:00Z"), "capturedAt", id="missing-milliseconds"),
    pytest.param(replaced(capturedAt="2026-09-18T08:00:00.000+00:00"), "capturedAt", id="offset-timestamp"),
    pytest.param(
        replaced(capturedAt="\uff12\uff10\uff12\uff16-09-18T08:00:00.000Z"), "capturedAt", id="fullwidth-digits"
    ),
    pytest.param(replaced(capturedAt="2026-09-19T08:00:00.001Z"), "capturedAt", id="beyond-a-day-ahead"),
    pytest.param(replaced(capturedAt=20260918), "capturedAt", id="numeric-timestamp"),
    pytest.param(replaced(harness="Codex"), "harness", id="uppercase-harness"),
    pytest.param(replaced(harness=""), "harness", id="empty-harness"),
    pytest.param(replaced(harness="1codex"), "harness", id="harness-starting-with-a-digit"),
    pytest.param(replaced(harness="c" * 33), "harness", id="overlong-harness"),
    pytest.param(replaced(harnessVersion=""), "harnessVersion", id="empty-harness-version"),
    pytest.param(replaced(harnessVersion="1 2"), "harnessVersion", id="harness-version-with-a-space"),
    pytest.param(replaced(harnessVersion="1" * 65), "harnessVersion", id="overlong-harness-version"),
    pytest.param(replaced(harnessVersion=12), "harnessVersion", id="numeric-harness-version"),
    pytest.param(
        replaced(installationId="00000000-0000-4000-8000-00000000000g"), "installationId", id="bad-installation"
    ),
    pytest.param(replaced(capabilities={}), "capabilities", id="capabilities-object"),
    pytest.param(replaced(capabilities="session_lifecycle"), "capabilities", id="capabilities-string"),
    pytest.param(replaced(capabilities=None), "capabilities", id="capabilities-null"),
    pytest.param(with_items("session_lifecycle"), "capabilities", id="item-string"),
    pytest.param(with_items({"name": "outcome", "state": "observed"}), "capabilities", id="item-missing-source"),
    pytest.param(
        with_items({**capability("outcome"), "note": "x"}), "capabilities", id="item-with-an-unknown-property"
    ),
    pytest.param(with_items(capability("skill_usage")), "capabilities", id="unknown-capability-name"),
    pytest.param(with_items(capability("outcome", "seen")), "capabilities", id="unknown-state"),
    pytest.param(with_items(capability("outcome", "observed", "vendor_log")), "capabilities", id="unknown-source"),
    pytest.param(with_items(capability("outcome"), capability("outcome")), "capabilities", id="duplicate-name"),
    pytest.param(
        with_items(capability("tool_lifecycle"), capability("outcome")), "capabilities", id="names-out-of-order"
    ),
    pytest.param(
        with_items(capability("outcome", "observed", "unavailable")), "capabilities", id="observed-without-a-source"
    ),
    pytest.param(
        with_items(capability("outcome", "derived", "unavailable")), "capabilities", id="derived-without-a-source"
    ),
    pytest.param(
        with_items(capability("outcome", "unknown", "official_hook")), "capabilities", id="unknown-with-a-source"
    ),
    pytest.param(
        with_items(capability("outcome", "unknown", "official_plugin")), "capabilities", id="unknown-with-a-plugin"
    ),
    pytest.param(replaced(harnessVersion="1.2.4"), "snapshotHash", id="altered-field-with-a-stale-hash"),
    pytest.param(replaced(snapshotHash="0" * 64), "snapshotHash", id="unrelated-hash"),
]


@pytest.mark.parametrize(("document", "field"), INVALID)
def test_capability_snapshot_matrix(document: dict[str, Any], field: str | None) -> None:
    error = refusal(document)

    assert (error.code, error.exit_code, error.field, error.retryable) == ("ferret.event.invalid", 2, field, False)


def test_a_rejected_snapshot_never_echoes_its_content() -> None:
    error = refusal(replaced(harness="canary-value-that-must-never-be-echoed"))

    assert "canary" not in str(error)
    assert error.field == "harness"


def test_a_new_snapshot_is_stored_once() -> None:
    world = initialized_world()

    assert record_snapshot(world.runtime, VECTOR_DOCUMENT) == "stored"

    assert [held.snapshot_hash for held in world.capabilities.stored] == [VECTOR_HASH]


def test_the_same_snapshot_twice_is_a_duplicate_that_stores_nothing_more() -> None:
    world = initialized_world()
    record_snapshot(world.runtime, VECTOR_DOCUMENT)

    assert record_snapshot(world.runtime, VECTOR_DOCUMENT) == "duplicate"

    assert len(world.capabilities.stored) == 1


@pytest.mark.parametrize(
    ("first", "second"),
    [
        pytest.param(("unknown", "unavailable"), ("observed", "official_hook"), id="gained-a-signal"),
        pytest.param(("observed", "official_plugin"), ("unknown", "unavailable"), id="lost-a-signal"),
        pytest.param(("derived", "official_hook"), ("observed", "official_hook"), id="derived-became-observed"),
        pytest.param(("observed", "official_hook"), ("observed", "official_hook"), id="reassessed-unchanged"),
    ],
)
def test_round_trip_the_same_capability_through_two_snapshots(first: tuple[str, str], second: tuple[str, str]) -> None:
    world = initialized_world()
    earlier = snapshot_document(capabilities=[capability("skill_invocation", *first)])
    later = snapshot_document(
        snapshotId=SECOND_ID, capturedAt=LATER, capabilities=[capability("skill_invocation", *second)]
    )

    results = [record_snapshot(world.runtime, earlier), record_snapshot(world.runtime, later)]

    assert results == ["stored", "stored"]
    assert [held.to_document() for held in world.capabilities.stored] == [earlier, later]
    assert [held.capabilities for held in world.capabilities.stored] == [
        (Capability("skill_invocation", *first),),
        (Capability("skill_invocation", *second),),
    ]
    assert world.capabilities.latest_snapshot("codex", now=world.clock.now()) == world.capabilities.stored[1]


def test_equal_capability_content_under_two_snapshot_ids_is_two_snapshots() -> None:
    world = initialized_world()
    twin = snapshot_document(snapshotId=SECOND_ID)

    assert record_snapshot(world.runtime, VECTOR_DOCUMENT) == "stored"
    assert record_snapshot(world.runtime, twin) == "stored"

    assert twin["snapshotHash"] != VECTOR_HASH
    assert [held.capabilities for held in world.capabilities.stored] == [vector_snapshot().capabilities] * 2


@pytest.mark.parametrize(
    "changes",
    [
        pytest.param({"harnessVersion": "9.9.9"}, id="another-harness-version"),
        pytest.param({"capabilities": [capability("outcome")]}, id="another-assessment"),
        pytest.param({"capturedAt": LATER}, id="another-capture-moment"),
        pytest.param({"installationId": "00000000-0000-4000-8000-000000000009"}, id="another-installation"),
        pytest.param({"harness": "opencode"}, id="another-harness"),
    ],
)
def test_reject_a_conflicting_capability_snapshot(changes: dict[str, Any]) -> None:
    world = initialized_world()
    record_snapshot(world.runtime, VECTOR_DOCUMENT)
    conflicting = snapshot_document(**changes)
    assert conflicting["snapshotId"] == VECTOR_DOCUMENT["snapshotId"]
    assert conflicting["snapshotHash"] != VECTOR_HASH

    error = refused_recording(world, conflicting)

    assert (error.code, error.exit_code, error.field, error.retryable) == (
        "ferret.event.idempotency-conflict",
        2,
        None,
        False,
    )
    assert VECTOR_HASH not in str(error)
    assert [held.snapshot_hash for held in world.capabilities.stored] == [VECTOR_HASH]


def test_a_snapshot_is_validated_before_storage_is_touched() -> None:
    world = make_world()

    error = refused_recording(world, replaced(harness="Codex"))

    assert (error.code, error.field) == ("ferret.event.invalid", "harness")
    assert world.files.touched == []
    assert world.capabilities.stored == []


def test_a_valid_snapshot_needs_an_initialized_store() -> None:
    world = make_world()

    error = refused_recording(world, VECTOR_DOCUMENT)

    assert error.code == "ferret.storage.uninitialized"
    assert world.capabilities.stored == []


def test_no_snapshot_is_held_for_a_harness_that_never_reported() -> None:
    world = initialized_world()
    record_snapshot(world.runtime, VECTOR_DOCUMENT)

    assert world.capabilities.latest_snapshot("claude_code", now=world.clock.now()) is None


CAPABILITY_OF = {
    "agent": "agent_lifecycle",
    "skill": "skill_invocation",
    "tool": "tool_lifecycle",
    "outcome": "outcome",
    "duration": "duration",
}


@pytest.mark.parametrize("state", ["observed", "derived", "unknown"])
@pytest.mark.parametrize("dimension", CAPABILITY_OF)
def test_a_dimension_is_as_visible_as_its_capability_says(dimension: str, state: str) -> None:
    source = "unavailable" if state == "unknown" else "official_hook"
    snapshot = snapshot_from_document(
        snapshot_document(capabilities=[capability(CAPABILITY_OF[dimension], state, source)]), now=NOW
    )

    assert dimension_visibility(snapshot, dimension) == state


@pytest.mark.parametrize("dimension", CAPABILITY_OF)
def test_a_dimension_whose_capability_the_snapshot_omits_is_unknown(dimension: str) -> None:
    snapshot = snapshot_from_document(snapshot_document(capabilities=[capability("session_lifecycle")]), now=NOW)

    assert dimension_visibility(snapshot, dimension) == "unknown"


@pytest.mark.parametrize("dimension", CAPABILITY_OF)
def test_a_harness_that_never_reported_has_no_visible_dimension(dimension: str) -> None:
    assert dimension_visibility(None, dimension) == "unknown"


@pytest.mark.parametrize("dimension", ["harness", "event_type", "subject_visibility", "outcome_visibility"])
def test_a_dimension_every_event_states_is_observed_without_a_capability(dimension: str) -> None:
    assert dimension_visibility(None, dimension) == "observed"
    assert dimension_visibility(vector_snapshot(), dimension) == "observed"


@pytest.mark.parametrize(
    ("state", "recorded", "expected"),
    [
        pytest.param("observed", 0, DimensionReport("skill", "observed", 0), id="observed-zero-is-a-fact"),
        pytest.param("derived", 0, DimensionReport("skill", "derived", 0), id="derived-zero-is-a-fact"),
        pytest.param("observed", 4, DimensionReport("skill", "observed", 4), id="observed-count"),
        pytest.param("unknown", 0, DimensionReport("skill", "unknown", None), id="unknown-zero-is-not-zero"),
        pytest.param("unknown", 3, DimensionReport("skill", "unknown", 3), id="recorded-events-are-never-hidden"),
    ],
)
def test_a_zero_count_is_a_fact_only_where_the_dimension_is_visible(
    state: str, recorded: int, expected: DimensionReport
) -> None:
    source = "unavailable" if state == "unknown" else "official_hook"
    snapshot = snapshot_from_document(
        snapshot_document(capabilities=[capability("skill_invocation", state, source)]), now=NOW
    )

    assert report_dimension(snapshot, "skill", recorded=recorded) == expected


def test_a_harness_with_no_snapshot_reports_unknown_rather_than_zero() -> None:
    assert report_dimension(None, "skill", recorded=0) == DimensionReport("skill", "unknown", None)
