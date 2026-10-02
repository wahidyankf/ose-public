---
description: Defines the push target per delivery mode and the direct-push vs. *-to-pr branch/PR mechanics.
when_to_use: Use when deciding where a phase's changes should push to under the plan's resolved delivery mode.
---

# Per-Phase Quality Gate — Push Targets

**Continues** [Per-Phase Quality Gate — Gates](./024-per-phase-quality-gate-gates.md).

1. **Fix ALL failures** — including preexisting ones (Iron Rule 3)
2. Re-run failing checks to confirm resolution
3. Commit thematically (Iron Rule 7) — within the explicitly authorized change set, use the fewest
   build-valid, independently reviewable/revertible commits and keep each purpose's required
   completion artifacts together
4. After ALL local quality gates pass, push according to the resolved delivery mode (Iron Rule 5).
   A direct-mode integration push or a `*-to-pr` boundary delivery push that precedes PR opening
   occurs only when the completed phase is the delivery unit's declared boundary. At an
   intermediate phase, a direct mode pushes nothing; a `*-to-pr` mode may push the unit branch
   solely for non-integrating durability and opens no PR. The push target depends on the delivery
   mode resolved in Step 0:
   - **`worktree-to-origin-main` / `main-to-origin-main`** (direct-push modes): at the unit boundary,
     perform its single reviewed checkpoint by pushing directly to `origin main`.
   - **`worktree-to-pr`**: push the delivery unit's branch from the plan's one provisioned
     worktree. When moving to another independent unit, branch from fresh `origin/main` in that
     same worktree; do not provision another (see
     [Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule)).
   - **`main-to-pr`**: push the delivery unit's branch from the synced primary checkout. Never
     create or enter a worktree for this mode.
   - For either `*-to-pr` mode, each independent node gets one branch and one PR — strict
     **one branch → one PR → one delivery unit** mapping (see
     [Planning Granularity](../plan-planning/003-planning-granularity-and-one-branch-rule.md)). Open the
     PR only at the unit's declared delivery boundary. Its body is the reader's entry point and
     applies [Natural Seams and Deployable State](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-natural-seams.md):
     name the cohesive purpose; keep every artifact required to build, verify, operate, roll back,
     and remain internally consistent together; and exclude unrelated purposes. LOC and file counts
     never create, erase, or force the boundary. Confirm the exact resulting `main` state is safe to
     deploy to production immediately. Incomplete behaviour requires a temporary
     production-disabled flag, enabled and disabled path tests, and recorded rollout, rollback, and
     removal. At an
     intermediate phase, push the unit branch for durability but open no PR, run no PR review,
     merge nothing, and skip Step 2c. Dependent phases share a delivery unit; independent nodes
     never do. Monitor CI on the PR, not `main`.
