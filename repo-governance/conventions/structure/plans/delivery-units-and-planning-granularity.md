---
description: Explains how each independent DAG node maps to its own delivery unit and the resolved mode's integration mechanism.
when_to_use: Use when mapping a plan's DAG nodes onto delivery units and mode-specific integration opportunities.
---

# Delivery Checklists Express a DAG — Delivery Units and Planning Granularity

Continues [Delivery Checklists Express a DAG (HARD RULE)](./delivery-checklists-express-a-dag.md).

**Each independent DAG node that produces changes lands as its own delivery unit.** Under a
`*-to-pr` mode, one branch → one PR → one delivery unit, opened and merged when that boundary is
reached rather than held for a batch merge. Under a permitted direct-push mode, the unit instead
lands at one direct integration checkpoint. A worktree mode provisions **at most one worktree per
repository** and reuses it across units; a main mode uses the primary checkout and provisions none. See
[Worktree Cap](./worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
Incomplete behaviour reaches `main` only as a complete-and-inert increment behind a temporary
production-disabled feature flag, with both paths tested and rollout, rollback, and removal
recorded. Dependent nodes that cannot be separated stay a single delivery unit. Split only at a
natural cohesive seam and keep every artifact required for build, verification, operation,
rollback, and internal consistency together; LOC and file counts never define the boundary.
Exactly how a plan's phases map onto delivery units and PRs — including which
phase inside a unit is the boundary that actually opens one — is stated in
[PRs Open at Delivery Boundaries, Not Every Phase](./prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule).
The remaining planning-granularity rules — the `*-to-pr` 1-PR↔1-branch mapping, the worktree cap,
the temporary flag lifecycle for incomplete behaviour, and how the
`worktree-to-pr` default binds as a design obligation at authoring time — are stated in the
[plan-planning workflow §Planning Granularity](../../../workflows/plan/plan-planning/planning-granularity-and-one-branch-rule.md).
