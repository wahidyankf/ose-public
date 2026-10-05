---
description: Gives the remaining PR-boundary rules and their delivery-mode scope.
when_to_use: Use when deciding whether independent work may share a PR or whether an opened PR may be held.
---

# PRs Open at Delivery Boundaries — Rules 5-7 and Mode Scope

Continues [PRs Open at Delivery Boundaries, Not Every Phase (HARD RULE)](./prs-open-at-delivery-boundaries-rules.md).

1. **Independent parallel DAG nodes still deliver separately.** Grouping phases into one delivery
   unit is permitted only along a dependency chain. Merging two independent nodes into one PR to
   reduce PR count is forbidden — it re-serialises work the DAG declared independent. This clause
   protects the parallelization rationale behind the `worktree-to-pr` default.
2. **A shippable increment may not be deferred merely to batch it.** If the work standing at phase N
   already satisfies the boundary test below, phase N is a boundary — a plan does not get to carry
   it forward to make a bigger PR.
3. **An opened PR is never held.** It is opened and merged when its boundary is reached; PRs never
   queue for a plan-end merge train. Grouping dependent phases into one delivery unit is not
   batching — holding independent, already-open PRs is exactly what this prohibition targets. Nor
   does this bar a **GitHub merge queue**, which serialises already-approved merges for CI
   correctness and holds nothing back: the prohibition is on a plan deferring its own merges, not on
   the platform ordering them.

Every unit above is bounded by a natural cohesive seam, not a line or file count. Keep everything
required to build, verify, operate, roll back, and remain internally consistent with that unit, and
split independent purposes. Merge only when the exact resulting `main` state is immediately safe to
deploy to production, using a temporary production-disabled feature flag for incomplete behaviour.
See [Natural Seams and Deployable State](./prs-open-at-delivery-boundaries-natural-seams.md).

Rules 1-3 govern **PRs**, so they bind the `*-to-pr` delivery modes only. Direct-push plans may
retain per-phase local commits and quality gates, but push to `origin/main` only at the unit's
reviewed direct checkpoint.

See [PRs Open at Delivery Boundaries — Boundary Test and Rationale](./prs-open-at-delivery-boundaries-boundary-test.md) for the four-part boundary test that determines whether a given phase is a delivery boundary.
