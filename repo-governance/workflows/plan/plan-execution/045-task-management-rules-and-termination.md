---
description: Restates the task-creation, status-update, checkbox-ticking, and never-skip rules, plus the plan's termination criteria.
when_to_use: Use as a compact reference for task-list discipline rules and the pass/partial/fail termination criteria.
---

# Task Management Rules

The orchestrator MUST follow these task management rules throughout execution:

## Create Tasks Before Starting

Before beginning Step 2 execution, create one task per delivery checklist item using
`TaskCreate`. Each task maps to one concrete, independently verifiable action checkbox. Input,
Outcome, Proof, and implementation-note prose belong to the outcome section; do not materialize
them as tasks. Each concrete action checkbox, including RED/GREEN/REFACTOR, is a separate task.

## Update Task Status Progressively

As each item begins, call `TaskUpdate` to set status `in_progress`. When done, call
`TaskUpdate` to set status `completed`. Never mark a task complete without having delegated
it and verified the agent completed the work.

## Tick Checkboxes Immediately

Update `delivery.md` immediately after each item completes — before moving to the next
item. Never batch-update checkboxes at the end of a phase. The delivery checklist must
reflect actual completion state at all times.

## Never Skip Items

Every delivery checklist item must be executed in order. The orchestrator may not skip an item
because it seems redundant or out of scope. If an item is genuinely irrelevant, mark it
with a note explaining why it was skipped rather than silently omitting it.

## Termination Criteria

- PASS: **Success** (`pass`): No blocking finding (CRITICAL, HIGH, or an unproven acceptance criterion)
  in final validation, and every other finding fixed or recorded; every required surface gate passes; Knowledge Capture is terminal; the
  terminal end-to-end audit proves every requirement against the delivered head; exact-head/base CI passes where applicable;
  all deliverables and infrastructure-apply steps are verified; and the plan is archived according
  to its delivery mode
- **Partial** (`partial`): Blocking findings remain after max-cycles cycles, OR an infrastructure-apply step remains unexecuted from the primary checkout — plan requires manual intervention
- FAIL: **Failure** (`fail`): Orchestrator or checker encountered technical errors preventing completion
