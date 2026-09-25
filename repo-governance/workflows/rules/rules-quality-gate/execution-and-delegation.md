---
description: How the rules quality gate delegates its read-only sweep and why it has no fixer.
when_to_use: Use when running the rules quality gate, to decide what the subagent does and what the root must keep.
---

# Execution and Delegation

The root invokes [`rules-checker`](../../../../.agents/agents/rules-checker.md) through the
Agent tool. The checker reads the affected rule, its points of use, higher authority, and directly
overlapping guidance, and returns the frozen ledger. It never edits a file.

Delegation exists for context isolation. A repository-wide rule sweep reads far more governance
than a root thread should hold, which is why the checker survives here even though the upstream
model this gate adopts runs its equivalent in the main thread. Where the Agent tool is unavailable,
the root performs the sweep directly under the same read-then-freeze discipline.

There is no `rules-fixer`. It was retired when this gate became read-only: every repair now belongs
to [rules propagation](../rules-propagation.md), the sole writer. That single-writer rule exists
because a rule edit fans out to harness mirrors, word budgets, README indexes, and parity
manifests — a gate that wrote rules would invalidate the very snapshot it froze.

## Repository-wide sweeps

This gate audits one affected rule state, not the whole repository. The broader consistency sweep —
file naming, linking, emoji, agent-to-agent and agent-Skill duplication, Skill consolidation, and
governance contradictions across every layer — remains a capability of `rules-checker` itself and is
invoked directly, outside this gate. Anything such a sweep finds is resolved the same way: through
[rules propagation](../rules-propagation.md), never by the checker and never by this gate. Narrowing
the gate removed its iterating fixer, not the sweep.

The root owns every user interaction. A decision the checker cannot settle returns as a
`## User Decisions Required` envelope and is resolved through root-owned
[grilling](../../../development/workflow/grilling-with-options.md) before the handoff proceeds.

## Related Documents

- [Rules Quality Gate](../rules-quality-gate.md) — the read-only contract this serves.
- [Semantic Audit](./semantic-audit.md) — what the sweep covers.
