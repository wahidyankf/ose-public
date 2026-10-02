---
description: Defines the non-negotiable invariants for the harness Task list as the user's real-time execution monitoring surface.
when_to_use: Use when auditing whether task creation, titling, and completion timing satisfy the primary-observability invariants.
---

# Harness Task List as Primary Observability Surface

The harness task list (`TaskCreate` to add, `TaskUpdate` to mutate) is the user's only real-time view of execution. It is the **primary observability surface**, not a side artifact. The on-disk `delivery.md` checklist is the persistent source of truth; the harness list is its live mirror.

**Non-negotiable invariants**:

- **One action checkbox = one harness task**. Every `- [ ]` in `delivery.md`, including separate
  RED, GREEN, and REFACTOR actions, maps to exactly one harness task. Outcome-section
  Input/Outcome/Proof prose is not a task. Every harness task maps back to exactly one checkbox.
- **Title short-form rule**. The task `subject` is a short-form of the checkbox prose: drop articles, keep verb + object, ≤80 characters. The reader watching the spinner MUST recognize the checkbox at a glance.
- **At most one `in_progress` task at any time**. Multiple `in_progress` tasks indicate the orchestrator is interleaving items — forbidden.
- **Sync lag ≤ one Edit call**. The on-disk checkbox state never lags more than a single `Edit` call behind the harness task state. If `TaskUpdate completed` fires before the matching `Edit` ticks the checkbox, the system is in an inconsistent state — roll back per the Atomic Sync Ritual below.

**Forbidden patterns** (violations of the above):

- Coarse tasks ("Execute Phase 2", "Update all agents", "Apply fixes")
- Bulk creation ("one task per phase" instead of one task per checkbox)
- Silent batch completion (multiple checkboxes ticked in one `Edit` while only one `TaskUpdate completed` fires)
- Late notes (closing a task before its implementation-notes block lands on disk under the ticked checkbox)
- Renaming a task to summarize multiple done items instead of leaving the original 1:1 mapping

If any of the above occur, the orchestrator MUST stop, reconcile (disk wins per the Resume Reconciliation rule below), and resume one checkbox at a time.
