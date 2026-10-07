"""The canonical Event: its closed schema, per-field and cross-field invariants, and the fixed-order SHA-256 hash."""

import hashlib
import re
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final, NamedTuple

from typekit import Err, Ok

from ferret.domain import fields
from ferret.domain.canonical import canonical_bytes
from ferret.domain.errors import FerretError, FerretResult, as_internal_failure
from ferret.domain.retention import expiry_of

EVENT_SCHEMA_VERSION: Final = "1.0"
MAX_DURATION_MS: Final = 86_400_000

EVENT_TYPES: Final = frozenset(
    {
        "session.started",
        "session.ended",
        "agent.started",
        "agent.ended",
        "skill.invoked",
        "tool.started",
        "tool.completed",
        "tool.failed",
    }
)
OUTCOMES: Final = frozenset({"success", "failure", "cancelled", "unknown", "not_applicable"})
TERMINAL_OUTCOMES: Final = frozenset({"success", "failure", "cancelled"})
VISIBILITIES: Final = frozenset({"observed", "derived", "unknown", "not_applicable"})
KNOWN_VISIBILITIES: Final = frozenset({"observed", "derived"})

# (document property, Event attribute) in the normative document order, with the hash second.
DOCUMENT_FIELDS: Final = (
    ("schemaVersion", "schema_version"),
    ("eventId", "event_id"),
    ("eventHash", "event_hash"),
    ("occurredAt", "occurred_at"),
    ("capturedAt", "captured_at"),
    ("harness", "harness"),
    ("harnessVersion", "harness_version"),
    ("installationId", "installation_id"),
    ("workspaceId", "workspace_id"),
    ("sessionId", "session_id"),
    ("parentSessionId", "parent_session_id"),
    ("eventType", "event_type"),
    ("agentName", "agent_name"),
    ("skillName", "skill_name"),
    ("toolName", "tool_name"),
    ("outcome", "outcome"),
    ("durationMs", "duration_ms"),
    ("subjectVisibility", "subject_visibility"),
    ("outcomeVisibility", "outcome_visibility"),
    ("durationVisibility", "duration_visibility"),
)
_PROPERTIES: Final = frozenset(name for name, _ in DOCUMENT_FIELDS)
_NAME_FIELDS: Final = ("agentName", "skillName", "toolName")

_SESSION_ID = re.compile(r"ss_[0-9a-f]{32}")


class _Shape(NamedTuple):
    """What one event type carries: its only subject field, its outcome rule, and whether it may report a duration."""

    subject: str | None
    outcome: str | None
    duration: bool


_SHAPES: Final[Mapping[str, _Shape]] = {
    "session.started": _Shape(None, None, False),
    "session.ended": _Shape(None, "terminal", True),
    "agent.started": _Shape("agentName", None, False),
    "agent.ended": _Shape("agentName", "terminal", True),
    "skill.invoked": _Shape("skillName", None, False),
    "tool.started": _Shape("toolName", None, False),
    "tool.completed": _Shape("toolName", "success", True),
    "tool.failed": _Shape("toolName", "failure", True),
}


@dataclass(frozen=True, slots=True)
class Event:
    """One lifecycle fact: metadata only, with opaque identifiers and a per-field provenance for what it reports."""

    schema_version: str
    event_id: str
    event_hash: str
    occurred_at: str
    captured_at: str
    harness: str
    harness_version: str | None
    installation_id: str
    workspace_id: str
    session_id: str
    parent_session_id: str | None
    event_type: str
    agent_name: str | None
    skill_name: str | None
    tool_name: str | None
    outcome: str
    duration_ms: int | None
    subject_visibility: str
    outcome_visibility: str
    duration_visibility: str

    def to_document(self) -> dict[str, Any]:
        """The Event as its JSON object, in the normative property order."""
        return {name: getattr(self, attribute) for name, attribute in DOCUMENT_FIELDS}

    @property
    def expires_at(self) -> FerretResult[str]:
        """The logical retention boundary: thirty days after the event was captured."""
        return expiry_of(self.captured_at)


def canonical_event_bytes(event: Event) -> FerretResult[bytes]:
    """The bytes the hash covers: every property except the hash, in the fixed order, compact and unescaped.

    A float among the typed fields is a defect no input reaches, so it is an internal failure.
    """
    hashed = {name: value for name, value in event.to_document().items() if name != "eventHash"}
    return canonical_bytes(hashed).map_err(as_internal_failure)


def event_hash(event: Event) -> FerretResult[str]:
    """SHA-256 of the canonical bytes as 64 lowercase hexadecimal characters."""
    return canonical_event_bytes(event).map(lambda document: hashlib.sha256(document).hexdigest())


def _schema_version(value: object) -> FerretResult[str]:
    return Ok(EVENT_SCHEMA_VERSION) if value == EVENT_SCHEMA_VERSION else Err(fields.invalid("schemaVersion"))


def _name(value: object, field: str, *, logical: bool) -> FerretResult[str | None]:
    """An optional bounded identifier: see ``fields.is_name`` for what one is."""
    if value is None:
        return Ok(None)
    return fields.text(value, field).flat_map(
        lambda text: Ok(text) if fields.is_name(text, logical=logical) else Err(fields.invalid(field))
    )


def _duration(value: object) -> FerretResult[int | None]:
    if value is None:
        return Ok(None)
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= MAX_DURATION_MS:
        return Err(fields.invalid("durationMs"))
    return Ok(value)


def _check_subject(values: Mapping[str, Any], shape: _Shape) -> FerretResult[None]:
    for name in _NAME_FIELDS:
        if values[name] is not None and name != shape.subject:
            return Err(fields.invalid(name))
    visibility = values["subjectVisibility"]
    if shape.subject is None:
        if visibility != "not_applicable":
            return Err(fields.invalid("subjectVisibility"))
        return Ok(None)
    named = values[shape.subject] is not None
    if visibility in KNOWN_VISIBILITIES:
        if not named:
            return Err(fields.invalid("subjectVisibility"))
    elif visibility != "unknown" or named:
        return Err(fields.invalid("subjectVisibility"))
    return Ok(None)


def _check_outcome(values: Mapping[str, Any], shape: _Shape) -> FerretResult[None]:
    outcome, visibility = values["outcome"], values["outcomeVisibility"]
    if shape.outcome is None:
        if outcome != "not_applicable":
            return Err(fields.invalid("outcome"))
        if visibility != "not_applicable":
            return Err(fields.invalid("outcomeVisibility"))
    elif visibility in KNOWN_VISIBILITIES:
        allowed = TERMINAL_OUTCOMES if shape.outcome == "terminal" else {shape.outcome}
        if outcome not in allowed:
            return Err(fields.invalid("outcome"))
    elif visibility == "unknown" and (
        shape.outcome == "terminal" or (shape.outcome == "success" and outcome == "unknown")
    ):
        if outcome != "unknown":
            return Err(fields.invalid("outcome"))
    else:
        return Err(fields.invalid("outcomeVisibility"))
    return Ok(None)


def _check_duration(values: Mapping[str, Any], shape: _Shape) -> FerretResult[None]:
    duration, visibility = values["durationMs"], values["durationVisibility"]
    if not shape.duration:
        if duration is not None:
            return Err(fields.invalid("durationMs"))
        if visibility != "not_applicable":
            return Err(fields.invalid("durationVisibility"))
    elif visibility in KNOWN_VISIBILITIES:
        if duration is None:
            return Err(fields.invalid("durationMs"))
    elif visibility != "unknown" or duration is not None:
        return Err(fields.invalid("durationMs" if visibility == "unknown" else "durationVisibility"))
    return Ok(None)


def _checks(now: datetime) -> tuple[tuple[str, fields.Check], ...]:
    """One check per property, in document order: each reads the property's raw value and returns its normalized one."""
    return (
        ("schemaVersion", _schema_version),
        ("eventId", lambda value: fields.matching(value, "eventId", fields.UUID_V4)),
        ("eventHash", lambda value: fields.matching(value, "eventHash", fields.HASH)),
        ("occurredAt", lambda value: fields.timestamp(value, "occurredAt", now)),
        ("capturedAt", lambda value: fields.timestamp(value, "capturedAt", now)),
        ("harness", lambda value: fields.matching(value, "harness", fields.HARNESS)),
        ("harnessVersion", lambda value: fields.optional(value, "harnessVersion", fields.HARNESS_VERSION)),
        ("installationId", lambda value: fields.matching(value, "installationId", fields.UUID_V4)),
        ("workspaceId", lambda value: fields.matching(value, "workspaceId", fields.WORKSPACE_ID)),
        ("sessionId", lambda value: fields.matching(value, "sessionId", _SESSION_ID)),
        ("parentSessionId", lambda value: fields.optional(value, "parentSessionId", _SESSION_ID)),
        ("eventType", lambda value: fields.member(value, "eventType", EVENT_TYPES)),
        ("agentName", lambda value: _name(value, "agentName", logical=False)),
        ("skillName", lambda value: _name(value, "skillName", logical=False)),
        ("toolName", lambda value: _name(value, "toolName", logical=True)),
        ("outcome", lambda value: fields.member(value, "outcome", OUTCOMES)),
        ("durationMs", _duration),
        ("subjectVisibility", lambda value: fields.member(value, "subjectVisibility", VISIBILITIES)),
        ("outcomeVisibility", lambda value: fields.member(value, "outcomeVisibility", VISIBILITIES)),
        ("durationVisibility", lambda value: fields.member(value, "durationVisibility", VISIBILITIES)),
    )


def _shaped(values: Mapping[str, Any]) -> FerretResult[Event]:
    """The Event of normalized properties, provided they obey the invariants of its event type."""
    shape = _SHAPES[values["eventType"]]
    return (
        _check_subject(values, shape)
        .flat_map(lambda _: _check_outcome(values, shape))
        .flat_map(lambda _: _check_duration(values, shape))
        .map(lambda _: Event(**{attribute: values[name] for name, attribute in DOCUMENT_FIELDS}))
    )


def event_from_document(document: Mapping[str, Any], *, now: datetime) -> FerretResult[Event]:
    """Validate one decoded JSON object into an Event, or an ``Err`` of ``invalid_event`` naming at most one field.

    The object must carry exactly the contract's properties. Each is checked in document order, then the
    event-type invariants, and last the declared hash against the one recomputed from the normalized fields.
    """
    if any(key not in _PROPERTIES for key in document):
        return Err(FerretError("ferret.event.invalid"))
    for name, _ in DOCUMENT_FIELDS:
        if name not in document:
            return Err(fields.invalid(name))
    return (
        fields.checked_values(document, _checks(now))
        .flat_map(_shaped)
        .flat_map(lambda event: fields.sealed(event, event_hash(event), event.event_hash, "eventHash"))
    )
