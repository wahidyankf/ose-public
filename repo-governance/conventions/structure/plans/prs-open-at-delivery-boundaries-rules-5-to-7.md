---
description: Gives the remaining PR-boundary rules plus the mode-neutral independent parity-delivery rule and its scope.
when_to_use: Use when deciding whether independent work may share a PR or whether a ready parity PR/direct delivery may wait for a sibling.
---

# PRs Open at Delivery Boundaries — Rules 5-7, Parity Delivery, and Mode Scope

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
4. **Parity delivery uses each repository's own opportunity in every mode.** Once one repository
   meets its mode-specific hardened prerequisites and a delivery opportunity exists, merge its PR
   or complete its permitted direct-main delivery. Never hold a ready repository solely to
   synchronize it with a sibling. Record any unfinished counterpart as a named sibling obligation
   until the repositories converge. A shared parity identity makes deliveries traceable; it does
   not create a synchronized-delivery gate.

Every unit above is bounded by a natural cohesive seam, not a line or file count. Keep everything
required to build, verify, operate, roll back, and remain internally consistent with that unit, and
split independent purposes. Merge only when the exact resulting `main` state is immediately safe to
deploy to production, using a temporary production-disabled feature flag for incomplete behaviour.
See [Natural Seams and Deployable State](./prs-open-at-delivery-boundaries-natural-seams.md).

**Enforcement disposition for rule 4 — unenforced by decision.** Cross-repository readiness and a
merge opportunity require authenticated operational evidence that a repository-local deterministic
check cannot observe. The merge record plus explicit sibling obligation make the decision auditable.

Rules 1-3 govern **PRs**, so they bind the `*-to-pr` delivery modes only. Rule 4 is mode-neutral and
also binds a permitted `worktree-to-origin-main` or `main-to-origin-main` delivery. Direct-push
plans may retain per-phase local commits and quality gates, but push to `origin/main` only at the
unit's reviewed direct checkpoint; rule 4 forbids holding an otherwise ready repository for sibling
synchronization.

See [PRs Open at Delivery Boundaries — Boundary Test and Rationale](./prs-open-at-delivery-boundaries-boundary-test.md) for the four-part boundary test that determines whether a given phase is a delivery boundary.
