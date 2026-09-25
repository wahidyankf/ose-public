---
description: How the governance gate splits a read-only checker sweep from root-owned repair, and when the checker delegates web research.
when_to_use: Use when running the plan quality gate, to decide what the subagent does and what the root must keep.
---

# Execution and Delegation

## The split

The audit sweep is delegated; the repair is not.

1. The root invokes [`plan-checker`](../../../../.agents/agents/plan-checker.md) through the
   Agent tool. The checker reads the plan, its assets, the relevant implementation, specifications,
   and governance, and returns the frozen ledger. It never edits a file.
2. The root freezes that ledger, writes it to `local-tmp/plan/`, and performs the repairs itself.
   There is no separate fixer agent: repair moved to the root when this workflow became a governance gate, because a
   single bounded repair pass over plan documents has no fan-out to isolate.
3. The root owns every user interaction. A decision the checker cannot settle returns as a
   `## User Decisions Required` envelope and is resolved through root-owned
   [grilling](../../../development/workflow/grilling-with-options.md) before repair resumes.

Delegation exists for context isolation, not parallelism: a governance sweep reads far more than a
root thread should hold. Where the Agent tool is unavailable, the root performs the sweep directly
under the same read-then-freeze discipline.

## Web research

`plan-checker` delegates multi-page web research to
[`web-researcher`](../../../../.agents/agents/web-researcher.md) when verifying one technical
claim needs more than two searches or more than two fetches. It keeps in-context `WebSearch` and
`WebFetch` for single-shot verification against a known authoritative URL. The delegation is
encoded in the checker's prompt and needs no workflow configuration.

## Related Documents

- [Plan Quality Gate](../plan-quality-gate.md) — the bounded procedure this serves.
- [Audit Checklist](./audit-checklist.md) — what the sweep covers.
