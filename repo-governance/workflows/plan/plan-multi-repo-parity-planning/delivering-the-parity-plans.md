---
description: Carries gated parity plans on to delivery in the same run through a readiness gate, a pre-execution grill, DAG execution per repository, and cross-repository finalization.
when_to_use: Use when the parity plans this workflow authored should be executed and delivered in the same run.
---

# Delivering the Parity Plans

This workflow ends when every plan is gated and its documents are delivered. When the invoker wants the same run to
deliver the parity objective, continue with these four steps. Each is a hard gate.

## 1. Readiness Gate

For every target repository, confirm that the plan sits in `plans/in-progress/<objective-slug>/` with the mature core and
one technical shape, holds a `PASS` from [plan-quality-gate](../plan-quality-gate.md), has its planning commits on that
repository's `origin/main`, and declares its `## Worktree` section. If any check fails for any repository, stop and name
it. Never execute a subset silently.

## 2. Pre-Execution Grill

Resolve these before any execution, per the
[Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md):

1. **Execution DAG**: the initially ready nodes and the required cross-repository edges, grounded in the deviation
   matrix. Portable public-source and Rhino nodes precede the private nodes that consume them **(Recommended)**; a
   preferred review order is not an edge.
2. **Failure policy**: stop new scheduling when a node ends `partial` or `fail` **(Recommended)**, or continue only
   nodes proven independent of it.
3. **Open design decisions** the plans left unresolved, one question each.
4. **`[HUMAN]` availability** during the run, or stop at the first `[HUMAN]` item.
5. **Parity identity**: the same objective slug, worktree basename, and corresponding branch names in every plan.

Abandonment ends the run `fail`, and the gated plans stay in `plans/in-progress/`.

## 3. Execution

Run [plan-execution](../plan-execution.md) in full for each ready node, scheduled the way
[multi-plans-execution](../multi-plans-execution.md) schedules a DAG, within `max-concurrency` and HIPPO admission. Each
repository resolves its own `## Delivery Mode`. The edges in
[Propagation, Delivery Shape, and Shared-Machine Safety](./propagation-delivery-and-machine-safety.md) hold:
`apps/rhino-cli` byte identity propagates one repository at a time, and a node writing what another reads precedes it.
Regenerating this repository's parity manifest clears its own pre-push gate but does not discharge propagation to the
other repository. Under stop-on-failure, freeze new admissions, let indivisible work settle, and end `partial`.

## 4. Cross-Repository Finalization

After the last repository archives its plan:

1. Repoint each archived plan's `## Sibling Plans` links to the final `plans/done/<date>__<objective-slug>/` paths, one
   commit per repository.
2. Confirm every deviation-matrix decision holds in the delivered state, and that each rationale document landed where
   the grill placed it.
3. Report per repository: the final plan path, gate verdict, execution status and iterations, delivery references, the
   deviation count ("N deliberate deviations recorded; 0 silent deviations"), worktree disposition, and the parity
   identity assertion.

The run passes only when every plan passed its delivered-head terminal audit and every sibling link is repaired.
