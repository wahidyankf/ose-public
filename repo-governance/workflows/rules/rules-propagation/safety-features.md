---
description: The guards bounding a run's authority to rewrite, relocate, and delete existing rules, and the failure modes each one addresses.
when_to_use: Use when reviewing a propagation run's diff, or when extending the workflow's authority.
---

# Safety Features

The run may rewrite, merge, relocate, and delete existing rules within its delivery. These guards
bound that authority.

## Nothing Vanishes Silently

Every removal is classified as **merge**, **delete**, **relocate**, or **supersede**. The manifest
names the surviving canonical home or replacement and confirms that every distinct obligation and
necessary discoverability path remains. Erasing either is a defect, whatever the diff looks like.

## The Budget Is Not Negotiable

No threshold is raised, and no exemption, waiver, or ignore entry is added, to make a placement
fit. When a surface is full, the moves are eviction or the fallback layer. This guard exists
because defeating the budget is always the cheapest apparent fix and always the wrong one.

The rule's meaning is equally non-negotiable. Budget remediation may relocate full detail behind an
annotated link, but MUST preserve obligations, named audience, strength, scope, boundaries,
exceptions, pass/violation conditions, and enforcement disposition. Shortening a material qualifier,
generalizing the audience, or deleting an edge condition to reduce words is a propagation defect.

## Higher Layers Are Read-Only

A run may not edit a rule in a layer above the one it is propagating into. The whole point of the
layer hierarchy is that a low-layer decision cannot quietly rewrite a high-layer commitment.

## Neighbouring Work Is Untouchable

Because the run works in the caller's tree by default, everything it stages comes from the
file-touch ledger, explicitly. Never a catch-all specification. The failure this prevents is real
and quiet: a neighbouring tree holds uncommitted work, a formatting hook widens the commit, and
unrelated changes ship inside a rules PR.

## Verification Is Two-Directional

A check asserted in one direction only is half a check. An enforcement disposition claiming
coverage is verified by confirming the gate fails on a violating input as well as passing on a
conforming one.

## Convergence

Every Step 8 deterministic check and direct subject-local review is bounded by its own process or
review pass. Where a finding survives repeated fixes, the run reports it rather than continuing — a
fix loop that will not converge is information, not an obstacle to grind through.

## Idempotency

Re-running propagation with the same effective outcome is a no-op. Step 3 compares meaning,
strength, scope, boundaries, exceptions, and discoverability before placement and records the
canonical source and proof. Wording-only differences cannot cause churn; material gaps cannot be
hidden by textual similarity. Where a run inserts rather than replaces, the already-applied state
is checked **before** the insertion anchor, so a re-run cannot duplicate what it added.

## Related Documents

- [Purpose and Scope](./purpose-and-scope.md) — the authority these guards bound.
- [Termination Criteria](./termination-criteria.md) — what a run may never terminate by doing.
