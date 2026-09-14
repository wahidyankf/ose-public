---
description: Preserve active user-established repository-rule decisions across compaction, handoff, and session continuation.
when_to_use: Use when a user establishes a repository-rule preference during active work, or before acting after compaction, handoff, or session continuation.
---

# Continuation-State Integrity

Repository-rule decisions established by the user during a task remain binding until the user or a
higher-authority repository rule supersedes them. Harness compaction, summary loss, handoff, or a
new session does not weaken or discard them.

## Active Decision Record

Immediately record every unsuperseded user-established repository-rule decision that constrains the
current work in durable task or continuation state. Each entry contains:

- **Operative statement**: the exact obligation that future work must preserve
- **Scope**: the repositories, plans, surfaces, or operations it governs
- **Source**: the user turn, durable decision document, or linked repository rule
- **Status**: `active` or `superseded`, including the superseding source when applicable

Reproduce every active entry in each compaction summary and handoff. Do not rely on conversational
memory or a generic “follow repository rules” reminder. Keep the
[file-touch ledger](../../practice/file-touch-discipline.md) in its own required section; link it
from the continuation state instead of duplicating its contents in each decision entry.

## Continuation Gate

Before the first action after compaction, a restored summary, handoff, session restart, or takeover:

1. Re-read the current canonical instruction surfaces and the repository rules governing the next
   action.
2. Restore the active decision record and reconcile each entry against those current rules.
3. Mark an entry superseded only when its source or a higher-authority rule actually supersedes it.
4. If an unresolved conflict remains, stop and report both statements and their sources. Never
   silently weaken, discard, or replay the earlier decision.

A continuation passes when every active decision is restored, checked against current canonical
rules, and applied to the resumed task. It fails when an active decision is absent, silently
weakened, or followed without the required reconciliation.

## Enforcement Disposition

**Unenforced by decision.** Repository-local tooling cannot observe a harness transcript,
compaction payload, or restored session state reliably enough to prove semantic preservation. The
task-list discipline, handoff templates, and continuation gates make the obligation auditable.

## Related Documentation

- [Task List Discipline](../../practice/task-list-discipline.md) — durable execution state.
- [File-Touch Discipline](../../practice/file-touch-discipline.md) — separate ownership ledger.
- [Plan Handover and Takeover](../../../workflows/plan/plan-handover-and-takeover.md) — the handover record and the
  takeover gate.
