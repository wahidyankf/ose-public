---
description: >-
  Fixes the six-step order of the execution review and makes its terminal verdict the precondition for archival.
when_to_use: >-
  Use once every substantive delivery item is terminal and archival is the next step.
---

# Execution Review

Execution review runs once, after every substantive delivery item is terminal and before archival begins. It is
performed by [`plan-execution-check`](../../../workflows/plan/plan-execution-check.md).

## The Fixed Order

| #   | Step               | Asks                                                                                 |
| --- | ------------------ | ------------------------------------------------------------------------------------ |
| 1   | scope              | did the executed work match the stated scope, with nothing quietly added or dropped? |
| 2   | requirements       | is every acceptance criterion terminal, and does its evidence establish it?          |
| 3   | checklist evidence | does every completed item carry a result that matches the repository's state?        |
| 4   | gates              | did every declared gate run and return a terminal result?                            |
| 5   | cleanup            | are task-owned artifacts gone, and is their absence proven?                          |
| 6   | knowledge capture  | is every learning promoted to a durable owner or discarded with a reason?            |

The order is fixed because each step assumes the previous one held. Checking evidence before checking scope produces
findings about work that should not have been done — technically correct, and useless. Checking cleanup before checking
gates can pass a repository that is tidy and unverified.

Reordering does not merely change the sequence of findings; it changes which findings are reachable at all.

## Terminal Verdict

The review records one terminal verdict. Archival proceeds only on a verdict that permits it.

An unresolved acceptance criterion, an unproven cleanup, or an unrouted learning blocks archival. The remedy is to
resolve the item and re-run the review — never to archive with a note explaining what was left open.

## Why Review and Archival Are Separate Steps

Archival is mechanical: move the folder, update the references, run the checks, commit. It is the kind of step that gets
done quickly and without much thought, which is exactly why the thinking has to happen before it and be recorded as a
verdict.

Merging the two would make the judgement a side effect of the move. In practice that means the judgement is skipped, and
the plan is filed because filing was the task.
