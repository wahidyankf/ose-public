---
description: Defines the three-tier precedence for resolving a plan's delivery mode and the per-repository availability check.
when_to_use: Use when resolving which delivery mode (worktree-to-pr, main-to-origin-main, etc.) a plan executes under.
---

# Enter the Designated Worktree — Delivery-Mode Resolution

**Continues** [Enter the Designated Worktree — Preconditions and Work Branch](./014-enter-worktree-preconditions-and-work-branch.md).

**Delivery-mode resolution (same three-tier precedence)**: alongside the work-branch precedence above, the executor also resolves the plan's active **delivery mode**, using the identical three-tier pattern: (1) a mode given as an **invocation argument** wins; (2) if none is given, the plan's own `## Delivery Mode` declaration wins; (3) absent either, the default is **`worktree-to-pr`**. See [Plans Organization Convention §Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) for the full four-mode table and the precedence algorithm. Immediately after resolving, check repository availability: in `ose-public`, **every value except `worktree-to-pr` is a hard error**, including `main-to-pr`; terminate with status `fail` rather than bypass the mandatory designated worktree and PR route. See [Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule). The resolved mode determines which work-location branch below applies:

- `worktree-to-pr` and `worktree-to-origin-main` — work happens in a dedicated **worktree**; follow the worktree provisioning and entry steps below.
- `main-to-origin-main` and `main-to-pr` — work happens directly in the **primary checkout**; skip worktree provisioning entirely per the "Work-branch provisioning vs. entry" note immediately below, and apply the freshness gate (step 5) directly to the primary checkout.

The resolved delivery mode also determines the push target at each phase gate (Steps 2b/2c) and the
finalization/archival path (Step 8) — each of those steps documents its mode-specific behaviour.
Under a `*-to-pr` mode the push target is the delivery unit's branch, but the PR itself opens only
at the unit's natural, production-deployable **delivery boundary**
([§PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule)).

**Invocation branch cannot bypass the resolved work location**: an invocation may select a delivery-unit branch only inside the plan's declared designated worktree. A branch in the primary checkout or any other location is invalid in `ose-public`; it cannot override the mandatory `worktree-to-pr` mode or the `## Worktree` declaration. Follow the provisioning/entry steps below, then apply the freshness gate in that worktree.
