---
description: Definitions for plan, phase, delivery unit, delivery boundary, delivery mode, and worktree, and how they nest.
when_to_use: Use when scoping a plan, locating a delivery boundary, or deciding whether two pieces of work are one delivery unit or two.
---

# Plan Vocabulary

These six terms nest, and conflating any two of them produces either a delivery boundary per phase
or one oversized delivery unit for a whole quarter.

| Term                  | What it is                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| **Plan**              | One piece of intended work, held in `plans/` as a document set             |
| **Phase**             | One step of a plan's delivery checklist                                    |
| **Delivery unit**     | A contiguous run of phases forming one natural, production-deployable seam |
| **Delivery boundary** | Where a unit ends and reaches its mode-specific delivery opportunity       |
| **Delivery mode**     | Where work happens and how it reaches the integration target               |
| **Worktree**          | A work location — an isolated checkout, not an integration decision        |

## How They Nest

A plan holds many phases. A delivery unit groups contiguous phases into one natural cohesive seam,
including every artifact needed for internal consistency, until its exact resulting `main` state is
immediately safe to deploy to production; that point is the delivery boundary. **One delivery unit**
reaches one mode-specific delivery opportunity. Under a `*-to-pr` mode, one unit maps to exactly
one branch and one PR. Under a permitted direct-push mode, one unit maps to one direct integration
checkpoint. Incomplete behaviour must be complete-and-inert behind a temporary production-disabled
flag, with both paths tested and its rollout, rollback, and removal recorded.

Phase 0 is always environment setup and baseline. It opens no PR, pushes no branch, and runs no
review cycle, because there is nothing yet to review.

## Mode Versus Location

Delivery mode and worktree answer different questions. A worktree is _where the work happens_;
delivery mode additionally fixes _the integration target_ and _merge authority_. The repo-wide
default is `worktree-to-pr` — isolated worktree, draft PR against the trunk, merged by the agent
once preconditions hold.

Worktree modes provision at most one worktree per repository and reuse it across delivery units.
Main modes use the primary checkout and provision no worktree. A branch and PR stay
one-per-delivery-unit only under `*-to-pr`; direct-push modes integrate at the unit's checkpoint.

## Related Documents

- [Glossary](../glossary.md) — the other term clusters.
- [Delivery Mode](../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) —
  the four modes and how the active one is resolved.
- [Planning Granularity](../workflows/plan/plan-planning/003-planning-granularity-and-one-branch-rule.md) —
  the one-branch rule and the worktree cap.
- [Natural Seams and Deployable State](../conventions/structure/plans/prs-open-at-delivery-boundaries-natural-seams.md) —
  the canonical delivery-unit boundary and production-safety test.
- [Plans Organization Convention](../conventions/structure/plans.md) — folder lifecycle and
  document set.
