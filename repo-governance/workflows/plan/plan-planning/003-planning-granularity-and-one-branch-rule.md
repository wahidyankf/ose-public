---
description: Introduces the planning-granularity rules and maps each independent delivery unit to the integration mechanism of the resolved delivery mode.
when_to_use: Use when cutting a plan into phases or deciding whether two phases belong in one delivery unit or separate deliveries.
---

# Planning Granularity and Mode-Specific Delivery Mapping

How a plan is cut into phases determines how much of it can proceed in parallel and how early each
piece reaches `main`. These rules bind at authoring time, not merely at execution time.

## One Delivery Unit, One Mode-Specific Integration (HARD RULE)

Each independent node of the plan's dependency DAG **that produces changes** lands as **its own
delivery unit**. Under a `*-to-pr` mode, the mapping is strict and one-to-one: **one branch → one
PR → one delivery unit**. Never open two PRs from one branch or drive one PR from two branches.
Under a permitted direct-push mode, the unit instead reaches one direct integration checkpoint;
it does not invent a branch or PR.

The **worktree** is not part of this mapping. A worktree mode provisions **at most one worktree per
repository**, reused across every delivery unit it produces in that repo; see
[Plans Organization Convention §Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
Never provision a second worktree for a repo the plan already has one open in — switch branches
inside the existing one instead. A main mode uses the primary checkout and provisions no worktree.

A **delivery unit** is the contiguous run of phases ending at a **delivery boundary** — the phase
after which the accumulated work follows one natural cohesive seam and is independently safe to
deploy to production. Keep every artifact required to build, verify, operate, roll back, and remain
internally consistent together. LOC and file counts never create, erase, or force the boundary.
The unit, not the individual phase, reaches the resolved mode's integration mechanism: a plan has
natural delivery points, which may occur once at the very end or several times through the plan.
Under `*-to-pr`, the boundary opens the unit's PR; under a direct mode, it is the unit's permitted
direct integration checkpoint. Phases inside a unit that are not its boundary still pass their own
`### Phase N Gate`, but do not integrate. The boundary test, the required
`### Delivery Boundaries` declaration table, and the anti-batching counterweight are stated in
[Plans Organization Convention §PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).

Genuinely dependent phases stay a single delivery unit. The DAG governs, not the phase numbering:
phases that merely appear in sequence are not thereby dependent, and splitting **independent** work
into separate delivery units is the default. Sequence is not dependency — and neither is it a
licence to fold independent nodes together to reduce PR count.

Each unit's exact resulting `main` state must be immediately production-deployable. Complete
user-reachable behaviour may be active; incomplete behaviour must be complete-and-inert behind a
temporary production-disabled feature flag, with both paths tested and rollout, rollback, and
removal recorded.

**Phase 0 is not one of these nodes — the earliest PR is Phase 1 (HARD RULE)**. Phase 0 is
Environment Setup and Baseline: it installs dependencies, converges the toolchain, records the
baseline, and clears preexisting failures. It produces nothing reviewable, so it opens no PR, pushes
no branch, runs no PR CI or review, and integrates nothing — under **every** delivery mode, the
default `worktree-to-pr` included. Author it as a local, gate-terminated phase whose evidence
artifacts ride the first change-producing unit's mode-specific integration. A Phase 0 that genuinely
produces reviewable changes is mis-scoped: move that work into Phase 1. See
[Plans Organization Convention §Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule).
