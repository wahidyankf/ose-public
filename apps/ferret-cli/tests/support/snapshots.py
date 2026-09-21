"""Capability snapshot documents for tests, with an independent hash oracle so no test trusts the code it checks."""

import hashlib
import json
from typing import Any

HASHED_ORDER = (
    "schemaVersion",
    "snapshotId",
    "capturedAt",
    "harness",
    "harnessVersion",
    "installationId",
    "capabilities",
)
DOCUMENT_ORDER = (*HASHED_ORDER[:2], "snapshotHash", *HASHED_ORDER[2:])

VECTOR_HASH = "6d3ccc88afa715385e7b04aa0056e1455ae679906354d18bc5d0113c474a6590"
VECTOR_BYTES = (
    b'{"schemaVersion":"1.0","snapshotId":"00000000-0000-4000-8000-000000000004",'
    b'"capturedAt":"2026-09-18T08:00:00.000Z","harness":"codex","harnessVersion":"1.2.3",'
    b'"installationId":"00000000-0000-4000-8000-000000000002",'
    b'"capabilities":[{"name":"session_lifecycle","state":"observed","source":"official_hook"},'
    b'{"name":"skill_invocation","state":"unknown","source":"unavailable"}]}'
)
VECTOR_DOCUMENT: dict[str, Any] = {
    "schemaVersion": "1.0",
    "snapshotId": "00000000-0000-4000-8000-000000000004",
    "snapshotHash": VECTOR_HASH,
    "capturedAt": "2026-09-18T08:00:00.000Z",
    "harness": "codex",
    "harnessVersion": "1.2.3",
    "installationId": "00000000-0000-4000-8000-000000000002",
    "capabilities": [
        {"name": "session_lifecycle", "state": "observed", "source": "official_hook"},
        {"name": "skill_invocation", "state": "unknown", "source": "unavailable"},
    ],
}


def capability(name: str, state: str = "observed", source: str = "official_hook") -> dict[str, str]:
    return {"name": name, "state": state, "source": source}


def oracle_bytes(document: dict[str, Any]) -> bytes:
    """The hashed bytes of ``document``: fixed property order, no hash, compact, unescaped Unicode."""
    ordered = {name: document[name] for name in HASHED_ORDER}
    return json.dumps(ordered, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sealed(document: dict[str, Any]) -> dict[str, Any]:
    """A copy of ``document`` in canonical property order whose ``snapshotHash`` matches its other fields."""
    digest = hashlib.sha256(oracle_bytes(document)).hexdigest()
    return {name: (digest if name == "snapshotHash" else document[name]) for name in DOCUMENT_ORDER}


def snapshot_document(**overrides: Any) -> dict[str, Any]:
    """The fixed vector with fields replaced and the hash recomputed, so it stays a valid canonical snapshot."""
    return sealed({**VECTOR_DOCUMENT, **overrides})


def encode(document: dict[str, Any]) -> bytes:
    return json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
