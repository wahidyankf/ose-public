---
description: Covers parity propagation, capacity-controlled cross-repository compute, per-repo delivery shape, and shared-machine safety.
when_to_use: Use when deciding whether repos can run in parallel, how a repo's plan lands as PRs, or before running any destructive-looking git operation.
---

# Propagation Shape and Resource Schedule

The repos form a logical propagation fan-out, not a content-dependency chain: **`ose-public` is the
source of truth**, and the private sibling is its one downstream target. Where a parity set covers more
than two repos, downstream repos may remain independent DAG nodes, but resource-heavy worktree
provisioning, toolchain setup, builds, and validation each enter
[Resource-Aware Development](../../../development/practice/resource-aware-development.md).
Independent compute may overlap only when HIPPO admits its fixed reservations. Dependency,
shared-output, transactional, and documented correctness edges remain sequential.
The private sibling does not participate in the parity loop for content it does not carry.

An explicitly declared local shared-source boundary is serialized across its named repositories;
the checksum-pinned Rhino release is consumed independently and is not an OSE source boundary.

## Delivery Shape Per Repo

Each repo's plan is authored to the `worktree-to-pr` default, and each independent node lands as
its **own PR** — a strict **one branch → one PR → one delivery unit** mapping, opened and merged at
that unit's **delivery boundary** rather than at every phase or batched at the end. The **worktree**
is a coarser, per-repository unit: each repo's plan is capped at one worktree, reused across every
delivery unit it lands in that repo — see
[Plans Organization Convention §Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
Each unit follows one natural cohesive seam, never a LOC or file-count boundary, and its resulting
`main` state is immediately safe to deploy to production. Incomplete behaviour reaches `main` only
as a complete-and-inert increment behind a temporary production-disabled **feature flag**, with
both paths tested and rollout, rollback, and removal recorded. A phase lands unflagged only when it
ships no user-reachable behaviour change and the step names that exemption. See
[plan-planning §Planning Granularity](../plan-planning/planning-granularity-and-one-branch-rule.md#planning-granularity-and-mode-specific-delivery-mapping) for the full rule,
including delivery-boundary PR granularity and the named flag-removal step.

## Shared-Machine Safety

The parity repos share one machine's disk and git object store, and any of them may be a bare repo
driven through worktrees — verify each repo's topology, never assume it. Every git action here is
therefore bound by the **no-destructive-git** rule:
never run an operation that discards a concurrent actor's uncommitted work, and never remove a
worktree or branch you did not create. See
[No Destructive Git Operations](../../../development/workflow/no-destructive-git-operations.md) and
[Worktree and Artifact Cleanup](../../../development/workflow/worktree-and-artifact-cleanup.md).
