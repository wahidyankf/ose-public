---
description: Defines how the orchestrator reads the plan, reconciles prior-run state, and materializes the live Task list before implementation begins.
when_to_use: Use when starting or resuming plan execution and building the initial Task list from delivery.md.
---

# 1. Load Delivery Checklist and Materialize Task List (Sequential)

Read the plan in full, reconcile against any prior run's state, and build the live Task list to mirror disk truth — before any implementation work begins.

**Orchestrator action**:

- Read the plan at `{input.plan-path}` — for a current formal plan, read `README.md`, `brd.md`,
  `prd.md`, `delivery.md`, `learnings.md`, and exactly one technical form (`tech-docs.md` or all
  files mapped by `tech-docs/README.md`); for a
  [Bug-Fix Plan](../../../conventions/structure/plans/bug-fix-plan.md), its one `README.md`.
  Preserve the documented prospective exceptions for older plans rather than silently migrating them.
- Read the technical form's annotated `## File-Impact Analysis` tree before materializing tasks. Treat it
  as the plan's declared footprint: reconcile each delivery path against its `[E]`/`[N]`/`[D]`/`[G]`
  marker and surface a mismatch before touching an undeclared path. `### More Detail` supplies
  context only; it does not expand the footprint.
- Locate the delivery checklist in `delivery.md`; only a grandfathered plan or a bug-fix plan may
  embed it in `README.md`.
- **Entry and Resume Reconciliation (Iron Rule 10)**: perform this reconstruction whenever this
  workflow is invoked—at the start, for the first time after some checklist work already happened,
  after compaction/handoff, or when reinvoked mid-run. Parse every action checkbox top-to-bottom.
  For each `- [x]`, require exactly one matching completed task when the harness can retain completed
  tasks. For each `- [ ]`, require exactly one matching open task in reading order. If an existing
  Task list disagrees with disk, discard the stale mapping and rebuild it from `delivery.md`; disk is
  authoritative.
- **Granular-action parsing (Iron Rule 1)**: identify every delivery action checkbox at any nesting
  level. Outcome-section Input/Outcome/Proof prose is context, not a task. Separate RED, GREEN, and
  REFACTOR checkboxes are separate tasks.
- **`TaskCreate` one task per remaining checkbox**, in reading order. Task titles short-form the
  checkbox text for monitoring parity. Never reuse one task for multiple checkboxes.
- **Verify the full bijection before moving on**: every checked action maps to one completed task
  when retained, every unchecked action maps to one open task, and no harness task is orphaned from
  `delivery.md`. At minimum, prove
  `count(remaining - [ ] in delivery.md) == count(open tasks mapped to this plan)`. Diverging counts,
  duplicate mappings, or orphans indicate a synchronization bug—stop and reconcile before any
  implementation tool call.
- Do NOT call `TaskUpdate in_progress` yet; that happens at Step 2 when the loop actually begins on an item.

**Output**: Live Task list mirrors delivery.md remaining items 1:1, plan context loaded.

**On failure**: Terminate workflow with status `fail`.

**Notes**:

- Tasks map 1:1 to action checkboxes. Never materialize section context as tasks or hide distinct
  actions inside one task.
- Tasks must be concrete and independently verifiable.
- Preserve the exact phase and item ordering from delivery.md in the Task list.
- Already-ticked items are not re-executed. They remain part of the audited 1:1 history when the
  harness retains completed tasks; otherwise record that the harness cannot reconstruct completed
  entries and build the exact open-task mirror from disk.
