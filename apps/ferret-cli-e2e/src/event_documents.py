"""Canonical event documents for the E2E adapter, sealed by a hash implementation independent of the artifact."""

import hashlib
import json
from datetime import UTC, datetime, timedelta
from typing import Any

HASHED_ORDER = (
    "schemaVersion",
    "eventId",
    "occurredAt",
    "capturedAt",
    "harness",
    "harnessVersion",
    "installationId",
    "workspaceId",
    "sessionId",
    "parentSessionId",
    "eventType",
    "agentName",
    "skillName",
    "toolName",
    "outcome",
    "durationMs",
    "subjectVisibility",
    "outcomeVisibility",
    "durationVisibility",
)
VECTOR_HASH = "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c"
VECTOR_FIELDS: dict[str, Any] = {
    "schemaVersion": "1.0",
    "eventId": "00000000-0000-4000-8000-000000000001",
    "occurredAt": "2026-09-18T08:15:30.123Z",
    "capturedAt": "2026-09-18T08:15:30.130Z",
    "harness": "claude_code",
    "harnessVersion": "1.0.123",
    "installationId": "00000000-0000-4000-8000-000000000002",
    "workspaceId": "ws_327b250d010590da40f0f76d18da910a",
    "sessionId": "ss_d0de260ca18a8379984031556b2d43ac",
    "parentSessionId": None,
    "eventType": "tool.completed",
    "agentName": None,
    "skillName": None,
    "toolName": "Read",
    "outcome": "success",
    "durationMs": 27,
    "subjectVisibility": "observed",
    "outcomeVisibility": "observed",
    "durationVisibility": "observed",
}


def sealed_event(**overrides: Any) -> dict[str, Any]:
    """The fixed vector with fields replaced, in document order with a hash computed over the hashed fields."""
    fields = {**VECTOR_FIELDS, **overrides}
    hashed = json.dumps({name: fields[name] for name in HASHED_ORDER}, separators=(",", ":"), ensure_ascii=False)
    digest = hashlib.sha256(hashed.encode("utf-8")).hexdigest()
    return {"schemaVersion": fields["schemaVersion"], "eventId": fields["eventId"], "eventHash": digest} | {
        name: fields[name] for name in HASHED_ORDER[2:]
    }


def encode_document(document: dict[str, Any]) -> bytes:
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def stamp(moment: datetime) -> str:
    """The canonical millisecond spelling of an aware UTC ``moment``."""
    return f"{moment:%Y-%m-%dT%H:%M:%S}.{moment.microsecond // 1000:03d}Z"


def now_stamp() -> str:
    """The current UTC moment in the canonical millisecond spelling."""
    return stamp(datetime.now(UTC))


def numbered_event(number: int, *, now: datetime, ago: timedelta = timedelta(0), **overrides: Any) -> dict[str, Any]:
    """A sealed event that occurred, and was captured, ``ago`` before ``now``, with an ID derived from ``number``."""
    moment = stamp(now - ago)
    return sealed_event(
        eventId=f"00000000-0000-4000-8000-{number:012d}", occurredAt=moment, capturedAt=moment, **overrides
    )
