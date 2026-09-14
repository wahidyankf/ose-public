---
description: >-
  Evaluates finished execution in a fixed order and records the terminal verdict that permits or blocks archival.
when_to_use: >-
  Use once every substantive delivery item is terminal, before a plan is archived.
---

# Execution Check

## Entry

Every substantive item in `delivery.md` is terminal. Archival has not started.

## Sequence

The evaluation runs in this fixed order. The order matters: each step assumes the previous one held, and reordering
produces findings that contradict each other.

1. **Scope.** Did the executed work match the plan's stated scope — nothing quietly added, nothing quietly dropped?
2. **Requirements.** Is every acceptance criterion terminal, and does its evidence actually establish it?
3. **Checklist evidence.** Does every completed item carry a result, and does the result match what the repository now
   contains?
4. **Gates.** Did every declared gate run and return a terminal result, including the ones that returned findings?
5. **Cleanup.** Are the task-owned artifacts gone, and is their absence proven rather than assumed?
6. **Knowledge capture.** Is every `learnings.md` entry resolved to a durable owner or discarded with a reason?

## Exit

One terminal verdict is recorded. Archival proceeds only on a verdict that permits it.

## Archival Is Blocked, Not Warned

An unresolved acceptance criterion, an unproven cleanup, or an unrouted learning blocks archival outright.

This is stricter than it looks, and deliberately so. A plan in `plans/done/` reads as finished — that is the entire
signal the lifecycle root carries. Filing an unfinished plan does not merely record something inaccurate; it destroys
the meaning of the root for every plan already in it.

The remedy is always the same: resolve the item, then re-run the check. There is no partial archival and no archival
with a note explaining what was left open.
