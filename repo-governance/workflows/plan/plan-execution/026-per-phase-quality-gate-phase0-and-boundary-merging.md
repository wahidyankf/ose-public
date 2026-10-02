---
description: Defines Phase 0's exemption from pushing or opening a PR, and the delivery-boundary merge-not-batch rule.
when_to_use: Use when confirming Phase 0 pushes nothing or deciding whether a delivery unit should integrate now or wait.
---

# Per-Phase Quality Gate — Phase 0 Exemption and Delivery-Boundary Merging

**Continues** [Per-Phase Quality Gate — Push Targets](./025-per-phase-quality-gate-push-targets.md).

**Phase 0 is exempt from this entire step — it pushes nothing and opens no PR (HARD RULE)**: Phase 0 is Environment Setup and Baseline. It installs dependencies, converges the toolchain, records the baseline, and resolves preexisting failures; it produces no reviewable change, so it is not a delivery DAG node and has no push target under **any** delivery mode. Do not push a Phase 0 branch, run `gh pr create`, PR CI, optional semantic review, or merge for it. Any evidence file Phase 0 wrote stays with the plan and lands through the **first** change-producing unit's mode-specific integration. See [Plans Organization Convention §Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).

**Delivery-boundary integration (not per-phase, not batch)**: integrate each delivery unit as its
boundary completes. Under `*-to-pr`, open and merge the unit's PR once hardened preconditions hold;
under a permitted direct mode, land the unit at its direct-push checkpoint. Do not integrate at
every intermediate phase or hold independent ready units for a plan-end batch. Grouping dependent
phases into one unit is not batching. The merge actor is `[AI]` by default; `[HUMAN]` applies only
where the plan declares that gate. Split only at natural cohesive seams, never LOC or file counts,
and integrate only an exact resulting `main` state safe to deploy immediately. Incomplete behaviour
reaches `main` complete-and-inert behind a temporary production-disabled feature flag, with both
paths tested and rollout, rollback, and removal recorded.
