"""The canonical Event: its closed schema, per-field and cross-field invariants, and the fixed-order SHA-256 hash."""

import hashlib
import hmac
import re
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Final, NamedTuple

from ferret.domain import fields
from ferret.domain.canonical import canonical_bytes
from ferret.domain.errors import FerretError
from ferret.domain.storage import RETENTION_DAYS
from ferret.domain.timestamps import add_days, format_timestamp, parse_timestamp

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
    def expires_at(self) -> str:
        """The logical retention boundary: thirty days after the event was captured."""
        return format_timestamp(add_days(parse_timestamp(self.captured_at), RETENTION_DAYS))


def canonical_event_bytes(event: Event) -> bytes:
    """The bytes the hash covers: every property except the hash, in the fixed order, compact and unescaped."""
    return canonical_bytes({name: value for name, value in event.to_document().items() if name != "eventHash"})


def event_hash(event: Event) -> str:
    """SHA-256 of the canonical bytes as 64 lowercase hexadecimal characters."""
    return hashlib.sha256(canonical_event_bytes(event)).hexdigest()


def _schema_version(value: object) -> str:
    if value != EVENT_SCHEMA_VERSION:
        raise fields.invalid("schemaVersion")
    return EVENT_SCHEMA_VERSION


def _name(value: object, field: str, *, logical: bool) -> str | None:
    """An optional bounded identifier: see ``fields.is_name`` for what one is."""
    if value is None:
        return None
    text = fields.text(value, field)
    if not fields.is_name(text, logical=logical):
        raise fields.invalid(field)
    return text


def _duration(value: object) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= MAX_DURATION_MS:
        raise fields.invalid("durationMs")
    return value


def _check_subject(values: Mapping[str, Any], shape: _Shape) -> None:
    for name in _NAME_FIELDS:
        if values[name] is not None and name != shape.subject:
            raise fields.invalid(name)
    visibility = values["subjectVisibility"]
    if shape.subject is None:
        if visibility != "not_applicable":
            raise fields.invalid("subjectVisibility")
        return
    named = values[shape.subject] is not None
    if visibility in KNOWN_VISIBILITIES:
        if not named:
            raise fields.invalid("subjectVisibility")
    elif visibility != "unknown" or named:
        raise fields.invalid("subjectVisibility")


def _check_outcome(values: Mapping[str, Any], shape: _Shape) -> None:
    outcome, visibility = values["outcome"], values["outcomeVisibility"]
    if shape.outcome is None:
        if outcome != "not_applicable":
            raise fields.invalid("outcome")
        if visibility != "not_applicable":
            raise fields.invalid("outcomeVisibility")
    elif visibility in KNOWN_VISIBILITIES:
        allowed = TERMINAL_OUTCOMES if shape.outcome == "terminal" else {shape.outcome}
        if outcome not in allowed:
            raise fields.invalid("outcome")
    elif visibility == "unknown" and shape.outcome == "terminal":
        if outcome != "unknown":
            raise fields.invalid("outcome")
    else:
        raise fields.invalid("outcomeVisibility")


def _check_duration(values: Mapping[str, Any], shape: _Shape) -> None:
    duration, visibility = values["durationMs"], values["durationVisibility"]
    if not shape.duration:
        if duration is not None:
            raise fields.invalid("durationMs")
        if visibility != "not_applicable":
            raise fields.invalid("durationVisibility")
    elif visibility in KNOWN_VISIBILITIES:
        if duration is None:
            raise fields.invalid("durationMs")
    elif visibility != "unknown" or duration is not None:
        raise fields.invalid("durationMs" if visibility == "unknown" else "durationVisibility")


def event_from_document(document: Mapping[str, Any], *, now: datetime) -> Event:
    """Validate one decoded JSON object into an Event, or raise ``invalid_event`` naming at most one schema field.

    The object must carry exactly the contract's properties. Each is checked in document order, then the
    event-type invariants, and last the declared hash against the one recomputed from the normalized fields.
    """
    if any(key not in _PROPERTIES for key in document):
        raise FerretError("invalid_event")
    for name, _ in DOCUMENT_FIELDS:
        if name not in document:
            raise fields.invalid(name)
    values: dict[str, Any] = {
        "schemaVersion": _schema_version(document["schemaVersion"]),
        "eventId": fields.matching(document["eventId"], "eventId", fields.UUID_V4),
        "eventHash": fields.matching(document["eventHash"], "eventHash", fields.HASH),
        "occurredAt": fields.timestamp(document["occurredAt"], "occurredAt", now),
        "capturedAt": fields.timestamp(document["capturedAt"], "capturedAt", now),
        "harness": fields.matching(document["harness"], "harness", fields.HARNESS),
        "harnessVersion": fields.optional(document["harnessVersion"], "harnessVersion", fields.HARNESS_VERSION),
        "installationId": fields.matching(document["installationId"], "installationId", fields.UUID_V4),
        "workspaceId": fields.matching(document["workspaceId"], "workspaceId", fields.WORKSPACE_ID),
        "sessionId": fields.matching(document["sessionId"], "sessionId", _SESSION_ID),
        "parentSessionId": fields.optional(document["parentSessionId"], "parentSessionId", _SESSION_ID),
        "eventType": fields.member(document["eventType"], "eventType", EVENT_TYPES),
        "agentName": _name(document["agentName"], "agentName", logical=False),
        "skillName": _name(document["skillName"], "skillName", logical=False),
        "toolName": _name(document["toolName"], "toolName", logical=True),
        "outcome": fields.member(document["outcome"], "outcome", OUTCOMES),
        "durationMs": _duration(document["durationMs"]),
        "subjectVisibility": fields.member(document["subjectVisibility"], "subjectVisibility", VISIBILITIES),
        "outcomeVisibility": fields.member(document["outcomeVisibility"], "outcomeVisibility", VISIBILITIES),
        "durationVisibility": fields.member(document["durationVisibility"], "durationVisibility", VISIBILITIES),
    }
    shape = _SHAPES[values["eventType"]]
    _check_subject(values, shape)
    _check_outcome(values, shape)
    _check_duration(values, shape)
    event = Event(**{attribute: values[name] for name, attribute in DOCUMENT_FIELDS})
    if not hmac.compare_digest(event_hash(event), event.event_hash):
        raise fields.invalid("eventHash")
    return event
