"""The capability snapshot: what one harness version can be observed to report, immutable once it is written.

A snapshot is producer-owned: its ID is its only identity, its hash covers every other field in a fixed order, and a
changed assessment is a new snapshot rather than an edit. Nothing here infers a capability; a capability the harness
does not expose is recorded as ``unknown``, which is never the same as zero usage.
"""

import hashlib
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final, cast

from typekit import Err, Ok

from ferret.domain import fields
from ferret.domain.canonical import canonical_bytes
from ferret.domain.errors import FerretResult, as_internal_failure
from ferret.domain.retention import expiry_of

CAPABILITY_SCHEMA_VERSION: Final = "1.0"
CAPABILITY_NAMES: Final = frozenset(
    {
        "agent_lifecycle",
        "duration",
        "outcome",
        "session_lifecycle",
        "skill_invocation",
        "tool_lifecycle",
    }
)
CAPABILITY_STATES: Final = frozenset({"observed", "derived", "unknown"})
CAPABILITY_SOURCES: Final = frozenset({"official_hook", "official_plugin", "unavailable"})

# (document property, snapshot attribute) in the normative document order, with the hash third.
DOCUMENT_FIELDS: Final = (
    ("schemaVersion", "schema_version"),
    ("snapshotId", "snapshot_id"),
    ("snapshotHash", "snapshot_hash"),
    ("capturedAt", "captured_at"),
    ("harness", "harness"),
    ("harnessVersion", "harness_version"),
    ("installationId", "installation_id"),
    ("capabilities", "capabilities"),
)
_PROPERTIES: Final = frozenset(name for name, _ in DOCUMENT_FIELDS)
_ITEM_PROPERTIES: Final = frozenset({"name", "state", "source"})


@dataclass(frozen=True, slots=True)
class Capability:
    """One capability's assessment: whether it is seen, derived, or unknown, and the official signal behind it."""

    name: str
    state: str
    source: str

    def to_document(self) -> dict[str, str]:
        return {"name": self.name, "state": self.state, "source": self.source}


@dataclass(frozen=True, slots=True)
class CapabilitySnapshot:
    """One immutable assessment of a harness version, holding each capability at most once, sorted by name."""

    schema_version: str
    snapshot_id: str
    snapshot_hash: str
    captured_at: str
    harness: str
    harness_version: str | None
    installation_id: str
    capabilities: tuple[Capability, ...]

    def to_document(self) -> dict[str, Any]:
        """The snapshot as its JSON object, in the normative property order."""
        document: dict[str, Any] = {name: getattr(self, attribute) for name, attribute in DOCUMENT_FIELDS}
        document["capabilities"] = [item.to_document() for item in self.capabilities]
        return document

    @property
    def expires_at(self) -> FerretResult[str]:
        """The logical retention boundary: thirty days after the snapshot was captured."""
        return expiry_of(self.captured_at)


def canonical_snapshot_bytes(snapshot: CapabilitySnapshot) -> FerretResult[bytes]:
    """The bytes the hash covers: every property except the hash, in the fixed order, compact and unescaped.

    A float among the typed fields is a defect no input reaches, so it is an internal failure.
    """
    hashed = {name: value for name, value in snapshot.to_document().items() if name != "snapshotHash"}
    return canonical_bytes(hashed).map_err(as_internal_failure)


def snapshot_hash(snapshot: CapabilitySnapshot) -> FerretResult[str]:
    """SHA-256 of the canonical bytes as 64 lowercase hexadecimal characters."""
    return canonical_snapshot_bytes(snapshot).map(lambda document: hashlib.sha256(document).hexdigest())


def _schema_version(value: object) -> FerretResult[str]:
    return Ok(CAPABILITY_SCHEMA_VERSION) if value == CAPABILITY_SCHEMA_VERSION else Err(fields.invalid("schemaVersion"))


def _capability(value: object) -> FerretResult[Capability]:
    """One item: exactly a name, a state, and a source from the closed sets, with an honest pairing.

    A capability is ``unknown`` exactly when its source is ``unavailable``: a state of ``observed`` or ``derived``
    needs the official hook or plugin that supplies it, and an unavailable source can support no claim.
    """
    if not isinstance(value, dict):
        return Err(fields.invalid("capabilities"))
    item = cast(dict[str, Any], value)
    if frozenset(item) != _ITEM_PROPERTIES:
        return Err(fields.invalid("capabilities"))
    name = fields.member(item["name"], "capabilities", CAPABILITY_NAMES)
    if isinstance(name, Err):
        return name
    state = fields.member(item["state"], "capabilities", CAPABILITY_STATES)
    if isinstance(state, Err):
        return state
    source = fields.member(item["source"], "capabilities", CAPABILITY_SOURCES)
    if isinstance(source, Err):
        return source
    if (state.value == "unknown") != (source.value == "unavailable"):
        return Err(fields.invalid("capabilities"))
    return Ok(Capability(name.value, state.value, source.value))


def _capabilities(value: object) -> FerretResult[tuple[Capability, ...]]:
    """The items of one snapshot, which must be sorted by name with no name repeated."""
    if not isinstance(value, list):
        return Err(fields.invalid("capabilities"))
    items: list[Capability] = []
    for entry in cast(list[Any], value):
        item = _capability(entry)
        if isinstance(item, Err):
            return item
        items.append(item.value)
    names = [item.name for item in items]
    if names != sorted(set(names)):
        return Err(fields.invalid("capabilities"))
    return Ok(tuple(items))


def _checks(now: datetime) -> tuple[tuple[str, fields.Check], ...]:
    """One check per property, in document order: each reads the property's raw value and returns its normalized one."""
    return (
        ("schemaVersion", _schema_version),
        ("snapshotId", lambda value: fields.matching(value, "snapshotId", fields.UUID_V4)),
        ("snapshotHash", lambda value: fields.matching(value, "snapshotHash", fields.HASH)),
        ("capturedAt", lambda value: fields.timestamp(value, "capturedAt", now)),
        ("harness", lambda value: fields.matching(value, "harness", fields.HARNESS)),
        ("harnessVersion", lambda value: fields.optional(value, "harnessVersion", fields.HARNESS_VERSION)),
        ("installationId", lambda value: fields.matching(value, "installationId", fields.UUID_V4)),
        ("capabilities", _capabilities),
    )


def snapshot_from_document(document: Mapping[str, Any], *, now: datetime) -> FerretResult[CapabilitySnapshot]:
    """Validate one decoded JSON object into a snapshot, or an ``Err`` of ``invalid_event`` naming at most one field.

    The object must carry exactly the contract's properties. Each is checked in document order, and last the
    declared hash against the one recomputed from the normalized fields.
    """
    if any(key not in _PROPERTIES for key in document):
        return Err(fields.invalid(None))
    for name, _ in DOCUMENT_FIELDS:
        if name not in document:
            return Err(fields.invalid(name))
    return (
        fields.checked_values(document, _checks(now))
        .map(lambda values: CapabilitySnapshot(**{attribute: values[name] for name, attribute in DOCUMENT_FIELDS}))
        .flat_map(
            lambda snapshot: fields.sealed(snapshot, snapshot_hash(snapshot), snapshot.snapshot_hash, "snapshotHash")
        )
    )
