---
description: >-
  Reviews every formal plan in the backlog root and drives each to still-valid, needs-revision, or removal.
when_to_use: >-
  Use before selecting the next plan to execute, or when the backlog has aged enough that its assumptions are suspect.
---

# Backlog Grooming

## Entry

`plans/backlog/` holds at least one formal plan, and the repository has changed since they were written.

## Sequence

1. **Freeze the list.** Enumerate every plan in `plans/backlog/` first. Plans added mid-pass belong to the next one.
2. **Re-read each plan against the current repository**, not against the repository it was written for. The question is
   not whether the plan is well written; it is whether it is still true.
3. **Assign exactly one disposition:**

   | Disposition | Means                                                                 |
   | ----------- | --------------------------------------------------------------------- |
   | valid       | assumptions still hold; ready to execute as written                   |
   | revise      | the goal holds but specifics have gone stale; name what must change   |
   | remove      | the goal no longer holds, or the work has since been done another way |

4. **Name the stale part** for every `revise`. "Needs updating" is not a finding. Which acceptance criterion, which
   path, which command.
5. **Record the order** among `valid` plans and what determined it — dependency, risk, or value. An order with no stated
   basis is re-litigated every pass.
6. **Delete removed plans.** History keeps them.

## Exit

Every plan on the frozen list carries a disposition, every `revise` names what is stale, and the `valid` plans carry a
stated order.

## What This Does Not Do

It does not revise plans. Grooming identifies staleness; correcting it is authoring, and it runs through
[Planning](plan-planning.md) with the gates that implies.

It does not start execution. Selecting a plan and executing it are separate decisions, and collapsing them means the
selection was never made deliberately.
