"""The capability snapshot: what one harness version can be observed to report, immutable once it is written.

A snapshot is producer-owned: its ID is its only identity, its hash covers every other field in a fixed order, and a
changed assessment is a new snapshot rather than an edit. Nothing here infers a capability; a capability the harness
does not expose is recorded as ``unknown``, which is never the same as zero usage.
"""

import hashlib
import hmac
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final, cast

from ferret.domain import fields
from ferret.domain.canonical import canonical_bytes
from ferret.domain.storage import RETENTION_DAYS
from ferret.domain.timestamps import add_days, format_timestamp, parse_timestamp

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
    def expires_at(self) -> str:
        """The logical retention boundary: thirty days after the snapshot was captured."""
        return format_timestamp(add_days(parse_timestamp(self.captured_at), RETENTION_DAYS))


def canonical_snapshot_bytes(snapshot: CapabilitySnapshot) -> bytes:
    """The bytes the hash covers: every property except the hash, in the fixed order, compact and unescaped."""
    return canonical_bytes({name: value for name, value in snapshot.to_document().items() if name != "snapshotHash"})


def snapshot_hash(snapshot: CapabilitySnapshot) -> str:
    """SHA-256 of the canonical bytes as 64 lowercase hexadecimal characters."""
    return hashlib.sha256(canonical_snapshot_bytes(snapshot)).hexdigest()


def _schema_version(value: object) -> str:
    if value != CAPABILITY_SCHEMA_VERSION:
        raise fields.invalid("schemaVersion")
    return CAPABILITY_SCHEMA_VERSION


def _capability(value: object) -> Capability:
    """One item: exactly a name, a state, and a source from the closed sets, with an honest pairing.

    A capability is ``unknown`` exactly when its source is ``unavailable``: a state of ``observed`` or ``derived``
    needs the official hook or plugin that supplies it, and an unavailable source can support no claim.
    """
    if not isinstance(value, dict):
        raise fields.invalid("capabilities")
    item = cast(dict[str, Any], value)
    if frozenset(item) != _ITEM_PROPERTIES:
        raise fields.invalid("capabilities")
    name = fields.member(item["name"], "capabilities", CAPABILITY_NAMES)
    state = fields.member(item["state"], "capabilities", CAPABILITY_STATES)
    source = fields.member(item["source"], "capabilities", CAPABILITY_SOURCES)
    if (state == "unknown") != (source == "unavailable"):
        raise fields.invalid("capabilities")
    return Capability(name, state, source)


def _capabilities(value: object) -> tuple[Capability, ...]:
    """The items of one snapshot, which must be sorted by name with no name repeated."""
    if not isinstance(value, list):
        raise fields.invalid("capabilities")
    items = tuple(_capability(item) for item in cast(list[Any], value))
    names = [item.name for item in items]
    if names != sorted(set(names)):
        raise fields.invalid("capabilities")
    return items


def snapshot_from_document(document: Mapping[str, Any], *, now: datetime) -> CapabilitySnapshot:
    """Validate one decoded JSON object into a snapshot, or raise ``invalid_event`` naming at most one schema field.

    The object must carry exactly the contract's properties. Each is checked in document order, and last the
    declared hash against the one recomputed from the normalized fields.
    """
    if any(key not in _PROPERTIES for key in document):
        raise fields.invalid(None)
    for name, _ in DOCUMENT_FIELDS:
        if name not in document:
            raise fields.invalid(name)
    values: dict[str, Any] = {
        "schemaVersion": _schema_version(document["schemaVersion"]),
        "snapshotId": fields.matching(document["snapshotId"], "snapshotId", fields.UUID_V4),
        "snapshotHash": fields.matching(document["snapshotHash"], "snapshotHash", fields.HASH),
        "capturedAt": fields.timestamp(document["capturedAt"], "capturedAt", now),
        "harness": fields.matching(document["harness"], "harness", fields.HARNESS),
        "harnessVersion": fields.optional(document["harnessVersion"], "harnessVersion", fields.HARNESS_VERSION),
        "installationId": fields.matching(document["installationId"], "installationId", fields.UUID_V4),
        "capabilities": _capabilities(document["capabilities"]),
    }
    snapshot = CapabilitySnapshot(**{attribute: values[name] for name, attribute in DOCUMENT_FIELDS})
    if not hmac.compare_digest(snapshot_hash(snapshot), snapshot.snapshot_hash):
        raise fields.invalid("snapshotHash")
    return snapshot
