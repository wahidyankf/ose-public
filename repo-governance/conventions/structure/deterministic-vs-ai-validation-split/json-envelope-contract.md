---
description: The canonical JSON envelope shape, key order, and byte-determinism guarantees the deterministic preflight emits.
when_to_use: Use when producing or consuming the deterministic preflight's JSON output and you need the exact schema.
---

# JSON Envelope Contract

The deterministic preflight emits a JSON envelope with this canonical key order and shape:

```json
{
  "schema": "Rhino/repo-governance-audit/v1",
  "status": "ok | failed",
  "result": {
    "git_sha": "abc1234",
    "ran_at": "2026-05-12T12:00:00Z",
    "total_findings": 0,
    "by_severity": { "critical": 0, "high": 0, "medium": 0, "low": 0 },
    "by_category": { "layer-coherence": 0, "traceability-audit": 0 },
    "categories": [
      {
        "name": "<category-name>",
        "command": "<command line>",
        "passed": true,
        "findings": []
      }
    ],
    "skipped_false_positives": []
  }
}
```

**Properties guaranteed by the schema**:

- **Byte-determinism**: Same repo state + same `ran_at` → byte-identical JSON output (verified by a 10-run SHA-256 gate).
- **Canonical key order**: `schema → status → result → (git_sha → ran_at → total_findings → by_severity → by_category → categories → skipped_false_positives)`. Within each category: `name → command → passed → findings`. Within each finding: `key → severity → criticality → file → line → message`.
- **Stable finding keys**: Each finding has a stable composite key `<category>|<file>|<short-message-hash>` so the same finding produces the same key across runs — enabling skip-list matching for known false positives.
