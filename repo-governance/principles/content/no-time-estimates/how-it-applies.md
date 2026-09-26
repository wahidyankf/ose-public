---
description: Pass/fail examples for plan documents and permitted examples for conversation, evidence, and documentation.
when_to_use: Use when writing or reviewing content for a time estimate.
---

# How It Applies

## Plan Documents (Banned)

**Context**: `README.md`, `brd.md`, `prd.md`, `tech-docs.md` or `tech-docs/`, and `delivery.md` at
every lifecycle stage, plus idea two-pagers and other plan-stage briefs.

FAIL: **Time-Based (Avoid)**:

```markdown
# Project Plan

Implementation estimate: 2-3 weeks

- Phase 1 — Database schema (2 days)
- Phase 2 — API endpoints (1 week)
- Target completion: 2026-10-15
```

**Why this fails**: The figures read as commitments, go stale before execution, and hold for no
particular executor.

PASS: **Dependency-Based (Correct)**:

```markdown
# Project Plan

- Phase 1 — Database schema. Gate: migrations apply and roll back cleanly.
- Phase 2 — API endpoints. Blocked by Phase 1. Gate: contract tests pass.
- Phase 3 — Frontend. Blocked by Phase 2; runs alongside Phase 2 documentation.
```

**Why this works**: Order, dependency, and gates stay true whoever executes the plan and however
long it takes.

## Outside Plan Documents (Permitted)

**Context**: Conversation, execution status updates, git-ignored scratch, a plan's `evidence/` and
`learnings.md`, tutorials, how-to guides, reference, and other documentation.

PASS: **Labelled Estimates (Correct)**:

```markdown
Status: Phase 2 of 4 complete. Estimate: the remaining phases need about two CI cycles.

Estimated time: 30-45 minutes, depending on your network speed.

Learning: Phase 3 took three review iterations instead of one; budget for that next time.
```

**Why this works**: The reader gets useful planning information, and the label keeps it from being
mistaken for a measurement or a promise.
