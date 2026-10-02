---
description: Establishes that the live Task list and on-disk delivery.md are two views of one action-level state that must always agree.
when_to_use: Use when reconciling the harness Task list against delivery.md, or confirming every checkbox maps to exactly one task.
---

# Task-Checklist Synchronization

The live Task list (`TaskCreate` / `TaskUpdate`) and the on-disk delivery checklist (`delivery.md`) are two views of the same state. They MUST agree at every moment of execution. Disagreement is a bug the orchestrator MUST detect and fix immediately.

- **Task list** — ephemeral, in-conversation. Its role is **real-time progress visibility for the user**. A reader watching the Task list is watching execution happen.
- **Delivery checklist** — persistent, on-disk. Its role is **survival across conversations**. It is the source of truth for plan completion state.

## 1:1 Mapping (strict)

Every action checkbox on disk has exactly ONE matching task in the live list. Every task has exactly
ONE matching action checkbox on disk. Outcome-section fields and nested prose are context, not
tasks. Separate RED, GREEN, and REFACTOR checkboxes are three tasks. Task titles short-form the
checkbox text so readers see consistent wording in both views.

This bijection is an entry gate, not only a startup convenience. On first invocation after work has
already begun, on resume, after handoff/compaction, and whenever the workflow is reinvoked mid-run,
the orchestrator MUST reread `delivery.md`, compare every task and checkbox, and reconstruct the
mapping from disk before further work. Checked actions map to completed tasks when the harness
retains them; unchecked actions map to open tasks. Duplicate task mappings, orphan tasks, missing
tasks, or status disagreement block execution until reconciled.

Forbidden: coarse tasks ("Execute Phase 2", "Update all agents"), bulk creation ("one task for every phase"), silent completion ("ticked three boxes in one Edit, one `TaskUpdate` at the end"). Each of these breaks the user's monitoring view.
