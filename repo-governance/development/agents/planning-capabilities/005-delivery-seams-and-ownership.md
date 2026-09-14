---
description: >-
  Defines what makes a valid delivery seam and routes landing, integration state, and cross-repository coordination to
  this repository's delivery-boundary owners.
when_to_use: >-
  Use when splitting a plan into delivery units, or when a plan touches more than one repository.
---

# Delivery Seams and Ownership

## What Makes a Valid Seam

A delivery unit is a transaction. A seam between two of them is valid only when the unit on each side has:

1. **one owner** — the repository or component responsible for the change;
2. **one independently testable outcome** — something that can be verified without the other unit landing;
3. **one recoverable transaction** — a rollback that restores a known state on its own; and
4. **one coherent review surface** — a change a reviewer can hold in their head at once.

A split that fails any of the four is not a seam; it is a partition drawn for convenience, and the first failure will
cross it.

Two units that must land together are one unit. Splitting them produces a state where half the work is deployed and the
other half is in review, which is exactly the state neither unit's rollback was designed for.

Conversely, a unit nobody can review is too large regardless of how coherent it is internally.

## Landing and Integration State

This repository already owns how a unit lands, so this module does not restate it:

- [PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md) owns
  when a change opens, one change per boundary, and sequential landing.
- [Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md) owns the four delivery modes.
- [Natural Seams and Deployable State](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-natural-seams.md)
  owns the integration state: every landed change leaves `main` deployable, with incomplete behaviour behind a disabled
  flag.

## Not Adopted Here

Two clauses of the published module are a recorded local deviation, not rules of this repository:

- landing a foundation unit (a safety layer, a gate, a configuration contract) separately before dependent content; and
- the cross-repository boundary that bars a coordinating plan from performing another repository's mutations, gates,
  proof, or cleanup.

Cross-repository coordination follows [Related Repositories](../../../conventions/structure/related-repositories.md).
