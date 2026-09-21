"""Canonical event documents for tests, with an independent hash oracle so a test never trusts the code it checks."""

import hashlib
import json
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
DOCUMENT_ORDER = (*HASHED_ORDER[:2], "eventHash", *HASHED_ORDER[2:])

VECTOR_HASH = "199aa6c2a595c64fe8603f860e4480d71a7888cd4f54c49c5f4fbc79fb060a3c"
VECTOR_BYTES = (
    b'{"schemaVersion":"1.0","eventId":"00000000-0000-4000-8000-000000000001",'
    b'"occurredAt":"2026-09-18T08:15:30.123Z","capturedAt":"2026-09-18T08:15:30.130Z",'
    b'"harness":"claude_code","harnessVersion":"1.0.123",'
    b'"installationId":"00000000-0000-4000-8000-000000000002",'
    b'"workspaceId":"ws_327b250d010590da40f0f76d18da910a",'
    b'"sessionId":"ss_d0de260ca18a8379984031556b2d43ac","parentSessionId":null,'
    b'"eventType":"tool.completed","agentName":null,"skillName":null,"toolName":"Read",'
    b'"outcome":"success","durationMs":27,"subjectVisibility":"observed",'
    b'"outcomeVisibility":"observed","durationVisibility":"observed"}'
)
VECTOR_DOCUMENT: dict[str, Any] = {
    "schemaVersion": "1.0",
    "eventId": "00000000-0000-4000-8000-000000000001",
    "eventHash": VECTOR_HASH,
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


def oracle_bytes(document: dict[str, Any]) -> bytes:
    """The hashed bytes of ``document``: fixed property order, no hash, compact, unescaped Unicode."""
    ordered = {name: document[name] for name in HASHED_ORDER}
    return json.dumps(ordered, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sealed(document: dict[str, Any]) -> dict[str, Any]:
    """A copy of ``document`` in canonical property order whose ``eventHash`` matches its other fields."""
    digest = hashlib.sha256(oracle_bytes(document)).hexdigest()
    return {name: (digest if name == "eventHash" else document[name]) for name in DOCUMENT_ORDER}


def event_document(**overrides: Any) -> dict[str, Any]:
    """The fixed vector with fields replaced and the hash recomputed, so it stays a valid canonical event."""
    return sealed({**VECTOR_DOCUMENT, **overrides})


def encode(document: dict[str, Any]) -> bytes:
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
