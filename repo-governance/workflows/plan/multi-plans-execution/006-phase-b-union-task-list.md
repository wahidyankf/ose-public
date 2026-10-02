---
description: Covers B1-B5 — one harness task per DAG node across all plans, tagging, the multi-file Atomic Sync Ritual, resume reconciliation, and the per-plan in_progress invariant.
when_to_use: Use when creating or tagging the union Task list, or reconciling it against multiple plans' delivery.md files.
---

# Phase B — Materialize the Very-Granular Union Task List (Sequential)

**B1. One checkbox = one harness task, across ALL plans.** For every node in the DAG, `TaskCreate`
exactly one task. The union Task list is the **primary observability surface** for the whole run,
following the [Harness Task List as Primary Observability
Surface](../plan-execution/009-harness-task-list-primary-observability-surface.md) rules. Coarse tasks,
bulk creation, and silent batch-completion are forbidden exactly as in the single-plan workflow.

**B2. Tag every task** so the reader can see the schedule in the list itself:

- `subject` short-forms the checkbox prose (drop articles, verb + object, ≤80 chars) **prefixed with
  the plan id** — e.g., `planB · P2 GREEN implement scan`.
- Record on the task (in its description/metadata): `phase`, the resource-set, and a
  **PARALLELIZABLE** or **SEQUENTIAL** marker from A7.
- Wire `addBlockedBy` from the DAG edges (intra-plan ordering + inter-plan `Depends-on` + inferred
  resource conflicts). A task is claimable only when its `blockedBy` set is empty.

**B3. Multi-file Atomic Sync Ritual.** The [Atomic Sync
Ritual](../plan-execution/010-atomic-sync-ritual.md) applies **per plan against that plan's own
`delivery.md`**: tick the checkbox in the correct plan's file, persist the implementation-notes block
there, then `TaskUpdate completed`. Never edit the wrong plan's `delivery.md`. Resolve it against
the plan's declared work location: its worktree for `worktree-to-*`, or the primary checkout for
`main-to-*` (per [Resume Reconciliation rule 6](../plan-execution/011-resume-reconciliation.md)).

**B4. Resume reconciliation across N plans (disk is truth).** On (re)start, read every named plan's
`delivery.md` first, rebuild the union Task list from disk state, and delete any stale in-memory
tasks that disagree with disk. Never trust in-memory state over disk.

**B5. At most one `in_progress` task PER PLAN.** The single-plan "at most one `in_progress`" invariant
becomes **per-plan**: each plan advances one checkbox at a time, but up to `parallelism` _different_
plans/nodes may be `in_progress` simultaneously. The scheduler (Phase C) enforces the global ceiling.
