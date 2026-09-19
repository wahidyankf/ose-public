---
description: How the AI checker consumes the deterministic preflight's JSON envelope, skips redundant work, and degrades gracefully when the preflight is unavailable.
when_to_use: Use when wiring or debugging how the AI checker consumes the deterministic preflight's output.
---

# Handoff to the AI Checker

The repository rules quality gate workflow invokes the deterministic preflight first, captures the JSON envelope, and passes the path to the AI checker as a `preflight-report` argument. The AI checker then:

1. Reads the JSON.
2. Validates the schema field equals `Rhino/repo-governance-audit/v1`.
3. Populates a skip-set: each preflight-covered category is mapped to the validation step (or sub-step) it covers; the AI checker SKIPS those sub-portions of Steps 1-8.
4. Embeds preflight findings verbatim in the final audit under a `## Deterministic Findings (Rhino preflight)` section, placed before `## AI-Only Findings`.
5. On re-validation iterations: computes SHA-256 of the preflight JSON. If unchanged from the prior iteration, reuses the deterministic findings section unchanged and only re-evaluates AI-only categories.

If the preflight is unavailable (missing argument, missing file, schema mismatch), the AI checker logs a `[WARN]` and falls back to evaluating all categories in full — the system degrades gracefully.
