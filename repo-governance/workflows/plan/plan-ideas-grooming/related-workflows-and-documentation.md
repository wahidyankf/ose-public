---
description: Links to plan-planning, plan-execution, and the conventions this workflow's steps reshape ideas against.
when_to_use: Use when navigating from this workflow to a composed workflow or a governing convention.
---

# Related Workflows and Documentation

## Related Workflows

- [`plan-planning`](../plan-planning.md) — the plan-authoring lifecycle a ripe two-pager
  (post-grooming, already deduplicated and classified) is promoted through, per
  [Promoting a Two-Pager](../../../conventions/structure/plans/promoting-ideas-and-worked-examples.md).
  This workflow converges the idea corpus that promotion later reads from; it never invokes
  `plan-planning` and never itself promotes an idea to a plan.
- [`plan-execution`](../plan-execution.md) — this workflow's `## Execution Mode` (Direct
  Orchestration, no dedicated delegated agent) follows the same orchestration pattern
  `plan-execution` establishes for its own procedural steps.

## Related Documentation

- [Ideas Folder (Two-Pagers) convention](../../../conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers) —
  the two-pager template, file layout, and promotion procedure this workflow reshapes every surviving
  idea against.
- [Plan-docs-only carve-out](../plan-planning/plan-docs-only-carve-out.md) — the
  retired convention that once justified a `main-to-origin-main` default for this workflow, since
  every path it touches sits under `plans/**`; superseded by [Per-Repository Delivery Mode
  Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule),
  which is why this workflow's default is now `worktree-to-pr`.
- [File Naming Convention](../../../conventions/structure/file-naming.md) — the kebab-case rule Step 9's
  rename criteria checks every filename against.
- [Knowledge Capture Convention](../../../development/quality/knowledge-capture.md) — names
  `plans/ideas/` as a candidate durable home for a future-work learning; this workflow is what keeps
  that home converging rather than strictly growing.
